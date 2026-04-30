# Implementation Plan: Assets Migration

## Overview

This plan hardens the existing Next.js 16 app against the legacy WordPress/Elementor HTML exports. The migration is primarily a **consistency and quality pass** — content is already in place, so tasks focus on: extracting a shared sanitization utility, enforcing the Sensory Luxury design system uniformly across all pages, completing SEO metadata, adding accessibility improvements, and writing property-based and unit tests to verify correctness guarantees.

All tasks are TypeScript. Testing uses Vitest + fast-check as specified in the design document.

---

## Tasks

- [x] 1. Set up testing infrastructure and shared sanitization utility
  - Install Vitest and fast-check as dev dependencies (`vitest`, `@vitest/coverage-v8`, `fast-check`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`)
  - Add `vitest.config.ts` at the project root configured for jsdom environment and path aliases (`@/` → `src/`)
  - Add `"test": "vitest --run"` and `"test:watch": "vitest"` scripts to `package.json`
  - Create `src/lib/__tests__/` directory with a `.gitkeep` placeholder
  - _Requirements: 1.1, 1.3_

- [x] 2. Extract and harden the shared sanitization library
  - [x] 2.1 Create `src/lib/sanitize.ts` with `SPAM_KEYWORDS` and `TRUSTED_DOMAINS` constants from the design document
    - Export `sanitizeWPContent(html: string): string` — full HTML sanitizer (Gutenberg comments, shortcodes, spam elements, untrusted links, JS event handlers, WP class names)
    - Export `sanitizeText(text: string): string` — plain-text sanitizer that replaces spam keywords with `"..."`
    - Export `hasSuspiciousContent(html: string): boolean` — flags content with excessive links, encoded strings, or foreign spam patterns
    - Wrap all regex operations in try/catch; return `''` on error (fail-safe, never throw)
    - _Requirements: 2.6, 3.1, 3.2, 3.3, 3.5, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 2.2 Update `src/app/[slug]/page.tsx` to import `sanitizeWPContent` and `sanitizeText` from `src/lib/sanitize.ts` and remove the inline duplicate implementation
    - _Requirements: 4.1, 7.5_

  - [x]* 2.3 Write property test — Property 1: Spam keyword removal is total
    - Create `src/lib/__tests__/sanitize.test.ts`
    - For any HTML string containing a word from `SPAM_KEYWORDS`, `sanitizeWPContent` output must not contain that keyword (case-insensitive)
    - **Property 1: Spam keyword removal is total**
    - **Validates: Requirements 2.6, 11.1, 11.2, 11.3**

  - [x]* 2.4 Write property test — Property 2: Spam element removal removes the entire containing element
    - For any `<p>`, `<div>`, or `<a>` element whose text contains a spam keyword, the entire element must be absent from sanitized output
    - **Property 2: Spam element removal removes the entire containing element**
    - **Validates: Requirements 2.6, 11.3**

  - [x]* 2.5 Write property test — Property 3: Trusted links preserved, untrusted links stripped
    - For any HTML with a mix of internal, trusted-external, and untrusted-external links, trusted links survive and untrusted links are removed
    - **Property 3: Trusted links are preserved, untrusted links are stripped**
    - **Validates: Requirements 11.4**

  - [x]* 2.6 Write property test — Property 4: JavaScript event handlers are always removed
    - For any HTML string containing `on[a-z]+` attributes, sanitized output must contain no such attributes
    - **Property 4: JavaScript event handlers are always removed**
    - **Validates: Requirements 11.6**

  - [x]* 2.7 Write property test — Property 5: WordPress class names are eliminated
    - For any HTML string containing `wp-*`, `elementor-*`, `freshio-*`, `woocommerce`, or `yith-*` class names, sanitized output must contain none of those patterns
    - **Property 5: WordPress class names are eliminated**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

  - [x]* 2.8 Write property test — Property 6: Semantic structure is preserved through sanitization
    - For any HTML with semantic elements (`<h1>`–`<h6>`, `<p>`, `<ul>`, `<ol>`, `<li>`, `<a>` with trusted href), those elements and their text must still be present after sanitization
    - **Property 6: Semantic structure is preserved through sanitization**
    - **Validates: Requirements 1.5, 2.1, 2.3**

  - [x]* 2.9 Write property test — Property 9: Sanitization is idempotent
    - For any HTML string, `sanitizeWPContent(sanitizeWPContent(x))` must equal `sanitizeWPContent(x)`
    - **Property 9: Sanitization is idempotent**
    - **Validates: Requirements 4.1, 7.5**

- [x] 3. Checkpoint — Ensure all sanitization tests pass
  - Run `npm run test` and confirm all property tests and unit tests in `sanitize.test.ts` pass. Ask the user if any test failures need clarification before proceeding.

- [x] 4. Implement SEO metadata across all pages
  - [x] 4.1 Update `src/app/faqs/page.tsx` — replace the existing `metadata` export with a full `Metadata` object including `title`, `description`, `openGraph` (title, description, url, siteName, locale, type, images), and `twitter` (card, title, description, images)
    - Title format: `"FAQs | Catch-22 New Zealand"`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 4.2 Update `src/app/partners/page.tsx` — replace the existing `metadata` export with a full `Metadata` object including Open Graph and Twitter Card tags
    - Title format: `"Our Partners | Catch-22 New Zealand"`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 4.3 Update `src/app/gallery/page.tsx` — replace the existing `metadata` export with a full `Metadata` object including Open Graph and Twitter Card tags
    - Title format: `"Catch-Snaps | Catch-22 New Zealand"`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 4.4 Update `src/app/contact/page.tsx` — add a `metadata` export (static, since the page is a Client Component — export from a separate `layout.tsx` or use `export const metadata` at module level before `'use client'` boundary)
    - Title format: `"Contact Us | Catch-22 New Zealand"`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 4.5 Update `src/app/page.tsx` (Home) — add a full `metadata` export with Open Graph, Twitter Card, and JSON-LD `Organization` + `WebSite` structured data via a `<script type="application/ld+json">` in the page component
    - Title format: `"Catch-22 | Premium Fishing Gear New Zealand"`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 4.6 Update `src/app/products/page.tsx` — extend the existing `generateMetadata` to include Open Graph and Twitter Card tags for both the default and category-filtered states
    - _Requirements: 8.1, 8.4, 8.5, 8.7_

  - [~]* 4.7 Write unit tests for metadata title format
    - For each static page, assert the exported `metadata.title` matches `"* | Catch-22 New Zealand"` format
    - For `generateMetadata` on products page, assert the returned title matches the format for both default and category states
    - **Property 7: Metadata title format is always correct**
    - **Validates: Requirements 8.1, 8.2**

- [x] 5. Harden accessibility across all pages
  - [x] 5.1 Audit and update `src/app/page.tsx` — ensure the hero section uses `<header>` or `<section>` with `aria-label`, all `<Image>` components have descriptive `alt` text, and the charity banner uses semantic `<aside>` or `<section>`
    - Verify heading hierarchy: single `<h1>` on the page, `<h2>` for section titles, `<h3>` for sub-items
    - _Requirements: 10.1, 10.2, 10.7_

  - [x] 5.2 Audit and update `src/app/faqs/page.tsx` — wrap the page in `<main>`, ensure `<section>` elements have `aria-labelledby` pointing to their `<h2>`, and FAQ items use `<dl>`, `<dt>`, `<dd>` or `<details>`/`<summary>` for semantic Q&A structure
    - _Requirements: 10.1, 10.3, 10.7_

  - [x] 5.3 Audit and update `src/app/partners/page.tsx` — wrap the page in `<main>`, add `aria-label` to partner card links, ensure all partner images have descriptive `alt` text (not just the partner name), and add `rel="noopener noreferrer"` to all external links
    - _Requirements: 10.1, 10.2, 10.4_

  - [x] 5.4 Audit and update `src/app/gallery/page.tsx` — wrap the page in `<main>`, ensure all gallery images have descriptive `alt` text describing the catch/scene (not generic placeholders), and add `aria-label` to the "Submit Your Snap" CTA
    - _Requirements: 10.1, 10.2_

  - [x] 5.5 Audit and update `src/app/contact/page.tsx` — verify all form inputs have associated `<label>` elements (already present), add `aria-describedby` linking error/success messages to the form, and ensure the submit button has a visible focus ring
    - _Requirements: 10.1, 10.3, 10.6_

  - [~]* 5.6 Write unit tests for image alt text presence
    - Render each static page component in a jsdom environment and assert that no `<img>` element has an empty or missing `alt` attribute
    - **Property 8: Images always have non-empty alt text**
    - **Validates: Requirements 10.2**

- [x] 6. Enforce Sensory Luxury design system consistency
  - [x] 6.1 Audit `src/app/faqs/page.tsx` — verify all interactive elements use `transition-all duration-500 ease-out` (or `duration-700`), CTA button uses `rounded-full py-5 px-12 uppercase tracking-[0.2em]`, and the page uses `bg-primary` / `text-secondary` tokens (not raw hex values)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 6.2 Audit `src/app/partners/page.tsx` — verify partner cards use `rounded-[2.5rem]`, hover transitions are `duration-500 ease-out`, and the "Visit Website" button uses `rounded-full` with correct padding and uppercase tracking
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 6.3 Audit `src/app/gallery/page.tsx` — verify gallery cards use `rounded-[2.5rem]`, hover scale and overlay transitions use `duration-700 ease-out`, and the CTA button uses `rounded-full py-6 px-16 uppercase tracking-[0.3em]`
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6_

  - [x] 6.4 Audit `src/app/contact/page.tsx` — verify the form container uses `rounded-3xl`, input focus rings use `focus:ring-primary`, and the submit button uses `rounded-full` with correct padding and uppercase tracking
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6_

  - [x] 6.5 Audit `src/app/products/page.tsx` — verify category sidebar links use `bg-primary` for active state, product grid uses consistent gap and responsive column classes, and the "No gear found" empty state uses `rounded-3xl` with design tokens
    - _Requirements: 5.1, 5.2, 5.5, 5.6_

- [x] 7. Checkpoint — Ensure all tests pass
  - Run `npm run test` and confirm all tests pass. Ask the user if any failures need clarification before proceeding.

- [x] 8. Harden data fetching and error states
  - [x] 8.1 Update `src/app/products/page.tsx` — add a graceful error state component for when the Supabase categories query fails (currently only the products query has an error handler), and add `revalidate = 60` export if not already present
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7_

  - [x] 8.2 Update `src/app/page.tsx` — in the `DealOfTheDay` and `LatestLogbookEntries` server components, replace bare `if (!data) return null` with explicit error logging (`console.error`) and a styled fallback UI component consistent with the design system
    - _Requirements: 7.3, 7.7_

  - [x] 8.3 Update `src/app/products/[slug]/page.tsx` — add `sanitizeWPContent` import from `src/lib/sanitize.ts` for the product `description` field before rendering it, and add a "No Image" fallback `<div>` for products where `image_url` is null
    - _Requirements: 7.5, 9.5_

  - [x] 8.4 Update `src/app/[slug]/page.tsx` — replace the inline `sanitizeWPContent` call with the shared import from `src/lib/sanitize.ts` (this should already be done in task 2.2; verify the import is correct and the inline function is fully removed)
    - _Requirements: 4.1, 7.5_

  - [~]* 8.5 Write unit tests for Supabase error states
    - Mock the Supabase client to return `{ data: null, error: { message: 'DB error' } }` and assert that the products page renders a non-crashing fallback UI
    - _Requirements: 7.7_

- [x] 9. Responsive design and performance audit
  - [x] 9.1 Update `src/app/page.tsx` — add `priority` prop to the hero `<Image>` component (already present — verify it is set), add `loading="lazy"` to all below-the-fold images in `TrustedByPros` and `LatestLogbookEntries`, and verify all grid layouts use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-*` responsive stacking
    - _Requirements: 9.2, 9.3, 9.5, 12.1, 12.2_

  - [x] 9.2 Update `src/app/gallery/page.tsx` — add `sizes` prop to all gallery `<Image>` components for responsive image loading hints, and verify the grid uses `grid-cols-2 md:grid-cols-3` for correct mobile stacking
    - _Requirements: 9.2, 9.5, 12.1, 12.2_

  - [x] 9.3 Update `src/app/partners/page.tsx` — add `sizes` prop to all partner `<Image>` components, and verify the grid uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for correct responsive stacking
    - _Requirements: 9.2, 9.5, 12.1, 12.2_

  - [x] 9.4 Verify all pages use `export const revalidate = 60` for ISR — add it to `src/app/faqs/page.tsx`, `src/app/partners/page.tsx`, and `src/app/gallery/page.tsx` if missing
    - _Requirements: 7.4, 9.1_

- [x] 10. Final integration and wiring
  - [x] 10.1 Verify `src/lib/sanitize.ts` is imported correctly in all pages that render dynamic Supabase content: `src/app/[slug]/page.tsx`, `src/app/products/[slug]/page.tsx`, and `src/app/page.tsx` (for `LatestLogbookEntries` post titles)
    - _Requirements: 4.1, 7.5, 11.1_

  - [x] 10.2 Update `src/app/page.tsx` — in `LatestLogbookEntries`, replace the inline spam regex with `sanitizeText(post.title)` from `src/lib/sanitize.ts`
    - _Requirements: 11.1, 11.2_

  - [~]* 10.3 Write integration tests for the contact form server action
    - Mock Supabase insert and assert `src/app/contact/actions.ts` returns `{ success: true }` on valid input and `{ error: string }` on Supabase failure
    - _Requirements: 4.5, 7.7_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Run `npm run test` and confirm the full test suite passes with zero failures. Ask the user if any issues arise before considering the migration complete.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 runs per property
- Unit tests use Vitest + @testing-library/react in a jsdom environment
- The sanitization library (`src/lib/sanitize.ts`) is the single source of truth — all pages must import from it, never duplicate inline
- No new infrastructure is required; this is a hardening pass on existing components
