# AWS HIPAA Backend Migration - Implementation Plan

## Executive Summary

This document outlines the migration of PHI (Protected Health Information) from Replit's PostgreSQL to AWS infrastructure. The goal is to achieve HIPAA compliance while maintaining the existing app functionality.

---

## 1. PHI Data Classification

### Tables Containing PHI (Move to AWS)

| Table | PHI Fields | Priority |
|-------|-----------|----------|
| `inquiries` | clientName, dateOfBirth, phoneNumber, email, presentingProblems, transcription, insurancePolicyId, aiExtractedData, all clinical notes | HIGH |
| `pre_cert_forms` | formData (contains clinical assessment, substance use history, mental health info) | HIGH |
| `nursing_assessment_forms` | formData (contains vitals, medical history, medications) | HIGH |
| `pre_screening_forms` | formData (contains psychosocial assessment, treatment history) | HIGH |
| `call_logs` | recordingUrl, notes, phoneE164 | MEDIUM |
| `inquiry_phone_map` | phoneE164 | MEDIUM |

### Tables WITHOUT PHI (Keep on Replit)

| Table | Purpose |
|-------|---------|
| `sessions` | Session storage (no PHI) |
| `users` | Staff accounts (not patient data) |
| `companies` | Organization settings |
| `referral_accounts` | B2B referral sources |
| `referral_contacts` | B2B contacts |
| `activity_logs` | BD rep activity tracking |
| `notification_settings` | Email configuration |
| `audit_logs` | Access logs (sanitized) |
| `billing_*` | Billing/subscription data |
| `login_attempts` | Security logs |
| `password_*` | Auth security tables |

---

## 2. AWS Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AWS VPC                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Private Subnet A                             │    │
│  │  ┌─────────────────┐    ┌─────────────────────────────────┐     │    │
│  │  │  Lambda (PHI)   │───▶│  RDS PostgreSQL (Encrypted)     │     │    │
│  │  │  Node.js 20     │    │  - PHI Tables Only              │     │    │
│  │  └─────────────────┘    │  - KMS Encryption at Rest       │     │    │
│  │          ▲              │  - SSL/TLS in Transit           │     │    │
│  │          │              └─────────────────────────────────┘     │    │
│  └──────────│──────────────────────────────────────────────────────┘    │
│             │                                                            │
│  ┌──────────│──────────────────────────────────────────────────────┐    │
│  │          │              Private Subnet B                         │    │
│  │  ┌───────┴───────┐    ┌─────────────────────────────────┐       │    │
│  │  │  NAT Gateway  │    │  RDS Replica (optional)         │       │    │
│  │  └───────────────┘    └─────────────────────────────────┘       │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                         Public Subnet                             │    │
│  │  ┌─────────────────────────────────────────────────────────┐     │    │
│  │  │              API Gateway (HTTPS Only)                    │     │    │
│  │  │  - Rate Limiting                                         │     │    │
│  │  │  - API Key Authentication                                │     │    │
│  │  │  - CloudWatch Logging                                    │     │    │
│  │  └─────────────────────────────────────────────────────────┘     │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Replit (Unchanged)                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐  │
│  │  React Frontend │    │ Express Backend │    │  PostgreSQL (Non-PHI)│  │
│  │  (No Changes)   │◀──▶│ (Proxy to AWS)  │◀──▶│  sessions, users,    │  │
│  │                 │    │                 │    │  companies, etc.     │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. AWS Lambda Backend Structure

```
aws-phi-backend/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── serverless.yml (or SAM template.yaml)
│
├── src/
│   ├── db/
│   │   ├── connection.ts       # Drizzle connection with SSL
│   │   └── schema.ts           # PHI-only schema (copied from shared)
│   │
│   ├── handlers/
│   │   ├── inquiries.ts        # CRUD for inquiries PHI fields
│   │   ├── preCertForm.ts      # Pre-cert form handlers
│   │   ├── nursingAssessment.ts # Nursing assessment handlers
│   │   ├── preScreening.ts     # Pre-screening handlers
│   │   └── callLogs.ts         # Call log handlers
│   │
│   ├── middleware/
│   │   ├── auth.ts             # API key validation
│   │   └── audit.ts            # PHI access logging
│   │
│   └── utils/
│       ├── secrets.ts          # AWS Secrets Manager fetch
│       └── response.ts         # Standardized responses
│
└── tests/
    └── handlers/
        └── inquiries.test.ts
```

---

## 4. Code Examples

### 4.1 Database Connection with SSL (aws-phi-backend/src/db/connection.ts)

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import * as schema from "./schema";

let dbPool: Pool | null = null;

async function getDbCredentials() {
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const command = new GetSecretValueCommand({
    SecretId: process.env.DB_SECRET_ARN!,
  });
  
  const response = await client.send(command);
  return JSON.parse(response.SecretString!);
}

