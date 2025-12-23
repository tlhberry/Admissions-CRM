import { Router, Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db";
import { users, loginAttempts, auditLogs, companies, passwordResetTokens } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import {
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
  setUserPassword,
  isPasswordExpired,
  getPasswordPolicyRequirements,
} from "./passwordService";
import {
  generateTOTPSecret,
  generateTOTPSetup,
  verifyTOTPToken,
  enableTOTP,
  get2FAStatus,
} from "./totpService";

const router = Router();

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MESSAGE = "Account locked due to too many failed attempts. Contact an administrator.";

// Helper to get client IP
function getClientIP(req: Request): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip || "unknown";
}

// Helper to log login attempts
async function logLoginAttempt(
  email: string,
  userId: string | null,
  success: boolean,
  failureReason?: string,
  req?: Request,
  twoFactorMethod?: string,
  twoFactorSuccess?: boolean
) {
  await db.insert(loginAttempts).values({
    email,
    userId,
    success: success ? "yes" : "no",
    failureReason,
    ipAddress: req ? getClientIP(req) : null,
    userAgent: req?.headers["user-agent"]?.substring(0, 500) || null,
    twoFactorMethod,
    twoFactorSuccess: twoFactorSuccess !== undefined ? (twoFactorSuccess ? "yes" : "no") : null,
  });
}

// Helper to log audit events
async function logAuditEvent(
  companyId: number,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId?: number,
  details?: string,
  req?: Request
) {
  await db.insert(auditLogs).values({
    companyId,
    userId,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress: req ? getClientIP(req) : null,
    userAgent: req?.headers["user-agent"]?.substring(0, 500) || null,
  });
}

// List of blocked free email providers
const BLOCKED_EMAIL_DOMAINS = [
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.co.uk", "ymail.com",
  "hotmail.com", "hotmail.co.uk", "outlook.com", "live.com", "msn.com",
  "aol.com",
  "icloud.com", "me.com", "mac.com",
  "protonmail.com", "proton.me",
  "mail.com", "email.com",
  "zoho.com",
  "yandex.com", "yandex.ru",
  "gmx.com", "gmx.net",
  "fastmail.com",
  "tutanota.com",
  "inbox.com",
  "mail.ru",
];

