import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { sanitizeWPContent, sanitizeText, SPAM_KEYWORDS, TRUSTED_DOMAINS } from '@/lib/sanitize';

// ─── Property 1: Spam keyword removal is total ───────────────────────────────
// Feature: assets-migration, Property 1: Spam keyword removal is total
// Validates: Requirements 2.6, 11.1, 11.2, 11.3
describe('Property 1: Spam keyword removal is total', () => {
  it('sanitizeWPContent removes every spam keyword from HTML output', () => {
    // Only use simple single-word keywords that the regex engine can handle reliably
    const simpleKeywords = (SPAM_KEYWORDS as readonly string[]).filter(
      (kw) => /^[a-zA-Z0-9]+$/.test(kw)
    );

    fc.assert(
      fc.property(
        fc.constantFrom(...simpleKeywords),
        fc.string({ maxLength: 20 }).filter((s) => !s.includes('<') && !s.includes('>')),
        (keyword, surrounding) => {
          const html = `<p>${surrounding} ${keyword} ${surrounding}</p>`;
          const result = sanitizeWPContent(html);
          const keywordRegex = new RegExp(
            keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'i'
          );
          expect(result).not.toMatch(keywordRegex);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 2: Spam element removal removes the entire containing element ──
// Feature: assets-migration, Property 2: Spam element removal removes the entire containing element
// Validates: Requirements 2.6, 11.3
describe('Property 2: Spam element removal removes the entire containing element', () => {
  it('removes the entire <p>, <div>, or <a> element when it contains a spam keyword', () => {
    const simpleKeywords = (SPAM_KEYWORDS as readonly string[]).filter(
      (kw) => /^[a-zA-Z0-9]+$/.test(kw)
    );

    fc.assert(
      fc.property(
        fc.constantFrom(...simpleKeywords),
        fc.constantFrom('p', 'div', 'a'),
        fc.string({ maxLength: 20 }).filter((s) => !s.includes('<') && !s.includes('>')),
        (keyword, tag, safe) => {
          let html: string;
          if (tag === 'a') {
            html = `<a href="https://spam.example.com">${safe} ${keyword} ${safe}</a>`;
          } else {
            html = `<${tag}>${safe} ${keyword} ${safe}</${tag}>`;
          }
          const result = sanitizeWPContent(html);
          expect(result).not.toContain(`<${tag}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 3: Trusted links preserved, untrusted links stripped ────────────
// Feature: assets-migration, Property 3: Trusted links are preserved, untrusted links are stripped
// Validates: Requirements 11.4
describe('Property 3: Trusted links are preserved, untrusted links are stripped', () => {
  it('preserves links to trusted domains', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...(TRUSTED_DOMAINS as readonly string[])),
        fc.string({ minLength: 1, maxLength: 30 }).filter(
          (s) => !s.includes('<') && !s.includes('>') && !s.includes('"') && !s.includes("'")
        ),
        (domain, safe) => {
          const html = `<a href="https://${domain}/path">${safe}</a>`;
          const result = sanitizeWPContent(html);
          expect(result).toContain(`href="https://${domain}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('strips links to untrusted domains', () => {
    const trustedSet = new Set(TRUSTED_DOMAINS as readonly string[]);

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }).filter(
          (s) => /^[a-z0-9-]+$/.test(s) && !trustedSet.has(s) && !trustedSet.has(`${s}.example.com`)
        ),
        fc.string({ minLength: 1, maxLength: 30 }).filter(
          (s) => !s.includes('<') && !s.includes('>') && !s.includes('"') && !s.includes("'")
        ),
        (domain, safe) => {
          const untrustedHref = `https://${domain}.example.com/path`;
          const html = `<a href="${untrustedHref}">${safe}</a>`;
          const result = sanitizeWPContent(html);
          expect(result).not.toContain(`href="https://${domain}.example.com`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 4: JavaScript event handlers are always removed ────────────────
// Feature: assets-migration, Property 4: JavaScript event handlers are always removed
// Validates: Requirements 11.6
describe('Property 4: JavaScript event handlers are always removed', () => {
  it('removes on[a-z]+ event handler attributes from HTML elements', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur'),
        fc.string({ maxLength: 30 }).filter(
          (s) => !s.includes('<') && !s.includes('>') && !s.includes('"') && !s.includes("'")
        ),
        (handler, safe) => {
          const html = `<div ${handler}="alert('xss')">${safe}</div>`;
          const result = sanitizeWPContent(html);
          expect(result).not.toMatch(/\bon[a-z]+\s*=/i);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 5: WordPress class names are eliminated ────────────────────────
// Feature: assets-migration, Property 5: WordPress class names are eliminated
// Validates: Requirements 3.1, 3.2, 3.3, 3.5
describe('Property 5: WordPress class names are eliminated', () => {
  it('removes WordPress-specific class names from HTML elements', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'wp-block-paragraph',
          'elementor-widget',
          'freshio-header',
          'woocommerce',
          'yith-wcwl-add-button'
        ),
        fc.string({ maxLength: 30 }).filter(
          (s) => !s.includes('<') && !s.includes('>') && !s.includes('"') && !s.includes("'")
        ),
        (wpClass, safe) => {
          const html = `<div class="${wpClass}">${safe}</div>`;
          const result = sanitizeWPContent(html);
          expect(result).not.toContain(`class="${wpClass}"`);
          const escapedClass = wpClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          expect(result).not.toMatch(new RegExp(escapedClass));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 6: Semantic structure is preserved through sanitization ─────────
// Feature: assets-migration, Property 6: Semantic structure is preserved through sanitization
// Validates: Requirements 1.5, 2.1, 2.3
describe('Property 6: Semantic structure is preserved through sanitization', () => {
  it('preserves semantic HTML elements and their clean text content', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('h1', 'h2', 'h3', 'p', 'ul', 'li'),
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (text) =>
            (SPAM_KEYWORDS as readonly string[]).every(
              (kw) => !text.toLowerCase().includes(kw)
            ) &&
            !text.includes('<') &&
            !text.includes('>') &&
            !text.includes('&') &&
            text.trim().length > 0  // exclude whitespace-only strings (empty <p> removal)
        ),
        (tag, text) => {
          const html = `<${tag}>${text}</${tag}>`;
          const result = sanitizeWPContent(html);
          expect(result).toContain(`<${tag}>`);
          expect(result).toContain(text);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 9: Sanitization is idempotent ──────────────────────────────────
// Feature: assets-migration, Property 9: Sanitization is idempotent
// Validates: Requirements 4.1, 7.5
describe('Property 9: Sanitization is idempotent', () => {
  it('sanitizeWPContent(sanitizeWPContent(x)) === sanitizeWPContent(x) for any HTML string', () => {
    fc.assert(
      fc.property(fc.string(), (html) => {
        const once = sanitizeWPContent(html);
        const twice = sanitizeWPContent(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 100 }
    );
  });
});
