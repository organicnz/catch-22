import type { Metadata } from 'next';
import PayPalReturnClient from './PayPalReturnClient';

export const metadata: Metadata = {
  title: 'Payment Confirmed — Catch-22',
  description: "Your PayPal payment has been captured and your order's being prepared.",
  robots: { index: false, follow: false },
};

export default function PayPalReturnPage() {
  return <PayPalReturnClient />;
}
