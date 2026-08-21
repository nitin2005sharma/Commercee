# Full-Stack Ecommerce Platform

This project is a full-stack ecommerce application with a Next.js storefront, an Express and Prisma backend, PostgreSQL data storage, Stripe checkout, real-time support, shared-cart collaboration, guided bundle building, and post-purchase success tracking.

The current product direction is not only "browse products and buy." It adds workflows that help a shopper finish a real shopping task: build a bundle, compare choices, collaborate with other people, recover checkout, track delivery, and confirm whether the purchase solved the goal.

## Documentation

The complete structured documentation lives in [docs/README.md](./docs/README.md).

- [Features](./docs/FEATURES.md): complete feature guide
- [Architecture](./docs/ARCHITECTURE.md): frontend, backend, data, API, and integrations
- [File Structure](./docs/FILE_STRUCTURE.md): route, module, and important file map
- [API Reference](./docs/API_REFERENCE.md): REST, GraphQL, RTK Query, and Socket.IO reference
- [Data Model](./docs/DATA_MODEL.md): Prisma models, enums, and relationships
- [Runbook](./docs/RUNBOOK.md): setup, commands, verification, and troubleshooting

## What The App Includes

- Customer storefront with home, shop, product detail, cart, support pages, and tracking
- Authentication with user/admin/superadmin roles
- Product catalog with categories, attributes, variants, images, stock, restocks, and reviews
- Stripe checkout with checkout recovery and support handoff
- Orders, payments, shipments, transactions, and public order lookup
- Goal-based bundle builder for shopping plans
- Custom bundle builder for user-defined item lists
- Smart bundle comparison between current and saved bundles
- Shared carts with votes, notes, item assignments, messages, invite settings, and checkout locking
- Shopping help page backed by a server-side assistant module
- Order companion with setup, care, warranty, reorder, support, and reminders
- Goal success tracking after purchase
- Real-time support chat with Socket.IO and call UI pieces
- Admin dashboard for products, categories, attributes, inventory, users, logs, reports, chats, analytics, and transactions

## Tech Stack

| Area | Stack |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Client data | Redux Toolkit, RTK Query, Apollo Client |
| Realtime | Socket.IO |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL with Prisma |
| Payments | Stripe |
| Sessions/cache | Redis |
| Auth | JWT, sessions, Passport social auth |
| Files/images | Cloudinary integration |
| Observability | Winston, Morgan, logs dashboard |
| Docs/API | Swagger and GraphQL |

## Project Structure

```text
ecommerce/
|-- docs/                         # Current structured documentation
|-- assets/seed-images/           # Optional seed images
|-- src/
|   |-- client/                   # Next.js frontend
|   |   |-- app/
|   |   |-- public/
|   |   |-- package.json
|   |   `-- README.md
|   `-- server/                   # Express/Prisma backend
|       |-- prisma/
|       |-- seeds/
|       |-- src/
|       |   |-- infra/
|       |   |-- modules/
|       |   |-- routes/
|       |   `-- shared/
|       |-- package.json
|       `-- README.md
|-- README.md
`-- package.json
```

## Main Frontend Routes

| Route | Purpose |
| --- | --- |
| `/` | Home storefront |
| `/shop` | Product listing, filtering, and discovery |
| `/product/[slug]` | Product detail |
| `/cart` | Cart and checkout entry |
| `/cart/share/[code]` | Shared cart collaboration |
| `/goals` | Shopping goal templates |
| `/goals/[slug]` | Goal bundle builder and comparison |
| `/bundles` | Custom bundle builder and comparison |
| `/assistant` | Shopping help |
| `/track-order` | Public order lookup |
| `/orders` and `/orders/[orderId]` | User orders, companion, and goal success |
| `/dashboard/*` | Admin dashboard |

## Main Backend Modules

The backend modules live in `src/server/src/modules`.

```text
address, analytics, attribute, auth, cart, category, chat, checkout,
goal, logs, order, payment, product, reports, review, section,
shared-cart, shipment, shopping-assistant, transaction, user, variant, webhook
```

## Local Setup

Install dependencies:

```powershell
npm install
Set-Location .\src\server
npm install
Set-Location ..\client
npm install
Set-Location ..\..
```

Create environment files from:

- `src/client/.env.example`
- `src/server/.env.example`

Run database setup:

```powershell
Set-Location .\src\server
npx prisma generate
npx prisma migrate dev
npm run seed
```

Start backend:

```powershell
Set-Location .\src\server
npm run dev
```

Start frontend:

```powershell
Set-Location .\src\client
npm run dev
```

## Local URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api/v1`
- GraphQL: `http://localhost:5000/api/v1/graphql`
- Swagger: `http://localhost:5000/api-docs`
- Health check: `http://localhost:5000/health`

## Test Accounts

After running the seeder:

| Role | Email | Password |
| --- | --- | --- |
| Superadmin | `superadmin@example.com` | `password123` |
| Admin | `admin@example.com` | `password123` |
| User | `user@example.com` | `password123` |

## Verification

Client:

```powershell
Set-Location .\src\client
npx tsc --noEmit
npm run lint
npm run build
```

Server:

```powershell
Set-Location .\src\server
npm run build
```

## Notes

- Make source changes in `src/server/src`, not `src/server/dist`.
- The client API layer is in `src/client/app/store/apis`.
- The Prisma schema is `src/server/prisma/schema.prisma`.
- Some flows need external credentials: Stripe, Redis, Cloudinary, SMTP, and social auth providers.
- Older root documents are still present for study/report context, but the `docs/` folder is the current organized reference.
