# File Structure

Last updated: April 26, 2026

This document explains the important files and folders in the repository.

## Root

| Path | Purpose |
| --- | --- |
| `README.md` | Main project readme. |
| `APPLICATION_DOCUMENTATION.md` | Existing broad application documentation. |
| `PROJECT_STUDY_GUIDE.md` | Long study guide for understanding the project. |
| `FEATURE_STATUS_REPORT.md` | Existing feature status notes. |
| `FULL_STACK_ECOMMERCE_PROJECT_REPORT.md` | Existing project report. |
| `docs/` | Current structured documentation set. |
| `src/client` | Next.js frontend. |
| `src/server` | Express/Prisma backend. |
| `assets/` | Repository-level assets. |
| `collections/` | API/client collections if present. |
| `tools/` | Local tooling scripts if present. |

## Client Structure

Path: `src/client`

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Homepage route. |
| `app/layout.tsx` | Root app layout. |
| `app/ClientProviders.tsx` | Client-side providers such as Redux/Apollo where configured. |
| `app/(auth)` | Sign-in, sign-up, password reset routes. |
| `app/(public)` | Public storefront routes. |
| `app/(private)` | Authenticated routes for users, chat, payment, dashboard, and support. |
| `app/components` | Reusable UI components. |
| `app/hooks` | Reusable React hooks. |
| `app/store` | Redux store, slices, and RTK Query API slices. |
| `app/gql` | GraphQL queries used by the client. |
| `app/utils` | Client utilities. |
| `app/lib` | Constants and helper modules. |
| `next.config.ts` | Next.js configuration. |
| `tsconfig.json` | Client TypeScript settings. |
| `.env.example` | Client environment variable template. |

## Client Route Map

| Route | Path | Purpose |
| --- | --- | --- |
| `/` | `app/page.tsx` | Home storefront. |
| `/shop` | `app/(public)/shop/page.tsx` | Product listing/search/filtering. |
| `/product/[slug]` | `app/(public)/product/[slug]/page.tsx` | Product detail page. |
| `/cart` | `app/(public)/cart/page.tsx` | Shopping cart. |
| `/cart/share/[code]` | `app/(public)/cart/share/[code]/page.tsx` | Shared cart experience. |
| `/goals` | `app/(public)/goals/page.tsx` | Goal templates. |
| `/goals/[slug]` | `app/(public)/goals/[slug]/page.tsx` | Goal bundle builder. |
| `/bundles` | `app/(public)/bundles/page.tsx` | Custom bundle builder. |
| `/assistant` | `app/(public)/assistant/page.tsx` | Shopping help page. |
| `/track-order` | `app/(public)/track-order/page.tsx` | Public order tracking lookup. |
| `/shipping` | `app/(public)/shipping/page.tsx` | Shipping information. |
| `/returns` | `app/(public)/returns/page.tsx` | Returns information. |
| `/size-guide` | `app/(public)/size-guide/page.tsx` | Size guide. |
| `/support` | `app/(private)/support/page.tsx` | Authenticated support. |
| `/orders` | `app/(private)/(user)/orders/page.tsx` | User order list. |
| `/orders/[orderId]` | `app/(private)/(user)/orders/[orderId]/page.tsx` | Order detail, companion, goal success. |
| `/profile` | `app/(private)/(user)/profile/page.tsx` | User profile. |
| `/dashboard` | `app/(private)/dashboard/page.tsx` | Admin dashboard home. |
| `/dashboard/products` | `app/(private)/dashboard/products/page.tsx` | Product management. |
| `/dashboard/products/[id]` | `app/(private)/dashboard/products/[id]/page.tsx` | Product edit/detail. |
| `/dashboard/categories` | `app/(private)/dashboard/categories/page.tsx` | Category management. |
| `/dashboard/attributes` | `app/(private)/dashboard/attributes/page.tsx` | Attribute management. |
| `/dashboard/inventory` | `app/(private)/dashboard/inventory/page.tsx` | Inventory/restock management. |
| `/dashboard/transactions` | `app/(private)/dashboard/transactions/page.tsx` | Transaction and order management. |
| `/dashboard/analytics` | `app/(private)/dashboard/analytics/page.tsx` | Analytics dashboard. |
| `/dashboard/reports` | `app/(private)/dashboard/reports/page.tsx` | Report generation. |
| `/dashboard/logs` | `app/(private)/dashboard/logs/page.tsx` | System logs. |
| `/dashboard/logs/[logId]` | `app/(private)/dashboard/logs/[logId]/page.tsx` | Log detail. |
| `/dashboard/chats` | `app/(private)/dashboard/chats/page.tsx` | Support chat inbox. |
| `/dashboard/users` | `app/(private)/dashboard/users/page.tsx` | User/admin management. |
| `/sign-in` | `app/(auth)/sign-in/page.tsx` | Login. |
| `/sign-up` | `app/(auth)/sign-up/page.tsx` | Registration. |
| `/password-reset` | `app/(auth)/password-reset/page.tsx` | Request reset email. |
| `/password-reset/[token]` | `app/(auth)/password-reset/[token]/page.tsx` | Reset password form. |
| `/payment-success` | `app/(private)/(payment)/payment-success/page.tsx` | Payment success. |
| `/success` | `app/(public)/success/page.tsx` | Success state. |
| `/failure` | `app/(private)/(payment)/failure/page.tsx` | Payment failure. |
| `/cancel` | `app/(private)/(payment)/cancel/page.tsx` | Payment cancel. |

