# Database Seeding

This folder contains the Prisma seed script for local development and demos.

Main script:

```text
seed.ts
```

## Run The Seeder

From `src/server`:

```powershell
npm run seed
```

The script cleans existing seeded/domain data first, then creates fresh records.

## Test Accounts

All seeded accounts use:

```text
password123
```

| Role | Email |
| --- | --- |
| Superadmin | `superadmin@example.com` |
| Admin | `admin@example.com` |
| User | `user@example.com` |

## Seeded Data

The current seed script creates development data for:

- users
- categories
- attributes
- attribute values
- category/attribute assignments
- products
- product variants
- variant attributes
- stock-related records
- sample records needed for dashboard/storefront testing

Current product examples include:

- `iPhone 16 Pro`
- `Samsung Galaxy S24`
- `Cotton T-Shirt`
- `Denim Jeans`
- `Nike Air Max`
- `Adidas Ultraboost`
- `Wooden Chair`
- `Metal Desk`

## Image Behavior

The app is designed to survive missing images.

Image-related folders:

- `../../../assets/seed-images`
- `../../client/public/assets/seed-images`

If a product/user/category image is missing, the frontend safe image helpers and placeholder utilities keep the UI from breaking.

## Important Notes

- The seeder is intended for local development and demo data.
- It deletes existing records in dependency order before recreating data.
- Do not run it against production data.
- If you add new required Prisma relations, update `seed.ts` at the same time.
- Run `npx prisma generate` after schema changes before seeding.
