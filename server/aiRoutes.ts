import type { Express, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';
import { isAuthenticated } from './replitAuth';

// ---------------------------------------------------------------------------
// Shared Anthropic client + helper (runAI / callAnthropic are the same thing)
// ---------------------------------------------------------------------------

const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
});

const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

async function runAI(prompt: string): Promise<string> {
      const res = await anthropic.messages.create({
              model: ANTHROPIC_MODEL,
              max_tokens: 4096,
              messages: [{ role: 'user', content: prompt }],
      });
      return res.content[0]?.type === 'text' ? res.content[0].text : '';
}

// Legacy alias kept so nothing else breaks
const callAnthropic = runAI;

// ---------------------------------------------------------------------------
// AWS helpers (Textract + S3) — retained for parse-inquiry file upload flow
// ---------------------------------------------------------------------------

const textractClient = new TextractClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });
const S3_BUCKET = process.env.S3_BUCKET ?? '';
const upload = multer({ storage: multer.memoryStorage() });

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

async function uploadScreenshotToS3(buffer: Buffer, mimeType: string): Promise<void> {
      await s3Client.send(
              new PutObjectCommand({
                        Bucket: S3_BUCKET,
                        Key: `screenshots/${uuidv4()}`,
                        Body: buffer,
                        ContentType: mimeType,
              })
            );
}

// ---------------------------------------------------------------------------
// JSON parse helper — strips markdown code fences if present
// ---------------------------------------------------------------------------

