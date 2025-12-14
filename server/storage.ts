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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, ilike, or, SQL } from "drizzle-orm";

export interface InquiryFilters {
  search?: string;
  stage?: string;
  referralSource?: string;
  insuranceProvider?: string;
  startDate?: string;
  endDate?: string;
}

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Inquiry operations
  getInquiry(id: number): Promise<Inquiry | undefined>;
  getInquiriesByUser(userId: string): Promise<Inquiry[]>;
  getAllInquiries(): Promise<Inquiry[]>;
  searchInquiries(filters: InquiryFilters): Promise<Inquiry[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: number, data: UpdateInquiry): Promise<Inquiry | undefined>;
  deleteInquiry(id: number): Promise<void>;
  
  // Referral Account operations
  getReferralAccount(id: number): Promise<ReferralAccount | undefined>;
  getAllReferralAccounts(): Promise<ReferralAccount[]>;
  getReferralAccountsByRep(userId: string): Promise<ReferralAccount[]>;
  createReferralAccount(data: InsertReferralAccount): Promise<ReferralAccount>;
  updateReferralAccount(id: number, data: Partial<InsertReferralAccount>): Promise<ReferralAccount | undefined>;
  deleteReferralAccount(id: number): Promise<void>;
  
  // Referral Contact operations
  getReferralContact(id: number): Promise<ReferralContact | undefined>;
  getContactsByAccount(accountId: number): Promise<ReferralContact[]>;
  createReferralContact(data: InsertReferralContact): Promise<ReferralContact>;
  updateReferralContact(id: number, data: Partial<InsertReferralContact>): Promise<ReferralContact | undefined>;
  deleteReferralContact(id: number): Promise<void>;
  
  // Activity Log operations
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogsByAccount(accountId: number): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: string): Promise<ActivityLog[]>;
  createActivityLog(data: InsertActivityLog): Promise<ActivityLog>;
  
  // Notification Settings operations
  getNotificationSettings(): Promise<NotificationSetting[]>;
  getNotificationSettingByStage(stageName: string): Promise<NotificationSetting | undefined>;
  upsertNotificationSetting(data: InsertNotificationSetting): Promise<NotificationSetting>;
  
  // Pre-Assessment Form operations
  getPreCertForm(inquiryId: number): Promise<PreCertForm | undefined>;
  upsertPreCertForm(data: InsertPreCertForm): Promise<PreCertForm>;
  getNursingAssessmentForm(inquiryId: number): Promise<NursingAssessmentForm | undefined>;
  upsertNursingAssessmentForm(data: InsertNursingAssessmentForm): Promise<NursingAssessmentForm>;
  getPreScreeningForm(inquiryId: number): Promise<PreScreeningForm | undefined>;
  upsertPreScreeningForm(data: InsertPreScreeningForm): Promise<PreScreeningForm>;
  getFormsStatus(inquiryId: number): Promise<{ preCert: boolean; nursing: boolean; preScreening: boolean }>;
}

export class DatabaseStorage implements IStorage {
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

  // Inquiry operations
  async getInquiry(id: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.id, id));
    return inquiry;
  }

  async getInquiriesByUser(userId: string): Promise<Inquiry[]> {
    return db
      .select()
      .from(inquiries)
      .where(eq(inquiries.userId, userId))
      .orderBy(desc(inquiries.createdAt));
  }

  async getAllInquiries(): Promise<Inquiry[]> {
    return db
      .select()
      .from(inquiries)
      .orderBy(desc(inquiries.createdAt));
  }

  async searchInquiries(filters: InquiryFilters): Promise<Inquiry[]> {
    const conditions: SQL[] = [];

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

    if (conditions.length === 0) {
      return this.getAllInquiries();
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

  async updateInquiry(id: number, data: UpdateInquiry): Promise<Inquiry | undefined> {
    const [inquiry] = await db
      .update(inquiries)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(inquiries.id, id))
      .returning();
    return inquiry;
  }

  async deleteInquiry(id: number): Promise<void> {
    await db.delete(inquiries).where(eq(inquiries.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.firstName);
  }

  // Referral Account operations
  async getReferralAccount(id: number): Promise<ReferralAccount | undefined> {
    const [account] = await db.select().from(referralAccounts).where(eq(referralAccounts.id, id));
    return account;
  }

  async getAllReferralAccounts(): Promise<ReferralAccount[]> {
    return db.select().from(referralAccounts).orderBy(desc(referralAccounts.createdAt));
  }

  async getReferralAccountsByRep(userId: string): Promise<ReferralAccount[]> {
    return db.select().from(referralAccounts)
      .where(eq(referralAccounts.assignedBdRepId, userId))
      .orderBy(desc(referralAccounts.createdAt));
  }

  async createReferralAccount(data: InsertReferralAccount): Promise<ReferralAccount> {
    const [account] = await db.insert(referralAccounts).values(data).returning();
    return account;
  }

  async updateReferralAccount(id: number, data: Partial<InsertReferralAccount>): Promise<ReferralAccount | undefined> {
    const [account] = await db.update(referralAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(referralAccounts.id, id))
      .returning();
    return account;
  }

  async deleteReferralAccount(id: number): Promise<void> {
    await db.delete(referralContacts).where(eq(referralContacts.accountId, id));
    await db.delete(activityLogs).where(eq(activityLogs.accountId, id));
    await db.delete(referralAccounts).where(eq(referralAccounts.id, id));
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

  async getActivityLogsByUser(userId: string): Promise<ActivityLog[]> {
    return db.select().from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.activityDate));
  }

  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values(data).returning();
    return log;
  }

  // Notification Settings operations
  async getNotificationSettings(): Promise<NotificationSetting[]> {
    return db.select().from(notificationSettings);
  }

  async getNotificationSettingByStage(stageName: string): Promise<NotificationSetting | undefined> {
    const [setting] = await db.select().from(notificationSettings)
      .where(eq(notificationSettings.stageName, stageName));
    return setting;
  }

  async upsertNotificationSetting(data: InsertNotificationSetting): Promise<NotificationSetting> {
    const [setting] = await db.insert(notificationSettings)
      .values(data)
      .onConflictDoUpdate({
        target: notificationSettings.stageName,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
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
}

export const storage = new DatabaseStorage();
