import { CheckCircle2, Clock3, MapPin, Package, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Stripe from 'stripe';
import { ClearCartOnMount } from '@/components/checkout/ClearCartOnMount';
import { PrintButton } from '@/components/checkout/PrintButton';
import { SHIPPING_RATES } from '@/config/shipping';
import { env } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase-server';
import { formatAddress, formatDate, formatNZD, type ShippingAddress } from '@/types/orders';

export const metadata: Metadata = {
  title: 'Order confirmed — Catch-22',
  description: 'Your Catch-22 order is confirmed.',
  robots: { index: false, follow: false },
};

// Request-time receipt lookup — nothing here is prerenderable.
export const instant = false;

const STRIPE_API_VERSION = '2026-08-26.dahlia' as const;

type OrderSummary = {
  id: number;
  status: string | null;
  total_amount: number | null;
  created_at: string | null;
};

type Receipt = {
  session: Stripe.Checkout.Session;
  order: OrderSummary | null;
};

async function loadReceipt(sessionId: string): Promise<Receipt | null> {
  if (!env.STRIPE_SECRET_KEY) return null;

  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    let order: OrderSummary | null = null;
    try {
      const admin = await createAdminClient();
      const { data } = await admin
        .from('orders')
        .select('id, status, total_amount, created_at')
        .eq('stripe_session_id', session.id)
        .maybeSingle();
      order = data;
    } catch (error) {
      // The receipt is still useful without the database row (webhook may lag).
      console.warn('[success] Order lookup failed:', error);
    }

    return { session, order };
  } catch (error) {
    console.error('[success] Could not load Stripe session:', error);
    return null;
  }
}

function cents(value: number | null | undefined): number {
  return (value ?? 0) / 100;
}

