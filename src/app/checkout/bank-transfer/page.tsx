'use client';

import {
  ArrowLeft,
  Banknote,
  CalendarPlus,
  CheckCircle,
  Clock,
  Copy,
  Loader2,
  MapPin,
  Printer,
  Share2,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { type BankTransferSuccess, createBankTransferOrder } from '@/app/checkout/actions';
import { NZBankQuickLauncher, NZBankSelector } from '@/components/checkout/NZBankSelector';
import { NZCheckoutConfidence } from '@/components/checkout/NZCheckoutConfidence';
import { NZPaymentOptionsGuide } from '@/components/checkout/NZPaymentOptionsGuide';
import { NZRuralDeliveryAssistant } from '@/components/checkout/NZRuralDeliveryAssistant';
import { SHIPPING_RATES } from '@/config/shipping';
import { useCartStore } from '@/lib/store/cart';

/** No-op store subscription: hydration state never changes after mount. */
const emptySubscribe = () => () => {};

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — please select the text manually.');
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-secondary transition-colors"
      aria-label={`Copy ${label}`}
    >
      <Copy size={14} strokeWidth={2.5} />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function CopyAllBankDetailsButton({
  bank,
  reference,
  total,
}: {
  bank: BankTransferSuccess['bank'];
  reference: string;
  total: number;
}) {
  const [copied, setCopied] = useState(false);

  const copyAll = async () => {
    const text = [
      'Catch-22 New Zealand — Bank Transfer Details',
      `Bank: ${bank.bankName}`,
      `Account Name: ${bank.accountName}`,
      `Account Number: ${bank.accountNumber}`,
      `Amount: $${total.toFixed(2)} NZD`,
      'Particulars: Order',
      'Code: Catch22',
      `Reference: ${reference}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('All bank transfer details copied to clipboard!');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy all details — please copy fields individually.');
    }
  };

  return (
    <button
      type="button"
      onClick={copyAll}
      className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary text-secondary text-xs font-black uppercase tracking-wider transition-all hover:bg-primary-dark shadow-sm"
    >
      <Copy size={14} strokeWidth={2.5} />
      {copied ? '✓ All Details Copied!' : 'Copy All Bank Details to Clipboard'}
    </button>
  );
}

function ShareOrderButton({ reference, total }: { reference: string; total: number }) {
  const share = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Catch-22 Order ${reference}`,
          text: `Catch-22 order ${reference} — Total: $${total.toFixed(2)} NZD`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or dismissed share sheet
      }
    }
  };

  if (typeof navigator === 'undefined' || !navigator.share) return null;

  return (
    <button
      type="button"
      onClick={share}
      className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-secondary rounded-full py-4 px-6 text-xs font-black uppercase tracking-[0.2em] transition-all"
    >
      <Share2 size={16} strokeWidth={2.5} />
      Share details
    </button>
  );
}

