# Catch-22: Toolchain & Architectural Mandate

## ⚡ Strictly Enforced Toolchain

This project does **not** use Node.js or legacy Node-era tooling. All runtime, packaging, type checking, testing, and formatting tasks are exclusively handled by **Bun** and the modern **Rust-based toolchain**.

### 1. Runtime & Package Management: Bun

- **Always use `bun`**: Never execute `node`, `npm`, `yarn`, or `pnpm`.
- **Package installation**: `bun add <package>` or `bun add -d <package>`.
- **Script execution**: `bun run <script>` (e.g. `bun run dev`, `bun run build`).
- **Binary execution**: `bunx <command>` (never `npx`).
- **Type definitions**: Strictly use `@types/bun`. Never install `@types/node`.

### 2. Type Checking: tsrs (Rust)

- **Tool**: `tsrs` (`tsrs --noEmit`).
- **Policy**: Legacy `typescript` (`tsc`) devDependency is completely removed. All typechecking is executed via `bun run typecheck`.

### 3. Code Quality: Native Bun Lint & Native Bun Fmt

- **Linting**: Native `bun lint` (`bun --no-script lint src`, run via `bun run lint:check`). Configured via `[lint]` in `bunfig.toml`.
- **Formatting**: Native `bun fmt` (`bun fmt src`, run via `bun run format`). Prettier-compatible formatting in sub-15ms; configured via `[fmt]` in `bunfig.toml`.
- **Policy**: Zero legacy ESLint, Prettier, or Biome dependencies; 100% native Bun execution.

### 4. Unit & Integration Testing: bun:test

- **Test Runner**: Native `bun test` and `bun test --coverage`.
- **Test Modules**: Always import testing primitives from `'bun:test'` (`describe`, `it`, `expect`, `beforeEach`, `afterEach`, `vi`).
- **Policy**: Zero `vitest`, `@vitest/coverage-v8`, or `jsdom` packages. Never add `// @vitest-environment node` docblocks.

### 5. Git Automation: Lefthook (Rust/Go)

- Git hooks are managed by `lefthook` via Bun (`test -d .git && lefthook install || true`).
