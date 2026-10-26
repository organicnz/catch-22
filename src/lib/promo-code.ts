/**
 * Pure promo-code display helpers.
 *
 * Kept free of database and Supabase imports so the cart can render a discount
 * label on the client without pulling the service-role lookup into the bundle.
 */

import { type CouponLike, roundMoney } from '@/lib/bank-transfer-order';

export const PROMO_CODE_MAX_LENGTH = 50;

/** Upper-cases and trims so `welcome10` and `WELCOME10` resolve identically. */
export function normalizePromoCode(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toUpperCase() : '';
}

/** Human label for a coupon at a given dollar discount. */
export function promoLabel(coupon: CouponLike, discount: number): string {
  const amount = Number(coupon.amount ?? 0);
  if (coupon.discount_type === 'percent' && Number.isFinite(amount) && amount > 0) {
    const trimmed = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
    return `${trimmed}% off`;
  }
  return `$${roundMoney(discount).toFixed(2)} off`;
}
