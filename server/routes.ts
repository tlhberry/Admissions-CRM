import { registerAiRoutes } from "./aiRoutes";
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
  insertInquiryStageStatusSchema,
  stageOrder,
  stageDisplayNames,
  pipelineStages,
  type User,
  normalizePhoneE164,
} from "@shared/schema";
import PDFDocument from "pdfkit";
import archiver from "archiver";
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

// Cost for clinical justification generation
const AI_CLINICAL_JUSTIFICATION_COST_CENTS = 15; // ~$0.15 per report

// Interface for clinical justification data with all 6 ASAM dimensions
interface ClinicalJustificationData {
  // Dimension 1: Acute Intoxication/Withdrawal
  dimension1Withdrawal: string;
  // Dimension 2: Biomedical Conditions
  dimension2Biomedical: string;
  // Dimension 3: Emotional/Behavioral/Cognitive
  dimension3Psychiatric: string;
  // Dimension 4: Readiness to Change
  dimension4Readiness: string;
  // Dimension 5: Relapse/Continued Use Potential
  dimension5RelapsePotential: string;
  // Dimension 6: Recovery Environment
  dimension6Environment: string;
  // Overall summaries
  familyHistoryAnalysis: string;
  medicalNecessitySummary: string;
  recommendedDays: number;
  levelOfCareJustification: string;
}

