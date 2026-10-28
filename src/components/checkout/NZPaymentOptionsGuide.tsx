'use client';

import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  HelpCircle,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  AfterpayIcon,
  BankTransferIcon,
  EftposIcon,
  KlarnaIcon,
  MastercardIcon,
  VisaIcon,
} from '@/components/checkout/PaymentIcons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';

interface NZPaymentOptionsGuideProps {
  className?: string;
  triggerVariant?: 'button' | 'link' | 'badge';
}

export function NZPaymentOptionsGuide({
  className = '',
  triggerVariant = 'link',
}: NZPaymentOptionsGuideProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerVariant === 'button' ? (
          <button
            type="button"
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-secondary text-xs font-black text-secondary uppercase tracking-wider transition-all shadow-xs cursor-pointer ${className}`}
          >
            <HelpCircle size={14} className="text-primary-ink" strokeWidth={2.5} />
            <span>Compare NZ Payment Methods</span>
          </button>
        ) : triggerVariant === 'badge' ? (
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider transition-colors cursor-pointer ${className}`}
          >
            <Sparkles size={11} className="text-primary-ink" strokeWidth={2.5} />
            <span>NZ Payment Options</span>
          </button>
        ) : (
          <button
            type="button"
            className={`inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-secondary underline underline-offset-2 transition-colors cursor-pointer ${className}`}
          >
            <HelpCircle size={13} className="shrink-0 text-primary-ink" />
            <span>Compare NZ Payment Methods &amp; Clearance Times</span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto p-6 sm:p-8 bg-white text-secondary">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇳🇿</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-ink">
              New Zealand Checkout Guide
            </span>
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-secondary">
            Payment Options &amp; Clearance
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500 normal-case tracking-normal">
            Choose the method that works best for you. All payments are 100% surcharge-free and
            priced in NZD with 15% GST included.
          </DialogDescription>
        </DialogHeader>

        {/* Comparison grid */}
        <div className="my-6 space-y-4">
          {/* 1. Credit / Debit Card & Digital Wallets */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-secondary text-white flex items-center justify-center">
                  <CreditCard size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wide text-secondary">
                    Credit / Debit Card &amp; Wallets
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400">
                    Visa, Mastercard, Amex, Apple Pay, Google Pay
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Instant Dispatch
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  0% Surcharge
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <VisaIcon className="w-8 h-5 rounded" />
              <MastercardIcon className="w-8 h-5 rounded" />
              <span className="text-[10px] font-bold text-slate-400 ml-1">
                + Apple Pay &amp; Google Pay on supported devices
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-2 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-primary-ink shrink-0" />
                <span>Instant payment clearance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-600 shrink-0" />
                <span>3-D Secure / 256-bit SSL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-secondary shrink-0" />
                <span>All NZ banks accepted</span>
              </div>
            </div>
          </div>

          {/* 2. Afterpay & Klarna (BNPL) */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#B2FCE4] bg-[#B2FCE4]/10 hover:bg-[#B2FCE4]/15 transition-all space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1a1a1a] text-[#B2FCE4] flex items-center justify-center font-black text-xs">
                  4×
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wide text-secondary">
                    Afterpay &amp; Klarna (Pay in 4)
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500">
                    4 equal fortnightly interest-free payments
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  0% Interest
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B2FCE4] text-secondary">
                  $50 – $2,000 NZD
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AfterpayIcon className="w-14 h-5" />
              <KlarnaIcon className="w-12 h-5" />
            </div>

            <div className="grid sm:grid-cols-3 gap-2 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-primary-ink shrink-0" />
                <span>Gear dispatched immediately</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-secondary shrink-0" />
                <span>1st payment today, then 2, 4, 6 wks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>NZ debit/credit card</span>
              </div>
            </div>
          </div>

          {/* 3. Direct Bank Transfer (ANZ Internet Banking) */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                  <Banknote size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wide text-secondary">
                    Direct NZ Bank Transfer
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400">
                    ANZ Internet Banking (Account-to-Account)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  0% Surcharge
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  No Card Needed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BankTransferIcon className="w-9 h-5 rounded" />
              <span className="text-[10px] font-bold text-slate-500">
                ANZ &middot; ASB &middot; BNZ &middot; Westpac &middot; Kiwibank &middot; TSB
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-2 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-primary-ink shrink-0" />
                <span>ANZ &rarr; ANZ: Instant clearance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-secondary shrink-0" />
                <span>Other NZ banks: 1–2 hours (365 days)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                <span>Order held immediately</span>
              </div>
            </div>
          </div>

          {/* 4. Auckland Local Pick-up */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary text-secondary flex items-center justify-center">
                  <MapPin size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wide text-secondary">
                    Auckland Pick-up (Pay on Collection)
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400">
                    Chatswood, North Shore Auckland
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  $0 Shipping
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/30 text-secondary">
                  Cash or EFTPOS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <EftposIcon className="w-9 h-5 rounded" />
              <span className="text-[10px] font-bold text-slate-500">
                Inspect gear before payment &middot; Contactless EFTPOS accepted
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-2 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-primary-ink shrink-0" />
                <span>Chatswood, North Shore</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-secondary shrink-0" />
                <span>Mon–Sat, 8am–6pm by appt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>No cards required online</span>
              </div>
            </div>
          </div>
        </div>

        {/* NZ Trust & Legal Guarantee */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <span className="text-xs font-black uppercase tracking-wider text-primary">
              The Catch-22 NZ Commitment
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Catch-22 is 100% New Zealand owned and operated. Every transaction complies with the{' '}
            <strong className="text-white">Consumer Guarantees Act 1993</strong> and{' '}
            <strong className="text-white">Fair Trading Act 1986</strong>. 2.5% of every order is
            donated to <strong className="text-primary">NZ Sea Cleaners</strong> to protect our
            oceans.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
