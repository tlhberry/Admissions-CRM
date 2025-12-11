import {
  users,
  inquiries,
  type User,
  type UpsertUser,
  type Inquiry,
  type InsertInquiry,
  type UpdateInquiry,
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
  
  // Inquiry operations
  getInquiry(id: number): Promise<Inquiry | undefined>;
  getInquiriesByUser(userId: string): Promise<Inquiry[]>;
  getAllInquiries(): Promise<Inquiry[]>;
  searchInquiries(filters: InquiryFilters): Promise<Inquiry[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: number, data: UpdateInquiry): Promise<Inquiry | undefined>;
  deleteInquiry(id: number): Promise<void>;
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
}

export const storage = new DatabaseStorage();
