# Runbook

Last updated: April 26, 2026

## Prerequisites

Install:

- Node.js compatible with Next.js 15 and the server dependencies
- npm
- PostgreSQL
- Redis
- Stripe account/CLI for webhook testing if checkout webhooks are tested locally
- Cloudinary account if image upload is tested

## Install Dependencies

From the repository root:

```bash
npm install
```

Client:

```bash
cd src/client
npm install
```

Server:

```bash
cd src/server
npm install
```

## Environment Variables

Client template:

- `src/client/.env.example`

Important client variables:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_URL_DEV`
- `NEXT_PUBLIC_API_URL_PROD`
- `NODE_ENV`

Server template:

- `src/server/.env.example`

Important server variables:

- `DATABASE_URL`
- `PORT`
- `NODE_ENV`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `SESSION_SECRET`
- `COOKIE_SECRET`
- `COOKIE_DOMAIN`
- `ALLOWED_ORIGINS`
- `STRIPE_PUBLIC_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `REDIS_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `TWITTER_CONSUMER_KEY`
- `TWITTER_CONSUMER_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLIENT_URL_DEV`
- `CLIENT_URL_PROD`

## Database

The Prisma schema is:

```bash
src/server/prisma/schema.prisma
```

Typical setup:

```bash
cd src/server
npx prisma generate
npx prisma migrate dev
```

Seed if needed:

```bash
cd src/server
npm run seed
```

## Run Locally

Start backend:

```bash
cd src/server
npm run dev
```

Default expected backend URL:

```text
http://localhost:5000/api/v1
```

Start frontend:

```bash
cd src/client
npm run dev
```

Default frontend URL:

```text
http://localhost:3000
```

If port 3000 is busy, run:

```bash
npm run dev -- -p 3001
```

## Build

Client:

```bash
cd src/client
npx tsc --noEmit
npm run lint
npm run build
```

Server:

```bash
cd src/server
npm run build
```

## Verification Checklist

Use this after feature work:

- client TypeScript passes
- client lint passes
- client build passes
- server build passes
- auth still works
- product listing loads
- product detail loads
- cart count and cart page work
- checkout can be initiated
- admin dashboard route guards still work
- goal bundle assembly works
- custom bundle assembly works
- smart bundle comparison panel appears after choosing a saved bundle
- shared cart page loads by code
- order detail loads
- goal success tracking can fetch and submit check-ins

## Common Troubleshooting

### Client Cannot Reach Server

Check:

- backend is running
- `src/client/app/utils/axiosInstance.ts` points to the intended base URL
- CORS allows the frontend origin
- cookies are sent with credentials

### Auth Cookies Do Not Persist

Check:

- backend `COOKIE_SECRET`
- `SESSION_SECRET`
- `COOKIE_DOMAIN`
- browser same-site/security settings
- HTTP vs HTTPS in production
- CORS `credentials: true`

### Prisma Errors

Check:

- `DATABASE_URL`
- database is reachable
- migrations are applied
- Prisma client is generated

Run:

```bash
cd src/server
npx prisma generate
npx prisma migrate status
```

### Stripe Webhook Fails

Check:

- webhook route is using raw body before JSON middleware
- `STRIPE_WEBHOOK_SECRET`
- event forwarding URL
- Stripe CLI session

Webhook route is configured before normal JSON parsing in:

- `src/server/src/app.ts`

### Build Fails From Stale Next Cache

If a Next.js build fails because of stale generated cache, delete only the generated `.next` folder in `src/client`, then rebuild.

PowerShell safe cleanup:

```powershell
cd src/client
$target = Resolve-Path .next -ErrorAction SilentlyContinue
if ($target) {
  if ($target.Path -like (Join-Path (Get-Location).Path '*')) {
    Remove-Item -LiteralPath $target.Path -Recurse -Force
  } else {
    throw "Refusing to remove unexpected path $($target.Path)"
  }
}
npm run build
```

## Development Rules

When adding a frontend feature:

- put route-specific components near the route if they are not shared
- put reusable UI in `app/components`
- put API calls in `app/store/apis`
- keep business calculations in utilities when shared across pages

When adding a backend feature:

- add a module under `src/server/src/modules`
- follow the routes/controller/service/repository pattern
- update `src/server/src/routes/v1/index.ts`
- add Prisma models/migrations if persistent data is needed
- update docs and client API slices

## Manual QA Paths

Customer:

- `/`
- `/shop`
- `/product/[slug]`
- `/cart`
- `/goals`
- `/goals/[slug]`
- `/bundles`
- `/assistant`
- `/track-order`
- `/orders`
- `/orders/[orderId]`

Admin:

- `/dashboard`
- `/dashboard/products`
- `/dashboard/categories`
- `/dashboard/attributes`
- `/dashboard/inventory`
- `/dashboard/transactions`
- `/dashboard/analytics`
- `/dashboard/reports`
- `/dashboard/logs`
- `/dashboard/chats`
- `/dashboard/users`
