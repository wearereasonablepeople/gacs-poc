# GACS Questionnaire Platform

A **whitelabel, multi-tenant questionnaire platform** built for GACS (Gebouwautomatiserings- en Controlesystemen) compliance checking, conforming to NEN-EN-ISO 52120.

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
- **Containerization:** Docker Compose

---

## Domain Model

### Roles & Permissions

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| **Platform Admin** | Global | Create/deactivate tenants, create owner accounts |
| **Tenant Owner** | Their tenant | Full control: branding, users, questionnaires, publishing, deletion, export |
| **Tenant Admin** | Their tenant | Content management: create/edit questionnaires, view submissions |
| **Respondent** | Public | Fill in published questionnaires, verify email |

### Data Model

```
platform_admins ─┐
                  ├──> tenants ──┬──> tenant_users ──> questionnaires
                                 ├──> respondents ──> email_verification_tokens
                                 │                └──> submissions ──> submission_answers
                                 └──> questionnaires ──> sections ──> questions ──> question_options
```

### End-to-End Flow

1. **Platform admin** creates a tenant with branding (slug, logo, colors)
2. **Platform admin** creates the first owner account for the tenant
3. **Tenant owner** logs into `/reporting`, creates a questionnaire
4. **Tenant owner** adds sections, questions, and answer options
5. **Tenant owner** publishes the questionnaire
6. **Respondent** opens the public URL: `/{tenant_slug}/{questionnaire_slug}`
7. **Respondent** answers all questions (auto-saved as draft)
8. **Respondent** enters email → receives verification email
9. **Respondent** clicks verification link → submission finalized
10. **Tenant owner** views the submission in the reporting panel

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

# 3. Run migrations (first time only)
docker compose exec api npx prisma migrate dev --name init

# 4. Seed the database
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

Open: http://localhost:3000/croonwolterdros/gacs-compliance-check

### Login Credentials (from seed)

| App | Email | Password | Role |
|-----|-------|----------|------|
| Monitoring | `admin@gacs.local` | `Admin123!` | Platform Admin |
| Reporting | `owner@croonwolterdros.nl` | `Owner123!` | Tenant Owner |
| Reporting | `admin@croonwolterdros.nl` | `TenantAdmin123!` | Tenant Admin |

When logging into **Reporting**, use tenant slug: `croonwolterdros`

---

## Local Development (without Docker)

```bash
# 1. Start PostgreSQL (or use Docker for just the DB)
docker compose up postgres mailpit -d

# 2. API
cd api
npm install
npx prisma migrate dev --name init
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

---

## Project Structure

```
gacs/
├── api/                          # NestJS backend
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.ts               # GACS checklist seed data
│   ├── src/
│   │   ├── auth/                 # Authentication (session, passport, guards)
│   │   ├── common/               # Shared decorators, guards
│   │   ├── gdpr/                 # GDPR compliance (export, erasure, purge)
│   │   ├── mail/                 # Email service (nodemailer)
│   │   ├── platform-admins/      # Platform admin endpoints
│   │   ├── tenants/              # Tenant CRUD
│   │   ├── tenant-users/         # Tenant user management
│   │   ├── questionnaires/       # Questionnaire CRUD + publish lifecycle
│   │   ├── sections/             # Section CRUD + reorder
│   │   ├── questions/            # Question CRUD + reorder
│   │   ├── question-options/     # Option CRUD + reorder
│   │   ├── submissions/          # Submission lifecycle + answers
│   │   ├── respondents/          # Email verification flow
│   │   └── prisma/               # Prisma service (global)
│   └── Dockerfile
│
├── ui/                           # React respondent app
│   ├── src/
│   │   ├── components/ui/        # shadcn/ui components
│   │   ├── pages/                # QuestionnairePage, VerifyPage, etc.
│   │   └── lib/                  # API client, utils
│   └── Dockerfile
│
├── reporting/                    # React tenant admin panel
│   ├── src/
│   │   ├── components/           # UI components + layout
│   │   ├── pages/                # Dashboard, Questionnaires, Submissions, etc.
│   │   └── lib/                  # Auth context, API client
│   └── Dockerfile
│
├── monitoring/                   # React platform admin panel
│   ├── src/
│   │   ├── components/           # UI components + layout
│   │   ├── pages/                # Dashboard, Tenants CRUD, GDPR, etc.
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