// Generate AI-powered clinical justifications using xAI Grok
async function generateClinicalJustifications(
  inquiry: any,
  preCertData: Record<string, any> | null,
  nursingData: Record<string, any> | null,
  preScreeningData: Record<string, any> | null,
  companyId: number
): Promise<ClinicalJustificationData | null> {
  try {
    // Check if AI is available
    const aiStatus = await isAiAvailable(companyId);
    if (!aiStatus.available) {
      console.log("AI not available for clinical justifications");
      return null;
    }

    const grok = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });

    // Build comprehensive clinical data summary
    const clinicalSummary = {
      clientName: inquiry.clientName || inquiry.callerName || "Unknown",
      dateOfBirth: inquiry.dateOfBirth,
      presentingProblems: inquiry.presentingProblems,
      seekingSudTreatment: inquiry.seekingSudTreatment,
      seekingMentalHealth: inquiry.seekingMentalHealth,
      seekingEatingDisorder: inquiry.seekingEatingDisorder,
      
      // Substance history
      substanceHistory: preCertData?.substanceHistory || [],
      primarySubstance: preScreeningData?.primarySubstance,
      lastUseDate: preScreeningData?.lastUseDate,
      substanceUseHistory: preScreeningData?.substanceUseHistory,
      
      // Withdrawal data
      withdrawalSymptoms: preCertData?.withdrawalSymptoms || [],
      withdrawalNotes: preCertData?.withdrawalNotes,
      severityOfIllness: preCertData?.severityOfIllness,
      
      // Medical conditions
      medicalConditions: preCertData?.medicalConditions,
      medications: preCertData?.medications || preScreeningData?.currentMedications,
      allergies: preCertData?.allergies || nursingData?.allergies,
      
      // Nursing vitals
      bloodPressure: nursingData?.bloodPressure,
      pulse: nursingData?.pulse,
      temperature: nursingData?.temperature,
      painLevel: nursingData?.painLevel,
      
      // Psychiatric history
      mentalHealthHistory: preCertData?.mentalHealthHistory || preScreeningData?.mentalHealthDiagnoses,
      suicidalIdeation: preCertData?.suicidalIdeation,
      homicidalIdeation: preCertData?.homicidalIdeation,
      suicideRiskLevel: nursingData?.suicideRiskLevel,
      psychiatricHospitalizations: preScreeningData?.psychiatricHospitalizations,
      
      // Psychosocial
      psychosocialNotes: preCertData?.psychosocialNotes,
      familyHistory: preCertData?.familyHistory,
      motivationLevel: preScreeningData?.motivationLevel,
      barriers: preScreeningData?.barriers,
      employmentStatus: preScreeningData?.employmentStatus,
      livingArrangements: preScreeningData?.livingArrangements,
      
      // Legal issues
      hasLegalIssues: preScreeningData?.hasLegalIssues,
      hasPendingCharges: preScreeningData?.hasPendingCharges,
      isProbationParole: preScreeningData?.isProbationParole,
      legalDetails: preScreeningData?.legalDetails,
      legalIssues: preCertData?.legalIssues,
      
      // Treatment history
      treatmentHistory: preCertData?.treatmentHistory || preScreeningData?.previousTreatment,
      levelOfCare: inquiry.levelOfCare || preScreeningData?.programRecommendation,
    };

    const prompt = `You are a clinical documentation specialist for addiction treatment utilization review. Your task is to EXPAND and ELABORATE on patient data using ALL 6 ASAM CRITERIA DIMENSIONS with evidence-based clinical terminology. Generate detailed, comprehensive clinical narratives that maximize medical necessity documentation for insurance review and justify extended residential/detox treatment.

CRITICAL RULES:
1. NEVER fabricate symptoms, conditions, or facts not present in the data
2. ALWAYS elaborate and expand on documented data with clinical terminology
3. Use specific medical terminology to describe symptoms
4. Connect ALL documented factors to clinical significance and treatment necessity
5. Every output field should be LONGER and MORE DETAILED than the raw input data
6. Address ALL 6 ASAM dimensions comprehensively

PATIENT DATA:
${JSON.stringify(clinicalSummary, null, 2)}

Generate a JSON response with ALL 6 ASAM DIMENSIONS plus summaries. Each field must contain detailed clinical narratives:

{
  "dimension1Withdrawal": "ASAM DIMENSION 1: ACUTE INTOXICATION AND/OR WITHDRAWAL POTENTIAL (5-7 sentences MINIMUM)
    For each documented withdrawal symptom, provide clinical elaboration:
    - Tremors → 'fine motor tremors indicative of CNS hyperexcitability and early withdrawal syndrome, with risk of progression to generalized tremors and delirium tremens without medical monitoring'
    - Anxiety → 'acute anxiety with physiological manifestations including tachycardia, diaphoresis, and hypervigilance, consistent with autonomic nervous system dysregulation during active withdrawal'
    - Sweating/diaphoresis → 'profuse diaphoresis reflecting sympathetic nervous system overactivation, a hallmark of acute withdrawal syndrome requiring fluid and electrolyte management'
    - Nausea/vomiting → 'gastrointestinal disturbance with nausea and emesis, creating risk of electrolyte imbalance, dehydration, and aspiration requiring nursing monitoring'
    - Insomnia → 'severe sleep architecture disruption with rebound insomnia, impairing cognitive function and emotional regulation, heightening relapse vulnerability'
    Reference last use date to establish withdrawal timeline. Use terms: 'physiological dependence', 'kindling phenomenon', 'delirium tremens risk', 'autonomic instability', 'seizure threshold lowering', 'CIWA protocol indicated'. Explain why 24-hour medical monitoring is essential.",
  
  "dimension2Biomedical": "ASAM DIMENSION 2: BIOMEDICAL CONDITIONS AND COMPLICATIONS (5-7 sentences MINIMUM)
    For each documented medical condition, provide clinical context:
    - Asthma → 'respiratory comorbidity including bronchial asthma requiring maintenance therapy with inhaled corticosteroids, with stress-exacerbated bronchospasm risk during withdrawal period'
    - Hypertension → 'cardiovascular comorbidity with elevated blood pressure requiring monitoring during withdrawal, as autonomic instability may precipitate hypertensive crisis'
    - Chronic pain → 'chronic pain syndrome complicating treatment as patient may have developed opioid tolerance and cross-tolerance, requiring specialized pain management protocol'
    - Any condition → elaborate on medication interactions with substances, how condition complicates detox, and necessity for medical supervision
    Emphasize need for 24-hour nursing and physician availability.",
  
  "dimension3Psychiatric": "ASAM DIMENSION 3: EMOTIONAL, BEHAVIORAL, OR COGNITIVE CONDITIONS (5-7 sentences MINIMUM)
    For each documented psychiatric condition:
    - Panic attacks → 'comorbid panic disorder with recurrent panic attacks characterized by acute sympathetic surge, chest tightness, dyspnea, and catastrophic cognitions, complicating withdrawal management and requiring psychiatric stabilization with possible benzodiazepine taper coordination'
    - Depression → 'major depressive disorder with neurovegetative features including anhedonia, psychomotor changes, and possible suicidal ideation requiring safety monitoring in structured setting'
    - Anxiety → 'generalized anxiety disorder with chronic worry, muscle tension, and sleep disturbance, likely to worsen during acute withdrawal and early recovery'
    - Trauma/PTSD → 'trauma history with hyperarousal symptoms potentially triggered by treatment environment, requiring trauma-informed care approach'
    Emphasize dual-diagnosis complexity requiring integrated treatment.",
  
  "dimension4Readiness": "ASAM DIMENSION 4: READINESS TO CHANGE / TREATMENT ACCEPTANCE (4-6 sentences MINIMUM)
    Assess documented motivation level and treatment history:
    - Prior treatment failures → 'patient has history of [X] previous treatment attempts at lower levels of care, demonstrating that outpatient and IOP settings have been insufficient to establish sustained recovery'
    - Current motivation → elaborate on patient's stated readiness, acknowledgment of problem severity, and willingness to engage
    - Ambivalence → 'patient demonstrates mixed motivation typical of early recovery, requiring structured environment to maintain engagement and prevent premature departure'
    - External pressures → 'legal mandates, family pressure, or employment contingencies creating external motivation that requires structured setting to convert to internalized recovery motivation'
    Conclude why residential level needed to overcome ambivalence and build intrinsic motivation.",
  
  "dimension5RelapsePotential": "ASAM DIMENSION 5: RELAPSE, CONTINUED USE, OR CONTINUED PROBLEM POTENTIAL (6-8 sentences MINIMUM - THIS IS CRITICAL)
    THIS DIMENSION IS ESSENTIAL FOR JUSTIFYING EXTENDED RESIDENTIAL STAY. Elaborate extensively on ALL relapse risk factors:
    - Family history of addiction → 'patient reports family history of heavy alcohol use/substance dependence in first-degree relatives, indicating genetic predisposition and intergenerational transmission of addictive disorders, with epigenetic vulnerability increasing relapse risk'
    - Legal charges from intoxicated incident → 'pending legal charges stemming from [accident/incident while intoxicated] create dual pressure: ongoing stressor elevating relapse risk AND potential legal consequences providing external motivation for treatment engagement; however, legal stress itself is known relapse precipitant'
    - Unemployment → 'current unemployment status results in loss of structured daily activities, removal of prosocial occupational identity, financial stress, and excessive unstructured time - all evidence-based relapse precipitants requiring residential structure to address'
    - Failed prior treatment → 'history of relapse following previous treatment episodes demonstrates patient lacks sufficient coping skills and relapse prevention strategies to maintain sobriety without intensive intervention'
    - Cravings/triggers → 'patient reports [specific triggers] in home environment that will precipitate relapse if discharged prematurely'
    - Social network → 'peer group consists primarily of active substance users, creating high-risk social environment incompatible with early recovery'
    Use terms: 'high relapse potential', 'inadequate coping repertoire', 'environmental triggers', 'insufficient recovery capital', 'requires extended treatment duration to establish neurobiological stabilization'",
  
  "dimension6Environment": "ASAM DIMENSION 6: RECOVERY/LIVING ENVIRONMENT (5-7 sentences MINIMUM)
    Elaborate on ALL environmental barriers to recovery:
    - Housing instability → 'unstable or unsafe living arrangements preclude establishment of stable recovery routine and eliminate possibility of successful outpatient treatment'
    - Enabling family → 'family system demonstrates enabling behaviors and/or expressed criticism that would undermine recovery efforts if patient returned prematurely'
    - Access to substances → 'home environment has ready access to substances and/or drug-using peers, creating unacceptable relapse risk'
    - Lack of support → 'patient lacks sober support network and has not established connection with recovery community (AA/NA), requiring residential setting to build recovery capital'
    - Geographic isolation → 'limited access to outpatient treatment services in patient's community necessitates residential treatment'
    Emphasize that recovery environment is incompatible with successful outpatient treatment.",
  
  "familyHistoryAnalysis": "3-4 sentences on family history significance for relapse risk:
    - 'Patient reports family history of [specific substances/conditions in parents/siblings], indicating genetic predisposition with estimated 40-60% heritability for substance use disorders'
    - 'Intergenerational transmission patterns suggest both genetic vulnerability and learned maladaptive coping mechanisms acquired through family modeling'
    - 'This genetic loading significantly increases patient's risk for chronic, relapsing course and necessitates intensive, extended intervention to establish stable recovery'
    If no family history documented, note assessment is pending.",
  
  "medicalNecessitySummary": "COMPREHENSIVE MEDICAL NECESSITY (8-10 sentences MINIMUM)
    Synthesize all 6 ASAM dimensions into medical necessity justification:
    - 'Based on multidimensional ASAM assessment, patient meets criteria for [Residential/Detox] level of care'
    - Cite specific dimension findings: 'Dimension 1: active withdrawal requiring medical monitoring; Dimension 2: [medical conditions]; Dimension 3: [psychiatric comorbidities]; Dimension 4: [readiness factors]; Dimension 5: HIGH relapse potential due to [family history, legal issues, unemployment]; Dimension 6: [environment barriers]'
    - 'Patient has demonstrated inability to maintain sobriety in less restrictive settings, with [X] prior treatment failures at outpatient/IOP level'
    - 'The constellation of withdrawal severity, medical complexity, psychiatric comorbidity, and psychosocial destabilization necessitates 24-hour structured programming with continuous nursing availability'
    - 'Extended length of stay is medically necessary to achieve neurobiological stabilization, develop relapse prevention skills, address co-occurring conditions, and establish linkage to continuing care'
    - State recommended length of stay with clinical rationale
    - 'Discharge to lower level of care is contraindicated until patient demonstrates [specific milestones]'",
  
  "recommendedDays": "Integer 25-30. Base on cumulative severity across all dimensions:
    - 25 for moderate presentations with some protective factors
    - 28 for polysubstance dependence, psychiatric comorbidity, or significant Dimension 5/6 barriers
    - 30 for complex presentations with medical complications, high suicide risk, severe trauma, or multiple failed prior treatments",
  
  "levelOfCareJustification": "5-6 sentences. Explicitly state why lower levels of care are contraindicated:
    - 'Outpatient and Intensive Outpatient treatment are clinically contraindicated given [cite specific Dimension 5 and 6 barriers]'
    - 'Patient requires 24-hour nursing availability for withdrawal monitoring, medication management, and safety observation'
    - 'Residential level of care is necessary to provide structured, substance-free environment absent in patient's home setting'
    - 'Integrated dual-diagnosis programming addresses co-occurring psychiatric conditions that cannot be safely managed in outpatient setting'
    - 'Patient's high relapse potential and compromised recovery environment require residential containment to prevent treatment dropout and relapse during vulnerable early recovery period'"
}

OUTPUT REQUIREMENT: Each ASAM dimension must be comprehensively addressed with multiple sentences. Dimension 5 (Relapse Potential) is CRITICAL for justifying extended stay - elaborate extensively on family history, legal issues, unemployment, and other relapse factors. Transform brief patient data into comprehensive clinical documentation that justifies maximum appropriate length of residential treatment.`;

    const response = await grok.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        { role: "system", content: "You are a clinical documentation specialist. Respond only with valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.log("No content in clinical justification response");
      return null;
    }

    const rawJustifications = JSON.parse(content);
    
    // Validate and sanitize the response - reject empty/short strings
    const validateString = (val: any, fieldName: string): string => {
      if (typeof val !== 'string') {
        console.log(`AI output discarded - not a string for ${fieldName}`);
        return '';
      }
      const trimmed = val.trim();
      if (trimmed.length < 50) {
        console.log(`AI output discarded - too short (${trimmed.length} chars) for ${fieldName}: "${trimmed.substring(0, 100)}..."`);
        return '';
      }
      return trimmed;
    };
    
    const justifications: ClinicalJustificationData = {
      // All 6 ASAM Dimensions
      dimension1Withdrawal: validateString(rawJustifications.dimension1Withdrawal, 'dimension1Withdrawal'),
      dimension2Biomedical: validateString(rawJustifications.dimension2Biomedical, 'dimension2Biomedical'),
      dimension3Psychiatric: validateString(rawJustifications.dimension3Psychiatric, 'dimension3Psychiatric'),
      dimension4Readiness: validateString(rawJustifications.dimension4Readiness, 'dimension4Readiness'),
      dimension5RelapsePotential: validateString(rawJustifications.dimension5RelapsePotential, 'dimension5RelapsePotential'),
      dimension6Environment: validateString(rawJustifications.dimension6Environment, 'dimension6Environment'),
      // Summaries
      familyHistoryAnalysis: validateString(rawJustifications.familyHistoryAnalysis, 'familyHistoryAnalysis'),
      medicalNecessitySummary: validateString(rawJustifications.medicalNecessitySummary, 'medicalNecessitySummary'),
      recommendedDays: typeof rawJustifications.recommendedDays === 'number' && rawJustifications.recommendedDays >= 7 && rawJustifications.recommendedDays <= 45
        ? rawJustifications.recommendedDays : 28,
      levelOfCareJustification: validateString(rawJustifications.levelOfCareJustification, 'levelOfCareJustification'),
    };
    
    // Track AI usage
    await trackAiUsage(companyId, AI_CLINICAL_JUSTIFICATION_COST_CENTS);
    
    console.log(`Generated clinical justifications for inquiry ${inquiry.id}`);
    return justifications;
  } catch (error) {
    console.error("Error generating clinical justifications:", error);
    return null;
  }
}

