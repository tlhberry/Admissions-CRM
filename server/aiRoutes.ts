import type { Express, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';
import { isAuthenticated } from './replitAuth';

const anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
const textractClient = new TextractClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });
const S3_BUCKET = process.env.S3_BUCKET ?? '';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const upload = multer({ storage: multer.memoryStorage() });

async function callAnthropic(prompt: string): Promise<string> {
    try {
          const response = await anthropicClient.messages.create({
                  model: ANTHROPIC_MODEL,
                  max_tokens: 2048,
                  messages: [{ role: 'user', content: prompt }],
          });
          const block = response.content[0];
          return block.type === 'text' ? block.text : '';
    } catch (error) {
          if (error instanceof Anthropic.APIError) {
                  console.error('Anthropic API error:', error.status, error.message);
                  throw error;
          }
          throw error;
    }
}

async function extractTextViaTextract(buffer: Buffer): Promise<string> {
    const result = await textractClient.send(new DetectDocumentTextCommand({ Document: { Bytes: buffer } }));
    return result.Blocks?.filter((b) => b.BlockType === 'LINE').map((b) => b.Text ?? '').join('\n') ?? '';
}

async function uploadScreenshotToS3(buffer: Buffer, mimeType: string): Promise<void> {
    await s3Client.send(new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: `screenshots/${uuidv4()}`,
          Body: buffer,
          ContentType: mimeType,
    }));
}

export function registerAiRoutes(app: Express): void {
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
                  const prompt = 'Extract referral fields and return ONLY JSON: {"name":"","date_of_birth":"","phone":"","email":"","insurance_provider":"","insurance_member_id":"","group_number":"","substance_or_issue":""}. Text: ' + rawText;
                  const raw = await callAnthropic(prompt);
                  let fields: Record<string, string>;
                  try {
                            fields = JSON.parse(raw.replace(/```json|```/g, '').trim());
                  } catch {
                            fields = { name: '', date_of_birth: '', phone: '', email: '', insurance_provider: '', insurance_member_id: '', group_number: '', substance_or_issue: '' };
                  }
                  return res.json({ fields });
          } catch (error) {
                  if (error instanceof Anthropic.APIError) {
                            console.error('parse-inquiry Anthropic error:', error.status, error.message);
                            return res.status(502).json({ message: 'AI service error: ' + error.message });
                  }
                  console.error('parse-inquiry error:', error);
                  return res.status(500).json({ message: 'Failed to parse inquiry' });
          }
    });

  app.post('/api/ai/search', isAuthenticated, async (req: any, res: Response) => {
        try {
                const { query } = req.body as { query?: string };
                const prompt = 'Parse this CRM search into JSON. Entities: leads,inquiries,referral_accounts,activities. Filters: level_of_care(detox|residential|php|iop|outpatient),stage,created_after(today|7_days|30_days|90_days),insurance_provider,substance_or_issue. Query: ' + query + '. Return ONLY JSON: {"entity":"leads","filters":{}}';
                const raw = await callAnthropic(prompt);
                let result: { entity: string; filters: Record<string, string> };
                try {
                          result = JSON.parse(raw.replace(/```json|```/g, '').trim());
                } catch {
                          result = { entity: 'leads', filters: {} };
                }
                return res.json(result);
        } catch (error) {
                if (error instanceof Anthropic.APIError) {
                          console.error('search Anthropic error:', error.status, error.message);
                          return res.status(502).json({ message: 'AI service error: ' + error.message });
                }
                console.error('search error:', error);
                return res.status(500).json({ message: 'Failed to process search' });
        }
  });

  app.post('/api/ai/help', isAuthenticated, async (req: any, res: Response) => {
        try {
                const { question } = req.body as { question?: string };
                const answer = await callAnthropic('You are a helpful assistant for a behavioral health admissions CRM. Answer concisely: ' + question);
                return res.json({ answer });
        } catch (error) {
                if (error instanceof Anthropic.APIError) {
                          console.error('help Anthropic error:', error.status, error.message);
                          return res.status(502).json({ message: 'AI service error: ' + error.message });
                }
                console.error('help error:', error);
                return res.status(500).json({ message: 'Failed to get help response' });
        }
  });

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
                          message: message.trim(),
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

  app.post('/api/support/bug', isAuthenticated, async (req: any, res: Response) => {
        try {
                const userId: string = req.user?.claims?.sub;
                const user = await storage.getUser(userId);
                const { description, steps, severity } = req.body as { description?: string; steps?: string; severity?: string };
                const company = user?.companyId ? await storage.getCompany(user.companyId) : null;
                const msg = ['[BUG REPORT]', 'Description: ' + description.trim(), steps ? 'Steps: ' + steps.trim() : null, severity ? 'Severity: ' + severity : null].filter(Boolean).join('\n');
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

  app.post('/api/support/idea', isAuthenticated, async (req: any, res: Response) => {
        try {
                const userId: string = req.user?.claims?.sub;
                const user = await storage.getUser(userId);
                const { title, description } = req.body as { title?: string; description?: string };
                const company = user?.companyId ? await storage.getCompany(user.companyId) : null;
                const msg = ['[FEATURE IDEA]', title ? 'Title: ' + title.trim() : null, 'Description: ' + description.trim()].filter(Boolean).join('\n');
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
