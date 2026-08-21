# Features

Last updated: April 26, 2026

## Product Direction

The application is not only a listing-first ecommerce site. It also supports decision workflows that help shoppers finish a purchase with less confusion:

- build a shopping plan around a goal
- compare current and saved bundles
- invite others into a shared cart
- recover failed checkout attempts
- track order progress after payment
- record whether the purchase actually solved the customer's goal

## Customer Storefront

Public shopping features:

- home page with product/category discovery
- shop page with product listing, filtering, and search
- product detail page with images, variants, price, reviews, and add-to-cart action
- category browsing
- cart page with quantity changes, item removal, totals, and checkout entry
- support information pages:
  - shipping
  - returns
  - size guide
  - support
  - track order

Important frontend locations:

- `src/client/app/page.tsx`
- `src/client/app/(public)/(home)`
- `src/client/app/(public)/shop`
- `src/client/app/(public)/product`
- `src/client/app/(public)/cart`
- `src/client/app/(public)/track-order`

## Authentication

Supported account flows:

- sign up
- sign in
- sign out
- refresh token
- forgot password
- reset password
- user profile
- social login routes for Google, Facebook, and Twitter on the backend

Roles:

- `USER`
- `ADMIN`
- `SUPERADMIN`

Important files:

- `src/client/app/(auth)/sign-in/page.tsx`
- `src/client/app/(auth)/sign-up/page.tsx`
- `src/client/app/(auth)/password-reset/page.tsx`
- `src/client/app/store/apis/AuthApi.ts`
- `src/server/src/modules/auth`
- `src/server/src/shared/middlewares/protect.ts`
- `src/server/src/shared/middlewares/authorizeRole.ts`
- `src/server/src/shared/middlewares/authorizeRoleHierarchy.ts`

## Catalog and Products

Catalog capabilities:

- products
- categories
- attributes and attribute values
- product variants
- variant images
- stock levels
- low-stock thresholds
- restock history
- reviews and average ratings
- homepage sections for curated merchandising

Admin catalog features:

- create, update, and delete products
- upload product images
- manage product variants
- manage categories
- manage attributes and category assignments
- restock variants

Important files:

- `src/client/app/(private)/dashboard/products`
- `src/client/app/(private)/dashboard/categories`
- `src/client/app/(private)/dashboard/attributes`
- `src/client/app/(private)/dashboard/inventory`
- `src/server/src/modules/product`
- `src/server/src/modules/category`
- `src/server/src/modules/attribute`
- `src/server/src/modules/variant`
- `src/server/src/modules/review`

## Cart and Checkout

Cart features:

- view active cart
- add item to cart
- update item quantity
- remove item
- cart count
- merge carts

Checkout features:

- initiate Stripe checkout
- mark checkout failed
- mark checkout canceled
- retry checkout
- restore cart from a recovery state
- development fallback checkout
- support handoff when checkout fails

Important files:

- `src/client/app/(public)/cart/page.tsx`
- `src/client/app/(public)/cart/CartSummary.tsx`
- `src/client/app/store/apis/CartApi.ts`
- `src/client/app/store/apis/CheckoutApi.ts`
- `src/server/src/modules/cart`
- `src/server/src/modules/checkout`
- `src/server/src/modules/webhook`

## Orders and Payments

Order features:

- user order list
- order details
- order item summary
- order status display
- shipping address display
- public order lookup by tracking details
- admin transaction/order views

Payment features:

- payment records
- payment status handling
- checkout success, failure, and cancel pages
- Stripe webhook integration

Important files:

- `src/client/app/(private)/(user)/orders`
- `src/client/app/(private)/(payment)`
- `src/client/app/(private)/dashboard/transactions`
- `src/client/app/store/apis/OrderApi.ts`
- `src/server/src/modules/order`
- `src/server/src/modules/payment`
- `src/server/src/modules/transaction`

## Goal-Based Bundles

Goal bundles let a shopper assemble a complete plan instead of buying isolated products.

Capabilities:

- list shopping goals
- view a goal detail page
- fill a brief such as who it is for, occasion, deadline, style, must-haves, avoid list, and budget
- generate a curated bundle for the goal
- lock a step or item
- regenerate one weak step
- swap selected variants
- save/reopen bundles
- apply a bundle to cart
- share a bundle as a shared cart

Important files:

- `src/client/app/(public)/goals/page.tsx`
- `src/client/app/(public)/goals/[slug]/page.tsx`
- `src/client/app/store/apis/GoalApi.ts`
- `src/server/src/modules/goal`
- `src/server/prisma/schema.prisma` models: `GoalTemplate`, `GoalTemplateStep`, `GoalBundle`, `GoalBundleItem`

## Custom Bundle Builder

Custom bundles are for shoppers who already know the kinds of items they need.

Capabilities:

