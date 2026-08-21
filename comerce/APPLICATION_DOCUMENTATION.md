# Application Documentation

## 1. What This Application Does

This project is a full-stack e-commerce platform with a customer storefront, an admin dashboard, real-time support, collaborative shopping, and post-purchase support flows.

At a high level, the application lets:

- customers browse products, manage carts, place orders, and track their purchase journey
- admins manage catalog data, users, orders, inventory, analytics, logs, and support conversations
- teams support richer commerce flows such as shared carts, goal-based product bundles, checkout recovery, and order companions

The codebase is split into:

- `src/client`: a Next.js frontend
- `src/server`: an Express + Prisma backend

## 2. Core Functional Areas

### 2.1 Customer Storefront

The public storefront includes:

- home page
- shop listing page
- product detail pages
- cart page
- shared cart page
- goals pages
- support information pages such as shipping, returns, size guide, and track order

Main customer-facing capabilities:

- browse products and categories
- filter and search catalog data
- view product variants, pricing, images, and reviews
- add items to cart
- complete checkout
- view checkout success, failure, and cancel states
- access post-purchase order details

### 2.2 Authentication and User Access

The application supports both standard and social authentication flows.

Available auth capabilities in the backend:

- sign up
- sign in
- sign out
- refresh token flow
- forgot password
- reset password
- Google login
- Facebook login
- Twitter login

The system also supports role-based access control with these roles:

- `USER`
- `ADMIN`
- `SUPERADMIN`

### 2.3 Product Catalog and Inventory

The platform includes a structured product catalog with:

- products
- categories
- attributes
- attribute values
- product variants
- stock and restock tracking
- product reviews
- promotional/homepage sections

Catalog functionality includes:

- product CRUD for admins
- category management
- attribute-driven variant combinations
- stock quantity tracking
- review aggregation and ratings
- featured, trending, bestseller, and new product flags

### 2.4 Cart and Checkout

The application supports shopping cart and payment flows for authenticated and guest-like sessions.

Capabilities include:

- persistent carts
- cart item quantity updates
- checkout initiation
- Stripe-based checkout session creation
- checkout failure and cancellation tracking
- checkout recovery
- cart restoration after interrupted checkout
- development fallback checkout flow
- support handoff when checkout fails

This is more advanced than a basic cart because the backend also records:

- cart events
- checkout attempts
- checkout recovery records

### 2.5 Orders, Payments, and Post-Purchase Support

Once checkout succeeds, the application supports:

- order creation
- order item storage
- payment records
- shipment records
- transaction status tracking
- order reminders
- order companion experiences

The "order companion" feature appears to be a post-purchase guidance layer that can include:

- setup tasks
- care instructions
- warranty information
- reorder suggestions
- support touchpoints

This makes the application more than a basic store; it also supports retention and after-sales engagement.

### 2.6 Shared Cart Collaboration

One of the stronger custom features in this codebase is collaborative shopping through shared carts.

Users can:

- create a shared cart
- join a shared cart using a share code
- add or update shared cart items
- remove items
- vote on items
- leave notes on items or the cart

This feature is real-time enabled through Socket.IO events, so multiple participants can see updates as collaboration happens.

### 2.7 Goal-Based Bundle Builder

Another custom feature is the goals flow.

This lets users select a goal template such as:

- WFH desk setup
- travel outfit
- gaming starter pack

The backend then assembles a recommended bundle using:

- category matching
- product keyword fallback matching
- budget allocation per step
- in-stock variant selection

This is essentially a guided shopping or bundle recommendation workflow.

### 2.8 Support, Chat, and Real-Time Communication

The platform includes real-time communication features for customer support.

Capabilities include:

- chat threads between users and support/admin
- persisted chat messages
- real-time message updates with Socket.IO
- room-based chat sessions
- WebRTC call signaling for audio/video support flows

Socket rooms are used for:

- chat rooms
- admin room
- user order updates
- shared cart rooms

### 2.9 Admin Dashboard

The protected dashboard includes sections for:

- analytics
- attributes
- categories
- chats
- inventory
- logs
- products
- reports
- transactions
- users

This gives admins operational control over:

- catalog management
- customer support
- order visibility
- inventory visibility
- analytics and reporting
- system log review

### 2.10 Analytics and Reports

The backend has dedicated analytics and reports modules, and the frontend uses both REST and GraphQL to surface metrics.

Analytics capabilities include:

- dashboard summaries
- revenue-oriented metrics
- order analytics
- interaction analytics
- user analytics
- product performance analytics
- search/dashboard trend style data

Reports functionality includes export-oriented workflows and stored report metadata.

### 2.11 API and Platform Support

The backend exposes:

- REST endpoints under `/api/v1`
- GraphQL endpoint under `/api/v1/graphql`
- Swagger documentation under `/api-docs`
- health endpoints such as `/health`, `/health/detailed`, `/ready`, and `/live`

This makes the platform usable by both the web frontend and external tools or future clients.

## 3. Main User Journeys

### 3.1 Shopper Journey

1. Browse products from the storefront.
2. View product details and variants.
3. Add products to the cart.
4. Start checkout.
5. Complete payment through Stripe.
6. View order history and order details.
7. Use order reminders, companion tasks, or support if needed.