function SuccessPanel({ result }: { result: BankTransferSuccess }) {
  const isPickup = result.paymentOption === 'pay_on_pickup';

  return (
    <div className="min-h-[80vh] bg-white pt-(--header-h) pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 sm:p-12 shadow-sm">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle className="w-10 h-10 text-emerald-600" strokeWidth={3} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-secondary uppercase tracking-tight mb-3">
              {isPickup ? 'Pick-up order reserved' : 'Order reserved'}
            </h1>
            <p className="text-slate-600 font-medium max-w-md leading-relaxed">
              {isPickup
                ? 'Thanks! Your gear is set aside in Chatswood, North Shore. Pay via Cash or EFTPOS when you collect.'
                : "Thanks! Your gear is set aside. Complete the bank transfer below and we'll get it packed as soon as the payment clears."}
            </p>
            <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
              <span className="text-emerald-600 text-lg">🌊</span>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                2.5% of this order goes to NZ Sea Cleaners
              </span>
            </div>
          </div>

          {!isPickup && result.bank.testMode && (
            <div
              role="status"
              className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl font-bold text-xs uppercase tracking-wider text-center"
            >
              Test mode — these bank details are placeholders. Do not send money.
            </div>
          )}

          {/* Reference + amount */}
          <div className="bg-secondary rounded-2xl p-6 sm:p-8 mb-6 print:bg-white print:border print:border-slate-200">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 print:text-slate-500">
                  {isPickup ? 'Order reference' : 'Payment reference'}
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-black text-primary tracking-tight break-all print:text-secondary">
                    {result.reference}
                  </p>
                  <CopyButton value={result.reference} label="payment reference" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 print:text-slate-500">
                  {isPickup ? 'Amount due on collection' : 'Amount to pay'}
                </p>
                <p className="text-2xl font-black text-white tracking-tight print:text-secondary">
                  {money(result.totals.total)} NZD
                </p>
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-8 shadow-xs">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
              Order cost breakdown
            </h3>
            <div className="space-y-2 text-xs font-bold text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-secondary">{money(result.totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-secondary">
                  {result.totals.shipping === 0 ? 'Free (Pick-up)' : money(result.totals.shipping)}
                </span>
              </div>
              {result.totals.discount > 0 && (
                <div className="flex justify-between text-primary-ink font-black">
                  <span>Discount</span>
                  <span>-{money(result.totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-slate-100 text-sm font-black text-secondary">
                <span className="uppercase tracking-widest text-[11px]">
                  {isPickup ? 'Total due on collection' : 'Total due'}
                </span>
                <span className="text-lg text-primary-ink tabular-nums">
                  {money(result.totals.total)} NZD
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-1">
                <span>Includes 15% NZ GST</span>
                <span className="tabular-nums">{money((result.totals.total * 3) / 23)} NZD</span>
              </div>
            </div>
          </div>

          {/* Business GST Tax Invoice Details if requested */}
          {result.businessGst && (
            <div className="mb-8 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🧾</span>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-secondary">
                  GST Tax Invoice Requested
                </h3>
              </div>
              <p className="text-sm font-black text-secondary">{result.businessGst.companyName}</p>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                Customer GST #:{' '}
                <strong className="text-secondary font-mono">{result.businessGst.gstNumber}</strong>
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[10px] text-slate-400 gap-2">
                <span>Catch-22 Limited NZ GST: 133-842-108</span>
                <span>GST Tax Invoice supplied with shipment</span>
              </div>
            </div>
          )}

          {/* Conditional: Pick-up details or Bank details */}
          {isPickup ? (
            <section aria-labelledby="pickup-details-heading" className="mb-8">
              <h2
                id="pickup-details-heading"
                className="text-sm font-black text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
              >
                <MapPin size={18} className="text-primary-ink" strokeWidth={2.5} />
                Pick-up &amp; Collection Details
              </h2>
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-primary/20 shadow-xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <span className="text-xs font-black uppercase tracking-wider text-primary">
                      Auckland North Shore Pick-up
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                    Zero Surcharge · Cash or EFTPOS
                  </span>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Pick-up Location
                    </dt>
                    <dd className="text-base font-black text-white">
                      Chatswood, North Shore, Auckland
                    </dd>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Chatswood,+North+Shore,+Auckland,+New+Zealand"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline mt-2"
                    >
                      <MapPin size={12} />
                      View on Google Maps &rarr;
                    </a>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Collection Time
                    </dt>
                    <dd className="text-base font-black text-white">
                      By appointment (we email you to confirm)
                    </dd>
                  </div>
                  <div className="sm:col-span-2 bg-white/10 p-5 rounded-2xl border border-primary/30 shadow-inner">
                    <dt className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                      Payment Accepted on Collection
                    </dt>
                    <dd className="flex items-center justify-between gap-2">
                      <span className="text-base sm:text-lg font-black text-white">
                        Cash or EFTPOS on collection
                      </span>
                      <span className="text-sm font-bold text-primary font-mono">
                        {money(result.totals.total)} NZD
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
          ) : (
            <section aria-labelledby="bank-details-heading" className="mb-8">
              <h2
                id="bank-details-heading"
                className="text-sm font-black text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
              >
                <Banknote size={18} className="text-primary-ink" strokeWidth={2.5} />
                NZ Internet Banking Details
              </h2>
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-primary/20 shadow-xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🇳🇿</span>
                    <span className="text-xs font-black uppercase tracking-wider text-primary">
                      Direct NZ Bank Transfer
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                    Zero Surcharge · All NZ Banks
                  </span>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Bank
                    </dt>
                    <dd className="text-base font-black text-white">{result.bank.bankName}</dd>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Account name
                    </dt>
                    <dd className="flex items-center justify-between gap-2">
                      <span className="text-base font-black text-white">
                        {result.bank.accountName}
                      </span>
                      <CopyButton value={result.bank.accountName} label="account name" />
                    </dd>
                  </div>
                  <div className="sm:col-span-2 bg-white/10 p-5 rounded-2xl border border-primary/30 shadow-inner">
                    <dt className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                      Account number
                    </dt>
                    <dd className="flex items-center justify-between gap-3">
                      <span className="text-xl sm:text-2xl font-black text-white tracking-wider font-mono">
                        {result.bank.accountNumber}
                      </span>
                      <CopyButton value={result.bank.accountNumber} label="account number" />
                    </dd>

                    {/* Segmented for NZ Bank Apps */}
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">
                          NZ Bank App Separate Inputs
                        </span>
                        <span className="text-[9px] font-bold text-primary">
                          1-click copy each part
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {(() => {
                          const parts = result.bank.accountNumber.split('-');
                          const bankCode = parts[0] || '06';
                          const branchCode = parts[1] || '0241';
                          const accountCode = parts[2] || '0897724';
                          const suffixCode = parts[3] || '00';
                          return (
                            <>
                              <div className="bg-black/20 p-2 rounded-xl border border-white/10 text-center">
                                <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">
                                  Bank
                                </span>
                                <span className="font-mono font-bold text-xs text-white">
                                  {bankCode}
                                </span>
                                <div className="mt-1 flex justify-center">
                                  <CopyButton value={bankCode} label="bank code" />
                                </div>
                              </div>
                              <div className="bg-black/20 p-2 rounded-xl border border-white/10 text-center">
                                <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">
                                  Branch
                                </span>
                                <span className="font-mono font-bold text-xs text-white">
                                  {branchCode}
                                </span>
                                <div className="mt-1 flex justify-center">
                                  <CopyButton value={branchCode} label="branch code" />
                                </div>
                              </div>
                              <div className="bg-black/20 p-2 rounded-xl border border-white/10 text-center">
                                <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">
                                  Account
                                </span>
                                <span className="font-mono font-bold text-xs text-white">
                                  {accountCode}
                                </span>
                                <div className="mt-1 flex justify-center">
                                  <CopyButton value={accountCode} label="account digits" />
                                </div>
                              </div>
                              <div className="bg-black/20 p-2 rounded-xl border border-white/10 text-center">
                                <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">
                                  Suffix
                                </span>
                                <span className="font-mono font-bold text-xs text-white">
                                  {suffixCode}
                                </span>
                                <div className="mt-1 flex justify-center">
                                  <CopyButton value={suffixCode} label="suffix" />
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </dl>

                {/* NZ 3-field payment references */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                    Enter in your bank app (ANZ, ASB, BNZ, Westpac, Kiwibank):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                        Particulars
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-white">Order</span>
                        <CopyButton value="Order" label="particulars" />
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                        Code
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-white">Catch22</span>
                        <CopyButton value="Catch22" label="code" />
                      </div>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-xl border border-primary/40">
                      <p className="text-[9px] font-black uppercase tracking-wider text-primary mb-1">
                        Reference (Required)
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm text-primary">
                          {result.reference}
                        </span>
                        <CopyButton value={result.reference} label="reference" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 mt-4 leading-relaxed">
                    💡 <strong className="text-white">Clearance note:</strong> ANZ-to-ANZ transfers
                    clear instantly. Payments from other NZ banks (ASB, BNZ, Westpac, Kiwibank)
                    typically clear within 1–2 hours under Payments NZ 365-day settlement (7 days a
                    week, including weekends).
                  </p>
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                    <CopyAllBankDetailsButton
                      bank={result.bank}
                      reference={result.reference}
                      total={result.totals.total}
                    />
                    <NZBankQuickLauncher
                      bankId={result.selectedBank}
                      total={result.totals.total}
                      reference={result.reference}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Instructions */}
          <section aria-labelledby="instructions-heading" className="mb-10">
            <h2
              id="instructions-heading"
              className="text-sm font-black text-secondary uppercase tracking-[0.2em] mb-4"
            >
              What happens next
            </h2>
            <ol className="space-y-3">
              {isPickup ? (
                <>
                  <li className="flex gap-3 text-sm text-slate-600 font-medium">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/30 text-secondary text-[10px] font-black flex items-center justify-center">
                      1
                    </span>
                    <span>
                      Your items are reserved immediately under order reference{' '}
                      <strong className="text-secondary font-black">{result.reference}</strong>.
                    </span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-600 font-medium">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/30 text-secondary text-[10px] font-black flex items-center justify-center">
                      2
                    </span>
                    <span>
                      We will contact you via email or phone to confirm a convenient pick-up time at
                      our Chatswood, North Shore location.
                    </span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-600 font-medium">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/30 text-secondary text-[10px] font-black flex items-center justify-center">
                      3
                    </span>
                    <span>
                      Inspect your braid and gear in person, and pay via Cash or EFTPOS on
                      collection.
                    </span>
                  </li>
                </>
              ) : (
                result.bank.instructions.map((instruction, index) => (
                  <li key={instruction} className="flex gap-3 text-sm text-slate-600 font-medium">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/30 text-secondary text-[10px] font-black flex items-center justify-center">
                      {index + 1}
                    </span>
                    {instruction}
                  </li>
                ))
              )}
            </ol>
          </section>

          {/* Estimated delivery & tracking info */}
          <section className="mb-10 bg-slate-50 border border-slate-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              {isPickup ? (
                <CalendarPlus size={16} className="text-primary-ink" strokeWidth={2.5} />
              ) : (
                <Truck size={16} className="text-primary-ink" strokeWidth={2.5} />
              )}
              <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">
                {isPickup ? 'Collection Scheduling' : 'Estimated Delivery'}
              </h3>
            </div>

            {isPickup ? (
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  We&apos;ll email you within <strong className="text-secondary">24 hours</strong>{' '}
                  to arrange a convenient pick-up time. Collections are available{' '}
                  <strong className="text-secondary">Mon–Sat, 8am–6pm</strong> at our Chatswood,
                  North Shore location.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const dtStart = tomorrow.toISOString().replace(/[-:]/g, '').split('.')[0];
                    tomorrow.setHours(tomorrow.getHours() + 1);
                    const dtEnd = tomorrow.toISOString().replace(/[-:]/g, '').split('.')[0];
                    const calUrl = `https://calendar.google.com/calendar/event?action=TEMPLATE&text=Catch-22+Pick-up+${encodeURIComponent(result.reference)}&dates=${dtStart}/${dtEnd}&details=${encodeURIComponent(`Pick up order ${result.reference} ($${result.totals.total.toFixed(2)} NZD) from Chatswood, North Shore Auckland. Pay by Cash or EFTPOS on collection.`)}&location=${encodeURIComponent('Chatswood, North Shore, Auckland, New Zealand')}`;
                    window.open(calUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-secondary uppercase tracking-wider hover:border-secondary transition-all shadow-sm"
                >
                  <CalendarPlus size={14} strokeWidth={2.5} />
                  Add to Google Calendar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Payment Clearance
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-primary-ink" />
                      <span className="text-xs font-black text-secondary">Same day – 2 hours</span>
                    </div>
                    <p className="text-[9px] font-medium text-slate-400 mt-1">
                      ANZ → ANZ instant; other NZ banks 1–2h
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Dispatch & Delivery
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Truck size={12} className="text-primary-ink" />
                      <span className="text-xs font-black text-secondary">1–4 business days</span>
                    </div>
                    <p className="text-[9px] font-medium text-slate-400 mt-1">
                      NZ-wide tracked courier from Auckland
                    </p>
                  </div>
                </div>
                <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                  📦 You&apos;ll receive a{' '}
                  <strong className="text-secondary">tracking number by email</strong> once your
                  order is dispatched. All shipments are fully tracked via NZ Post or courier.
                </p>
              </div>
            )}
          </section>

          <div className="flex flex-col sm:flex-row gap-3 print:hidden">
            <ShareOrderButton reference={result.reference} total={result.totals.total} />
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-secondary text-white rounded-full py-4 px-6 text-xs font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-secondary transition-all"
            >
              <Printer size={16} strokeWidth={2.5} />
              Print instructions
            </button>
            <Link
              href="/products"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-secondary rounded-full py-4 px-6 text-xs font-black uppercase tracking-[0.2em] hover:bg-primary-dark transition-all"
            >
              Continue shopping
            </Link>
          </div>

          {/* NZ Checkout Confidence */}
          <div className="mt-10 print:hidden">
            <NZCheckoutConfidence variant="strip" />
          </div>

          <p className="mt-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Keep this page or print these instructions for your records.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-secondary transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Skeleton shared by the pre-hydration paint and the Suspense fallback. */
function CheckoutSkeleton() {
  return (
    <div className="bg-white min-h-screen pt-(--header-h) pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="h-10 w-64 bg-slate-100 rounded mb-8" />
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 h-96 bg-slate-50 rounded-3xl" />
          <div className="lg:col-span-5 h-64 bg-slate-50 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

// Inner component (uses useSearchParams — must be wrapped in Suspense)
function BankTransferCheckout() {
  const { items, totalPrice, clearCart } = useCartStore();
  const [shippingMethodId, setShippingMethodId] = useState('standard');
  const [paymentOption, setPaymentOption] = useState<'bank_transfer' | 'pay_on_pickup'>(
    'bank_transfer'
  );
  const [selectedBankId, setSelectedBankId] = useState('anz');
  const [wantGstInvoice, setWantGstInvoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address1Val, setAddress1Val] = useState('');
  const [address2Val, setAddress2Val] = useState('');
  const [cityVal, setCityVal] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<BankTransferSuccess | null>(null);

  // The cart links here with an already-validated promo (?promo=CODE). Pre-fill
  // the field so the customer doesn't re-type it; the server action re-validates
  // at submit, so a stale or hand-crafted param simply fails there.
  const promoParam = (useSearchParams().get('promo') ?? '').trim();

  // Persisted cart rehydrates client-side only; render the skeleton on the
  // server/first paint to avoid an empty-cart mismatch flash.
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const shippingRate = SHIPPING_RATES.find((rate) => rate.id === shippingMethodId);
  const estimatedTotal = totalPrice() + (shippingRate ? shippingRate.amount / 100 : 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const field = (name: string) => String(formData.get(name) ?? '').trim();

    const companyName = field('gstCompanyName');
    const gstNumber = field('gstNumber');
    const businessGst =
      wantGstInvoice && (companyName || gstNumber) ? { companyName, gstNumber } : undefined;

    try {
      const response = await createBankTransferOrder({
        items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
        customer: {
          firstName: field('firstName'),
          lastName: field('lastName'),
          email: field('email'),
          phone: field('phone'),
          address1: field('address1'),
          address2: field('address2'),
          city: field('city'),
          postcode: field('postcode'),
          region: field('region'),
        },
        shippingMethodId,
        promoCode: field('promoCode'),
        paymentOption: shippingMethodId === 'pickup' ? paymentOption : 'bank_transfer',
        selectedBank:
          shippingMethodId !== 'pickup' || paymentOption === 'bank_transfer'
            ? selectedBankId
            : undefined,
        businessGst,
      });

      if ('error' in response) {
        setErrorMessage(response.error);
        return;
      }

      setResult(response);
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrorMessage('Could not place your order — check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success must be checked before the empty-cart guard: the cart is cleared
  // as soon as the order is created.
  if (result) return <SuccessPanel result={result} />;

  if (!hydrated) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="bg-white min-h-[70vh] flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-4xl font-black text-secondary uppercase tracking-tight mb-6">
          Your Cart is Empty
        </h1>
        <p className="text-slate-500 font-medium mb-10 max-w-sm">
          Add some gear to your cart before choosing bank transfer.
        </p>
        <Link
          href="/products"
          className="inline-block bg-primary hover:bg-primary-dark text-secondary font-black py-4 px-10 rounded-full transition-all uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-(--header-h) pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-secondary transition-colors w-fit"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Back to cart
            </Link>
            <NZPaymentOptionsGuide triggerVariant="badge" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-secondary uppercase">
            Bank Transfer Checkout
          </h1>
          <span className="text-xs font-black tracking-widest text-primary-ink uppercase mt-1">
            Direct Bank Deposit &amp; Auckland Pick-up
          </span>
          <div className="h-1.5 w-24 bg-primary mt-3" />
          <p className="mt-4 text-slate-500 font-medium max-w-2xl">
            No credit card needed. Pay online via ANZ direct bank deposit (0% surcharge, all NZ
            banks) or choose local Auckland pick-up with payment on collection.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-10">
            <fieldset className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8">
              <legend className="px-2 text-sm font-black text-secondary uppercase tracking-[0.2em]">
                Your details
              </legend>
              <div className="grid gap-5 sm:grid-cols-2 mt-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                  >
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    autoComplete="given-name"
                    maxLength={100}
                    className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                  >
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    autoComplete="family-name"
                    maxLength={100}
                    className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    maxLength={254}
                    className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                  >
                    Phone{' '}
                    <span className="text-slate-400 font-bold lowercase">
                      (NZ mobile or landline)
                    </span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="e.g. 021 123 4567 or 09 123 4567"
                    required
                    autoComplete="tel"
                    maxLength={30}
                    className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8">
              <legend className="px-2 text-sm font-black text-secondary uppercase tracking-[0.2em]">
                Shipping address
              </legend>
              <div className="grid gap-5 mt-4">
                <div>
                  <label
                    htmlFor="address1"
                    className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                  >
                    Address
                  </label>
                  <input
                    id="address1"
                    name="address1"
                    type="text"
                    required
                    autoComplete="address-line1"
                    maxLength={200}
                    onChange={(e) => setAddress1Val(e.target.value)}
                    className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label
                    htmlFor="address2"
                    className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                  >
                    Address line 2 <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="address2"
                    name="address2"
                    type="text"
                    autoComplete="address-line2"
                    maxLength={200}
                    onChange={(e) => setAddress2Val(e.target.value)}
                    className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                    >
                      City / suburb
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      autoComplete="address-level2"
                      maxLength={100}
                      onChange={(e) => setCityVal(e.target.value)}
                      className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="region"
                      className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                    >
                      Region <span className="text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="region"
                      name="region"
                      type="text"
                      list="nz-regions"
                      placeholder="e.g. Auckland"
                      autoComplete="address-level1"
                      maxLength={100}
                      className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                    />
                    <datalist id="nz-regions">
                      <option value="Northland" />
                      <option value="Auckland" />
                      <option value="Waikato" />
                      <option value="Bay of Plenty" />
                      <option value="Gisborne" />
                      <option value="Hawke's Bay" />
                      <option value="Taranaki" />
                      <option value="Manawatū-Whanganui" />
                      <option value="Wellington" />
                      <option value="Tasman" />
                      <option value="Nelson" />
                      <option value="Marlborough" />
                      <option value="West Coast" />
                      <option value="Canterbury" />
                      <option value="Otago" />
                      <option value="Southland" />
                    </datalist>
                  </div>
                  <div>
                    <label
                      htmlFor="postcode"
                      className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                    >
                      Postcode{' '}
                      <span className="text-slate-400 font-bold lowercase">(4 digits)</span>
                    </label>
                    <input
                      id="postcode"
                      name="postcode"
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 0626"
                      required
                      autoComplete="postal-code"
                      maxLength={10}
                      className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Rural Delivery Assistant */}
                <NZRuralDeliveryAssistant
                  addressText={`${address1Val} ${address2Val} ${cityVal}`}
                  currentShippingId={shippingMethodId}
                  onSelectShipping={setShippingMethodId}
                />
              </div>
            </fieldset>

            <fieldset className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8">
              <legend className="px-2 text-sm font-black text-secondary uppercase tracking-[0.2em]">
                Shipping method
              </legend>
              <div className="space-y-3 mt-4">
                {SHIPPING_RATES.map((rate) => (
                  <label
                    key={rate.id}
                    className={`flex items-center justify-between gap-4 cursor-pointer rounded-2xl border px-5 py-4 transition-all ${
                      shippingMethodId === rate.id
                        ? 'border-primary bg-white shadow-sm'
                        : 'border-slate-200 bg-white/60 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={rate.id}
                        checked={shippingMethodId === rate.id}
                        onChange={() => {
                          setShippingMethodId(rate.id);
                          if (rate.id !== 'pickup') {
                            setPaymentOption('bank_transfer');
                          }
                        }}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="flex flex-col">
                        <span className="text-sm font-bold text-secondary">{rate.name}</span>
                        {rate.displayEstimate && (
                          <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                            {rate.displayEstimate}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="text-sm font-black text-secondary whitespace-nowrap">
                      {rate.displayPrice}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {shippingMethodId === 'pickup' && (
              <fieldset className="bg-primary/5 border border-primary/20 rounded-3xl p-6 sm:p-8">
                <legend className="px-2 text-sm font-black text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                  <MapPin size={16} className="text-primary-ink" strokeWidth={2.5} />
                  Pick-up Payment Option
                </legend>
                <p className="text-xs text-slate-600 font-medium mt-1 mb-4">
                  For Auckland North Shore collection in Chatswood, choose how you would like to
                  pay:
                </p>
                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-4 cursor-pointer rounded-2xl border p-5 transition-all ${
                      paymentOption === 'bank_transfer'
                        ? 'border-secondary bg-white shadow-sm ring-1 ring-secondary/10'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pickupPaymentOption"
                      value="bank_transfer"
                      checked={paymentOption === 'bank_transfer'}
                      onChange={() => setPaymentOption('bank_transfer')}
                      className="h-4 w-4 mt-1 accent-secondary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-secondary">
                          Direct Bank Transfer
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          ANZ 0% Fee
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Pay online beforehand via internet banking. Your order will be ready for
                        collection once funds clear.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 cursor-pointer rounded-2xl border p-5 transition-all ${
                      paymentOption === 'pay_on_pickup'
                        ? 'border-secondary bg-white shadow-sm ring-1 ring-secondary/10'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pickupPaymentOption"
                      value="pay_on_pickup"
                      checked={paymentOption === 'pay_on_pickup'}
                      onChange={() => setPaymentOption('pay_on_pickup')}
                      className="h-4 w-4 mt-1 accent-secondary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-secondary">
                          Pay on Pick-up (Cash or EFTPOS)
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-primary/30 text-secondary px-2 py-0.5 rounded-full">
                          Auckland Local
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Reserve your gear online now and pay in person (Cash or EFTPOS) when you
                        collect from Chatswood.
                      </p>
                    </div>
                  </label>
                </div>
              </fieldset>
            )}

            {/* Bank Selector for Direct Bank Deposit */}
            {(shippingMethodId !== 'pickup' || paymentOption === 'bank_transfer') && (
              <fieldset className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8">
                <legend className="px-2 text-sm font-black text-secondary uppercase tracking-[0.2em]">
                  Your NZ Bank
                </legend>
                <div className="mt-4">
                  <NZBankSelector
                    selectedBankId={selectedBankId}
                    onSelectBank={setSelectedBankId}
                  />
                </div>
              </fieldset>
            )}

            {/* Business GST Tax Invoice Request */}
            <fieldset className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8">
              <legend className="px-2 text-sm font-black text-secondary uppercase tracking-[0.2em]">
                Tax Invoice &amp; Business Details
              </legend>
              <div className="mt-3">
                <label
                  htmlFor="wantGstInvoice"
                  className="flex items-start gap-3 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    id="wantGstInvoice"
                    checked={wantGstInvoice}
                    onChange={(e) => setWantGstInvoice(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded accent-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black text-secondary uppercase tracking-wider block">
                      Need a GST Tax Invoice for your business or charter?
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
                      Includes 15% NZ GST breakdown and your company details on receipt
                    </span>
                  </div>
                </label>
              </div>

              {wantGstInvoice && (
                <div className="grid gap-5 sm:grid-cols-2 mt-5 pt-5 border-t border-slate-200">
                  <div>
                    <label
                      htmlFor="gstCompanyName"
                      className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                    >
                      Company / Charter Name
                    </label>
                    <input
                      id="gstCompanyName"
                      name="gstCompanyName"
                      type="text"
                      placeholder="e.g. Hauraki Gulf Charters Ltd"
                      maxLength={150}
                      className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="gstNumber"
                      className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
                    >
                      NZ GST Number{' '}
                      <span className="text-slate-400 font-bold lowercase">(8–9 digits)</span>
                    </label>
                    <input
                      id="gstNumber"
                      name="gstNumber"
                      type="text"
                      placeholder="e.g. 123-456-789"
                      maxLength={20}
                      className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner font-mono"
                    />
                  </div>
                </div>
              )}
            </fieldset>

            <div>
              <label
                htmlFor="promoCode"
                className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1"
              >
                Promo code <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="promoCode"
                name="promoCode"
                type="text"
                defaultValue={promoParam}
                maxLength={50}
                placeholder="ENTER CODE"
                className="block w-full px-5 py-3 bg-white border border-slate-200 rounded-full text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
              />
              <p className="mt-2 ml-1 text-[10px] text-slate-400 font-medium">
                Discounts are applied when you place the order.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl font-bold text-sm"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-secondary text-white rounded-full py-5 px-6 text-sm font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-secondary transition-all shadow-xl shadow-secondary/10 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 animate-spin" size={20} strokeWidth={3} />
                  Reserving your order…
                </>
              ) : paymentOption === 'pay_on_pickup' && shippingMethodId === 'pickup' ? (
                <>
                  Place Order — Pay on Pick-up
                  <MapPin className="ml-3" size={20} strokeWidth={3} />
                </>
              ) : (
                <>
                  Place Order — Pay by Bank Transfer
                  <Banknote className="ml-3" size={20} strokeWidth={3} />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {paymentOption === 'pay_on_pickup' && shippingMethodId === 'pickup'
                ? 'No payment is taken now — pay cash or EFTPOS upon collection in Chatswood.'
                : "No payment is taken now — you'll receive bank details next."}
            </p>
          </form>

          {/* Summary */}
          <aside className="mt-12 lg:mt-0 lg:col-span-5">
            <div className="bg-slate-50 rounded-3xl px-6 py-8 sm:p-8 border border-slate-100 shadow-sm sticky top-24">
              <h2 className="text-xl font-black text-secondary uppercase tracking-widest mb-6 border-b-2 border-primary pb-2 inline-block">
                Order Summary
              </h2>

              <ul className="divide-y divide-slate-200">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-secondary uppercase leading-tight truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-black text-secondary whitespace-nowrap">
                      {money(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 space-y-4 border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between">
                  <dt className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Subtotal
                  </dt>
                  <dd className="text-sm font-black text-secondary">{money(totalPrice())}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Shipping
                  </dt>
                  <dd className="text-sm font-black text-secondary">
                    {shippingRate ? shippingRate.displayPrice : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <dt className="text-lg font-black text-secondary uppercase tracking-tight">
                    Estimated total
                  </dt>
                  <dd className="text-2xl font-black text-primary-ink tracking-tighter">
                    {money(estimatedTotal)}
                  </dd>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 -mt-2">
                  <span>Includes 15% NZ GST</span>
                  <span className="tabular-nums">{money((estimatedTotal * 3) / 23)} NZD</span>
                </div>
              </dl>

              <p className="mt-4 text-[10px] text-slate-400 font-medium leading-relaxed">
                Promo codes are applied when you place the order. The final amount is shown on the
                confirmation screen.
              </p>

              <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-6">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Your order is reserved until payment clears
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Public export — Suspense required for useSearchParams in App Router
export default function BankTransferCheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <BankTransferCheckout />
    </Suspense>
  );
}