// POST /api/auth/register/public - Public self-registration
router.post("/register/public", async (req: Request, res: Response) => {
  try {
    const { email: rawEmail, password, firstName, lastName, organizationName } = req.body;

    // Validate required fields
    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    // Normalize email to lowercase for consistent storage and comparison
    const email = rawEmail.toLowerCase().trim();
    
    // Extract email domain
    const emailDomain = email.split("@")[1];

    // Block free email providers - require company email
    if (BLOCKED_EMAIL_DOMAINS.includes(emailDomain)) {
      return res.status(400).json({ 
        message: "Please use your company email address. Personal email addresses like Gmail, Yahoo, or Hotmail are not allowed." 
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First and last name are required" });
    }

    if (!organizationName) {
      return res.status(400).json({ message: "Organization name is required" });
    }

    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check if someone from the same organization (same email domain) already registered
    const existingOrgUser = await db.select().from(users).where(ilike(users.email, `%@${emailDomain}`));
    if (existingOrgUser.length > 0) {
      return res.status(400).json({ 
        message: "Your organization already has an account. Please contact support@admitsimple.com for help accessing your organization's account." 
      });
    }

    // Validate password
    const policyResult = validatePasswordPolicy(password);
    if (!policyResult.meetsPolicy) {
      return res.status(400).json({ 
        message: "Password does not meet requirements",
        errors: policyResult.errors,
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90);

    // Create a new company/organization for this user
    const [newCompany] = await db.insert(companies).values({
      name: organizationName,
      isActive: "yes",
    }).returning();

    // Create user as admin of their new organization
    const [newUser] = await db.insert(users).values({
      email,
      firstName,
      lastName,
      role: "admin",
      companyId: newCompany.id,
      passwordHash,
      passwordChangedAt: now,
      passwordExpiresAt: expiryDate,
      mustChangePassword: "no",
      twoFactorSetupComplete: "no",
      isActive: "yes",
    }).returning();

    // Log audit event
    await logAuditEvent(
      newCompany.id,
      newUser.id,
      "create",
      "user",
      undefined,
      `Self-registered user: ${email} as admin of ${organizationName}`,
      req
    );

    res.status(201).json({
      message: "Account created successfully. Please sign in to continue.",
      userId: newUser.id,
      email: newUser.email,
    });
  } catch (error) {
    console.error("Public registration error:", error);
    res.status(500).json({ message: "Failed to create account" });
  }
});

// POST /api/auth/register - Register a new user (admin only)
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, companyId } = req.body;

    // Check if current user is admin - use session userId for custom auth
    const sessionUserId = (req.session as any).userId;
    console.log("[register] Session check - userId:", sessionUserId, "type:", typeof sessionUserId);
    console.log("[register] Full session:", JSON.stringify(req.session));
    
    if (!sessionUserId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Look up the current user to verify admin role
    const [currentUser] = await db.select().from(users).where(eq(users.id, sessionUserId));
    console.log("[register] Found user:", currentUser?.email, "role:", currentUser?.role);
    
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ message: "Only administrators can create new users" });
    }

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Validate password
    const policyResult = validatePasswordPolicy(password);
    if (!policyResult.meetsPolicy) {
      return res.status(400).json({ 
        message: "Password does not meet requirements",
        errors: policyResult.errors,
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90);

    // Create user
    const [newUser] = await db.insert(users).values({
      email,
      firstName,
      lastName,
      role: role || "admissions",
      companyId: companyId || currentUser.companyId,
      passwordHash,
      passwordChangedAt: now,
      passwordExpiresAt: expiryDate,
      mustChangePassword: "yes", // Force password change on first login
      twoFactorSetupComplete: "no",
      isActive: "yes",
    }).returning();

    // Log audit event
    await logAuditEvent(
      newUser.companyId!,
      currentUser.id,
      "create",
      "user",
      undefined,
      `Created user: ${email} with role: ${role || "admissions"}`,
      req
    );

    res.status(201).json({
      message: "User created successfully",
      userId: newUser.id,
      email: newUser.email,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

// POST /api/auth/login - Step 1: Validate credentials
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email: rawEmail, password } = req.body;

    if (!rawEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Normalize email to lowercase for consistent comparison
    const email = rawEmail.toLowerCase().trim();

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      await logLoginAttempt(email, null, false, "User not found", req);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if account is locked
    if (user.lockedAt) {
      await logLoginAttempt(email, user.id, false, "Account locked", req);
      return res.status(403).json({ message: LOCKOUT_MESSAGE });
    }

    // Check if account is active
    if (user.isActive !== "yes") {
      await logLoginAttempt(email, user.id, false, "Account inactive", req);
      return res.status(403).json({ message: "Account is deactivated. Contact an administrator." });
    }

    // Verify password
    if (!user.passwordHash) {
      await logLoginAttempt(email, user.id, false, "No password set", req);
      return res.status(401).json({ message: "Please reset your password" });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      // Increment failed attempts
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Lock the account
        await db.update(users).set({
          failedLoginAttempts: newAttempts,
          lockedAt: new Date(),
          lockedReason: "Too many failed login attempts",
          updatedAt: new Date(),
        }).where(eq(users.id, user.id));

        await logLoginAttempt(email, user.id, false, "Account locked - max attempts", req);
        
        // Log audit event for account lockout
        if (user.companyId) {
          await logAuditEvent(
            user.companyId,
            user.id,
            "lockout",
            "user",
            undefined,
            "Account locked due to failed login attempts",
            req
          );
        }

        return res.status(403).json({ message: LOCKOUT_MESSAGE });
      } else {
        await db.update(users).set({
          failedLoginAttempts: newAttempts,
          updatedAt: new Date(),
        }).where(eq(users.id, user.id));

        await logLoginAttempt(email, user.id, false, "Invalid password", req);
        return res.status(401).json({ 
          message: "Invalid email or password",
          remainingAttempts: MAX_LOGIN_ATTEMPTS - newAttempts,
        });
      }
    }

    // Password is valid - check if 2FA is enabled (optional)
    const twoFAStatus = await get2FAStatus(user.id);

    if (twoFAStatus.anyEnabled) {
      // 2FA is enabled - require verification
      (req.session as any).pendingUserId = user.id;
      (req.session as any).pending2FA = true;

      return res.status(200).json({
        message: "2FA verification required",
        requiresTwoFactor: true,
        totpEnabled: twoFAStatus.totpEnabled,
        smsEnabled: twoFAStatus.smsEnabled,
      });
    }

    // No 2FA enabled - complete login directly
    await db.update(users).set({
      failedLoginAttempts: 0,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    // Set authenticated session
    (req.session as any).userId = user.id;
    (req.session as any).authenticated = true;

    // Log successful login
    await logLoginAttempt(email, user.id, true, undefined, req);

    // Log audit event
    if (user.companyId) {
      await logAuditEvent(
        user.companyId,
        user.id,
        "login",
        "user",
        undefined,
        "Successful login",
        req
      );
    }

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// POST /api/auth/2fa/verify - Step 2: Verify 2FA token
router.post("/2fa/verify", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const pendingUserId = (req.session as any).pendingUserId;

    if (!pendingUserId) {
      return res.status(400).json({ message: "No pending authentication" });
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, pendingUserId));
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Verify TOTP token
    if (!user.totpSecret) {
      return res.status(400).json({ message: "2FA not configured" });
    }

    const isValid = verifyTOTPToken(token, user.totpSecret);
    if (!isValid) {
      await logLoginAttempt(user.email, user.id, false, "Invalid 2FA token", req, "totp", false);
      return res.status(401).json({ message: "Invalid verification code" });
    }

    // 2FA successful - complete login
    // Reset failed attempts
    await db.update(users).set({
      failedLoginAttempts: 0,
      lastLoginAt: new Date(),
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    // Clear pending session data
    delete (req.session as any).pendingUserId;
    delete (req.session as any).pending2FA;

    // Set authenticated session
    (req.session as any).userId = user.id;
    (req.session as any).authenticated = true;

    // Log successful login
    await logLoginAttempt(user.email, user.id, true, undefined, req, "totp", true);

    // Log audit event
    if (user.companyId) {
      await logAuditEvent(
        user.companyId,
        user.id,
        "login",
        "session",
        undefined,
        "User logged in successfully",
        req
      );
    }

    // Check if password is expired
    const passwordExpired = isPasswordExpired(user.passwordExpiresAt);
    const mustChangePassword = user.mustChangePassword === "yes";

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
      },
      passwordExpired,
      mustChangePassword: mustChangePassword || passwordExpired,
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
});

// POST /api/auth/2fa/setup/start - Start 2FA setup
router.post("/2fa/setup/start", async (req: Request, res: Response) => {
  try {
    const pendingUserId = (req.session as any).pendingUserId;
    const userId = (req.session as any).userId || pendingUserId;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new TOTP secret
    const secret = generateTOTPSecret();
    const setupData = await generateTOTPSetup(user.email, secret);

    // Store secret temporarily in session
    (req.session as any).pendingTotpSecret = secret;

    res.json({
      qrCode: setupData.qrCodeDataUrl,
      manualKey: setupData.manualEntryKey,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    res.status(500).json({ message: "Failed to start 2FA setup" });
  }
});

// POST /api/auth/2fa/setup/verify - Verify and enable 2FA
router.post("/2fa/setup/verify", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const pendingUserId = (req.session as any).pendingUserId;
    const userId = (req.session as any).userId || pendingUserId;
    const pendingSecret = (req.session as any).pendingTotpSecret;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!pendingSecret) {
      return res.status(400).json({ message: "No pending 2FA setup" });
    }

    // Verify token with pending secret
    const isValid = verifyTOTPToken(token, pendingSecret);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid verification code" });
    }

    // Enable 2FA
    await enableTOTP(userId, pendingSecret);

    // Clear pending secret
    delete (req.session as any).pendingTotpSecret;

    // If this was during initial login, complete the login
    if ((req.session as any).pending2FASetup) {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      // Reset failed attempts and update login time
      await db.update(users).set({
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(users.id, userId));

      delete (req.session as any).pendingUserId;
      delete (req.session as any).pending2FASetup;
      (req.session as any).userId = userId;
      (req.session as any).authenticated = true;

      // Log successful login
      if (user) {
        await logLoginAttempt(user.email, user.id, true, undefined, req, "totp", true);
        
        if (user.companyId) {
          await logAuditEvent(
            user.companyId,
            user.id,
            "login",
            "session",
            undefined,
            "User completed 2FA setup and logged in",
            req
          );
        }
      }

      return res.json({
        message: "2FA enabled and login successful",
        mustChangePassword: user?.mustChangePassword === "yes" || isPasswordExpired(user?.passwordExpiresAt || null),
      });
    }

    res.json({ message: "2FA enabled successfully" });
  } catch (error) {
    console.error("2FA setup verification error:", error);
    res.status(500).json({ message: "Failed to enable 2FA" });
  }
});

// POST /api/auth/password/change - Change password
router.post("/password/change", async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    if (user.passwordHash) {
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
    }

    // Set new password (includes policy validation and history check)
    const result = await setUserPassword(userId, newPassword);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Password does not meet requirements",
        errors: result.errors,
      });
    }

    // Invalidate all other sessions for this user (security measure)
    // This would be done by clearing sessions from the database

    // Log audit event
    if (user.companyId) {
      await logAuditEvent(
        user.companyId,
        user.id,
        "password_change",
        "user",
        undefined,
        "User changed their password",
        req
      );
    }

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
});

