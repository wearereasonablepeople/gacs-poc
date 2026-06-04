# Production deploy (DigitalOcean droplet)

Exposes only **port 80**: respondent UI at `/`, API at `/api/`.

## Prerequisites

- Ubuntu 24.04 droplet, 2 GB+ RAM
- Firewall: TCP **22** (SSH) and **80** (HTTP) only
- Docker and Docker Compose v2
- Private repo: [GitHub deploy key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys)

## First deploy

```bash
git clone git@github.com:ORG/gacs.git
cd gacs
cp .env.production.example .env
# Edit .env: YOUR_DROPLET_IP, POSTGRES_PASSWORD, SESSION_SECRET, SMTP_*

docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api npm run seed
```

Open: `http://YOUR_DROPLET_IP/croonwolterdros/gacs-compliance-check`

Change default seed passwords after first login (if you later expose reporting).

## Updates

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

If only [`nginx.conf`](nginx.conf) changed (no app rebuild needed):

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate gateway
```

Rebuild is required when `API_URL` changes (UI embeds `VITE_API_URL` at build time).

## Troubleshooting

### Gateway keeps restarting (`host not found in upstream "api"`)

Ensure [`nginx.conf`](nginx.conf) uses Docker DNS (`resolver 127.0.0.11`) and variable `proxy_pass` (see repo version). Then:

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate gateway
```

### White page + console MIME error on `/assets/*.js`

The browser loads `index.html` but JS bundles return HTML. Usually nginx was proxying all paths to `/` on the UI container. Pull the latest `deploy/nginx.conf` (uses `proxy_pass $backend$request_uri`), then:

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate gateway
```

Hard-refresh the browser. In DevTools, `/assets/index-*.js` should be **200** with a JavaScript content type.

### Port 80 already in use

```bash
sudo ss -tlnp | grep ':80 '
sudo systemctl stop nginx   # if system nginx is running
docker compose -f docker-compose.prod.yml up -d gateway
```

## Files

| File | Role |
|------|------|
| [`../docker-compose.prod.yml`](../docker-compose.prod.yml) | postgres, api, ui, nginx gateway |
| [`nginx.conf`](nginx.conf) | Proxy `/` → ui, `/api/` → api |
| [`api-entrypoint.sh`](api-entrypoint.sh) | Reference copy; image uses [`../api/docker-entrypoint.sh`](../api/docker-entrypoint.sh) |

## Optional API debug (SSH only)

Uncomment in `docker-compose.prod.yml` under `api`:

```yaml
ports:
  - "127.0.0.1:4000:4000"
```

Then on the server: `curl http://127.0.0.1:4000/api/...`
