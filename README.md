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
- **Secure Payments**: Stripe API integration with support for **Apple/Google Pay (Express Checkout)**.
- **Hardened Security**: Multi-Factor Authentication (MFA) support via Supabase.
- **Advanced Sanitization**: Specialized WordPress-to-Next.js content scrubbing engine to eliminate legacy spam.
- **Sensory Luxury UI**: A custom design system built with Tailwind CSS, Shadcn UI, and Framer Motion.

## 🚀 Technical Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Supabase (Database, Auth, Storage via `@supabase/ssr`)
- **Payments**: Stripe API (Express Checkout)
- **Styling**: Tailwind CSS 4 (Custom "Sensory" Design Tokens)
- **State**: Zustand (Cart & Wishlist persistence)
- **Icons**: Lucide React
- **Runtime**: Bun 1.x

## 📥 Getting Started

### 1. Prerequisites
- Bun 1.x
- A Supabase project with the catch-22 schema applied

### 2. Installation
```bash
bun install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Development
```bash
bun run dev
```

## 📖 Documentation
For more detailed information, please refer to:
- **[AGENTS.md](./AGENTS.md)**: Technical migration status and architectural decisions.
- **[CLAUDE.md](./CLAUDE.md)**: Developer guide, coding patterns, and CLI shortcuts.

---

&copy; 2026 Catch-22. All rights reserved. Built for the elements.
