'use server';

import { headers } from 'next/headers';
import { roundMoney } from '@/lib/bank-transfer-order';
import { validateCartItems } from '@/lib/checkout-validation';
import { resolvePromoCode } from '@/lib/promo';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase-server';

export interface PromoPreview {
  ok: true;
  code: string;
  subtotal: number;
  discount: number;
  label: string;
}

export type PromoPreviewResult = PromoPreview | { ok: false; error: string };

/**
 * Previews a promo code against the live catalog so the cart can show the real
 * discount before the customer reaches Stripe. The checkout route re-resolves
 * the same code against its own subtotal — this preview is never trusted for
 * money.
 */
export async function previewPromoCodeAction(input: {
  code: string;
  items: { id: number; quantity: number }[];
}): Promise<PromoPreviewResult> {
  const gate = rateLimit(clientKey(await headers(), 'promo-preview'), 15, 60_000);
  if (!gate.ok) {
    return {
      ok: false,
      error: `Too many promo attempts — try again in ${gate.retryAfterSec}s.`,
    };
  }

  const cartCheck = validateCartItems(input?.items);
  if (!cartCheck.ok) return { ok: false, error: cartCheck.failure.message };

  const admin = await createAdminClient();

  const { data: products, error } = await admin
    .from('products')
    .select('id, price')
    .in(
      'id',
      cartCheck.items.map((item) => item.id)
    );

  if (error || !products) {
    console.error('[promo] Product lookup failed:', error);
    return { ok: false, error: 'Could not check that promo code. Please try again.' };
  }

  const priceMap = new Map(products.map((product) => [product.id, Number(product.price)]));
  let subtotal = 0;
  for (const item of cartCheck.items) {
    const price = priceMap.get(item.id);
    if (price === undefined) {
      return { ok: false, error: 'An item in your cart is no longer available.' };
    }
    subtotal += price * item.quantity;
  }
  subtotal = roundMoney(subtotal);

  const resolved = await resolvePromoCode(admin, input.code, subtotal);
  if (!resolved.ok) return resolved;

  return {
    ok: true,
    code: resolved.promo.code,
    subtotal,
    discount: resolved.promo.discount,
    label: resolved.promo.label,
  };
}
