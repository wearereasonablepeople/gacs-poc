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

## Production (Docker on the DigitalOcean droplet)

Deployed at **https://gacs.warp.land/** from the `simple` branch.

The droplet runs two containers via `docker-compose.prod.yml`:

- `gacs` — the app (static UI + API), only exposed inside the Docker network
- `gateway` — nginx terminating TLS with the existing Let's Encrypt certs
  (`/etc/letsencrypt/live/gacs.warp.land/`) and proxying everything to `gacs:4000`

SQLite is bind-mounted to a host directory (`GACS_DATA_DIR`, default
`/opt/gacs/data`) so submissions survive redeploys — back up that directory.

### Guided deploy

Run the wizard from your machine; it collects env values and walks through the
SSH deploy step by step:

```bash
./scripts/deploy-droplet.sh
```

### Manual deploy (on the droplet)

```bash
cd /opt/gacs/app            # repo checkout
git fetch origin && git checkout simple && git pull --ff-only origin simple
cp .env.example .env        # first time only; then edit real values
mkdir -p /opt/gacs/data
docker compose -f docker-compose.prod.yml up -d --build
```

If only `deploy/nginx.conf` changed:

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate gateway
```

## Mail template

Edit `server/templates/results-email.html` (placeholders `{{overallScore}}`, `{{advice}}`, etc.).

## Submissions

Stored in SQLite (`DATABASE_PATH`). No admin UI in v1 — inspect with any SQLite client. Delete rows/file manually for erasure.
