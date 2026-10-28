import { ArrowLeft, Banknote, CreditCard, RefreshCw, XCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PaymentMethodStrip } from '@/components/checkout/PaymentIcons';

export const metadata: Metadata = {
  title: 'Checkout cancelled — Catch-22',
  description:
    'Your checkout was cancelled — no charges were made. Return to your cart or try a different payment method.',
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  return (
    <div className="min-h-[80vh] bg-white flex items-center justify-center px-4 pt-(--header-h) pb-16">
      <div className="max-w-lg w-full">
        {/* Main card */}
        <div className="bg-slate-50 p-8 sm:p-10 rounded-3xl shadow-sm text-center border border-slate-100">
          <div className="bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <XCircle className="w-10 h-10 text-rose-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-secondary uppercase tracking-tight mb-3">
            Checkout Cancelled
          </h1>
          <p className="text-slate-600 mb-8 font-medium leading-relaxed max-w-sm mx-auto">
            No charges were made. Your gear is still in the cart — try again whenever you&apos;re
            ready.
          </p>

          {/* Primary CTA */}
          <Link
            href="/cart"
            className="w-full inline-flex items-center justify-center gap-3 py-5 px-8 bg-secondary hover:bg-primary text-white hover:text-secondary font-black rounded-full transition-all duration-500 uppercase tracking-[0.15em] text-sm shadow-xl shadow-secondary/10 mb-4"
          >
            <RefreshCw size={16} strokeWidth={3} />
            Try Again
          </Link>

          {/* Alternative payment options */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Or try a different way to pay
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/checkout/bank-transfer"
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 hover:border-secondary hover:shadow-md transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Banknote size={18} strokeWidth={2.5} className="text-emerald-700" />
                </div>
                <span className="text-[10px] font-black text-secondary uppercase tracking-wider">
                  Bank Transfer
                </span>
                <span className="text-[9px] font-bold text-slate-400 normal-case">
                  0% surcharge
                </span>
              </Link>
              <Link
                href="/cart"
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 hover:border-secondary hover:shadow-md transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <CreditCard size={18} strokeWidth={2.5} className="text-blue-700" />
                </div>
                <span className="text-[10px] font-black text-secondary uppercase tracking-wider">
                  Different Card
                </span>
                <span className="text-[9px] font-bold text-slate-400 normal-case">
                  Visa, MC, Amex
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Trust signals below the card */}
        <div className="mt-6 flex flex-col items-center gap-4 text-center">
          <PaymentMethodStrip showBankAndEftpos={true} />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              🇳🇿 100% NZ Owned
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              🔒 Secure Checkout
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-secondary transition-colors"
            >
              Need help? Contact us
            </Link>
            <span className="text-slate-300">·</span>
            <Link
              href="/products"
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-secondary transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft size={10} strokeWidth={3} />
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
