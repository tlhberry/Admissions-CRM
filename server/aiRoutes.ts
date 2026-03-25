import type { Express, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import rateLimit from 'express-rate-limit';
import { storage } from './storage';
import { isAuthenticated } from './replitAuth';
import { db } from './db';
import { deidentifyInquiry } from './lib/deidentify';
import {
  aiLogs,
  aiReportCache,
  centerConfig,
  inquiries,
  referralAccounts,
  activityLogs,
} from '../shared/schema';
import { eq, gte, lte, and, desc, sql as drizzleSql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ANTHROPIC_MODEL = 'claude-sonnet-4-5';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[aiRoutes] WARNING: ANTHROPIC_API_KEY not set. AI endpoints will return 503.');
}

// ---------------------------------------------------------------------------
// Shared Anthropic client
// ---------------------------------------------------------------------------
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'missing' });

// ---------------------------------------------------------------------------
// Per-user rate limiter: 60 requests / hour
// ---------------------------------------------------------------------------
const aiUserRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  keyGenerator: (req: any) =>
    req.session?.userId ?? req.user?.claims?.sub ?? req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'AI rate limit exceeded. Max 60 requests per hour.' },
});

// ---------------------------------------------------------------------------
// AWS helpers
// ---------------------------------------------------------------------------
const textractClient = new TextractClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });
const S3_BUCKET = process.env.AWS_S3_BUCKET ?? process.env.S3_BUCKET ?? '';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function extractTextViaTextract(buffer: Buffer): Promise<string> {
  const result = await textractClient.send(
    new DetectDocumentTextCommand({ Document: { Bytes: buffer } })
  );
  return (
    result.Blocks?.filter((b) => b.BlockType === 'LINE')
      .map((b) => b.Text ?? '')
      .join('\n') ?? ''
  );
}

async function uploadToS3(buffer: Buffer, key: string, mimeType: string): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: buffer, ContentType: mimeType })
  );
  return key;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function safeParseJSON<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()) as T; }
  catch { return fallback; }
}

function hashObject(obj: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 64);
}

// ---------------------------------------------------------------------------
// Get center name from center_config (with fallback)
// ---------------------------------------------------------------------------
async function getCenterName(): Promise<string> {
  try {
    const rows = await db.select().from(centerConfig).limit(1);
    return rows[0]?.centerName ?? 'AdmitSimple';
  } catch {
    return 'AdmitSimple';
  }
}

// ---------------------------------------------------------------------------
// AI logging helper
// ---------------------------------------------------------------------------
async function logAiCall(opts: {
  userId: string | null;
  route: string;
  promptTokens: number;
  completionTokens: number;
  success: boolean;
  errorMessage?: string;
}): Promise<void> {
  try {
    await db.insert(aiLogs).values({
      userId: opts.userId,
      route: opts.route,
      promptTokens: opts.promptTokens,
      completionTokens: opts.completionTokens,
      success: opts.success ? 'yes' : 'no',
      errorMessage: opts.errorMessage ?? null,
    });
  } catch (err) {
    console.error('[aiRoutes] Failed to insert ai_logs:', err);
  }
}

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------
function handleAiError(error: unknown, res: Response, context: string, userId: string | null = null): Response {
  console.error(`[aiRoutes] ${context} error:`, error);
  const msg = error instanceof Error ? error.message : String(error);
  logAiCall({ userId, route: context, promptTokens: 0, completionTokens: 0, success: false, errorMessage: msg.slice(0, 500) });
  if (msg.includes('ANTHROPIC_API_KEY') || msg.includes('missing')) {
    return res.status(503).json({ success: false, error: 'AI service not configured. Set ANTHROPIC_API_KEY.' });
  }
  if (error instanceof Anthropic.APIError) {
    return res.status(502).json({ success: false, error: `Anthropic API error (${error.status}): ${error.message}` });
  }
  return res.status(500).json({ success: false, error: `AI feature failed: ${context}` });
}

// ---------------------------------------------------------------------------
// Extract userId from request (supports both session and OIDC auth)
// ---------------------------------------------------------------------------
function getUserId(req: any): string {
  return req.session?.userId ?? req.user?.claims?.sub ?? 'unknown';
}

