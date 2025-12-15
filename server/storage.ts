import {
  users,
  inquiries,
  referralAccounts,
  referralContacts,
  activityLogs,
  notificationSettings,
  preCertForms,
  nursingAssessmentForms,
  preScreeningForms,
  companies,
  auditLogs,
  callLogs,
  inquiryPhoneMap,
  billingAccounts,
  billingInvoices,
  billingEvents,
  contactSubmissions,
  type User,
  type UpsertUser,
  type Inquiry,
  type InsertInquiry,
  type UpdateInquiry,
  type ReferralAccount,
  type InsertReferralAccount,
  type ReferralContact,
  type InsertReferralContact,
  type ActivityLog,
  type InsertActivityLog,
  type NotificationSetting,
  type InsertNotificationSetting,
  type PreCertForm,
  type InsertPreCertForm,
  type NursingAssessmentForm,
  type InsertNursingAssessmentForm,
  type PreScreeningForm,
  type InsertPreScreeningForm,
  type Company,
  type InsertCompany,
  type AuditLog,
  type InsertAuditLog,
  type CallLog,
  type InsertCallLog,
  type InquiryPhoneMap,
  type InsertInquiryPhoneMap,
  type BillingAccount,
  type InsertBillingAccount,
  type BillingInvoice,
  type InsertBillingInvoice,
  type BillingEvent,
  type InsertBillingEvent,
  type ContactSubmission,
  type InsertContactSubmission,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, ilike, or, SQL, count } from "drizzle-orm";

export interface InquiryFilters {
  search?: string;
  stage?: string;
  referralSource?: string;
  insuranceProvider?: string;
  startDate?: string;
  endDate?: string;
}

export interface IStorage {
  // Company operations
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByWebhookToken(token: string): Promise<Company | undefined>;
  createCompany(data: InsertCompany): Promise<Company>;
  updateCompany(id: number, data: Partial<InsertCompany>): Promise<Company | undefined>;
  
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByCompany(companyId: number): Promise<User[]>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined>;
  
  // Inquiry operations (all require companyId for tenant isolation)
  getInquiry(id: number, companyId: number): Promise<Inquiry | undefined>;
  getInquiriesByUser(userId: string, companyId: number): Promise<Inquiry[]>;
  getAllInquiries(companyId: number): Promise<Inquiry[]>;
  searchInquiries(companyId: number, filters: InquiryFilters): Promise<Inquiry[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: number, companyId: number, data: UpdateInquiry): Promise<Inquiry | undefined>;
  deleteInquiry(id: number, companyId: number): Promise<void>;
  
  // Referral Account operations
  getReferralAccount(id: number, companyId: number): Promise<ReferralAccount | undefined>;
  getAllReferralAccounts(companyId: number): Promise<ReferralAccount[]>;
  getReferralAccountsByRep(userId: string, companyId: number): Promise<ReferralAccount[]>;
  createReferralAccount(data: InsertReferralAccount): Promise<ReferralAccount>;
  updateReferralAccount(id: number, companyId: number, data: Partial<InsertReferralAccount>): Promise<ReferralAccount | undefined>;
  deleteReferralAccount(id: number, companyId: number): Promise<void>;
  
  // Referral Contact operations
  getReferralContact(id: number): Promise<ReferralContact | undefined>;
  getContactsByAccount(accountId: number): Promise<ReferralContact[]>;
  createReferralContact(data: InsertReferralContact): Promise<ReferralContact>;
  updateReferralContact(id: number, data: Partial<InsertReferralContact>): Promise<ReferralContact | undefined>;
  deleteReferralContact(id: number): Promise<void>;
  
