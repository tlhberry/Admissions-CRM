import { authenticator } from "otplib";
import QRCode from "qrcode";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// TOTP configuration
const TOTP_CONFIG = {
  issuer: "AdmitSimple",
  window: 1, // Allow 1 step before/after for time drift
};

// Configure authenticator
authenticator.options = {
  window: TOTP_CONFIG.window,
};

export interface TOTPSetupResult {
  secret: string;
  qrCodeDataUrl: string;
  manualEntryKey: string;
}

export interface TOTPVerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Generate a new TOTP secret for user enrollment
 */
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate setup data including QR code for authenticator app
 */
export async function generateTOTPSetup(email: string, secret: string): Promise<TOTPSetupResult> {
  const otpAuthUrl = authenticator.keyuri(email, TOTP_CONFIG.issuer, secret);
  
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, {
    errorCorrectionLevel: "M",
    width: 256,
    margin: 2,
  });

  // Format secret for manual entry (groups of 4 characters)
  const manualEntryKey = secret.match(/.{1,4}/g)?.join(" ") || secret;

  return {
    secret,
    qrCodeDataUrl,
    manualEntryKey,
  };
}

/**
 * Verify a TOTP token against a secret
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * Enable TOTP 2FA for a user
 */
export async function enableTOTP(userId: string, secret: string): Promise<void> {
  await db
    .update(users)
    .set({
      totpSecret: secret,
      totpEnabled: "yes",
      twoFactorSetupComplete: "yes",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Disable TOTP 2FA for a user
 */
export async function disableTOTP(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      totpSecret: null,
      totpEnabled: "no",
      twoFactorSetupComplete: "no",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Check if user has any 2FA method enabled
 */
export async function has2FAEnabled(userId: string): Promise<boolean> {
  const [user] = await db
    .select({
      totpEnabled: users.totpEnabled,
      sms2faEnabled: users.sms2faEnabled,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return false;
  return user.totpEnabled === "yes" || user.sms2faEnabled === "yes";
}

/**
 * Get user's 2FA status
 */
export async function get2FAStatus(userId: string): Promise<{
  totpEnabled: boolean;
  smsEnabled: boolean;
  anyEnabled: boolean;
  setupComplete: boolean;
}> {
  const [user] = await db
    .select({
      totpEnabled: users.totpEnabled,
      sms2faEnabled: users.sms2faEnabled,
      twoFactorSetupComplete: users.twoFactorSetupComplete,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return {
      totpEnabled: false,
      smsEnabled: false,
      anyEnabled: false,
      setupComplete: false,
    };
  }

  const totpEnabled = user.totpEnabled === "yes";
  const smsEnabled = user.sms2faEnabled === "yes";

  return {
    totpEnabled,
    smsEnabled,
    anyEnabled: totpEnabled || smsEnabled,
    setupComplete: user.twoFactorSetupComplete === "yes",
  };
}