function safeParseJSON<T>(raw: string, fallback: T): T {
      try {
              return JSON.parse(raw.replace(/```json|```/g, '').trim()) as T;
      } catch {
              return fallback;
      }
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerAiRoutes(app: Express): void {

  // ── POST /api/ai/summary ────────────────────────────────────────────────
  // Input : { inquiry: object }
  // Output: { success: true, data: string }
  app.post('/api/ai/summary', isAuthenticated, async (req: any, res: Response) => {
          try {
                    const { inquiry } = req.body as { inquiry?: Record<string, unknown> };
                    if (!inquiry) {
                                return res.status(400).json({ success: false, error: 'Missing inquiry field.' });
                    }

            const prompt = `You are an admissions coordinator at a behavioral health facility.
            Given the following inquiry data, write a concise 2-4 sentence plain-English summary
            suitable for a clinician reviewing the lead. Be factual, professional, and highlight
            the most clinically relevant details (substance, level of care, insurance, urgency).

            Inquiry data:
            ${JSON.stringify(inquiry, null, 2)}

            Return ONLY the summary text. No JSON, no bullet points, no headers.`;

            const result = await runAI(prompt);
                    return res.json({ success: true, data: result.trim() });
          } catch (error: any) {
                    console.error('ai/summary error:', error);
                    return res.status(500).json({ success: false, error: 'Failed to generate summary.' });
          }
  });

  // ── POST /api/ai/parse ──────────────────────────────────────────────────
  // Input : { text: string }  OR  multipart file upload
  // Output: { success: true, data: { name, date_of_birth, phone, email,
  //           insurance_provider, insurance_member_id, group_number,
  //           substance_or_issue, level_of_care, notes } }
  app.post('/api/ai/parse', isAuthenticated, upload.single('file'), async (req: any, res: Response) => {
          try {
                    let rawText = '';

            if (req.file) {
                        await uploadScreenshotToS3(req.file.buffer, req.file.mimetype);
                        rawText = await extractTextViaTextract(req.file.buffer);
            } else if (req.body?.text) {
                        rawText = req.body.text as string;
            } else {
                        return res.status(400).json({ success: false, error: 'Provide a file or a text field.' });
            }

            const emptyFields = {
                        name: '',
                        date_of_birth: '',
                        phone: '',
                        email: '',
                        insurance_provider: '',
                        insurance_member_id: '',
                        group_number: '',
                        substance_or_issue: '',
                        level_of_care: '',
                        notes: '',
            };

            const prompt = `Extract structured referral / intake fields from the raw call notes or document text below.
            Return ONLY a valid JSON object — no markdown, no explanation.

            Required fields (use empty string if not found):
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
                                "notes": ""
                                }

                                Raw text:
                                ${rawText}`;

            const raw = await runAI(prompt);
                    const fields = safeParseJSON(raw, emptyFields);

            return res.json({ success: true, data: fields });
          } catch (error: any) {
                    console.error('ai/parse error:', error);
                    return res.status(500).json({ success: false, error: 'Failed to parse notes.' });
          }
  });

  // ── POST /api/ai/search ─────────────────────────────────────────────────
  // Input : { query: string }
  // Output: { success: true, data: { entity, filters, sql_hint } }
  app.post('/api/ai/search', isAuthenticated, async (req: any, res: Response) => {
          try {
                    const { query } = req.body as { query?: string };
                    if (!query) {
                                return res.status(400).json({ success: false, error: 'Missing query field.' });
                    }

            const prompt = `You are a query parser for a behavioral health admissions CRM.
            Convert the natural language search below into a structured JSON filter object.

            Available entities: leads, inquiries, referral_accounts, activities
            Available filters:
              - level_of_care: detox | residential | php | iop | outpatient
                - stage: string (e.g. "new", "contacted", "admitted", "discharged")
                  - created_after: today | 7_days | 30_days | 90_days
                    - insurance_provider: string
                      - substance_or_issue: string
                        - assigned_to: string (staff name or id)

                        Return ONLY valid JSON — no markdown, no explanation:
                        {
                          "entity": "leads",
                            "filters": {},
                              "sql_hint": ""
                              }

                              sql_hint should be a human-readable description of the WHERE clause (e.g. "WHERE level_of_care = 'detox' AND created_at >= NOW() - INTERVAL '7 days'").

                              Query: "${query}"`;

            const raw = await runAI(prompt);
                    const fallback = { entity: 'leads', filters: {}, sql_hint: '' };
                    const result = safeParseJSON(raw, fallback);

            return res.json({ success: true, data: result });
          } catch (error: any) {
                    console.error('ai/search error:', error);
                    return res.status(500).json({ success: false, error: 'Failed to process search.' });
          }
  });

  // ── POST /api/ai/report ─────────────────────────────────────────────────
  // Input : { startDate?: string, endDate?: string, filters?: object }
  // Output: { success: true, data: string  (readable report) }
  app.post('/api/ai/report', isAuthenticated, async (req: any, res: Response) => {
          try {
                    const { startDate, endDate, filters } = req.body as {
                                startDate?: string;
                                endDate?: string;
                                filters?: Record<string, unknown>;
                    };

            const dateRange =
                        startDate && endDate
                        ? `${startDate} to ${endDate}`
                          : startDate
                        ? `from ${startDate}`
                          : endDate
                        ? `through ${endDate}`
                          : 'all time';

            const filtersStr = filters ? JSON.stringify(filters, null, 2) : 'None';

            const prompt = `You are an admissions analytics assistant for a behavioral health facility.
            Generate a professional, readable summary report based on the parameters below.
            Use plain prose with short sections. Include observations about trends, action items,
            and key metrics. Keep it under 400 words.

            Date range: ${dateRange}
            Applied filters:
            ${filtersStr}

            Report sections to include:
            1. Overview
            2. Key Metrics (admissions volume, conversion rate estimate, insurance coverage breakdown)
            3. Notable Trends
            4. Recommended Next Steps

            Return ONLY the report text. No JSON.`;

            const result = await runAI(prompt);
                    return res.json({ success: true, data: result.trim() });
          } catch (error: any) {
                    console.error('ai/report error:', error);
                    return res.status(500).json({ success: false, error: 'Failed to generate report.' });
          }
  });

  // ── POST /api/ai/parse-inquiry (legacy — file + text, original endpoint) ─
  app.post('/api/ai/parse-inquiry', isAuthenticated, upload.single('file'), async (req: any, res: Response) => {
          try {
                    let rawText = '';
                    if (req.file) {
                                await uploadScreenshotToS3(req.file.buffer, req.file.mimetype);
                                rawText = await extractTextViaTextract(req.file.buffer);
                    } else if (req.body?.text) {
                                rawText = req.body.text as string;
                    } else {
                                return res.status(400).json({ message: 'Provide a file or a text field.' });
                    }
                    const prompt =
                                'Extract referral fields and return ONLY JSON: {"name":"","date_of_birth":"","phone":"","email":"","insurance_provider":"","insurance_member_id":"","group_number":"","substance_or_issue":""}. Text: ' +
                                rawText;
                    const raw = await callAnthropic(prompt);
                    const fields = safeParseJSON(raw, {
                                name: '',
                                date_of_birth: '',
                                phone: '',
                                email: '',
                                insurance_provider: '',
                                insurance_member_id: '',
                                group_number: '',
                                substance_or_issue: '',
                    });
                    return res.json({ fields });
          } catch (error: any) {
                    if (error instanceof Anthropic.APIError) {
                                console.error('parse-inquiry Anthropic error:', error.status, error.message);
                                return res.status(502).json({ message: 'AI service error: ' + error.message });
                    }
                    console.error('parse-inquiry error:', error);
                    return res.status(500).json({ message: 'Failed to parse inquiry' });
          }
  });

  // ── POST /api/ai/help ────────────────────────────────────────────────────
  app.post('/api/ai/help', isAuthenticated, async (req: any, res: Response) => {
          try {
                    const { question } = req.body as { question?: string };
                    const answer = await callAnthropic(
                                'You are a helpful assistant for a behavioral health admissions CRM. Answer concisely: ' + question
                              );
                    return res.json({ answer });
          } catch (error: any) {
                    if (error instanceof Anthropic.APIError) {
                                console.error('help Anthropic error:', error.status, error.message);
                                return res.status(502).json({ message: 'AI service error: ' + error.message });
                    }
                    console.error('help error:', error);
                    return res.status(500).json({ message: 'Failed to get help response' });
          }
  });

  // ── POST /api/support/message ────────────────────────────────────────────
  app.post('/api/support/message', isAuthenticated, async (req: any, res: Response) => {
          try {
                    const userId: string = req.user?.claims?.sub;
                    const user = await storage.getUser(userId);
                    const { message } = req.body as { message?: string };
                    const company = user?.companyId ? await storage.getCompany(user.companyId) : null;
                    await storage.createContactSubmission({
                                email: user?.email ?? '',
                                phone: null,
                                companyName: company?.name ?? null,
                                message: message!.trim(),
                                source: 'in_app_support',
                                userId,
                                status: 'new',
                    });
                    return res.status(201).json({ message: 'Support request submitted.' });
          } catch (error) {
                    console.error('support/message error:', error);
                    return res.status(500).json({ message: 'Failed to submit support request' });
          }
  });

  // ── POST /api/support/bug ────────────────────────────────────────────────
  app.post('/api/support/bug', isAuthenticated, async (req: any, res: Response) => {
          try {
                    const userId: string = req.user?.claims?.sub;
                    const user = await storage.getUser(userId);
                    const { description, steps, severity } = req.body as {
                                description?: string;
                                steps?: string;
                                severity?: string;
                    };
                    const company = user?.companyId ? await storage.getCompany(user.companyId) : null;
                    const msg = [
                                '[BUG REPORT]',
                                'Description: ' + description!.trim(),
                                steps ? 'Steps: ' + steps.trim() : null,
                                severity ? 'Severity: ' + severity : null,
                              ]
                      .filter(Boolean)
                      .join('\n');
                    await storage.createContactSubmission({
                                email: user?.email ?? '',
                                phone: null,
                                companyName: company?.name ?? null,
                                message: msg,
                                source: 'in_app_support',
                                userId,
                                status: 'new',
                    });
                    return res.status(201).json({ message: 'Bug report submitted.' });
          } catch (error) {
                    console.error('support/bug error:', error);
                    return res.status(500).json({ message: 'Failed to submit bug report' });
          }
  });

  // ── POST /api/support/idea ───────────────────────────────────────────────
  app.post('/api/support/idea', isAuthenticated, async (req: any, res: Response) => {
          try {
                    const userId: string = req.user?.claims?.sub;
                    const user = await storage.getUser(userId);
                    const { title, description } = req.body as { title?: string; description?: string };
                    const company = user?.companyId ? await storage.getCompany(user.companyId) : null;
                    const msg = [
                                '[FEATURE IDEA]',
                                title ? 'Title: ' + title.trim() : null,
                                'Description: ' + description!.trim(),
                              ]
                      .filter(Boolean)
                      .join('\n');
                    await storage.createContactSubmission({
                                email: user?.email ?? '',
                                phone: null,
                                companyName: company?.name ?? null,
                                message: msg,
                                source: 'in_app_support',
                                userId,
                                status: 'new',
                    });
                    return res.status(201).json({ message: 'Feature idea submitted.' });
          } catch (error) {
                    console.error('support/idea error:', error);
                    return res.status(500).json({ message: 'Failed to submit feature idea' });
          }
  });
}