// Helper function to transcribe call and extract data (used by CTM webhook)
async function transcribeAndExtractCallData(inquiryId: number, companyId: number, recordingUrl: string): Promise<void> {
  try {
    console.log(`Auto-transcribing call for inquiry #${inquiryId}...`);
    
    // xAI Grok API client (OpenAI-compatible)
    const grok = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });

    // Note: Audio transcription skipped - xAI doesn't have standalone STT yet
    // When xAI releases their STT API, this can be re-enabled
    console.log(`Audio transcription not available with xAI Grok for inquiry #${inquiryId}`);
    console.log(`Recording URL saved: ${recordingUrl}`);
    
    // For now, just save the recording URL without transcription
    await storage.updateInquiry(inquiryId, companyId, {
      callRecordingUrl: recordingUrl,
    });
    
    return;
  } catch (error) {
    console.error(`Error saving call recording for inquiry #${inquiryId}:`, error);
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
  registerAiRoutes(app);

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
      let company = await storage.getCompany(user.companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      // Auto-generate webhook token for legacy accounts
      if (!company.ctmWebhookToken) {
        company = await storage.updateCompany(user.companyId, {
          ctmWebhookToken: storage.generateWebhookToken(),
        }) ?? company;
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

      // xAI Grok API client (OpenAI-compatible)
      const grok = new OpenAI({
        apiKey: process.env.XAI_API_KEY,
        baseURL: "https://api.x.ai/v1",
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

      const response = await grok.chat.completions.create({
        model: "grok-2-1212",
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

    // Global search endpoint - searches across all entity types
      app.get("/api/search", isAuthenticated, async (req: any, res: Response) => {
          try {
                const companyId = await requireCompanyId(req, res);
                      if (!companyId) return;

                            const q = (req.query.q as string || "").trim();
                                  if (!q || q.length < 2) {
                                          return res.json({ leads: [], contacts: [], facilities: [], notes: [], activity: [], tasks: [] });
                                                }

                                                      const { db } = await import("./db");
                                                            const { sql, ilike, or, and, eq } = await import("drizzle-orm");
                                                                  const {
                                                                          inquiries, referralAccounts, referralContacts, activityLogs
                                                                                } = await import("../shared/schema");

                                                                                      const likeQ = `%${q}%`;

                                                                                            // Search leads (inquiries)
                                                                                                  const leadsRaw = await db
                                                                                                          .select()
                                                                                                                  .from(inquiries)
                                                                                                                          .where(
                                                                                                                                    and(
                                                                                                                                                eq(inquiries.companyId, companyId),
                                                                                                                                                            or(
                                                                                                                                                                          ilike(inquiries.clientName, likeQ),
                                                                                                                                                                                        ilike(inquiries.callerName, likeQ),
                                                                                                                                                                                                      ilike(inquiries.phoneNumber, likeQ),
                                                                                                                                                                                                                    ilike(inquiries.email, likeQ),
                                                                                                                                                                                                                                  ilike(inquiries.insuranceProvider, likeQ),
                                                                                                                                                                                                                                                ilike(inquiries.initialNotes, likeQ)
                                                                                                                                                                                                                                                            )
                                                                                                                                                                                                                                                                      )
                                                                                                                                                                                                                                                                              )
                                                                                                                                                                                                                                                                                      .limit(5);

                                                                                                                                                                                                                                                                                            // Search facilities (referral accounts)
                                                                                                                                                                                                                                                                                                  const facilitiesRaw = await db
                                                                                                                                                                                                                                                                                                          .select()
                                                                                                                                                                                                                                                                                                                  .from(referralAccounts)
                                                                                                                                                                                                                                                                                                                          .where(
                                                                                                                                                                                                                                                                                                                                    and(
                                                                                                                                                                                                                                                                                                                                                eq(referralAccounts.companyId, companyId),
                                                                                                                                                                                                                                                                                                                                                            or(
                                                                                                                                                                                                                                                                                                                                                                          ilike(referralAccounts.name, likeQ),
                                                                                                                                                                                                                                                                                                                                                                                        ilike(referralAccounts.phone, likeQ),
                                                                                                                                                                                                                                                                                                                                                                                                      ilike(referralAccounts.notes, likeQ)
                                                                                                                                                                                                                                                                                                                                                                                                                  )
                                                                                                                                                                                                                                                                                                                                                                                                                            )
                                                                                                                                                                                                                                                                                                                                                                                                                                    )
                                                                                                                                                                                                                                                                                                                                                                                                                                            .limit(5);

                                                                                                                                                                                                                                                                                                                                                                                                                                                  // Search contacts
                                                                                                                                                                                                                                                                                                                                                                                                                                                        const contactsRaw = await db
                                                                                                                                                                                                                                                                                                                                                                                                                                                                .select()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        .from(referralContacts)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                .where(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          and(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      eq(referralContacts.companyId, companyId),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  or(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ilike(referralContacts.name, likeQ),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ilike(referralContacts.email, likeQ),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ilike(referralContacts.phone, likeQ)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  .limit(5);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        // Search BD activity
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              const activityRaw = await db
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      .select()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              .from(activityLogs)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      .where(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                and(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            eq(activityLogs.companyId, companyId),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ilike(activityLogs.notes, likeQ)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  .limit(5);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        const leads = leadsRaw.map((i: any) => ({
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                id: i.id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        type: "lead",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                title: i.clientName || i.callerName || "Unknown Caller",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        subtitle: [i.phoneNumber, i.stage].filter(Boolean).join(" · "),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                url: `/inquiry/${i.id}`,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      }));

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            const facilities = facilitiesRaw.map((f: any) => ({
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    id: f.id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            type: "facility",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    title: f.name,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            subtitle: f.phone || undefined,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    url: `/accounts?id=${f.id}`,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          }));

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                const contacts = contactsRaw.map((c: any) => ({
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        id: c.id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                type: "contact",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        title: c.name,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                subtitle: [c.position, c.email].filter(Boolean).join(" · ") || undefined,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        url: `/accounts?contact=${c.id}`,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              }));

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    const activity = activityRaw.map((a: any) => ({
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            id: a.id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    type: "activity",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            title: a.activityType ? a.activityType.replace(/_/g, " ") : "Activity",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    subtitle: a.notes ? a.notes.substring(0, 80) : undefined,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            url: `/accounts?activity=${a.id}`,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  }));

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        res.json({
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                leads,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        contacts,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                facilities,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        notes: [],
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                activity,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        tasks: [],
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              });
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  } catch (error) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        console.error("Global search error:", error);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              res.status(500).json({ message: "Search failed" });
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

  // Bulk update inquiry stages
  app.patch("/api/inquiries/bulk-stage", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;

      const { inquiryIds, targetStage } = req.body;
      
      if (!Array.isArray(inquiryIds) || inquiryIds.length === 0) {
        return res.status(400).json({ message: "inquiryIds must be a non-empty array" });
      }
      
      if (!targetStage || typeof targetStage !== "string") {
        return res.status(400).json({ message: "targetStage is required" });
      }

      // Validate targetStage is a valid pipeline stage
      if (!pipelineStages.includes(targetStage as any)) {
        return res.status(400).json({ message: "Invalid target stage" });
      }

      const validIds = inquiryIds.filter((id: any) => typeof id === "number" && !isNaN(id));
      if (validIds.length === 0) {
        return res.status(400).json({ message: "No valid inquiry IDs provided" });
      }

      const count = await storage.bulkUpdateInquiryStage(validIds, companyId, targetStage);
      
      // Audit log for bulk stage update
      const userId = req.user?.claims?.sub;
      await logAudit(companyId, userId, "bulk_update", "inquiry", 0, `Bulk stage update: ${validIds.length} inquiries moved to ${targetStage}`, req);

      res.json({ success: true, count });
    } catch (error) {
      console.error("Error bulk updating inquiry stages:", error);
      res.status(500).json({ message: "Failed to update inquiry stages" });
    }
  });

  // Bulk delete inquiries
  app.delete("/api/inquiries/bulk", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;

      const { inquiryIds } = req.body;
      
      if (!Array.isArray(inquiryIds) || inquiryIds.length === 0) {
        return res.status(400).json({ message: "inquiryIds must be a non-empty array" });
      }

      const validIds = inquiryIds.filter((id: any) => typeof id === "number" && !isNaN(id));
      if (validIds.length === 0) {
        return res.status(400).json({ message: "No valid inquiry IDs provided" });
      }

      // Audit log BEFORE deleting
      const userId = req.user?.claims?.sub;
      await logAudit(companyId, userId, "bulk_delete", "inquiry", 0, `Bulk delete: ${validIds.length} inquiries deleted`, req);

      const count = await storage.bulkDeleteInquiries(validIds, companyId);
      res.json({ success: true, count });
    } catch (error) {
      console.error("Error bulk deleting inquiries:", error);
      res.status(500).json({ message: "Failed to delete inquiries" });
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

      // Audio transcription not available with xAI Grok yet
      return res.status(503).json({ 
        message: "Audio transcription is temporarily unavailable. xAI is working on adding speech-to-text capabilities.",
        aiDisabled: true 
      });
    } catch (error) {
      console.error("Error in transcription endpoint:", error);
      res.status(500).json({ message: "Failed to process request" });
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
  // STAGE STATUS ENDPOINTS
  // ========================

  // Get all stage statuses for an inquiry
  app.get("/api/inquiries/:id/stage-status", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      // Verify inquiry belongs to company
      const inquiry = await storage.getInquiry(inquiryId, companyId);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      
      const statuses = await storage.getStageStatusByInquiry(inquiryId);
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching stage statuses:", error);
      res.status(500).json({ message: "Failed to fetch stage statuses" });
    }
  });

  // Get specific stage status
  app.get("/api/inquiries/:id/stage-status/:stageName", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const stageName = req.params.stageName;
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      // Verify inquiry belongs to company
      const inquiry = await storage.getInquiry(inquiryId, companyId);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      
      const status = await storage.getStageStatus(inquiryId, stageName);
      res.json(status || null);
    } catch (error) {
      console.error("Error fetching stage status:", error);
      res.status(500).json({ message: "Failed to fetch stage status" });
    }
  });

  // Update stage status and data
  app.put("/api/inquiries/:id/stage-status/:stageName", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const stageName = req.params.stageName;
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const userId = req.user.claims.sub;
      
      // Verify inquiry belongs to company
      const inquiry = await storage.getInquiry(inquiryId, companyId);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      
      const validatedData = insertInquiryStageStatusSchema.parse({
        companyId,
        inquiryId,
        stageName,
        status: req.body.status || "in_progress",
        stageData: req.body.stageData || {},
        completedAt: req.body.status === "completed" ? new Date() : null,
        completedBy: req.body.status === "completed" ? userId : null,
      });
      
      const status = await storage.upsertStageStatus(validatedData);
      
      // Log the edit
      await storage.createStageEditLog({
        companyId,
        inquiryId,
        stageName,
        userId,
        action: req.body.status === "completed" ? "completed" : "updated",
        changedFields: req.body.stageData || {},
      });
      
      res.json(status);
    } catch (error) {
      console.error("Error saving stage status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save stage status" });
    }
  });

  // Get stage edit history
  app.get("/api/inquiries/:id/stage-edit-logs", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      // Verify inquiry belongs to company
      const inquiry = await storage.getInquiry(inquiryId, companyId);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getStageEditLogs(inquiryId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching stage edit logs:", error);
      res.status(500).json({ message: "Failed to fetch stage edit logs" });
    }
  });

  // ========================
  // DOCUMENT DOWNLOAD ENDPOINT
  // ========================

  // Download all completed documents as ZIP
  app.get("/api/inquiries/:id/download-docs", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      // Verify inquiry belongs to company and is admitted
      const inquiry = await storage.getInquiry(inquiryId, companyId);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      
      // Get all form data
      const [preCertForm, nursingForm, preScreeningForm, company] = await Promise.all([
        storage.getPreCertForm(inquiryId),
        storage.getNursingAssessmentForm(inquiryId),
        storage.getPreScreeningForm(inquiryId),
        storage.getCompany(companyId),
      ]);
      
      // Create folder name from client info
      const lastName = (inquiry.clientName || inquiry.callerName || "Unknown").split(" ").pop() || "Unknown";
      const firstName = (inquiry.clientName || inquiry.callerName || "Unknown").split(" ")[0] || "Unknown";
      const folderName = `${lastName}_${firstName}_${inquiryId}`;
      
      // Set response headers for ZIP download
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${folderName}_Documents.zip"`);
      
      // Create ZIP archive
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(res);
      
      // Generate Face Sheet PDF
      const faceSheetBuffer = await generateFaceSheetPdf(inquiry, company);
      archive.append(faceSheetBuffer, { name: `${folderName}/01_FaceSheet.pdf` });
      
      // Generate Pre-Cert PDF if form exists and has data
      if (preCertForm && preCertForm.formData && Object.keys(preCertForm.formData as object).length > 0) {
        const preCertBuffer = await generateFormPdf("Pre-Certification Form", preCertForm.formData);
        archive.append(preCertBuffer, { name: `${folderName}/02_PreCert.pdf` });
      }
      
      // Generate Nursing Assessment PDF if form exists and has data
      if (nursingForm && nursingForm.formData && Object.keys(nursingForm.formData as object).length > 0) {
        const nursingBuffer = await generateFormPdf("Nursing Assessment", nursingForm.formData);
        archive.append(nursingBuffer, { name: `${folderName}/03_NursingAssessment.pdf` });
      }
      
      // Generate Pre-Screening PDF if form exists and has data
      if (preScreeningForm && preScreeningForm.formData && Object.keys(preScreeningForm.formData as object).length > 0) {
        const screeningBuffer = await generateFormPdf("Pre-Screening Form", preScreeningForm.formData);
        archive.append(screeningBuffer, { name: `${folderName}/04_PreScreening.pdf` });
      }
      
      // Log the download for audit
      await logAudit(companyId, req.user.claims.sub, "view", "inquiry_documents", inquiryId, "Downloaded all documents as ZIP", req);
      
      await archive.finalize();
    } catch (error) {
      console.error("Error generating document ZIP:", error);
      res.status(500).json({ message: "Failed to generate documents" });
    }
  });

  // Download only pre-assessment forms (Pre-Cert, Nursing Assessment, Pre-Screening)
  app.get("/api/inquiries/:id/download-pre-assessment-forms", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const inquiry = await storage.getInquiry(inquiryId, companyId);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      
      // Get pre-assessment form data
      const [preCertForm, nursingForm, preScreeningForm] = await Promise.all([
        storage.getPreCertForm(inquiryId),
        storage.getNursingAssessmentForm(inquiryId),
        storage.getPreScreeningForm(inquiryId),
      ]);
      
      // Check if any forms have data
      const hasForms = (preCertForm?.formData && Object.keys(preCertForm.formData as object).length > 0) ||
                       (nursingForm?.formData && Object.keys(nursingForm.formData as object).length > 0) ||
                       (preScreeningForm?.formData && Object.keys(preScreeningForm.formData as object).length > 0);
      
      if (!hasForms) {
        return res.status(400).json({ message: "No pre-assessment forms have been completed yet" });
      }
      
      const lastName = (inquiry.clientName || inquiry.callerName || "Unknown").split(" ").pop() || "Unknown";
      const firstName = (inquiry.clientName || inquiry.callerName || "Unknown").split(" ")[0] || "Unknown";
      const folderName = `${lastName}_${firstName}_PreAssessment`;
      
      // Generate PDFs before starting the stream to catch errors early
      const pdfBuffers: { name: string; buffer: Buffer }[] = [];
      
      if (preCertForm && preCertForm.formData && Object.keys(preCertForm.formData as object).length > 0) {
        const preCertBuffer = await generateFormPdf("Pre-Certification Form", preCertForm.formData);
        pdfBuffers.push({ name: `${folderName}/01_PreCertification.pdf`, buffer: preCertBuffer });
      }
      
      if (nursingForm && nursingForm.formData && Object.keys(nursingForm.formData as object).length > 0) {
        const nursingBuffer = await generateFormPdf("Nursing Assessment", nursingForm.formData);
        pdfBuffers.push({ name: `${folderName}/02_NursingAssessment.pdf`, buffer: nursingBuffer });
      }
      
      if (preScreeningForm && preScreeningForm.formData && Object.keys(preScreeningForm.formData as object).length > 0) {
        const screeningBuffer = await generateFormPdf("Pre-Screening Form", preScreeningForm.formData);
        pdfBuffers.push({ name: `${folderName}/03_PreScreening.pdf`, buffer: screeningBuffer });
      }
      
      // Now start the stream after all PDFs are generated successfully
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${folderName}.zip"`);
      
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("error", (err) => {
        console.error("Archive error:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Failed to generate archive" });
        }
      });
      archive.pipe(res);
      
      for (const pdf of pdfBuffers) {
        archive.append(pdf.buffer, { name: pdf.name });
      }
      
      await logAudit(companyId, req.user.claims.sub, "view", "inquiry_documents", inquiryId, "Downloaded pre-assessment forms as ZIP", req);
      
      await archive.finalize();
    } catch (error) {
      console.error("Error generating pre-assessment ZIP:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to generate pre-assessment forms" });
      }
    }
  });

  // Download Admissions PDF Report for Utilization Review
  app.get("/api/inquiries/:id/admissions-report.pdf", isAuthenticated, canAccessInquiries, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      if (isNaN(inquiryId)) return res.status(400).json({ message: "Invalid inquiry ID" });
      
      const companyId = await requireCompanyId(req, res);
      if (!companyId) return;
      
      const inquiry = await storage.getInquiry(inquiryId, companyId);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      
      const company = await storage.getCompany(companyId);
      
      // Get all form data
      const [preCertForm, nursingForm, preScreeningForm] = await Promise.all([
        storage.getPreCertForm(inquiryId),
        storage.getNursingAssessmentForm(inquiryId),
        storage.getPreScreeningForm(inquiryId),
      ]);
      
      const lastName = (inquiry.clientName || inquiry.callerName || "Unknown").split(" ").pop() || "Unknown";
      const filename = `Admissions_Report_${inquiryId}_${lastName}.pdf`;
      
      // Generate AI-powered clinical justifications
      const clinicalJustifications = await generateClinicalJustifications(
        inquiry,
        preCertForm?.formData as Record<string, any> | null,
        nursingForm?.formData as Record<string, any> | null,
        preScreeningForm?.formData as Record<string, any> | null,
        companyId
      );
      
      // Generate the comprehensive PDF with clinical justifications
      const pdfBuffer = await generateAdmissionsReportPdf(
        inquiry, 
        company, 
        preCertForm?.formData as Record<string, any> | null,
        nursingForm?.formData as Record<string, any> | null,
        preScreeningForm?.formData as Record<string, any> | null,
        clinicalJustifications
      );
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      
      await logAudit(companyId, req.user.claims.sub, "view", "inquiry_documents", inquiryId, "Generated Admissions PDF Report", req);
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating admissions report:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to generate admissions report" });
      }
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

