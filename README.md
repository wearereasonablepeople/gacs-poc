# GACS Questionnaire Platform

A **whitelabel, multi-tenant questionnaire platform** built for GACS (Gebouwautomatiserings- en Controlesystemen) compliance checking, conforming to NEN-EN-ISO 52120.

Tenants can create compliance questionnaires, track respondent submissions as leads, customize email templates, and export results — all under their own branding.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GACS Platform                                │
├────────────┬────────────┬────────────┬────────────┬────────────────┤
│   /ui      │ /reporting │ /monitoring│   /api     │  PostgreSQL    │
│  (React)   │  (React)   │  (React)   │  (NestJS)  │  + Prisma      │
│  Port 3000 │  Port 3001 │  Port 3002 │  Port 4000 │  Port 5432     │
│            │            │            │            │                │
│ Respondent │ Tenant     │ Platform   │ REST API   │ Data store     │
│ UI         │ Admin      │ Admin      │ + Auth     │                │
└────────────┴────────────┴────────────┴────────────┴────────────────┘
                                                     │
                                              ┌──────┴──────┐
                                              │ Prisma Studio│
                                              │ Port 5555    │
                                              └──────────────┘
                                              │ Mailpit       │
                                              │ Port 8025     │
                                              └───────────────┘
```

### Applications

| App | Port | Purpose | Users |
|-----|------|---------|-------|
| **UI** (`/ui`) | 3000 | Public questionnaire for respondents | Anonymous visitors |
| **Reporting** (`/reporting`) | 3001 | Tenant admin panel | Tenant owners & admins |
| **Monitoring** (`/monitoring`) | 3002 | Platform admin panel | Platform admins |
| **API** (`/api`) | 4000 | REST API backend | All apps |
| **Prisma Studio** | 5555 | Database GUI | Developers |
| **Mailpit** | 8025 | Email testing UI | Developers |

### Tech Stack

- **Backend:** NestJS, Prisma ORM, PostgreSQL
- **Frontend:** React 18, Vite, TypeScript, shadcn/ui, Tailwind CSS, TanStack Query
- **Auth:** Session cookies (express-session + connect-pg-simple + Passport)
- **Email:** Nodemailer + tenant-customizable HTML templates (TinyMCE editor)
- **PDF:** Client-side generation with jsPDF
- **Containerization:** Docker Compose

---

## Key Features

### Compliance Scoring

Every answer option can be marked **Allowed** or **Not allowed** based on the [RVO GACS checklist](https://www.rvo.nl/sites/default/files/2024-01/checklist-technische-eisen-gacs-v3.pdf). The seed data ships with all options pre-classified.

Scores are calculated per section and overall:
- Displayed in the **generated PDF** (score overview, section bar chart, motivational message)
- Displayed on the **instant results page** when using `skipEmailStep` mode
- Motivational messages encourage the respondent to contact the tenant based on their score

### Lead Tracking

Submissions act as **leads** with a status workflow:

| Status | Meaning |
|--------|---------|
| **Open** | Tenant must still contact the respondent |
| **In behandeling** | Tenant is actively following up |
| **Afgehandeld** | Lead process is complete |

Tenants can change lead status directly from the submissions table or the submission detail dialog in `/reporting`. Status is filterable and included in CSV exports.

### Custom Email Templates

Tenants can create HTML email templates via a **TinyMCE rich-text editor** in the Branding page (`/reporting`). Templates support placeholder chips (`{{tenantName}}`, `{{verificationUrl}}`, `{{recipientEmail}}`), live preview, and server-side HTML sanitization.

### Notification Emails

When a respondent successfully submits, a notification email is sent to the tenant's configurable `notificationEmail` address (set in Branding).

### Whitelabel Branding

Each tenant has customizable branding applied at runtime:

| Setting | Description |
|---------|-------------|
| **Name** | Displayed in questionnaire header |
| **Slug** | URL identifier (`/croonwolterdros/gacs-compliance-check`) |
| **Primary Color** | Applied via CSS custom properties |
| **Secondary Color** | Page background / accents |
| **Header Text Color** | Override for header text contrast |
| **Subtext Color** | Help text / descriptions |
| **Logo URL** | Questionnaire header logo |
| **Favicon URL** | Browser tab icon |

### Offline Support

The respondent UI (`/ui`) supports offline usage:
- Answers are persisted to `localStorage` as a draft
- Failed API calls are queued and auto-synced when connectivity returns
- Cached questionnaire data is used as fallback when offline

### Testing Query Parameters

The `/ui` app supports special query parameters for development/testing:

| Parameter | Effect |
|-----------|--------|
| `skipEmailStep=1` | Bypasses email verification, shows instant results locally (no backend calls) |

---

## Domain Model

### Roles & Permissions

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| **Platform Admin** | Global | Create/deactivate tenants, create owner accounts |
| **Tenant Owner** | Their tenant | Full control: branding, users, questionnaires, publishing, deletion, export, lead management |
| **Tenant Admin** | Their tenant | Content management: create/edit questionnaires, view submissions, update lead status |
| **Respondent** | Public | Fill in published questionnaires, verify email |

### Data Model

```
platform_admins ─┐
                  ├──> tenants ──┬──> tenant_users ──> questionnaires
                                 ├──> respondents ──> email_verification_tokens
                                 │                └──> submissions ──> submission_answers
                                 └──> questionnaires ──> sections ──> questions ──> question_options
