'use client';

import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  AfterpayIcon,
  AmexIcon,
  ApplePayIcon,
  BankTransferIcon,
  EftposIcon,
  GooglePayIcon,
  KlarnaIcon,
  MastercardIcon,
  VisaIcon,
  ZipIcon,
} from '@/components/checkout/PaymentIcons';
import { NZPaymentOptionsGuide } from '@/components/checkout/NZPaymentOptionsGuide';
import { AfterpayInfoModal } from '@/components/checkout/AfterpayInfoModal';

export type NZPaymentCategory = 'card' | 'bnpl' | 'bank_transfer' | 'pickup';

interface NZPaymentMethodSelectorProps {
  total: number;
  promoCode?: string;
  shippingMethodId?: string;
  postcode?: string;
  onCheckoutStripe: (preferredMethod: 'card' | 'afterpay' | 'zip' | 'klarna') => Promise<void>;
  isLoading: boolean;
  className?: string;
}

export function NZPaymentMethodSelector({
  total,
  promoCode,
  shippingMethodId,
  postcode,
  onCheckoutStripe,
  isLoading,
  className = '',
}: NZPaymentMethodSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<NZPaymentCategory>('card');
  const [preferredBnpl, setPreferredBnpl] = useState<'afterpay' | 'zip' | 'klarna'>('afterpay');

  const instalment = total > 0 ? (total / 4).toFixed(2) : '0.00';
  const gstAmount = total > 0 ? ((total * 3) / 23).toFixed(2) : '0.00';

  const params = new URLSearchParams();
  if (promoCode) params.set('promo', promoCode);
  if (selectedCategory === 'pickup') {
    params.set('shipping', 'pickup');
  } else if (shippingMethodId) {
    params.set('shipping', shippingMethodId);
  }
  if (postcode) params.set('postcode', postcode);
  const paramStr = params.toString();
  const bankTransferHref = `/checkout/bank-transfer${paramStr ? `?${paramStr}` : ''}`;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Selection Tabs / Cards */}
      <div
        role="radiogroup"
        aria-label="New Zealand payment options"
        className="grid grid-cols-2 gap-2 sm:gap-2.5"
      >
        {/* 1. Cards & Digital Wallets */}
        <button
          type="button"
          role="radio"
          aria-checked={selectedCategory === 'card'}
          onClick={() => setSelectedCategory('card')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-300 relative cursor-pointer ${
            selectedCategory === 'card'
              ? 'border-secondary bg-white ring-2 ring-secondary/20 shadow-md'
              : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                selectedCategory === 'card'
                  ? 'bg-secondary text-white'
                  : 'bg-slate-100 text-secondary'
              }`}
            >
              <CreditCard size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
              Instant
            </span>
          </div>
          <span className="block text-xs font-black uppercase tracking-wide text-secondary truncate">
            Card &amp; Wallets
          </span>
          <span className="block text-[10px] font-medium text-slate-500 mt-0.5 truncate">
            Visa, Apple Pay, Google
          </span>
        </button>

        {/* 2. BNPL (Pay in 4) */}
        <button
          type="button"
          role="radio"
          aria-checked={selectedCategory === 'bnpl'}
          onClick={() => setSelectedCategory('bnpl')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-300 relative cursor-pointer ${
            selectedCategory === 'bnpl'
              ? 'border-secondary bg-[#B2FCE4]/20 ring-2 ring-secondary/20 shadow-md'
              : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors font-black text-xs ${
                selectedCategory === 'bnpl'
                  ? 'bg-[#1a1a1a] text-[#B2FCE4]'
                  : 'bg-[#B2FCE4]/60 text-secondary'
              }`}
            >
              4×
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider bg-[#B2FCE4] text-secondary px-1.5 py-0.5 rounded-full">
              0% Interest
            </span>
          </div>
          <span className="block text-xs font-black uppercase tracking-wide text-secondary truncate">
            Pay in 4 (BNPL)
          </span>
          <span className="block text-[10px] font-medium text-slate-600 mt-0.5 truncate">
            Afterpay, Zip, Klarna
          </span>
        </button>

        {/* 3. Direct NZ Bank Transfer */}
        <button
          type="button"
          role="radio"
          aria-checked={selectedCategory === 'bank_transfer'}
          onClick={() => setSelectedCategory('bank_transfer')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-300 relative cursor-pointer ${
            selectedCategory === 'bank_transfer'
              ? 'border-secondary bg-white ring-2 ring-secondary/20 shadow-md'
              : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                selectedCategory === 'bank_transfer'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              <Banknote size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
              0% Surcharge
            </span>
          </div>
          <span className="block text-xs font-black uppercase tracking-wide text-secondary truncate">
            Direct Bank Deposit
          </span>
          <span className="block text-[10px] font-medium text-slate-500 mt-0.5 truncate">
            ANZ, ASB, BNZ, Westpac
          </span>
        </button>

        {/* 4. Auckland Local Pick-up */}
        <button
          type="button"
          role="radio"
          aria-checked={selectedCategory === 'pickup'}
          onClick={() => setSelectedCategory('pickup')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-300 relative cursor-pointer ${
            selectedCategory === 'pickup'
              ? 'border-secondary bg-white ring-2 ring-secondary/20 shadow-md'
              : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                selectedCategory === 'pickup'
                  ? 'bg-primary text-secondary'
                  : 'bg-primary/20 text-secondary'
              }`}
            >
              <MapPin size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider bg-primary/30 text-secondary px-1.5 py-0.5 rounded-full">
              $0 Shipping
            </span>
          </div>
          <span className="block text-xs font-black uppercase tracking-wide text-secondary truncate">
            Auckland Pick-up
          </span>
          <span className="block text-[10px] font-medium text-slate-500 mt-0.5 truncate">
            Cash or EFTPOS in-store
          </span>
        </button>
      </div>

      {/* Selected Method Details Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Category 1: Cards & Wallets */}
        {selectedCategory === 'card' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-secondary">
                  Credit / Debit Card &amp; Wallets
                </h3>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Instant authorization, 0% surcharge, all New Zealand issued cards accepted.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Instant Dispatch
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <VisaIcon className="w-8 h-5 rounded" />
              <MastercardIcon className="w-8 h-5 rounded" />
              <AmexIcon className="w-8 h-5 rounded" />
              <ApplePayIcon className="w-10 h-5 rounded" />
              <GooglePayIcon className="w-10 h-5 rounded" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium pt-1">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-primary-ink shrink-0" />
                <span>Immediate order processing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-600 shrink-0" />
                <span>256-bit SSL encrypted</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onCheckoutStripe('card')}
              disabled={isLoading}
              className="w-full bg-secondary text-white rounded-2xl py-4 px-6 font-black uppercase tracking-[0.15em] text-sm hover:bg-primary hover:text-secondary transition-all duration-300 shadow-xl shadow-secondary/10 flex items-center justify-center gap-3 disabled:opacity-50 group cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Preparing Secure Checkout…</span>
                </>
              ) : (
                <>
                  <span>Pay ${total.toFixed(2)} with Card / Wallets</span>
                  <ArrowRight
                    size={16}
                    strokeWidth={3}
                    className="opacity-70 group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </div>
        )}

        {/* Category 2: Buy Now Pay Later */}
        {selectedCategory === 'bnpl' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-secondary">
                  4 Interest-Free Fortnightly Payments
                </h3>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Split your order into 4 equal instalments with zero interest and zero added fees.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  0% Interest
                </span>
                <AfterpayInfoModal price={total} />
              </div>
            </div>

            {/* Provider sub-selector */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Choose Provider:
              </span>
              <button
                type="button"
                onClick={() => setPreferredBnpl('afterpay')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-tight flex items-center gap-1.5 transition-all cursor-pointer ${
                  preferredBnpl === 'afterpay'
                    ? 'border-secondary bg-[#B2FCE4] text-secondary shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <AfterpayIcon className="w-12 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreferredBnpl('zip')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-tight flex items-center gap-1.5 transition-all cursor-pointer ${
                  preferredBnpl === 'zip'
                    ? 'border-secondary bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <ZipIcon className="w-10 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreferredBnpl('klarna')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-tight flex items-center gap-1.5 transition-all cursor-pointer ${
                  preferredBnpl === 'klarna'
                    ? 'border-secondary bg-[#FFB3C7] text-secondary shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <KlarnaIcon className="w-10 h-4" />
              </button>
            </div>

            {/* 4-payment timeline schedule */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-secondary uppercase tracking-wider border-b border-slate-200/60 pb-2">
                <span>Payment Schedule</span>
                <span className="text-primary-ink">4 × ${instalment} NZD</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="block text-[8px] font-black uppercase text-slate-400">
                    Due Today
                  </span>
                  <span className="block text-xs font-black text-secondary">${instalment}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="block text-[8px] font-black uppercase text-slate-400">
                    2 Weeks
                  </span>
                  <span className="block text-xs font-black text-secondary">${instalment}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="block text-[8px] font-black uppercase text-slate-400">
                    4 Weeks
                  </span>
                  <span className="block text-xs font-black text-secondary">${instalment}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="block text-[8px] font-black uppercase text-slate-400">
                    6 Weeks
                  </span>
                  <span className="block text-xs font-black text-secondary">${instalment}</span>
                </div>
              </div>
              <p className="text-[10px] font-medium text-slate-500 pt-1">
                ⚡ Your order ships immediately — you do not have to wait for instalments to clear!
              </p>
            </div>

            <button
              type="button"
              onClick={() => onCheckoutStripe(preferredBnpl)}
              disabled={isLoading}
              className="w-full bg-[#B2FCE4] text-secondary rounded-2xl py-4 px-6 font-black uppercase tracking-[0.15em] text-sm hover:brightness-95 transition-all duration-300 shadow-sm flex items-center justify-center gap-3 disabled:opacity-50 group cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-secondary" />
                  <span>Preparing BNPL Checkout…</span>
                </>
              ) : (
                <>
                  <span>
                    Pay 4 × ${instalment} with{' '}
                    {preferredBnpl === 'zip'
                      ? 'Zip'
                      : preferredBnpl === 'klarna'
                        ? 'Klarna'
                        : 'Afterpay'}
                  </span>
                  <ArrowRight
                    size={16}
                    strokeWidth={3}
                    className="opacity-70 group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </div>
        )}

        {/* Category 3: Direct Bank Deposit */}
        {selectedCategory === 'bank_transfer' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-secondary">
                  ANZ Direct Bank Deposit (Internet Banking)
                </h3>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Pay directly from your NZ banking app or portal. Zero card processing fees.
                </p>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                0% Surcharge
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-black uppercase tracking-wider text-[11px]">
                <BankTransferIcon className="w-7 h-4 rounded" />
                <span>Supported Banks &amp; Clearance Times</span>
              </div>
              <p className="text-emerald-800 font-medium text-[11px] leading-relaxed">
                • <strong>ANZ to ANZ:</strong> Clears instantly 24/7.
                <br />• <strong>ASB, BNZ, Westpac, Kiwibank, TSB:</strong> Clears in 1–2 hours under
                Payments NZ 365-day hourly settlement (7 days a week, including weekends).
              </p>
              <div className="pt-1 flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 size={12} strokeWidth={2.5} />
                <span>Your items are reserved immediately upon placing the order</span>
              </div>
            </div>

            <Link
              href={bankTransferHref}
              className="w-full bg-secondary text-white rounded-2xl py-4 px-6 font-black uppercase tracking-[0.15em] text-sm hover:bg-primary hover:text-secondary transition-all duration-300 shadow-xl shadow-secondary/10 flex items-center justify-center gap-3 group cursor-pointer"
            >
              <span>Continue to Bank Transfer (${total.toFixed(2)})</span>
              <ArrowRight
                size={16}
                strokeWidth={3}
                className="opacity-70 group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        )}

        {/* Category 4: Auckland Pick-up */}
        {selectedCategory === 'pickup' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-secondary">
                  Local Auckland Pick-up (Chatswood, North Shore)
                </h3>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Pick up your braid and tackle in person. $0 delivery fee.
                </p>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-primary/30 text-secondary px-2 py-0.5 rounded-full">
                $0 Shipping
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-secondary font-black uppercase tracking-wider text-[11px]">
                <EftposIcon className="w-7 h-4 rounded" />
                <span>Payment Options on Collection</span>
              </div>
              <p className="text-slate-600 font-medium text-[11px] leading-relaxed">
                Pay when you collect via <strong>EFTPOS terminal</strong> or <strong>Cash</strong>,
                or pay beforehand via direct bank transfer.
              </p>
              <div className="pt-1 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <Clock size={12} strokeWidth={2.5} />
                <span>Collections available Mon–Sat by arrangement</span>
              </div>
            </div>

            <Link
              href={bankTransferHref}
              className="w-full bg-white border-2 border-secondary text-secondary rounded-2xl py-4 px-6 font-black uppercase tracking-[0.15em] text-sm hover:bg-secondary hover:text-white transition-all duration-300 shadow-sm flex items-center justify-center gap-3 group cursor-pointer"
            >
              <span>Reserve for Pick-up (${total.toFixed(2)})</span>
              <ArrowRight
                size={16}
                strokeWidth={3}
                className="opacity-70 group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        )}

        {/* Trust & GST footnote */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-[10px] font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-primary-ink" />
            <span>Includes 15% NZ GST (${gstAmount} NZD)</span>
          </div>
          <NZPaymentOptionsGuide triggerVariant="link" className="text-[10px]" />
        </div>
      </div>
    </div>
  );
}
