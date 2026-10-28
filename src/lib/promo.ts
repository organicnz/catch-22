/**
 * Promo-code resolution shared by the cart UI, the Stripe checkout route and
 * the bank-transfer action. One implementation means a code that previews as
 * valid in the cart can never be rejected (or silently ignored) at payment.
 *
 * The lookup uses the service-role client because `coupons` has no public read
 * policy — a customer must never be able to enumerate every code.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { type CouponLike, discountForCoupon } from '@/lib/bank-transfer-order';
import { normalizePromoCode, PROMO_CODE_MAX_LENGTH, promoLabel } from '@/lib/promo-code';
import type { Database } from '@/types/supabase';

export { normalizePromoCode, PROMO_CODE_MAX_LENGTH, promoLabel } from '@/lib/promo-code';

export interface PromoCoupon extends CouponLike {
  stripe_coupon_id?: string | null;
}

export interface ResolvedPromo {
  code: string;
  /** Discount in whole cents, capped at the subtotal. */
  discountCents: number;
  /** Discount in dollars for display. */
  discount: number;
  /** "10% off" / "$5.00 off" */
  label: string;
  coupon: PromoCoupon;
}

export type PromoResolution = { ok: true; promo: ResolvedPromo } | { ok: false; error: string };

/**
 * Looks up a code, checks expiry and computes the discount against a
 * server-trusted subtotal. Returns a customer-safe error for every miss.
 */
export async function resolvePromoCode(
  admin: SupabaseClient<Database>,
  rawCode: string,
  subtotal: number,
  now: Date = new Date()
): Promise<PromoResolution> {
  const code = normalizePromoCode(rawCode);
  if (!code) return { ok: false, error: 'Enter a promo code.' };
  if (code.length > PROMO_CODE_MAX_LENGTH) {
    return { ok: false, error: 'That promo code is not valid.' };
  }

  const { data, error } = await admin
    .from('coupons')
    .select('code, amount, discount_type, expiry_date, stripe_coupon_id')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    console.error('[promo] Coupon lookup failed:', error);
    return { ok: false, error: 'Could not check that promo code. Please try again.' };
  }
  if (!data) return { ok: false, error: 'That promo code is not valid.' };

  const discount = discountForCoupon(subtotal, data, now);
  if (discount <= 0) {
    return { ok: false, error: 'That promo code has expired or is no longer available.' };
  }

  return {
    ok: true,
    promo: {
      code: data.code,
      discount,
      discountCents: Math.round(discount * 100),
      label: promoLabel(data, discount),
      coupon: data,
    },
  };
}
