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
  initialAmount?: number;
}

export function NZPaymentOptionsGuide({
  className = '',
  triggerVariant = 'link',
  initialAmount = 120,
}: NZPaymentOptionsGuideProps) {
  const [calcAmount, setCalcAmount] = useState<number>(initialAmount);

  const instalment = calcAmount > 0 ? (calcAmount / 4).toFixed(2) : '0.00';
  const gst = calcAmount > 0 ? ((calcAmount * 3) / 23).toFixed(2) : '0.00';

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
            <span>NZ Payment Options &amp; Clearance</span>
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

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-white text-secondary">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇳🇿</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-ink">
              New Zealand Checkout &amp; Payment Guide
            </span>
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-secondary">
            Payment Options &amp; Clearance
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500 normal-case tracking-normal">
            Catch-22 offers 100% surcharge-free payments across New Zealand cards, Buy Now Pay Later
            (Afterpay, Zip, Klarna), direct bank deposit (ANZ account), and local Auckland pick-up.
            All prices include 15% NZ GST.
          </DialogDescription>
        </DialogHeader>

        {/* Interactive Payment & Instalment Calculator */}
        <div className="my-5 p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-primary-ink" />
              <h3 className="text-xs font-black uppercase tracking-wider text-secondary">
                Interactive NZ Payment Calculator
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="calc-amount"
                className="text-[10px] font-bold text-slate-500 uppercase"
              >
                Order Value:
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  $
                </span>
                <input
                  id="calc-amount"
                  type="number"
                  min="1"
                  max="10000"
                  value={calcAmount || ''}
                  onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value)))}
                  className="w-24 pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-secondary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">
                Cards &amp; Wallets
              </span>
              <span className="block text-sm font-black text-secondary mt-0.5">
                ${calcAmount.toFixed(2)}
              </span>
              <span className="block text-[8px] font-bold text-emerald-600 mt-0.5">
                0% Surcharge
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">
                Afterpay / Zip / Klarna
              </span>
              <span className="block text-sm font-black text-secondary mt-0.5">
                4 × ${instalment}
              </span>
              <span className="block text-[8px] font-bold text-emerald-600 mt-0.5">
                0% Interest
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">
                Direct Bank Deposit
              </span>
              <span className="block text-sm font-black text-secondary mt-0.5">
                ${calcAmount.toFixed(2)}
              </span>
              <span className="block text-[8px] font-bold text-emerald-600 mt-0.5">
                All NZ Banks
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">
                Includes 15% GST
              </span>
              <span className="block text-sm font-black text-secondary mt-0.5">${gst}</span>
              <span className="block text-[8px] font-bold text-slate-500 mt-0.5">Tax Invoice</span>
            </div>
          </div>
        </div>

        {/* Detailed Methods Grid */}
        <div className="space-y-4">
          {/* 1. Credit / Debit Card & Digital Wallets */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-secondary text-white flex items-center justify-center">
                  <CreditCard size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wide text-secondary">
                    Credit / Debit Card &amp; Digital Wallets
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400">
                    Visa, Mastercard, Amex, Apple Pay, Google Pay, Link
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
              <AmexIcon className="w-8 h-5 rounded" />
              <ApplePayIcon className="w-10 h-5 rounded" />
              <GooglePayIcon className="w-10 h-5 rounded" />
              <span className="text-[10px] font-bold text-slate-400 ml-1">
                + Apple Pay &amp; Google Pay for 1-click checkout
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

          {/* 2. Buy Now Pay Later (Afterpay, Zip, Klarna) */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#B2FCE4] bg-[#B2FCE4]/10 hover:bg-[#B2FCE4]/15 transition-all space-y-3 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1a1a1a] text-[#B2FCE4] flex items-center justify-center font-black text-xs">
                  4×
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wide text-secondary">
                    Buy Now Pay Later: Afterpay, Zip &amp; Klarna
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500">
                    4 equal fortnightly interest-free payments · Gear dispatches immediately
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
              <ZipIcon className="w-11 h-5" />
              <KlarnaIcon className="w-12 h-5" />
              <span className="text-[10px] font-bold text-slate-500 ml-1">
                New Zealand&apos;s leading interest-free instalments
              </span>
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
                <span>Instant approval with any NZ card</span>
              </div>
            </div>
          </div>

          {/* 3. Direct Bank Transfer (ANZ Internet Banking) */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                  <Banknote size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wide text-secondary">
                    Direct NZ Bank Transfer (Internet Banking)
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400">
                    ANZ Bank Account-to-Account · 0% Surcharge · No credit card required
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
                &middot; Co-op &middot; Heartland
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-2 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-primary-ink shrink-0" />
                <span>ANZ &rarr; ANZ: Clears instantly 24/7</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-secondary shrink-0" />
                <span>Other NZ banks: 1–2 hours (365 days)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                <span>Order held immediately upon submit</span>
              </div>
            </div>
          </div>

          {/* 4. Auckland Local Pick-up */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs">
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
                    Chatswood, North Shore Auckland · Cash or EFTPOS terminal
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
                Inspect gear before payment &middot; Contactless EFTPOS accepted on collection
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-2 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-primary-ink shrink-0" />
                <span>Chatswood, North Shore</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-secondary shrink-0" />
                <span>Mon–Sat by arrangement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>Zero online card details required</span>
              </div>
            </div>
          </div>
        </div>

        {/* NZ Comparison & Clearance Summary Table */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-black uppercase tracking-wider text-secondary mb-3">
            Quick Comparison &amp; Clearance Speeds
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[9px] font-black">
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 pr-3">Clearance Speed</th>
                  <th className="py-2 pr-3">Surcharge</th>
                  <th className="py-2 pr-3">Limits</th>
                  <th className="py-2">Ideal For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                <tr>
                  <td className="py-2.5 pr-3 font-black text-secondary">Cards &amp; Wallets</td>
                  <td className="py-2.5 pr-3 text-emerald-700 font-bold">Instant</td>
                  <td className="py-2.5 pr-3 text-emerald-700 font-bold">0%</td>
                  <td className="py-2.5 pr-3">Any amount</td>
                  <td className="py-2.5">Fastest dispatch</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-black text-secondary">Afterpay / Zip / Klarna</td>
                  <td className="py-2.5 pr-3 text-emerald-700 font-bold">Instant Dispatch</td>
                  <td className="py-2.5 pr-3 text-emerald-700 font-bold">0% Interest</td>
                  <td className="py-2.5 pr-3">$50–$2,000</td>
                  <td className="py-2.5">Splitting across paydays</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-black text-secondary">Direct Bank Deposit</td>
                  <td className="py-2.5 pr-3">Instant (ANZ) or 1–2h (Other banks)</td>
                  <td className="py-2.5 pr-3 text-emerald-700 font-bold">0%</td>
                  <td className="py-2.5 pr-3">Any amount</td>
                  <td className="py-2.5">High-value &amp; commercial charter orders</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-black text-secondary">Auckland Pick-up</td>
                  <td className="py-2.5 pr-3">On collection</td>
                  <td className="py-2.5 pr-3 text-emerald-700 font-bold">0% ($0 shipping)</td>
                  <td className="py-2.5 pr-3">Any amount</td>
                  <td className="py-2.5">Auckland locals, same-day tackle</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* NZ Trust & Legal Guarantee */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-900 text-white space-y-2">
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