function deliveryLabel(shippingCents: number): string | null {
  const rate = SHIPPING_RATES.find((candidate) => candidate.amount === shippingCents);
  return rate?.displayEstimate ?? null;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const receipt = sessionId ? await loadReceipt(sessionId) : null;

  if (!receipt) {
    return (
      <div className="min-h-[80vh] bg-white flex items-center justify-center px-4 pt-(--header-h) pb-16">
        <div className="max-w-md w-full bg-slate-50 p-10 rounded-3xl shadow-sm text-center border border-slate-100">
          <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
            <Package className="w-12 h-12 text-slate-400" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-secondary uppercase tracking-tight mb-4">
            Order lookup
          </h1>
          <p className="text-slate-600 mb-10 font-medium leading-relaxed">
            We couldn&apos;t find that checkout in this browser. If you have just paid, your receipt
            is on its way by email — otherwise our team can find it for you.
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href="/products"
              className="w-full inline-block py-5 px-8 bg-primary hover:bg-primary-dark text-secondary font-black rounded-full transition-all uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/20"
            >
              Continue Shopping
            </Link>
            <Link
              href="/contact"
              className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-secondary transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { session, order } = receipt;
  const isPaid =
    session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
  const isPending = session.payment_status === 'unpaid';

  const reference = order ? `CATCH22-${order.id}` : session.id.slice(-8).toUpperCase();
  const items = session.line_items?.data ?? [];
  const subtotal = cents(session.amount_subtotal);
  const discount = cents(session.total_details?.amount_discount);
  const shipping = cents(session.shipping_cost?.amount_total);
  const total = cents(session.amount_total);
  const shippingAddress =
    (session.collected_information?.shipping_details?.address as ShippingAddress | null) ?? null;
  const email = session.customer_details?.email ?? null;
  const estimate = deliveryLabel(session.shipping_cost?.amount_total ?? 0);

  const timeline = [
    { label: 'Order confirmed', detail: 'Payment received', done: true, icon: CheckCircle2 },
    { label: 'Packed', detail: 'Within 1 business day', done: false, icon: Package },
    { label: 'On its way', detail: estimate ?? 'Tracked delivery', done: false, icon: Truck },
    { label: 'Delivered', detail: 'Signature optional', done: false, icon: MapPin },
  ];

  return (
    <div className="min-h-[80vh] bg-white pt-(--header-h) pb-16 print:pt-0">
      {isPaid && <ClearCartOnMount />}

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Confirmation header */}
        <header className="text-center mb-10 print:mb-6">
          {/* Celebratory ring burst */}
          {isPaid && (
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div
                className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
                style={{ animationDuration: '2s', animationIterationCount: 1 }}
              />
              <div className="absolute inset-2 rounded-full bg-primary/10" />
              <div className="absolute inset-0 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-14 h-14 text-emerald-600" strokeWidth={2} />
              </div>
            </div>
          )}
          {isPending && (
            <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Clock3 className="w-12 h-12 text-amber-600" strokeWidth={2.5} />
            </div>
          )}

          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">
            {isPending ? 'Payment processing' : 'Payment received'}
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-secondary uppercase tracking-tight">
            {isPending ? 'Order received' : 'Order confirmed'}
          </h1>
          <div className="h-1.5 w-24 bg-primary mx-auto mt-4" />
          <p className="mt-5 text-slate-600 font-medium leading-relaxed max-w-lg mx-auto">
            {isPending
              ? "We've got your order. Your bank is still confirming the payment — we'll email you the moment it clears."
              : "Thanks for choosing Catch-22. We're packing your gear and will email tracking as soon as it leaves the dock."}
          </p>

          {/* Sea Cleaners badge */}
          {isPaid && (
            <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
              <span className="text-emerald-600 text-lg">🌊</span>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                2.5% of this order goes to NZ Sea Cleaners
              </span>
            </div>
          )}
        </header>

        {/* Receipt card */}
        <section
          aria-labelledby="receipt-heading"
          className="rounded-3xl border border-slate-100 bg-slate-50 overflow-hidden shadow-sm mb-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
            <div>
              <h2
                id="receipt-heading"
                className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]"
              >
                Order
              </h2>
              <p className="text-xl font-black text-secondary tracking-tight mt-1">{reference}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
                Placed
              </p>
              <p className="text-sm font-bold text-secondary mt-1">
                {formatDate(new Date((session.created ?? Date.now() / 1000) * 1000).toISOString())}
              </p>
            </div>
            <div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                  isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isPending ? 'Processing' : (order?.status ?? 'Processing')}
              </span>
            </div>
          </div>

          {items.length > 0 && (
            <ul className="divide-y divide-slate-200 px-6 sm:px-8" aria-label="Items purchased">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-secondary uppercase tracking-wide leading-snug">
                      {item.description}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-black text-secondary tabular-nums whitespace-nowrap">
                    {formatNZD(cents(item.amount_total))}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <dl className="border-t border-slate-200 px-6 sm:px-8 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Subtotal
              </dt>
              <dd className="text-sm font-black text-secondary tabular-nums">
                {formatNZD(subtotal)}
              </dd>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Discount
                </dt>
                <dd className="text-sm font-black text-primary-ink tabular-nums">
                  −{formatNZD(discount)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Shipping
              </dt>
              <dd className="text-sm font-black text-secondary tabular-nums">
                {shipping === 0 ? 'Free / pickup' : formatNZD(shipping)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <dt className="text-lg font-black text-secondary uppercase tracking-tight">
                Total paid
              </dt>
              <dd className="text-2xl font-black text-secondary tracking-tighter tabular-nums">
                {formatNZD(total)} NZD
              </dd>
            </div>
            <p className="text-[10px] text-slate-400 font-medium text-right">
              Includes NZ GST. A paid invoice is attached to your receipt email.
            </p>
          </dl>
        </section>

        {/* Shipping + timeline */}
        <div className="grid gap-6 sm:grid-cols-2 mb-10">
          <section className="rounded-3xl border border-slate-100 bg-white p-6">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">
              Delivery address
            </h2>
            <p className="text-sm font-bold text-secondary leading-relaxed">
              {shippingAddress ? formatAddress(shippingAddress) : 'Address confirmed at checkout'}
            </p>
            {email && <p className="mt-3 text-xs font-medium text-slate-500 break-all">{email}</p>}
            {estimate && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                <Truck size={12} strokeWidth={2.5} />
                {estimate}
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white p-6">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4">
              What happens next
            </h2>
            <ol className="space-y-3">
              {timeline.map(({ label, detail, done, icon: Icon }) => (
                <li key={label} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      done ? 'bg-primary text-secondary' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon size={12} strokeWidth={3} />
                  </span>
                  <span>
                    <span
                      className={`block text-xs font-black uppercase tracking-wide ${
                        done ? 'text-secondary' : 'text-slate-500'
                      }`}
                    >
                      {label}
                    </span>
                    <span className="block text-[10px] font-medium text-slate-400">{detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
          <Link
            href="/products"
            className="flex-1 inline-flex items-center justify-center rounded-full bg-primary px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-secondary transition-all hover:bg-primary-dark"
          >
            Continue Shopping
          </Link>
          <PrintButton />
        </div>

        <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest print:mt-4">
          2.5% of this order is donated to NZ Sea Cleaners Charity Trust
        </p>
        <p className="mt-2 text-center text-[10px] font-medium text-slate-400 print:hidden">
          Need a hand?{' '}
          <Link href="/contact" className="underline hover:text-secondary transition-colors">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
