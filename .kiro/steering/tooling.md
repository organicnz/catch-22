# Project Tooling

## Runtime & Package Manager

- **Bun** is the runtime and package manager. Always use `bun` commands, never `npm`, `npx`, or `yarn`.

## Running Tests

```bash
bun test              # run all tests once
bun test <file>       # run a specific test file
```

The `test` script in `package.json` runs `vitest --run`. Vitest is the test framework, but it is always invoked via `bun test`, not `npx vitest` or `npx vitest --run`.

## Other Common Commands

```bash
bun run dev           # start dev server
bun run build         # production build
bun run lint          # lint
```

## Framework

- **Next.js 16** with App Router
- **React 19**
- **Tailwind CSS 4** (native CSS variables via `@theme` in `globals.css` — no `tailwind.config.js`)
- **Zustand** for client state (cart, wishlist, settings)
- **Supabase** for database, auth, and storage
- **Stripe** for payments
