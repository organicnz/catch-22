import { describe, expect, it } from 'bun:test';
import {
  computeOrderTotals,
  discountForCoupon,
  orderReference,
  roundMoney,
  validateBankTransferOrder,
} from '@/lib/bank-transfer-order';

const validCustomer = {
  firstName: 'Tane',
  lastName: 'Ngata',
  email: 'tane@example.co.nz',
  phone: '021 555 0123',
  address1: '12 Snapper Road',
  address2: '',
  city: 'Auckland',
  postcode: '0620',
  region: 'Auckland',
};

function payload(overrides: Record<string, unknown> = {}) {
  return {
    items: [{ id: 16, quantity: 2 }],
    customer: { ...validCustomer },
    shippingMethodId: 'standard',
    promoCode: '',
    ...overrides,
  };
}

describe('validateBankTransferOrder()', () => {
  it('accepts a well-formed order and trims free text', () => {
    const result = validateBankTransferOrder(
      payload({ customer: { ...validCustomer, firstName: '  Tane  ' } })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.customer.firstName).toBe('Tane');
      expect(result.value.shippingMethodId).toBe('standard');
      expect(result.value.items).toEqual([{ id: 16, quantity: 2 }]);
    }
  });

  it('rejects a missing or empty cart', () => {
    expect(validateBankTransferOrder(payload({ items: [] })).ok).toBe(false);
    expect(validateBankTransferOrder(payload({ items: undefined })).ok).toBe(false);
  });

  it('requires each customer field', () => {
    for (const field of [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address1',
      'city',
      'postcode',
    ] as const) {
      const result = validateBankTransferOrder(
        payload({ customer: { ...validCustomer, [field]: '' } })
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.failure.field).toBe(`customer.${field}`);
    }
  });

  it('allows empty optional address/region fields', () => {
    const result = validateBankTransferOrder(
      payload({ customer: { ...validCustomer, address2: '', region: '' } })
    );
    expect(result.ok).toBe(true);
  });

  it('rejects malformed emails', () => {
    for (const email of ['no-at-sign', '@example.com', 'user@', 'user @example.com']) {
      const result = validateBankTransferOrder(payload({ customer: { ...validCustomer, email } }));
      expect(result.ok).toBe(false);
    }
  });

  it('rejects phones with letters', () => {
    const result = validateBankTransferOrder(
      payload({ customer: { ...validCustomer, phone: 'call me maybe' } })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe('customer.phone');
  });

  it('rejects control characters (header-injection defence)', () => {
    const result = validateBankTransferOrder(
      payload({ customer: { ...validCustomer, firstName: 'Tane\nBcc: evil@example.com' } })
    );
    expect(result.ok).toBe(false);
  });

  it('rejects an unknown shipping method', () => {
    const result = validateBankTransferOrder(payload({ shippingMethodId: 'teleport' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe('shippingMethodId');
  });

  it('accepts every configured shipping method', () => {
    for (const id of ['standard', 'rural', 'standard-courier', 'rural-courier', 'pickup']) {
      expect(validateBankTransferOrder(payload({ shippingMethodId: id })).ok).toBe(true);
    }
  });

  it('rejects oversized promo codes', () => {
    const result = validateBankTransferOrder(payload({ promoCode: 'X'.repeat(51) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe('promoCode');
  });
});

describe('roundMoney()', () => {
  it('rounds to whole cents', () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(10.004)).toBe(10);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});

describe('discountForCoupon()', () => {
  const now = new Date('2026-10-22T00:00:00Z');

  it('returns 0 without a coupon', () => {
    expect(discountForCoupon(100, null, now)).toBe(0);
    expect(discountForCoupon(100, undefined, now)).toBe(0);
  });

  it('applies a percentage discount', () => {
    expect(discountForCoupon(80, { amount: 10, discount_type: 'percent' }, now)).toBe(8);
  });

  it('applies a fixed discount', () => {
    expect(discountForCoupon(80, { amount: 15, discount_type: 'fixed' }, now)).toBe(15);
  });

  it('caps the discount at the subtotal', () => {
    expect(discountForCoupon(20, { amount: 50, discount_type: 'fixed' }, now)).toBe(20);
  });

  it('rejects expired coupons', () => {
    expect(
      discountForCoupon(
        80,
        { amount: 10, discount_type: 'percent', expiry_date: '2026-10-01T00:00:00Z' },
        now
      )
    ).toBe(0);
  });

  it('rejects an unreadable expiry date', () => {
    expect(
      discountForCoupon(
        80,
        { amount: 10, discount_type: 'percent', expiry_date: 'not-a-date' },
        now
      )
    ).toBe(0);
  });

  it('rejects zero/negative/non-numeric amounts', () => {
    for (const amount of [0, -5, 'abc']) {
      expect(discountForCoupon(80, { amount, discount_type: 'fixed' }, now)).toBe(0);
    }
  });

  it('accepts coupons that expire in the future', () => {
    expect(
      discountForCoupon(
        100,
        { amount: 10, discount_type: 'percent', expiry_date: '2027-01-01T00:00:00Z' },
        now
      )
    ).toBe(10);
  });
});

describe('computeOrderTotals()', () => {
  const now = new Date('2026-10-22T00:00:00Z');

  it('adds shipping and subtracts the discount', () => {
    const totals = computeOrderTotals([40, 60], 800, { amount: 10, discount_type: 'percent' }, now);
    expect(totals).toEqual({ subtotal: 100, shipping: 8, discount: 10, total: 98 });
  });

  it('never returns a negative total', () => {
    const totals = computeOrderTotals([10], 800, { amount: 999, discount_type: 'fixed' }, now);
    expect(totals.subtotal).toBe(10);
    expect(totals.discount).toBe(10);
    expect(totals.total).toBe(8);
  });

  it('treats pickup shipping as free', () => {
    const totals = computeOrderTotals([25.5], 0, null, now);
    expect(totals).toEqual({ subtotal: 25.5, shipping: 0, discount: 0, total: 25.5 });
  });
});

describe('orderReference()', () => {
  it('is short enough for a NZ bank reference field', () => {
    expect(orderReference(1234)).toBe('CATCH22-1234');
    expect(orderReference(1234).length).toBeLessThanOrEqual(12);
  });
});
