import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bank Transfer & Pick-up Checkout — Catch-22',
  description:
    'Pay by direct bank deposit (ANZ, 0% surcharge) or collect from our Auckland North Shore location with cash or EFTPOS. No credit card needed.',
  robots: { index: false, follow: false },
};

export default function BankTransferLayout({ children }: { children: React.ReactNode }) {
  return children;
}