- enter a bundle name and freeform request
- add requested items with quantity, keywords, category names, priority, and item budget
- seed a draft from frequently bought bundle suggestions
- assemble a bundle from the requested item list
- lock items
- regenerate individual items
- copy bundle summary
- attach bundle to cart
- turn the bundle into a shared cart
- reopen saved custom bundle drafts

Important files:

- `src/client/app/(public)/bundles/page.tsx`
- `src/client/app/store/apis/GoalApi.ts`
- `src/server/src/modules/goal/goal.service.ts`

## Smart Bundle Comparison

Smart bundle comparison helps users choose between a current bundle and a saved bundle.

It compares:

- total price
- budget left
- items covered
- locked picks
- confidence
- brief coverage

It returns:

- metric-by-metric winner
- current wins count
- saved wins count
- ties count
- plain-language verdict
- standout notes, such as which bundle is cheaper or leaves more budget

Important files:

- `src/client/app/utils/smartBundleComparison.ts`
- `src/client/app/(public)/bundles/page.tsx`
- `src/client/app/(public)/goals/[slug]/page.tsx`

## Shared Carts

Shared cart features support collaborative shopping.

Capabilities:

- create shared cart
- open shared cart by invite code
- join as member
- update shared cart items
- remove items
- vote on items
- add notes
- send cart messages
- assign items to members
- update settings
- regenerate invite
- initiate shared checkout
- release checkout lock

Important files:

- `src/client/app/(public)/cart/share/[code]/page.tsx`
- `src/client/app/store/apis/SharedCartApi.ts`
- `src/server/src/modules/shared-cart`
- `src/server/prisma/schema.prisma` models beginning with `SharedCart`

## Shopping Help

The shopping help page gives the user a guided chat-like product assistance flow.

Capabilities:

- send a shopping message
- pass current page/context/cart context
- receive suggested actions or product guidance from the server-side assistant service

Important files:

- `src/client/app/(public)/assistant/page.tsx`
- `src/client/app/store/apis/ShoppingAssistantApi.ts`
- `src/server/src/modules/shopping-assistant`

## Post-Purchase Order Companion

The order companion turns the order detail page into a post-purchase support surface.

Capabilities:

- show care/setup/reorder/support tasks
- show warranty or care guide information when available
- create reminders
- start support handoff
- help the customer complete setup after delivery

Important files:

- `src/client/app/(private)/(user)/orders/OrderCompanionCard.tsx`
- `src/client/app/store/apis/OrderApi.ts`
- `src/server/src/modules/order/order.service.ts`
- `src/server/prisma/schema.prisma` models: `OrderCompanion`, `CompanionTask`, `ProductCareGuide`, `WarrantyInfo`, `OrderReminder`

## Goal Success Tracking

Goal success tracking records whether an order actually completed the shopper's goal.

Capabilities:

- fetch current goal success state for an order
- submit goal success check-in
- track stage check-ins:
  - delivery
  - setup
  - follow-up
- track each step as achieved, partial, missed, pending, or not applicable
- record reasons for failure or partial success
- create interventions such as support chat, reminder, care guide, exchange, missing step, or curation

Important files:

- `src/client/app/(private)/(user)/orders/GoalSuccessTrackerCard.tsx`
- `src/client/app/(private)/(user)/orders/[orderId]/page.tsx`
- `src/client/app/store/apis/OrderApi.ts`
- `src/server/src/modules/order/goalSuccess.helpers.ts`
- `src/server/src/modules/order/order.routes.ts`
- `src/server/src/modules/order/order.service.ts`
- `src/server/prisma/schema.prisma` models beginning with `GoalSuccess`

## Real-Time Chat and Support

Real-time support features:

- user/admin chat list
- chat detail
- send messages
- resolve/reopen chat
- Socket.IO event handling
- call UI components for connecting and in-progress states

Important files:

- `src/client/app/(private)/(chat)`
- `src/client/app/(private)/dashboard/chats/page.tsx`
- `src/server/src/modules/chat`
- `src/server/src/infra/socket/socket.ts`

## Admin Dashboard

Admin capabilities:

- analytics overview and charts
- users and admins
- products
- categories
- attributes
- inventory and restocks
- transactions
- reports
- logs
- support chats

Important files:

- `src/client/app/(private)/dashboard`
- `src/client/app/components/auth`
- `src/server/src/modules/analytics`
- `src/server/src/modules/reports`
- `src/server/src/modules/logs`

## Analytics and Reports

Analytics capabilities:

- revenue analytics
- order analytics
- product performance
- user analytics
- interaction analytics
- abandoned cart analytics
- search dashboard
- goal commerce analytics
- exports as CSV, XLSX, or PDF depending on server implementation

Important files:

- `src/client/app/(private)/dashboard/analytics`
- `src/client/app/store/apis/AnalyticsApi.ts`
- `src/client/app/store/apis/ReportsApi.ts`
- `src/server/src/modules/analytics`
- `src/server/src/modules/reports`
- `src/server/src/shared/utils/analytics`
- `src/server/src/shared/utils/export`
