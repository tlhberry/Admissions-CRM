import argon2 from "argon2";
import { db } from "../db";
import { users, passwordHistory } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// Password policy configuration (HIPAA compliant)
const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: true,
  historyCount: 5, // Prevent reuse of last 5 passwords
  expiryDays: 90, // Password expires after 90 days
};

// Argon2 configuration (OWASP recommended settings)
const ARGON2_CONFIG = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordPolicyResult {
  meetsPolicy: boolean;
  errors: string[];
}

/**
 * Validate password against HIPAA-compliant policy
 */
export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
  }

  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (PASSWORD_POLICY.requireSymbol && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    meetsPolicy: errors.length === 0,
    errors,
  };
}

/**
 * Hash password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_CONFIG);
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Check if password was used in last N passwords (prevent reuse)
 */
export async function checkPasswordHistory(userId: string, newPassword: string): Promise<boolean> {
  const history = await db
    .select()
    .from(passwordHistory)
    .where(eq(passwordHistory.userId, userId))
    .orderBy(desc(passwordHistory.createdAt))
    .limit(PASSWORD_POLICY.historyCount);

  for (const entry of history) {
    if (await verifyPassword(newPassword, entry.passwordHash)) {
      return false; // Password was used before
    }
  }

  return true; // Password is unique
}

/**
 * Add password to history (called after successful password change)
 */
export async function addPasswordToHistory(userId: string, passwordHash: string): Promise<void> {
  await db.insert(passwordHistory).values({
    userId,
    passwordHash,
  });

  // Clean up old entries (keep only last N passwords)
  const allHistory = await db
    .select({ id: passwordHistory.id })
    .from(passwordHistory)
    .where(eq(passwordHistory.userId, userId))
    .orderBy(desc(passwordHistory.createdAt));

  if (allHistory.length > PASSWORD_POLICY.historyCount) {
    const idsToDelete = allHistory.slice(PASSWORD_POLICY.historyCount).map(h => h.id);
    for (const id of idsToDelete) {
      await db.delete(passwordHistory).where(eq(passwordHistory.id, id));
    }
  }
}

/**
 * Calculate password expiry date (90 days from now)
 */
export function calculatePasswordExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + PASSWORD_POLICY.expiryDays);
  return expiry;
}

/**
 * Check if password is expired
 */
export function isPasswordExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > new Date(expiresAt);
}

/**
 * Set a new password for a user (includes validation, hashing, and history)
 */
export async function setUserPassword(
  userId: string,
  newPassword: string,
  skipHistoryCheck = false
): Promise<{ success: boolean; errors: string[] }> {
  // Validate password policy
  const policyResult = validatePasswordPolicy(newPassword);
  if (!policyResult.meetsPolicy) {
    return { success: false, errors: policyResult.errors };
  }

  // Check password history (unless skipping for initial password)
  if (!skipHistoryCheck) {
    const isUnique = await checkPasswordHistory(userId, newPassword);
    if (!isUnique) {
      return { 
        success: false, 
        errors: [`Cannot reuse any of your last ${PASSWORD_POLICY.historyCount} passwords`] 
      };
    }
  }

  // Hash the new password
  const newHash = await hashPassword(newPassword);
  const expiryDate = calculatePasswordExpiry();
  const now = new Date();

  // Update user's password
  await db
    .update(users)
    .set({
      passwordHash: newHash,
      passwordChangedAt: now,
      passwordExpiresAt: expiryDate,
      mustChangePassword: "no",
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  // Add to password history
  await addPasswordToHistory(userId, newHash);

  return { success: true, errors: [] };
}

/**
 * Get password policy requirements as displayable text
 */
export function getPasswordPolicyRequirements(): string[] {
  return [
    `At least ${PASSWORD_POLICY.minLength} characters`,
    "At least one uppercase letter (A-Z)",
    "At least one lowercase letter (a-z)",
    "At least one number (0-9)",
    "At least one special character (!@#$%^&*...)",
    `Cannot reuse your last ${PASSWORD_POLICY.historyCount} passwords`,
    `Password expires every ${PASSWORD_POLICY.expiryDays} days`,
  ];
}
