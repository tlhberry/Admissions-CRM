import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, type InquiryFilters } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertInquirySchema, updateInquirySchema, levelOfCareDisplayNames, type LevelOfCare } from "@shared/schema";
import { z } from "zod";
import { emailService } from "./emailService";

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
      
      const validatedData = updateInquirySchema.parse(req.body);
      const inquiry = await storage.updateInquiry(id, validatedData);

      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      // Send email notification when inquiry is scheduled
      if (validatedData.stage === "scheduled" && currentInquiry?.stage !== "scheduled") {
        // Non-blocking email send
        emailService.sendAdmissionScheduledNotification({
          clientName: inquiry.clientName || inquiry.callerName || "Unknown Client",
          phoneNumber: inquiry.phoneNumber || "Not provided",
          email: inquiry.email || undefined,
          expectedAdmitDate: inquiry.expectedAdmitDate || "Not set",
          levelOfCare: inquiry.levelOfCare 
            ? levelOfCareDisplayNames[inquiry.levelOfCare as LevelOfCare] || inquiry.levelOfCare 
            : "Not specified",
          insuranceProvider: inquiry.insuranceProvider || undefined,
          insurancePolicyId: inquiry.insurancePolicyId || undefined,
          schedulingNotes: inquiry.schedulingNotes || undefined,
        }).catch(err => console.error("Failed to send scheduled notification:", err));
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

  // CallTrackingMetrics Webhook Endpoint
  // This endpoint receives incoming call data from CallTrackingMetrics
  // Webhook URL: https://your-app.replit.app/api/webhooks/ctm
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
      // CTM typically sends: caller_number, caller_name, tracking_source, call_start_time, etc.
      const callerName = callData.caller_name || callData.caller_id || "Incoming Call";
      const phoneNumber = callData.caller_number || callData.caller_id || callData.ani || "";
      const referralSource = mapCTMSourceToReferral(callData.tracking_source || callData.source);
      const referralDetails = callData.tracking_source || callData.source || "";
      const initialNotes = `Auto-created from CallTrackingMetrics webhook.\nCall ID: ${callData.call_id || "N/A"}\nTracking Number: ${callData.tracking_number || "N/A"}\nCall Duration: ${callData.duration || "N/A"} seconds`;

      const inquiry = await storage.createInquiry({
        callerName,
        phoneNumber,
        referralSource,
        referralDetails,
        initialNotes,
        stage: "inquiry",
      });

      console.log(`CTM webhook: Created inquiry #${inquiry.id} for caller ${phoneNumber}`);
      res.status(201).json({ 
        success: true, 
        inquiryId: inquiry.id,
        message: "Inquiry created from CTM webhook" 
      });
    } catch (error) {
      console.error("CTM webhook error:", error);
      res.status(500).json({ message: "Failed to process CTM webhook" });
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
