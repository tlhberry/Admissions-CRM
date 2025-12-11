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
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Inquiry operations
  getInquiry(id: number): Promise<Inquiry | undefined>;
  getInquiriesByUser(userId: string): Promise<Inquiry[]>;
  getAllInquiries(): Promise<Inquiry[]>;
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
