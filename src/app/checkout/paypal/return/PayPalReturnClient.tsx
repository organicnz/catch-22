'use client';

import { CheckCircle2, Loader2, Package, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ClearCartOnMount } from '@/components/checkout/ClearCartOnMount';

type CaptureState =
  | { phase: 'capturing' }
  | { phase: 'success'; reference: string; orderId: number }
  | { phase: 'error'; message: string };

/**
 * PayPal redirects here after the customer approves the payment.
 * We POST to our capture API route to finalise the payment and create
 * the Supabase order, then show the result.
 */
function PayPalReturnInner() {
  const params = useSearchParams();
  const [state, setState] = useState<CaptureState>({ phase: 'capturing' });
  const capturedRef = useRef(false);

  const capture = useCallback(async () => {
    // PayPal appends `token` (the order ID) and `PayerID` to the return URL.
    const paypalOrderId = params.get('token');
    if (!paypalOrderId) {
      setState({ phase: 'error', message: 'Missing PayPal order reference.' });
      return;
    }

    try {
      const res = await fetch('/api/checkout/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypalOrderId,
          promoCode: params.get('promo') ?? undefined,
          shippingMethodId: params.get('shipping') ?? undefined,
          userId: params.get('userId') ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState({ phase: 'error', message: data.error || 'Capture failed.' });
        return;
      }

      setState({
        phase: 'success',
        reference: data.reference,
        orderId: data.orderId,
      });
    } catch {
      setState({
        phase: 'error',
        message: 'Could not finalise your PayPal payment. Please contact us.',
      });
    }
  }, [params]);

  useEffect(() => {
    if (capturedRef.current) return;
    capturedRef.current = true;
    capture();
  }, [capture]);

  // ── Capturing ──────────────────────────────────────────────────────────
  if (state.phase === 'capturing') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 pt-(--header-h) pb-16 bg-white">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Loader2 size={36} className="animate-spin text-secondary" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-secondary uppercase tracking-tight mb-3">
            Finalising Payment
          </h1>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">
            Confirming your PayPal payment — this usually takes a few seconds.
            <br />
            Please do not close this tab.
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (state.phase === 'error') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 pt-(--header-h) pb-16 bg-white">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
            <XCircle size={36} className="text-rose-500" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-secondary uppercase tracking-tight mb-3">
            Payment Issue
          </h1>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">{state.message}</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/cart"
              className="w-full inline-block py-4 px-8 bg-secondary text-white font-black rounded-full transition-all uppercase tracking-[0.15em] text-sm shadow-xl shadow-secondary/10 hover:bg-primary hover:text-secondary"
            >
              Return to Cart
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

  // ── Success ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 pt-(--header-h) pb-16 bg-white">
      <ClearCartOnMount />
      <div className="max-w-lg w-full text-center">
        {/* Celebratory ring */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          <div
            className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
            style={{ animationDuration: '1.5s', animationIterationCount: '2' }}
          />
          <div className="absolute inset-0 rounded-full bg-primary/30 flex items-center justify-center">
            <CheckCircle2 size={48} className="text-secondary" strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="text-3xl font-black text-secondary uppercase tracking-tight mb-2">
          Payment Confirmed
        </h1>
        <p className="text-slate-500 font-medium text-sm mb-6">
          Your PayPal payment has been captured. We&apos;re preparing your order now.
        </p>

        {/* Order reference card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 text-left space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Order Reference
            </span>
            <span className="text-sm font-black text-secondary tracking-tight">
              {state.reference}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Payment Method
            </span>
            <span className="text-xs font-black text-[#003087] uppercase tracking-wider">
              PayPal
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Status
            </span>
            <span className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <Package size={12} strokeWidth={2.5} />
              Processing
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/products"
            className="w-full inline-block py-4 px-8 bg-primary hover:bg-primary-dark text-secondary font-black rounded-full transition-all uppercase tracking-[0.15em] text-sm shadow-xl shadow-primary/20"
          >
            Continue Shopping
          </Link>
          <Link
            href="/account"
            className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-secondary transition-colors"
          >
            View Your Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PayPalReturn() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center bg-white pt-(--header-h)">
          <Loader2 size={32} className="animate-spin text-slate-300" />
        </div>
      }
    >
      <PayPalReturnInner />
    </Suspense>
  );
}
