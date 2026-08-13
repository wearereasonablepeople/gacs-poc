# GACS POC — Current System Research

> Primary sources only: source code, Prisma schema, `package.json`, `README.md`, `.docs/*`, Docker Compose, deploy configs.  
> Generated for a future **simpler rebuild** decision — what is essential vs incidental?

---

## 1. Purpose & domain

### Problem GACS solves

From **`.docs/briefing.md`**: building owners of utility buildings with heating/AC systems **>290 kW** must have a Gebouwautomatiserings- en Controlesysteem (GACS) from **1 January 2026** (EPBD III / BBL). Croonwolter&dros wants an online tool that:

- Lets users describe their situation
- Checks compliance against **RVO requirements** (see `.docs/checklist-technische-eisen-gacs-v3.pdf`)
- Gives advice (“verplicht”, “mogelijk compliant”, “upgrade nodig”, “expert inschakelen”)
- Generates **leads** and positions the tenant as authority

From **`README.md`**: the POC is a **whitelabel, multi-tenant questionnaire platform** for GACS compliance checking, conforming to **NEN-EN-ISO 52120**, with pre-classified allowed/not-allowed options from the [RVO GACS checklist v3](https://www.rvo.nl/sites/default/files/2024-01/checklist-technische-eisen-gacs-v3.pdf).

### Actors

| Actor | App | Role in code |
|-------|-----|--------------|
| **Respondent** | `ui` (port 3000) | Anonymous; fills published questionnaire at `/{tenantSlug}/{questionnaireSlug}` |
| **Tenant admin / owner** | `reporting` (port 3001) | `tenant_owner`, `tenant_admin` — manage questionnaires, branding, submissions |
| **Platform admin** | `monitoring` (port 3002) | `platform_admin` — create tenants, owner accounts, global GDPR purge |

Roles are stored in a `Role` table and referenced by `PlatformAdmin.roleId` and `TenantUser.roleId` (`api/prisma/schema.prisma`); seed creates `platform_admin`, `tenant_owner`, `tenant_admin` (`api/prisma/seed.ts`).

### Scope drift vs original briefing

Several briefing requirements are **not implemented** in schema or UI:

| Briefing ask (`.docs/briefing.md`) | Current POC |
|-----------------------------------|-------------|
| Organisatiegegevens (KvK) | No entity/field — grep finds no KvK in codebase |
| Contactpersoon (naam, e-mail, functie) | No dedicated fields; optional respondent email via **legacy** verification API only |
| Gebouw- / installatiegegevens | Not separate — only GACS checklist questions in seed |
| Output: “verplicht ja/nee, **klasse inschatting**” | **Percentage score** from `isAllowed` flags, not NEN class A/B/C engine (`ui/src/lib/pdf.ts`, `SubmissionsUseCase.getPdfPreviewData`) |
| “Houd bewust simpel: Supabase/Firebase” | NestJS + PostgreSQL + 4 Docker services + 3 React SPAs |

The **implemented** product is closer to `README.md` (generic whitelabel questionnaire + GACS seed) than to the full briefing questionnaire flow.

---

## 2. Architecture map

### Four apps + infrastructure

```
┌────────────┬────────────┬────────────┬────────────┬────────────────┐
│   ui       │ reporting  │ monitoring │   api      │  PostgreSQL    │
│ React/Vite │ React/Vite │ React/Vite │  NestJS    │  + Prisma      │
│ Port 3000  │ Port 3001  │ Port 3002  │ Port 4000  │  Port 5432     │
│ Respondent │ Tenant admin│ Platform   │ REST + auth│                │
└────────────┴────────────┴────────────┴────────────┴────────────────┘
                              │
                    Mailpit (dev): 8025 UI / 1025 SMTP
                    Prisma Studio (dev): 5555
```

See `README.md` (Architecture Overview) and `docker-compose.yml`.

### How apps communicate

| Client | API base | Auth |
|--------|----------|------|
| `ui` | `/api` via Vite proxy → `http://api:4000` (`ui/vite.config.ts`) | None for respondents; session not used |
| `reporting` | `VITE_API_URL` (e.g. `http://localhost:4000`) | Session cookie, `credentials: true` |
| `monitoring` | Same | Session cookie |

API global prefix: `api` (`api/src/main.ts`). CORS allows all three frontend URLs plus optional ngrok (`CORS_ALLOW_ALL`, `ALLOW_NGROK` in `.env.example`).

### Backend internal structure

NestJS monolith with **clean-ish layering** (`README.md` Project Structure):

- `api/src/domain/` — entities, repository interfaces, ports
- `api/src/app/usecase/` — business logic (~15 use case classes)
- `api/src/infrastructure/` — Prisma repositories, mail, auth, **16 feature modules** (`api/src/app.module.ts`)
- `api/src/ui/controllers/` — 14 REST controllers

Static uploads served at `/api/uploads` from local disk (`api/src/app.module.ts`, `api/src/ui/controllers/uploads.controller.ts`).

### Docker — development

`docker-compose.yml` runs: `postgres`, `api`, `ui`, `reporting`, `monitoring`, `mailpit`, `prisma-studio`. All frontends mount source volumes for hot reload.

### Docker — production

`docker-compose.prod.yml` runs **only**: `postgres`, `api`, `ui`, `gateway` (nginx). **Reporting and monitoring are not deployed** (`deploy/README.md`, `README.md` Deploy section).

Nginx (`deploy/nginx.conf`):

- `/` → `ui:3000`
- `/api/` → `api:4000`
- TLS on `gacs.warp.land` (Let's Encrypt paths)

Production exposes port **80/443** only; tenant/platform admin panels are dev-local unless separately deployed.

---

## 3. Domain / data model

Authoritative schema: `api/prisma/schema.prisma`. Design doc: `.docs/DATAMODEL.md` (partially **stale** — see contradictions below).

### Core entity graph

```
Role
platform_admins ──creates──> tenants ──┬── tenant_users
                                       ├── questionnaires ── sections ── questions ── question_options
                                       ├── respondents ── email_verification_tokens
                                       └── audit_logs

submissions (questionnaire + optional respondent) ── submission_answers
Session (express-session store)
```

### Key models (summary)

| Model | Purpose | Notable fields |
|-------|---------|----------------|
| `Tenant` | Whitelabel instance | `slug`, 15+ color/branding columns, `logoUrl`, `faviconUrl`, `verificationEmailTemplate`, `notificationEmail`, `retentionDays` |
| `TenantUser` | Owner/admin login | `roleId` → `Role`, unique `(tenantId, email)` |
| `Questionnaire` | Tenant-scoped form | `slug`, publish flags, intro/completion copy & images, `showConfetti` |
| `Section` / `Question` / `QuestionOption` | Content tree | `displayOrder`, `code`; options have `groupLabel`, **`isAllowed`** (nullable bool) |
| `Submission` | One fill attempt | `leadStatus` (`open`/`in_progress`/`closed`), `submittedAt`, optional `respondentId` |
| `SubmissionAnswer` | Single-choice answer | `UNIQUE(submissionId, questionId)` |
| `Respondent` | Email identity (legacy path) | `isEmailVerified`, `consentGivenAt` |
| `EmailVerificationToken` | Hashed tokens | SHA-256 `tokenHash`, status lifecycle |
| `AuditLog` | GDPR accountability | tenant-scoped actions |

### DATAMODEL.md vs schema/code contradictions

| `.docs/DATAMODEL.md` says | Actual code |
|---------------------------|-------------|
| “Out of scope: compliance engines, **scoring**, PDF, email templates” | Implemented: `isAllowed` scoring, client PDF (`ui/src/lib/pdf.ts`), TinyMCE templates (`reporting/src/pages/BrandingPage.tsx`) |
| Respondent **must** leave email + verify before finalize | **Current default flow**: finalize without email (`SubmissionsUseCase.finalizeSubmission` sets `submittedAt` only; `QuestionnairePage.tsx` has no email step) |
| `tenant_users.role` as varchar `owner \| admin` | `roleId` FK to `Role` table with names `tenant_owner`, `tenant_admin` |

Treat **`README.md` + schema + code** as ground truth for the running system; treat **DATAMODEL.md** as an earlier design spec.

---

## 4. Key user flows

### 4.1 Respondent: questionnaire → score → PDF

**Entry:** `GET /api/public/:tenantSlug/:questionnaireSlug`  
→ `QuestionnairesController.findPublished` → `QuestionnairesUseCase.findPublished`  
→ `ui/src/pages/QuestionnairePage.tsx` (route `/:tenantSlug/:questionnaireSlug` in `ui/src/App.tsx`).

**Steps (from `QuestionnairePage.tsx`):**

1. Load published questionnaire + tenant branding; cache to `localStorage` (`ui/src/lib/offline.ts`).
2. `POST /api/submissions/start` — create draft submission (`SubmissionsController.startSubmission`).
3. For each answer: `POST /api/submissions/:id/answers` — upsert answer; on failure, queue in offline store.
4. On “complete” step: auto-call `POST /api/submissions/:id/finalize` — sets `submittedAt` **without respondent email** (`SubmissionsUseCase.finalizeSubmission`).
5. Show **compliance %** via `computeScores()` on client (`ui/src/lib/pdf.ts` lines 35–66) using `QuestionOption.isAllowed === true` as “correct”.
6. User downloads PDF client-side via `generateSubmissionPdf()` — same scoring, section bar chart, motivational message (`ui/src/lib/pdf.ts`).

**Legacy email path (still in API, not used by main UI):**

- `POST /api/submissions/:id/email` → `RespondentsUseCase.submitEmail` — creates respondent, sends verification + optional tenant notification.
- `GET /api/verify-email` → finalize on verify.
- `ui/src/pages/VerifyPage.tsx` → redirect to `DownloadPage.tsx` which uses `GET /api/submissions/:id/pdf-data`.

### 4.2 Tenant: branding / questionnaires / submissions / leads

**Login:** `reporting/src/pages/LoginPage.tsx` → `POST /api/auth/login` with `{ email, password, tenantSlug }`.  
`reporting/src/lib/auth.tsx` rejects non-tenant roles.

| Task | Page | API |
|------|------|-----|
| Dashboard stats | `reporting/src/pages/DashboardPage.tsx` | `GET /api/tenants/:id/stats` |
| CRUD questionnaires | `QuestionnairesPage`, `QuestionnaireDetailPage` (~1635 lines) | `/api/tenants/:tenantId/questionnaires`, sections/questions/options CRUD + reorder |
| Set `isAllowed` on options | `QuestionnaireDetailPage.tsx` | `PATCH /api/questions/:questionId/options/:optionId` |
| Publish/unpublish | same | `PATCH /api/questionnaires/:id/publish\|unpublish` (owner only) |
| View/filter submissions | `SubmissionsPage.tsx` | `GET /api/tenants/:tenantId/submissions` |
| Lead status | `SubmissionsPage`, `QuestionnaireDetailPage` | `PATCH /api/submissions/:id/lead-status` |
| CSV export | `SubmissionsPage.tsx` | `GET /api/tenants/:tenantId/submissions/export` (owner only) |
| Branding + email template | `BrandingPage.tsx` (~966 lines) | `PATCH /api/tenants/:id` |
| User management | `UsersPage.tsx` (owner only) | `api/src/ui/controllers/tenantusers.controller.ts` |
| GDPR settings | `GdprPage.tsx` | `api/src/ui/controllers/gdpr.controller.ts` |

Image uploads: `POST /api/uploads` → disk under `uploads/` (`uploads.controller.ts`).

### 4.3 Platform admin: monitor tenants

**Login:** `monitoring/src/pages/LoginPage.tsx` — same auth endpoint, **no** `tenantSlug` → platform admin path (`AuthUseCase.validatePlatformAdmin`).

| Task | Page | API |
|------|------|-----|
| List tenants | `TenantsPage.tsx` | `GET /api/tenants` |
| Create tenant + owner | `CreateTenantPage.tsx` | `POST /api/tenants`, `POST /api/tenants/:id/users` |
| Tenant detail / deactivate | `TenantDetailPage.tsx` | `GET/PATCH /api/tenants/:id`, `PATCH .../deactivate` |
| Global GDPR purge | `GdprPage.tsx` | `POST /api/gdpr/purge` |

### 4.4 Auth / session flow

1. `POST /api/auth/login` — `LocalAuthGuard` + `LocalStrategy` (`api/src/infrastructure/auth/local.strategy.ts`).
2. Passport serializes `SessionUser` into PostgreSQL session table (`Session` model, `connect-pg-simple` in `main.ts`).
3. `GET /api/auth/me` — `AuthenticatedGuard` returns session user.
4. `POST /api/auth/logout` — destroy session, clear `connect.sid` cookie.
5. Protected routes: `@UseGuards(AuthenticatedGuard, RolesGuard)` + `@Roles(...)` on controllers.

Cookie: `httpOnly`, `sameSite: lax`, `secure` when `NODE_ENV=production`, 24h max age (`main.ts`).

---

## 5. Feature inventory

| Feature | Evidence | Core to GACS compliance? | Notes |
|---------|----------|--------------------------|-------|
| GACS checklist seed (7 sections, ~40+ questions) | `api/prisma/seed.ts` (`getGACSChecklistData`) | **Core** | Maps RVO PDF to sections/questions/options |
| Allowed / not allowed option classification | `QuestionOption.isAllowed`, seed `resolveIsAllowed` | **Core** | Basis for compliance scoring |
| Percentage compliance score | `ui/src/lib/pdf.ts` `computeScores`, completion UI | **Core** | Not NEN class calculation |
| PDF download (client jsPDF) | `ui/src/lib/pdf.ts`, `QuestionnairePage` | **Core** | Briefing asked for PDF; no server-side PDF |
| Single-choice questionnaire engine | Schema unique constraint, UI radio/select | **Core** | Generic engine, GACS content as seed |
| Submission persistence | `Submission`, `SubmissionAnswer` | **Core** | Stores answers for tenant review |
| Multi-tenant whitelabel | `Tenant`, slug URLs, branding | **Platform** | Briefing wanted white-label; adds large surface |
| 15+ per-tenant color tokens | `Tenant` model many `*Color` fields | **Platform chrome** | Far beyond briefing “logo + colors” |
| Lead status workflow | `Submission.leadStatus`, reporting UI | **Platform** | CRM-lite; briefing said no CRM |
| CSV export | `SubmissionsUseCase.exportByTenant` | **Platform** | Useful for tenant ops |
| Tenant admin panel (`reporting`) | Full SPA | **Platform** | Could be one simplified admin |
| Platform admin panel (`monitoring`) | Full SPA | **Platform** | Overkill for single-tenant Croonwolter&dros |
| Email verification flow | `RespondentsUseCase`, `VerifyPage` | **Legacy / optional** | Briefing wanted it; README says default flow skips email |
| Custom HTML email templates (TinyMCE) | `BrandingPage.tsx`, `@tinymce/tinymce-react` | **Platform chrome** | Only needed if email verification kept |
| Tenant notification email | `RespondentsUseCase.submitEmail`, `NodemailerMailService` | **Platform** | Tied to legacy email flow |
| Offline + sync queue | `ui/src/lib/offline.ts` | **Incidental** | Not in briefing |
| Section intro images / icons | `Section.imageUrl`, `icon`, `DynamicIcon.tsx` | **Incidental polish** | Fallback assets in `ui/public/pdf-assets/` |
| Confetti on completion | `Questionnaire.showConfetti`, `canvas-confetti` | **Incidental** | |
| GDPR module (retention, audit log, erasure) | `GdprUseCase`, `GdprController`, UI pages | **Platform / legal** | Substantial; briefing mentioned GDPR-proof storage |
| Public GDPR erasure request | `ui/src/pages/GdprErasurePage.tsx`, `POST /api/gdpr/erasure-request` | **Platform** | |
| Image upload to local disk | `uploads.controller.ts`, prod volume `uploads_data` | **Platform** | `FUTURE_IMPROVEMENTS.md` wants object storage |
| Reorder sections/questions/options | reorder endpoints on controllers | **Platform** | Admin UX |
| PDF preview API | `POST /api/questionnaires/:id/pdf-preview-data` | **Platform** | For admin preview, not respondent |
| Swagger | `@nestjs/swagger` in dependencies | **Incidental** | Listed in package.json, not central to product |
| Roles as DB table | `Role` model + seed | **Platform** | Could be enum for 3 roles |

---

## 6. Complexity hotspots

Evidence-backed areas that are heavy relative to “simple GACS check tool”:

### Three separate React SPAs + duplicated UI kit

- **~51 shadcn/ui components × 3 apps ≈ 153 component files** (`ui/`, `reporting/`, `monitoring/` each have full `components/ui/`).
- Identical stack in all three `package.json`: React 18, Vite 5, TanStack Query, Radix, Tailwind.
- **No shared package** — copy-paste maintenance burden.

### NestJS modular architecture for a POC

- **16 feature modules**, domain/infrastructure/ui split, **~108 TypeScript files** under `api/src/`.
- Repository interface + Prisma implementation per aggregate — appropriate for a product platform, heavy for a single checklist tool.

### God pages

| File | Lines | Role |
|------|-------|------|
| `reporting/src/pages/QuestionnaireDetailPage.tsx` | ~1635 | Questionnaire editor + submissions + options + lead status |
| `ui/src/pages/QuestionnairePage.tsx` | ~1109 | Entire respondent experience |
| `reporting/src/pages/BrandingPage.tsx` | ~966 | Branding + TinyMCE email editor |
| `api/prisma/seed.ts` | ~890 | GACS checklist data + idempotent sync |

### Branding dimensionality

`Tenant` has **15 color fields** plus logo/favicon/template (`schema.prisma` lines 54–72) vs briefing’s “logo, colors, texts”.

### Dual submission finalize paths

- Direct finalize (no PII) — **active** in UI.
- Email verification finalize — **full backend + pages** still present (`RespondentsUseCase`, `VerifyPage`, `DownloadPage`, mail templates).
- Creates confusion: submissions can exist with `respondentId = null` (`schema.prisma`); reporting shows empty respondent email (`SubmissionsPage.tsx` interface).

### Email / TinyMCE stack

- `@tinymce/tinymce-react` + `VITE_TINYMCE_API_KEY` (`.env.example`)
- `sanitize-html` on server for templates
- `FUTURE_IMPROVEMENTS.md` already questions continuing TinyMCE

### Auth complexity for scale not yet needed

- Session store in PostgreSQL (`Session` table)
- Separate `platform_admins` vs `tenant_users` tables
- Passport-local + guards on every controller
- Briefing suggested delegating auth to Supabase/Firebase; POC built custom auth

### Production vs dev mismatch

- Dev: 4 frontends + Mailpit + Prisma Studio
- Prod: **respondent UI only** (`docker-compose.prod.yml`) — admin tooling requires separate deployment or local access

### Missing briefing features despite platform complexity

Platform grew horizontally (multi-tenant SaaS) while **vertical GACS requirements** from briefing (org data, building data, mandatory/class output) were not built.

---

## 7. Tech stack versions

From `package.json` files (exact declared ranges):

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js | 20+ (`README.md` Prerequisites) |
| Backend framework | NestJS | ^10.4.0 (`api/package.json`) |
| ORM | Prisma / @prisma/client | ^5.20.0 |
| Database | PostgreSQL | 16-alpine (`docker-compose.yml`) |
| Auth | express-session, connect-pg-simple, passport-local | ^1.18.0, ^9.0.1, ^1.0.0 |
| Email | nodemailer | ^6.9.15 |
| Password hashing | bcrypt | ^5.1.1 |
| Frontend | React | ^18.3.0 (all three SPAs) |
| Build | Vite | ^5.4.0 |
| Routing | react-router-dom | ^6.28.0 |
| Data fetching | @tanstack/react-query | ^5.60.0 |
| UI | shadcn/Radix, Tailwind CSS | ^3.4.14 |
| PDF | jspdf | ^4.1.0 (`ui/package.json`) |
| Rich text | @tinymce/tinymce-react | ^6.3.0 (`reporting/package.json`) |
| Charts | recharts | ^2.12.0 (reporting, monitoring) |
| TypeScript | ^5.6.0 (all packages) |
| Container | Docker Compose v2 | — |
| Reverse proxy | nginx:alpine | prod gateway |

---

## 8. What a simpler rebuild might preserve vs cut

Based **only** on what code/docs show is essential to delivering GACS value (checklist + score + PDF + tenant review), not speculative features.

### Preserve (minimum viable GACS product)

1. **GACS checklist content** as seed/import data — 7 sections, questions, allowed/not-allowed options (`api/prisma/seed.ts`, `.docs/checklist-technische-eisen-gacs-v3.pdf`).
2. **`isAllowed`-based scoring** — percentage per section + overall (`ui/src/lib/pdf.ts`, `SubmissionsUseCase.getPdfPreviewData`).
3. **Single-choice questionnaire traversal** — sections → questions → one option (`QuestionnairePage.tsx` flow).
4. **Submission + answer storage** — audit trail for tenant (`Submission`, `SubmissionAnswer`).
5. **Client-side PDF** with score summary and not-allowed items list.
6. **Basic whitelabel** — tenant name, slug, logo, primary/secondary color (briefing requirement).
7. **Simple admin view of submissions** — briefing: “Simpele interface om ingevulde resultaten te bekijken”.
8. **HTTPS + input validation** — already present via NestJS pipes, helmet.

### Strong simplification candidates

| Area | Rationale |
|------|-----------|
| **`monitoring` app** | Single client (Croonwolter&dros) may not need platform-admin SaaS; tenant creation could be seed/script |
| **Second admin SPA** | Merge `reporting` + `monitoring` into one admin, or server-rendered admin |
| **NestJS clean architecture** | Briefing asked for Supabase/serverless simplicity; a thin API or BaaS reduces ~100+ backend files |
| **Email verification + TinyMCE + notification emails** | Default flow already skips email (`README.md`); removes mail infra, `Respondent`/`EmailVerificationToken` tables, Verify/Download pages |
| **`Role` table + dual admin tables** | 3 fixed roles → enum column; optional single `users` table with `scope` |
| **15 branding color fields** | Keep 2–4 CSS variables; delete per-button colors from schema |
| **Offline sync queue** | `ui/src/lib/offline.ts` — nice-to-have, not briefing |
| **GDPR audit log + retention purge UI** | Keep minimal retention policy; drop audit log table unless legally required |
| **Lead status CRM workflow** | Replace with simple “new submission” list or optional status enum |
| **Local disk uploads** | Use static assets or single S3 bucket; drop multer/serve-static |
| **153 duplicated shadcn files** | One shared UI package or simpler CSS |
| **Confetti, section icons, image scale sliders** | Product polish |
| **Prisma Studio / Mailpit in default compose** | Dev-only extras |

### Reconcile with briefing (likely **add** in rebuild, not delete)

These were in `.docs/briefing.md` but absent from POC — a simpler rebuild might **narrow platform scope** yet ** deepen GACS UX**:

- Organisatie- / contact- / gebouwgegevens stappen vóór checklist
- Expliciete “verplicht ja/nee” and **NEN klasse inschatting** (real compliance engine vs `% allowed`)
- Email capture + verified lead (if lead gen remains a goal) — but use external provider per briefing (“SendGrid… bouw dit niet zelf”)

### Document contradictions to resolve in redesign

1. **Email at end vs anonymous finalize** — pick one; remove dead path.
2. **DATAMODEL.md** — update or retire; it contradicts README and schema on scoring, PDF, email.
3. **Admin in production** — current prod deploy has no reporting/monitoring; decide if operators SSH/seed only or admin must be hosted.

---

## Appendix: primary source index

| Topic | Path |
|-------|------|
| Product overview | `README.md` |
| Original client brief | `.docs/briefing.md` |
| Data model spec (stale sections) | `.docs/DATAMODEL.md` |
| Planned improvements | `FUTURE_IMPROVEMENTS.md` |
| Schema | `api/prisma/schema.prisma` |
| Seed / GACS data | `api/prisma/seed.ts` |
| Dev orchestration | `docker-compose.yml` |
| Prod orchestration | `docker-compose.prod.yml`, `deploy/nginx.conf`, `deploy/README.md` |
| API entry | `api/src/main.ts`, `api/src/app.module.ts` |
| Respondent UI routes | `ui/src/App.tsx` |
| Tenant admin routes | `reporting/src/App.tsx` |
| Platform admin routes | `monitoring/src/App.tsx` |
| Scoring + PDF | `ui/src/lib/pdf.ts` |
| Submission lifecycle | `api/src/app/usecase/submissions/submissions.usecase.ts` |
| Email verification (legacy) | `api/src/app/usecase/respondents/respondents.usecase.ts` |
| Auth | `api/src/app/usecase/auth/auth.usecase.ts`, `api/src/ui/controllers/auth.controller.ts` |

---

*Research date: 2026-08-13. All claims trace to files in this repository.*
