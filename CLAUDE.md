# Catch-22: Developer Manifesto & Guide

## ⚡ Quick Start
- `bun run dev`: Launch local development environment (Next.js 16 with Turbopack).
- `bun run build`: Production bundle generation.
- `bun run typecheck`: Rust-based TypeScript type checking (`tsrs --noEmit`).
- `bun run lint:check`: Sub-50ms code quality validation via Biome + Oxlint.
- `bun test`: Native Bun unit test suite (189 tests in <300ms).
- `bun run format:check`: High-speed Biome formatting validation.

### Agent Skills (Vercel)
Vercel-published skills are installed in `.agents/skills/` (symlinked into `.claude/skills/`) and pinned via `skills-lock.json`. Load on demand when the task matches: React/Next.js code (`vercel-react-best-practices`, `vercel-composition-patterns`), UI audits (`web-design-guidelines`), route animations (`vercel-react-view-transitions`), deployments (`deploy-to-vercel`, `vercel-cli-with-tokens`), cost/perf tuning (`vercel-optimize`), prose review (`writing-guidelines`). Full trigger table lives in AGENTS.md. Update with `bunx skills update`; never re-install manually.

---

## 🎨 Design System: "Sensory Luxury"
All UI development must adhere to the core design tokens.

### Colors (HSL)
- **Primary**: `hsl(71 100% 50%)` (Electric Lime `#d1ff00` — dark surfaces & accents only)
- **Primary Ink**: `#5c7500` (Contrast-remediated readable lime for text & links on white/light surfaces, 5.25:1 WCAG AAA)
- **Secondary**: `hsl(222 47% 11%)` (Deep Sea `#0f172a`)
- **Accent**: `hsl(217 91% 60%)` (Coastal Blue)
- **Surface**: `hsl(210 40% 98%)` (Soft Slate)

### Typography
- **Headings**: `font-black`, `uppercase`, `tracking-tighter`.
- **Navigation**: `font-bold`, `uppercase`, `tracking-[0.2em]`.
- **Body**: `font-medium`, `text-slate-600`, `leading-relaxed`.

---

## 💳 Payment Architecture
1. **Cards & Stripe Link**: Visa, Mastercard, Amex, Apple Pay, Google Pay via Stripe Hosted Checkout.
2. **Afterpay (BNPL)**: 4 interest-free fortnightly instalments via Stripe (`afterpay_clearpay`). Dynamic 4-instalment badges rendered on product cards and cart.
3. **Direct Bank Transfer (NZ Direct Deposit)**: Zero-card checkout into direct deposit account (`06-XXXX-XXXXXXX-XX`, `Account Name`) with automated `on-hold` order reservation, unique `CATCH22-<id>` payment reference, and Resend email alerts to customer and store (`orders@catch-22.co.nz`).

---

## 🏗 Coding Patterns

### 1. Component Architecture
- **Location**: `src/components/`.
- **Styling**: Tailwind CSS 4 (Native CSS variables & @theme).
- **Interactivity**: Use `framer-motion` for complex transitions; Tailwind for micro-animations.
- **Example**:
  ```tsx
  export function LuxuryButton({ children }) {
    return (
      <button className="bg-secondary text-white font-black px-8 py-4 rounded-full hover:bg-primary hover:text-black transition-all duration-500 uppercase tracking-widest text-xs">
        {children}
      </button>
    );
  }
  ```

### 2. Data Fetching & State
- **Server Components**: Prefer fetching data directly from Supabase via `createClient` in the `page.tsx`.
- **Client State**: Use `zustand` for persistent features (Cart, Wishlist).
- **Caching**: Utilize `export const revalidate = 3600;` for dynamic pages.

### 3. Content Sanitization
- **Rule**: NEVER render raw HTML from Supabase without passing it through `sanitizeWPContent`.
- **Reasoning**: Protects the application from legacy WordPress spam and malicious injections.

---

## 📂 Key File Map
- `src/app/globals.css`: Core design system definitions and CSS variables.
- `src/lib/supabase.ts`: Client initialization and database interface.
- `src/lib/store/`: Zustand persistent state definitions.
- `AGENTS.md`: Detailed migration status and architectural roadmap.
- `README.md`: High-level project overview and setup guide.

---

## 🛑 Critical Rules
1. **Premium Aesthetic**: No default browser styles. Use custom inputs, buttons, and scrollbars. All transitions must be ease-out (500ms-700ms).
2. **Performance**: Optimize all images via `next/image`. Maintain a strict "no layout shift" policy.
3. **Security**: Ensure all user inputs are validated. Implement MFA checks for sensitive account operations.
4. **SEO**: All new routes must include descriptive metadata via `generateMetadata`.
5. **Clean Code**: Remove all console logs and temporary placeholders before merging.
