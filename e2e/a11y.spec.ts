import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Automated accessibility regression gate (WCAG 2.1 A/AA via axe-core).
 *
 * Runs against the production build served by the shared Playwright web
 * server. Covers the public surfaces customers actually traverse; auth-gated
 * routes (/account, /admin) are excluded — they require seeded credentials
 * and are exercised manually.
 *
 * Serious/critical violations fail CI. Moderate/minor findings are reported
 * but tolerated so the gate stays actionable instead of noisy.
 */

const PAGES: { path: string; name?: string }[] = [
  { path: '/' },
  { path: '/products' },
  { path: '/about-us' },
  { path: '/faqs' },
  { path: '/partners' },
  { path: '/contact' },
  { path: '/shipping-returns' },
  { path: '/gallery' },
];

for (const { path, name } of PAGES) {
  test(`a11y: ${name ?? path} has no serious axe violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? '')
    );

    // Always surface the full picture in the report, then gate on serious+.
    const summary = results.violations
      .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`)
      .join('\n');
    if (summary) {
      console.log(`\naxe findings on ${path}:\n${summary}`);
    }

    expect(serious, `serious a11y violations on ${path}`).toEqual([]);
  });
}
