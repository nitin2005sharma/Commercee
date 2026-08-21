# Ecommerce Server

This is the Express and Prisma backend for the ecommerce platform.

It powers authentication, catalog management, cart, checkout, orders, payments, shipment tracking, chat, shared carts, goal bundles, smart shopping workflows, analytics, reports, logs, and webhooks.

## Stack

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis-backed sessions/cache
- Socket.IO
- Apollo GraphQL
- Stripe
- Passport social auth
- Cloudinary
- Winston and Morgan
- Swagger

## Key Files

| Path | Purpose |
| --- | --- |
| `src/app.ts` | Creates the Express app, middleware stack, routes, Socket.IO, GraphQL, Swagger, and error handling |
| `src/server.ts` | Starts the HTTP server |
| `src/routes/v1/index.ts` | Mounts versioned REST modules |
| `src/modules` | Domain modules |
| `src/infra` | Database, Redis, Stripe, Socket.IO, Passport, Cloudinary, logging |
| `src/shared` | Shared middleware, errors, utils, templates, and types |
| `prisma/schema.prisma` | Database schema |
| `prisma/migrations` | Database migrations |
| `seeds/seed.ts` | Development seed data |

## Modules

| Module | Purpose |
| --- | --- |
| `address` | Customer addresses |
| `analytics` | Dashboard metrics, exports, GraphQL analytics |
| `attribute` | Product attributes and values |
| `auth` | Sign up, sign in, sign out, refresh token, password reset, social auth |
| `cart` | Active cart and cart items |
| `category` | Product categories |
| `chat` | Support chats and messages |
| `checkout` | Stripe checkout, recovery, retry, restore, failure/cancel handling |
| `goal` | Goal templates, curated bundles, custom bundles, frequent bundles |
| `logs` | System log access |
| `order` | Orders, tracking, companion, goal success, reminders |
| `payment` | Payment records |
| `product` | Products and product GraphQL |
| `reports` | Report generation |
| `review` | Product reviews |
| `section` | Homepage sections |
| `shared-cart` | Collaborative carts |
| `shipment` | Shipment tracking and courier provider layer |
| `shopping-assistant` | Shopping help endpoint |
| `transaction` | Transaction views/status updates |
| `user` | Users, admins, profiles |
| `variant` | Product variants, SKU lookup, restocks |
| `webhook` | Stripe webhook processing |

## REST API Mounts

Base path: `/api/v1`

```text
/users
/auth
/products
/transactions
/reviews
/categories
/cart
/checkout
/reports
/analytics
/logs
/orders
/shipment
/payments
/addresses
/sections
/attributes
/chat
/variants
/goals
/shared-carts
/shopping-assistant
```

Webhook path:

```text
/api/v1/webhook
```

## GraphQL and Realtime

GraphQL is configured in:

```text
src/graphql
```

Feature GraphQL resolvers live under module folders such as:

```text
src/modules/product/graphql
src/modules/transaction/graphql
src/modules/analytics/graphql
```

Socket.IO is configured in:

```text
src/infra/socket/socket.ts
```

It supports chat and real-time order/transaction style updates.

## Environment

Use `.env.example` as the template.

Important local variables:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/ss_commerce
NODE_ENV=development
PORT=5000
REDIS_URL=redis://localhost:6379
CLIENT_URL_DEV=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
ACCESS_TOKEN_SECRET=change-me
REFRESH_TOKEN_SECRET=change-me
SESSION_SECRET=change-me
COOKIE_SECRET=change-me
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
```

## Commands

Install:

```powershell
npm install
```

Generate Prisma client:

```powershell
npx prisma generate
```

Apply migrations locally:

```powershell
npx prisma migrate dev
```

Seed database:

```powershell
npm run seed
```

Run development server:

```powershell
npm run dev
```

Build:

```powershell
npm run build
```

Start compiled server:

```powershell
npm run start
```

## Local URLs

- API: `http://localhost:5000/api/v1`
- GraphQL: `http://localhost:5000/api/v1/graphql`
- Swagger: `http://localhost:5000/api-docs`
- Health: `http://localhost:5000/health`

## Data Model

The Prisma schema includes:

- users, addresses, auth roles
- products, variants, categories, attributes, reviews
- stock movements and restocks
- carts, cart events, checkout attempts, checkout recovery
- orders, order items, payments, shipments, transactions, tracking events
- goal templates, goal bundles, custom bundles, bundle items
- order companion, companion tasks, care guides, warranties, reminders
- goal success check-ins, stages, steps, and interventions
- shared carts, members, votes, notes, assignments, activity
- chats, messages, analytics, reports, logs

See `../../docs/DATA_MODEL.md` for the full explanation.

## Development Notes

- Make source edits in `src`, not `dist`.
- Add new feature routes in the relevant module and mount them in `src/routes/v1/index.ts`.
- Keep business logic in services and data access in repositories when the module already follows that pattern.
- Put shared middleware, errors, and utilities under `src/shared`.
- Run `npm run build` before handing off backend changes.
