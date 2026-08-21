# Ecommerce Client

This is the Next.js frontend for the ecommerce platform.

It contains the public storefront, customer account pages, shopping help, goal/custom bundle flows, shared cart UI, real-time chat UI, and admin dashboard.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Redux Toolkit and RTK Query
- Apollo Client
- Socket.IO client
- Framer Motion
- ApexCharts
- Stripe.js

## Main App Areas

| Area | Path | Purpose |
| --- | --- | --- |
| Public storefront | `app/(public)` | Shop, product, cart, goals, bundles, assistant, support info |
| Auth | `app/(auth)` | Sign in, sign up, password reset |
| User pages | `app/(private)/(user)` | Orders, profile, order companion, goal success |
| Payments | `app/(private)/(payment)` | Success, failure, cancel states |
| Chat | `app/(private)/(chat)` | Real-time support chat and call UI |
| Admin dashboard | `app/(private)/dashboard` | Catalog, users, analytics, logs, reports, transactions |
| Components | `app/components` | Reusable UI, layout, feedback, auth guards |
| API layer | `app/store/apis` | RTK Query endpoints for backend REST APIs |
| Utilities | `app/utils` | Shared frontend helpers |
| GraphQL | `app/gql` | Apollo query documents |

## Important Routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage |
| `/shop` | Product listing and filters |
| `/product/[slug]` | Product detail |
| `/cart` | Shopping cart |
| `/cart/share/[code]` | Shared cart collaboration |
| `/goals` | Goal template listing |
| `/goals/[slug]` | Goal bundle builder |
| `/bundles` | Custom bundle builder |
| `/assistant` | Shopping help |
| `/track-order` | Public order lookup |
| `/orders` | User order list |
| `/orders/[orderId]` | Order detail, order companion, goal success tracking |
| `/dashboard` | Admin dashboard |

## Current Feature Highlights

- Smart bundle comparison in `app/utils/smartBundleComparison.ts`
- Goal bundle builder in `app/(public)/goals/[slug]/page.tsx`
- Custom bundle builder in `app/(public)/bundles/page.tsx`
- Shared cart collaboration in `app/(public)/cart/share/[code]/page.tsx`
- Order companion in `app/(private)/(user)/orders/OrderCompanionCard.tsx`
- Goal success tracking in `app/(private)/(user)/orders/GoalSuccessTrackerCard.tsx`
- Shopping help in `app/(public)/assistant/page.tsx`

## Environment

Use `.env.example` as the template.

Typical local values:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_API_URL_DEV=http://localhost:5000/api/v1
NEXT_PUBLIC_API_URL_PROD=http://localhost:5000/api/v1
NODE_ENV=development
```

Note: `app/utils/axiosInstance.ts` currently defaults to `http://localhost:5000/api/v1`.

## Commands

Install:

```powershell
npm install
```

Run development server:

```powershell
npm run dev
```

Use another port if needed:

```powershell
npm run dev -- -p 3001
```

Verify:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

Start production build:

```powershell
npm run start
```

## Test Accounts

After running the backend seed script:

| Role | Email | Password |
| --- | --- | --- |
| Superadmin | `superadmin@example.com` | `password123` |
| Admin | `admin@example.com` | `password123` |
| User | `user@example.com` | `password123` |

## Documentation

Project-level documentation:

- `../../docs/README.md`
- `../../docs/FEATURES.md`
- `../../docs/FILE_STRUCTURE.md`
- `../../docs/API_REFERENCE.md`

## Development Notes

- Put route-specific components near the route.
- Put reusable UI under `app/components`.
- Put backend calls in `app/store/apis`.
- Keep shared calculations in `app/utils`.
- Run `npx tsc --noEmit`, `npm run lint`, and `npm run build` before handing off frontend changes.
