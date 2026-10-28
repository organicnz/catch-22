import type { Metadata } from 'next';
import Link from 'next/link';
import { SHIPPING_RATES } from '@/config/shipping';

export const metadata: Metadata = {
  alternates: { canonical: '/faqs' },
  title: 'FAQs | Catch-22 New Zealand',
  description:
    'Find answers to common questions about Catch-22 fishing gear, shipping to New Zealand, charter bookings, and more.',
  openGraph: {
    title: 'FAQs | Catch-22 New Zealand',
    description:
      'Find answers to common questions about Catch-22 fishing gear, shipping to New Zealand, charter bookings, and more.',
    url: 'https://catch-22.co.nz/faqs',
    siteName: 'Catch-22',
    locale: 'en_NZ',
    type: 'website',
    images: [
      {
        url: 'https://wcoaqlglwxwceqktpckt.supabase.co/storage/v1/object/public/media/site/thunder-charter.jpg',
        width: 1200,
        height: 630,
        alt: 'Catch-22 Premium Fishing Gear New Zealand',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQs | Catch-22 New Zealand',
    description:
      'Find answers to common questions about Catch-22 fishing gear, shipping to New Zealand, charter bookings, and more.',
    images: [
      'https://wcoaqlglwxwceqktpckt.supabase.co/storage/v1/object/public/media/site/thunder-charter.jpg',
    ],
  },
};

export default function FAQPage() {
  const faqs = [
    {
      category: 'Shipping',
      questions: [
        {
          q: 'How long does shipping normally take?',
          a: 'Standard deliveries typically take between 2-5 business days. For rural deliveries please allow an additional 1-3 business days. Please select courier option for faster shipping.',
        },
        {
          q: 'What are the shipping costs?',
          a: SHIPPING_RATES.map(
            (rate) => `${rate.name} is ${rate.amount === 0 ? 'free of charge' : rate.displayPrice}.`
          ).join(' '),
        },
        {
          q: 'Where will my order be shipped from?',
          a: 'Orders are shipped from within Auckland.',
        },
        {
          q: 'How do I track my order?',
          a: 'Once your order has been shipped you will receive a shipment confirmation email with tracking number. This email will contain information for you to be able to track and trace your parcel.',
        },
        {
          q: 'Do you ship overseas?',
          a: 'Unfortunately we only ship to addresses within New Zealand, for the time being.',
        },
      ],
    },
    {
      category: 'Payment Options & Security',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), Apple Pay, Google Pay, Stripe Link, Afterpay (4 fortnightly instalments), Klarna, direct New Zealand bank transfer (ANZ direct deposit with 0% surcharge), and Pay on Pick-up (Cash or EFTPOS upon collection from Chatswood, North Shore, Auckland).',
        },
        {
          q: 'How does New Zealand Direct Bank Transfer work?',
          a: 'When you choose Bank Transfer at checkout, no credit card is required. Your gear is reserved immediately under an on-hold order status, and you receive our ANZ account details with a unique payment reference (e.g. CATCH22-1001). Simply complete an internet banking transfer from any NZ bank (ANZ, ASB, BNZ, Westpac, Kiwibank). Once funds clear, your parcel is packed and dispatched. There is 0% surcharge.',
        },
        {
          q: 'How does Afterpay & Klarna (Buy Now, Pay Later) work?',
          a: 'Afterpay and Klarna allow you to split your purchase into 4 equal, interest-free instalments paid fortnightly. Select Afterpay or Klarna at checkout — approval is instant and your order is dispatched right away, with no waiting for subsequent payments.',
        },
        {
          q: 'Can I pick up my gear in Auckland and pay on collection?',
          a: 'Yes! Choose "Local Pick-up (Chatswood, Auckland)" at checkout ($0 shipping). You can pre-pay via bank deposit or select "Pay on Pick-up" to pay in person via Cash or EFTPOS when you collect your gear by appointment.',
        },
        {
          q: 'Are all prices in New Zealand Dollars (NZD)?',
          a: 'Yes, 100%. All prices on Catch-22 are in NZD ($) and include 15% NZ GST. There are no foreign exchange markups, international transaction fees, or hidden surprise charges.',
        },
      ],
    },
    {
      category: 'Charters & Partners',
      questions: [
        {
          q: 'How do I arrange a fishing trip with the legendary THUNDER charter?',
          a: 'Charles, who runs the THUNDER can be contacted through our website www.bayofplentyboathire.co.nz or by calling 0210542854.',
        },
      ],
    },
  ];

  return (
    <main className="bg-white pt-(--header-h) pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl font-black text-secondary uppercase tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <div className="h-2 w-24 bg-primary" />
        </div>

        <div className="space-y-12">
          {faqs.map((group) => (
            <section key={group.category} aria-labelledby={`faq-category-${group.category}`}>
              <h2
                id={`faq-category-${group.category}`}
                className="text-xl font-black text-primary-ink uppercase tracking-widest mb-6 border-b border-slate-100 pb-2"
              >
                {group.category}
              </h2>
              <div className="space-y-8">
                {group.questions.map((faq) => (
                  <details
                    key={faq.q}
                    className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm group transition-all duration-500 ease-out"
                  >
                    <summary className="text-lg font-black text-secondary mb-3 leading-tight uppercase cursor-pointer list-none flex justify-between items-center">
                      {faq.q}
                      <span
                        aria-hidden="true"
                        className="text-primary font-black text-xl group-open:rotate-45 transition-transform duration-500 ease-out"
                      >
                        +
                      </span>
                    </summary>
                    <p className="text-slate-600 font-medium leading-relaxed mt-4">{faq.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-20 bg-secondary rounded-3xl p-10 text-center text-white shadow-xl">
          <h3 className="text-2xl font-black uppercase mb-4">Still have questions?</h3>
          <p className="text-white/80 mb-8 font-medium">
            We&apos;re here to help you get the right gear for your next catch.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-primary hover:bg-primary-dark text-secondary font-black py-5 px-12 rounded-full transition-all uppercase tracking-[0.2em] text-sm"
          >
            Contact Our Team
          </Link>
        </div>
      </div>
    </main>
  );
}
