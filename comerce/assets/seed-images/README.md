# Seed Images

This folder stores optional image files used by the database seeder.

The app can still work without these files because the frontend has fallback image handling and placeholder generation. Add real images here when you want seeded data to look closer to production/demo content.

## Folder Layout

```text
assets/seed-images/
|-- users/        # User avatars
|-- products/     # Product images
`-- categories/   # Category banners
```

## Expected Files

User avatars:

- `users/superadmin.jpg`
- `users/admin.jpg`
- `users/user.jpg`

Product images depend on the seed script. Use descriptive names that match the product or SKU when adding new seed data.

Category images should match category slugs when possible, for example:

- `categories/electronics.jpg`
- `categories/clothing.jpg`
- `categories/footwear.jpg`
- `categories/furniture.jpg`
- `categories/accessories.jpg`

## Recommended Sizes

| Image type | Suggested size | Notes |
| --- | --- | --- |
| User avatar | `200x200` | Square |
| Product image | `800x800` | Square, clean background |
| Category banner | `1200x700` | Landscape |

## How To Use

1. Add images to the correct folder.
2. Run the backend seeder:

```powershell
Set-Location .\src\server
npm run seed
```

3. Open the storefront or admin dashboard and verify the seeded records.

## Notes

- Keep images compressed for web use.
- Prefer `.jpg` or `.webp`.
- Avoid very large files in the repository.
- The mirrored public folder at `src/client/public/assets/seed-images` is for frontend-served assets.
