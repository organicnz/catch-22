# Catch-22: Built for the Elements

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-blue?logo=stripe)](https://stripe.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Styling-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

A premium e-commerce migration of the [Catch-22](https://catch-22.co.nz) platform. This project transitions a legacy WordPress/Elementor ecosystem into a high-performance, cinematic "Sensory Luxury" experience built with Next.js 16, Supabase, and Stripe.

---

## 🌊 The Vision: Sensory Luxury
Catch-22 is not just gear; it's an experience. This digital storefront is engineered to mirror the raw, tactile nature of the New Zealand coast.
- **Visual Depth**: Glassmorphism, high-contrast typography, and fluid micro-animations.
- **Performance First**: Optimized LCP and cumulative layout stability for a seamless journey.
- **Tactile UI**: Interactive "Liquid Glass" galleries and responsive, high-fidelity components.

## 🛠 Features
- **Instant Storefront**: Cache Components + Partial Prefetching — the full catalog (45+ products, all CMS pages) prerenders to CDN-edge shells; dynamic data streams behind Suspense.
- **Secure Payments**: Stripe Checkout with server-side price authority, idempotent webhook processing (unique session index), and out-of-stock guards.
- **Hardened Security**: MFA support, Row-Level Security on all sensitive tables, CSP/HSTS/Permissions-Policy headers, rate-limited checkout & contact endpoints.
- **Advanced Sanitization**: WordPress content scrubbing engine eliminating legacy spam/injection.
- **Verified in CI**: unit suite + Playwright guards for instant navigation, header-clearance geometry, and sitewide link integrity.

## 🚀 Technical Stack
- **Frontend**: Next.js 16 (App Router, `cacheComponents`, Turbopack), React 19
- **Type Checking**: `tsrs` (Rust-based TypeScript type checking, `tsrs --noEmit`)
- **Backend**: Supabase (PostgreSQL, Auth, Storage via `@supabase/ssr`)
- **Payments**: Stripe Checkout (Card & Afterpay) + Direct Bank Transfer (NZ ANZ direct deposit)
- **Styling**: Tailwind CSS 4 ("Sensory Luxury" tokens, native CSS vars)
- **State**: Zustand (cart/wishlist persistence), TanStack Query
- **Quality**: Biome 2.6.3 + Oxlint, Native `bun test`, Playwright (`@next/playwright` instant())
- **Runtime & Package Manager**: Bun ≥1.4 (zero Node.js, npm, yarn, or pnpm dependencies)

## 📥 Getting Started

### 1. Prerequisites
- Bun ≥1.4
- A Supabase project with the catch-22 schema applied

### 2. Installation
```bash
bun install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key-here
SUPABASE_SECRET_KEY=sb_secret_your-key-here
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Development
```bash
bun run dev          # dev server (Turbopack)
bun test             # native Bun unit suite (189 tests, <300ms)
bun run typecheck    # tsrs Rust type checking
bun run lint:check   # Biome + Oxlint code validation
bun run test:e2e     # Playwright instant-nav + clearance + link-integrity guards
bun run build        # production build
```

### 5. CI/CD
- All workflows execute on a self-hosted ARM64 runner (`[self-hosted, linux, ARM64]`) with a preflight disk guard and terminal workspace cleanup.
- Push to `main` → CI gates (lint, types, unit, build, e2e, Supabase migrations) → Vercel auto-deploys production.
- Dependency health runs nightly: drift audit, vulnerability scan, safe-upgrade proposals.

## 💳 Payment Configuration

The store supports three comprehensive payment options tailored for New Zealand customers:

1. **Credit / Debit Cards & Digital Wallets**: Visa, Mastercard, Amex, Apple Pay, Google Pay, and Stripe Link via Stripe Hosted Checkout.
2. **Afterpay (Buy Now, Pay Later)**: 4 interest-free fortnightly instalments via Stripe (`afterpay_clearpay`). Dynamic 4-instalment breakdown badges are rendered across all catalog product cards, product detail pages, and the cart.
3. **Direct Bank Transfer (NZ Direct Deposit)**: Zero-card payment path directly into the designated bank deposit account with automatic `on-hold` order reservation, unique `CATCH22-<id>` payment reference, and Resend email dispatches.

### Afterpay (BNPL) — Configuration

Afterpay is integrated directly into Stripe Checkout (`payment_method_types: ['card', 'afterpay_clearpay']`):
- **Stripe Dashboard**: Ensure **Afterpay / Clearpay** is toggled ON in **Settings → Payment methods**.
- **Domestic NZ Requirement**: Afterpay requires NZD currency and NZ shipping/billing addresses (enforced in `src/app/api/checkout/route.ts`).
- **Catalog Visibility**: Product cards and detail views automatically calculate and display the 4-payment breakdown.

### Bank Transfer — Configuration

Bank transfer config is stored in **GitHub Secrets**, **Supabase Vault** (Edge Function secrets), and **Vercel Production Environment Variables**. The Next.js server action reads these via `process.env`.

**Step 1 — Set in Supabase Vault (CLI):**
```bash
supabase secrets set \
  BANK_TRANSFER_BANK_NAME="ANZ" \
  BANK_TRANSFER_ACCOUNT_NAME="<ACCOUNT_NAME>" \
  BANK_TRANSFER_ACCOUNT_NUMBER="<ACCOUNT_NUMBER>"
```

Verify with `supabase secrets list`. See `supabase/functions/.env.example` for the full secrets manifest.

**Step 2 — Mirror in Vercel & GitHub Secrets** (required for the Next.js server action & CI):

Bank transfer checkout **will not work in production** unless these variables are set in the Vercel dashboard and GitHub Secrets. Without them, the checkout refuses to create orders rather than showing a wrong account number to customers.

Go to: Vercel Dashboard → `catch-22` project → Settings → Environment Variables → Add to **Production**

| Variable | Description | Example |
|---|---|---|
| `BANK_TRANSFER_BANK_NAME` | Bank institution name | `ANZ` |
| `BANK_TRANSFER_ACCOUNT_NAME` | Registered account holder | `Catch-22` |
| `BANK_TRANSFER_ACCOUNT_NUMBER` | NZ Bank Account format | `06-XXXX-XXXXXXX-XX` |

After adding all three, trigger a redeployment (Settings → Deployments → Redeploy, or push a commit).

### Bank Transfer — Email Notifications

When a bank transfer order is placed, two emails are sent via [Resend](https://resend.com): a customer confirmation with payment instructions, and an admin alert. These are already in the Supabase Vault — verify with `supabase secrets list`:

| Secret | Value |
|---|---|
| `RESEND_API_KEY` | Your Resend API key |
| `ADMIN_ORDER_EMAIL` | Email to receive order alerts |
| `RESEND_FROM_EMAIL` | Verified sender domain |

They must also be set as Vercel environment variables (same values) so the Next.js server action can send emails directly. Use `onboarding@resend.dev` as `RESEND_FROM_EMAIL` for initial testing (no domain setup needed), then switch to `orders@catch-22.co.nz` once that domain is verified in Resend.

Email failures are non-fatal — the order saves to the database regardless.

### Bank Transfer — Order Workflow

1. Customer places order → status is set to `on-hold` in the Supabase `orders` table
2. Customer pays into the ANZ account with the reference `CATCH22-{order-id}`
3. Owner confirms payment received → marks order as `completed` in the admin UI
4. Customer receives dispatch confirmation

## 📖 Documentation
For more detailed information, please refer to:
- **[AGENTS.md](./AGENTS.md)**: Technical migration status, architectural decisions, and deferred upgrades.
- **[CLAUDE.md](./CLAUDE.md)**: Developer guide, coding patterns, and CLI shortcuts.

---

&copy; 2026 Catch-22. All rights reserved. Built for the elements.
