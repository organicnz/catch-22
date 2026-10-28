import Image from 'next/image';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { PaymentMethodStrip } from '@/components/checkout/PaymentIcons';
import { getStorageUrl } from '@/lib/supabase';

async function CopyrightYear() {
  await connection();
  return <span>{new Date().getFullYear()}</span>;
}

export function Footer() {
  return (
    <footer className="bg-secondary text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src={getStorageUrl('site/logo.png')}
                alt="Catch-22"
                width={212}
                height={150}
                className="h-20 w-auto"
                unoptimized
              />
            </Link>
            <p className="mt-6 text-sm text-slate-300 leading-relaxed">
              Catch-22 is dedicated to providing premium fishing gear that performs in the elements.
              We believe in quality, durability, and giving back to the ocean.
            </p>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h3 className="text-primary text-sm font-black uppercase tracking-widest mb-6">
              Navigation
            </h3>
            <ul className="grid grid-cols-2 gap-4 text-sm font-bold">
              <li>
                <Link
                  href="/"
                  className="hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Snaps
                </Link>
              </li>
              <li>
                <Link
                  href="/partners"
                  className="hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Visit Our Partners
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  className="hover:text-primary transition-colors uppercase tracking-wider"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-primary text-sm font-black uppercase tracking-widest mb-6">
              Legal &amp; Policy
            </h3>
            <ul className="space-y-4 text-sm font-bold">
              <li>
                <Link
                  href="/terms-and-conditions"
                  className="hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-returns"
                  className="hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Shipping &amp; Returns
                </Link>
              </li>
              <li>
                <Link
                  href="/checkout/bank-transfer"
                  className="hover:text-primary transition-colors uppercase tracking-wider text-primary"
                >
                  Bank Transfer &amp; Pick-up
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Accepted NZ Payment Methods Strip */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Accepted Payment Methods in NZD ($)
            </span>
            <PaymentMethodStrip
              showBankAndEftpos={true}
              className="justify-center md:justify-start"
            />
          </div>
          <div className="text-center md:text-right text-[11px] font-bold text-slate-400 leading-relaxed max-w-sm">
            <p>🔒 256-bit SSL encrypted checkout powered by Stripe.</p>
            <p className="text-white/60 text-[10px] mt-0.5">
              ANZ Direct Bank Deposit (0% surcharge) &middot; Cash / EFTPOS on Auckland Pick-up
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            &copy;{' '}
            <Suspense fallback={null}>
              <CopyrightYear />
            </Suspense>{' '}
            Catch-22.co.nz &middot; Never Out of a Catch &middot; 100% NZ Owned
          </div>
          <div className="flex gap-6">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Auckland, New Zealand
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
