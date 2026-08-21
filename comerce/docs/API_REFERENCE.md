# API Reference

Last updated: April 26, 2026

## Base URLs

Client-side API calls are generally made to:

- Development REST API: `http://localhost:5000/api/v1`
- Backend route mount: `/api/v1`
- Webhook route: `/api/v1/webhook`
- GraphQL: configured by `src/server/src/graphql`

The client RTK Query APIs live in:

- `src/client/app/store/apis`

The server route modules live in:

- `src/server/src/modules/*/*.routes.ts`
- `src/server/src/routes/v1/index.ts`

## REST Route Groups

Mounted in `src/server/src/routes/v1/index.ts`.

| Base Path | Server Module | Frontend API Slice |
| --- | --- | --- |
| `/users` | `modules/user` | `UserApi.ts` |
| `/auth` | `modules/auth` | `AuthApi.ts` |
| `/products` | `modules/product` | `ProductApi.ts` |
| `/transactions` | `modules/transaction` | `TransactionApi.ts` |
| `/reviews` | `modules/review` | `ReviewApi.ts` |
| `/categories` | `modules/category` | `CategoryApi.ts` |
| `/cart` | `modules/cart` | `CartApi.ts` |
| `/checkout` | `modules/checkout` | `CheckoutApi.ts` |
| `/reports` | `modules/reports` | `ReportsApi.ts` |
| `/analytics` | `modules/analytics` | `AnalyticsApi.ts` |
| `/logs` | `modules/logs` | `LogsApi.ts` |
| `/orders` | `modules/order` | `OrderApi.ts` |
| `/shipment` | `modules/shipment` | none dedicated in current client list |
| `/payments` | `modules/payment` | payment data is mainly reached through order/payment pages |
| `/addresses` | `modules/address` | address data is mainly used in account/checkout flows |
| `/sections` | `modules/section` | `SectionApi.ts` |
| `/attributes` | `modules/attribute` | `AttributeApi.ts` |
| `/chat` | `modules/chat` | `ChatApi.ts` |
| `/variants` | `modules/variant` | `VariantApi.ts` |
| `/goals` | `modules/goal` | `GoalApi.ts` |
| `/shared-carts` | `modules/shared-cart` | `SharedCartApi.ts` |
| `/shopping-assistant` | `modules/shopping-assistant` | `ShoppingAssistantApi.ts` |

## Auth Endpoints

Common endpoints:

- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `POST /auth/refresh-token`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/sign-out`
- `GET /auth/google`
- `GET /auth/facebook`
- `GET /auth/twitter`

Client file:

- `src/client/app/store/apis/AuthApi.ts`

Server files:

- `src/server/src/modules/auth/auth.routes.ts`
- `src/server/src/modules/auth/auth.controller.ts`
- `src/server/src/modules/auth/auth.service.ts`

## User Endpoints

Common endpoints:

- `GET /users`
- `GET /users/me`
- `GET /users/admins`
- `GET /users/profile/:id`
- `POST /users/admin`
- `PUT /users/:id`
- `DELETE /users/:id`

Client file:

- `src/client/app/store/apis/UserApi.ts`

## Product and Catalog Endpoints

Products:

- `GET /products`
- `GET /products/:id`
- `GET /products/slug/:slug`
- `POST /products`
- `POST /products/bulk`
- `PUT /products/:id`
- `DELETE /products/:id`

Categories:

- `GET /categories`
- `GET /categories/:id`
- `POST /categories`
- `DELETE /categories/:id`

Attributes:

- `GET /attributes`
- `GET /attributes/:id`
- `POST /attributes`
- `POST /attributes/value`
- `POST /attributes/assign-category`
- `DELETE /attributes/:id`
- `DELETE /attributes/value/:id`

Variants:

- `GET /variants`
- `GET /variants/:id`
- `GET /variants/sku/:sku`
- `GET /variants/:id/restock-history`
- `POST /variants`
- `PATCH /variants/:id`
- `POST /variants/:id/restock`
- `DELETE /variants/:id`

Reviews:

- `GET /reviews/:productId`
- `POST /reviews`
- `DELETE /reviews/:id`

Sections:

- `GET /sections`
- `GET /sections/hero`
- `GET /sections/promo`
- `GET /sections/benefits`
- `GET /sections/arrivals`
- `POST /sections`
- `PUT /sections/:type`
- `DELETE /sections/:type`

## Cart and Checkout Endpoints

Cart:

- `GET /cart`
- `GET /cart/count`
- `POST /cart`
- `PUT /cart/item/:itemId`
- `DELETE /cart/item/:itemId`
- `POST /cart/merge`

Checkout:

- `POST /checkout`
- `GET /checkout/recovery`
- `POST /checkout/retry`
- `POST /checkout/restore`
- `POST /checkout/dev-fallback`
- `POST /checkout/support-handoff`
- `POST /checkout/mark-failed`
- `POST /checkout/mark-canceled`

Webhook:

- `POST /webhook`

## Order Endpoints

Common endpoints:

- `GET /orders`
- `POST /orders/lookup`
- `GET /orders/user`
- `GET /orders/:orderId`
- `GET /orders/:orderId/companion`
- `GET /orders/:orderId/goal-success`
- `POST /orders/:orderId/goal-success`
- `POST /orders/:orderId/support-handoff`
- `POST /orders/:orderId/reminders`

Client file:

- `src/client/app/store/apis/OrderApi.ts`

Goal success tracking uses:

- `GET /orders/:orderId/goal-success`
- `POST /orders/:orderId/goal-success`

## Goal and Bundle Endpoints

Common endpoints:

- `GET /goals`
- `GET /goals/:slug`
- `POST /goals/assemble`
- `GET /goals/bundles`
- `GET /goals/bundles/frequent`
- `GET /goals/bundles/:bundleId`
- `POST /goals/bundles/:bundleId/apply`
- `POST /goals/bundles/:bundleId/share`
- `POST /goals/custom-bundles/assemble`

Client file:

- `src/client/app/store/apis/GoalApi.ts`

Used by:

- `/goals`
- `/goals/[slug]`
- `/bundles`

## Shared Cart Endpoints

Common endpoints:

- `POST /shared-carts`
- `GET /shared-carts/:code`
- `POST /shared-carts/:code/join`
- `POST /shared-carts/:code/items`
- `DELETE /shared-carts/:code/items/:itemId`
- `POST /shared-carts/:code/votes`
- `POST /shared-carts/:code/notes`
- `POST /shared-carts/:code/messages`
- `POST /shared-carts/:code/assignments`
- `PATCH /shared-carts/:code/settings`
- `POST /shared-carts/:code/regenerate-invite`
- `POST /shared-carts/:code/checkout`
- `POST /shared-carts/:code/checkout/release`

Client file:

- `src/client/app/store/apis/SharedCartApi.ts`

## Chat and Support Endpoints

Common endpoints:

- `GET /chat`
- `POST /chat`
- `GET /chat/user`
- `GET /chat/:id`
- `POST /chat/:chatId/message`
- `PATCH /chat/:chatId/status`

Client file:

- `src/client/app/store/apis/ChatApi.ts`

Real-time behavior is handled through Socket.IO in:

- `src/server/src/infra/socket/socket.ts`
- `src/client/app/(private)/(chat)`

## Shopping Help Endpoint

Endpoint:

- `POST /shopping-assistant/message`

Client file:

- `src/client/app/store/apis/ShoppingAssistantApi.ts`

Server files:

- `src/server/src/modules/shopping-assistant`

## Admin Analytics, Reports, Logs

Analytics:

- `POST /analytics/interactions`
- `GET /analytics/year-range`
- `GET /analytics/export`
- GraphQL analytics resolvers are also available.

Reports:

- `GET /reports/generate`

Logs:

- `GET /logs`
- `GET /logs/:id`
- `GET /logs/:level`
- `DELETE /logs/:id`
- `DELETE /logs`

## GraphQL

GraphQL is configured in:

- `src/server/src/graphql`

GraphQL feature modules include:

- `src/server/src/modules/product/graphql`
- `src/server/src/modules/transaction/graphql`
- `src/server/src/modules/analytics/graphql`

Client GraphQL files:

- `src/client/app/gql/Product.ts`
- `src/client/app/gql/Dashboard.ts`

## API Authentication Notes

Some routes use:

- `protect`: authenticated user required
- `optionalAuth`: route can read logged-in user but can also support guest-like behavior
- role guards: admin/superadmin restrictions

When adding endpoints, match the existing module pattern and decide whether the route should use `protect`, `optionalAuth`, or a role guard.