### 3.2 Collaborative Shopping Journey

1. Logged-in user creates a shared cart.
2. Share code is sent to collaborators.
3. Collaborators join the shared cart.
4. Participants add items, vote, and leave notes.
5. Owner or user proceeds to checkout.

### 3.3 Guided Goal Journey

1. User opens a goal template.
2. User optionally chooses a budget.
3. Backend assembles a bundle from suitable in-stock products.
4. User reviews the recommended bundle and can continue shopping from it.

### 3.4 Admin Journey

1. Admin signs in.
2. Admin accesses the dashboard.
3. Admin manages products, categories, attributes, and inventory.
4. Admin reviews orders, transactions, analytics, reports, and logs.
5. Admin responds to customer chats and support flows.

## 4. Technology Stack

### 4.1 Frontend Technologies

- `Next.js 15` for the React application and routing
- `React 19` for UI composition
- `TypeScript` for typed frontend code
- `Tailwind CSS 4` for styling
- `Redux Toolkit` and `RTK Query` for client state and REST API access
- `Apollo Client` for GraphQL queries and caching
- `Framer Motion` for UI animation
- `ApexCharts` for charting and dashboard visuals
- `React Hook Form` for forms
- `Zod` for schema-style validation
- `Socket.IO Client` for real-time updates
- `Stripe.js` for payment flow integration on the frontend

### 4.2 Backend Technologies

- `Node.js` runtime
- `Express` for REST APIs and middleware composition
- `TypeScript` for typed backend code
- `Prisma ORM` for database access
- `Apollo Server` for GraphQL
- `Socket.IO` for real-time communication
- `Passport` for social authentication strategies
- `JWT` and cookie-based auth flow for access/refresh token handling
- `Winston` for logging
- `Swagger` via `swagger-jsdoc` and `swagger-ui-express` for API docs

### 4.3 Data and Persistence

- `PostgreSQL` as the primary relational database
- `Prisma schema + migrations` for database modeling
- `Redis` for caching/session support

Key persisted domains include:

- users
- products and variants
- categories and attributes
- carts and cart events
- checkout attempts and recovery
- orders, payments, shipments, and transactions
- chats and messages
- reports and logs
- goal templates and goal bundles
- shared carts, members, votes, and notes

### 4.4 External Services and Integrations

- `Stripe` for checkout and payment events
- `Cloudinary` for media/image hosting
- `Google OAuth`
- `Facebook OAuth`
- `Twitter OAuth`

### 4.5 Real-Time and Communication

- `Socket.IO` for live updates
- WebRTC signaling over sockets for call setup

### 4.6 Development and Ops

- `npm` for package management
- `Nodemon` for backend development reloads
- `Next.js` dev/build/start workflow for the frontend
- `Docker` and Dockerfiles in both client and server for containerized environments
- `Husky` and `Commitlint` at the repo level for commit quality workflow

## 5. Architecture Summary

The overall architecture looks like this:

1. The frontend renders the storefront, bundle builders, shared carts, user order pages, support chat, and admin dashboard in Next.js.
2. REST requests are handled with RTK Query API slices in `src/client/app/store/apis`.
3. GraphQL queries are handled with Apollo Client for dashboard/catalog analytics areas.
4. The Express backend serves business logic for catalog, cart, checkout, orders, goals, shared carts, support, analytics, and admin operations.
5. Prisma reads and writes PostgreSQL data for users, catalog, carts, orders, payments, goal bundles, shared carts, companion tasks, and goal success records.
6. Redis supports runtime/session-style infrastructure.
7. Socket.IO pushes real-time updates for chat, order/transaction style events, and collaboration flows.
8. Stripe and webhook handlers complete payment-related flows.
9. Client-side smart bundle comparison uses current and saved bundle data to compare price, budget left, locked picks, confidence, and coverage.

## 6. Important Business Modules in the Backend

Current backend modules include:

- `auth`
- `user`
- `product`
- `category`
- `attribute`
- `variant`
- `cart`
- `checkout`
- `payment`
- `order`
- `shipment`
- `transaction`
- `review`
- `analytics`
- `reports`
- `logs`
- `section`
- `chat`
- `goal`
- `shared-cart`
- `shopping-assistant`
- `webhook`
- `address`

This module breakdown shows the project is organized around domain features rather than one large monolith file.

## 7. Notable Differentiators of This Application

Compared with a basic e-commerce starter app, this codebase also includes:

- collaborative shared carts
- goal-based guided bundle generation
- custom bundle building
- smart bundle comparison
- checkout recovery and support handoff
- order companions and reminders
- goal success tracking
- shopping help
- real-time support chat
- WebRTC signaling for support calls
- admin analytics and logs
- both REST and GraphQL support

## 8. Best Short Description

If you want a one-paragraph explanation of the product, this is the most accurate summary:

This application is a modern full-stack e-commerce platform built with Next.js on the frontend and Express/Prisma on the backend. It supports product browsing, authentication, cart and Stripe checkout, orders, payments, shipments, reviews, admin operations, analytics, and real-time support chat. It also includes advanced commerce features such as collaborative shared carts, goal-based and custom bundle building, smart bundle comparison, checkout recovery, shopping help, order companion workflows, reminders, and goal success tracking after purchase.
