import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

// HIPAA-compliant session timeout (15 minutes of inactivity)
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function getSession() {
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: SESSION_TIMEOUT_MS / 1000, // TTL in seconds
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: true, // Touch session on each request to extend timeout
    saveUninitialized: false,
    rolling: true, // Reset cookie expiration on each request
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: SESSION_TIMEOUT_MS, // 15 minutes
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  const userId = claims["sub"];
  const email = claims["email"];
  const firstName = claims["first_name"];
  const lastName = claims["last_name"];
  const profileImageUrl = claims["profile_image_url"];

  // Check if user already exists
  const existingUser = await storage.getUser(userId);

  if (existingUser && existingUser.companyId) {
    // User exists with a company - just update their info
    await storage.upsertUser({
      id: userId,
      email,
      firstName,
      lastName,
      profileImageUrl,
      companyId: existingUser.companyId,
      role: existingUser.role,
    });
  } else {
    // New user or user without company - create a new company for them
    const companyName = `${firstName || 'My'} ${lastName || 'Company'}`.trim() || 'My Company';
    const company = await storage.createCompany({
      name: companyName,
    });

    // Create user as Admin of the new company
    await storage.upsertUser({
      id: userId,
      email,
      firstName,
      lastName,
      profileImageUrl,
      companyId: company.id,
      role: 'admin',
    });
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.redirect("/api/login");
      
      // Regenerate session on login for security (prevents session fixation)
      req.session.regenerate((regenerateErr) => {
        if (regenerateErr) return next(regenerateErr);
        
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          res.redirect("/");
        });
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const logoutUrl = client.buildEndSessionUrl(config, {
      client_id: process.env.REPL_ID!,
      post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
    }).href;
    
    // Destroy session completely on logout
    req.session.destroy((err) => {
      if (err) console.error("Session destruction error:", err);
      req.logout(() => {
        res.clearCookie("connect.sid");
        res.redirect(logoutUrl);
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    // Update last activity timestamp for HIPAA compliance tracking
    const userId = user.claims?.sub;
    if (userId) {
      storage.updateLastActivity(userId).catch(err => 
        console.error("Failed to update last activity:", err)
      );
    }
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Role-based access control middleware - requires admin role
export const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    return next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Role permissions for RBAC - imported from schema for consistency
import { rolePermissions, type UserRole } from "@shared/schema";

// Helper to check if a role has a specific permission
function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = rolePermissions[role];
  if (!permissions) return false;
  // Admin has "all" permission which grants access to everything
  if (permissions.includes("all")) return true;
  return permissions.includes(permission);
}

// Helper to check if request is a read-only operation (GET request)
function isReadOnlyRequest(method: string): boolean {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

// Factory function to create permission-checking middleware
// Usage: requirePermission("inquiries") or requirePermission(["inquiries", "reports"])
// To allow read_only users to view a resource, include "view_only" in the permissions array:
// e.g., requirePermission(["inquiries", "view_only"]) allows read_only GET access
export function requirePermission(permission: string | string[]): RequestHandler {
  return async (req, res, next) => {
    const user = req.user as any;

    if (!req.isAuthenticated() || !user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const dbUser = await storage.getUser(user.claims.sub);
      if (!dbUser) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user account is active
      if (dbUser.isActive !== "yes") {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      const userRole = dbUser.role as UserRole;
      const permissions = Array.isArray(permission) ? permission : [permission];

      // CRITICAL: Handle read_only role FIRST before general permission check
      // This prevents read_only users from getting write access via "view_only" permission match
      if (userRole === "read_only") {
        const routeAllowsViewOnly = permissions.includes("view_only");
        if (routeAllowsViewOnly && isReadOnlyRequest(req.method)) {
          return next();
        }
        // read_only cannot modify anything or access resources that don't allow view_only
        return res.status(403).json({ 
          message: "Forbidden: Read-only access does not allow this action" 
        });
      }

      // Filter out "view_only" from permissions for role check - it's a marker for read_only handling above
      const actualPermissions = permissions.filter(p => p !== "view_only");
      
      // Check if user has any of the required permissions
      const hasRequiredPermission = actualPermissions.length === 0 || 
        actualPermissions.some(p => hasPermission(userRole, p));

      // If user has required permission, allow access
      if (hasRequiredPermission) {
        return next();
      }

      // User doesn't have required permission
      return res.status(403).json({ 
        message: `Forbidden: Requires ${actualPermissions.join(" or ")} permission` 
      });
    } catch (error) {
      console.error("Error checking permissions:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

// Convenience middleware for common permission checks
// These include "view_only" to allow read_only users to view data on GET requests
export const canAccessInquiries = requirePermission(["inquiries", "view_only"]);
export const canAccessReferralAccounts = requirePermission(["referral_accounts", "view_only"]);
export const canAccessActivities = requirePermission(["activities", "view_only"]);
export const canAccessReports = requirePermission(["reports", "view_only"]);
// Clinical routes - more restricted, no view_only access
export const canAccessClinicalNotes = requirePermission("clinical_notes");
export const canAccessPreAssessment = requirePermission(["pre_assessment", "clinical_notes"]);
