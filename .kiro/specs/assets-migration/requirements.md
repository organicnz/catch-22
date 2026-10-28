# Requirements Document

## Introduction

This feature updates the Catch-22 website by migrating content from the legacy WordPress/Elementor ecosystem to the modern Next.js 16 headless e-commerce platform. The migration covers multiple pages (Home, Contact, FAQs, Shop, Partners) and removes all WordPress and Freshio theme artifacts while maintaining the established "Sensory Luxury" design system with Primary Lime (#D1FF00) and Deep Secondary (#0F172A) colors.

## Glossary

- **Assets_Directory**: THE collection of legacy WordPress HTML export files at `assets/` directory containing all page content
- **Home_Page**: THE Next.js page component at `src/app/page.tsx` that renders the main landing page
- **Contact_Page**: THE Next.js page component at `src/app/contact/page.tsx` for customer inquiries
- **FAQs_Page**: THE Next.js page component at `src/app/faqs/page.tsx` for frequently asked questions
- **Shop_Page**: THE Next.js page component at `src/app/products/page.tsx` for product listings
- **Partners_Page**: THE Next.js page component at `src/app/partners/page.tsx` for partner information
- **HTML_Source**: THE legacy WordPress HTML files at `assets/` directory exported from WordPress/Elementor
- **Sensory_Luxury_Design**: THE design system using Primary Lime (#D1FF00), Deep Secondary (#0F172A), heavy tracking, black-weight typography, and 500ms-700ms ease-out transitions
- **WordPress_Artifact**: ANY reference to WordPress, Elementor, Freshio theme, or legacy CMS patterns
- **Content_Section**: A discrete component of a page (Hero, Content Body, Testimonials, Forms, Grids, Lists)
- **Sanitization_Layer**: THE utility function that removes spam, malicious content, and unauthorized links
- **SEO_Metadata**: THE structured data including title, description, Open Graph tags, and schema markup
- **Performance_Budget**: THE target metrics including Largest Contentful Paint (LCP) under 2.5s and minimal client-side bundle size
- **Asset_Migration**: THE process of extracting content, images, and structure from legacy HTML files and implementing them in Next.js components

## Requirements

### Requirement 1: Assets Directory Migration Strategy

**User Story:** As a developer, I want to establish a comprehensive migration strategy for all assets, so that the entire legacy WordPress site is systematically migrated to Next.js.

#### Acceptance Criteria

1. WHEN planning migration, THE Migration_Strategy SHALL identify all HTML files in the Assets_Directory that need migration
2. THE Migration_Strategy SHALL prioritize pages based on business importance (Home, Shop, Contact, FAQs, Partners)
3. WHEN analyzing HTML files, THE Content_Analyzer SHALL identify common patterns across pages (headers, footers, forms, grids)
4. THE Migration_Strategy SHALL define reusable component patterns for shared elements (Hero, Content Body, Grid Layouts)
5. WHEN content is extracted, THE Content_Parser SHALL preserve semantic structure (headings, paragraphs, lists, links)
6. THE Migration_Strategy SHALL define a process for handling page-specific content vs. shared components
7. WHEN migration is complete, THE Verification_Check SHALL confirm all legacy pages have Next.js equivalents

### Requirement 2: Content Migration from HTML Source

**User Story:** As a developer, I want to extract content from the HTML source files, so that I can migrate it to Next.js components without manual retyping.

#### Acceptance Criteria

1. WHEN THE HTML_Source is parsed, THE Content_Parser SHALL extract all text content from each Content_Section
2. WHEN extracting content, THE Content_Parser SHALL identify section boundaries using HTML structure and class names
3. WHEN content contains inline styles or WordPress shortcodes, THE Content_Parser SHALL strip them while preserving text
4. THE Content_Parser SHALL extract testimonial quotes, author names, and attribution text separately
5. THE Content_Parser SHALL identify product references, pricing information, and call-to-action button text
6. WHEN content contains spam keywords (casino, slot, betting, poker, bonus, loto), THE Sanitization_Layer SHALL remove the entire containing element
7. THE Content_Parser SHALL extract charity donation messaging and percentage values

### Requirement 3: WordPress and Freshio Theme Artifact Removal

**User Story:** As a developer, I want to remove all WordPress and Freshio theme references from all migrated pages, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. WHEN scanning ANY migrated page code, THE Artifact_Scanner SHALL identify all WordPress-specific class names (wp-_, elementor-_, freshio-*)
2. WHEN WordPress artifacts are found, THE Artifact_Remover SHALL replace them with semantic HTML5 elements or Tailwind CSS classes
3. THE Artifact_Remover SHALL remove all references to WordPress plugins (WooCommerce classes, YITH wishlist classes)
4. WHEN Freshio theme CSS variables are found, THE Artifact_Remover SHALL replace them with Sensory_Luxury_Design tokens
5. THE Artifact_Remover SHALL remove all inline styles that reference WordPress color schemes or Freshio branding
6. WHEN Revolution Slider markup is found, THE Artifact_Remover SHALL replace it with native Next.js Image components
7. THE Artifact_Remover SHALL remove all WordPress meta tags, oEmbed links, and RSS feed references from metadata

### Requirement 4: Multi-Page Migration Consistency

**User Story:** As a developer, I want consistent migration across all pages, so that the entire site maintains brand coherence.

#### Acceptance Criteria

1. WHEN migrating multiple pages, THE Migration_Tool SHALL apply the same sanitization rules to all pages
2. THE Migration_Tool SHALL ensure consistent use of Sensory_Luxury_Design tokens across all pages
3. WHEN creating page components, THE Component_Generator SHALL use shared layout patterns (Hero, Content, Footer)
4. THE Migration_Tool SHALL maintain consistent navigation structure across all migrated pages
5. WHEN rendering forms, THE Form_Migrator SHALL convert WordPress forms to Next.js form components
6. THE Migration_Tool SHALL preserve page hierarchy and internal linking structure
7. WHEN content is migrated, THE Consistency_Check SHALL verify design system compliance across all pages

### Requirement 5: Sensory Luxury Design System Compliance

**User Story:** As a designer, I want all migrated pages to follow the Sensory Luxury design system, so that brand consistency is maintained.

#### Acceptance Criteria

1. ALL Migrated_Pages SHALL use Primary Lime (#D1FF00) for all primary call-to-action buttons and accent elements
2. ALL Migrated_Pages SHALL use Deep Secondary (#0F172A) for all body text and dark backgrounds
3. WHEN rendering headings, ALL Migrated_Pages SHALL apply font-black weight and uppercase transformation with tracking-tighter
4. WHEN rendering interactive elements, ALL Migrated_Pages SHALL apply 500ms-700ms ease-out transitions
5. ALL Migrated_Pages SHALL use rounded-[2rem] to rounded-[3rem] border radius for cards and containers
6. WHEN rendering buttons, ALL Migrated_Pages SHALL use rounded-full with py-5 px-12 padding and uppercase tracking-[0.2em] text
7. ALL Migrated_Pages SHALL maintain high contrast ratios (minimum 7:1) between text and backgrounds for accessibility

### Requirement 6: Component Structure Preservation

**User Story:** As a developer, I want to maintain the existing component structure across all pages, so that the codebase remains organized and testable.

#### Acceptance Criteria

1. ALL Migrated_Pages SHALL preserve the Hero section pattern with Image, gradient overlay, and call-to-action buttons
2. ALL Migrated_Pages SHALL preserve the Content Body section with proper typography hierarchy
3. ALL Migrated_Pages SHALL preserve the Footer section with consistent navigation and contact information
4. WHEN rendering forms, ALL Migrated_Pages SHALL preserve the form structure and validation patterns
5. ALL Migrated_Pages SHALL preserve the grid layout patterns for testimonials, partners, and product listings
6. WHEN rendering lists, ALL Migrated_Pages SHALL preserve the list structure and item formatting
7. ALL Migrated_Pages SHALL maintain consistent spacing and padding across all sections

### Requirement 7: Content Update Without Breaking Data Fetching

**User Story:** As a developer, I want to update content without breaking Supabase queries, so that dynamic data continues to load correctly.

#### Acceptance Criteria

1. WHEN updating ANY Migrated_Page, THE Developer SHALL NOT modify Supabase client initialization or query structure
2. THE Product_Listing component SHALL continue to fetch products with appropriate filters
3. WHEN rendering dynamic content, ALL Migrated_Pages SHALL render fallback loading states without crashing
4. ALL Migrated_Pages SHALL maintain revalidate = 60 for Incremental Static Regeneration
5. WHEN rendering dynamic content, ALL Migrated_Pages SHALL apply Sanitization_Layer to all user-generated text fields
6. THE Data_Fetching_Strategy SHALL define caching behavior for each page type
7. WHEN Supabase queries fail, ALL Migrated_Pages SHALL render graceful error states

### Requirement 8: SEO Metadata Enhancement

**User Story:** As a marketer, I want improved SEO metadata across all pages, so that the site ranks better in search engines.

#### Acceptance Criteria

1. ALL Migrated_Pages SHALL export a generateMetadata function that returns unique title and description
2. THE Metadata_Generator SHALL create page-specific titles following format: "Page Title | Catch-22 New Zealand"
3. THE Metadata_Generator SHALL create page-specific descriptions that accurately describe page content
4. ALL Migrated_Pages SHALL include Open Graph tags with og:title, og:description, og:image, and og:url
5. ALL Migrated_Pages SHALL include Twitter Card tags with twitter:card, twitter:title, twitter:description, and twitter:image
6. ALL Migrated_Pages SHALL include JSON-LD structured data for Organization, WebSite, and relevant schema types
7. WHEN rendering product pages, ALL Migrated_Pages SHALL include schema:offers markup with price and availability

### Requirement 9: Performance Optimization

**User Story:** As a user, I want all pages to load quickly, so that I can browse content without waiting.

#### Acceptance Criteria

1. ALL Migrated_Pages SHALL achieve Largest Contentful Paint (LCP) under 2.5 seconds on 3G connections
2. WHEN rendering images, ALL Migrated_Pages SHALL use Next.js Image component with priority flag for hero images
3. ALL Migrated_Pages SHALL use Suspense boundaries for all async data fetching components
4. ALL Migrated_Pages SHALL minimize client-side JavaScript bundle size by using Server Components for static content
5. WHEN rendering grids, ALL Migrated_Pages SHALL implement lazy loading for images below the fold
6. ALL Migrated_Pages SHALL use CSS containment (contain: layout style paint) for independent sections
7. WHEN rendering animations, ALL Migrated_Pages SHALL use CSS transforms and opacity (GPU-accelerated properties only)

### Requirement 10: Accessibility Compliance

**User Story:** As a user with disabilities, I want all pages to be accessible, so that I can navigate and interact with the site independently.

#### Acceptance Criteria

1. ALL Migrated_Pages SHALL use semantic HTML5 elements (header, nav, main, section, article, footer)
2. WHEN rendering images, ALL Migrated_Pages SHALL include descriptive alt text for all decorative and informational images
3. ALL Migrated_Pages SHALL maintain keyboard navigation support for all interactive elements
4. ALL Migrated_Pages SHALL use ARIA labels for icon-only buttons and navigation elements
5. WHEN rendering color-coded information, ALL Migrated_Pages SHALL provide text alternatives (not relying on color alone)
6. ALL Migrated_Pages SHALL maintain focus indicators with visible outline or ring styles
7. ALL Migrated_Pages SHALL use heading hierarchy (h1 → h2 → h3) without skipping levels

### Requirement 11: Spam and Malicious Content Filtering

**User Story:** As a site administrator, I want spam content filtered out across all pages, so that the brand reputation is protected.

#### Acceptance Criteria

1. WHEN rendering blog post titles, THE Sanitization_Layer SHALL replace spam keywords with "..." placeholder
2. THE Sanitization_Layer SHALL filter keywords: casino, slot, betting, poker, bonus, loto, winspirit, bons, jeetcity, wazamba, moonwin, 1xbet, apuesta
3. WHEN filtering content, THE Sanitization_Layer SHALL remove entire HTML elements containing spam keywords (not just the keyword)
4. THE Sanitization_Layer SHALL strip unauthorized outbound links while preserving internal links and trusted domains (supabase.com, stripe.com)
5. WHEN rendering user-generated content, THE Sanitization_Layer SHALL escape HTML entities to prevent XSS attacks
6. THE Sanitization_Layer SHALL remove all JavaScript event handlers (onclick, onerror, onload) from HTML strings
7. WHEN content contains suspicious patterns (excessive links, foreign characters, encoded strings), THE Sanitization_Layer SHALL flag it for manual review

### Requirement 12: Responsive Design Maintenance

**User Story:** As a mobile user, I want all pages to work on my device, so that I can browse and shop on the go.

#### Acceptance Criteria

1. ALL Migrated_Pages SHALL use Tailwind responsive prefixes (sm:, md:, lg:, xl:) for breakpoint-specific styles
2. WHEN viewport width is below 640px, ALL Migrated_Pages SHALL stack grid layouts vertically
3. ALL Migrated_Pages SHALL use fluid typography with clamp() or responsive text sizes (text-4xl md:text-6xl)
4. WHEN rendering the hero section, ALL Migrated_Pages SHALL adjust image positioning for mobile viewports
5. ALL Migrated_Pages SHALL use touch-friendly button sizes (minimum 44x44px tap targets)
6. WHEN rendering navigation, ALL Migrated_Pages SHALL collapse to hamburger menu on mobile viewports
7. ALL Migrated_Pages SHALL test layout integrity on viewport widths from 320px to 1920px