// PDF Generation Helper Functions

// Text sanitization: Replace problematic characters for PDF rendering
function sanitizeText(text: any): string {
  if (text === null || text === undefined) return "";
  let str = String(text);
  // Replace smart quotes with straight quotes
  str = str.replace(/[\u2018\u2019]/g, "'");
  str = str.replace(/[\u201C\u201D]/g, '"');
  // Replace em dashes, en dashes with regular hyphen
  str = str.replace(/[\u2013\u2014]/g, "-");
  // Replace ellipsis
  str = str.replace(/\u2026/g, "...");
  // Replace other problematic Unicode characters
  str = str.replace(/[\u00A0]/g, " "); // Non-breaking space
  str = str.replace(/[\uFFFD]/g, "-"); // Replacement character
  // Strip any remaining non-ASCII that might cause issues (keep basic Latin + extended)
  str = str.replace(/[^\x00-\x7F\xA0-\xFF]/g, "");
  return str;
}

// Helper function to format text or return "Not provided"
function formatValue(value: any): string {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length > 0 ? sanitizeText(value.join(", ")) : "Not provided";
  return sanitizeText(String(value));
}

function formatDate(dateStr: any): string {
  if (!dateStr) return "Not provided";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return sanitizeText(String(dateStr));
  }
}

async function generateAdmissionsReportPdf(
  inquiry: any,
  company: any,
  preCertData: Record<string, any> | null,
  nursingData: Record<string, any> | null,
  preScreeningData: Record<string, any> | null,
  clinicalJustifications: ClinicalJustificationData | null
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    // COMPACT: Tight margins for maximum content density (0.5in margins)
    const margins = { top: 36, bottom: 36, left: 36, right: 36 };
    const doc = new PDFDocument({ 
      margin: margins.left,
      size: "LETTER",
      bufferPages: false,
      autoFirstPage: false
    });
    
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    
    const facilityName = sanitizeText(company?.name || "Gulf Breeze Recovery");
    const pageWidth = 612 - margins.left - margins.right;
    const contentBottom = 792 - margins.bottom - 12; // Minimal footer space
    
    let pageNumber = 0;
    
    // Minimal footer - just page number, no CONFIDENTIAL text
    const addFooter = () => {
      const savedY = doc.y;
      const savedX = doc.x;
      doc.font("Helvetica").fontSize(7);
      doc.text(`Page ${pageNumber}`, margins.left, 792 - margins.bottom + 4, { width: pageWidth, align: "center", lineBreak: false });
      doc.x = savedX;
      doc.y = savedY;
      doc.font("Helvetica").fontSize(9);
    };
    
    doc.addPage();
    pageNumber = 1;
    
    // Compact page break check
    const checkPageBreak = (requiredSpace: number = 40) => {
      if (doc.y > contentBottom - requiredSpace) {
        addFooter();
        doc.addPage();
        pageNumber++;
        doc.y = margins.top;
      }
    };
    
    // COMPACT: Smaller section headers with minimal spacing
    const addSectionHeader = (title: string) => {
      checkPageBreak(30);
      doc.x = margins.left;
      doc.moveDown(0.15);
      doc.fontSize(9).font("Helvetica-Bold").text(sanitizeText(title).toUpperCase(), { width: pageWidth });
      doc.moveDown(0.1);
      doc.font("Helvetica").fontSize(8);
    };
    
    // COMPACT: Inline field display
    const addField = (label: string, value: any) => {
      checkPageBreak(12);
      doc.x = margins.left;
      doc.font("Helvetica-Bold").fontSize(8).text(`${sanitizeText(label)}: `, { continued: true, width: pageWidth });
      doc.font("Helvetica").text(formatValue(value), { width: pageWidth });
    };
    
    // COMPACT: Smaller text with tight line height
    const addText = (text: string) => {
      checkPageBreak(12);
      doc.x = margins.left;
      doc.font("Helvetica").fontSize(8).text(sanitizeText(text), { width: pageWidth, lineGap: -1 });
    };
    
    // COMPACT HEADER: Single line facility + title
    doc.fontSize(11).font("Helvetica-Bold").text(`${facilityName} - Clinical Summary for Utilization Review`, { align: "center" });
    doc.fontSize(8).font("Helvetica").text(`Generated: ${new Date().toLocaleDateString("en-US")} | Inquiry ID: ${inquiry.id}`, { align: "center" });
    doc.moveDown(0.3);
    
    // ============ SECTION 1: PATIENT AND CALLER INFO ============
    addSectionHeader("Patient and Caller Information");
    addField("Client Name", inquiry.clientName || inquiry.callerName);
    addField("Date of Birth", formatDate(inquiry.dateOfBirth));
    addField("Caller Name", inquiry.callerName);
    addField("Phone Number", inquiry.phoneNumber);
    addField("Email", inquiry.email);
    
    // ============ SECTION 2: INSURANCE INFORMATION ============
    addSectionHeader("Insurance Information");
    addField("Insurance Provider", inquiry.insuranceProvider);
    addField("Policy ID", inquiry.insurancePolicyId);
    addField("VOB Status", inquiry.vobStatus);
    if (inquiry.coverageDetails) {
      addField("Coverage Details", inquiry.coverageDetails);
    }
    
    // ============ SECTION 3: REFERRAL SOURCE ============
    addSectionHeader("Referral Source and Reason for Call");
    if (preScreeningData?.referralSource && Array.isArray(preScreeningData.referralSource)) {
      addField("Referral Sources", preScreeningData.referralSource);
      if (preScreeningData.referralOther) {
        addField("Other Source Details", preScreeningData.referralOther);
      }
    } else {
      addField("Referral Source", inquiry.referralSource || inquiry.onlineSource);
    }
    addField("Referral Details", inquiry.referralDetails);
    
    // ============ SECTION 4: PRESENTING PROBLEMS ============
    addSectionHeader("Presenting Problems and Current Risks");
    addText(inquiry.presentingProblems || "Not provided");
    const treatmentTypes = [];
    if (inquiry.seekingSudTreatment === "yes") treatmentTypes.push("SUD");
    if (inquiry.seekingMentalHealth === "yes") treatmentTypes.push("MH");
    if (inquiry.seekingEatingDisorder === "yes") treatmentTypes.push("ED");
    if (treatmentTypes.length > 0) addField("Treatment Types", treatmentTypes.join(", "));
    if (preCertData?.suicidalIdeation) addField("SI", preCertData.suicidalIdeation);
    if (preCertData?.homicidalIdeation) addField("HI", preCertData.homicidalIdeation);
    
    // ============ SECTION 5: SUBSTANCE USE HISTORY ============
    addSectionHeader("Substance Use History");
    
    if (preCertData?.substanceHistory && Array.isArray(preCertData.substanceHistory) && preCertData.substanceHistory.length > 0) {
      const substances = preCertData.substanceHistory.filter((s: any) => s.substance);
      if (substances.length > 0) {
        // Widened Amount column significantly for long text
        const colWidths = [55, 35, 45, 140, 30, 45, 60];
        const startX = margins.left;
        checkPageBreak(25 + substances.length * 14);
        doc.font("Helvetica-Bold").fontSize(8);
        let xPos = startX;
        const headers = ["Substance", "First", "Freq", "Amount", "Route", "Last", "Notes"];
        const headerY = doc.y;
        headers.forEach((header, i) => {
          doc.text(sanitizeText(header), xPos, headerY, { width: colWidths[i] - 2 });
          xPos += colWidths[i];
        });
        doc.moveDown(0.25);
        doc.font("Helvetica").fontSize(8);
        substances.forEach((sub: any) => {
          checkPageBreak(14);
          const rowY = doc.y;
          xPos = startX;
          [formatValue(sub.substance), formatValue(sub.firstUsed), formatValue(sub.frequency), formatValue(sub.amount), formatValue(sub.route), formatValue(sub.lastUsed), formatValue(sub.method || sub.notes || "")].forEach((cell, i) => {
            doc.text(cell, xPos, rowY, { width: colWidths[i] - 2 });
            xPos += colWidths[i];
          });
          doc.moveDown(0.2);
        });
        doc.x = margins.left;
        doc.fontSize(8);
      } else {
        addText("No substance history recorded.");
      }
    } else if (preScreeningData?.substanceUseHistory) {
      addText(preScreeningData.substanceUseHistory);
      if (preScreeningData.primarySubstance) addField("Primary", preScreeningData.primarySubstance);
      if (preScreeningData.lastUseDate) addField("Last Use", formatDate(preScreeningData.lastUseDate));
    } else {
      addText("Not provided");
    }
    
    // ============ SECTION 6: WITHDRAWAL RISK ============
    addSectionHeader("Withdrawal Risk and Current Symptoms");
    if (preCertData?.withdrawalSymptoms && Array.isArray(preCertData.withdrawalSymptoms) && preCertData.withdrawalSymptoms.length > 0) {
      addField("Symptoms", preCertData.withdrawalSymptoms.join(", "));
    }
    if (preCertData?.withdrawalNotes) addField("Notes", preCertData.withdrawalNotes);
    if (preCertData?.severityOfIllness) addField("Severity", preCertData.severityOfIllness);
    
    // ASAM Dimension 1
    doc.font("Helvetica-Bold").fontSize(8).text("Dimension 1 - Withdrawal:", { continued: false });
    doc.font("Helvetica");
    if (clinicalJustifications?.dimension1Withdrawal) {
      addText(clinicalJustifications.dimension1Withdrawal);
    } else if (preCertData?.withdrawalSymptoms && preCertData.withdrawalSymptoms.length > 0) {
      addText(`Patient presents with ${preCertData.withdrawalSymptoms.length} withdrawal symptom(s) requiring medical supervision.`);
    } else {
      addText("Requires structured treatment environment for stabilization.");
    }
    
    // ============ SECTION 7: TREATMENT HISTORY ============
    addSectionHeader("Treatment History");
    addText(preCertData?.treatmentHistory || preScreeningData?.previousTreatment || "No prior formal treatment reported.");
    
    // ============ SECTION 8: MEDICAL AND PSYCHIATRIC HISTORY ============
    addSectionHeader("Medical and Psychiatric History");
    if (preCertData?.medicalConditions) addField("Medical", preCertData.medicalConditions);
    if (preCertData?.medications || preScreeningData?.currentMedications) addField("Medications", preCertData?.medications || preScreeningData?.currentMedications);
    if (preCertData?.allergies || nursingData?.allergies) addField("Allergies", preCertData?.allergies || nursingData?.allergies);
    
    // Nursing vitals - compact inline
    if (nursingData) {
      const vitals = [];
      if (nursingData.bloodPressure) vitals.push(`BP: ${nursingData.bloodPressure}`);
      if (nursingData.pulse) vitals.push(`P: ${nursingData.pulse}`);
      if (nursingData.temperature) vitals.push(`T: ${nursingData.temperature}`);
      if (nursingData.weight) vitals.push(`Wt: ${nursingData.weight}`);
      if (vitals.length > 0) addField("Vitals", vitals.join(", "));
      if (nursingData.suicideRiskLevel) addField("Suicide Risk", nursingData.suicideRiskLevel);
    }
    
    // Psychiatric - inline
    if (preCertData?.mentalHealthHistory || preScreeningData?.mentalHealthDiagnoses) addField("MH Hx", preCertData?.mentalHealthHistory || preScreeningData?.mentalHealthDiagnoses);
    if (preScreeningData?.psychiatricHospitalizations) addField("Psych Hosp", preScreeningData.psychiatricHospitalizations);
    
    // ASAM Dimensions 2 & 3
    if (clinicalJustifications?.dimension2Biomedical) {
      doc.font("Helvetica-Bold").fontSize(8).text("Dimension 2 - Biomedical:");
      addText(clinicalJustifications.dimension2Biomedical);
    }
    if (clinicalJustifications?.dimension3Psychiatric) {
      doc.font("Helvetica-Bold").fontSize(8).text("Dimension 3 - Psychiatric:");
      addText(clinicalJustifications.dimension3Psychiatric);
    }
    
    // ============ SECTION 9: PSYCHOSOCIAL ============
    addSectionHeader("Psychosocial Factors");
    if (preCertData?.psychosocialNotes) addText(preCertData.psychosocialNotes);
    if (preScreeningData?.employmentStatus) addField("Employment", preScreeningData.employmentStatus);
    if (preScreeningData?.livingArrangements) addField("Living", preScreeningData.livingArrangements);
    if (preScreeningData?.motivationLevel) addField("Motivation", preScreeningData.motivationLevel);
    if (preScreeningData?.barriers) addField("Barriers", preScreeningData.barriers);
    if (preCertData?.familyHistory) addField("Family Hx", preCertData.familyHistory);
    
    // ASAM Dimensions 4, 5, 6 (critical for extended stay)
    if (clinicalJustifications?.dimension4Readiness) {
      doc.font("Helvetica-Bold").fontSize(8).text("Dimension 4 - Readiness:");
      addText(clinicalJustifications.dimension4Readiness);
    }
    if (clinicalJustifications?.dimension5RelapsePotential) {
      doc.font("Helvetica-Bold").fontSize(8).text("Dimension 5 - Relapse Potential:");
      addText(clinicalJustifications.dimension5RelapsePotential);
    }
    if (clinicalJustifications?.dimension6Environment) {
      doc.font("Helvetica-Bold").fontSize(8).text("Dimension 6 - Environment:");
      addText(clinicalJustifications.dimension6Environment);
    }
    
    // ============ SECTION 10: LEGAL STATUS ============
    addSectionHeader("Legal Status");
    const legalStatus = [];
    if (preScreeningData?.hasLegalIssues === "yes") legalStatus.push("Legal issues");
    if (preScreeningData?.hasPendingCharges === "yes") legalStatus.push("Pending charges");
    if (preScreeningData?.isProbationParole === "yes") legalStatus.push("Probation/parole");
    if (legalStatus.length > 0) {
      addField("Status", legalStatus.join(", "));
    } else if (preCertData?.legalIssues) {
      addField("Status", preCertData.legalIssues);
    } else {
      addText("No legal issues reported.");
    }
    if (preScreeningData?.legalDetails) addField("Details", preScreeningData.legalDetails);
    
    // ============ SECTION 11: LEVEL OF CARE RECOMMENDATION ============
    addSectionHeader("Level of Care and Medical Necessity");
    const levelOfCare = sanitizeText(inquiry.levelOfCare || preScreeningData?.programRecommendation || "Residential");
    addField("LOC", levelOfCare);
    if (clinicalJustifications?.recommendedDays) addField("LOS", `${clinicalJustifications.recommendedDays} days`);
    
    // Level of Care Justification - compact
    if (clinicalJustifications?.levelOfCareJustification) {
      doc.font("Helvetica-Bold").fontSize(8).text("LOC Justification:");
      addText(clinicalJustifications.levelOfCareJustification);
    }
    
    // Medical Necessity Summary
    doc.font("Helvetica-Bold").fontSize(8).text("Medical Necessity (ASAM):");
    if (clinicalJustifications?.medicalNecessitySummary) {
      addText(clinicalJustifications.medicalNecessitySummary);
    } else {
      addText(`Patient meets criteria for ${levelOfCare} based on SUD severity, failed lower level supports, and need for 24-hour structured programming.`);
    }
    if (preScreeningData?.recommendationNotes) addField("Notes", preScreeningData.recommendationNotes);
    
    // ============ SECTION 12: INITIAL TREATMENT FOCUS ============
    addSectionHeader("Treatment Focus");
    doc.fontSize(8);
    const treatmentItems = ["24-hour residential", "Medical monitoring/withdrawal mgmt", "Psychiatric eval/medication mgmt", "Individual/group therapy", "Relapse prevention", "Family involvement", "Discharge planning"];
    addText(treatmentItems.join(" | "));
    
    // ============ SECTION 13: SIGN OFF BLOCK - COMPACT ============
    checkPageBreak(50);
    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").fontSize(8);
    doc.text("Prepared by: _________________________ Title: _________________________ Date: _____________");
    doc.moveDown(0.15);
    doc.font("Helvetica").fontSize(7);
    doc.text("[ ] Information reviewed with patient");
    
    // Add footer to the last page
    addFooter();
    
    // Now we need to add footers to all previous pages
    // Since we used single-pass, we track page numbers and add footer before each page break
    // The footer was added before each addPage() call via checkPageBreak
    
    doc.end();
  });
}

