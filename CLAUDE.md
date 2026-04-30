# Catch-22: Developer Manifesto & Guide

## ⚡ Quick Start
- `npm run dev`: Launch local development environment.
- `npm run build`: Production bundle generation.
- `npm run lint`: Code quality and syntax validation.
- `npm run test`: Execute project test suite (if applicable).

---

## 🎨 Design System: "Sensory Luxury"
All UI development must adhere to the core design tokens.

### Colors (HSL)
- **Primary**: `hsl(71 100% 50%)` (Electric Lime)
- **Secondary**: `hsl(222 47% 11%)` (Deep Sea)
- **Accent**: `hsl(217 91% 60%)` (Coastal Blue)
- **Surface**: `hsl(210 40% 98%)` (Soft Slate)

### Typography
- **Headings**: `font-black`, `uppercase`, `tracking-tighter`.
- **Navigation**: `font-bold`, `uppercase`, `tracking-[0.2em]`.
- **Body**: `font-medium`, `text-slate-600`, `leading-relaxed`.

---

## 🏗 Coding Patterns

### 1. Component Architecture
- **Location**: `src/components/`.
- **Styling**: Tailwind CSS + Shadcn UI primitives.
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
