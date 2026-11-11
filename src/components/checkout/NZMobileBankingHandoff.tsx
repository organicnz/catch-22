'use client';

import { Check, Copy, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface NZMobileBankingHandoffProps {
  reference: string;
  total: number;
  accountNumber: string;
  accountName: string;
  bankName: string;
  className?: string;
}

export function NZMobileBankingHandoff({
  reference,
  total,
  accountNumber,
  accountName,
  bankName,
  className = '',
}: NZMobileBankingHandoffProps) {
  const [copied, setCopied] = useState(false);

  // Formatted string designed for quick paste into NZ banking apps
  const bankingString = `${accountNumber} | ${accountName} (${bankName}) | $${total.toFixed(2)} | Ref: ${reference}`;

  const copyPayString = async () => {
    try {
      await navigator.clipboard.writeText(bankingString);
      setCopied(true);
      toast.success('Mobile banking summary copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard.');
    }
  };

  return (
    <div
      className={`bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-primary/20 shadow-xl ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-secondary flex items-center justify-center">
            <Smartphone size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wide text-white">
              Pay on your mobile banking app
            </h4>
            <p className="text-[10px] font-bold text-slate-400">
              ANZ &middot; ASB &middot; BNZ &middot; Westpac &middot; Kiwibank
            </p>
          </div>
        </div>
      </div>

      {/* Quick copy one-liner */}
      <div className="bg-black/30 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-3">
        <div className="min-w-0 font-mono text-[11px] text-slate-300 truncate">
          <span>{accountNumber}</span> &middot;{' '}
          <span className="text-primary font-bold">${total.toFixed(2)}</span> &middot;{' '}
          <span>Ref: {reference}</span>
        </div>
        <button
          type="button"
          onClick={copyPayString}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-primary hover:text-secondary text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
        >
          {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}
