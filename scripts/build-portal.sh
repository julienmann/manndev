#!/usr/bin/env bash
# Rebuilds the client portal into portal/ (vite.config.ts sets the output dir).
set -euo pipefail
cd "$(dirname "$0")/../portal-src"
npm ci
npm run build
echo "Built portal/. Commit and push, then 'git pull' on the server."
