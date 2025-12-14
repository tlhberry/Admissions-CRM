# AdmitSimple - Admissions CRM for Addiction Treatment Centers

## Overview
AdmitSimple is a mobile-friendly admissions CRM designed for addiction treatment centers. Features a pipeline tracking system, AI-powered call transcription, insurance verification workflow, and comprehensive analytics.

## Branding
- **Product Name**: AdmitSimple
- **Light Mode**: Cream/off-white background, navy text, muted red accent
- **Dark Mode**: Deep navy background, cream text, muted red accent
- **Typography**: Lora (serif) for headings, Inter (sans-serif) for body text
- **Design**: Clean vintage look with no shadows, gradients, or animations
- **Logos**: Day version (IMG_8329_1765685525841.png) and Night version (IMG_8330_1765685525842.png) in attached_assets

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
1. **Inquiry** - New call/inquiry received (collect insurance info here)
2. **VOB Pending** - Verification of Benefits in progress
3. **Quote Client** - Present costs to client
4. **Pre-Assessment** - Complete pre-admission assessment
5. **Scheduled** - Admission scheduled (triggers email notification)
6. **Admitted** - Client has been admitted
7. **Non-Viable** - Client cannot proceed (with reason tracking)
8. **Lost Client** - Viable client who did not proceed (with reason tracking)

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
- **Analytics Dashboard** (`/analytics`): Conversion rates by referral source, non-viable reasons breakdown, stage distribution charts, BD rep performance tracking
- **Advanced Search** (`/search`): Filter by date range, referral source, insurance provider, and stage
- **CallTrackingMetrics Integration**: Webhook endpoint at `/api/webhooks/ctm` for automatic inquiry creation
- **Email Notifications**: Automatic notifications when admissions are scheduled or VOB is pending (requires SendGrid setup)
- **Follow-up Reminders**: Dashboard alerts for inquiries pending in VOB/quote stages for 24+ hours
- **Settings Page** (`/settings`): Configure notification emails per pipeline stage
- **Referral Accounts** (`/accounts`): Manage referral source accounts with BD rep assignment, contacts, and activity logging. Account types include: Hospital, Private Practice, MAT Clinic, Outpatient Facility, Residential Facility, Attorneys, Ed Consultant, Community, Other
- **Enhanced Referral Source Tracking**: Inquiries can be linked to either a specific referral account OR an online marketing source (Google PPC, Google Organic, Facebook, Instagram, Website Direct, Alumni Referral, Word of Mouth, Phone Book, Other)
- **BD Rep Activity Tracking**: Log face-to-face visits, phone calls, meetings with referral accounts
- **Lost Client Tracking**: Track why viable clients don't proceed to admission with reason categories (went elsewhere, ceased contact, changed mind, financial reasons, family decision, other)
- **Reports Dashboard** (`/reports`): Admissions metrics by time period (week/month/3 months/year), referral source performance, BD rep leaderboard, face-to-face activity summary, and overall conversion rates

## API Endpoints

### Protected Endpoints (require authentication)
- `GET /api/inquiries` - List all inquiries
- `GET /api/inquiries/search?...` - Search with filters
- `GET /api/inquiries/:id` - Get single inquiry
- `POST /api/inquiries` - Create inquiry
- `PATCH /api/inquiries/:id` - Update inquiry
- `DELETE /api/inquiries/:id` - Delete inquiry
- `GET /api/auth/user` - Get current user
- `GET /api/users` - List all users (for BD rep dropdown)
- `GET /api/referral-accounts` - List all referral accounts
- `POST /api/referral-accounts` - Create referral account
- `GET /api/referral-accounts/:id` - Get referral account
- `PATCH /api/referral-accounts/:id` - Update referral account
- `DELETE /api/referral-accounts/:id` - Delete referral account
- `GET /api/referral-accounts/:id/contacts` - List contacts for account
- `POST /api/referral-accounts/:id/contacts` - Add contact to account
- `PATCH /api/referral-contacts/:id` - Update contact
- `DELETE /api/referral-contacts/:id` - Delete contact
- `GET /api/referral-accounts/:id/activities` - List activities for account
- `POST /api/referral-accounts/:id/activities` - Log activity for account
- `GET /api/activities` - List activities by current user
- `GET /api/notification-settings` - Get notification settings
- `POST /api/notification-settings` - Save notification setting
- `POST /api/inquiries/:id/notify-staff` - Send admission scheduled notification to staff
- `POST /api/inquiries/:id/send-arrival-email` - Send client arrival email with pre-assessment forms attached

### Public Endpoints
- `POST /api/webhooks/ctm` - CallTrackingMetrics webhook (optionally secured with CTM_WEBHOOK_SECRET)
- `POST /api/webhooks/ctm/test` - Test endpoint to simulate CTM call (requires authentication)

## CallTrackingMetrics Webhook Setup

### 1. Webhook URL Format
In your CTM account, configure a webhook to POST to:
```
https://your-app-name.replit.app/api/webhooks/ctm
```

### 2. Optional Security
Add a secret for webhook validation:
- Set `CTM_WEBHOOK_SECRET` in your Replit secrets
- Configure CTM to send the secret either as:
  - Query parameter: `?secret=YOUR_SECRET`
  - Header: `x-ctm-secret: YOUR_SECRET`

### 3. CTM Field Mapping
The webhook captures these CTM fields and maps them to inquiry data:

| CTM Field | Inquiry Field | Notes |
|-----------|---------------|-------|
| `caller_name`, `caller_id`, `cnam` | callerName | First available value used |
| `caller_number`, `ani`, `from` | phoneNumber | Caller's phone number |
| `tracking_source`, `source`, `campaign` | referralSource | Mapped to category (google, facebook, etc.) |
| `call_id`, `id` | ctmCallId | CTM's unique call identifier |
| `tracking_number`, `called_number`, `to` | ctmTrackingNumber | The tracking number dialed |
| `duration`, `talk_time`, `call_length` | callDuration | Call duration in seconds |
| `recording_url`, `recording`, `audio_url` | callRecordingUrl | URL to call recording |

### 4. Testing the Integration
Click the phone icon button in the Dashboard header to create a test inquiry simulating a CTM call.

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
