#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

cd admin-src
npm ci
npm run build
cd ..

rm -rf admin
cp -r admin-src/dist admin

echo "Built admin-src/dist -> admin/. Commit and push, then 'git pull' on the server."
