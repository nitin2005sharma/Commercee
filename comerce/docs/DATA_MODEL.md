# Data Model

Last updated: April 26, 2026

The database schema is defined in:

- `src/server/prisma/schema.prisma`

The project uses Prisma with PostgreSQL.

## Main Domains

## Users and Auth

Models:

- `User`
- `Address`

Enums:

- `ROLE`

Purpose:

- users can be customers, admins, or superadmins
- users own orders, carts, addresses, reviews, reports, chats, goal bundles, shared cart memberships, and payments
- users can authenticate through password or social IDs

Important relationships:

- `User` has many `Order`
- `User` has many `Cart`
- `User` has many `Address`
- `User` has many `GoalBundle`
- `User` has many `SharedCartMember`

## Catalog

Models:

- `Product`
- `ProductVariant`
- `Category`
- `Attribute`
- `AttributeValue`
- `ProductVariantAttribute`
- `CategoryAttribute`
- `Review`
- `Section`

Enums:

- `SECTION_TYPE`

Purpose:

- products contain general product information
- variants contain SKU, price, stock, images, and attribute combinations
- categories organize products
- attributes and values support structured variant creation
- reviews feed product ratings
- sections power homepage/promo content

Important relationships:

- `Product` has many `ProductVariant`
- `Product` belongs to optional `Category`
- `ProductVariant` has many `ProductVariantAttribute`
- `Attribute` has many `AttributeValue`
- `Category` has many `CategoryAttribute`
- `Product` has many `Review`

## Inventory

Models:

- `StockMovement`
- `Restock`

Purpose:

- track stock changes
- store restock events
- show inventory history in the admin dashboard

Important relationships:

- `ProductVariant` has many `StockMovement`
- `ProductVariant` has many `Restock`

## Cart and Checkout

Models:

- `Cart`
- `CartItem`
- `CartEvent`
- `CheckoutAttempt`
- `CheckoutRecovery`

Enums:

- `CART_STATUS`
- `CART_EVENT`
- `CHECKOUT_ATTEMPT_STATUS`
- `CHECKOUT_RECOVERY_STATUS`

Purpose:

- store active and converted carts
- track item quantities
- record cart behavior
- record checkout attempts
- recover failed/canceled checkout sessions

Important relationships:

- `User` has many `Cart`
- `Cart` has many `CartItem`
- `CartItem` references `ProductVariant`
- `CheckoutAttempt` and `CheckoutRecovery` connect user/cart/checkout lifecycle

## Orders, Payments, Shipments, Transactions

Models:

- `Order`
- `OrderItem`
- `Payment`
- `Shipment`
- `Transaction`
- `OrderTrackingEvent`

Enums:

- `TRANSACTION_STATUS`
- `PAYMENT_STATUS`
- `ORDER_TRACKING_EVENT_SOURCE`

Purpose:

- represent completed purchases
- store purchased variants and quantities
- store payment records
- track shipment details
- expose transaction status to admin
- record order tracking timeline

Important relationships:

- `Order` belongs to `User`
- `Order` has many `OrderItem`
- `OrderItem` references `ProductVariant`
- `Order` has related `Payment`
- `Order` has related `Shipment`
- `Order` has tracking events

## Goal Templates and Bundles

Models:

- `GoalTemplate`
- `GoalTemplateStep`
- `GoalBundle`
- `GoalBundleItem`

Enums:

- `GOAL_BUNDLE_TYPE`

Purpose:

- goal templates define repeatable shopping plans
- goal steps define what the shopper needs to complete
- goal bundles store generated or custom product selections
- goal bundle items connect selected variants to goal/custom steps

Bundle types:

- `CURATED`
- `CUSTOM`
- `FREQUENT`

Important relationships:

- `GoalTemplate` has many `GoalTemplateStep`
- `GoalBundle` can belong to a goal template and user
- `GoalBundle` has many `GoalBundleItem`
- `GoalBundleItem` references a selected `ProductVariant`

## Goal Success Tracking

Models:

- `GoalSuccessCheckin`
- `GoalSuccessIntervention`
- `GoalSuccessStageCheckin`
- `GoalSuccessStepCheckin`

Enums:

- `GOAL_SUCCESS_STATUS`
- `GOAL_SUCCESS_REASON`
- `GOAL_SUCCESS_INTERVENTION_TYPE`
- `GOAL_SUCCESS_STAGE`
- `GOAL_STEP_SUCCESS_STATUS`

Purpose:

- records whether a customer achieved the goal after purchase
- stores reasons when the goal was partial or failed
- records stage progress across delivery, setup, and follow-up
- tracks each purchased step/item
- creates interventions such as reminders, support chat, exchange, or missing step follow-up

Important relationships:

- goal success belongs to an `Order`
- goal success can produce many interventions
- stage and step check-ins belong to the goal success record

## Order Companion

Models:

- `OrderCompanion`
- `CompanionTask`
- `ProductCareGuide`
- `WarrantyInfo`
- `OrderReminder`

Enums:

- `COMPANION_TASK_KIND`

Purpose:

- provide post-purchase setup, care, warranty, reorder, and support tasks
- show product care guides and warranty information
- let the user create reminders

Task kinds:

- `SETUP`
- `CARE`
- `WARRANTY`
- `REORDER`
- `SUPPORT`

## Shared Carts

Models:

- `SharedCart`
- `SharedCartMember`
- `SharedCartVote`
- `SharedCartNote`
- `SharedCartAssignment`
- `SharedCartActivity`

Enums:

- `SHARED_CART_MEMBER_ROLE`
- `SHARED_CART_VOTE_TYPE`
- `SHARED_CART_INVITE_MODE`
- `SHARED_CART_ASSIGNMENT_STATUS`
- `SHARED_CART_ACTIVITY_TYPE`

Purpose:

- allow multiple people to review or collaborate on a cart
- capture votes, notes, messages, item assignments, invite settings, and activity
- support shared checkout locking/release behavior

Important relationships:

- `SharedCart` has owner user
- `SharedCart` has members
- shared cart records can reference variants/items
- activities form a timeline of collaboration events

## Chat

Models:

- `Chat`
- `ChatMessage`

Enums:

- `CHAT_STATUS`

Purpose:

- store customer/admin support conversations
- support open and resolved chat state
- pair with Socket.IO for real-time messaging

## Analytics, Reports, and Logs

Models:

- `Interaction`
- `Report`
- `Log`

Purpose:

- interactions support analytics
- reports store generated report metadata/content
- logs store system log entries for admin inspection

## Schema Maintenance Notes

When changing the schema:

1. Edit `src/server/prisma/schema.prisma`.
2. Create a Prisma migration.
3. Update server services/repositories.
4. Update frontend API types and UI expectations.
5. Rebuild the server.
6. Verify affected flows manually.
