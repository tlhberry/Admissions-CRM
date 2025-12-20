import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, logAudit, type InquiryFilters } from "./storage";
import { 
  setupAuth, 
  isAuthenticated, 
  isAdmin,
  requirePermission,
  canAccessInquiries,
  canAccessReferralAccounts,
  canAccessActivities,
  canAccessReports,
  canAccessPreAssessment,
} from "./replitAuth";
import authRoutes from "./auth/authRoutes";
import { 
  insertInquirySchema, 
  updateInquirySchema, 
  levelOfCareDisplayNames, 
  type LevelOfCare,
  insertReferralAccountSchema,
  insertReferralContactSchema,
  insertActivityLogSchema,
  insertNotificationSettingSchema,
  insertPreCertFormSchema,
  insertNursingAssessmentFormSchema,
  insertPreScreeningFormSchema,
  type User,
  normalizePhoneE164,
} from "@shared/schema";
import { z } from "zod";
import { emailService } from "./emailService";
import multer from "multer";
import path from "path";
import fs from "fs";
import OpenAI from "openai";

// Helper function to check and reset monthly AI usage if needed
async function checkAndResetMonthlyUsage(companyId: number): Promise<void> {
  const company = await storage.getCompany(companyId);
  if (!company) return;
  
  const now = new Date();
  const resetDate = company.aiUsageResetDate ? new Date(company.aiUsageResetDate) : null;
  
  // If no reset date is set, initialize to first day of next month
  if (!resetDate) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await storage.updateCompany(companyId, {
      aiUsageResetDate: nextMonth,
    });
    return;
  }
  
  // If reset date has passed, reset usage and roll forward to next month from that anchor
  if (now >= resetDate) {
    // Calculate next reset date by adding one month to current reset date
    const nextResetDate = new Date(resetDate);
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);
    
    await storage.updateCompany(companyId, {
      aiUsageThisMonthCents: 0,
      aiUsageResetDate: nextResetDate,
    });
  }
}

// Helper function to check if AI is available for a company
async function isAiAvailable(companyId: number): Promise<{ available: boolean; reason?: string }> {
  const company = await storage.getCompany(companyId);
  if (!company) {
    return { available: false, reason: "Company not found" };
  }
  
  // Check and reset monthly usage if needed
  await checkAndResetMonthlyUsage(companyId);
  
  // Re-fetch company after potential reset
  const updatedCompany = await storage.getCompany(companyId);
  if (!updatedCompany) {
    return { available: false, reason: "Company not found" };
  }
  
  // Check if AI is enabled
  if (updatedCompany.aiAssistanceEnabled === "no") {
    return { available: false, reason: "Disabled" };
  }
  
  // Check budget limit (null = unlimited)
  if (updatedCompany.aiBudgetLimitCents !== null && updatedCompany.aiBudgetLimitCents > 0) {
    const usage = updatedCompany.aiUsageThisMonthCents || 0;
    if (usage >= updatedCompany.aiBudgetLimitCents) {
      return { available: false, reason: "Budget exceeded" };
    }
  }
  
  return { available: true };
}

// Helper to increment AI usage tracking (cost is in cents)
async function trackAiUsage(companyId: number, costCents: number): Promise<void> {
  const company = await storage.getCompany(companyId);
  if (!company) return;
  
  const currentUsage = company.aiUsageThisMonthCents || 0;
  await storage.updateCompany(companyId, {
    aiUsageThisMonthCents: currentUsage + costCents,
  });
}

// Estimated cost per transcription in cents (whisper + gpt-4o extraction)
const AI_TRANSCRIPTION_COST_CENTS = 50; // ~$0.50 per transcription

// Helper function to transcribe call and extract data (used by CTM webhook)
async function transcribeAndExtractCallData(inquiryId: number, companyId: number, recordingUrl: string): Promise<void> {
  try {
    console.log(`Auto-transcribing call for inquiry #${inquiryId}...`);
    
    const openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });

    // Download the audio file
    const audioResponse = await fetch(recordingUrl);
    if (!audioResponse.ok) {
      console.error(`Failed to download call recording for inquiry #${inquiryId}`);
      return;
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
    const audioFile = new File([audioBlob], "recording.mp3", { type: "audio/mpeg" });

    // Transcribe with Whisper
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "text",
    });

    const transcription = transcriptionResponse;
    console.log(`Transcription completed for inquiry #${inquiryId}: ${transcription.substring(0, 100)}...`);

    // Extract data from transcription using GPT
    const extractionPrompt = `You are an addiction treatment center admissions specialist. Analyze this call transcription and extract key information.

Return a JSON object with these fields (use null if not clearly mentioned):
{
  "callerName": "Full name of the caller or person calling on behalf of client",
  "clientName": "Name of the person seeking treatment (may be same as caller)",
  "phoneNumber": "Phone number if mentioned",
  "email": "Email address if mentioned",
  "insuranceProvider": "Insurance company name",
  "insurancePolicyId": "Insurance policy or member ID",
  "presentingIssues": "Brief description of substance use or mental health issues mentioned",
  "urgency": "low", "medium", or "high" based on crisis indicators,
  "callSummary": "2-3 sentence professional summary of the call suitable for clinical staff"
}

Transcription:
${transcription}`;

    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: extractionPrompt }
      ],
      response_format: { type: "json_object" },
    });

    const extractedContent = extractionResponse.choices[0]?.message?.content;
    if (!extractedContent) {
      console.error(`Failed to extract data from transcription for inquiry #${inquiryId}`);
      return;
    }

    const extractedData = JSON.parse(extractedContent);
    console.log(`Extracted data for inquiry #${inquiryId}:`, extractedData);

    // Get current inquiry to check existing fields
    const inquiry = await storage.getInquiry(inquiryId, companyId);
    if (!inquiry) {
      console.error(`Inquiry #${inquiryId} not found after transcription`);
      return;
    }

    // Update inquiry with transcription and extracted data
    const updateData: any = {
      transcription,
      aiExtractedData: extractedData,
      callSummary: extractedData.callSummary || null,
    };

    // Only update fields that are currently empty/default and have extracted values
    if ((!inquiry.callerName || inquiry.callerName === "Incoming Call") && extractedData.callerName) {
      updateData.callerName = extractedData.callerName;
    }
    if (!inquiry.clientName && extractedData.clientName) {
      updateData.clientName = extractedData.clientName;
    }
    if (!inquiry.email && extractedData.email) {
      updateData.email = extractedData.email;
    }
    if (!inquiry.insuranceProvider && extractedData.insuranceProvider) {
      updateData.insuranceProvider = extractedData.insuranceProvider;
    }
    if (!inquiry.insurancePolicyId && extractedData.insurancePolicyId) {
      updateData.insurancePolicyId = extractedData.insurancePolicyId;
    }

    // Append presenting issues to initial notes if available
    if (extractedData.presentingIssues) {
      const existingNotes = inquiry.initialNotes || "";
      const separator = existingNotes ? "\n\n---\nAI-Extracted Issues: " : "AI-Extracted Issues: ";
      updateData.initialNotes = existingNotes + separator + extractedData.presentingIssues;
    }

    await storage.updateInquiry(inquiryId, companyId, updateData);
    console.log(`Auto-transcription complete for inquiry #${inquiryId}. Updated fields: ${Object.keys(updateData).join(", ")}`);
  } catch (error) {
    console.error(`Error in auto-transcription for inquiry #${inquiryId}:`, error);
  }
}

