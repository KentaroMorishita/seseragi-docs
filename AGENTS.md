# Seseragi Docs

- This repository owns the Astro + Fumadocs website. The compiler, Playground, and normative language specification live in `KentaroMorishita/seseragi`.
- Keep code examples readable on phones: break long function signatures and bodies deliberately, use blocks where helpful, and verify that code is not clipped. CSS wrapping supplements authored formatting.
- Keep Learn (guided explanations) and Reference (lookup) separate. Validate the information architecture and visible design before expanding content broadly.
- Author Japanese prose in `content/docs`. Use concrete examples that compile with the canonical Seseragi CLI. Record the tested compiler version.
- The syntax grammar and brand assets are copied from the language repository; record provenance when updating them.
- Use Node 24.14+ and Bun 1.3.11. Run `bun run check` and `bun run build` for site changes. Verify navigation, search, mobile layout, and hydration in a browser when UI changes.
- Preserve unrelated work. Never commit `.env*`, `.vercel`, generated `dist`, browser state, or tokens.
- The first slice is a design/content prototype; an automated browser check is not reader acceptance. Do not mass-produce placeholder docs pages.