## Client API Files

| File | Purpose |
| --- | --- |
| `AnalyticsApi.ts` | Analytics REST endpoints. |
| `AttributeApi.ts` | Product attribute endpoints. |
| `AuthApi.ts` | Sign-in, sign-up, sign-out, password reset, refresh token. |
| `CartApi.ts` | Cart read/update endpoints. |
| `CategoryApi.ts` | Category CRUD and category attributes. |
| `ChatApi.ts` | Support chat endpoints. |
| `CheckoutApi.ts` | Checkout, recovery, retry, restore, failure/cancel support. |
| `GoalApi.ts` | Goals, goal bundles, custom bundles, frequent bundles, sharing/applying bundles. |
| `LogsApi.ts` | Admin logs endpoints. |
| `OrderApi.ts` | Orders, tracking, companion, goal success, reminders. |
| `ProductApi.ts` | Product listing and product CRUD. |
| `ReportsApi.ts` | Report export/generation. |
| `ReviewApi.ts` | Product reviews. |
| `SectionApi.ts` | Homepage/marketing sections. |
| `SharedCartApi.ts` | Shared cart collaboration endpoints. |
| `ShoppingAssistantApi.ts` | Shopping help message endpoint. |
| `TransactionApi.ts` | Transactions and status updates. |
| `UserApi.ts` | User, admin, and profile endpoints. |
| `VariantApi.ts` | Variants, SKU lookup, restocks. |

## Important Client Utilities

| File | Purpose |
| --- | --- |
| `app/utils/smartBundleComparison.ts` | Shared logic for comparing current and saved bundles. |
| `app/utils/axiosInstance.ts` | Axios instance using `http://localhost:5000/api/v1`. |
| `app/utils/orderTracking.ts` | Order tracking helpers. |
| `app/utils/inventory.ts` | Inventory helpers. |
| `app/utils/placeholderImage.ts` | Safe placeholder image handling. |
| `app/components/atoms/SafeImage.tsx` | Image rendering wrapper. |

## Server Structure

Path: `src/server`

| Path | Purpose |
| --- | --- |
| `src/app.ts` | Express app creation and middleware setup. |
| `src/server.ts` | Server startup. |
| `src/routes` | Root, health, and versioned REST route mounting. |
| `src/modules` | Domain modules. |
| `src/graphql` | Apollo GraphQL setup. |
| `src/infra` | Infrastructure adapters: database, cache, payment, socket, logging, Passport, Cloudinary. |
| `src/shared` | Shared errors, middleware, utils, templates, and types. |
| `src/docs/swagger.ts` | Swagger setup. |
| `prisma/schema.prisma` | Database schema. |
| `prisma/migrations` | Prisma migrations. |
| `.env.example` | Server environment variable template. |
| `dist` | Compiled JavaScript output from `npm run build`. |

## Server Module Map

| Module | Purpose |
| --- | --- |
| `address` | User shipping/billing addresses. |
| `analytics` | Dashboard metrics, exports, and GraphQL analytics resolvers. |
| `attribute` | Product attributes and attribute values. |
| `auth` | Sign-up, sign-in, refresh token, password reset, social auth. |
| `cart` | Cart and cart items. |
| `category` | Product categories. |
| `chat` | Support chat and messages. |
| `checkout` | Stripe checkout, checkout recovery, support handoff. |
| `goal` | Goal templates, curated bundles, custom bundles, frequent bundles. |
| `logs` | System logs. |
| `order` | Orders, tracking, companion, goal success, reminders. |
| `payment` | Payment records. |
| `product` | Products and product GraphQL resolvers. |
| `reports` | Report generation/export. |
| `review` | Product reviews. |
| `section` | Homepage sections. |
| `shared-cart` | Shared cart collaboration. |
| `shipment` | Shipment tracking and courier integration layer. |
| `shopping-assistant` | Shopping help endpoint/service. |
| `transaction` | Transaction records and status updates. |
| `user` | Users, admins, profiles. |
| `variant` | Product variants, restocks, SKU lookup. |
| `webhook` | Stripe webhook handling. |

## Typical Server Module Pattern

Most modules use:

- `*.routes.ts`: Express route definitions.
- `*.controller.ts`: request/response handlers.
- `*.service.ts`: business logic.
- `*.repository.ts`: data access layer where present.
- `*.dto.ts`: validation/input DTOs where present.
- `*.factory.ts`: object/response creation helpers where present.
- `*.types.ts`: module-specific TypeScript types where present.

Not every module has every file. Smaller modules may only need routes, controller, and service.
