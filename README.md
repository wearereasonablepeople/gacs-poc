# GACS Checker (simple)

Single-purpose GACS compliance checklist: hardcoded RVO control points, submit with email, results by mail, SQLite log. No CMS / multi-tenant admin.

See `CONTEXT.md` and `docs/adr/` for product decisions.

## Stack

- `web/` — Vite + React (respondent UI)
- `server/` — Hono + SQLite + Nodemailer (Gmail app password)
- `shared/` — checklist data + scoring

## Local development

```bash
cp .env.example .env
# fill SMTP_USER, SMTP_APP_PASSWORD, PROVIDER_*, optional BCC_EMAIL / REPLY_TO

npm install
npm run dev:server   # :4000
npm run dev:web      # :5173 (proxies /api → :4000)
```

Open http://localhost:5173

## Production (Docker on droplet)

```bash
cp .env.example .env   # set real values; PUBLIC_WEB_ORIGIN=https://your.domain
docker compose up -d --build
```

App listens on port 4000 (static UI + API). Point nginx at it.

## Mail template

Edit `server/templates/results-email.html` (placeholders `{{overallScore}}`, `{{advice}}`, etc.).

## Submissions

Stored in SQLite (`DATABASE_PATH`). No admin UI in v1 — inspect with any SQLite client. Delete rows/file manually for erasure.
