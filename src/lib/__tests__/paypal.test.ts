import { describe, expect, it } from 'bun:test';

// Seed env BEFORE the module import chain reaches src/lib/env.ts: bun test
// evaluates static imports first, and the real Zod validation would throw at
// module scope without these (same pattern as app/contact/actions.test.ts).
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://stub.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||= 'stub-publishable-key';

const { hasUsablePayPalCredentials } = await import('../paypal');

describe('hasUsablePayPalCredentials', () => {
  it('rejects missing credentials', () => {
    expect(hasUsablePayPalCredentials()).toBe(false);
    expect(hasUsablePayPalCredentials(undefined, undefined)).toBe(false);
    expect(hasUsablePayPalCredentials('AX1234567890ABC', undefined)).toBe(false);
    expect(hasUsablePayPalCredentials(undefined, 'EVsecret30chars1234567890abcd')).toBe(false);
    expect(hasUsablePayPalCredentials('', '')).toBe(false);
    expect(hasUsablePayPalCredentials('   ', '  ')).toBe(false);
  });

  it('rejects scaffold placeholder values', () => {
    expect(hasUsablePayPalCredentials('your_paypal_client_id', 'your_paypal_client_secret')).toBe(
      false
    );
    expect(hasUsablePayPalCredentials('YOUR_CLIENT_ID_HERE', 'EVreal30charsecret1234567890a')).toBe(
      false
    );
    expect(hasUsablePayPalCredentials('AX1234567890ABC', 'your_secret_here')).toBe(false);
    expect(hasUsablePayPalCredentials('  your_id', 'EVsecret30chars1234567890abcd')).toBe(false);
  });

  it('accepts real-looking credentials', () => {
    expect(hasUsablePayPalCredentials('AX1234567890ABC', 'EVsecret30chars1234567890abcd')).toBe(
      true
    );
  });
});
