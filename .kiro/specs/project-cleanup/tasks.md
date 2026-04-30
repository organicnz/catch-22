# Implementation Plan: Project Cleanup

## Overview

Mechanical cleanup of the Catch-22 repository in seven ordered steps: remove the npm lock file, delete 12 one-time migration scripts, remove `.DS_Store` artifacts, confirm `.gitignore` coverage, update developer documentation, reinstall dependencies under Bun, and verify the build passes cleanly.

No application logic changes. Every step is reversible via git.

## Tasks

- [x] 1. Delete `package-lock.json`
  - Remove `package-lock.json` from the repository root
  - Confirm `bun.lock` remains present and unmodified
  - `package.json` must not be touched
  - _Requirements: 1.1, 1.2_

- [x] 2. Delete the 12 one-time migration scripts from `scripts/`
  - Delete the following files:
    - `scripts/migrate.mjs`
    - `scripts/migrate_all_schemas.mjs`
    - `scripts/migrate_gallery_media.mjs`
    - `scripts/migrate_internal_links.mjs`
    - `scripts/migrate_media.mjs`
    - `scripts/migrate_submissions.mjs`
    - `scripts/upload_all_media.mjs`
    - `scripts/upload_final.mjs`
    - `scripts/upload_products.mjs`
    - `scripts/upload_users_orders.mjs`
    - `scripts/cleanup_spam.mjs`
    - `scripts/deep_cleanup.mjs`
  - Confirm the four utility scripts remain untouched: `health_check.mjs`, `sync_stripe.mjs`, `verify_migration.mjs`, `audit_images.mjs`
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

- [x] 3. Delete all `.DS_Store` artifact files
  - Delete `.DS_Store` at the repository root
  - Delete `.trunk/.DS_Store`
  - Delete `src/.DS_Store`
  - Delete `supabase/.DS_Store`
  - _Requirements: 4.1_

- [x] 4. Untrack `.DS_Store` files from git and confirm `.gitignore` coverage
  - Confirm `.gitignore` already contains a `.DS_Store` entry (it does — no edit needed)
  - Run `git rm --cached .DS_Store` for each of the four paths to stop git tracking them: root, `.trunk/`, `src/`, `supabase/`
  - Verify `git status` no longer shows any `.DS_Store` as tracked or untracked
  - _Requirements: 4.2, 4.3_

- [x] 5. Update `README.md` and `CLAUDE.md` to reference Bun commands
  - [x] 5.1 Update `README.md`
    - Replace the Prerequisites line `Node.js 20+ or Bun` with `Bun 1.x`
    - Replace the Installation block so `bun install` is the only command (remove the `npm install` line and the `# or` comment)
    - Replace `npm run dev` in the Development section with `bun run dev`
    - _Requirements: 6.1, 6.2, 6.4_
  - [x] 5.2 Update `CLAUDE.md`
    - Replace `npm run dev` with `bun run dev` in the Quick Start section
    - Replace `npm run build` with `bun run build`
    - Replace `npm run lint` with `bun run lint`
    - Replace `npm run test` with `bun run test`
    - _Requirements: 6.3_

- [x] 6. Checkpoint — verify file system state before reinstall
  - Confirm `package-lock.json` does not exist
  - Confirm `scripts/` contains exactly 4 files
  - Confirm all 4 `.DS_Store` paths are absent
  - Confirm `README.md` contains `bun install` and does not contain `npm install`
  - Confirm `CLAUDE.md` does not contain any `npm run` references
  - Confirm `AGENTS.md` does not contain any `npm run` references (no changes were needed)
  - Ask the user if anything looks wrong before proceeding to the reinstall step

- [x] 7. Remove `node_modules/` and reinstall with Bun
  - Delete the `node_modules/` directory
  - Run `bun install` to regenerate `node_modules/` under Bun
  - Confirm exit code is 0 and `node_modules/` is populated
  - _Requirements: 1.4, 1.8_

- [x] 8. Verify the project builds and tests pass under Bun
  - Run `bun run build` and confirm exit code 0 and `.next/` directory is created
  - Run `bun run lint` and confirm exit code 0 with zero ESLint errors
  - Run `bun run test` and confirm the existing vitest suite (`src/lib/__tests__/sanitize.test.ts`) passes
  - If any step fails, resolve the error per the error-handling guidance in the design document before marking complete
  - _Requirements: 1.5, 1.7, 5.1, 5.2, 5.3, 5.4_

- [x] 9. Final checkpoint — confirm clean state
  - Ensure all tests pass and the build is green
  - Ask the user if questions arise before closing out the feature

## Notes

- Tasks are ordered so the repository remains in a valid, committable state after each step
- Task 6 is a manual checkpoint — do not proceed to the reinstall until the file system state is confirmed
- The design document's error-handling section covers recovery steps if `bun install` or `bun run build` fails
- `package.json` must not be modified at any point; all existing scripts and dependencies stay exactly as-is
- No new runtime or dev dependencies should be introduced
