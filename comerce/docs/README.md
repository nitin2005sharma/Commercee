# Documentation Index

Last updated: April 27, 2026

This folder is the main documentation hub for the ecommerce application. It explains what the application does, how the code is organized, how the frontend and backend communicate, and how to run or extend the project.

## Start Here

- [Features](./FEATURES.md): customer, admin, collaboration, bundle, checkout, tracking, and analytics features.
- [Architecture](./ARCHITECTURE.md): system design, request flow, frontend/backend responsibilities, and integrations.
- [File Structure](./FILE_STRUCTURE.md): important folders and files in the client and server.
- [API Reference](./API_REFERENCE.md): REST, GraphQL, RTK Query, and real-time API map.
- [Data Model](./DATA_MODEL.md): Prisma models, enums, and domain relationships.
- [Runbook](./RUNBOOK.md): setup, environment variables, commands, verification, and troubleshooting.

## Application Summary

This is a full-stack ecommerce application built around normal commerce flows plus richer shopping workflows:

- browsing products and categories
- product details, variants, reviews, and cart
- checkout with Stripe and recovery support
- user accounts, orders, payments, and profile
- admin dashboard for catalog, inventory, users, orders, analytics, logs, reports, and chats
- shared carts for group decisions
- goal-based bundles for completing a shopping plan
- custom bundle builder for user-defined item lists
- smart bundle comparison for saved and current bundles
- post-purchase order companion and goal success tracking
- real-time support chat and socket updates

## Codebase Split

| Area | Path | Purpose |
| --- | --- | --- |
| Frontend | `src/client` | Next.js 15 app, React 19, Redux Toolkit Query, Tailwind CSS |
| Backend | `src/server` | Express API, Prisma/PostgreSQL, Socket.IO, Apollo GraphQL |
| Database schema | `src/server/prisma/schema.prisma` | Prisma models, enums, and relationships |
| API client layer | `src/client/app/store/apis` | RTK Query endpoints used by the frontend |
| Server modules | `src/server/src/modules` | Feature modules for auth, catalog, orders, goals, etc. |

## Existing Project Docs

The repository also contains older or broader documents at the root:

- `APPLICATION_DOCUMENTATION.md`
- `PROJECT_STUDY_GUIDE.md`
- `FEATURE_STATUS_REPORT.md`
- `FULL_STACK_ECOMMERCE_PROJECT_REPORT.md`
- `README.md`

Use this `docs/` folder as the current structured reference, and use the root files for additional study/report material.
