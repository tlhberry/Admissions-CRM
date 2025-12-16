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

// User roles - HIPAA compliant role-based access control
export const userRoles = ["admin", "admissions", "clinical", "read_only"] as const;
export type UserRole = typeof userRoles[number];

export const userRoleDisplayNames: Record<UserRole, string> = {
  admin: "Administrator",
  admissions: "Admissions Staff",
  clinical: "Clinical Staff",
  read_only: "Read Only",
};

// Role permissions for RBAC
export const rolePermissions: Record<UserRole, string[]> = {
  admin: ["all"],
  admissions: ["inquiries", "referral_accounts", "activities", "reports"],
  clinical: ["inquiries", "clinical_notes", "pre_assessment"],
  read_only: ["view_only"],
};

// Companies/Tenants table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().default("Gulf Breeze"),
  billingEmail: varchar("billing_email", { length: 255 }),
  billingAddress: text("billing_address"),
  billingPhone: varchar("billing_phone", { length: 50 }),
  billingNotes: text("billing_notes"),
  ctmWebhookToken: varchar("ctm_webhook_token", { length: 64 }),
  ctmWebhookSecret: varchar("ctm_webhook_secret", { length: 255 }),
  ctmEnabled: varchar("ctm_enabled", { length: 10 }).default("no"),
  // AI Assistance settings
  aiAssistanceEnabled: varchar("ai_assistance_enabled", { length: 10 }).default("yes"),
  aiBudgetLimitCents: integer("ai_budget_limit_cents"), // Monthly budget limit in cents (null = unlimited)
  aiUsageThisMonthCents: integer("ai_usage_this_month_cents").default(0), // Current month's usage in cents
  aiUsageResetDate: timestamp("ai_usage_reset_date"), // When to reset monthly usage counter
  // Bed Board settings
  totalBeds: integer("total_beds").default(32), // Total beds available at facility
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

// User storage table with HIPAA-compliant authentication fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  companyId: integer("company_id").references(() => companies.id),
  role: varchar("role", { length: 20 }).notNull().default("admissions"),
  isActive: varchar("is_active", { length: 10 }).notNull().default("yes"),
  
  // Password authentication fields
  passwordHash: varchar("password_hash", { length: 255 }),
  passwordChangedAt: timestamp("password_changed_at"),
  passwordExpiresAt: timestamp("password_expires_at"),
  mustChangePassword: varchar("must_change_password", { length: 10 }).default("yes"),
  
  // Two-Factor Authentication fields
  totpSecret: varchar("totp_secret", { length: 255 }), // Encrypted TOTP secret
  totpEnabled: varchar("totp_enabled", { length: 10 }).default("no"),
  smsPhoneNumber: varchar("sms_phone_number", { length: 20 }),
  sms2faEnabled: varchar("sms_2fa_enabled", { length: 10 }).default("no"),
  twoFactorSetupComplete: varchar("two_factor_setup_complete", { length: 10 }).default("no"),
  
  // Account lockout fields
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedAt: timestamp("locked_at"),
  lockedReason: varchar("locked_reason", { length: 255 }),
  lockedBy: varchar("locked_by"), // Admin who locked the account
  
  // Last activity tracking
  lastLoginAt: timestamp("last_login_at"),
  lastActivityAt: timestamp("last_activity_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Password history table - stores hashes of last 5 passwords to prevent reuse
export const passwordHistory = pgTable("password_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_password_history_user").on(table.userId),
]);

export type PasswordHistory = typeof passwordHistory.$inferSelect;

