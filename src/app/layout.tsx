import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'sonner';
import { SettingsHydrator } from '@/components/account/SettingsHydrator';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import type { UserSettings } from '@/lib/store/settings';
import { getSettings } from '@/lib/supabase-server';
import Providers from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  // Resolves every relative OG/canonical URL to the canonical host, killing
  // www/apex duplicate-content ambiguity for all child routes.
  metadataBase: new URL('https://www.catch-22.co.nz'),
  title: 'Catch-22 | Built for the Elements',
  description:
    'Premium fishing gear and apparel. Tested in the harshest environments, designed for durability and performance. 2.5% of all profits donated to NZ Sea Cleaners.',
  keywords: ['fishing gear', 'fishing apparel', 'NZ fishing', 'braid', 'lures', 'sea cleaners'],
  openGraph: {
    title: 'Catch-22 | Built for the Elements',
    description: 'Premium fishing gear and apparel. Tested in the harshest environments.',
    url: 'https://catch-22.co.nz',
    siteName: 'Catch-22',
    locale: 'en_NZ',
    images: [
      {
        url: 'https://wcoaqlglwxwceqktpckt.supabase.co/storage/v1/object/public/media/site/thunder-charter.jpg',
        width: 1200,
        height: 630,
        alt: 'Catch-22 | Built for the Elements',
      },
    ],
  },
  twitter: {
    images: [
      'https://wcoaqlglwxwceqktpckt.supabase.co/storage/v1/object/public/media/site/thunder-charter.jpg',
    ],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

async function SettingsLoader() {
  const settings = await getSettings();
  return <SettingsHydrator settings={settings as UserSettings | null} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-secondary font-sans selection:bg-primary selection:text-secondary">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-primary focus:text-secondary focus:font-black focus:uppercase focus:tracking-widest focus:text-xs focus:px-4 focus:py-2 focus:rounded-full"
          >
            Skip to content
          </a>
          <Suspense fallback={null}>
            <SettingsLoader />
          </Suspense>
          <Header />
          <main id="main-content" className="flex-grow flex flex-col">
            {children}
          </main>
          <Footer />
        </Providers>
        <Toaster position="bottom-right" richColors theme="light" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
