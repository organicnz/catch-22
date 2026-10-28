'use client';

import {
  ArrowRight,
  Banknote,
  CheckCircle,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { AfterpayInfoModal } from '@/components/checkout/AfterpayInfoModal';
import { NZCheckoutConfidence } from '@/components/checkout/NZCheckoutConfidence';
import { NZPaymentOptionsGuide } from '@/components/checkout/NZPaymentOptionsGuide';
import { AfterpayIcon, PaymentMethodStrip } from '@/components/checkout/PaymentIcons';
import {
  PaymentRecommendationBadge,
  PaymentRecommendationStrip,
} from '@/components/checkout/PaymentRecommendation';
import { StripeExpressCheckout } from '@/components/checkout/StripeExpressCheckout';
import { SHIPPING_RATES } from '@/config/shipping';
import { previewPromoCodeAction } from '@/lib/actions/promo';
import { MAX_ITEM_QUANTITY, useCartStore } from '@/lib/store/cart';
import { getStorageUrl } from '@/lib/supabase';

/** No-op store subscription: hydration state never changes after mount. */
const emptySubscribe = () => () => {};

function AfterpayBadge({ total }: { total: number }) {
  const instalment = total / 4;
  if (total < 1) return null;
  return (
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
      4 × <span className="text-secondary">${instalment.toFixed(2)}</span> interest-free
    </span>
  );
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{
    code: string;
    discount: number;
    label: string;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const subtotal = totalPrice();
  const discount = promoApplied?.discount ?? 0;
  const orderTotal = Math.max(0, subtotal - discount);

  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) return;
    setPromoError('');
    setPromoLoading(true);
    try {
      const result = await previewPromoCodeAction({
        code,
        items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
      });
      if (result.ok) {
        setPromoApplied({ code: result.code, discount: result.discount, label: result.label });
        toast.success(`Promo applied — ${result.label}`);
      } else {
        setPromoError(result.error);
        setPromoApplied(null);
      }
    } catch {
      setPromoError('Could not check that code — try again.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleCheckout = async (preferredMethod: 'card' | 'afterpay' = 'card') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
          promoCode: promoApplied?.code ?? promoCode.trim(),
          preferredMethod,
        }),
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (response.status === 409 && data.productId) {
        removeItem(data.productId);
        toast.error(data.error || 'An item sold out and was removed from your cart.');
        return;
      }
      if (response.status === 429) {
        const retry = Number(response.headers.get('Retry-After')) || 30;
        toast.error(`Too many attempts — try again in ${retry}s.`);
        return;
      }
      toast.error(data.error || 'Something went wrong starting checkout.');
    } catch {
      toast.error('Checkout failed — check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="bg-white min-h-screen pt-(--header-h) pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-10 w-48 bg-slate-100 rounded mb-8" />
          <div className="space-y-4">
            {['tall', 'medium', 'short'].map((row) => (
              <div key={row} className="h-28 bg-slate-50 rounded-3xl border border-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white min-h-[70vh] flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-8">
          <Banknote size={36} className="text-slate-300" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-black text-secondary uppercase tracking-tight mb-4">
          Your Cart is Empty
        </h1>
        <p className="text-slate-500 font-medium mb-10 max-w-sm leading-relaxed">
          Looks like you haven&apos;t added any gear yet. Let&apos;s get you equipped.
        </p>
        <Link
          href="/products"
          className="inline-block bg-secondary text-white hover:bg-primary hover:text-secondary font-black py-4 px-10 rounded-full transition-all duration-500 uppercase tracking-widest text-sm shadow-xl shadow-secondary/10"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-(--header-h) pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mb-10">
          <h1 className="text-4xl font-black tracking-tight text-secondary uppercase">Your Cart</h1>
          <div className="h-1.5 w-24 bg-primary mt-3" />
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          {/* ── Items ── */}
          <div className="lg:col-span-7">
            <ul className="border-t border-slate-100 divide-y divide-slate-100">
              {items.map((item) => (
                <li key={item.id} className="flex py-8 sm:py-10 group">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 sm:w-36 sm:h-36 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden shadow-sm transition-shadow group-hover:shadow-md">
                      {item.image_url ? (
                        <Image
                          src={getStorageUrl(item.image_url)}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-black uppercase tracking-widest text-[10px]">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-6 flex-1 flex flex-col justify-between">
                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                      <div>
                        <h3 className="text-md sm:text-lg">
                          <Link
                            href={`/products/${item.slug}`}
                            className="font-black text-secondary hover:text-primary-ink transition-colors uppercase leading-tight"
                          >
                            {item.name}
                          </Link>
                        </h3>
                        <p className="mt-2 text-xl font-black text-primary-ink">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-6 sm:mt-0 sm:pr-9">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full w-min p-1 shadow-inner">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="p-2 text-secondary hover:text-primary-ink transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} strokeWidth={3} />
                          </button>
                          <span className="px-4 text-sm font-black text-secondary">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.min(item.quantity + 1, MAX_ITEM_QUANTITY)
                              )
                            }
                            disabled={item.quantity >= MAX_ITEM_QUANTITY}
                            className="p-2 text-secondary hover:text-primary-ink transition-colors disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} strokeWidth={3} />
                          </button>
                        </div>

                        <div className="absolute top-0 right-0">
                          <button
                            type="button"
                            className="-m-2 p-2 inline-flex text-slate-300 hover:text-rose-500 transition-colors duration-300"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <Trash2 size={20} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Continue shopping */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-secondary transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* ── Order Summary ── */}
          <section aria-label="Order Summary" className="mt-16 lg:mt-0 lg:col-span-5 sticky top-24">
            <div className="bg-slate-50 rounded-3xl px-6 py-8 sm:p-8 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-black text-secondary uppercase tracking-widest mb-6 border-b-2 border-primary pb-3 inline-block">
                Order Summary
              </h2>

              {/* Totals */}
              <dl className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <dt className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Subtotal
                  </dt>
                  <dd className="text-sm font-black text-secondary">${subtotal.toFixed(2)}</dd>
                </div>

                {promoApplied && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <dt className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                      <Tag size={12} strokeWidth={2.5} />
                      {promoApplied.code}
                    </dt>
                    <dd className="text-sm font-black">−${promoApplied.discount.toFixed(2)}</dd>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <dt className="text-xs font-black text-slate-500 uppercase tracking-widest mt-0.5">
                    Shipping
                  </dt>
                  <dd className="text-right">
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest block">
                      Calculated at Checkout
                    </span>
                    <Link
                      href="/shipping-returns"
                      className="text-[10px] text-slate-400 font-medium underline hover:text-primary-ink transition-colors mt-0.5 inline-block"
                    >
                      From{' '}
                      {SHIPPING_RATES.find((r) => r.id === 'standard')?.displayPrice || '$8.00'} or
                      free pickup
                    </Link>
                  </dd>
                </div>

                <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                  <dt className="text-xl font-black text-secondary uppercase tracking-tight">
                    Order total
                  </dt>
                  <dd className="text-3xl font-black text-secondary tracking-tighter tabular-nums">
                    ${orderTotal.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 -mt-2">
                  <span>Includes 15% NZ GST</span>
                  <span className="tabular-nums">${((orderTotal * 3) / 23).toFixed(2)} NZD</span>
                </div>
              </dl>

              {/* Promo code */}
              <div className="mb-6">
                {promoApplied ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle size={14} strokeWidth={2.5} />
                      <span className="text-xs font-black uppercase tracking-widest">
                        {promoApplied.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      aria-label="Remove promo code"
                      className="text-emerald-600 hover:text-emerald-800 transition-colors"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <>
                    <label
                      htmlFor="promo"
                      className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                    >
                      Promo Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="promo"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApplyPromo();
                        }}
                        placeholder="ENTER CODE"
                        className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoCode.trim()}
                        className="bg-secondary text-white px-5 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-secondary transition-all duration-300 disabled:opacity-40 whitespace-nowrap flex items-center gap-2"
                      >
                        {promoLoading && <Loader2 size={12} className="animate-spin" />}
                        Apply
                      </button>
                    </div>
                    {promoError && (
                      <p className="mt-2 ml-1 text-xs font-bold text-rose-600">{promoError}</p>
                    )}
                  </>
                )}
              </div>

              {/* ── Smart Payment Recommendation ── */}
              <PaymentRecommendationStrip total={orderTotal} />

              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Choose payment method
                </span>
                <NZPaymentOptionsGuide triggerVariant="link" />
              </div>

              {/* ── Payment methods ── */}
              <div className="space-y-3">
                {/* Card + Digital Wallets via Stripe */}
                <button
                  type="button"
                  onClick={() => handleCheckout('card')}
                  disabled={isLoading}
                  className="w-full bg-secondary text-white rounded-2xl py-5 px-6 font-black uppercase tracking-[0.15em] hover:bg-primary hover:text-secondary transition-all duration-500 shadow-xl shadow-secondary/10 flex items-center gap-4 disabled:opacity-50 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-secondary/10 flex items-center justify-center shrink-0 transition-colors">
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CreditCard size={18} strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 text-sm leading-tight">
                      {isLoading ? 'Processing…' : 'Credit or Debit Card'}
                      <PaymentRecommendationBadge method="card" total={orderTotal} />
                    </div>
                    <div className="text-[10px] font-bold opacity-60 mt-0.5 normal-case tracking-normal">
                      NZ Visa, Mastercard, Amex, Apple Pay, Google Pay
                    </div>
                  </div>
                  <ArrowRight size={16} strokeWidth={3} className="opacity-60" />
                </button>

                {/* Afterpay & Klarna (BNPL) */}
                <button
                  type="button"
                  onClick={() => handleCheckout('afterpay')}
                  disabled={isLoading}
                  className="w-full bg-[#B2FCE4] text-[#1a1a1a] rounded-2xl py-5 px-6 font-black uppercase tracking-[0.15em] hover:brightness-95 transition-all duration-300 flex items-center gap-4 disabled:opacity-50 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin text-[#1a1a1a]" />
                    ) : (
                      <AfterpayIcon className="w-14 h-5" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm leading-tight">
                        {isLoading ? 'Processing…' : 'Afterpay & Klarna'}
                      </span>
                      <PaymentRecommendationBadge method="afterpay" total={orderTotal} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold opacity-70 mt-0.5 normal-case tracking-normal">
                      <AfterpayBadge total={orderTotal} />
                      <AfterpayInfoModal price={orderTotal} />
                    </div>
                  </div>
                  <ArrowRight size={16} strokeWidth={3} className="opacity-50" />
                </button>

                {/* Bank Transfer & Pay on Pick-up */}
                <Link
                  href={`/checkout/bank-transfer${promoApplied ? `?promo=${promoApplied.code}` : ''}`}
                  className="w-full bg-white border-2 border-slate-200 text-secondary rounded-2xl py-5 px-6 font-black uppercase tracking-[0.15em] hover:border-secondary transition-all duration-300 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Banknote size={18} strokeWidth={2.5} className="text-secondary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm leading-tight">Bank Transfer / Pay on Pick-up</span>
                      <PaymentRecommendationBadge method="bank" total={orderTotal} />
                      <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        0% Surcharge
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 mt-0.5 normal-case tracking-normal">
                      ANZ internet banking · Or cash / EFTPOS on Auckland collection
                    </div>
                  </div>
                  <ArrowRight size={16} strokeWidth={3} className="opacity-40" />
                </Link>
              </div>

              {/* Express checkout (Apple/Google Pay) */}
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2 my-4">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Express
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>
                <StripeExpressCheckout promoCode={promoApplied?.code} />
              </div>

              {/* Trust signals — NZ Checkout Confidence */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                <PaymentMethodStrip showBankAndEftpos={true} className="justify-center" />
                <NZCheckoutConfidence variant="compact" />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── Mobile sticky checkout bar ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3 safe-area-pb">
        <div className="max-w-lg mx-auto">
          {/* Afterpay instalment preview */}
          {orderTotal >= 50 && orderTotal <= 2000 && (
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <span className="text-[9px] font-black text-[#1a1a1a] bg-[#B2FCE4]/50 px-1.5 py-0.5 rounded uppercase tracking-tight">
                afterpay
              </span>
              <span className="text-[9px] font-bold text-slate-500">
                4 × ${(orderTotal / 4).toFixed(2)} interest-free
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Total
              </p>
              <p className="text-lg font-black text-secondary tracking-tighter tabular-nums">
                ${orderTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href={`/checkout/bank-transfer${promoApplied ? `?promo=${promoApplied.code}` : ''}`}
                title="Bank transfer or Auckland pick-up (0% surcharge)"
                className="bg-white border border-slate-200 text-secondary rounded-full py-2.5 px-2.5 hover:border-secondary transition-all shadow-sm shrink-0"
              >
                <Banknote size={16} strokeWidth={2.5} />
              </Link>
              <button
                type="button"
                onClick={() => handleCheckout('afterpay')}
                disabled={isLoading}
                title="Checkout with Afterpay (4 instalments)"
                className="bg-[#B2FCE4] text-secondary rounded-full py-2.5 px-3 font-black uppercase text-[9px] tracking-wider hover:brightness-95 transition-all shadow-sm flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                <span className="font-black tracking-tight">afterpay</span>
              </button>
              <button
                type="button"
                onClick={() => handleCheckout('card')}
                disabled={isLoading}
                className="bg-secondary text-white rounded-full py-2.5 px-4 font-black uppercase tracking-[0.1em] text-xs hover:bg-primary hover:text-secondary transition-all duration-500 shadow-lg shadow-secondary/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShoppingBag size={16} strokeWidth={2.5} />
                )}
                {isLoading ? '…' : 'Pay'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for mobile sticky bar */}
      <div className="h-28 lg:hidden" />
    </div>
  );
}
