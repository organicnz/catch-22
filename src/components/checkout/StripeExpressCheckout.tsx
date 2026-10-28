'use client';

import { Elements, ExpressCheckoutElement } from '@stripe/react-stripe-js';
import type {
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementReadyEvent,
} from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { env } from '@/lib/env';
import { useCartStore } from '@/lib/store/cart';

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripeExpressCheckoutProps {
  promoCode?: string;
}

export function StripeExpressCheckout({ promoCode }: StripeExpressCheckoutProps = {}) {
  const { items, totalPrice } = useCartStore();
  const [errorMessage, setErrorMessage] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const amount = totalPrice();

  const onReady = useCallback((event: StripeExpressCheckoutElementReadyEvent) => {
    // The element is ready — only show if wallets are available.
    // availablePaymentMethods is null if no wallets are configured on the device.
    if (event.availablePaymentMethods) {
      setIsReady(true);
    }
  }, []);

  if (!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return null; // Do not render if publishable key is missing
  }

  if (amount === 0) return null;

  const onConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!event) return;

    setIsRedirecting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          promoCode: promoCode || undefined,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (response.status === 429) {
        const retry = Number(response.headers.get('Retry-After')) || 30;
        toast.error(`Too many attempts — try again in ${retry}s.`);
        setIsRedirecting(false);
        return;
      }

      setErrorMessage(data.error || 'Something went wrong — please try the card button above.');
      setIsRedirecting(false);
    } catch {
      setErrorMessage('Checkout failed — check your connection and try again.');
      setIsRedirecting(false);
    }
  };

  return (
    <div className="relative">
      {/* Redirect overlay */}
      {isRedirecting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3 text-secondary">
            <Loader2 size={20} className="animate-spin" strokeWidth={3} />
            <span className="text-xs font-black uppercase tracking-widest">
              Opening secure checkout…
            </span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mb-3 p-3 bg-rose-50 text-rose-700 rounded-2xl text-xs font-bold border border-rose-100 flex items-start gap-2"
        >
          <AlertTriangle size={14} className="shrink-0 mt-0.5" strokeWidth={2.5} />
          <div>
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="mt-1 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <Elements
        stripe={stripePromise}
        options={{
          mode: 'payment',
          amount: Math.round(amount * 100) > 0 ? Math.round(amount * 100) : 100,
          currency: 'nzd',
          locale: 'en-NZ' as 'en',
          appearance: {
            theme: 'stripe',
            variables: {
              borderRadius: '12px',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            },
          },
        }}
      >
        <ExpressCheckoutElement
          onConfirm={onConfirm}
          onReady={onReady}
          options={{
            buttonType: {
              applePay: 'buy',
              googlePay: 'buy',
            },
            buttonTheme: {
              applePay: 'black',
              googlePay: 'black',
            },
            buttonHeight: 48,
            layout: {
              maxColumns: 2,
              maxRows: 1,
              overflow: 'never',
            },
          }}
        />
      </Elements>

      {/* Subtle guidance when express is not available */}
      {!isReady && (
        <p className="text-center text-[10px] font-medium text-slate-400 mt-2">
          Apple Pay &amp; Google Pay appear when your device supports them.
        </p>
      )}
    </div>
  );
}
