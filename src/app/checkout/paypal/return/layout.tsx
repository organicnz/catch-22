import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PayPal Payment — Catch-22',
  description: 'Completing your PayPal payment for Catch-22.',
  robots: { index: false, follow: false },
};

export default function PayPalReturnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
