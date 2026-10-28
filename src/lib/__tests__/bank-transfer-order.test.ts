import { describe, expect, it } from 'bun:test';
import { isNZRuralAddress } from '@/components/checkout/NZRuralDeliveryAssistant';
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

  it('defaults paymentOption to bank_transfer when omitted', () => {
    const result = validateBankTransferOrder(payload());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.paymentOption).toBe('bank_transfer');
    }
  });

  it('accepts pay_on_pickup when shippingMethodId is pickup', () => {
    const result = validateBankTransferOrder(
      payload({ shippingMethodId: 'pickup', paymentOption: 'pay_on_pickup' })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.paymentOption).toBe('pay_on_pickup');
    }
  });

  it('rejects pay_on_pickup when shippingMethodId is not pickup', () => {
    const result = validateBankTransferOrder(
      payload({ shippingMethodId: 'standard', paymentOption: 'pay_on_pickup' })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.field).toBe('paymentOption');
    }
  });

  it('accepts and normalizes selectedBank to lowercase', () => {
    const result = validateBankTransferOrder(payload({ selectedBank: 'ANZ' }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.selectedBank).toBe('anz');
    }
  });

  it('rejects selectedBank with control characters or excessive length', () => {
    expect(validateBankTransferOrder(payload({ selectedBank: 'ANZ\nInjection' })).ok).toBe(false);
    expect(validateBankTransferOrder(payload({ selectedBank: 'A'.repeat(55) })).ok).toBe(false);
  });

  it('accepts valid 8-digit and 9-digit NZ GST numbers and formats them', () => {
    // 8 digits: XX-XXX-XXX
    const result8 = validateBankTransferOrder(
      payload({
        businessGst: {
          companyName: 'Hauraki Charters Ltd',
          gstNumber: '49091850',
        },
      })
    );
    expect(result8.ok).toBe(true);
    if (result8.ok) {
      expect(result8.value.businessGst?.companyName).toBe('Hauraki Charters Ltd');
      expect(result8.value.businessGst?.gstNumber).toBe('49-091-850');
    }

    // 9 digits: XXX-XXX-XXX
    const result9 = validateBankTransferOrder(
      payload({
        businessGst: {
          companyName: 'Catch-22 Angling Supplies',
          gstNumber: '133842108',
        },
      })
    );
    expect(result9.ok).toBe(true);
    if (result9.ok) {
      expect(result9.value.businessGst?.gstNumber).toBe('133-842-108');
    }

    // Already hyphenated
    const resultHyphen = validateBankTransferOrder(
      payload({
        businessGst: {
          companyName: 'Tutukaka Fishing Club',
          gstNumber: '123-456-789',
        },
      })
    );
    expect(resultHyphen.ok).toBe(true);
    if (resultHyphen.ok) {
      expect(resultHyphen.value.businessGst?.gstNumber).toBe('123-456-789');
    }
  });

  it('rejects businessGst if company name is missing or invalid', () => {
    const noCompany = validateBankTransferOrder(
      payload({
        businessGst: {
          companyName: '',
          gstNumber: '133842108',
        },
      })
    );
    expect(noCompany.ok).toBe(false);
    if (!noCompany.ok) {
      expect(noCompany.failure.field).toBe('businessGst.companyName');
    }

    const evilCompany = validateBankTransferOrder(
      payload({
        businessGst: {
          companyName: 'Acme Ltd\nBcc: evil@test.com',
          gstNumber: '133842108',
        },
      })
    );
    expect(evilCompany.ok).toBe(false);
  });

  it('rejects invalid GST numbers (letters, short, too long)', () => {
    for (const badGst of ['1234567', '1234567890', 'ABC12345', 'not-a-gst']) {
      const res = validateBankTransferOrder(
        payload({
          businessGst: {
            companyName: 'Valid Co',
            gstNumber: badGst,
          },
        })
      );
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.failure.field).toBe('businessGst.gstNumber');
      }
    }
  });
});

describe('isNZRuralAddress()', () => {
  it('detects common NZ rural delivery indicators', () => {
    expect(isNZRuralAddress('144 Mahurangi East Road, RD 2')).toBe(true);
    expect(isNZRuralAddress('55 Cape Reinga Road, RD1')).toBe(true);
    expect(isNZRuralAddress('77 Whangarei Heads, R.D. 4')).toBe(true);
    expect(isNZRuralAddress('12 Coast Road, Rural Delivery 1, Kaipara')).toBe(true);
    expect(isNZRuralAddress('Box 42, RD 5, Tauranga')).toBe(true);
    expect(isNZRuralAddress('Coromandel Rural Area')).toBe(true);
  });

  it('does not flag standard urban or suburban addresses', () => {
    expect(isNZRuralAddress('12 Queen Street, Auckland CBD')).toBe(false);
    expect(isNZRuralAddress('18 Ponsonby Road, Ponsonby, Auckland')).toBe(false);
    expect(isNZRuralAddress('50 Victoria Street, Wellington')).toBe(false);
    expect(isNZRuralAddress('24 Riccarton Road, Christchurch')).toBe(false);
    expect(isNZRuralAddress('')).toBe(false);
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

  it('calculates high-ticket multi-spool braid orders accurately with rural shipping', () => {
    // 3 x $75 1000m spools ($225.00) + rural shipping $12.00 (1200 cents)
    const totals = computeOrderTotals([75, 75, 75], 1200, null, now);
    expect(totals).toEqual({
      subtotal: 225,
      shipping: 12,
      discount: 0,
      total: 237,
    });
  });

  it('calculates bulk braid club orders with percentage discounts and courier shipping', () => {
    // 10 x $50 500m spools ($500.00) with 10% promo discount ($50.00) + standard courier ($8.00)
    const totals = computeOrderTotals(
      Array(10).fill(50),
      800,
      { amount: 10, discount_type: 'percent' },
      now
    );
    expect(totals).toEqual({
      subtotal: 500,
      shipping: 8,
      discount: 50,
      total: 458,
    });
  });
});

describe('orderReference()', () => {
  it('is short enough for a NZ bank reference field', () => {
    expect(orderReference(1234)).toBe('CATCH22-1234');
    expect(orderReference(1234).length).toBeLessThanOrEqual(12);
  });

  it('generates bank references matching NZ banking constraints without illegal characters', () => {
    for (const id of [1, 42, 999, 1234, 99999]) {
      const ref = orderReference(id);
      expect(ref).toBe(`CATCH22-${id}`);
      // NZ bank references must be alphanumeric or hyphen, no spaces or control chars
      expect(/^[A-Z0-9-]+$/.test(ref)).toBe(true);
      expect(ref.length).toBeGreaterThanOrEqual(9);
    }
  });
});