// Login attempts table - for tracking and auditing login attempts
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  userId: varchar("user_id"),
  success: varchar("success", { length: 10 }).notNull(), // yes/no
  failureReason: varchar("failure_reason", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  twoFactorMethod: varchar("two_factor_method", { length: 20 }), // totp/sms/none
  twoFactorSuccess: varchar("two_factor_success", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_login_attempts_email").on(table.email),
  index("IDX_login_attempts_created").on(table.createdAt),
]);

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_password_reset_token").on(table.token),
  index("IDX_password_reset_email").on(table.email),
]);

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

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
  companyId: integer("company_id").references(() => companies.id).notNull(),
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
  
  // Treatment type seeking
  seekingSudTreatment: varchar("seeking_sud_treatment", { length: 10 }), // "yes" or "no"
  seekingMentalHealth: varchar("seeking_mental_health", { length: 10 }), // "yes" or "no"
  seekingEatingDisorder: varchar("seeking_eating_disorder", { length: 10 }), // "yes" or "no"
  
  // Presenting problems / initial notes
  presentingProblems: text("presenting_problems"),
  
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
  arrivalEmailSentAt: timestamp("arrival_email_sent_at"),
  
  // AI Transcription
  callRecordingUrl: text("call_recording_url"),
  transcription: text("transcription"),
  aiExtractedData: jsonb("ai_extracted_data"),
  callSummary: text("call_summary"),
  
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
  companyId: integer("company_id").references(() => companies.id).notNull(),
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
  companyId: integer("company_id").references(() => companies.id).notNull(),
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
  companyId: integer("company_id").references(() => companies.id).notNull(),
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
  companyId: integer("company_id").references(() => companies.id).notNull(),
  stageName: varchar("stage_name", { length: 50 }).notNull(),
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

