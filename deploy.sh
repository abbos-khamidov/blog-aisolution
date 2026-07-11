#!/usr/bin/env bash
set -euo pipefail

npm ci
npm run build

# критично для standalone: статика не копируется автоматически
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

pm2 restart aisolution-blog --update-env
pm2 save

# push notifications for posts published since the last deploy
npm run notify:new-posts
