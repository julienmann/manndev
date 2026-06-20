#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

cd portal-src
npm ci
npm run build
cd ..

rm -rf portal
cp -r portal-src/dist portal

echo "Built portal-src/dist -> portal/. Commit and push, then 'git pull' on the server."