// Helper to get user with companyId from request
async function getUserWithCompany(req: any): Promise<User | null> {
  const userId = req.user?.claims?.sub;
  if (!userId) return null;
  const user = await storage.getUser(userId);
  return user || null;
}

// Helper to require companyId - returns 403 if user has no company
async function requireCompanyId(req: any, res: Response): Promise<number | null> {
  const user = await getUserWithCompany(req);
  if (!user) {
    res.status(401).json({ message: "User not found" });
    return null;
  }
  if (!user.companyId) {
    res.status(403).json({ message: "User is not associated with a company" });
    return null;
  }
  return user.companyId;
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: PDF, images, Word documents"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // HIPAA-compliant email/password + 2FA auth routes
  app.use("/api/auth", authRoutes);

  // Public contact form submission (no auth required)
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const { email, phone, companyName, message } = req.body;
      
      // Validate required fields
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Valid email is required" });
      }
      if (!message || message.trim().length < 10) {
        return res.status(400).json({ message: "Please provide a message (at least 10 characters)" });
      }
      
      // Store the submission
      const submission = await storage.createContactSubmission({
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        companyName: companyName?.trim() || null,
        message: message.trim(),
        source: "landing_page",
        userId: null,
        status: "new",
      });
      
      res.status(201).json({ message: "Thank you for your message. We'll be in touch soon!" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Failed to submit message" });
    }
  });

  // Authenticated support request (from within the app)
  app.post("/api/support", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { message } = req.body;
      
      if (!message || message.trim().length < 10) {
        return res.status(400).json({ message: "Please provide a message (at least 10 characters)" });
      }
      
      const company = user?.companyId ? await storage.getCompany(user.companyId) : null;
      
      const submission = await storage.createContactSubmission({
        email: user?.email || "",
        phone: null,
        companyName: company?.name || null,
        message: message.trim(),
        source: "in_app_support",
        userId: userId,
        status: "new",
      });
      
      res.status(201).json({ message: "Your support request has been submitted. We'll be in touch soon!" });
    } catch (error) {
      console.error("Support request error:", error);
      res.status(500).json({ message: "Failed to submit support request" });
    }
  });

  // Auth routes (legacy Replit auth endpoints)
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get current user's company
  app.get("/api/company", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(404).json({ message: "No company associated with user" });
      }
      const company = await storage.getCompany(user.companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // Update current user's company (Admin only)
  app.patch("/api/company", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(404).json({ message: "No company associated with user" });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update company settings" });
      }
      const company = await storage.updateCompany(user.companyId, req.body);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Bed Board metrics endpoint
  app.get("/api/bed-metrics", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const admittedCount = await storage.getAdmittedCount(companyId);
      const totalBeds = company.totalBeds ?? 32;
      const bedsAvailable = Math.max(totalBeds - admittedCount, 0);
      
      res.json({
        totalBeds,
        currentlyAdmitted: admittedCount,
        bedsAvailable,
      });
    } catch (error) {
      console.error("Error fetching bed metrics:", error);
      res.status(500).json({ message: "Failed to fetch bed metrics" });
    }
  });

  // Get admitted clients for Bed Board
  app.get("/api/admitted-clients", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const admittedInquiries = await storage.getAdmittedInquiries(companyId);
      res.json(admittedInquiries);
    } catch (error) {
      console.error("Error fetching admitted clients:", error);
      res.status(500).json({ message: "Failed to fetch admitted clients" });
    }
  });

  // Serve uploaded files
  const express = await import("express");
  app.use("/uploads", express.default.static(uploadDir));

  // File upload route
  app.post("/api/upload", isAuthenticated, upload.single("file"), (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.originalname });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // VOB Document Analysis with AI
  app.post("/api/analyze-vob", isAuthenticated, async (req: any, res) => {
    try {
      const { vobText } = req.body;
      if (!vobText || vobText.trim().length === 0) {
        return res.status(400).json({ message: "VOB text content is required" });
      }

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const systemPrompt = `You are an expert insurance verification specialist for addiction treatment centers. Analyze the following VOB (Verification of Benefits) document and extract key insurance information.

Return a JSON object with these fields (use null if not found, use dollar amounts with $ sign):
{
  "inNetworkDeductible": "total in-network deductible amount",
  "inNetworkDeductibleMet": "amount of deductible already met/remaining",
  "inNetworkOopMax": "in-network out-of-pocket maximum",
  "inNetworkOopMet": "amount of OOP max already met/remaining",
  "hasOutOfNetworkBenefits": "yes" or "no",
  "outOfNetworkDeductible": "out-of-network deductible (if applicable)",
  "outOfNetworkDeductibleMet": "amount met (if applicable)",
  "outOfNetworkOopMax": "out-of-network OOP max (if applicable)",
  "outOfNetworkOopMet": "amount met (if applicable)",
  "stateRestrictions": "any state or geographic restrictions",
  "preCertRequired": "yes" or "no",
  "preAuthRequired": "yes" or "no",
  "preCertAuthDetails": "details about pre-certification/authorization requirements, timelines, mandatory requirements",
  "hasSubstanceUseBenefits": "yes" or "no",
  "hasMentalHealthBenefits": "yes" or "no",
  "benefitNotes": "any important notes about benefits, exclusions, or limitations",
  "vobSummary": "brief summary of key coverage findings"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze this VOB document:\n\n${vobText}` }
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ message: "No response from AI" });
      }

      const extractedData = JSON.parse(content);
      res.json(extractedData);
    } catch (error) {
      console.error("Error analyzing VOB:", error);
      res.status(500).json({ message: "Failed to analyze VOB document" });
    }
  });

  // Inquiry routes - protected by RBAC
  app.get("/api/inquiries", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const inquiries = await storage.getAllInquiries(companyId);
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Search/filter inquiries
  app.get("/api/inquiries/search", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const filters: InquiryFilters = {
        search: req.query.search as string | undefined,
        stage: req.query.stage as string | undefined,
        referralSource: req.query.referralSource as string | undefined,
        insuranceProvider: req.query.insuranceProvider as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const inquiries = await storage.searchInquiries(companyId, filters);
      res.json(inquiries);
    } catch (error) {
      console.error("Error searching inquiries:", error);
      res.status(500).json({ message: "Failed to search inquiries" });
    }
  });

  app.get("/api/inquiries/:id", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid inquiry ID" });
      }

      const inquiry = await storage.getInquiry(id, companyId);
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      res.json(inquiry);
    } catch (error) {
      console.error("Error fetching inquiry:", error);
      res.status(500).json({ message: "Failed to fetch inquiry" });
    }
  });

  app.post("/api/inquiries", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const userId = req.user.claims.sub;
      const validatedData = insertInquirySchema.parse({
        ...req.body,
        userId,
        companyId,
      });

      const inquiry = await storage.createInquiry(validatedData);
      
      // Audit log for PHI creation
      await logAudit(companyId, userId, "create", "inquiry", inquiry.id, "Inquiry created", req);
      
      res.status(201).json(inquiry);
    } catch (error) {
      console.error("Error creating inquiry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  app.patch("/api/inquiries/:id", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid inquiry ID" });
      }

      // Get the current inquiry to check for stage change
      const currentInquiry = await storage.getInquiry(id, companyId);
      
      // Convert date strings to Date objects
      const body = { ...req.body };
      if (body.vobCompletedAt && typeof body.vobCompletedAt === 'string') {
        body.vobCompletedAt = new Date(body.vobCompletedAt);
      }
      if (body.preAssessmentDate && typeof body.preAssessmentDate === 'string') {
        body.preAssessmentDate = new Date(body.preAssessmentDate);
      }
      
      const validatedData = updateInquirySchema.parse(body);
      const inquiry = await storage.updateInquiry(id, companyId, validatedData);

      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      // Audit log for PHI update
      const userId = req.user?.claims?.sub;
      const changedFields = Object.keys(req.body).join(", ");
      await logAudit(companyId, userId, "update", "inquiry", id, `Fields updated: ${changedFields}`, req);

      res.json(inquiry);
    } catch (error) {
      console.error("Error updating inquiry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update inquiry" });
    }
  });

  app.delete("/api/inquiries/:id", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid inquiry ID" });
      }

      // Audit log for PHI deletion (log BEFORE deleting)
      const userId = req.user?.claims?.sub;
      await logAudit(companyId, userId, "delete", "inquiry", id, "Inquiry deleted", req);

      await storage.deleteInquiry(id, companyId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      res.status(500).json({ message: "Failed to delete inquiry" });
    }
  });

  // Call logs for an inquiry - get call history
  app.get("/api/inquiries/:id/call-logs", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid inquiry ID" });
      }

      // Verify inquiry exists and belongs to company
      const inquiry = await storage.getInquiry(id, companyId);
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      const callLogs = await storage.getCallLogsByInquiry(id);
      res.json(callLogs);
    } catch (error) {
      console.error("Error fetching call logs:", error);
      res.status(500).json({ message: "Failed to fetch call logs" });
    }
  });

  // Log an outbound call (click-to-call)
  const callLogSchema = z.object({
    notes: z.string().optional().nullable(),
  });

  app.post("/api/inquiries/:id/call-logs", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid inquiry ID" });
      }

      // Validate request body
      const validatedBody = callLogSchema.parse(req.body || {});

      // Verify inquiry exists and belongs to company
      const inquiry = await storage.getInquiry(id, companyId);
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      // Require phone number to log a call
      if (!inquiry.phoneNumber) {
        return res.status(400).json({ message: "Cannot log call - inquiry has no phone number" });
      }

      // Prevent duplicate outbound logs within 5 seconds (simple throttle)
      const existingLogs = await storage.getCallLogsByInquiry(id);
      const now = Date.now();
      const recentOutbound = existingLogs.find(log => 
        log.direction === "outbound" && 
        log.callTimestamp && 
        (now - new Date(log.callTimestamp).getTime()) < 5000
      );
      if (recentOutbound) {
        return res.status(429).json({ message: "Call already logged recently" });
      }

      const userId = req.user?.claims?.sub;
      const callLog = await storage.createCallLog({
        inquiryId: id,
        direction: "outbound",
        phoneNumber: inquiry.phoneNumber,
        callTimestamp: new Date(),
        userId: userId || null,
        notes: validatedBody.notes || null,
      });

      res.status(201).json(callLog);
    } catch (error) {
      console.error("Error creating call log:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create call log" });
    }
  });

  // Manual staff notification endpoint - sends email to all staff about new admission
  app.post("/api/inquiries/:id/notify-staff", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      const inquiry = await storage.getInquiry(id, companyId);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      
      // Get notification settings for scheduled stage
      const notificationSettings = await storage.getNotificationSettings(companyId);
      const scheduledSetting = notificationSettings.find(s => s.stageName === "scheduled");
      
      let staffEmails: string[] = [];
      if (scheduledSetting?.enabled === "yes" && scheduledSetting.emailAddresses) {
        staffEmails = scheduledSetting.emailAddresses
          .split(",")
          .map(e => e.trim())
          .filter(e => e.length > 0 && e.includes("@"));
      }
      
      // Fall back to NOTIFICATION_EMAIL env var
      if (staffEmails.length === 0 && process.env.NOTIFICATION_EMAIL) {
        staffEmails = [process.env.NOTIFICATION_EMAIL];
      }
      
      if (staffEmails.length === 0) {
        return res.status(400).json({ 
          message: "No staff email addresses configured. Go to Settings to add emails for the 'scheduled' stage." 
        });
      }
      
      // Format date of birth
      let dobFormatted: string | undefined;
      if (inquiry.dateOfBirth) {
        const dob = new Date(inquiry.dateOfBirth);
        dobFormatted = `${(dob.getMonth() + 1).toString().padStart(2, '0')}/${dob.getDate().toString().padStart(2, '0')}/${dob.getFullYear()}`;
      }
      
      const sent = await emailService.sendAdmissionScheduledNotification({
        clientName: inquiry.clientName || inquiry.callerName || "Unknown Client",
        phoneNumber: inquiry.phoneNumber || "Not provided",
        dateOfBirth: dobFormatted,
        expectedAdmitDate: inquiry.expectedAdmitDate || "Not set",
        levelOfCare: inquiry.levelOfCare 
          ? levelOfCareDisplayNames[inquiry.levelOfCare as LevelOfCare] || inquiry.levelOfCare 
          : "Not specified",
        insuranceProvider: inquiry.insuranceProvider || undefined,
        insurancePolicyId: inquiry.insurancePolicyId || undefined,
        schedulingNotes: inquiry.schedulingNotes || undefined,
      }, staffEmails);
      
      res.json({ 
        success: sent, 
        recipientCount: staffEmails.length,
        message: sent ? `Notification sent to ${staffEmails.length} staff member(s)` : "Email service not configured"
      });
    } catch (error) {
      console.error("Error sending staff notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Send client arrival email with pre-assessment forms attached
  app.post("/api/inquiries/:id/send-arrival-email", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      const inquiry = await storage.getInquiry(id, companyId);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      
      // Get notification settings for admitted stage
      const notificationSettings = await storage.getNotificationSettings(companyId);
      const admittedSetting = notificationSettings.find(s => s.stageName === "admitted");
      
      let staffEmails: string[] = [];
      if (admittedSetting?.enabled === "yes" && admittedSetting.emailAddresses) {
        staffEmails = admittedSetting.emailAddresses
          .split(",")
          .map(e => e.trim())
          .filter(e => e.length > 0 && e.includes("@"));
      }
      
      // Fall back to NOTIFICATION_EMAIL
      if (staffEmails.length === 0 && process.env.NOTIFICATION_EMAIL) {
        staffEmails = [process.env.NOTIFICATION_EMAIL];
      }
      
      if (staffEmails.length === 0) {
        return res.status(400).json({ 
          message: "No email addresses configured. Go to Settings to add emails for the 'admitted' stage." 
        });
      }
      
      // Get pre-assessment forms and strip metadata/sensitive fields
      const preCertForm = await storage.getPreCertForm(id);
      const nursingForm = await storage.getNursingAssessmentForm(id);
      const preScreeningForm = await storage.getPreScreeningForm(id);
      
      // Validate all 3 pre-assessment forms are complete
      const incompleteForms: string[] = [];
      if (!preCertForm || preCertForm.isComplete !== "yes") {
        incompleteForms.push("Pre-Cert / Clinical Pre-Assessment");
      }
      if (!nursingForm || nursingForm.isComplete !== "yes") {
        incompleteForms.push("Nursing Admission Assessment");
      }
      if (!preScreeningForm || preScreeningForm.isComplete !== "yes") {
        incompleteForms.push("Pre-Screening Form");
      }
      
      if (incompleteForms.length > 0) {
        return res.status(400).json({
          message: `Please complete all pre-assessment forms before sending the arrival email. Incomplete: ${incompleteForms.join(", ")}`
        });
      }
      
      // Helper to extract only form content (remove DB metadata)
      const extractFormContent = (form: any) => {
        if (!form) return undefined;
        const { id: formId, inquiryId, createdAt, updatedAt, ...formContent } = form;
        return formContent;
      };
      
      // Format DOB
      let dobFormatted: string | undefined;
      if (inquiry.dateOfBirth) {
        const dob = new Date(inquiry.dateOfBirth);
        dobFormatted = `${(dob.getMonth() + 1).toString().padStart(2, '0')}/${dob.getDate().toString().padStart(2, '0')}/${dob.getFullYear()}`;
      }
      
      const sent = await emailService.sendClientArrivalNotification({
        clientName: inquiry.clientName || inquiry.callerName || "Unknown Client",
        dateOfBirth: dobFormatted,
        expectedAdmitDate: inquiry.expectedAdmitDate || "Not set",
        actualAdmitDate: inquiry.actualAdmitDate || undefined,
        levelOfCare: inquiry.levelOfCare 
          ? levelOfCareDisplayNames[inquiry.levelOfCare as LevelOfCare] || inquiry.levelOfCare 
          : "Not specified",
        insuranceProvider: inquiry.insuranceProvider || undefined,
        insurancePolicyId: inquiry.insurancePolicyId || undefined,
        schedulingNotes: inquiry.schedulingNotes || undefined,
      }, {
        preCert: extractFormContent(preCertForm),
        nursing: extractFormContent(nursingForm),
        preScreening: extractFormContent(preScreeningForm),
      }, staffEmails);
      
      // Email service not configured - return error so UI can surface this
      if (!sent) {
        return res.status(503).json({ 
          message: "Email service not configured. Please set up SendGrid API key in secrets." 
        });
      }
      
      // Mark arrival email as sent only on successful delivery
      await storage.updateInquiry(id, companyId, { arrivalEmailSentAt: new Date() });
      
      res.json({ 
        success: true, 
        recipientCount: staffEmails.length,
        message: `Arrival notification sent to ${staffEmails.length} recipient(s)`
      });
    } catch (error) {
      console.error("Error sending arrival notification:", error);
      res.status(500).json({ message: "Failed to send arrival notification" });
    }
  });

  // DEPRECATED: Global CTM Webhook Endpoint
  // This endpoint is deprecated. Use the company-specific endpoint instead:
  // POST /api/webhooks/ctm/:webhookToken
  // 
  // The company-specific webhook URL can be found in Admin Settings > CTM Integration
  // 
  // CTM FIELD MAPPING (same for both endpoints):
  // - caller_name / caller_id -> callerName
  // - caller_number / ani -> phoneNumber
  // - tracking_source / source -> referralSource (mapped to our categories)
  // - call_id -> ctmCallId
  // - tracking_number -> ctmTrackingNumber
  // - duration / talk_time -> callDuration
  // - recording_url / recording -> callRecordingUrl
  //
  app.post("/api/webhooks/ctm", async (req, res) => {
    console.log("DEPRECATED: /api/webhooks/ctm endpoint called. Use /api/webhooks/ctm/:webhookToken instead.");
    return res.status(410).json({ 
      message: "This endpoint is deprecated. Please use the company-specific webhook URL from Admin Settings > CTM Integration.",
      newEndpointFormat: "/api/webhooks/ctm/{webhookToken}"
    });
  });

  // Test endpoint to simulate CTM webhook (for testing purposes)
  // This allows you to test the webhook integration without waiting for real calls
  app.post("/api/webhooks/ctm/test", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      // Generate sample CTM-like data
      const sampleData = {
        call_id: `test-${Date.now()}`,
        caller_name: req.body.caller_name || "Test Caller",
        caller_number: req.body.caller_number || "(555) 123-4567",
        tracking_source: req.body.tracking_source || "google_ads",
        tracking_number: req.body.tracking_number || "(800) 555-1234",
        duration: req.body.duration || "180",
        recording_url: req.body.recording_url || "https://example.com/recordings/sample.mp3",
        call_time: new Date().toISOString(),
        city: req.body.city || "Los Angeles",
        state: req.body.state || "CA",
      };

      // Forward to the real webhook handler
      const callerName = sampleData.caller_name;
      const phoneNumber = sampleData.caller_number;
      const referralSource = mapCTMSourceToReferral(sampleData.tracking_source);
      const referralDetails = sampleData.tracking_source;
      
      // Auto-detect Google PPC from tracking source
      const sourceString = sampleData.tracking_source.toLowerCase();
      const isPaidCampaign = sourceString.includes("ppc") || 
                              sourceString.includes("paid") || 
                              sourceString.includes("ads") || 
                              sourceString.includes("cpc") ||
                              sourceString.includes("google_ads") ||
                              sourceString.includes("adwords");
      
      const initialNotes = [
        "TEST: Simulated CTM webhook call.",
        `Call ID: ${sampleData.call_id}`,
        `Tracking Number: ${sampleData.tracking_number}`,
        `Call Duration: ${sampleData.duration} seconds`,
        `Call Time: ${sampleData.call_time}`,
        `Location: ${sampleData.city}, ${sampleData.state}`,
      ].join("\n");

      const inquiry = await storage.createInquiry({
        callerName,
        phoneNumber,
        referralSource,
        referralDetails,
        initialNotes,
        stage: "inquiry",
        ctmCallId: sampleData.call_id,
        ctmTrackingNumber: sampleData.tracking_number,
        callDurationSeconds: parseInt(sampleData.duration, 10),
        callRecordingUrl: sampleData.recording_url,
        ctmSource: sampleData.tracking_source,
        companyId,
        // Auto-set referral origin for paid campaigns
        referralOrigin: isPaidCampaign ? "online" : null,
        onlineSource: isPaidCampaign ? "google_ppc" : null,
      });

      console.log(`CTM test webhook: Created inquiry #${inquiry.id} for caller ${phoneNumber} (company ${companyId})`);
      res.status(201).json({ 
        success: true, 
        inquiryId: inquiry.id,
        message: "Test inquiry created successfully",
        sampleDataUsed: sampleData,
      });
    } catch (error) {
      console.error("CTM test webhook error:", error);
      res.status(500).json({ message: "Failed to process test webhook" });
    }
  });

  // Company-specific CTM webhook endpoint
  // Each company has a unique webhook token for CTM integration
  // URL Format: https://your-app.replit.app/api/webhooks/ctm/{webhookToken}
  app.post("/api/webhooks/ctm/:webhookToken", async (req, res) => {
    try {
      const { webhookToken } = req.params;
      
      // Look up company by webhook token
      const company = await storage.getCompanyByWebhookToken(webhookToken);
      if (!company) {
        console.log(`CTM webhook: Invalid webhook token: ${webhookToken}`);
        return res.status(404).json({ message: "Invalid webhook URL" });
      }
      
      // Validate optional webhook secret if configured
      if (company.ctmWebhookSecret) {
        const providedSecret = req.headers["x-ctm-secret"] || req.query.secret;
        if (providedSecret !== company.ctmWebhookSecret) {
          console.log(`CTM webhook: Invalid secret for company ${company.id}`);
          return res.status(401).json({ message: "Unauthorized" });
        }
      }

      const callData = req.body;
      console.log(`CTM webhook received for ${company.name}:`, JSON.stringify(callData, null, 2));

      // Map CTM call data to inquiry fields
      const callerName = callData.caller_name || callData.caller_id || callData.cnam || "Incoming Call";
      const phoneNumber = callData.caller_number || callData.caller_id || callData.ani || callData.from || "";
      const referralSource = mapCTMSourceToReferral(callData.tracking_source || callData.source || callData.campaign);
      const referralDetails = callData.tracking_source || callData.source || callData.campaign || "";
      
      // CTM-specific fields
      const ctmCallId = callData.call_id || callData.id || null;
      const ctmTrackingNumber = callData.tracking_number || callData.called_number || callData.to || null;
      const callDuration = callData.duration || callData.talk_time || callData.call_length || null;
      const callRecordingUrl = callData.recording_url || callData.recording || callData.audio_url || null;
      const ctmSource = callData.tracking_source || callData.source || callData.campaign || null;
      
      // Auto-detect Google PPC from tracking source
      const sourceString = (ctmSource || "").toLowerCase();
      const isPaidCampaign = sourceString.includes("ppc") || 
                              sourceString.includes("paid") || 
                              sourceString.includes("ads") || 
                              sourceString.includes("cpc") ||
                              sourceString.includes("google_ads") ||
                              sourceString.includes("adwords");
      
      const initialNotes = [
        "Auto-created from CallTrackingMetrics webhook.",
        ctmCallId ? `Call ID: ${ctmCallId}` : null,
        ctmTrackingNumber ? `Tracking Number: ${ctmTrackingNumber}` : null,
        callDuration ? `Call Duration: ${callDuration} seconds` : null,
        callData.call_time || callData.start_time ? `Call Time: ${callData.call_time || callData.start_time}` : null,
        callData.city || callData.state ? `Location: ${[callData.city, callData.state].filter(Boolean).join(", ")}` : null,
      ].filter(Boolean).join("\n");

      // Normalize phone number to E.164 format for duplicate detection
      const phoneE164 = normalizePhoneE164(phoneNumber);
      
      // Check if we already have an inquiry for this phone number
      let inquiry;
      let isFollowUpCall = false;
      
      if (phoneE164) {
        const existingInquiry = await storage.getInquiryByPhone(company.id, phoneE164);
        if (existingInquiry) {
          // This is a follow-up call - log it and update the existing inquiry
          inquiry = existingInquiry;
          isFollowUpCall = true;
          console.log(`CTM webhook: Follow-up call detected for inquiry #${inquiry.id} from ${phoneNumber}`);
        }
      }
      
      if (!isFollowUpCall) {
        // New caller - create a new inquiry
        inquiry = await storage.createInquiry({
          callerName,
          phoneNumber,
          referralSource,
          referralDetails,
          initialNotes,
          stage: "inquiry",
          ctmCallId: ctmCallId?.toString() || null,
          ctmTrackingNumber,
          callDurationSeconds: callDuration ? parseInt(callDuration.toString(), 10) : null,
          callRecordingUrl,
          ctmSource,
          companyId: company.id,
          referralOrigin: isPaidCampaign ? "online" : null,
          onlineSource: isPaidCampaign ? "google_ppc" : null,
        });
        
        // Create phone mapping for future duplicate detection
        if (phoneE164) {
          await storage.createInquiryPhoneMap({
            inquiryId: inquiry.id,
            companyId: company.id,
            phoneE164,
          });
        }
        
        console.log(`CTM webhook: Created inquiry #${inquiry.id} for caller ${phoneNumber} (company: ${company.name})`);
      }
      
      // Always log the call (both new and follow-up calls)
      let callLog;
      try {
        callLog = await storage.createCallLog({
          inquiryId: inquiry.id,
          companyId: company.id,
          direction: "inbound",
          phoneE164: phoneE164 || phoneNumber || 'unknown',
          source: "ctm",
          durationSeconds: callDuration ? parseInt(callDuration.toString(), 10) : null,
          recordingUrl: callRecordingUrl,
          ctmCallId: ctmCallId?.toString() || null,
          notes: isFollowUpCall ? "Follow-up call from CTM" : "Initial call from CTM",
        });
        console.log(`CTM webhook: Created call log #${callLog.id} for inquiry #${inquiry.id}`);
      } catch (callLogError) {
        console.error(`CTM webhook: Failed to create call log for inquiry #${inquiry.id}:`, callLogError);
        callLog = { id: null };
      }
      
      // Trigger auto-transcription if recording URL is available AND AI is enabled
      // This runs asynchronously so the webhook responds quickly
      let autoTranscriptionTriggered = false;
      if (callRecordingUrl) {
        const aiStatus = await isAiAvailable(company.id);
        if (aiStatus.available) {
          console.log(`CTM webhook: Triggering auto-transcription for inquiry #${inquiry.id}`);
          transcribeAndExtractCallData(inquiry.id, company.id, callRecordingUrl)
            .then(() => trackAiUsage(company.id, AI_TRANSCRIPTION_COST_CENTS))
            .catch(err => console.error(`Auto-transcription failed for inquiry #${inquiry.id}:`, err));
          autoTranscriptionTriggered = true;
        } else {
          console.log(`CTM webhook: Skipping auto-transcription for inquiry #${inquiry.id} - ${aiStatus.reason}`);
        }
      }
      
      res.status(201).json({ 
        success: true, 
        inquiryId: inquiry.id,
        callLogId: callLog.id,
        isFollowUpCall,
        message: isFollowUpCall 
          ? "Follow-up call logged to existing inquiry" 
          : "New inquiry created from CTM webhook",
        caller: phoneNumber,
        autoTranscriptionTriggered,
      });
    } catch (error) {
      console.error("CTM webhook error:", error);
      res.status(500).json({ message: "Failed to process CTM webhook" });
    }
  });

  // Check AI availability for current company
  app.get("/api/ai/status", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const aiStatus = await isAiAvailable(companyId);
      const company = await storage.getCompany(companyId);
      
      res.json({
        available: aiStatus.available,
        reason: aiStatus.reason,
        enabled: company?.aiAssistanceEnabled !== "no",
        budgetLimitCents: company?.aiBudgetLimitCents,
        usageThisMonthCents: company?.aiUsageThisMonthCents || 0,
      });
    } catch (error) {
      console.error("Error checking AI status:", error);
      res.status(500).json({ message: "Failed to check AI status" });
    }
  });

  // AI Call Transcription Endpoint
  // Transcribes call recording and auto-fills inquiry fields
  app.post("/api/inquiries/:id/transcribe", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid inquiry ID" });

      // Check AI availability before proceeding
      const aiStatus = await isAiAvailable(companyId);
      if (!aiStatus.available) {
        return res.status(403).json({ 
          message: aiStatus.reason || "AI assistance is not available",
          aiDisabled: true 
        });
      }

      const inquiry = await storage.getInquiry(id, companyId);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });

      if (!inquiry.callRecordingUrl) {
        return res.status(400).json({ message: "No call recording URL available for this inquiry" });
      }

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      // Download the audio file
      console.log(`Transcribing call recording: ${inquiry.callRecordingUrl}`);
      const audioResponse = await fetch(inquiry.callRecordingUrl);
      if (!audioResponse.ok) {
        return res.status(400).json({ message: "Failed to download call recording" });
      }

      const audioBuffer = await audioResponse.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const audioFile = new File([audioBlob], "recording.mp3", { type: "audio/mpeg" });

      // Transcribe with Whisper
      const transcriptionResponse = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        response_format: "text",
      });

      const transcription = transcriptionResponse;
      console.log(`Transcription completed: ${transcription.substring(0, 200)}...`);

      // Extract data from transcription using GPT
      const extractionPrompt = `You are an addiction treatment center admissions specialist. Analyze this call transcription and extract key information.

Return a JSON object with these fields (use null if not clearly mentioned):
{
  "callerName": "Full name of the caller or person calling on behalf of client",
  "clientName": "Name of the person seeking treatment (may be same as caller)",
  "phoneNumber": "Phone number if mentioned",
  "email": "Email address if mentioned",
  "insuranceProvider": "Insurance company name",
  "insurancePolicyId": "Insurance policy or member ID",
  "presentingIssues": "Brief description of substance use or mental health issues mentioned",
  "urgency": "low", "medium", or "high" based on crisis indicators,
  "callSummary": "2-3 sentence professional summary of the call suitable for clinical staff"
}

Transcription:
${transcription}`;

      const extractionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: extractionPrompt }
        ],
        response_format: { type: "json_object" },
      });

      const extractedContent = extractionResponse.choices[0]?.message?.content;
      if (!extractedContent) {
        return res.status(500).json({ message: "Failed to extract data from transcription" });
      }

      const extractedData = JSON.parse(extractedContent);
      console.log("Extracted data:", extractedData);

      // Update inquiry with transcription and extracted data
      const updateData: any = {
        transcription,
        aiExtractedData: extractedData,
        callSummary: extractedData.callSummary || null,
      };

      // Only update fields that are currently empty and have extracted values
      if (!inquiry.callerName && extractedData.callerName) {
        updateData.callerName = extractedData.callerName;
      }
      if (!inquiry.clientName && extractedData.clientName) {
        updateData.clientName = extractedData.clientName;
      }
      if (!inquiry.email && extractedData.email) {
        updateData.email = extractedData.email;
      }
      if (!inquiry.insuranceProvider && extractedData.insuranceProvider) {
        updateData.insuranceProvider = extractedData.insuranceProvider;
      }
      if (!inquiry.insurancePolicyId && extractedData.insurancePolicyId) {
        updateData.insurancePolicyId = extractedData.insurancePolicyId;
      }

      // Append presenting issues to initial notes if available
      if (extractedData.presentingIssues) {
        const existingNotes = inquiry.initialNotes || "";
        const separator = existingNotes ? "\n\n---\nAI-Extracted Issues: " : "AI-Extracted Issues: ";
        updateData.initialNotes = existingNotes + separator + extractedData.presentingIssues;
      }

      const updatedInquiry = await storage.updateInquiry(id, companyId, updateData);

      // Track AI usage
      await trackAiUsage(companyId, AI_TRANSCRIPTION_COST_CENTS);

      res.json({
        success: true,
        message: "Call transcribed and data extracted successfully",
        transcription,
        extractedData,
        updatedFields: Object.keys(updateData),
      });
    } catch (error) {
      console.error("Error transcribing call:", error);
      res.status(500).json({ message: "Failed to transcribe call recording" });
    }
  });

  // Users route (for BD rep dropdown - returns users in same company)
  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const companyUsers = await storage.getUsersByCompany(companyId);
      res.json(companyUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin-only: Update user role or status
  app.patch("/api/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const targetUserId = req.params.id;
      const currentUserId = req.user.claims.sub;
      
      // Don't allow admins to demote themselves
      if (targetUserId === currentUserId && req.body.role && req.body.role !== 'admin') {
        return res.status(400).json({ message: "Cannot demote yourself from admin" });
      }
      
      // Verify user belongs to same company
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser || targetUser.companyId !== companyId) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow updating role and isActive
      const allowedFields = ['role', 'isActive'];
      const updateData: any = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      const updatedUser = await storage.updateUser(targetUserId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Referral Account routes
  // Referral account routes - protected by RBAC
  app.get("/api/referral-accounts", isAuthenticated, canAccessReferralAccounts, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const accounts = await storage.getAllReferralAccounts(companyId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching referral accounts:", error);
      res.status(500).json({ message: "Failed to fetch referral accounts" });
    }
  });

  app.post("/api/referral-accounts", isAuthenticated, canAccessReferralAccounts, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const userId = req.user.claims.sub;
      const validatedData = insertReferralAccountSchema.parse({
        ...req.body,
        createdBy: userId,
        companyId,
      });
      const account = await storage.createReferralAccount(validatedData);
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating referral account:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create referral account" });
    }
  });

  app.get("/api/referral-accounts/:id", isAuthenticated, canAccessReferralAccounts, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid account ID" });
      const account = await storage.getReferralAccount(id, companyId);
      if (!account) return res.status(404).json({ message: "Account not found" });
      res.json(account);
    } catch (error) {
      console.error("Error fetching referral account:", error);
      res.status(500).json({ message: "Failed to fetch referral account" });
    }
  });

  app.patch("/api/referral-accounts/:id", isAuthenticated, canAccessReferralAccounts, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid account ID" });
      const account = await storage.updateReferralAccount(id, companyId, req.body);
      if (!account) return res.status(404).json({ message: "Account not found" });
      res.json(account);
    } catch (error) {
      console.error("Error updating referral account:", error);
      res.status(500).json({ message: "Failed to update referral account" });
    }
  });

  app.delete("/api/referral-accounts/:id", isAuthenticated, canAccessReferralAccounts, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid account ID" });
      await storage.deleteReferralAccount(id, companyId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting referral account:", error);
      res.status(500).json({ message: "Failed to delete referral account" });
    }
  });

  // Referral Contact routes - protected by RBAC
  app.get("/api/referral-accounts/:id/contacts", isAuthenticated, canAccessReferralAccounts, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) return res.status(400).json({ message: "Invalid account ID" });
      const contacts = await storage.getContactsByAccount(accountId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/referral-accounts/:id/contacts", isAuthenticated, canAccessReferralAccounts, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) return res.status(400).json({ message: "Invalid account ID" });
      const validatedData = insertReferralContactSchema.parse({
        ...req.body,
        accountId,
      });
      const contact = await storage.createReferralContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.patch("/api/referral-contacts/:id", isAuthenticated, canAccessReferralAccounts, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid contact ID" });
      const contact = await storage.updateReferralContact(id, req.body);
      if (!contact) return res.status(404).json({ message: "Contact not found" });
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/referral-contacts/:id", isAuthenticated, canAccessReferralAccounts, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid contact ID" });
      await storage.deleteReferralContact(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Activity Log routes
  // Activity routes - protected by RBAC
  app.get("/api/referral-accounts/:id/activities", isAuthenticated, canAccessActivities, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) return res.status(400).json({ message: "Invalid account ID" });
      const activities = await storage.getActivityLogsByAccount(accountId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/referral-accounts/:id/activities", isAuthenticated, canAccessActivities, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) return res.status(400).json({ message: "Invalid account ID" });
      const userId = req.user.claims.sub;
      const validatedData = insertActivityLogSchema.parse({
        ...req.body,
        accountId,
        userId,
        companyId,
        activityDate: new Date(req.body.activityDate),
      });
      const activity = await storage.createActivityLog(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.get("/api/activities", isAuthenticated, canAccessActivities, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const userId = req.user.claims.sub;
      const activities = await storage.getActivityLogsByUser(userId, companyId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Notification Settings routes
  app.get("/api/notification-settings", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const settings = await storage.getNotificationSettings(companyId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.post("/api/notification-settings", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const validatedData = insertNotificationSettingSchema.parse({
        ...req.body,
        companyId,
      });
      const setting = await storage.upsertNotificationSetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error saving notification setting:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save notification setting" });
    }
  });

  // Pre-Assessment Form Routes
  // Pre-Cert Form
  // Pre-assessment forms - protected by RBAC
  app.get("/api/inquiries/:id/pre-cert-form", isAuthenticated, canAccessPreAssessment, async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      const form = await storage.getPreCertForm(inquiryId);
      res.json(form || null);
    } catch (error) {
      console.error("Error fetching pre-cert form:", error);
      res.status(500).json({ message: "Failed to fetch pre-cert form" });
    }
  });

  app.put("/api/inquiries/:id/pre-cert-form", isAuthenticated, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      // Get the inquiry to find its companyId
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const userId = req.user.claims.sub;
      const validatedData = insertPreCertFormSchema.parse({
        companyId,
        inquiryId,
        formData: req.body.formData || {},
        isComplete: req.body.isComplete || "no",
        completedAt: req.body.isComplete === "yes" ? new Date() : null,
        completedBy: req.body.isComplete === "yes" ? userId : null,
      });
      const form = await storage.upsertPreCertForm(validatedData);
      res.json(form);
    } catch (error) {
      console.error("Error saving pre-cert form:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save pre-cert form" });
    }
  });

  // Nursing Assessment Form
  app.get("/api/inquiries/:id/nursing-assessment", isAuthenticated, canAccessPreAssessment, async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      const form = await storage.getNursingAssessmentForm(inquiryId);
      res.json(form || null);
    } catch (error) {
      console.error("Error fetching nursing assessment form:", error);
      res.status(500).json({ message: "Failed to fetch nursing assessment form" });
    }
  });

  app.put("/api/inquiries/:id/nursing-assessment", isAuthenticated, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      // Get the inquiry to find its companyId
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const userId = req.user.claims.sub;
      const validatedData = insertNursingAssessmentFormSchema.parse({
        companyId,
        inquiryId,
        formData: req.body.formData || {},
        isComplete: req.body.isComplete || "no",
        completedAt: req.body.isComplete === "yes" ? new Date() : null,
        completedBy: req.body.isComplete === "yes" ? userId : null,
      });
      const form = await storage.upsertNursingAssessmentForm(validatedData);
      res.json(form);
    } catch (error) {
      console.error("Error saving nursing assessment form:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save nursing assessment form" });
    }
  });

  // Pre-Screening Form
  app.get("/api/inquiries/:id/pre-screening", isAuthenticated, canAccessPreAssessment, async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      const form = await storage.getPreScreeningForm(inquiryId);
      res.json(form || null);
    } catch (error) {
      console.error("Error fetching pre-screening form:", error);
      res.status(500).json({ message: "Failed to fetch pre-screening form" });
    }
  });

  app.put("/api/inquiries/:id/pre-screening", isAuthenticated, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      // Get the inquiry to find its companyId
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const userId = req.user.claims.sub;
      const validatedData = insertPreScreeningFormSchema.parse({
        companyId,
        inquiryId,
        formData: req.body.formData || {},
        isComplete: req.body.isComplete || "no",
        completedAt: req.body.isComplete === "yes" ? new Date() : null,
        completedBy: req.body.isComplete === "yes" ? userId : null,
      });
      const form = await storage.upsertPreScreeningForm(validatedData);
      res.json(form);
    } catch (error) {
      console.error("Error saving pre-screening form:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save pre-screening form" });
    }
  });

  // Forms Status (all three forms completion status)
  app.get("/api/inquiries/:id/forms-status", isAuthenticated, canAccessPreAssessment, async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      const status = await storage.getFormsStatus(inquiryId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching forms status:", error);
      res.status(500).json({ message: "Failed to fetch forms status" });
    }
  });

  // ========================
  // BILLING ENDPOINTS (Admin only)
  // ========================

  // Owner email that gets free access (only pays AI fees)
  // Set via environment variable for security
  const OWNER_EXEMPT_EMAIL = process.env.BILLING_EXEMPT_EMAIL || "";

  // Get billing account status
  app.get("/api/billing", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;

      // Check if this is the owner's exempt account
      const userEmail = req.user?.email?.toLowerCase();
      const isOwnerExempt = userEmail === OWNER_EXEMPT_EMAIL.toLowerCase();

      let billingAccount = await storage.getBillingAccount(companyId);
      
      // Create trial account if doesn't exist
      if (!billingAccount) {
        const { calculateTrialEndDate } = await import("./authorizeNet");
        // Owner gets permanent active status, others get trial
        billingAccount = await storage.createBillingAccount({
          companyId,
          status: isOwnerExempt ? "active" : "trial",
          trialStartDate: isOwnerExempt ? null : new Date(),
          trialEndDate: isOwnerExempt ? null : calculateTrialEndDate(),
          planType: isOwnerExempt ? "annual" : null,
        });
      } else if (isOwnerExempt && billingAccount.status !== "active") {
        // Ensure owner account stays active
        billingAccount = await storage.updateBillingAccount(billingAccount.id, {
          status: "active",
          planType: "annual",
          trialEndDate: null,
        });
      }

      // Get active user count
      const activeUserCount = await storage.getActiveUserCount(companyId);

      // Check if Authorize.net is configured
      const { isAuthorizeNetConfigured } = await import("./authorizeNet");
      const paymentConfigured = isAuthorizeNetConfigured();

      res.json({
        billingAccount,
        activeUserCount,
        isConfigured: paymentConfigured,
        isOwnerExempt,
      });
    } catch (error) {
      console.error("Error fetching billing account:", error);
      res.status(500).json({ message: "Failed to fetch billing account" });
    }
  });

  // Get Accept Hosted form token for payment method
  app.post("/api/billing/payment-form-token", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;

      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const billingAccount = await storage.getBillingAccount(companyId);
      const { getAcceptHostedFormToken, isAuthorizeNetConfigured } = await import("./authorizeNet");

      if (!isAuthorizeNetConfigured()) {
        return res.status(400).json({ message: "Payment system not configured" });
      }

      const baseUrl = req.headers.origin || `https://${req.headers.host}`;
      
      const result = await getAcceptHostedFormToken({
        customerId: companyId.toString(),
        customerEmail: company.billingEmail || "billing@example.com",
        returnUrl: `${baseUrl}/settings?payment=success`,
        cancelUrl: `${baseUrl}/settings?payment=cancelled`,
        existingCustomerProfileId: billingAccount?.authNetCustomerProfileId || undefined,
      });

      res.json(result);
    } catch (error) {
      console.error("Error getting payment form token:", error);
      res.status(500).json({ message: "Failed to get payment form" });
    }
  });

  // Start or update subscription
  app.post("/api/billing/subscribe", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;

      const { planType } = req.body;
      if (!planType || !["monthly", "annual"].includes(planType)) {
        return res.status(400).json({ message: "Invalid plan type" });
      }

      const billingAccount = await storage.getBillingAccount(companyId);
      if (!billingAccount) {
        return res.status(400).json({ message: "Billing account not found" });
      }

      if (!billingAccount.authNetCustomerProfileId || !billingAccount.authNetPaymentProfileId) {
        return res.status(400).json({ message: "Please add a payment method first" });
      }

      const { createSubscription, isAuthorizeNetConfigured } = await import("./authorizeNet");
      
      if (!isAuthorizeNetConfigured()) {
        return res.status(400).json({ message: "Payment system not configured" });
      }

      const activeUserCount = await storage.getActiveUserCount(companyId);

      const result = await createSubscription({
        customerProfileId: billingAccount.authNetCustomerProfileId,
        paymentProfileId: billingAccount.authNetPaymentProfileId,
        planType,
        activeUserCount,
        companyId,
      });

      // Calculate next billing date
      const nextBillingDate = new Date();
      if (planType === "monthly") {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      } else {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      }

      // Update billing account
      const updatedAccount = await storage.updateBillingAccount(companyId, {
        status: "active",
        planType,
        subscriptionStartDate: new Date(),
        nextBillingDate,
        authNetBaseSubscriptionId: result.subscriptionId,
        activeUserCount,
        basePriceCents: planType === "monthly" ? 9900 : 99900,
        perUserPriceCents: planType === "monthly" ? 2500 : 25000,
      });

      // Log billing event
      await storage.createBillingEvent({
        companyId,
        eventType: "subscription_created",
        eventSource: "admin",
        authNetSubscriptionId: result.subscriptionId,
        rawPayload: { planType, activeUserCount, amountDollars: result.amountDollars },
        processed: "yes",
        processedAt: new Date(),
      });

      res.json(updatedAccount);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create subscription" });
    }
  });

  // Cancel subscription
  app.post("/api/billing/cancel", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;

      const billingAccount = await storage.getBillingAccount(companyId);
      if (!billingAccount) {
        return res.status(400).json({ message: "Billing account not found" });
      }

      if (billingAccount.status !== "active") {
        return res.status(400).json({ message: "No active subscription to cancel" });
      }

      const { cancelSubscription, isAuthorizeNetConfigured } = await import("./authorizeNet");

      if (isAuthorizeNetConfigured() && billingAccount.authNetBaseSubscriptionId) {
        await cancelSubscription(billingAccount.authNetBaseSubscriptionId);
      }

      // Update billing account
      const updatedAccount = await storage.updateBillingAccount(companyId, {
        status: "cancelled",
        cancelledAt: new Date(),
      });

      // Log billing event
      await storage.createBillingEvent({
        companyId,
        eventType: "subscription_cancelled",
        eventSource: "admin",
        authNetSubscriptionId: billingAccount.authNetBaseSubscriptionId,
        processed: "yes",
        processedAt: new Date(),
      });

      res.json(updatedAccount);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Get billing invoices
  app.get("/api/billing/invoices", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;

      const invoices = await storage.getBillingInvoices(companyId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Update payment method callback (called after Accept Hosted success)
  app.post("/api/billing/payment-method-updated", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;

      const { customerProfileId, paymentProfileId, cardLast4, cardType, cardExpMonth, cardExpYear } = req.body;

      const updatedAccount = await storage.updateBillingAccount(companyId, {
        authNetCustomerProfileId: customerProfileId,
        authNetPaymentProfileId: paymentProfileId,
        cardLast4,
        cardType,
        cardExpMonth,
        cardExpYear,
      });

      // Log billing event
      await storage.createBillingEvent({
        companyId,
        eventType: "payment_method_updated",
        eventSource: "admin",
        processed: "yes",
        processedAt: new Date(),
      });

      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ message: "Failed to update payment method" });
    }
  });

  // Authorize.net Webhook endpoint (public, validated by signature)
  app.post("/api/webhooks/authorize-net", async (req, res) => {
    try {
      const signature = req.headers["x-anet-signature"] as string;
      const payload = JSON.stringify(req.body);

      const { validateWebhookSignature } = await import("./authorizeNet");
      
      if (!validateWebhookSignature(payload, signature || "")) {
        console.error("Invalid Authorize.net webhook signature");
        return res.status(401).json({ message: "Invalid signature" });
      }

      const eventType = req.body.eventType;
      const webhookData = req.body.payload;

      console.log(`Authorize.net webhook received: ${eventType}`);

      // Log the event
      await storage.createBillingEvent({
        companyId: null, // Will be populated if we can identify the company
        eventType,
        eventSource: "authorize_net",
        authNetTransactionId: webhookData?.id || null,
        authNetSubscriptionId: webhookData?.subscriptionId || null,
        rawPayload: req.body,
        processed: "no",
      });

      // Handle specific event types
      if (eventType === "net.authorize.payment.authcapture.created") {
        // Payment successful - could update invoice status
        console.log("Payment successful:", webhookData?.id);
      } else if (eventType === "net.authorize.payment.fraud.declined") {
        // Payment declined
        console.log("Payment declined:", webhookData?.id);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Error processing Authorize.net webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  return httpServer;
}

// Helper function to map CTM tracking sources to our referral sources
function mapCTMSourceToReferral(ctmSource: string | undefined): string {
  if (!ctmSource) return "other";
  
  const source = ctmSource.toLowerCase();
  
  if (source.includes("google") || source.includes("adwords") || source.includes("ppc")) {
    return "google";
  }
  if (source.includes("facebook") || source.includes("fb")) {
    return "facebook";
  }
  if (source.includes("instagram") || source.includes("ig")) {
    return "instagram";
  }
  if (source.includes("website") || source.includes("organic") || source.includes("seo")) {
    return "website";
  }
  if (source.includes("referral") || source.includes("partner")) {
    return "referral_partner";
  }
  if (source.includes("alumni")) {
    return "alumni_referral";
  }
  if (source.includes("word") || source.includes("mouth")) {
    return "word_of_mouth";
  }
  
  return "other";
}
