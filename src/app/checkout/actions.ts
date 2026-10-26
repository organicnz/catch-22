'use server';

import { headers } from 'next/headers';
import { getBankTransferConfig } from '@/config/bank-transfer';
import { SHIPPING_RATES } from '@/config/shipping';
import {
  type BankTransferOrderInput,
  type CouponLike,
  computeOrderTotals,
  discountForCoupon,
  orderReference,
  roundMoney,
  validateBankTransferOrder,
} from '@/lib/bank-transfer-order';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { createAdminClient, createServerClient } from '@/lib/supabase-server';

export interface BankTransferSuccess {
  success: true;
  orderId: number;
  reference: string;
  totals: {
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
  };
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    instructions: string[];
    testMode: boolean;
  };
}

export type BankTransferResult = { error: string } | BankTransferSuccess;

/**
 * Creates an order that is paid by bank transfer (direct deposit) instead of
 * a card. The order is written with status `on-hold` until the owner confirms
 * the money arrived, at which point the existing admin order actions move it
 * to `completed`.
 *
 * Everything money-related is recomputed server-side from the catalog — the
 * client only sends product ids, quantities and the customer's details.
 */
export async function createBankTransferOrder(
  input: BankTransferOrderInput
): Promise<BankTransferResult> {
  // Same budget as the Stripe path: order creation is not free (DB writes +
  // notification email pressure). In-memory per isolate.
  const gate = rateLimit(clientKey(await headers(), 'bank-transfer'), 10, 60_000);
  if (!gate.ok) {
    return { error: `Too many attempts — try again in ${gate.retryAfterSec}s.` };
  }

  const check = validateBankTransferOrder(input);
  if (!check.ok) return { error: check.failure.message };
  const { items, customer, shippingMethodId, promoCode } = check.value;

  const config = getBankTransferConfig();
  if (!config.configured) {
    console.error(
      `[bank-transfer] Not configured — missing ${config.missing.join(', ')}. Refusing to create an order.`
    );
    return {
      error:
        'Bank transfer is not available right now. Please contact us and we will take your order directly.',
    };
  }

  const admin = await createAdminClient();

  // ── 1. Price and stock integrity from the catalog, never from the client ──
  const { data: products, error: productError } = await admin
    .from('products')
    .select('id, name, price, stock_status')
    .in(
      'id',
      items.map((item) => item.id)
    );

  if (productError) {
    console.error('[bank-transfer] Product lookup failed:', productError);
    return { error: 'Could not verify your cart. Please try again.' };
  }

  const productMap = new Map((products ?? []).map((product) => [product.id, product]));
  const lines: {
    product_id: number;
    product_name: string;
    quantity: number;
    total: number;
  }[] = [];

  for (const item of items) {
    const product = productMap.get(item.id);
    if (!product) {
      return {
        error: 'An item in your cart is no longer available. Please refresh and try again.',
      };
    }
    if (product.stock_status !== 'instock') {
      return { error: `${product.name} is out of stock. Please remove it from your cart.` };
    }

    lines.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      total: roundMoney(Number(product.price) * item.quantity),
    });
  }

  // ── 2. Coupon: validated against the coupons table, never trusted blindly ──
  let coupon: CouponLike | null = null;
  if (promoCode) {
    const { data: couponRow, error: couponError } = await admin
      .from('coupons')
      .select('code, amount, discount_type, expiry_date')
      .eq('code', promoCode.toUpperCase())
      .maybeSingle();

    if (couponError) {
      console.error('[bank-transfer] Coupon lookup failed:', couponError);
      return { error: 'Could not check that promo code. Please try again.' };
    }
    if (!couponRow) {
      return { error: 'That promo code is not valid.' };
    }

    coupon = couponRow;
    if (
      discountForCoupon(Number(roundMoney(lines.reduce((sum, l) => sum + l.total, 0))), coupon) <= 0
    ) {
      return { error: 'That promo code has expired or is no longer available.' };
    }
  }

  // ── 3. Totals from server-trusted values ─────────────────────────────────
  const shippingRate = SHIPPING_RATES.find((rate) => rate.id === shippingMethodId);
  if (!shippingRate) {
    return { error: 'Please choose a shipping method.' };
  }
  const totals = computeOrderTotals(
    lines.map((line) => line.total),
    shippingRate.amount,
    coupon
  );

  // ── 4. Link the order to a profile when we can (guest checkout is fine) ──
  let profileId: number | null = null;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Two narrow lookups rather than an `.or()` filter: keeps arbitrary email
    // characters out of the PostgREST filter grammar.
    const { data: byUser } = await admin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    profileId = byUser?.id ?? null;

    if (!profileId && user.email) {
      const { data: byEmail } = await admin
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      profileId = byEmail?.id ?? null;
    }
  } else {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', customer.email)
      .maybeSingle();
    profileId = profile?.id ?? null;
  }

  // ── 5. Address payload — WooCommerce-compatible shape used by the admin UI ──
  const address = {
    first_name: customer.firstName,
    last_name: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    line1: customer.address1,
    line2: customer.address2 || undefined,
    city: customer.city,
    state: customer.region || undefined,
    postal_code: customer.postcode,
    country: 'NZ',
  };

  // ── 6. Order + items. Items failing means the order is rolled back so the
  //       admin never sees a headless order. ────────────────────────────────
  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      customer_id: profileId,
      status: 'on-hold',
      currency: 'NZD',
      total_amount: totals.total,
      payment_method: 'bank_transfer',
      billing_address: address,
      shipping_address: address,
      coupon_code: coupon ? promoCode.toUpperCase() : null,
      admin_notes: `Bank transfer order. Shipping: ${shippingRate.name} ($${totals.shipping.toFixed(2)}).`,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('[bank-transfer] Order insert failed:', orderError);
    return { error: 'Could not save your order. Please try again.' };
  }

  const { error: itemsError } = await admin.from('order_items').insert(
    lines.map((line) => ({
      order_id: order.id,
      product_id: line.product_id,
      product_name: line.product_name,
      quantity: line.quantity,
      total: line.total,
    }))
  );

  if (itemsError) {
    console.error('[bank-transfer] Order items insert failed:', itemsError);
    await admin.from('orders').delete().eq('id', order.id);
    return { error: 'Could not save your order. Please try again.' };
  }

  const reference = orderReference(order.id);

  // ── 7. Emails are best-effort: an email failure must never lose the order ──
  await sendBankTransferEmails({
    reference,
    orderId: order.id,
    customer,
    totals,
    lines,
    shippingName: shippingRate.name,
    bank: config.details,
  }).catch((error) => {
    console.error('[bank-transfer] Email notification failed:', error);
  });

  return {
    success: true,
    orderId: order.id,
    reference,
    totals,
    bank: config.details,
  };
}

