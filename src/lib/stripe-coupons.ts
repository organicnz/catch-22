/**
 * Stripe coupon cache.
 *
 * Promo codes live in the `coupons` table; Stripe needs a Coupon object to
 * apply one to a Checkout Session. Creating a new Stripe coupon per checkout
 * would litter the account and split reporting, so the id is cached on the
 * row (`coupons.stripe_coupon_id`, added by 20260810130000_coupon_stripe_cache).
 *
 * `duration: 'once'` means the discount applies to a single checkout — the
 * database row stays valid for every future customer, which is the behaviour
 * the admin coupon UI implies.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { roundMoney } from '@/lib/bank-transfer-order';
import type { PromoCoupon } from '@/lib/promo';
import type { Database } from '@/types/supabase';

export async function getOrCreateStripeCoupon(
  stripe: Stripe,
  admin: SupabaseClient<Database>,
  coupon: PromoCoupon
): Promise<string | null> {
  // Reuse the cached coupon when it still exists in Stripe.
  if (coupon.stripe_coupon_id) {
    try {
      const existing = await stripe.coupons.retrieve(coupon.stripe_coupon_id);
      if (!('deleted' in existing) || !existing.deleted) return existing.id;
    } catch (error) {
      // Deleted in the Stripe dashboard, or a stale id from another mode.
      // Fall through and recreate rather than failing the customer's order.
      console.warn(
        `[stripe-coupon] Cached coupon ${coupon.stripe_coupon_id} unusable — recreating:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  const amount = Number(coupon.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const code = coupon.code ?? '';
  const params: Stripe.CouponCreateParams = {
    duration: 'once',
    name: code || undefined,
    metadata: code ? { code } : undefined,
    ...(coupon.discount_type === 'percent'
      ? { percent_off: Math.min(amount, 100) }
      : {
          amount_off: Math.round(roundMoney(amount) * 100),
          currency: 'nzd',
        }),
  };

  const created = await stripe.coupons.create(params);

  await admin.from('coupons').update({ stripe_coupon_id: created.id }).eq('code', code);

  return created.id;
}
