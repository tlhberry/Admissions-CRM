import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Boot-time environment validation for required secrets
function validateEnvironment() {
  const required = ["DATABASE_URL", "SESSION_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}
validateEnvironment();

const app = express();
const httpServer = createServer(app);

// Security headers with helmet
const isDev = process.env.NODE_ENV !== "production";
app.use(
  helmet({
    contentSecurityPolicy: isDev ? false : {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
});

// Stricter rate limit for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit login attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});

app.use("/api/", apiLimiter);
app.use("/api/login", loginLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/2fa/verify", loginLimiter);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // Don't log response bodies that may contain PHI
      // Only log response on error status codes with sanitized output
      if (capturedJsonResponse && res.statusCode >= 400) {
        const safeResponse = JSON.stringify(capturedJsonResponse)
          .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[EMAIL]")
          .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]");
        logLine += ` :: ${safeResponse}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Sanitize error messages to prevent PHI leakage
    // Only show safe, generic messages to clients
    let clientMessage = "Internal Server Error";
    if (status === 400) clientMessage = "Bad Request";
    else if (status === 401) clientMessage = "Unauthorized";
    else if (status === 403) clientMessage = "Forbidden";
    else if (status === 404) clientMessage = "Not Found";
    else if (status === 429) clientMessage = "Too Many Requests";
    
    // Log the actual error server-side (sanitized for PHI)
    const safeLogMessage = err.message?.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[EMAIL]")
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]")
      .replace(/\b\d{9}\b/g, "[SSN]") || "Unknown error";
    console.error(`Error ${status}: ${safeLogMessage}`);
    
    res.status(status).json({ message: clientMessage });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = Number(process.env.PORT) || 5000;

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
})();
