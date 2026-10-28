'use client';

import { Check, Copy, QrCode, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  // Formatted string designed for quick paste into NZ banking apps
  const bankingString = `${accountNumber} | ${accountName} (${bankName}) | $${total.toFixed(2)} | Ref: ${reference}`;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

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
        <button
          type="button"
          onClick={() => setShowQr(!showQr)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider transition-colors border border-white/10 cursor-pointer"
        >
          <QrCode size={13} className="text-primary" />
          <span>{showQr ? 'Hide QR Code' : 'Scan with Phone Camera'}</span>
        </button>
      </div>

      {showQr && (
        <div className="my-5 p-5 bg-white text-secondary rounded-2xl flex flex-col sm:flex-row items-center gap-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 bg-white rounded-xl shadow-inner border border-slate-100 shrink-0">
            {currentUrl ? (
              <QRCodeSVG
                value={currentUrl}
                size={140}
                level="M"
                includeMargin={false}
                aria-label={`QR Code to open order ${reference} on mobile`}
              />
            ) : (
              <div className="w-[140px] h-[140px] bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                Loading QR…
              </div>
            )}
          </div>
          <div className="text-left space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-ink bg-primary/20 px-2 py-0.5 rounded-full">
              Mobile Phone Camera
            </span>
            <p className="text-xs font-black text-secondary leading-snug">
              Scan with your phone to open this order on mobile
            </p>
            <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
              Open Catch-22 order {reference} directly on your phone so you can easily copy and
              paste bank details straight into your ANZ or mobile banking app.
            </p>
          </div>
        </div>
      )}

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