- **Monitoring** (`/monitoring`): Only `platform_admin` can log in. The frontend auth context checks the role and redirects unauthorized users.
- **Reporting** (`/reporting`): Only `tenant_owner` and `tenant_admin` can log in. Login requires the tenant slug.
- **API**: Role-based guards (`@Roles()` decorator + `RolesGuard`) enforce permissions on every endpoint.

### Permission Matrix

| Action | Platform Admin | Tenant Owner | Tenant Admin | Respondent |
|--------|:-:|:-:|:-:|:-:|
| Create/deactivate tenants | ✓ | | | |
| Create first owner account | ✓ | | | |
| Update tenant branding | | ✓ | | |
| Invite/remove tenant admins | | ✓ | | |
| Create questionnaire | | ✓ | ✓ | |
| Edit questionnaire content | | ✓ | ✓ | |
| Delete questionnaire | | ✓ | | |
| Publish/unpublish questionnaire | | ✓ | | |
| Reorder sections/questions/options | | ✓ | ✓ | |
| View submissions | | ✓ | ✓ | |
| Export submission data | | ✓ | | |
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
- Configurable via `DATA_RETENTION_DAYS` environment variable (default: 365 days)
- `POST /api/gdpr/purge` — Purge expired verification tokens and anonymize old respondents

### Cookie Consent
- Session cookies are functional (required for auth) and exempt from consent requirements
- No tracking cookies or third-party analytics

### Email Verification
- Tokens are stored as SHA-256 hashes (raw token never stored)
- Tokens expire after 24 hours
- Status lifecycle: `issued` → `consumed` / `expired` / `revoked`

---

## Whitelabel

Each tenant has customizable branding:
- **Name** — displayed in header
- **Slug** — URL identifier (`/croonwolterdros/gacs-compliance-check`)
- **Primary Color** — hex color applied via CSS variables
- **Secondary Color** — hex color for accents
- **Logo URL** — displayed in questionnaire header
- **Favicon URL** — browser tab icon

The UI app dynamically applies tenant branding when loading a questionnaire. CSS custom properties are updated at runtime based on the tenant configuration.

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
- `PATCH /api/tenants/:id` — Update tenant
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

### Submissions
- `POST /api/submissions/start` — Start new submission
- `POST /api/submissions/:id/answers` — Save answer
- `GET /api/submissions/:id` — Get submission details
- `POST /api/submissions/:id/email` — Submit email for verification

### Email Verification
- `GET /api/verify-email?token=...&submission=...` — Verify email

### GDPR
- `GET /api/gdpr/respondents/:id/export` — Export data
- `DELETE /api/gdpr/respondents/:id` — Delete data
- `POST /api/gdpr/purge` — Purge expired data

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

---

## GACS Checklist (Seed Data)

The seed script loads the complete GACS checklist from `checklist-technische-eisen-gacs-v3.pdf` as questionnaire data:

| Section | Title | Questions |
|---------|-------|-----------|
| 1 | Verwarmingssysteem onderdelen | 1.1 – 1.10 |
| 2 | Warm tapwater onderdelen | 2.1 – 2.4 |
| 3 | Airconditioningssysteem onderdelen | 3.1 – 3.9 |
| 4 | Ventilatiesysteem onderdelen | 4.1 – 4.10 |
| 5 | Verlichtingssysteem onderdelen | 5.1 – 5.2 |
| 6 | Zonweringssysteem onderdelen | 6.1 |
| 7 | Technisch gebouwmanagement onderdelen | 7.1 – 7.7 |

Each question has options grouped into **"Niet toegestaan"** (not allowed) and **"Wel toegestaan"** (allowed), following the NEN-EN-ISO 52120 classification.

---

### Posible future additions:
- Extend the authentication to not only support the current session based authentication, but also OIDC. I might be a good idea for us to implement something like Keycloak, create our own identity provider and allow a tenant to connect their own identity provider to their login for the /reporting app.

## License

Private — WeAreReasonablePeople