// ===========================================================================
// ROUTE REGISTRATION
// ===========================================================================
export function registerAiRoutes(app: Express): void {

  // Apply per-user rate limit to all /api/ai/* routes
  app.use('/api/ai/', aiUserRateLimiter);

  // ── ROUTE 10: GET /api/ai/status (no auth, health check) ─────────────────
  app.get('/api/ai/status', (_req: Request, res: Response) => {
    const configured = !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'missing');
    return res.json({
      ok: configured,
      model: ANTHROPIC_MODEL,
      message: configured
        ? 'Anthropic API key is configured.'
        : 'ANTHROPIC_API_KEY is missing.',
      timestamp: new Date().toISOString(),
    });
  });

  // ── ROUTE 1: POST /api/ai/parse-inquiry (STREAMING) ──────────────────────
  // Accepts text or file upload; extracts structured fields via Claude.
  // File path: Textract -> Claude -> JSON. Text path: Claude directly.
  app.post('/api/ai/parse-inquiry', isAuthenticated, upload.single('file'), async (req: any, res: Response) => {
    const userId = getUserId(req);
    const centerName = await getCenterName();
    try {
      let rawText = '';
      if (req.file) {
        rawText = await extractTextViaTextract(req.file.buffer);
      } else if (req.body?.text) {
        rawText = String(req.body.text).slice(0, 8000);
      } else {
        return res.status(400).json({ success: false, error: 'Provide a "text" field or upload a file.' });
      }

      const systemPrompt = `You are an AI assistant for ${centerName} admissions team. Extract structured intake fields from the raw text. Return ONLY valid JSON.`;
      const userPrompt = `Extract the following fields (use empty string if not found) from this text:
{
  "name": "",
  "date_of_birth": "",
  "phone": "",
  "email": "",
  "insurance_provider": "",
  "insurance_member_id": "",
  "group_number": "",
  "substance_or_issue": "",
  "level_of_care": "",
  "presenting_problems": "",
  "notes": ""
}

Raw text:
${rawText}`;

      // Set SSE headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no');

      let fullText = '';
      let promptTokens = 0;
      let completionTokens = 0;

      const stream = await anthropic.messages.stream({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullText += event.delta.text;
          res.write(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`);
        }
        if (event.type === 'message_delta' && event.usage) {
          completionTokens = event.usage.output_tokens ?? 0;
        }
        if (event.type === 'message_start' && event.message.usage) {
          promptTokens = event.message.usage.input_tokens ?? 0;
        }
      }

      const parsed = safeParseJSON(fullText, {});
      res.write(`data: ${JSON.stringify({ done: true, data: parsed })}\n\n`);
      res.end();

      await logAiCall({ userId, route: '/api/ai/parse-inquiry', promptTokens, completionTokens, success: true });
    } catch (error) {
      await logAiCall({ userId, route: '/api/ai/parse-inquiry', promptTokens: 0, completionTokens: 0, success: false, errorMessage: String(error) });
      if (!res.headersSent) return handleAiError(error, res, 'parse-inquiry', userId);
      res.write(`data: ${JSON.stringify({ error: 'Parse failed' })}\n\n`);
      res.end();
    }
  });

  // ── ROUTE 2: POST /api/ai/search ──────────────────────────────────────────
  // Natural language -> structured Drizzle-compatible filters (no raw SQL from Claude)
  app.post('/api/ai/search', isAuthenticated, async (req: any, res: Response) => {
    const userId = getUserId(req);
    const centerName = await getCenterName();
    try {
      const { query } = req.body as { query?: string };
      if (!query?.trim()) return res.status(400).json({ success: false, error: 'Missing query.' });

      const systemPrompt = `You are an AI assistant for ${centerName} admissions team. Convert natural language search queries into structured JSON filters.`;
      const userPrompt = `Convert this search query into a JSON filter object for a behavioral health CRM.

Available filter keys:
- stage: one of inquiry|vob_pending|quote_client|pre_assessment|scheduled|admitted|non_viable|lost
- levelOfCare: one of detox|residential|php|iop|outpatient
- insuranceProvider: string (partial match)
- isViable: yes|no
- referralOrigin: account|online
- createdAfterDays: number (filter records created in last N days)
- searchText: string (name/phone/email substring)

Return ONLY valid JSON like: {"filters": {...}, "description": "human readable summary"}

Query: "${query.trim()}"`;

      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const promptTokens = response.usage?.input_tokens ?? 0;
      const completionTokens = response.usage?.output_tokens ?? 0;
      const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
      const parsed = safeParseJSON<{ filters: Record<string, unknown>; description: string }>(
        rawText, { filters: {}, description: query }
      );

      // Build safe Drizzle conditions from the parsed filters (never use raw SQL from Claude)
      const conditions: any[] = [];
      const f = parsed.filters ?? {};

      if (f.stage) conditions.push(eq(inquiries.stage, String(f.stage)));
      if (f.levelOfCare) conditions.push(eq(inquiries.levelOfCare, String(f.levelOfCare)));
      if (f.isViable) conditions.push(eq(inquiries.isViable, String(f.isViable)));
      if (f.referralOrigin) conditions.push(eq(inquiries.referralOrigin, String(f.referralOrigin)));
      if (f.createdAfterDays) {
        const d = new Date();
        d.setDate(d.getDate() - Number(f.createdAfterDays));
        conditions.push(gte(inquiries.createdAt, d));
      }

      // Execute query with only safe Drizzle ORM conditions
      const companyId = (await storage.getUser(userId))?.companyId;
      if (!companyId) return res.status(403).json({ success: false, error: 'No company context.' });

      const whereClause = conditions.length > 0
        ? and(eq(inquiries.companyId, companyId), ...conditions)
        : eq(inquiries.companyId, companyId);

      const results = await db
        .select()
        .from(inquiries)
        .where(whereClause)
        .orderBy(desc(inquiries.createdAt))
        .limit(50);

      await logAiCall({ userId, route: '/api/ai/search', promptTokens, completionTokens, success: true });
      return res.json({ success: true, data: { filters: f, description: parsed.description, results } });
    } catch (error) {
      return handleAiError(error, res, '/api/ai/search', userId);
    }
  });

  // ── ROUTE 3: GET /api/ai/summary/:inquiryId (STREAMING via SSE) ───────────
  // Fetches inquiry, de-identifies, streams summary back over SSE.
  app.get('/api/ai/summary/:inquiryId', isAuthenticated, async (req: any, res: Response) => {
    const userId = getUserId(req);
    const centerName = await getCenterName();
    try {
      const inquiryId = parseInt(req.params.inquiryId, 10);
      if (isNaN(inquiryId)) return res.status(400).json({ success: false, error: 'Invalid inquiryId.' });

      const inquiry = await storage.getInquiry(inquiryId);
      if (!inquiry) return res.status(404).json({ success: false, error: 'Inquiry not found.' });

      // De-identify before sending to AI
      const safe = deidentifyInquiry(inquiry);

      const systemPrompt = `You are an AI assistant for ${centerName} admissions team. Write concise, professional clinical summaries.`;
      const userPrompt = `Write a 3-5 sentence clinical admissions summary for this de-identified inquiry. Focus on: level of care needed, insurance status, clinical appropriateness, and next recommended steps. Be factual and professional.

De-identified inquiry data:
${JSON.stringify(safe, null, 2)}`;

      // SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      let promptTokens = 0;
      let completionTokens = 0;

      const stream = await anthropic.messages.stream({
        model: ANTHROPIC_MODEL,
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`);
        }
        if (event.type === 'message_start' && event.message.usage) {
          promptTokens = event.message.usage.input_tokens ?? 0;
        }
        if (event.type === 'message_delta' && event.usage) {
          completionTokens = event.usage.output_tokens ?? 0;
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();

      await logAiCall({ userId, route: '/api/ai/summary', promptTokens, completionTokens, success: true });
    } catch (error) {
      await logAiCall({ userId, route: '/api/ai/summary', promptTokens: 0, completionTokens: 0, success: false, errorMessage: String(error) });
      if (!res.headersSent) return handleAiError(error, res, '/api/ai/summary', userId);
      res.write(`data: ${JSON.stringify({ error: 'Summary failed' })}\n\n`);
      res.end();
    }
  });

  // ── ROUTE 4: GET /api/ai/insights ─────────────────────────────────────────
  // Aggregations + cached Claude insights
  app.get('/api/ai/insights', isAuthenticated, async (req: any, res: Response) => {
    const userId = getUserId(req);
    const centerName = await getCenterName();
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const companyId = (await storage.getUser(userId))?.companyId;
      if (!companyId) return res.status(403).json({ success: false, error: 'No company context.' });

      // Build cache key
      const params = { companyId, startDate, endDate };
      const paramsHash = hashObject(params);

      // Check cache first
      const cached = await db.select().from(aiReportCache)
        .where(and(
          eq(aiReportCache.reportType, 'insights'),
          eq(aiReportCache.parametersHash, paramsHash),
          gte(aiReportCache.expiresAt, new Date())
        ))
        .limit(1);

      if (cached.length > 0) {
        return res.json({ success: true, data: safeParseJSON(cached[0].result, {}), cached: true });
      }

      // Build date conditions
      const conditions: any[] = [eq(inquiries.companyId, companyId)];
      if (startDate) conditions.push(gte(inquiries.createdAt, new Date(startDate)));
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(inquiries.createdAt, end));
      }

      // Aggregate metrics
      const allInquiries = await db.select().from(inquiries).where(and(...conditions));
      const total = allInquiries.length;
      const admitted = allInquiries.filter(i => i.stage === 'admitted').length;
      const nonViable = allInquiries.filter(i => i.stage === 'non_viable').length;
      const lost = allInquiries.filter(i => i.stage === 'lost').length;
      const conversionRate = total > 0 ? ((admitted / total) * 100).toFixed(1) : '0';

      const stageBreakdown = allInquiries.reduce((acc: Record<string, number>, i) => {
        acc[i.stage] = (acc[i.stage] ?? 0) + 1;
        return acc;
      }, {});

      const insuranceBreakdown = allInquiries.reduce((acc: Record<string, number>, i) => {
        const ins = i.insuranceProvider ?? 'Unknown';
        acc[ins] = (acc[ins] ?? 0) + 1;
        return acc;
      }, {});

      const locBreakdown = allInquiries.reduce((acc: Record<string, number>, i) => {
        const loc = i.levelOfCare ?? 'Not specified';
        acc[loc] = (acc[loc] ?? 0) + 1;
        return acc;
      }, {});

      const metricsText = `
Total inquiries: ${total}
Admitted: ${admitted} (${conversionRate}% conversion)
Non-viable: ${nonViable}
Lost: ${lost}
Stage breakdown: ${JSON.stringify(stageBreakdown)}
Insurance breakdown: ${JSON.stringify(insuranceBreakdown)}
Level of care breakdown: ${JSON.stringify(locBreakdown)}
Date range: ${startDate ?? 'all time'} to ${endDate ?? 'now'}
`;

      const systemPrompt = `You are an AI assistant for ${centerName} admissions team. Analyze admissions metrics and provide actionable insights.`;
      const userPrompt = `Based on these aggregated (de-identified) admissions metrics, provide 4-6 bullet-point insights and 2-3 recommended actions. Focus on conversion opportunities, pipeline bottlenecks, and insurance trends.

Metrics:
${metricsText}`;

      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const insightText = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const promptTokens = response.usage?.input_tokens ?? 0;
      const completionTokens = response.usage?.output_tokens ?? 0;

      const result = {
        metrics: { total, admitted, nonViable, lost, conversionRate, stageBreakdown, insuranceBreakdown, locBreakdown },
        insights: insightText,
        dateRange: { startDate, endDate },
      };

      // Cache for 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.insert(aiReportCache).values({
        reportType: 'insights',
        parametersHash: paramsHash,
        result: JSON.stringify(result),
        expiresAt,
      });

      await logAiCall({ userId, route: '/api/ai/insights', promptTokens, completionTokens, success: true });
      return res.json({ success: true, data: result, cached: false });
    } catch (error) {
      return handleAiError(error, res, '/api/ai/insights', userId);
    }
  });

  // ── ROUTE 5: POST /api/ai/report ──────────────────────────────────────────
  // Natural language -> validated SELECT query -> executed via Drizzle
  app.post('/api/ai/report', isAuthenticated, async (req: any, res: Response) => {
    const userId = getUserId(req);
    const centerName = await getCenterName();
    try {
      const { query, startDate, endDate } = req.body as { query?: string; startDate?: string; endDate?: string };
      if (!query?.trim()) return res.status(400).json({ success: false, error: 'Missing query.' });

      const companyId = (await storage.getUser(userId))?.companyId;
      if (!companyId) return res.status(403).json({ success: false, error: 'No company context.' });

      const systemPrompt = `You are an AI assistant for ${centerName} admissions team. Generate safe, read-only database report queries.`;
      const userPrompt = `The user wants a report. Convert their request into a JSON specification with safe Drizzle-compatible filter parameters.

Available tables: inquiries, referral_accounts, activity_logs
Available inquiry fields: stage, levelOfCare, insuranceProvider, isViable, referralOrigin, createdAt

Return ONLY JSON like:
{
  "reportTitle": "string",
  "table": "inquiries",
  "filters": { "stage": "optional", "levelOfCare": "optional" },
  "groupBy": "stage|levelOfCare|insuranceProvider|referralOrigin|null",
  "description": "what this report shows"
}

User request: "${query.trim()}"
Date range: ${startDate ?? 'all time'} to ${endDate ?? 'now'}`;

      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const promptTokens = response.usage?.input_tokens ?? 0;
      const completionTokens = response.usage?.output_tokens ?? 0;
      const rawSpec = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
      const spec = safeParseJSON<{
        reportTitle?: string;
        table?: string;
        filters?: Record<string, string>;
        groupBy?: string;
        description?: string;
      }>(rawSpec, {});

      // SAFETY: only allow inquiries table and validate filters via Drizzle ORM (never raw SQL)
      const conditions: any[] = [eq(inquiries.companyId, companyId)];
      if (startDate) conditions.push(gte(inquiries.createdAt, new Date(startDate)));
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(inquiries.createdAt, end));
      }
      if (spec.filters?.stage) conditions.push(eq(inquiries.stage, spec.filters.stage));
      if (spec.filters?.levelOfCare) conditions.push(eq(inquiries.levelOfCare, spec.filters.levelOfCare));
      if (spec.filters?.isViable) conditions.push(eq(inquiries.isViable, spec.filters.isViable));

      const rows = await db.select().from(inquiries).where(and(...conditions)).orderBy(desc(inquiries.createdAt)).limit(200);

      // Group results if requested
      let grouped: Record<string, number> | null = null;
      const groupByField = spec.groupBy as keyof typeof rows[0] | null;
      if (groupByField && groupByField in (rows[0] ?? {})) {
        grouped = rows.reduce((acc: Record<string, number>, row: any) => {
          const key = String(row[groupByField] ?? 'Unknown');
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});
      }

      await logAiCall({ userId, route: '/api/ai/report', promptTokens, completionTokens, success: true });
      return res.json({
        success: true,
        data: {
          title: spec.reportTitle ?? 'Report',
          description: spec.description,
          totalRows: rows.length,
          grouped,
          rows: rows.slice(0, 100), // limit to 100 rows in response
        },
      });
    } catch (error) {
      return handleAiError(error, res, '/api/ai/report', userId);
    }
  });

  // ── ROUTE 6: POST /api/ai/admissions-report/:inquiryId (STREAMING) ────────
  // De-identify + generate PDF report (insurance/clinical/recommendation) -> S3
  app.post('/api/ai/admissions-report/:inquiryId', isAuthenticated, async (req: any, res: Response) => {
    const userId = getUserId(req);
    const centerName = await getCenterName();
    try {
      const inquiryId = parseInt(req.params.inquiryId, 10);
      if (isNaN(inquiryId)) return res.status(400).json({ success: false, error: 'Invalid inquiryId.' });

      const inquiry = await storage.getInquiry(inquiryId);
      if (!inquiry) return res.status(404).json({ success: false, error: 'Inquiry not found.' });

      // De-identify before sending to AI
      const safe = deidentifyInquiry(inquiry);

      const systemPrompt = `You are an AI assistant for ${centerName} admissions team. Generate detailed clinical admissions reports.`;
      const userPrompt = `Generate a comprehensive admissions report with three sections for this de-identified inquiry:

1. INSURANCE SUMMARY: Coverage status, benefits available, deductible/OOP information, pre-auth requirements
2. CLINICAL ASSESSMENT: Presenting problems, appropriate level of care, clinical considerations
3. RECOMMENDATIONS: Recommended action items, next steps, priority level (urgent/standard/low)

Format with clear section headers. Be professional and concise.

De-identified inquiry data:
${JSON.stringify(safe, null, 2)}`;

      // SSE headers for streaming the generation progress
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      res.write(`data: ${JSON.stringify({ status: 'generating' })}\n\n`);

      let fullReport = '';
      let promptTokens = 0;
      let completionTokens = 0;

      const stream = await anthropic.messages.stream({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullReport += event.delta.text;
          res.write(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`);
        }
        if (event.type === 'message_start' && event.message.usage) {
          promptTokens = event.message.usage.input_tokens ?? 0;
        }
        if (event.type === 'message_delta' && event.usage) {
          completionTokens = event.usage.output_tokens ?? 0;
        }
      }

      // Generate PDF
      res.write(`data: ${JSON.stringify({ status: 'generating_pdf' })}\n\n`);

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(18).text(`${centerName} — Admissions Report`, { align: 'center' });
        doc.fontSize(10).text(`Inquiry ID: [REDACTED] | Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Report content
        doc.fontSize(11).text(fullReport, { lineGap: 4 });

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).text('This report was generated by AI and contains de-identified information. For internal use only.', {
          align: 'center', color: '#666666'
        });

        doc.end();
      });

      // Upload to S3
      let s3Key = '';
      let pdfUrl = '';
      if (S3_BUCKET) {
        s3Key = `admissions-reports/inquiry-${inquiryId}-${uuidv4()}.pdf`;
        await uploadToS3(pdfBuffer, s3Key, 'application/pdf');
        pdfUrl = `s3://${S3_BUCKET}/${s3Key}`;
      }

      res.write(`data: ${JSON.stringify({ done: true, pdfUrl, s3Key })}\n\n`);
      res.end();

      await logAiCall({ userId, route: '/api/ai/admissions-report', promptTokens, completionTokens, success: true });
    } catch (error) {
      await logAiCall({ userId, route: '/api/ai/admissions-report', promptTokens: 0, completionTokens: 0, success: false, errorMessage: String(error) });
      if (!res.headersSent) return handleAiError(error, res, '/api/ai/admissions-report', userId);
      res.write(`data: ${JSON.stringify({ error: 'Report generation failed' })}\n\n`);
      res.end();
    }
  });

  // ── ROUTE 7: GET /api/ai/referral-insights ────────────────────────────────
  app.get('/api/ai/referral-insights', isAuthenticated, async (req: any, res: Response) => {
    const userId = getUserId(req);
    const centerName = await getCenterName();
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const companyId = (await storage.getUser(userId))?.companyId;
      if (!companyId) return res.status(403).json({ success: false, error: 'No company context.' });

      const paramsHash = hashObject({ companyId, startDate, endDate, type: 'referral-insights' });
      const cached = await db.select().from(aiReportCache)
        .where(and(eq(aiReportCache.reportType, 'referral-insights'), eq(aiReportCache.parametersHash, paramsHash), gte(aiReportCache.expiresAt, new Date())))
        .limit(1);
      if (cached.length > 0) return res.json({ success: true, data: safeParseJSON(cached[0].result, {}), cached: true });

      // Fetch referral accounts and their inquiry counts
      const accounts = await db.select().from(referralAccounts).where(eq(referralAccounts.companyId, companyId));

      // Fetch inquiries with referral account IDs
      const conditions: any[] = [eq(inquiries.companyId, companyId)];
      if (startDate) conditions.push(gte(inquiries.createdAt, new Date(startDate)));
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); conditions.push(lte(inquiries.createdAt, e)); }

      const inqs = await db.select().from(inquiries).where(and(...conditions));

      // Aggregate by referral account
      const accountMap: Record<string, { name: string; total: number; admitted: number }> = {};
      for (const acc of accounts) {
        accountMap[acc.id] = { name: acc.name, total: 0, admitted: 0 };
      }
      for (const inq of inqs) {
        if (inq.referralAccountId && accountMap[inq.referralAccountId]) {
          accountMap[inq.referralAccountId].total++;
          if (inq.stage === 'admitted') accountMap[inq.referralAccountId].admitted++;
        }
      }

      const topAccounts = Object.values(accountMap)
        .filter(a => a.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      const onlineSourceBreakdown = inqs.reduce((acc: Record<string, number>, i) => {
        if (i.referralOrigin === 'online') {
          const src = i.onlineSource ?? 'unknown';
          acc[src] = (acc[src] ?? 0) + 1;
        }
        return acc;
      }, {});

      const systemPrompt = `You are an AI assistant for ${centerName} admissions team. Analyze referral data and provide insights.`;
      const userPrompt = `Analyze these referral metrics and provide 3-5 insights about referral source performance and recommendations for BD strategy.

Top referral accounts (de-identified count data):
${JSON.stringify(topAccounts.map(a => ({ name: a.name, inquiries: a.total, admitted: a.admitted })), null, 2)}

Online source breakdown:
${JSON.stringify(onlineSourceBreakdown, null, 2)}

Total inquiries analyzed: ${inqs.length}`;

      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL, max_tokens: 768,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const insightText = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const result = { topAccounts, onlineSourceBreakdown, insights: insightText, totalInquiries: inqs.length };

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.insert(aiReportCache).values({ reportType: 'referral-insights', parametersHash: paramsHash, result: JSON.stringify(result), expiresAt });
      await logAiCall({ userId, route: '/api/ai/referral-insights', promptTokens: response.usage?.input_tokens ?? 0, completionTokens: response.usage?.output_tokens ?? 0, success: true });
      return res.json({ success: true, data: result, cached: false });
    } catch (error) {
      return handleAiError(error, res, '/api/ai/referral-insights', userId);
    }
  });

  // ── ROUTE 8: GET /api/ai/pipeline-suggestions ─────────────────────────────
  app.get('/api/ai/pipeline-suggestions', isAuthenticated, async (req: any, res: Response) => {
    const userId = getUserId(req);
    const centerName = await getCenterName();
    try {
      const companyId = (await storage.getUser(userId))?.companyId;
      if (!companyId) return res.status(403).json({ success: false, error: 'No company context.' });

      const paramsHash = hashObject({ companyId, type: 'pipeline-suggestions', date: new Date().toDateString() });
      const cached = await db.select().from(aiReportCache)
        .where(and(eq(aiReportCache.reportType, 'pipeline-suggestions'), eq(aiReportCache.parametersHash, paramsHash), gte(aiReportCache.expiresAt, new Date())))
        .limit(1);
      if (cached.length > 0) return res.json({ success: true, data: safeParseJSON(cached[0].result, {}), cached: true });

      // Get current pipeline snapshot (de-identified - just counts and stages)
      const pipelineInqs = await db.select().from(inquiries).where(eq(inquiries.companyId, companyId));

      const stageAges: Record<string, number[]> = {};
      const now = Date.now();
      for (const inq of pipelineInqs) {
        const stage = inq.stage;
        const ageHours = inq.createdAt ? (now - new Date(inq.createdAt).getTime()) / 3600000 : 0;
        if (!stageAges[stage]) stageAges[stage] = [];
        stageAges[stage].push(ageHours);
      }

      const stageStats = Object.entries(stageAges).map(([stage, ages]) => ({
        stage,
        count: ages.length,
        avgAgeHours: Math.round(ages.reduce((a, b) => a + b, 0) / ages.length),
        stale: ages.filter(h => h > 72).length, // stale = >72 hours
      }));

      const viableCount = pipelineInqs.filter(i => i.isViable === 'yes').length;
      const withInsuranceCount = pipelineInqs.filter(i => i.insuranceProvider).length;

      const systemPrompt = `You are an AI assistant for ${centerName} admissions team. Analyze the admissions pipeline and provide actionable suggestions.`;
      const userPrompt = `Based on this de-identified pipeline snapshot, provide 4-6 specific, actionable suggestions to improve conversion rates and pipeline velocity.

Pipeline statistics:
${JSON.stringify(stageStats, null, 2)}

Additional context:
- Total active inquiries: ${pipelineInqs.length}
- Viable inquiries: ${viableCount}
- Inquiries with insurance on file: ${withInsuranceCount}

Focus on: stale inquiries, stage bottlenecks, follow-up timing, and quick wins.`;

      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL, max_tokens: 768,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const suggestions = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const result = { stageStats, totalInquiries: pipelineInqs.length, viableCount, suggestions };

      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4-hour cache
      await db.insert(aiReportCache).values({ reportType: 'pipeline-suggestions', parametersHash: paramsHash, result: JSON.stringify(result), expiresAt });
      await logAiCall({ userId, route: '/api/ai/pipeline-suggestions', promptTokens: response.usage?.input_tokens ?? 0, completionTokens: response.usage?.output_tokens ?? 0, success: true });
      return res.json({ success: true, data: result, cached: false });
    } catch (error) {
      return handleAiError(error, res, '/api/ai/pipeline-suggestions', userId);
    }
  });

  // ── ROUTE 9: POST /api/ai/call-intake (stub for voice/call processing) ────
  app.post('/api/ai/call-intake', isAuthenticated, async (req: any, res: Response) => {
    const userId = getUserId(req);
    // TODO: Integrate with call recording/transcription pipeline
    // When implemented, this route will:
    // 1. Accept a call recording URL or transcript
    // 2. Use Whisper/Deepgram to transcribe if needed
    // 3. De-identify the transcript with deidentifyInquiry
    // 4. Extract structured intake data via Claude
    // 5. Auto-create or update an inquiry record
    await logAiCall({ userId, route: '/api/ai/call-intake', promptTokens: 0, completionTokens: 0, success: true });
    return res.json({
      success: true,
      data: null,
      message: 'Call intake AI processing is not yet implemented. This endpoint is reserved for future voice pipeline integration.',
    });
  });

  // ── Legacy support routes (kept from original aiRoutes.ts) ────────────────
  app.post('/api/support/message', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const { message } = req.body as { message?: string };
      if (!message) return res.status(400).json({ message: 'Missing message field.' });
      const company = user?.companyId ? await storage.getCompany(user.companyId) : null;
      await storage.createContactSubmission({ email: user?.email ?? '', phone: null, companyName: company?.name ?? null, message: message.trim(), source: 'in_app_support', userId, status: 'new' });
      return res.status(201).json({ message: 'Support request submitted.' });
    } catch (error) { console.error('[aiRoutes] support/message error:', error); return res.status(500).json({ message: 'Failed to submit.' }); }
  });

  app.post('/api/support/bug', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const { description, steps, severity } = req.body as { description?: string; steps?: string; severity?: string };
      if (!description) return res.status(400).json({ message: 'Missing description.' });
      const company = user?.companyId ? await storage.getCompany(user.companyId) : null;
      const msg = ['[BUG REPORT]', 'Description: ' + description.trim(), steps ? 'Steps: ' + steps.trim() : null, severity ? 'Severity: ' + severity : null].filter(Boolean).join('\n');
      await storage.createContactSubmission({ email: user?.email ?? '', phone: null, companyName: company?.name ?? null, message: msg, source: 'in_app_support', userId, status: 'new' });
      return res.status(201).json({ message: 'Bug report submitted.' });
    } catch (error) { console.error('[aiRoutes] support/bug error:', error); return res.status(500).json({ message: 'Failed to submit.' }); }
  });

  app.post('/api/support/idea', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const { title, description } = req.body as { title?: string; description?: string };
      if (!description) return res.status(400).json({ message: 'Missing description.' });
      const company = user?.companyId ? await storage.getCompany(user.companyId) : null;
      const msg = ['[FEATURE IDEA]', title ? 'Title: ' + title.trim() : null, 'Description: ' + description.trim()].filter(Boolean).join('\n');
      await storage.createContactSubmission({ email: user?.email ?? '', phone: null, companyName: company?.name ?? null, message: msg, source: 'in_app_support', userId, status: 'new' });
      return res.status(201).json({ message: 'Feature idea submitted.' });
    } catch (error) { console.error('[aiRoutes] support/idea error:', error); return res.status(500).json({ message: 'Failed to submit.' }); }
  });

} // end registerAiRoutes