// Pre-Assessment Form 1: RB Pre-Cert / Clinical Pre-Assessment
export const preCertForms = pgTable("pre_cert_forms", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  inquiryId: integer("inquiry_id").references(() => inquiries.id).notNull().unique(),
  formData: jsonb("form_data").notNull().default({}),
  isComplete: varchar("is_complete", { length: 10 }).default("no"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPreCertFormSchema = createInsertSchema(preCertForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PreCertForm = typeof preCertForms.$inferSelect;
export type InsertPreCertForm = z.infer<typeof insertPreCertFormSchema>;

// Pre-Assessment Form 2: Nursing Admission Assessment
export const nursingAssessmentForms = pgTable("nursing_assessment_forms", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  inquiryId: integer("inquiry_id").references(() => inquiries.id).notNull().unique(),
  formData: jsonb("form_data").notNull().default({}),
  isComplete: varchar("is_complete", { length: 10 }).default("no"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNursingAssessmentFormSchema = createInsertSchema(nursingAssessmentForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NursingAssessmentForm = typeof nursingAssessmentForms.$inferSelect;
export type InsertNursingAssessmentForm = z.infer<typeof insertNursingAssessmentFormSchema>;

// Pre-Assessment Form 3: Pre-Screening Form
export const preScreeningForms = pgTable("pre_screening_forms", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  inquiryId: integer("inquiry_id").references(() => inquiries.id).notNull().unique(),
  formData: jsonb("form_data").notNull().default({}),
  isComplete: varchar("is_complete", { length: 10 }).default("no"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPreScreeningFormSchema = createInsertSchema(preScreeningForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PreScreeningForm = typeof preScreeningForms.$inferSelect;
export type InsertPreScreeningForm = z.infer<typeof insertPreScreeningFormSchema>;

// Audit log table for HIPAA compliance - tracks PHI access and modifications
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(), // create, update, delete, view
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // inquiry, referral_account, etc
  resourceId: integer("resource_id"), // ID of the affected record
  details: text("details"), // Additional context (sanitized, no PHI)
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_audit_company").on(table.companyId),
  index("IDX_audit_user").on(table.userId),
  index("IDX_audit_resource").on(table.resourceType, table.resourceId),
  index("IDX_audit_created").on(table.createdAt),
]);

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Phone number normalization helper - converts to E.164 format
export function normalizePhoneE164(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return null;
  // If 10 digits (US), prepend +1
  if (digits.length === 10) return `+1${digits}`;
  // If 11 digits starting with 1, prepend +
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  // Otherwise just return with + prefix
  return `+${digits}`;
}

// Call direction enum
export const callDirections = ["inbound", "outbound"] as const;
export type CallDirection = typeof callDirections[number];

// Call source enum  
export const callSources = ["ctm", "app_click", "manual"] as const;
export type CallSource = typeof callSources[number];

// Call Logs table - tracks all inbound/outbound calls for an inquiry
export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  inquiryId: integer("inquiry_id").references(() => inquiries.id).notNull(),
  phoneE164: varchar("phone_e164", { length: 20 }).notNull(),
  direction: varchar("direction", { length: 10 }).notNull(), // inbound/outbound
  source: varchar("source", { length: 20 }).notNull(), // ctm/app_click/manual
  ctmCallId: varchar("ctm_call_id", { length: 100 }),
  durationSeconds: integer("duration_seconds"),
  recordingUrl: text("recording_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_call_logs_inquiry").on(table.inquiryId),
  index("IDX_call_logs_phone").on(table.phoneE164),
  index("IDX_call_logs_ctm").on(table.ctmCallId),
]);

export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
});

export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;

// Inquiry Phone Map table - maps phone numbers to inquiries for deduplication
export const inquiryPhoneMap = pgTable("inquiry_phone_map", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  inquiryId: integer("inquiry_id").references(() => inquiries.id).notNull(),
  phoneE164: varchar("phone_e164", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_phone_map_phone").on(table.phoneE164),
  index("IDX_phone_map_inquiry").on(table.inquiryId),
]);

export const insertInquiryPhoneMapSchema = createInsertSchema(inquiryPhoneMap).omit({
  id: true,
  createdAt: true,
});

export type InquiryPhoneMap = typeof inquiryPhoneMap.$inferSelect;
export type InsertInquiryPhoneMap = z.infer<typeof insertInquiryPhoneMapSchema>;

// ========================
// BILLING SYSTEM TABLES
// ========================

// Billing plan types
export const billingPlanTypes = ["monthly", "annual"] as const;
export type BillingPlanType = typeof billingPlanTypes[number];

// Billing status types
export const billingStatuses = ["trial", "active", "past_due", "cancelled", "expired"] as const;
export type BillingStatus = typeof billingStatuses[number];

// Billing Accounts table - facility billing status and Authorize.net integration
export const billingAccounts = pgTable("billing_accounts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull().unique(),
  
  // Subscription status
  status: varchar("status", { length: 20 }).notNull().default("trial"), // trial, active, past_due, cancelled, expired
  planType: varchar("plan_type", { length: 20 }), // monthly, annual (null during trial)
  
  // Trial tracking
  trialStartDate: timestamp("trial_start_date").defaultNow(),
  trialEndDate: timestamp("trial_end_date"),
  
  // Subscription dates
  subscriptionStartDate: timestamp("subscription_start_date"),
  nextBillingDate: timestamp("next_billing_date"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Authorize.net Customer Information Manager (CIM) IDs
  authNetCustomerProfileId: varchar("authnet_customer_profile_id", { length: 50 }),
  authNetPaymentProfileId: varchar("authnet_payment_profile_id", { length: 50 }),
  
  // Authorize.net Automated Recurring Billing (ARB) IDs
  authNetBaseSubscriptionId: varchar("authnet_base_subscription_id", { length: 50 }),
  authNetUserSubscriptionId: varchar("authnet_user_subscription_id", { length: 50 }),
  
  // Payment method info (masked for display only)
  cardLast4: varchar("card_last4", { length: 4 }),
  cardType: varchar("card_type", { length: 20 }), // Visa, Mastercard, etc.
  cardExpMonth: varchar("card_exp_month", { length: 2 }),
  cardExpYear: varchar("card_exp_year", { length: 4 }),
  
  // Billing amounts (in cents)
  basePriceCents: integer("base_price_cents"), // Facility base subscription
  perUserPriceCents: integer("per_user_price_cents"), // Per active user
  activeUserCount: integer("active_user_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_billing_company").on(table.companyId),
  index("IDX_billing_status").on(table.status),
]);

export const insertBillingAccountSchema = createInsertSchema(billingAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BillingAccount = typeof billingAccounts.$inferSelect;
export type InsertBillingAccount = z.infer<typeof insertBillingAccountSchema>;

// Billing Invoices table - invoice/receipt records
export const billingInvoices = pgTable("billing_invoices", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  billingAccountId: integer("billing_account_id").references(() => billingAccounts.id).notNull(),
  
  // Invoice details
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  description: text("description"),
  
  // Amounts (in cents)
  subtotalCents: integer("subtotal_cents").notNull(),
  taxCents: integer("tax_cents").default(0),
  totalCents: integer("total_cents").notNull(),
  
  // Payment status
  status: varchar("status", { length: 20 }).notNull(), // paid, pending, failed, refunded
  paidAt: timestamp("paid_at"),
  
  // Authorize.net transaction details
  authNetTransactionId: varchar("authnet_transaction_id", { length: 50 }),
  authNetResponseCode: varchar("authnet_response_code", { length: 10 }),
  
  // Billing period
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  
  // Line items breakdown (JSON)
  lineItems: jsonb("line_items"), // Array of {description, quantity, unitPriceCents, totalCents}
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_invoice_company").on(table.companyId),
  index("IDX_invoice_billing_account").on(table.billingAccountId),
  index("IDX_invoice_status").on(table.status),
  index("IDX_invoice_created").on(table.createdAt),
]);

export const insertBillingInvoiceSchema = createInsertSchema(billingInvoices).omit({
  id: true,
  createdAt: true,
});

export type BillingInvoice = typeof billingInvoices.$inferSelect;
export type InsertBillingInvoice = z.infer<typeof insertBillingInvoiceSchema>;

// Billing Events table - webhook audit log for payment events
export const billingEvents = pgTable("billing_events", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  
  // Event details
  eventType: varchar("event_type", { length: 50 }).notNull(), // payment_success, payment_failed, subscription_cancelled, etc.
  eventSource: varchar("event_source", { length: 20 }).notNull(), // authorize_net, system, admin
  
  // Authorize.net webhook data
  authNetTransactionId: varchar("authnet_transaction_id", { length: 50 }),
  authNetSubscriptionId: varchar("authnet_subscription_id", { length: 50 }),
  
  // Raw webhook payload (for debugging)
  rawPayload: jsonb("raw_payload"),
  
  // Processing status
  processed: varchar("processed", { length: 10 }).default("no"),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_billing_event_company").on(table.companyId),
  index("IDX_billing_event_type").on(table.eventType),
  index("IDX_billing_event_transaction").on(table.authNetTransactionId),
  index("IDX_billing_event_created").on(table.createdAt),
]);

export const insertBillingEventSchema = createInsertSchema(billingEvents).omit({
  id: true,
  createdAt: true,
});

export type BillingEvent = typeof billingEvents.$inferSelect;
export type InsertBillingEvent = z.infer<typeof insertBillingEventSchema>;

// Contact form submissions table
export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  companyName: varchar("company_name", { length: 255 }),
  message: text("message").notNull(),
  source: varchar("source", { length: 50 }).default("landing_page"), // landing_page, in_app_support
  userId: varchar("user_id").references(() => users.id), // null for public submissions
  status: varchar("status", { length: 20 }).default("new"), // new, read, resolved
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_contact_submission_status").on(table.status),
  index("IDX_contact_submission_created").on(table.createdAt),
]);

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;

// Billing constants
export const BILLING_PRICES = {
  monthly: {
    baseCents: 9900, // $99/month
    perUserCents: 2500, // $25/user/month
  },
  annual: {
    baseCents: 99900, // $999/year
    perUserCents: 25000, // $250/user/year
  },
  trialDays: 14,
} as const;
