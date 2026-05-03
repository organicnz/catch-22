# Catch-22: Migration Architectural Guide

## Project Objective
Transform the legacy WordPress/Elementor ecosystem (catch-22.co.nz) into a modern, high-performance headless e-commerce platform. The goal is to achieve feature parity while introducing a "Sensory Luxury" design language and a robust, secure infrastructure.

---

## 🏗 Architectural Blueprint

### 1. Headless E-commerce (Next.js 16)
- **App Router Architecture**: Leveraging Server Components for data fetching and Client Components for interactivity (Cart, Wishlist).
- **Dynamic Routing**: Implementation of `[slug]` patterns for products, categories, and dynamic content pages.
- **Sanitization Layer**: A dedicated utility in `src/app/[slug]/page.tsx` for scrubbing legacy WordPress artifacts and preventing malicious spam injections.

### 2. Backend & Security (Supabase)
- **PostgreSQL Database**: Relational schema for products, categories, content, and coupons.
- **Supabase Auth & MFA**: Secure user management with Multi-Factor Authentication support for account protection.
- **Edge Functions**: Specialized logic for data synchronization, complex server-side operations, and secure Stripe webhook handling.

### 3. "Sensory Luxury" Design System
- **Design Tokens**: Defined directly in `src/app/globals.css` using Tailwind 4 `@theme` (no legacy config file).
- **Core Componentry**: Reusable, high-fidelity components like `ProductCard`, `WishlistButton`, and `Header`.
- **Aesthetic Principles**:
  - **High-Contrast**: Primary Lime (#D1FF00) against Deep Secondary (#0F172A).
  - **Fluidity**: 500ms-700ms ease-out transitions for interactive elements.
  - **Clarity**: Heavy use of tracking (letter-spacing) and black-weight typography for a premium feel.

---

## 🛠 Working Stack (Simplified)
- **Runtime**: Bun (Package management & scripts)
- **Frontend**: Next.js 16 (App Router + React 19)
- **Backend**: Supabase (Database, Auth, Storage via REST client)
- **Payments**: Stripe (Express Checkout & Webhooks)
- **Styling**: Tailwind CSS 4 (Native CSS variables)
- **State**: Zustand (Persistent cart & wishlist)

---

## 🗺 Migration Roadmap

### Phase 1: Core Infrastructure (Completed)
- [x] Supabase project initialization and schema design.
- [x] Next.js 16 project structure and base styling.
- [x] Primary Header and Footer navigation mirroring.

### Phase 2: Feature Parity & UI Hardening (Completed)
- [x] **Home Page**: Hero section and "Best Sellers" grid with hardened design tokens.
- [x] **Products**: Dynamic category filtering and individual product detail views.
- [x] **Cart & Checkout**: Persistent cart state and Stripe session integration.
- [x] **Logbook (Blog)**: Content migration with aggressive spam filtering.

### Phase 3: Content Population & Asset Migration (Completed)
- [x] **Static Pages**: FAQs, About Us, Partners, and Gallery (Catch-Snaps).
- [x] **Asset Hardening**: Mapping partner logos, community gallery images, and "Sledger Rigs" content.
- [x] **Legal**: Terms of Service, Privacy Policy, and Shipping/Returns.

### Phase 4: Production Hardening (Current)
- [x] **Documentation**: Finalizing README, AGENTS, and CLAUDE guides.
- [x] **Sensory Design**: Full hardening of ProductCard and Gallery components.
- [x] **Final QA**: End-to-end checkout flow validation and cross-device testing.
- [x] **Stripe Production**: Transitioning from test keys to live environment.

---

## 🛡 Security & Sanitization
The `sanitizeWPContent` helper is critical for brand integrity. It handles:
1. **Shortcode Extraction**: Replaces legacy WPForms with native Next.js contact components.
2. **Spam Blacklist**: Aggressive filtering of keywords (Casino, Slot, Betting) and their surrounding elements.
3. **Link Hardening**: Strips unauthorized outbound links while preserving trusted domains (Supabase, Stripe).

---

## 📋 Guidelines for Future Development
1. **Maintain Aesthetic Consistency**: All new components must use defined design tokens.
2. **SEO First**: Every dynamic page MUST implement `generateMetadata` for unique titles and descriptions.
3. **Sanitize Everything**: Any data coming from the `content` table in Supabase MUST pass through the sanitization helper.
4. **Performance Budgets**: Monitor LCP and keep client-side bundles minimal.
