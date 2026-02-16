#!/bin/sh
set -e

# ─── Install dependencies if node_modules is empty or missing ───
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "📦 node_modules not found — running npm install..."
  npm install
else
  echo "✅ node_modules found — skipping install"
fi

# ─── Execute the CMD passed to the container ────────────────────
exec "$@"