  // Activity Log operations
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogsByAccount(accountId: number): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: string, companyId: number): Promise<ActivityLog[]>;
  createActivityLog(data: InsertActivityLog): Promise<ActivityLog>;
  
  // Notification Settings operations
  getNotificationSettings(companyId: number): Promise<NotificationSetting[]>;
  getNotificationSettingByStage(companyId: number, stageName: string): Promise<NotificationSetting | undefined>;
  upsertNotificationSetting(data: InsertNotificationSetting): Promise<NotificationSetting>;
  
  // Pre-Assessment Form operations
  getPreCertForm(inquiryId: number): Promise<PreCertForm | undefined>;
  upsertPreCertForm(data: InsertPreCertForm): Promise<PreCertForm>;
  getNursingAssessmentForm(inquiryId: number): Promise<NursingAssessmentForm | undefined>;
  upsertNursingAssessmentForm(data: InsertNursingAssessmentForm): Promise<NursingAssessmentForm>;
  getPreScreeningForm(inquiryId: number): Promise<PreScreeningForm | undefined>;
  upsertPreScreeningForm(data: InsertPreScreeningForm): Promise<PreScreeningForm>;
  getFormsStatus(inquiryId: number): Promise<{ preCert: boolean; nursing: boolean; preScreening: boolean }>;
  
  // Audit log operations (HIPAA compliance)
  createAuditLog(data: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(companyId: number, limit?: number): Promise<AuditLog[]>;
  
  // Bed Board operations
  getAdmittedCount(companyId: number): Promise<number>;
  getAdmittedInquiries(companyId: number): Promise<Inquiry[]>;
  
  // HIPAA Activity Tracking
  updateLastActivity(userId: string): Promise<void>;
  
  // Call Log operations
  getCallLogsByInquiry(inquiryId: number): Promise<CallLog[]>;
  createCallLog(data: InsertCallLog): Promise<CallLog>;
  
  // Phone Map operations (for CTM duplicate detection)
  getInquiryByPhone(companyId: number, phoneE164: string): Promise<Inquiry | undefined>;
  createInquiryPhoneMap(data: InsertInquiryPhoneMap): Promise<InquiryPhoneMap>;
  
  // Billing Account operations
  getBillingAccount(companyId: number): Promise<BillingAccount | undefined>;
  createBillingAccount(data: InsertBillingAccount): Promise<BillingAccount>;
  updateBillingAccount(companyId: number, data: Partial<InsertBillingAccount>): Promise<BillingAccount | undefined>;
  
  // Billing Invoice operations
  getBillingInvoices(companyId: number): Promise<BillingInvoice[]>;
  createBillingInvoice(data: InsertBillingInvoice): Promise<BillingInvoice>;
  updateBillingInvoice(id: number, data: Partial<InsertBillingInvoice>): Promise<BillingInvoice | undefined>;
  
  // Billing Event operations
  createBillingEvent(data: InsertBillingEvent): Promise<BillingEvent>;
  getActiveUserCount(companyId: number): Promise<number>;
  
  // Contact Submission operations
  createContactSubmission(data: InsertContactSubmission): Promise<ContactSubmission>;
}