// GET /api/auth/password/requirements - Get password policy requirements
router.get("/password/requirements", (_req: Request, res: Response) => {
  res.json({ requirements: getPasswordPolicyRequirements() });
});

// POST /api/auth/password/reset-request - Request password reset
router.post("/password/reset-request", async (req: Request, res: Response) => {
  try {
    const { email: rawEmail } = req.body;

    if (!rawEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Normalize email to lowercase
    const email = rawEmail.toLowerCase().trim();

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ 
        message: "If an account exists with this email, you will receive reset instructions.",
        success: true,
      });
    }

    // Check if user is active
    if (user.isActive !== "yes") {
      return res.json({ 
        message: "If an account exists with this email, you will receive reset instructions.",
        success: true,
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Store reset token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      email: user.email,
      token,
      expiresAt,
    });

    // Log audit event
    if (user.companyId) {
      await logAuditEvent(
        user.companyId,
        user.id,
        "password_reset_request",
        "user",
        undefined,
        "Password reset requested",
        req
      );
    }

    // For now, return the token/link (until email is configured)
    // In production, this would send an email instead
    const resetLink = `/reset-password?token=${token}`;

    res.json({ 
      message: "If an account exists with this email, you will receive reset instructions.",
      success: true,
      // Include reset link for development/testing (remove when email is configured)
      resetLink,
      devNote: "Email not configured. Use this link to reset password.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ message: "Failed to process reset request" });
  }
});

// GET /api/auth/password/validate-token - Validate password reset token
router.get("/password/validate-token", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.json({ valid: false, message: "No token provided" });
    }

    // Find token
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));

    if (!resetToken) {
      return res.json({ valid: false, message: "This reset link is invalid" });
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return res.json({ valid: false, message: "This reset link has expired. Please request a new one." });
    }

    // Check if token was already used
    if (resetToken.usedAt) {
      return res.json({ valid: false, message: "This reset link has already been used" });
    }

    // Token is valid
    return res.json({ 
      valid: true, 
      email: resetToken.email,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return res.json({ valid: false, message: "An error occurred" });
  }
});