// ---------------------------------------------------------------------------
// Email notifications (Resend) — best-effort, never blocks the order
// ---------------------------------------------------------------------------

interface EmailArgs {
  reference: string;
  orderId: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    postcode: string;
    region: string;
  };
  totals: { subtotal: number; shipping: number; discount: number; total: number };
  lines: { product_name: string; quantity: number; total: number }[];
  shippingName: string;
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    instructions: string[];
    testMode: boolean;
  };
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] ?? char
  );
}

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

async function postResend(payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === 're_placeholder') {
    console.warn('[bank-transfer] RESEND_API_KEY not configured — skipping email');
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    console.error(
      '[bank-transfer] Resend rejected an email:',
      response.status,
      await response.text().catch(() => '')
    );
  }
}

async function sendBankTransferEmails(args: EmailArgs): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || 'orders@catch-22.co.nz';
  const adminEmail = process.env.ADMIN_ORDER_EMAIL || 'orders@catch-22.co.nz';

  const name = escapeHtml(`${args.customer.firstName} ${args.customer.lastName}`.trim());
  const email = escapeHtml(args.customer.email);
  const phone = escapeHtml(args.customer.phone);
  const address = escapeHtml(
    [args.customer.address1, args.customer.address2, args.customer.city, args.customer.postcode]
      .filter(Boolean)
      .join(', ')
  );

  const itemRows = args.lines
    .map(
      (line) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid rgba(209,255,0,0.15);color:#fff;font-size:14px;">${escapeHtml(line.product_name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid rgba(209,255,0,0.15);color:#fff;font-size:14px;text-align:center;">${line.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid rgba(209,255,0,0.15);color:#D1FF00;font-size:14px;text-align:right;">${money(line.total)}</td>
      </tr>`
    )
    .join('');

  const discountRow =
    args.totals.discount > 0
      ? `<tr>
          <td colspan="2" style="padding:8px 12px;color:rgba(255,255,255,0.6);font-size:13px;">Discount</td>
          <td style="padding:8px 12px;color:#D1FF00;font-size:13px;text-align:right;">-${money(args.totals.discount)}</td>
        </tr>`
      : '';

  const shell = (heading: string, intro: string, body: string) => `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0A472E;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="padding:28px 40px;border-bottom:1px solid rgba(209,255,0,0.2);">
            <p style="margin:0;color:#D1FF00;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;">Catch-22 &middot; Premium Fishing Gear</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h2 style="margin:0 0 12px;color:#fff;font-size:22px;font-weight:900;">${heading}</h2>
            <p style="margin:0 0 24px;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.6;">${intro}</p>
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(209,255,0,0.2);text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.15em;">Catch-22 &middot; New Zealand</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const bankBlock = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:rgba(0,0,0,0.25);border-radius:8px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;color:#D1FF00;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;">Bank transfer details</p>
        <p style="margin:0 0 4px;color:#fff;font-size:14px;">${escapeHtml(args.bank.bankName)}</p>
        <p style="margin:0 0 4px;color:#fff;font-size:14px;">${escapeHtml(args.bank.accountName)}</p>
        <p style="margin:0 0 12px;color:#D1FF00;font-size:18px;font-weight:900;">${escapeHtml(args.bank.accountNumber)}</p>
        <p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:13px;">Reference</p>
        <p style="margin:0;color:#fff;font-size:16px;font-weight:900;">${escapeHtml(args.reference)}</p>
      </td></tr>
    </table>`;

  const orderBlock = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:rgba(0,0,0,0.25);border-radius:8px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;color:#D1FF00;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;">Order ${escapeHtml(args.reference)}</p>
        <p style="margin:0 0 4px;color:#fff;font-size:14px;">${name}</p>
        <p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:13px;">${email}</p>
        <p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:13px;">${phone}</p>
        <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">${address}</p>
      </td></tr>
    </table>`;

  const itemsBlock = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:rgba(0,0,0,0.25);border-radius:8px;">
      <tr>
        <td style="padding:12px 12px 4px;color:#D1FF00;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;">Item</td>
        <td style="padding:12px 12px 4px;color:#D1FF00;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;text-align:center;">Qty</td>
        <td style="padding:12px 12px 4px;color:#D1FF00;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;text-align:right;">Total</td>
      </tr>
      ${itemRows}
      <tr>
        <td colspan="2" style="padding:8px 12px;color:rgba(255,255,255,0.6);font-size:13px;">Shipping — ${escapeHtml(args.shippingName)}</td>
        <td style="padding:8px 12px;color:#fff;font-size:13px;text-align:right;">${money(args.totals.shipping)}</td>
      </tr>
      ${discountRow}
      <tr>
        <td colspan="2" style="padding:12px;color:rgba(255,255,255,0.6);font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Amount to pay</td>
        <td style="padding:12px;color:#D1FF00;font-size:16px;font-weight:900;text-align:right;">${money(args.totals.total)} NZD</td>
      </tr>
    </table>`;

  const instructions = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;background:rgba(0,0,0,0.25);border-radius:8px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;color:#D1FF00;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;">What happens next</p>
        ${args.bank.instructions
          .map(
            (line) =>
              `<p style="margin:0 0 6px;color:rgba(255,255,255,0.75);font-size:13px;line-height:1.5;">&bull; ${escapeHtml(line)}</p>`
          )
          .join('')}
      </td></tr>
    </table>`;

  // Customer confirmation — carries the payment instructions.
  const customerHtml = shell(
    'Your order is reserved',
    `Thanks ${name}! We have set aside your gear. Complete the bank transfer below and we will get it packed.`,
    bankBlock + itemsBlock + instructions
  );

  // Admin notification — flags that money is still outstanding.
  const adminHtml = shell(
    `Bank transfer order ${escapeHtml(args.reference)}`,
    `A new bank transfer order is waiting for payment of ${money(args.totals.total)} NZD. The order is <strong>on-hold</strong> until the funds land.`,
    orderBlock + itemsBlock + bankBlock
  );

  await Promise.allSettled([
    postResend({
      from,
      to: args.customer.email,
      subject: `Your Catch-22 order ${args.reference} — bank transfer details`,
      html: customerHtml,
    }),
    postResend({
      from,
      to: adminEmail,
      subject: `🎣 Bank transfer order ${args.reference} — ${money(args.totals.total)} NZD awaiting payment`,
      html: adminHtml,
    }),
  ]);
}