```

Key fields on `Submission`:
- `leadStatus` — `open` | `in_progress` | `closed` (default: `open`)
- `submittedAt` — set when email is verified

Key fields on `QuestionOption`:
- `isAllowed` — `true` (allowed) | `false` (not allowed) | `null` (no designation)

### End-to-End Flow

1. **Platform admin** creates a tenant with branding (slug, logo, colors)
2. **Platform admin** creates the first owner account for the tenant
3. **Tenant owner** logs into `/reporting`, creates a questionnaire
4. **Tenant owner** adds sections, questions, and answer options (with allowed/not-allowed designations)
5. **Tenant owner** optionally customizes the email template and notification email
6. **Tenant owner** publishes the questionnaire
7. **Respondent** opens the public URL: `/{tenant_slug}/{questionnaire_slug}`
8. **Respondent** answers all questions (auto-saved as draft, works offline)
9. **Respondent** enters email → receives verification email → submission finalized
10. **Tenant owner** views the submission in `/reporting`, manages lead status (open → in behandeling → afgehandeld)
11. **Tenant owner** exports filtered submissions as CSV

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)

### Run with Docker

```bash
# 1. Clone and navigate
cd gacs

# 2. Start all services
docker compose up --build

# 3. Push the database schema
docker compose exec api npx prisma db push

# 4. Seed the database (includes GACS checklist with allowed/not-allowed flags)
docker compose exec api npm run seed
```

### Access the Apps

| App | URL |
|-----|-----|
| UI (Respondent) | http://localhost:3000 |
| Reporting (Tenant Admin) | http://localhost:3001 |
| Monitoring (Platform Admin) | http://localhost:3002 |
| API | http://localhost:4000/api |
| Prisma Studio | http://localhost:5555 |
| Mailpit (Email) | http://localhost:8025 |

### Test the Questionnaire

- **Normal flow:** http://localhost:3000/croonwolterdros/gacs-compliance-check
- **Instant results (skip email):** http://localhost:3000/croonwolterdros/gacs-compliance-check?skipEmailStep=1
- **Instant results:** http://localhost:3000/croonwolterdros/gacs-compliance-check?skipEmailStep=1

### Login Credentials (from seed)

| App | Email | Password | Role |
|-----|-------|----------|------|
| Monitoring | `admin@gacs.local` | `Admin123!` | Platform Admin |
| Reporting | `owner@croonwolterdros.nl` | `Owner123!` | Tenant Owner |
| Reporting | `admin@croonwolterdros.nl` | `TenantAdmin123!` | Tenant Admin |

When logging into **Reporting**, use tenant slug: `croonwol terdros`

---

## Local Development (without Docker)

```bash
# 1. Start PostgreSQL and Mailpit
docker compose up postgres mailpit -d

# 2. API
cd api
npm install
npx prisma db push
npm run seed
npm run start:dev

# 3. UI (in another terminal)
cd ui
npm install
npm run dev

# 4. Reporting (in another terminal)
cd reporting
npm install
npm run dev

# 5. Monitoring (in another terminal)
cd monitoring
npm install
npm run dev
```

### Common Docker Commands

```bash
# Push schema changes to the database
docker compose exec api npx prisma db push

# Regenerate Prisma client
docker compose exec api npx prisma generate

# Re-seed the database (idempotent, also syncs allowed/not-allowed flags)
docker compose exec api npm run seed

# Restart the API container after code changes
docker compose restart api

