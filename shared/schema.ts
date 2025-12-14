import { sql } from 'drizzle-orm';
import {
  index,
  integer,
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

// Pipeline stages enum (inquiry goes directly to vob_pending)
export const pipelineStages = [
  "inquiry",
  "vob_pending",
  "quote_client",
  "pre_assessment",
  "scheduled",
  "admitted",
  "non_viable",
  "lost",
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

// Lost reasons - for viable clients who don't proceed to admission
export const lostReasons = [
  "went_elsewhere",
  "ceased_contact",
  "changed_mind",
  "financial_reasons",
  "family_decision",
  "other",
] as const;

export type LostReason = typeof lostReasons[number];

export const lostReasonDisplayNames: Record<LostReason, string> = {
  went_elsewhere: "Went to Another Treatment Center",
  ceased_contact: "Ceased Contact",
  changed_mind: "Changed Mind",
  financial_reasons: "Financial Reasons",
  family_decision: "Family Decision",
  other: "Other",
};

// Online referral sources (for digital/marketing channels)
export const onlineReferralSources = [
  "google_ppc",
  "google_organic",
  "facebook",
  "instagram",
  "website",
  "alumni_referral",
  "word_of_mouth",
  "phone_book",
  "other_online",
] as const;

export type OnlineReferralSource = typeof onlineReferralSources[number];

export const onlineReferralSourceDisplayNames: Record<OnlineReferralSource, string> = {
  google_ppc: "Google PPC (Paid)",
  google_organic: "Google Organic",
  facebook: "Facebook",
  instagram: "Instagram",
  website: "Website Direct",
  alumni_referral: "Alumni Referral",
  word_of_mouth: "Word of Mouth",
  phone_book: "Phone Book",
  other_online: "Other Online",
};

// Referral origin - distinguishes account vs online referral
export const referralOrigins = ["account", "online"] as const;
export type ReferralOrigin = typeof referralOrigins[number];

// Legacy referral sources (kept for backward compatibility)
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
  referralOrigin: varchar("referral_origin", { length: 20 }), // "account" or "online"
  referralAccountId: integer("referral_account_id"), // links to referralAccounts.id when origin is "account"
  onlineSource: varchar("online_source", { length: 50 }), // specific online channel when origin is "online"
  referralSource: varchar("referral_source", { length: 50 }), // legacy field for backward compatibility
  referralDetails: text("referral_details"),
  
  // Initial call info
  callDateTime: timestamp("call_date_time").defaultNow(),
  initialNotes: text("initial_notes"),
  
  // Viability
  isViable: varchar("is_viable", { length: 10 }),
  nonViableReason: varchar("non_viable_reason", { length: 50 }),
  nonViableNotes: text("non_viable_notes"),
  
  // Lost client tracking (for viable clients who don't proceed)
  lostReason: varchar("lost_reason", { length: 50 }),
  lostNotes: text("lost_notes"),
  
  // Insurance Information
  insuranceProvider: varchar("insurance_provider", { length: 255 }),
  insurancePolicyId: varchar("insurance_policy_id", { length: 100 }),
  insuranceNotes: text("insurance_notes"),
  
  // VOB Information
  vobStatus: varchar("vob_status", { length: 50 }),
  vobDetails: text("vob_details"),
  vobFileUrl: text("vob_file_url"),
  coverageDetails: text("coverage_details"),
  quotedCost: varchar("quoted_cost", { length: 100 }),
  clientResponsibility: text("client_responsibility"),
  vobCompletedAt: timestamp("vob_completed_at"),
  
  // In-Network Benefits
  inNetworkDeductible: varchar("in_network_deductible", { length: 100 }),
  inNetworkDeductibleMet: varchar("in_network_deductible_met", { length: 100 }),
  inNetworkOopMax: varchar("in_network_oop_max", { length: 100 }),
  inNetworkOopMet: varchar("in_network_oop_met", { length: 100 }),
  
  // Out-of-Network Benefits
  hasOutOfNetworkBenefits: varchar("has_out_of_network_benefits", { length: 10 }),
  outOfNetworkDeductible: varchar("out_of_network_deductible", { length: 100 }),
  outOfNetworkDeductibleMet: varchar("out_of_network_deductible_met", { length: 100 }),
  outOfNetworkOopMax: varchar("out_of_network_oop_max", { length: 100 }),
  outOfNetworkOopMet: varchar("out_of_network_oop_met", { length: 100 }),
  
  // Coverage Restrictions & Requirements
  stateRestrictions: text("state_restrictions"),
  preCertRequired: varchar("pre_cert_required", { length: 10 }),
  preAuthRequired: varchar("pre_auth_required", { length: 10 }),
  preCertAuthDetails: text("pre_cert_auth_details"),
  
  // Benefits Coverage
  hasSubstanceUseBenefits: varchar("has_substance_use_benefits", { length: 10 }),
  hasMentalHealthBenefits: varchar("has_mental_health_benefits", { length: 10 }),
  benefitNotes: text("benefit_notes"),
  
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
  callDurationSeconds: integer("call_duration_seconds"),
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
  vob_pending: "VOB Pending",
  quote_client: "Quote Client",
  pre_assessment: "Pre-Assessment",
  scheduled: "Scheduled",
  admitted: "Admitted",
  non_viable: "Non-Viable",
  lost: "Lost Client",
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

// Referral account types
export const accountTypes = [
  "hospital",
  "private_practice",
  "mat_clinic",
  "outpatient_facility",
  "residential_facility",
  "attorneys",
  "ed_consultant",
  "community",
  "other",
] as const;

export type AccountType = typeof accountTypes[number];

export const accountTypeDisplayNames: Record<AccountType, string> = {
  hospital: "Hospital",
  private_practice: "Private Practice",
  mat_clinic: "MAT Clinic",
  outpatient_facility: "Outpatient Facility",
  residential_facility: "Residential Facility",
  attorneys: "Attorneys",
  ed_consultant: "Ed Consultant",
  community: "Community",
  other: "Other",
};

// Referral Accounts table - BD rep assigned accounts
export const referralAccounts = pgTable("referral_accounts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  notes: text("notes"),
  assignedBdRepId: varchar("assigned_bd_rep_id").references(() => users.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReferralAccountSchema = createInsertSchema(referralAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ReferralAccount = typeof referralAccounts.$inferSelect;
export type InsertReferralAccount = z.infer<typeof insertReferralAccountSchema>;

// Referral Contacts table - contacts within referral accounts
export const referralContacts = pgTable("referral_contacts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => referralAccounts.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  position: varchar("position", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralContactSchema = createInsertSchema(referralContacts).omit({
  id: true,
  createdAt: true,
});

export type ReferralContact = typeof referralContacts.$inferSelect;
export type InsertReferralContact = z.infer<typeof insertReferralContactSchema>;

// Activity types for BD rep tracking
export const activityTypes = [
  "face_to_face",
  "phone_call",
  "email",
  "meeting",
  "lunch",
  "presentation",
  "other",
] as const;

export type ActivityType = typeof activityTypes[number];

export const activityTypeDisplayNames: Record<ActivityType, string> = {
  face_to_face: "Face-to-Face Visit",
  phone_call: "Phone Call",
  email: "Email",
  meeting: "Meeting",
  lunch: "Lunch/Coffee",
  presentation: "Presentation",
  other: "Other",
};

// Activity Logs table - BD rep activity tracking
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => referralAccounts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  notes: text("notes"),
  activityDate: timestamp("activity_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Notification Settings table - admin email configuration per stage
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  stageName: varchar("stage_name", { length: 50 }).notNull().unique(),
  emailAddresses: text("email_addresses"),
  enabled: varchar("enabled", { length: 10 }).default("no"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotificationSettingSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingSchema>;
