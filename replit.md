# Admissions CRM for Addiction Treatment Centers

## Overview
A mobile-friendly admissions CRM designed for addiction treatment centers. Features a pipeline tracking system, AI-powered call transcription, insurance verification workflow, and comprehensive analytics.

## Tech Stack
- **Frontend**: React with Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **AI**: OpenAI integration for call transcription (Whisper + GPT)
- **Charts**: Recharts for analytics visualization

## Project Structure
```
├── client/src/
│   ├── pages/           # Page components
│   │   ├── Dashboard.tsx       # Main pipeline view with follow-up reminders
│   │   ├── InquiryDetail.tsx   # Individual inquiry management
│   │   ├── NewInquiry.tsx      # Create new inquiry form
│   │   ├── Analytics.tsx       # Conversion metrics & charts
│   │   ├── Search.tsx          # Advanced search & filtering
│   │   └── Landing.tsx         # Public landing page
│   ├── components/ui/   # Reusable shadcn components
│   └── lib/             # Utilities and query client
├── server/
│   ├── routes.ts        # API endpoints including webhooks
│   ├── storage.ts       # Database operations with search
│   ├── replitAuth.ts    # Authentication setup
│   └── emailService.ts  # Email notification service
└── shared/
    └── schema.ts        # Database schema and types
```

## Pipeline Stages
1. **Inquiry** - New call/inquiry received
2. **Viability Check** - Determine if client is viable
3. **Insurance Collection** - Gather insurance information
4. **VOB Pending** - Verification of Benefits in progress
5. **Quote Client** - Present costs to client
6. **Pre-Assessment** - Complete pre-admission assessment
7. **Scheduled** - Admission scheduled (triggers email notification)
8. **Admitted** - Client has been admitted
9. **Non-Viable** - Client cannot proceed (with reason tracking)

## Features

### MVP Features
- User authentication with Replit Auth
- Mobile-responsive pipeline dashboard
- Full inquiry CRUD operations
- Stage progression with form validation
- Insurance verification workflow
- AI-powered call transcription (OpenAI)
- Auto-generated admission summaries

### Phase 2 Features (Recently Added)
- **Analytics Dashboard** (`/analytics`): Conversion rates by referral source, non-viable reasons breakdown, stage distribution charts
- **Advanced Search** (`/search`): Filter by date range, referral source, insurance provider, and stage
- **CallTrackingMetrics Integration**: Webhook endpoint at `/api/webhooks/ctm` for automatic inquiry creation
- **Email Notifications**: Automatic notifications when admissions are scheduled (requires SendGrid setup)
- **Follow-up Reminders**: Dashboard alerts for inquiries pending in VOB/quote stages for 24+ hours

## API Endpoints

### Protected Endpoints (require authentication)
- `GET /api/inquiries` - List all inquiries
- `GET /api/inquiries/search?...` - Search with filters
- `GET /api/inquiries/:id` - Get single inquiry
- `POST /api/inquiries` - Create inquiry
- `PATCH /api/inquiries/:id` - Update inquiry
- `DELETE /api/inquiries/:id` - Delete inquiry
- `GET /api/auth/user` - Get current user

### Public Endpoints
- `POST /api/webhooks/ctm` - CallTrackingMetrics webhook (optionally secured with CTM_WEBHOOK_SECRET)

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `SESSION_SECRET` - Session encryption key

### Optional (for enhanced features)
- `CTM_WEBHOOK_SECRET` - Secret for validating CTM webhooks
- `SENDGRID_API_KEY` - SendGrid API key for email notifications
- `SENDGRID_FROM_EMAIL` - Sender email address
- `NOTIFICATION_EMAIL` - Email address to receive admission notifications

## Running the Application
The app runs with `npm run dev` which starts both the Express backend and Vite frontend on port 5000.

## Database
Uses Drizzle ORM with PostgreSQL. Schema is defined in `shared/schema.ts`. Run `npm run db:push` to sync schema changes.

## Design Principles
- Mobile-first, "grandmother-friendly" interface
- Large touch targets (44px minimum)
- Clear, simple navigation
- Minimal clicks to complete tasks
- Professional healthcare aesthetic with Material Design principles
