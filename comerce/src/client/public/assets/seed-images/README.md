# Public Seed Images

This folder mirrors seed/demo images that should be served directly by the Next.js frontend.

Files here are available from the browser under:

```text
/assets/seed-images/...
```

## Folder Layout

```text
src/client/public/assets/seed-images/
|-- users/
|-- products/
`-- categories/
```

## When To Use This Folder

Use this folder when a seeded record or demo UI should reference a public frontend asset directly.

For backend seeding source assets, also see:

```text
assets/seed-images/
```

## Recommended Sizes

| Image type | Suggested size |
| --- | --- |
| User avatar | `200x200` |
| Product image | `800x800` |
| Category banner | `1200x700` |

## Notes

- Keep filenames predictable and slug-like.
- Keep file sizes small enough for local demos.
- The app includes safe image fallback behavior, so missing demo images should not break the UI.
