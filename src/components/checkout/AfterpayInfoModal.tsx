'use client';

import { CheckCircle2, Info, ShieldCheck, Zap } from 'lucide-react';
import { AfterpayIcon } from '@/components/checkout/PaymentIcons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';

interface AfterpayInfoModalProps {
  price: number;
}

export function AfterpayInfoModal({ price }: AfterpayInfoModalProps) {
  const instalment = price > 0 ? (price / 4).toFixed(2) : '0.00';

  const schedule = [
    { step: '1st', label: 'Due today', amount: instalment },
    { step: '2nd', label: 'In 2 weeks', amount: instalment },
    { step: '3rd', label: 'In 4 weeks', amount: instalment },
    { step: '4th', label: 'In 6 weeks', amount: instalment },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Learn more about Afterpay instalments"
          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-secondary transition-colors underline underline-offset-2 ml-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary rounded"
        >
          <Info size={11} className="shrink-0" />
          <span>Info</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6 sm:p-8 bg-white text-secondary">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2 mb-1">
            <AfterpayIcon className="w-16 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              New Zealand
            </span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight text-secondary">
            Pay in 4 interest-free payments
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500">
            Split your purchase of{' '}
            <strong className="text-secondary font-black">${price.toFixed(2)} NZD</strong> into 4
            equal fortnightly instalments.
          </DialogDescription>
        </DialogHeader>

        {/* 4-step schedule */}
        <div className="my-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Your Payment Schedule
          </p>
          <div className="grid grid-cols-4 gap-2">
            {schedule.map((item, idx) => (
              <div
                key={item.step}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  idx === 0
                    ? 'bg-[#B2FCE4]/20 border-[#B2FCE4] shadow-sm'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                  {item.step}
                </span>
                <span className="block font-black text-sm text-secondary my-1">${item.amount}</span>
                <span className="block text-[8px] font-bold text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Value props */}
        <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-start gap-2.5">
            <Zap size={14} className="text-primary-ink shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-xs font-semibold text-slate-600 leading-snug">
              <strong className="text-secondary font-bold">Shipped right away:</strong> Your gear is
              dispatched immediately — no waiting for subsequent payments.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2
              size={14}
              className="text-emerald-600 shrink-0 mt-0.5"
              strokeWidth={2.5}
            />
            <p className="text-xs font-semibold text-slate-600 leading-snug">
              <strong className="text-secondary font-bold">0% interest:</strong> No additional fees
              or interest when paid on time.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={14} className="text-secondary shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-xs font-semibold text-slate-600 leading-snug">
              <strong className="text-secondary font-bold">What you need:</strong> 18+ years, NZ
              resident, and a valid NZ debit or credit card.
            </p>
          </div>
        </div>

        {/* Footer info link */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>Automatic scheduled payments</span>
          <a
            href="https://www.afterpay.com/en-NZ/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-secondary hover:text-primary-ink underline transition-colors"
          >
            Afterpay NZ Terms →
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
