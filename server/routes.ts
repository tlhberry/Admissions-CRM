import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, type InquiryFilters } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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
} from "@shared/schema";
import { z } from "zod";
import { emailService } from "./emailService";
import multer from "multer";
import path from "path";
import fs from "fs";
import OpenAI from "openai";

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

  // Auth routes
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

  // Inquiry routes
  app.get("/api/inquiries", isAuthenticated, async (req: any, res) => {
    try {
      const inquiries = await storage.getAllInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Search/filter inquiries
  app.get("/api/inquiries/search", isAuthenticated, async (req: any, res) => {
    try {
      const filters: InquiryFilters = {
        search: req.query.search as string | undefined,
        stage: req.query.stage as string | undefined,
        referralSource: req.query.referralSource as string | undefined,
        insuranceProvider: req.query.insuranceProvider as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const inquiries = await storage.searchInquiries(filters);
      res.json(inquiries);
    } catch (error) {
      console.error("Error searching inquiries:", error);
      res.status(500).json({ message: "Failed to search inquiries" });
    }
  });

  app.get("/api/inquiries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid inquiry ID" });
      }

      const inquiry = await storage.getInquiry(id);
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      res.json(inquiry);
    } catch (error) {
      console.error("Error fetching inquiry:", error);
      res.status(500).json({ message: "Failed to fetch inquiry" });
    }
  });

  app.post("/api/inquiries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertInquirySchema.parse({
        ...req.body,
        userId,
      });

      const inquiry = await storage.createInquiry(validatedData);
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

  app.patch("/api/inquiries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid inquiry ID" });
      }

      // Get the current inquiry to check for stage change
      const currentInquiry = await storage.getInquiry(id);
      
      // Convert date strings to Date objects
      const body = { ...req.body };
      if (body.vobCompletedAt && typeof body.vobCompletedAt === 'string') {
        body.vobCompletedAt = new Date(body.vobCompletedAt);
      }
      if (body.preAssessmentDate && typeof body.preAssessmentDate === 'string') {
        body.preAssessmentDate = new Date(body.preAssessmentDate);
      }
      
      const validatedData = updateInquirySchema.parse(body);
      const inquiry = await storage.updateInquiry(id, validatedData);

      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

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

  app.delete("/api/inquiries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid inquiry ID" });
      }

      await storage.deleteInquiry(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      res.status(500).json({ message: "Failed to delete inquiry" });
    }
  });

  // Manual staff notification endpoint - sends email to all staff about new admission
  app.post("/api/inquiries/:id/notify-staff", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      const inquiry = await storage.getInquiry(id);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      
      // Get notification settings for scheduled stage
      const notificationSettings = await storage.getNotificationSettings();
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
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      const inquiry = await storage.getInquiry(id);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      
      // Get notification settings for admitted stage
      const notificationSettings = await storage.getNotificationSettings();
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
      await storage.updateInquiry(id, { arrivalEmailSentAt: new Date() });
      
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

  // CallTrackingMetrics Webhook Endpoint
  // This endpoint receives incoming call data from CallTrackingMetrics
  // 
  // WEBHOOK URL FORMAT:
  // https://your-app.replit.app/api/webhooks/ctm
  // 
  // If using a secret for security, add it as a query parameter or header:
  // URL: https://your-app.replit.app/api/webhooks/ctm?secret=YOUR_SECRET
  // Header: x-ctm-secret: YOUR_SECRET
  //
  // CTM FIELD MAPPING:
  // CTM sends these fields which we capture:
  // - caller_name / caller_id -> callerName
  // - caller_number / ani -> phoneNumber
  // - tracking_source / source -> referralSource (mapped to our categories)
  // - call_id -> ctmCallId
  // - tracking_number -> ctmTrackingNumber
  // - duration / talk_time -> callDuration
  // - recording_url / recording -> callRecordingUrl
  //
  app.post("/api/webhooks/ctm", async (req, res) => {
    try {
      // Validate webhook secret if configured
      const webhookSecret = process.env.CTM_WEBHOOK_SECRET;
      if (webhookSecret) {
        const providedSecret = req.headers["x-ctm-secret"] || req.query.secret;
        if (providedSecret !== webhookSecret) {
          console.log("CTM webhook: Invalid secret provided");
          return res.status(401).json({ message: "Unauthorized" });
        }
      }

      const callData = req.body;
      console.log("CTM webhook received:", JSON.stringify(callData, null, 2));

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
      
      const initialNotes = [
        "Auto-created from CallTrackingMetrics webhook.",
        ctmCallId ? `Call ID: ${ctmCallId}` : null,
        ctmTrackingNumber ? `Tracking Number: ${ctmTrackingNumber}` : null,
        callDuration ? `Call Duration: ${callDuration} seconds` : null,
        callData.call_time || callData.start_time ? `Call Time: ${callData.call_time || callData.start_time}` : null,
        callData.city || callData.state ? `Location: ${[callData.city, callData.state].filter(Boolean).join(", ")}` : null,
      ].filter(Boolean).join("\n");

      const inquiry = await storage.createInquiry({
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
      });

      console.log(`CTM webhook: Created inquiry #${inquiry.id} for caller ${phoneNumber}`);
      res.status(201).json({ 
        success: true, 
        inquiryId: inquiry.id,
        message: "Inquiry created from CTM webhook",
        caller: phoneNumber,
      });
    } catch (error) {
      console.error("CTM webhook error:", error);
      res.status(500).json({ message: "Failed to process CTM webhook" });
    }
  });

  // Test endpoint to simulate CTM webhook (for testing purposes)
  // This allows you to test the webhook integration without waiting for real calls
  app.post("/api/webhooks/ctm/test", isAuthenticated, async (req, res) => {
    try {
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
      });

      console.log(`CTM test webhook: Created inquiry #${inquiry.id} for caller ${phoneNumber}`);
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

  // Users route (for BD rep dropdown)
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Referral Account routes
  app.get("/api/referral-accounts", isAuthenticated, async (req, res) => {
    try {
      const accounts = await storage.getAllReferralAccounts();
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching referral accounts:", error);
      res.status(500).json({ message: "Failed to fetch referral accounts" });
    }
  });

  app.post("/api/referral-accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertReferralAccountSchema.parse({
        ...req.body,
        createdBy: userId,
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

  app.get("/api/referral-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid account ID" });
      const account = await storage.getReferralAccount(id);
      if (!account) return res.status(404).json({ message: "Account not found" });
      res.json(account);
    } catch (error) {
      console.error("Error fetching referral account:", error);
      res.status(500).json({ message: "Failed to fetch referral account" });
    }
  });

  app.patch("/api/referral-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid account ID" });
      const account = await storage.updateReferralAccount(id, req.body);
      if (!account) return res.status(404).json({ message: "Account not found" });
      res.json(account);
    } catch (error) {
      console.error("Error updating referral account:", error);
      res.status(500).json({ message: "Failed to update referral account" });
    }
  });

  app.delete("/api/referral-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid account ID" });
      await storage.deleteReferralAccount(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting referral account:", error);
      res.status(500).json({ message: "Failed to delete referral account" });
    }
  });

  // Referral Contact routes
  app.get("/api/referral-accounts/:id/contacts", isAuthenticated, async (req, res) => {
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

  app.post("/api/referral-accounts/:id/contacts", isAuthenticated, async (req, res) => {
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

  app.patch("/api/referral-contacts/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/referral-contacts/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/referral-accounts/:id/activities", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) return res.status(400).json({ message: "Invalid account ID" });
      const activities = await storage.getActivityLogsByAccount(accountId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/referral-accounts/:id/activities", isAuthenticated, async (req: any, res) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) return res.status(400).json({ message: "Invalid account ID" });
      const userId = req.user.claims.sub;
      const validatedData = insertActivityLogSchema.parse({
        ...req.body,
        accountId,
        userId,
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

  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activities = await storage.getActivityLogsByUser(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Notification Settings routes
  app.get("/api/notification-settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getNotificationSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.post("/api/notification-settings", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertNotificationSettingSchema.parse(req.body);
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
  app.get("/api/inquiries/:id/pre-cert-form", isAuthenticated, async (req, res) => {
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
      const userId = req.user.claims.sub;
      const validatedData = insertPreCertFormSchema.parse({
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
  app.get("/api/inquiries/:id/nursing-assessment", isAuthenticated, async (req, res) => {
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
      const userId = req.user.claims.sub;
      const validatedData = insertNursingAssessmentFormSchema.parse({
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
  app.get("/api/inquiries/:id/pre-screening", isAuthenticated, async (req, res) => {
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
      const userId = req.user.claims.sub;
      const validatedData = insertPreScreeningFormSchema.parse({
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
  app.get("/api/inquiries/:id/forms-status", isAuthenticated, async (req, res) => {
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
