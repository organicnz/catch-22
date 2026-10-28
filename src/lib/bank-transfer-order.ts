/**
 * Pure validation + money math for bank-transfer (direct deposit) orders.
 *
 * Kept dependency-free and side-effect-free so vitest can exercise every
 * branch without a database, Stripe or Next runtime. The server action in
 * `src/app/checkout/actions.ts` owns I/O; this module owns the rules.
 */

import { SHIPPING_RATES } from '@/config/shipping';
import { type CartItemInput, validateCartItems } from '@/lib/checkout-validation';

export interface BankTransferCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  postcode: string;
  region: string;
}

export interface BankTransferOrderInput {
  items: CartItemInput[];
  customer: BankTransferCustomer;
  shippingMethodId: string;
  promoCode: string;
  paymentOption?: 'bank_transfer' | 'pay_on_pickup';
}

export interface ValidatedBankTransferOrder extends BankTransferOrderInput {
  paymentOption: 'bank_transfer' | 'pay_on_pickup';
}

export type BankTransferOrderValidation =
  | { ok: true; value: ValidatedBankTransferOrder }
  | { ok: false; failure: { field: string; message: string } };

const CONTROL_CHARS = /\p{C}/u;
const PHONE_CHARS = /^[\d+\-()\s]+$/;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function fail(field: string, message: string): BankTransferOrderValidation {
  return { ok: false, failure: { field, message } };
}

/** Reads a trimmed string field with a shared length/character policy. */
function readField(
  value: unknown,
  field: string,
  label: string,
  maxLength: number,
  minLength = 1
): { ok: true; value: string } | { ok: false; failure: { field: string; message: string } } {
  const trimmed = text(value);
  if (trimmed.length < minLength) {
    return { ok: false, failure: { field, message: `${label} is required.` } };
  }
  if (trimmed.length > maxLength) {
    return { ok: false, failure: { field, message: `${label} is too long.` } };
  }
  if (CONTROL_CHARS.test(trimmed)) {
    return { ok: false, failure: { field, message: `${label} contains invalid characters.` } };
  }
  return { ok: true, value: trimmed };
}

/**
 * Validates the full bank-transfer payload. Cart items are validated by the
 * shared checkout helper so both payment paths accept exactly the same shape.
 */
export function validateBankTransferOrder(raw: unknown): BankTransferOrderValidation {
  const body = (raw ?? {}) as Record<string, unknown>;

  const cartCheck = validateCartItems(body.items);
  if (!cartCheck.ok) return cartCheck;

  const candidate = (body.customer ?? {}) as Record<string, unknown>;

  const firstName = readField(candidate.firstName, 'customer.firstName', 'First name', 100);
  if (!firstName.ok) return firstName;
  const lastName = readField(candidate.lastName, 'customer.lastName', 'Last name', 100);
  if (!lastName.ok) return lastName;

  const email = readField(candidate.email, 'customer.email', 'Email', 254);
  if (!email.ok) return email;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    return fail('customer.email', 'Please enter a valid email address.');
  }

  const phone = readField(candidate.phone, 'customer.phone', 'Phone', 30, 5);
  if (!phone.ok) return phone;
  if (!PHONE_CHARS.test(phone.value)) {
    return fail('customer.phone', 'Phone can only contain digits, spaces and + - ( ).');
  }

  const address1 = readField(candidate.address1, 'customer.address1', 'Address', 200);
  if (!address1.ok) return address1;
  const address2 = readField(candidate.address2, 'customer.address2', 'Address line 2', 200, 0);
  if (!address2.ok) return address2;
  const city = readField(candidate.city, 'customer.city', 'City / suburb', 100);
  if (!city.ok) return city;
  const postcode = readField(candidate.postcode, 'customer.postcode', 'Postcode', 20);
  if (!postcode.ok) return postcode;
  const region = readField(candidate.region, 'customer.region', 'Region', 100, 0);
  if (!region.ok) return region;

  const shippingMethodId = text(body.shippingMethodId);
  if (!SHIPPING_RATES.some((rate) => rate.id === shippingMethodId)) {
    return fail('shippingMethodId', 'Please choose a shipping method.');
  }

  const promoCode = text(body.promoCode);
  if (promoCode.length > 50) {
    return fail('promoCode', 'Promo code is too long.');
  }

  const rawPaymentOption = text(body.paymentOption);
  let paymentOption: 'bank_transfer' | 'pay_on_pickup' = 'bank_transfer';
  if (rawPaymentOption === 'pay_on_pickup') {
    if (shippingMethodId !== 'pickup') {
      return fail('paymentOption', 'Pay on pick-up is only available when pick-up is selected.');
    }
    paymentOption = 'pay_on_pickup';
  }

  return {
    ok: true,
    value: {
      items: cartCheck.items,
      customer: {
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        phone: phone.value,
        address1: address1.value,
        address2: address2.value,
        city: city.value,
        postcode: postcode.value,
        region: region.value,
      },
      shippingMethodId,
      promoCode,
      paymentOption,
    },
  };
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

/** Rounds to whole cents, the precision of every DECIMAL(10,2) column. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface CouponLike {
  code?: string | null;
  amount?: number | string | null;
  discount_type?: string | null;
  expiry_date?: string | null;
}

/**
 * Discount in dollars for a coupon row. Expired, unreadable or non-positive
 * coupons yield 0 rather than silently granting a discount. Capped at the
 * subtotal so an order can never go negative.
 */
export function discountForCoupon(
  subtotal: number,
  coupon: CouponLike | null | undefined,
  now: Date = new Date()
): number {
  if (!coupon) return 0;

  if (coupon.expiry_date) {
    const expiry = new Date(coupon.expiry_date);
    if (Number.isNaN(expiry.getTime())) return 0;
    if (expiry.getTime() < now.getTime()) return 0;
  }

  const amount = Number(coupon.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  const raw = coupon.discount_type === 'percent' ? (subtotal * amount) / 100 : amount;
  return Math.min(roundMoney(raw), roundMoney(subtotal));
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

/**
 * Totals from server-trusted line totals. `shippingCents` matches the catalog
 * rate's storage unit so the client can never send a shipping price.
 */
export function computeOrderTotals(
  lineTotals: number[],
  shippingCents: number,
  coupon: CouponLike | null | undefined,
  now: Date = new Date()
): OrderTotals {
  const subtotal = roundMoney(lineTotals.reduce((sum, value) => sum + value, 0));
  const shipping = roundMoney(shippingCents / 100);
  const discount = discountForCoupon(subtotal, coupon, now);
  const total = Math.max(0, roundMoney(subtotal + shipping - discount));
  return { subtotal, shipping, discount, total };
}

// ---------------------------------------------------------------------------
// Reference
// ---------------------------------------------------------------------------

/**
 * Payment reference the customer types into their bank transfer. Kept short
 * so it fits a NZ bank "Reference" field (12 chars) for realistic order ids.
 */
export function orderReference(orderId: number): string {
  return `CATCH22-${orderId}`;
}