# View API logs
docker compose logs -f api
```

---

## Project Structure

```
gacs/
├── api/                          # NestJS backend
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.ts               # GACS checklist seed data + isAllowed flags
│   ├── src/
│   │   ├── app/usecase/          # Application use cases
│   │   │   ├── submissions/      # Submission lifecycle, lead status, PDF data, export
│   │   │   ├── respondents/      # Email verification flow
│   │   │   ├── gdpr/             # GDPR compliance (export, erasure, purge)
│   │   │   └── ...
│   │   ├── domain/               # Entities, repository interfaces, ports
│   │   ├── infrastructure/       # Prisma repositories, mail service
│   │   ├── ui/controllers/       # REST controllers, guards, decorators
│   │   └── main.ts
│   └── Dockerfile
│
├── ui/                           # React respondent app
│   ├── src/
│   │   ├── components/ui/        # shadcn/ui components
│   │   ├── pages/                # QuestionnairePage, VerifyPage
│   │   └── lib/                  # API client, PDF generation, offline support
│   └── Dockerfile
│
├── reporting/                    # React tenant admin panel
│   ├── src/
│   │   ├── components/           # UI components + layout
│   │   ├── pages/                # Dashboard, Questionnaires, Submissions, Branding, GDPR
│   │   └── lib/                  # Auth context, API client
│   └── Dockerfile
│
├── monitoring/                   # React platform admin panel
│   ├── src/
│   │   ├── components/           # UI components + layout
│   │   ├── pages/                # Dashboard, Tenants CRUD, GDPR
│   │   └── lib/                  # Auth context, API client
│   └── Dockerfile
│
├── .docs/                        # Documentation
│   ├── DATAMODEL.md              # Complete data model specification
│   ├── briefing.md               # Project briefing
│   └── checklist-*.pdf           # GACS checklist (NEN-EN-ISO 52120)
│
├── docker-compose.yml            # All services orchestration
├── .env                          # Environment variables
├── .gitignore
└── README.md
```

---

## Authentication & Authorization

### Session-Based Auth

- Uses **express-session** with **PostgreSQL session store** (connect-pg-simple)
- Cookies are `httpOnly`, `sameSite: lax`, and `secure` in production
- Sessions expire after 24 hours

### Role Enforcement

- **Monitoring** (`/monitoring`): Only `platform_admin` can log in
- **Reporting** (`/reporting`): Only `tenant_owner` and `tenant_admin` can log in (requires tenant slug)
- **API**: Role-based guards (`@Roles()` decorator + `RolesGuard`) enforce permissions on every endpoint

### Permission Matrix

| Action | Platform Admin | Tenant Owner | Tenant Admin | Respondent |
|--------|:-:|:-:|:-:|:-:|
| Create/deactivate tenants | ✓ | | | |
| Create first owner account | ✓ | | | |
| Update tenant branding | | ✓ | | |
| Customize email template | | ✓ | | |
| Invite/remove tenant admins | | ✓ | | |
| Create questionnaire | | ✓ | ✓ | |
| Edit questionnaire content | | ✓ | ✓ | |
| Set allowed/not-allowed on options | | ✓ | ✓ | |
| Delete questionnaire | | ✓ | | |
| Publish/unpublish questionnaire | | ✓ | | |
| Reorder sections/questions/options | | ✓ | ✓ | |
| View submissions | | ✓ | ✓ | |
| Update lead status | | ✓ | ✓ | |
| Export submission data (CSV) | | ✓ | | |
| Fill in questionnaire | | | | ✓ |
| Submit email for verification | | | | ✓ |

---

## GDPR Compliance

### Data Minimization
- Respondents only provide an email address (no name, phone, etc.)
- Email is scoped to tenant for data isolation

### Right to Access (Data Portability)
- `GET /api/gdpr/respondents/:id/export` — Export all personal data for a respondent

### Right to Erasure
- `DELETE /api/gdpr/respondents/:id` — Anonymize all respondent data, unlink submissions

### Data Retention
- Configurable per tenant via the GDPR settings page in `/reporting`
- `POST /api/gdpr/purge` — Purge expired verification tokens and anonymize old respondents

### Cookie Consent
- Session cookies are functional (required for auth) and exempt from consent requirements
- No tracking cookies or third-party analytics

### Email Verification
- Tokens are stored as SHA-256 hashes (raw token never stored)
- Tokens expire after 24 hours
- Status lifecycle: `issued` → `consumed` / `expired` / `revoked`

---

## API Endpoints

### Auth
- `POST /api/auth/login` — Login (email, password, optional tenantSlug)
- `GET /api/auth/me` — Get current session user
- `POST /api/auth/logout` — Logout

### Tenants (Platform Admin)
- `GET /api/tenants` — List all tenants
- `POST /api/tenants` — Create tenant
- `GET /api/tenants/:id` — Get tenant details
- `PATCH /api/tenants/:id` — Update tenant (branding, email template, notification email)
- `PATCH /api/tenants/:id/deactivate` — Deactivate tenant
- `GET /api/tenants/by-slug/:slug` — Public: get tenant by slug

### Tenant Users
- `GET /api/tenants/:tenantId/users` — List users
- `POST /api/tenants/:tenantId/users` — Create user
- `PATCH /api/tenants/:tenantId/users/:id/deactivate` — Deactivate
- `DELETE /api/tenants/:tenantId/users/:id` — Remove

### Questionnaires
- `GET /api/public/:tenantSlug/:questionnaireSlug` — Public: get published questionnaire
- `GET /api/tenants/:tenantId/questionnaires` — List for tenant
- `POST /api/tenants/:tenantId/questionnaires` — Create
- `PATCH /api/questionnaires/:id` — Update
- `PATCH /api/questionnaires/:id/publish` — Publish
- `PATCH /api/questionnaires/:id/unpublish` — Unpublish
- `DELETE /api/questionnaires/:id` — Delete

### Sections, Questions, Options
- CRUD + reorder endpoints for each level
- `PATCH /api/questions/:questionId/options/:optionId` — Update option (including `isAllowed`)

### Submissions
- `POST /api/submissions/start` — Start new submission
- `POST /api/submissions/:id/answers` — Save answer
- `GET /api/submissions/:id` — Get submission details
- `GET /api/submissions/:id/pdf-data` — Get full PDF data
- `POST /api/submissions/:id/email` — Submit email for verification
- `PATCH /api/submissions/:id/lead-status` — Update lead status (tenant only)
- `GET /api/tenants/:tenantId/submissions` — List with filters (email, questionnaire, status, date range)
- `GET /api/tenants/:tenantId/submissions/export` — CSV export with same filters

### Email Verification
- `GET /api/verify-email?token=...&submission=...` — Verify email

### GDPR
- `GET /api/gdpr/respondents/:id/export` — Export data
- `DELETE /api/gdpr/respondents/:id` — Delete data
- `POST /api/gdpr/purge` — Purge expired data
- `GET /api/tenants/:tenantId/gdpr/retention` — Get retention settings
- `PUT /api/tenants/:tenantId/gdpr/retention` — Update retention settings
- `GET /api/tenants/:tenantId/gdpr/audit-log` — View audit log

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://gacs:gacs_secret@postgres:5432/gacs` |
| `API_PORT` | API server port | `4000` |
| `SESSION_SECRET` | Session encryption secret | `change-me-...` |
| `UI_URL` | UI app URL | `http://localhost:3000` |
| `REPORTING_URL` | Reporting app URL | `http://localhost:3001` |
| `MONITORING_URL` | Monitoring app URL | `http://localhost:3002` |
| `SMTP_HOST` | SMTP server host | `mailpit` |
| `SMTP_PORT` | SMTP server port | `1025` |
| `SMTP_FROM` | From email address | `noreply@gacs.local` |
| `DATA_RETENTION_DAYS` | GDPR data retention period | `365` |
| `VITE_TINYMCE_API_KEY` | TinyMCE API key for email template editor | *(set in .env)* |

