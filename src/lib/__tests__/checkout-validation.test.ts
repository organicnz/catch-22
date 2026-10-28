import { describe, expect, it } from 'bun:test';
import { validateCartItems, validatePromoCode } from '@/lib/checkout-validation';

describe('validateCartItems()', () => {
  it('accepts a well-formed cart', () => {
    const result = validateCartItems([{ id: 16, quantity: 2 }]);
    expect(result).toEqual({ ok: true, items: [{ id: 16, quantity: 2 }] });
  });

  it('rejects an empty or missing cart', () => {
    expect(validateCartItems([]).ok).toBe(false);
    expect(validateCartItems(undefined).ok).toBe(false);
    expect(validateCartItems('nope').ok).toBe(false);
  });

  it('rejects non-numeric and non-integer ids', () => {
    for (const bad of [
      { id: 'x', quantity: 1 },
      { id: 1.5, quantity: 1 },
    ]) {
      const r = validateCartItems([bad]);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.failure.message).toBe('Invalid item: id must be a number');
    }
  });

  it('rejects quantities outside 1–999 including floats', () => {
    for (const qty of [0, -3, 1000, 1.5]) {
      const r = validateCartItems([{ id: 16, quantity: qty }]);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.failure.field).toBe('items.16');
        expect(r.failure.message).toContain('between 1 and 999');
      }
    }
  });

  it('accepts boundary quantities (1 and 999)', () => {
    const minResult = validateCartItems([{ id: 1, quantity: 1 }]);
    expect(minResult.ok).toBe(true);
    const maxResult = validateCartItems([{ id: 1, quantity: 999 }]);
    expect(maxResult.ok).toBe(true);
  });

  it('validates multi-item carts with multiple braid spool variations', () => {
    const multiItems = [
      { id: 101, quantity: 1 },
      { id: 102, quantity: 3 },
      { id: 103, quantity: 5 },
    ];
    const result = validateCartItems(multiItems);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items.length).toBe(3);
      expect(result.items).toEqual(multiItems);
    }
  });

  it('rejects null and malformed cart item entries', () => {
    for (const badEntry of [null, undefined, {}, { id: 10 }, { quantity: 2 }]) {
      const r = validateCartItems([badEntry]);
      expect(r.ok).toBe(false);
    }
  });
});

describe('validatePromoCode()', () => {
  it('passes when absent', () => {
    expect(validatePromoCode(undefined)).toEqual({ ok: true });
  });

  it('treats empty and whitespace-only strings as "no promo" (cart always sends the field)', () => {
    expect(validatePromoCode('')).toEqual({ ok: true });
    expect(validatePromoCode('   ')).toEqual({ ok: true });
  });

  it('rejects non-strings and oversized codes', () => {
    expect(validatePromoCode(42).ok).toBe(false);
    expect(validatePromoCode('x'.repeat(51)).ok).toBe(false);
    expect(validatePromoCode('SAVE10').ok).toBe(true);
    expect(validatePromoCode('SPRING-2026').ok).toBe(true);
  });
});
