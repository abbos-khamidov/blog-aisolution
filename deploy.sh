#!/usr/bin/env bash
set -euo pipefail

npm ci
npm run build

# критично для standalone: статика не копируется автоматически
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

pm2 restart aisolution-blog --update-env
pm2 save