// POST /api/auth/password/reset - Reset password using token
router.post("/password/reset", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    // Find token
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));

    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({ message: "Reset link has expired. Please request a new one." });
    }

    // Check if token was already used
    if (resetToken.usedAt) {
      return res.status(400).json({ message: "This reset link has already been used" });
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.id, resetToken.userId));

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Validate new password
    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.meetsPolicy) {
      return res.status(400).json({ 
        message: "Password does not meet requirements",
        errors: policyResult.errors,
      });
    }

    // Set new password (includes policy validation and history check)
    const result = await setUserPassword(user.id, newPassword);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Password does not meet requirements",
        errors: result.errors,
      });
    }

    // Mark token as used
    await db.update(passwordResetTokens).set({
      usedAt: new Date(),
    }).where(eq(passwordResetTokens.id, resetToken.id));

    // Unlock account if it was locked
    await db.update(users).set({
      lockedAt: null,
      lockedReason: null,
      lockedBy: null,
      failedLoginAttempts: 0,
      mustChangePassword: "no",
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    // Log audit event
    if (user.companyId) {
      await logAuditEvent(
        user.companyId,
        user.id,
        "password_reset",
        "user",
        undefined,
        "Password reset via email link",
        req
      );
    }

    res.json({ 
      message: "Password reset successful. You can now sign in with your new password.",
      success: true,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// GET /api/auth/password/validate-token - Validate reset token
router.get("/password/validate-token", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ valid: false, message: "Token is required" });
    }

    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));

    if (!resetToken) {
      return res.json({ valid: false, message: "Invalid reset link" });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.json({ valid: false, message: "Reset link has expired" });
    }

    if (resetToken.usedAt) {
      return res.json({ valid: false, message: "Reset link has already been used" });
    }

    res.json({ valid: true, email: resetToken.email });
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(500).json({ valid: false, message: "Failed to validate token" });
  }
});

