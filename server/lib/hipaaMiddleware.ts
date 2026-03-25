// server/lib/hipaaMiddleware.ts
// HIPAA audit logger, AI rate limiter, helmet config, and TODO hooks

import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
  import { db } from '../db';
import { auditLogs } from '../../shared/schema';

// ---------------------------------------------------------------------------
// 1. HIPAA Audit Middleware
// ---------------------------------------------------------------------------
export function hipaaAuditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startedAt = Date.now();
  res.on('finish', async () => {
        try {
          const segments = req.path.replace(/^\/api\//, '').split('/');
          const resourceType = segments[0] ?? 'unknown';
          const resourceId = segments[1] ? parseInt(segments[1], 10) || null : null;
      const action =
            req.method === 'GET' ? 'view' :
            req.method === 'POST' ? 'create' :
            req.method === 'PUT' ? 'update' :
            req.method === 'PATCH' ? 'update' :
            req.method === 'DELETE' ? 'delete' : 'other';
      const userId = (req as any).user?.id ?? (req as any).session?.userId ?? null;
      const companyId = (req as any).user?.companyId ?? null;
          if (!userId || !companyId) return;
          await db.insert(auditLogs).values({
            companyId,
            userId,
            action,
            resourceType,
            resourceId: resourceId ?? undefined,
            details: `${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - startedAt}ms)`,
            ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
                       ?? req.socket?.remoteAddress ?? null,
            userAgent: req.headers['user-agent']?.substring(0, 500) ?? null,
    });
} catch (err) {
      console.error('[HIPAA audit] failed to write audit log:', err);
}
});
  next();
}

// ---------------------------------------------------------------------------
// 2. AI Rate Limiter – stricter limit on /api/ai/* routes
// TODO: tune AI_RATE_MAX to match your Anthropic tier
// ---------------------------------------------------------------------------
const AI_RATE_WINDOW_MS = 60 * 1000; // 1 minute
const AI_RATE_MAX = 20;              // 20 AI calls per minute per IP

    export const aiRateLimiter = rateLimit({
  windowMs: AI_RATE_WINDOW_MS,
  max: AI_RATE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI rate limit exceeded. Please wait before making more AI requests.' },
      skip: (_req) => false, // TODO: whitelist internal IPs if needed
});

// ---------------------------------------------------------------------------
// 3. Supplemental Helmet options (base config lives in server/index.ts)
// ---------------------------------------------------------------------------
export const helmetOptions = {
      frameguard: { action: 'deny' as const },
  hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
};

// ---------------------------------------------------------------------------
// TODO hooks
// ---------------------------------------------------------------------------

/** TODO: send audit event to external SIEM (Splunk, Datadog, etc.) */
export async function sendToSiem(_event: Record<string, unknown>): Promise<void> {
      // TODO: implement external SIEM integration
}

/** TODO: redact PII in log lines before stdout/CloudWatch */
export function redactLogLine(line: string): string {
  // TODO: apply PII scrubbing patterns
      return line;
    }