async function generateFaceSheetPdf(inquiry: any, company: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50 });
    
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    
    // Header
    doc.fontSize(20).text(company?.name || "Face Sheet", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.moveDown(2);
    
    // Client Information
    doc.fontSize(14).text("Client Information", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Caller Name: ${inquiry.callerName || "N/A"}`);
    doc.text(`Client Name: ${inquiry.clientName || "Same as caller"}`);
    doc.text(`Phone: ${inquiry.phoneNumber || "N/A"}`);
    doc.text(`Date of Birth: ${inquiry.dateOfBirth ? new Date(inquiry.dateOfBirth).toLocaleDateString() : "N/A"}`);
    doc.text(`Gender: ${inquiry.gender || "N/A"}`);
    doc.moveDown();
    
    // Stage Information
    doc.fontSize(14).text("Admission Status", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Current Stage: ${stageDisplayNames[inquiry.stage as keyof typeof stageDisplayNames] || inquiry.stage}`);
    doc.text(`Inquiry Date: ${inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : "N/A"}`);
    if (inquiry.admittedAt) {
      doc.text(`Admitted Date: ${new Date(inquiry.admittedAt).toLocaleDateString()}`);
    }
    if (inquiry.dischargeDate) {
      doc.text(`Expected Discharge: ${new Date(inquiry.dischargeDate).toLocaleDateString()}`);
    }
    doc.moveDown();
    
    // Insurance Information
    doc.fontSize(14).text("Insurance Information", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Insurance Provider: ${inquiry.insuranceProvider || "N/A"}`);
    doc.text(`Policy Number: ${inquiry.policyNumber || "N/A"}`);
    doc.text(`Group Number: ${inquiry.groupNumber || "N/A"}`);
    doc.text(`Subscriber Name: ${inquiry.subscriberName || "N/A"}`);
    doc.text(`Subscriber DOB: ${inquiry.subscriberDob ? new Date(inquiry.subscriberDob).toLocaleDateString() : "N/A"}`);
    doc.text(`Relationship to Subscriber: ${inquiry.relationshipToSubscriber || "N/A"}`);
    doc.moveDown();
    
    // Clinical Information
    doc.fontSize(14).text("Clinical Information", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Level of Care: ${inquiry.levelOfCare || "N/A"}`);
    if (inquiry.presentingProblems) {
      doc.text(`Presenting Problems: ${inquiry.presentingProblems}`);
    }
    if (inquiry.treatmentTypeDetox || inquiry.treatmentTypeResidential || inquiry.treatmentTypePHP) {
      const treatments = [];
      if (inquiry.treatmentTypeDetox) treatments.push("Detox");
      if (inquiry.treatmentTypeResidential) treatments.push("Residential");
      if (inquiry.treatmentTypePHP) treatments.push("PHP");
      doc.text(`Treatment Types: ${treatments.join(", ")}`);
    }
    doc.moveDown();
    
    // Notes
    if (inquiry.initialNotes) {
      doc.fontSize(14).text("Initial Notes", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(inquiry.initialNotes);
    }
    
    doc.end();
  });
}

async function generateFormPdf(title: string, formData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50 });
    
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    
    // Header
    doc.fontSize(18).text(title, { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.moveDown(2);
    
    // Render form data
    doc.fontSize(11);
    if (formData && typeof formData === "object") {
      renderFormData(doc, formData, 0);
    } else {
      doc.text("No form data available.");
    }
    
    doc.end();
  });
}

function renderFormData(doc: PDFKit.PDFDocument, data: any, indent: number): void {
  const leftMargin = 50 + (indent * 20);
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === "") continue;
    
    // Format the key for display
    const displayKey = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
    
    if (typeof value === "object" && !Array.isArray(value)) {
      doc.text(`${displayKey}:`, leftMargin);
      doc.moveDown(0.3);
      renderFormData(doc, value, indent + 1);
    } else if (Array.isArray(value)) {
      doc.text(`${displayKey}: ${value.join(", ")}`, leftMargin);
      doc.moveDown(0.3);
    } else if (typeof value === "boolean") {
      doc.text(`${displayKey}: ${value ? "Yes" : "No"}`, leftMargin);
      doc.moveDown(0.3);
    } else {
      doc.text(`${displayKey}: ${value}`, leftMargin);
      doc.moveDown(0.3);
    }
  }
}
