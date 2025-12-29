# AWS HIPAA Backend Migration Prompt for AdmitSimple

You are an expert senior cloud engineer and HIPAA compliance architect.

I have an existing production app called **AdmitSimple** that is already fully built and working.
DO NOT redesign, refactor, or re-architect the app.
DO NOT change UI, routing, auth flows, or non-PHI logic.

## Current Stack (DO NOT CHANGE)
- Frontend: React + TypeScript (Vite)
- Backend: Express.js + TypeScript
- ORM: Drizzle ORM
- Database (current): PostgreSQL on Replit

## Goal
Make the app HIPAA-safe by moving ONLY PHI data storage and access to AWS, while keeping:
- Frontend on Replit
- Express app on Replit
- All non-PHI logic unchanged

Replit must NEVER store or log PHI after this change.

## HARD RULES
- Do NOT rebuild the app
- Do NOT touch frontend UI
- Do NOT remove Express
- Do NOT introduce new auth systems
- Do NOT store PHI on Replit in any form
- Only refactor database + PHI routes

## WHAT COUNTS AS PHI
- Social Security Numbers
- Insurance information
- Treatment / clinical history
- Any patient-identifiable data

Only these items move.

## AWS REQUIREMENTS
Use the simplest HIPAA-eligible AWS setup:
- AWS Lambda (Node.js / TypeScript)
- API Gateway (HTTPS only)
- Amazon RDS (PostgreSQL)
- AWS Secrets Manager
- AWS KMS encryption
- Private VPC (no public DB access)

Assumptions:
- New AWS account from scratch
- AWS BAA will be signed
- No existing infrastructure

## IMPLEMENTATION STEPS

### 1. AWS Infrastructure
- Create VPC with two private subnets
- Add NAT Gateway
- Create RDS PostgreSQL:
  - Encrypted at rest (KMS)
  - Private subnets only
  - No public access
- Store DB credentials in AWS Secrets Manager
- Enable CloudWatch and CloudTrail logging

### 2. AWS Lambda PHI API
- Create Lambda functions ONLY for PHI routes
- Use Drizzle ORM inside Lambda
- Enforce SSL/TLS for Postgres connections
- Fetch DB credentials from Secrets Manager
- No hardcoded secrets

### 3. API Gateway
- Create HTTPS endpoints for PHI routes
- Enable access logging
- Return JSON only

### 4. Update Existing Express Backend (Minimal)
- Remove direct DB access for PHI routes
- Replace with HTTPS calls to AWS API Gateway
- Keep route names and request/response shapes identical
- Use environment variable for AWS API base URL
- Do NOT log PHI request bodies

### 5. What Stays on Replit
- Frontend
- Express app
- Non-PHI database tables
- Business logic
- Auth/session logic

### 6. AI Rules
- AI tools must NEVER receive PHI
- AI can only work with de-identified data
- No PHI in prompts, logs, or debugging

## OUTPUT REQUIRED
Provide:
1. Folder structure for AWS Lambda backend
2. Example Drizzle ORM connection using SSL
3. Example Lambda handler for one PHI route
4. Example Express route proxying to AWS
5. Required environment variables (no secrets)
6. Brief security explanation

## SUCCESS CRITERIA
- Replit stores ZERO PHI
- All PHI exists only in encrypted AWS RDS
- App behavior remains unchanged
- No breaking changes
- HIPAA legal risk removed

Proceed carefully and conservatively.