// POST /api/auth/logout - Log out user
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    
    if (userId) {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (user?.companyId) {
        await logAuditEvent(
          user.companyId,
          user.id,
          "logout",
          "session",
          undefined,
          "User logged out",
          req
        );
      }
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
});

// Admin routes

// POST /api/auth/admin/unlock - Unlock a user account (admin only)
router.post("/admin/unlock/:userId", async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as any;
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { userId } = req.params;

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.update(users).set({
      lockedAt: null,
      lockedReason: null,
      lockedBy: null,
      failedLoginAttempts: 0,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    // Log audit event
    if (user.companyId) {
      await logAuditEvent(
        user.companyId,
        currentUser.id,
        "unlock",
        "user",
        undefined,
        `Admin unlocked account: ${user.email}`,
        req
      );
    }

    res.json({ message: "Account unlocked successfully" });
  } catch (error) {
    console.error("Account unlock error:", error);
    res.status(500).json({ message: "Failed to unlock account" });
  }
});

// POST /api/auth/admin/role - Change user role (admin only)
router.post("/admin/role/:userId", async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as any;
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ["admin", "admissions", "clinical", "read_only"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldRole = user.role;

    await db.update(users).set({
      role,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    // Log audit event
    if (user.companyId) {
      await logAuditEvent(
        user.companyId,
        currentUser.id,
        "role_change",
        "user",
        undefined,
        `Changed role for ${user.email}: ${oldRole} -> ${role}`,
        req
      );
    }

    res.json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Role change error:", error);
    res.status(500).json({ message: "Failed to change role" });
  }
});

export default router;