export async function getDb() {
  if (!dbPool) {
    const creds = await getDbCredentials();
    
    dbPool = new Pool({
      host: creds.host,
      port: creds.port || 5432,
      database: creds.dbname,
      user: creds.username,
      password: creds.password,
      ssl: {
        rejectUnauthorized: true,
        ca: process.env.RDS_CA_CERT, // RDS CA certificate
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  
  return drizzle(dbPool, { schema });
}
```

### 4.2 PHI Schema (aws-phi-backend/src/db/schema.ts)

```typescript
import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  date,
  index,
} from "drizzle-orm/pg-core";

// Inquiries table - PHI fields only
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  userId: varchar("user_id"),
  stage: varchar("stage", { length: 50 }).notNull().default("inquiry"),
  
  // PHI Fields
  callerName: varchar("caller_name", { length: 255 }),
  clientName: varchar("client_name", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  email: varchar("email", { length: 255 }),
  dateOfBirth: date("date_of_birth"),
  
  // Clinical PHI
  presentingProblems: text("presenting_problems"),
  initialNotes: text("initial_notes"),
  
  // Insurance PHI
  insuranceProvider: varchar("insurance_provider", { length: 255 }),
  insurancePolicyId: varchar("insurance_policy_id", { length: 100 }),
  insuranceNotes: text("insurance_notes"),
  vobDetails: text("vob_details"),
  coverageDetails: text("coverage_details"),
  
  // All other fields from original schema...
  transcription: text("transcription"),
  aiExtractedData: jsonb("ai_extracted_data"),
  callSummary: text("call_summary"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_inquiries_company").on(table.companyId),
]);

// Pre-Cert Forms - Clinical PHI
export const preCertForms = pgTable("pre_cert_forms", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  inquiryId: integer("inquiry_id").notNull().unique(),
  formData: jsonb("form_data").notNull().default({}),
  isComplete: varchar("is_complete", { length: 10 }).default("no"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Nursing Assessment Forms - Clinical PHI
export const nursingAssessmentForms = pgTable("nursing_assessment_forms", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  inquiryId: integer("inquiry_id").notNull().unique(),
  formData: jsonb("form_data").notNull().default({}),
  isComplete: varchar("is_complete", { length: 10 }).default("no"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pre-Screening Forms - Clinical PHI
export const preScreeningForms = pgTable("pre_screening_forms", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  inquiryId: integer("inquiry_id").notNull().unique(),
  formData: jsonb("form_data").notNull().default({}),
  isComplete: varchar("is_complete", { length: 10 }).default("no"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Call Logs - Contains phone numbers and recordings
export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  inquiryId: integer("inquiry_id").notNull(),
  phoneE164: varchar("phone_e164", { length: 20 }).notNull(),
  direction: varchar("direction", { length: 10 }).notNull(),
  source: varchar("source", { length: 20 }).notNull(),
  ctmCallId: varchar("ctm_call_id", { length: 100 }),
  durationSeconds: integer("duration_seconds"),
  recordingUrl: text("recording_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 4.3 Lambda Handler Example (aws-phi-backend/src/handlers/inquiries.ts)

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getDb } from "../db/connection";
import { inquiries } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { validateApiKey } from "../middleware/auth";
import { logPhiAccess } from "../middleware/audit";

// GET /inquiries/:id - Get inquiry PHI data
export async function getInquiry(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate API key
    const authResult = validateApiKey(event);
    if (!authResult.valid) {
      return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    }

    const inquiryId = parseInt(event.pathParameters?.id || "0");
    const companyId = parseInt(event.headers["x-company-id"] || "0");
    const userId = event.headers["x-user-id"];

    if (!inquiryId || !companyId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing required parameters" }) };
    }

    const db = await getDb();
    
    const [inquiry] = await db
      .select()
      .from(inquiries)
      .where(and(
        eq(inquiries.id, inquiryId),
        eq(inquiries.companyId, companyId)
      ));

    if (!inquiry) {
      return { statusCode: 404, body: JSON.stringify({ message: "Inquiry not found" }) };
    }

    // Log PHI access for HIPAA audit
    await logPhiAccess({
      userId,
      companyId,
      action: "view",
      resourceType: "inquiry",
      resourceId: inquiryId,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inquiry),
    };
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
}

// PATCH /inquiries/:id - Update inquiry PHI data
export async function updateInquiry(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authResult = validateApiKey(event);
    if (!authResult.valid) {
      return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    }

    const inquiryId = parseInt(event.pathParameters?.id || "0");
    const companyId = parseInt(event.headers["x-company-id"] || "0");
    const userId = event.headers["x-user-id"];
    const updates = JSON.parse(event.body || "{}");

    if (!inquiryId || !companyId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing required parameters" }) };
    }

    const db = await getDb();
    
    const [updated] = await db
      .update(inquiries)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(inquiries.id, inquiryId),
        eq(inquiries.companyId, companyId)
      ))
      .returning();

    if (!updated) {
      return { statusCode: 404, body: JSON.stringify({ message: "Inquiry not found" }) };
    }

    // Log PHI modification for HIPAA audit
    await logPhiAccess({
      userId,
      companyId,
      action: "update",
      resourceType: "inquiry",
      resourceId: inquiryId,
      details: `Updated fields: ${Object.keys(updates).join(", ")}`,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    };
  } catch (error) {
    console.error("Error updating inquiry:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
}

// POST /inquiries - Create inquiry with PHI
export async function createInquiry(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authResult = validateApiKey(event);
    if (!authResult.valid) {
      return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    }

    const companyId = parseInt(event.headers["x-company-id"] || "0");
    const userId = event.headers["x-user-id"];
    const data = JSON.parse(event.body || "{}");

    if (!companyId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing company ID" }) };
    }

    const db = await getDb();
    
    const [newInquiry] = await db
      .insert(inquiries)
      .values({ ...data, companyId })
      .returning();

    // Log PHI creation for HIPAA audit
    await logPhiAccess({
      userId,
      companyId,
      action: "create",
      resourceType: "inquiry",
      resourceId: newInquiry.id,
    });

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newInquiry),
    };
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
}
```

### 4.4 Express Proxy Routes (server/routes.ts changes)

```typescript
// Add to server/routes.ts - PHI proxy utilities

const AWS_PHI_API_URL = process.env.AWS_PHI_API_URL;
const AWS_PHI_API_KEY = process.env.AWS_PHI_API_KEY;

// Helper to proxy PHI requests to AWS
async function proxyToAws(
  method: string,
  path: string,
  companyId: number,
  userId: string,
  body?: any
) {
  const response = await fetch(`${AWS_PHI_API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": AWS_PHI_API_KEY!,
      "x-company-id": companyId.toString(),
      "x-user-id": userId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "AWS API error" }));
    throw new Error(error.message || "AWS API request failed");
  }

  return response.json();
}

// Example: Updated inquiry routes to proxy PHI to AWS

// GET /api/inquiries/:id - Now proxies PHI from AWS
app.get("/api/inquiries/:id", isAuthenticated, canAccessInquiries, async (req: any, res) => {
  try {
    const inquiryId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    const companyId = req.user.companyId;

    // Fetch PHI data from AWS
    const phiData = await proxyToAws("GET", `/inquiries/${inquiryId}`, companyId, userId);

    // Merge with any non-PHI data from Replit DB if needed
    // (In this case, all inquiry data is PHI so it all comes from AWS)

    res.json(phiData);
  } catch (error: any) {
    console.error("Error fetching inquiry:", error.message);
    res.status(500).json({ message: "Failed to fetch inquiry" });
  }
});

// PATCH /api/inquiries/:id - Proxies PHI updates to AWS
app.patch("/api/inquiries/:id", isAuthenticated, canAccessInquiries, async (req: any, res) => {
  try {
    const inquiryId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    const companyId = req.user.companyId;

    // DO NOT log req.body - it contains PHI!
    
    // Send update to AWS
    const updated = await proxyToAws("PATCH", `/inquiries/${inquiryId}`, companyId, userId, req.body);

    res.json(updated);
  } catch (error: any) {
    console.error("Error updating inquiry:", error.message);
    res.status(500).json({ message: "Failed to update inquiry" });
  }
});

// POST /api/inquiries - Proxies PHI creation to AWS
app.post("/api/inquiries", isAuthenticated, canAccessInquiries, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const companyId = req.user.companyId;

    // DO NOT log req.body - it contains PHI!
    
    // Create in AWS
    const newInquiry = await proxyToAws("POST", "/inquiries", companyId, userId, {
      ...req.body,
      userId,
    });

    res.status(201).json(newInquiry);
  } catch (error: any) {
    console.error("Error creating inquiry:", error.message);
    res.status(500).json({ message: "Failed to create inquiry" });
  }
});
```

---

## 5. Environment Variables

### Replit Environment Variables (add to Secrets)

```bash
# AWS PHI API Configuration
AWS_PHI_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
AWS_PHI_API_KEY=your-api-gateway-api-key

# Keep existing Replit database for non-PHI tables
DATABASE_URL=postgresql://... (Replit's DB - non-PHI only)
```

### AWS Lambda Environment Variables

```bash
# Set in Lambda configuration or SAM template
AWS_REGION=us-east-1
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789:secret:phi-db-credentials
RDS_CA_CERT=<base64-encoded RDS CA certificate>
```

---

## 6. API Gateway Routes to Create

| Method | Path | Lambda Handler | Description |
|--------|------|----------------|-------------|
| GET | /inquiries | inquiries.listInquiries | List inquiries for company |
| POST | /inquiries | inquiries.createInquiry | Create new inquiry |
| GET | /inquiries/{id} | inquiries.getInquiry | Get inquiry by ID |
| PATCH | /inquiries/{id} | inquiries.updateInquiry | Update inquiry |
| DELETE | /inquiries/{id} | inquiries.deleteInquiry | Delete inquiry |
| GET | /inquiries/{id}/pre-cert | preCertForm.get | Get pre-cert form |
| PUT | /inquiries/{id}/pre-cert | preCertForm.update | Update pre-cert form |
| GET | /inquiries/{id}/nursing | nursingAssessment.get | Get nursing assessment |
| PUT | /inquiries/{id}/nursing | nursingAssessment.update | Update nursing assessment |
| GET | /inquiries/{id}/pre-screening | preScreening.get | Get pre-screening form |
| PUT | /inquiries/{id}/pre-screening | preScreening.update | Update pre-screening form |
| GET | /inquiries/{id}/call-logs | callLogs.list | List call logs |
| POST | /inquiries/{id}/call-logs | callLogs.create | Create call log |

---

## 7. Security Checklist

### AWS Infrastructure
- [ ] VPC with private subnets only for RDS
- [ ] NAT Gateway for Lambda outbound access
- [ ] RDS encryption at rest with AWS KMS
- [ ] RDS SSL/TLS enforced for connections
- [ ] RDS not publicly accessible
- [ ] Security groups restrict access to Lambda only
- [ ] API Gateway uses HTTPS only
- [ ] API Gateway requires API key
- [ ] CloudWatch logging enabled
- [ ] CloudTrail enabled for audit

### Lambda Security
- [ ] Secrets retrieved from AWS Secrets Manager (not env vars)
- [ ] No hardcoded credentials
- [ ] VPC-attached for RDS access
- [ ] Minimal IAM permissions
- [ ] No PHI in console.log statements

### Replit Security
- [ ] Remove all PHI tables from Replit DB
- [ ] Remove PHI from console.log statements
- [ ] Proxy routes don't log request bodies
- [ ] AWS API key stored in Secrets
- [ ] No PHI in error messages to client

### AI Integration
- [ ] AI prompts never include raw PHI
- [ ] Only de-identified/aggregated data to AI
- [ ] Transcription results stored in AWS only

---

## 8. Migration Steps (High-Level)

### Phase 1: AWS Setup (Week 1)
1. Create AWS account and sign BAA
2. Set up VPC with private subnets
3. Create RDS PostgreSQL with encryption
4. Configure Secrets Manager
5. Deploy Lambda functions
6. Set up API Gateway

### Phase 2: Data Migration (Week 2)
1. Export PHI data from Replit
2. Import to AWS RDS
3. Verify data integrity
4. Set up data sync (temporary)

### Phase 3: Code Migration (Week 2-3)
1. Update Express routes to proxy to AWS
2. Test all CRUD operations
3. Test pre-assessment forms
4. Test PDF generation
5. Test CTM webhook flow

### Phase 4: Cutover (Week 3)
1. Final data sync
2. Switch to AWS-only for PHI
3. Remove PHI from Replit DB
4. Monitor and verify
5. Remove data sync

### Phase 5: Cleanup (Week 4)
1. Audit all logs for PHI
2. Remove any remaining PHI
3. Update documentation
4. Compliance review

---

## 9. Cost Estimate (Monthly)

| Service | Estimated Cost |
|---------|---------------|
| RDS db.t3.micro (HIPAA eligible) | $15-25 |
| Lambda (minimal invocations) | $5-10 |
| API Gateway | $3-5 |
| NAT Gateway | $35-45 |
| Secrets Manager | $1 |
| CloudWatch | $5-10 |
| **Total** | **$65-100/month** |

Note: NAT Gateway is the biggest cost. Consider NAT Instance for development.

---

## 10. Files to Modify on Replit

| File | Changes |
|------|---------|
| `server/routes.ts` | Add proxy functions, update inquiry routes |
| `server/storage.ts` | Remove PHI table operations (or keep as fallback) |
| `server/index.ts` | Remove PHI from error logging |
| `shared/schema.ts` | Mark PHI tables as AWS-only (comments) |

---

## Questions Before Proceeding

1. Do you have an AWS account ready?
2. Have you signed the AWS BAA (Business Associate Agreement)?
3. Do you want me to create a Terraform/CloudFormation template for the infrastructure?
4. Should we start with the Lambda code or infrastructure first?