export class DatabaseStorage implements IStorage {
  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByWebhookToken(token: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.ctmWebhookToken, token));
    return company;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const webhookToken = this.generateWebhookToken();
    const [company] = await db.insert(companies).values({
      ...data,
      ctmWebhookToken: webhookToken,
    }).returning();
    return company;
  }

  async updateCompany(id: number, data: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db.update(companies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  private generateWebhookToken(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByCompany(companyId: number): Promise<User[]> {
    return db.select().from(users)
      .where(eq(users.companyId, companyId))
      .orderBy(users.firstName);
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Inquiry operations with tenant isolation
  async getInquiry(id: number, companyId: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db
      .select()
      .from(inquiries)
      .where(and(eq(inquiries.id, id), eq(inquiries.companyId, companyId)));
    return inquiry;
  }

  async getInquiriesByUser(userId: string, companyId: number): Promise<Inquiry[]> {
    return db
      .select()
      .from(inquiries)
      .where(and(eq(inquiries.userId, userId), eq(inquiries.companyId, companyId)))
      .orderBy(desc(inquiries.createdAt));
  }

  async getAllInquiries(companyId: number): Promise<Inquiry[]> {
    return db
      .select()
      .from(inquiries)
      .where(eq(inquiries.companyId, companyId))
      .orderBy(desc(inquiries.createdAt));
  }

  async searchInquiries(companyId: number, filters: InquiryFilters): Promise<Inquiry[]> {
    const conditions: SQL[] = [eq(inquiries.companyId, companyId)];

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(inquiries.callerName, searchTerm),
          ilike(inquiries.clientName, searchTerm),
          ilike(inquiries.phoneNumber, searchTerm),
          ilike(inquiries.email, searchTerm),
          ilike(inquiries.insuranceProvider, searchTerm)
        )!
      );
    }

    if (filters.stage) {
      conditions.push(eq(inquiries.stage, filters.stage));
    }

    if (filters.referralSource) {
      conditions.push(eq(inquiries.referralSource, filters.referralSource));
    }

    if (filters.insuranceProvider) {
      conditions.push(ilike(inquiries.insuranceProvider, `%${filters.insuranceProvider}%`));
    }

    if (filters.startDate) {
      conditions.push(gte(inquiries.callDateTime, new Date(filters.startDate)));
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(inquiries.callDateTime, endDate));
    }

    return db
      .select()
      .from(inquiries)
      .where(and(...conditions))
      .orderBy(desc(inquiries.createdAt));
  }

  async createInquiry(data: InsertInquiry): Promise<Inquiry> {
    const [inquiry] = await db
      .insert(inquiries)
      .values({
        ...data,
        callDateTime: new Date(),
      })
      .returning();
    return inquiry;
  }

  async updateInquiry(id: number, companyId: number, data: UpdateInquiry): Promise<Inquiry | undefined> {
    const [inquiry] = await db
      .update(inquiries)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(inquiries.id, id), eq(inquiries.companyId, companyId)))
      .returning();
    return inquiry;
  }

  async deleteInquiry(id: number, companyId: number): Promise<void> {
    await db.delete(inquiries).where(and(eq(inquiries.id, id), eq(inquiries.companyId, companyId)));
  }

  // Referral Account operations with tenant isolation
  async getReferralAccount(id: number, companyId: number): Promise<ReferralAccount | undefined> {
    const [account] = await db.select().from(referralAccounts)
      .where(and(eq(referralAccounts.id, id), eq(referralAccounts.companyId, companyId)));
    return account;
  }

  async getAllReferralAccounts(companyId: number): Promise<ReferralAccount[]> {
    return db.select().from(referralAccounts)
      .where(eq(referralAccounts.companyId, companyId))
      .orderBy(desc(referralAccounts.createdAt));
  }

  async getReferralAccountsByRep(userId: string, companyId: number): Promise<ReferralAccount[]> {
    return db.select().from(referralAccounts)
      .where(and(eq(referralAccounts.assignedBdRepId, userId), eq(referralAccounts.companyId, companyId)))
      .orderBy(desc(referralAccounts.createdAt));
  }

  async createReferralAccount(data: InsertReferralAccount): Promise<ReferralAccount> {
    const [account] = await db.insert(referralAccounts).values(data).returning();
    return account;
  }

  async updateReferralAccount(id: number, companyId: number, data: Partial<InsertReferralAccount>): Promise<ReferralAccount | undefined> {
    const [account] = await db.update(referralAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(referralAccounts.id, id), eq(referralAccounts.companyId, companyId)))
      .returning();
    return account;
  }

  async deleteReferralAccount(id: number, companyId: number): Promise<void> {
    const account = await this.getReferralAccount(id, companyId);
    if (!account) return;
    await db.delete(referralContacts).where(eq(referralContacts.accountId, id));
    await db.delete(activityLogs).where(eq(activityLogs.accountId, id));
    await db.delete(referralAccounts).where(and(eq(referralAccounts.id, id), eq(referralAccounts.companyId, companyId)));
  }

  // Referral Contact operations
  async getReferralContact(id: number): Promise<ReferralContact | undefined> {
    const [contact] = await db.select().from(referralContacts).where(eq(referralContacts.id, id));
    return contact;
  }

  async getContactsByAccount(accountId: number): Promise<ReferralContact[]> {
    return db.select().from(referralContacts).where(eq(referralContacts.accountId, accountId));
  }

  async createReferralContact(data: InsertReferralContact): Promise<ReferralContact> {
    const [contact] = await db.insert(referralContacts).values(data).returning();
    return contact;
  }

  async updateReferralContact(id: number, data: Partial<InsertReferralContact>): Promise<ReferralContact | undefined> {
    const [contact] = await db.update(referralContacts).set(data).where(eq(referralContacts.id, id)).returning();
    return contact;
  }

  async deleteReferralContact(id: number): Promise<void> {
    await db.delete(referralContacts).where(eq(referralContacts.id, id));
  }

  // Activity Log operations
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const [log] = await db.select().from(activityLogs).where(eq(activityLogs.id, id));
    return log;
  }

  async getActivityLogsByAccount(accountId: number): Promise<ActivityLog[]> {
    return db.select().from(activityLogs)
      .where(eq(activityLogs.accountId, accountId))
      .orderBy(desc(activityLogs.activityDate));
  }

  async getActivityLogsByUser(userId: string, companyId: number): Promise<ActivityLog[]> {
    return db.select().from(activityLogs)
      .where(and(eq(activityLogs.userId, userId), eq(activityLogs.companyId, companyId)))
      .orderBy(desc(activityLogs.activityDate));
  }

  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values(data).returning();
    return log;
  }

  // Notification Settings operations
  async getNotificationSettings(companyId: number): Promise<NotificationSetting[]> {
    return db.select().from(notificationSettings)
      .where(eq(notificationSettings.companyId, companyId));
  }

  async getNotificationSettingByStage(companyId: number, stageName: string): Promise<NotificationSetting | undefined> {
    const [setting] = await db.select().from(notificationSettings)
      .where(and(eq(notificationSettings.companyId, companyId), eq(notificationSettings.stageName, stageName)));
    return setting;
  }

  async upsertNotificationSetting(data: InsertNotificationSetting): Promise<NotificationSetting> {
    const existing = await this.getNotificationSettingByStage(data.companyId, data.stageName);
    if (existing) {
      const [setting] = await db.update(notificationSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(notificationSettings.id, existing.id))
        .returning();
      return setting;
    }
    const [setting] = await db.insert(notificationSettings).values(data).returning();
    return setting;
  }

  // Pre-Assessment Form operations
  async getPreCertForm(inquiryId: number): Promise<PreCertForm | undefined> {
    const [form] = await db.select().from(preCertForms).where(eq(preCertForms.inquiryId, inquiryId));
    return form;
  }

  async upsertPreCertForm(data: InsertPreCertForm): Promise<PreCertForm> {
    const [form] = await db.insert(preCertForms)
      .values(data)
      .onConflictDoUpdate({
        target: preCertForms.inquiryId,
        set: { formData: data.formData, isComplete: data.isComplete, completedAt: data.completedAt, completedBy: data.completedBy, updatedAt: new Date() },
      })
      .returning();
    return form;
  }

  async getNursingAssessmentForm(inquiryId: number): Promise<NursingAssessmentForm | undefined> {
    const [form] = await db.select().from(nursingAssessmentForms).where(eq(nursingAssessmentForms.inquiryId, inquiryId));
    return form;
  }

  async upsertNursingAssessmentForm(data: InsertNursingAssessmentForm): Promise<NursingAssessmentForm> {
    const [form] = await db.insert(nursingAssessmentForms)
      .values(data)
      .onConflictDoUpdate({
        target: nursingAssessmentForms.inquiryId,
        set: { formData: data.formData, isComplete: data.isComplete, completedAt: data.completedAt, completedBy: data.completedBy, updatedAt: new Date() },
      })
      .returning();
    return form;
  }

  async getPreScreeningForm(inquiryId: number): Promise<PreScreeningForm | undefined> {
    const [form] = await db.select().from(preScreeningForms).where(eq(preScreeningForms.inquiryId, inquiryId));
    return form;
  }

  async upsertPreScreeningForm(data: InsertPreScreeningForm): Promise<PreScreeningForm> {
    const [form] = await db.insert(preScreeningForms)
      .values(data)
      .onConflictDoUpdate({
        target: preScreeningForms.inquiryId,
        set: { formData: data.formData, isComplete: data.isComplete, completedAt: data.completedAt, completedBy: data.completedBy, updatedAt: new Date() },
      })
      .returning();
    return form;
  }

  async getFormsStatus(inquiryId: number): Promise<{ preCert: boolean; nursing: boolean; preScreening: boolean }> {
    const [preCert, nursing, preScreening] = await Promise.all([
      this.getPreCertForm(inquiryId),
      this.getNursingAssessmentForm(inquiryId),
      this.getPreScreeningForm(inquiryId),
    ]);
    return {
      preCert: preCert?.isComplete === "yes",
      nursing: nursing?.isComplete === "yes",
      preScreening: preScreening?.isComplete === "yes",
    };
  }

  // Audit log operations (HIPAA compliance)
  async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  async getAuditLogs(companyId: number, limit = 100): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(eq(auditLogs.companyId, companyId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  // Bed Board operations
  async getAdmittedCount(companyId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(inquiries)
      .where(and(eq(inquiries.companyId, companyId), eq(inquiries.stage, "admitted")));
    return result?.count ?? 0;
  }

  async getAdmittedInquiries(companyId: number): Promise<Inquiry[]> {
    return db.select().from(inquiries)
      .where(and(eq(inquiries.companyId, companyId), eq(inquiries.stage, "admitted")))
      .orderBy(desc(inquiries.actualAdmitDate));
  }
  
  // HIPAA Activity Tracking
  async updateLastActivity(userId: string): Promise<void> {
    await db.update(users)
      .set({ lastActivityAt: new Date() })
      .where(eq(users.id, userId));
  }
  
  // Call Log operations
  async getCallLogsByInquiry(inquiryId: number): Promise<CallLog[]> {
    return db.select().from(callLogs)
      .where(eq(callLogs.inquiryId, inquiryId))
      .orderBy(desc(callLogs.createdAt));
  }
  
  async createCallLog(data: InsertCallLog): Promise<CallLog> {
    const [log] = await db.insert(callLogs).values(data).returning();
    return log;
  }
  
  // Phone Map operations (for CTM duplicate detection)
  async getInquiryByPhone(companyId: number, phoneE164: string): Promise<Inquiry | undefined> {
    // First check the phone map
    const [phoneMapping] = await db.select().from(inquiryPhoneMap)
      .where(and(
        eq(inquiryPhoneMap.companyId, companyId),
        eq(inquiryPhoneMap.phoneE164, phoneE164)
      ))
      .limit(1);
    
    if (phoneMapping) {
      const inquiry = await this.getInquiry(phoneMapping.inquiryId, companyId);
      return inquiry;
    }
    
    // Also check direct phone number on inquiries (fallback for pre-existing data)
    const [directInquiry] = await db.select().from(inquiries)
      .where(and(
        eq(inquiries.companyId, companyId),
        eq(inquiries.phoneNumber, phoneE164)
      ))
      .orderBy(desc(inquiries.createdAt))
      .limit(1);
    
    return directInquiry;
  }
  
  async createInquiryPhoneMap(data: InsertInquiryPhoneMap): Promise<InquiryPhoneMap> {
    const [mapping] = await db.insert(inquiryPhoneMap).values(data).returning();
    return mapping;
  }
  
  // Billing Account operations
  async getBillingAccount(companyId: number): Promise<BillingAccount | undefined> {
    const [account] = await db.select().from(billingAccounts)
      .where(eq(billingAccounts.companyId, companyId));
    return account;
  }
  
  async createBillingAccount(data: InsertBillingAccount): Promise<BillingAccount> {
    const [account] = await db.insert(billingAccounts).values(data).returning();
    return account;
  }
  
  async updateBillingAccount(companyId: number, data: Partial<InsertBillingAccount>): Promise<BillingAccount | undefined> {
    const [account] = await db.update(billingAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(billingAccounts.companyId, companyId))
      .returning();
    return account;
  }
  
  // Billing Invoice operations
  async getBillingInvoices(companyId: number): Promise<BillingInvoice[]> {
    return db.select().from(billingInvoices)
      .where(eq(billingInvoices.companyId, companyId))
      .orderBy(desc(billingInvoices.createdAt));
  }
  
  async createBillingInvoice(data: InsertBillingInvoice): Promise<BillingInvoice> {
    const [invoice] = await db.insert(billingInvoices).values(data).returning();
    return invoice;
  }
  
  async updateBillingInvoice(id: number, data: Partial<InsertBillingInvoice>): Promise<BillingInvoice | undefined> {
    const [invoice] = await db.update(billingInvoices)
      .set(data)
      .where(eq(billingInvoices.id, id))
      .returning();
    return invoice;
  }
  
  // Billing Event operations
  async createBillingEvent(data: InsertBillingEvent): Promise<BillingEvent> {
    const [event] = await db.insert(billingEvents).values(data).returning();
    return event;
  }
  
  // Get count of active users for billing
  async getActiveUserCount(companyId: number): Promise<number> {
    const result = await db.select({ count: count() }).from(users)
      .where(and(
        eq(users.companyId, companyId),
        eq(users.isActive, "yes")
      ));
    return result[0]?.count || 0;
  }
  
  // Contact Submission operations
  async createContactSubmission(data: InsertContactSubmission): Promise<ContactSubmission> {
    const [submission] = await db.insert(contactSubmissions).values(data).returning();
    return submission;
  }
}

// Helper function to log audit events (call this from routes)
export async function logAudit(
  companyId: number,
  userId: string | null,
  action: "create" | "update" | "delete" | "view",
  resourceType: string,
  resourceId: number | null,
  details?: string,
  req?: { ip?: string; headers?: { "user-agent"?: string } }
): Promise<void> {
  try {
    await storage.createAuditLog({
      companyId,
      userId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req?.ip || null,
      userAgent: req?.headers?.["user-agent"]?.substring(0, 500) || null,
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error("Failed to create audit log:", error);
  }
}

export const storage = new DatabaseStorage();
