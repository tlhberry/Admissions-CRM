import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Pipeline stages enum
export const pipelineStages = [
  "inquiry",
  "viability_check",
  "insurance_collection",
  "vob_pending",
  "quote_client",
  "pre_assessment",
  "scheduled",
  "admitted",
  "non_viable",
] as const;

export type PipelineStage = typeof pipelineStages[number];

// Non-viable reasons
export const nonViableReasons = [
  "has_medicaid",
  "no_financial_means",
  "clinically_not_fit",
  "insurance_not_accepted",
  "client_declined",
  "other",
] as const;

export type NonViableReason = typeof nonViableReasons[number];

// Referral sources
export const referralSources = [
  "google",
  "facebook",
  "instagram",
  "referral_partner",
  "alumni_referral",
  "website",
  "phone_book",
  "word_of_mouth",
  "other",
] as const;

export type ReferralSource = typeof referralSources[number];

// Levels of care
export const levelsOfCare = [
  "detox",
  "residential",
  "php",
  "iop",
  "outpatient",
] as const;

export type LevelOfCare = typeof levelsOfCare[number];

// Main inquiries table
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  
  // Stage tracking
  stage: varchar("stage", { length: 50 }).notNull().default("inquiry"),
  
  // Caller/Client Information
  callerName: varchar("caller_name", { length: 255 }),
  clientName: varchar("client_name", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  email: varchar("email", { length: 255 }),
  dateOfBirth: date("date_of_birth"),
  
  // Referral tracking
  referralSource: varchar("referral_source", { length: 50 }),
  referralDetails: text("referral_details"),
  
  // Initial call info
  callDateTime: timestamp("call_date_time").defaultNow(),
  initialNotes: text("initial_notes"),
  
  // Viability
  isViable: varchar("is_viable", { length: 10 }),
  nonViableReason: varchar("non_viable_reason", { length: 50 }),
  nonViableNotes: text("non_viable_notes"),
  
  // Insurance Information
  insuranceProvider: varchar("insurance_provider", { length: 255 }),
  insurancePolicyId: varchar("insurance_policy_id", { length: 100 }),
  insuranceNotes: text("insurance_notes"),
  
  // VOB Information
  vobStatus: varchar("vob_status", { length: 50 }),
  vobDetails: text("vob_details"),
  coverageDetails: text("coverage_details"),
  quotedCost: varchar("quoted_cost", { length: 100 }),
  clientResponsibility: text("client_responsibility"),
  vobCompletedAt: timestamp("vob_completed_at"),
  
  // Quote stage
  quoteAccepted: varchar("quote_accepted", { length: 10 }),
  quoteNotes: text("quote_notes"),
  
  // Pre-assessment
  preAssessmentCompleted: varchar("pre_assessment_completed", { length: 10 }),
  preAssessmentDate: timestamp("pre_assessment_date"),
  preAssessmentNotes: text("pre_assessment_notes"),
  
  // Scheduling
  expectedAdmitDate: date("expected_admit_date"),
  levelOfCare: varchar("level_of_care", { length: 50 }),
  admissionType: varchar("admission_type", { length: 50 }),
  schedulingNotes: text("scheduling_notes"),
  
  // Admission
  actualAdmitDate: date("actual_admit_date"),
  admittedNotes: text("admitted_notes"),
  
  // AI Transcription
  callRecordingUrl: text("call_recording_url"),
  transcription: text("transcription"),
  aiExtractedData: jsonb("ai_extracted_data"),
  
  // CTM Integration Fields
  ctmCallId: varchar("ctm_call_id", { length: 100 }),
  ctmTrackingNumber: varchar("ctm_tracking_number", { length: 50 }),
  callDuration: varchar("call_duration", { length: 20 }),
  ctmSource: varchar("ctm_source", { length: 100 }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for validation
export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateInquirySchema = createInsertSchema(inquiries).partial().omit({
  id: true,
  createdAt: true,
});

// Types
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type UpdateInquiry = z.infer<typeof updateInquirySchema>;

// Stage display names
export const stageDisplayNames: Record<PipelineStage, string> = {
  inquiry: "New Inquiry",
  viability_check: "Viability Check",
  insurance_collection: "Insurance Info",
  vob_pending: "VOB Pending",
  quote_client: "Quote Client",
  pre_assessment: "Pre-Assessment",
  scheduled: "Scheduled",
  admitted: "Admitted",
  non_viable: "Non-Viable",
};

// Referral source display names
export const referralSourceDisplayNames: Record<ReferralSource, string> = {
  google: "Google Search",
  facebook: "Facebook",
  instagram: "Instagram",
  referral_partner: "Referral Partner",
  alumni_referral: "Alumni Referral",
  website: "Website",
  phone_book: "Phone Book",
  word_of_mouth: "Word of Mouth",
  other: "Other",
};

// Non-viable reason display names
export const nonViableReasonDisplayNames: Record<NonViableReason, string> = {
  has_medicaid: "Has Medicaid (Not Accepted)",
  no_financial_means: "No Financial Means",
  clinically_not_fit: "Clinically Not a Fit",
  insurance_not_accepted: "Insurance Not Accepted",
  client_declined: "Client Declined",
  other: "Other",
};

// Level of care display names
export const levelOfCareDisplayNames: Record<LevelOfCare, string> = {
  detox: "Detox",
  residential: "Residential Inpatient",
  php: "Partial Hospitalization (PHP)",
  iop: "Intensive Outpatient (IOP)",
  outpatient: "Outpatient",
};