---

## GACS Checklist (Seed Data)

The seed script loads the complete GACS checklist from the [RVO checklist-technische-eisen-gacs-v3.pdf](https://www.rvo.nl/sites/default/files/2024-01/checklist-technische-eisen-gacs-v3.pdf) as questionnaire data, with each option pre-classified as **allowed** or **not allowed**:

| Section | Title | Questions |
|---------|-------|-----------|
| 1 | Verwarmingssysteem onderdelen | 1.1 – 1.10 |
| 2 | Warm tapwater onderdelen | 2.1 – 2.4 |
| 3 | Airconditioningssysteem onderdelen | 3.1 – 3.9 |
| 4 | Ventilatiesysteem onderdelen | 4.1 – 4.10 |
| 5 | Verlichtingssysteem onderdelen | 5.1 – 5.2 |
| 6 | Zonweringssysteem onderdelen | 6.1 |
| 7 | Technisch gebouwmanagement onderdelen | 7.1 – 7.7 |

Each question has options classified into **"Niet toegestaan"** (not allowed) and **"Wel toegestaan"** (allowed), following the NEN-EN-ISO 52120 standard. Re-running the seed (`npm run seed`) is idempotent and will synchronize `isAllowed` flags on existing options.

---

## Possible Future Additions

- **OIDC Authentication** — Extend the current session-based authentication to also support OpenID Connect. Consider implementing Keycloak as an identity provider and allowing tenants to connect their own IdP for `/reporting` login.
- **Internationalization (i18n)** — Multi-language support for questionnaire content and UI chrome.
- **Webhook Integrations** — Notify external systems (CRM, email marketing) when a submission is completed or lead status changes.
- **PDF Branding** — Include tenant logo and colors in the generated PDF report.

---

## License

Private — WeAreReasonablePeople
