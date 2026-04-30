import { createClient } from '@/lib/supabase';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQs - Catch-22',
  description: 'Frequently Asked Questions about Catch-22 products, shipping, and more.',
};

export default function FAQPage() {
  const faqs = [
    {
      category: 'Shipping',
      questions: [
        {
          q: 'How long does shipping normally take?',
          a: 'Standard deliveries typically take between 2-5 business days. For rural deliveries please allow an additional 1-3 business days. Please select courier option for faster shipping.'
        },
        {
          q: 'Where will my order be shipped from?',
          a: 'Orders are shipped from within Auckland.'
        },
        {
          q: 'How do I track my order?',
          a: 'Once your order has been shipped you will receive a shipment confirmation email with tracking number. This email will contain information for you to be able to track and trace your parcel.'
        },
        {
          q: 'Do you ship overseas?',
          a: 'Unfortunately we only ship to addresses within New Zealand, for the time being.'
        }
      ]
    },
    {
      category: 'Charters & Partners',
      questions: [
        {
          q: 'How do I arrange a fishing trip with the legendary THUNDER charter?',
          a: 'Charles, who runs the THUNDER can be contacted through our website www.bayofplentyboathire.co.nz or by calling 0210542854.'
        }
      ]
    }
  ];

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl font-black text-secondary uppercase tracking-tight mb-4">Frequently Asked Questions</h1>
          <div className="h-2 w-24 bg-primary"></div>
        </div>

        <div className="space-y-12">
          {faqs.map((group, idx) => (
            <section key={idx}>
              <h2 className="text-xl font-black text-primary uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">
                {group.category}
              </h2>
              <div className="space-y-8">
                {group.questions.map((faq, fIdx) => (
                  <div key={fIdx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-secondary mb-3 leading-tight uppercase">
                      {faq.q}
                    </h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-20 bg-secondary rounded-3xl p-10 text-center text-white shadow-xl">
           <h3 className="text-2xl font-black uppercase mb-4">Still have questions?</h3>
           <p className="text-white/80 mb-8 font-medium">We&apos;re here to help you get the right gear for your next catch.</p>
           <a 
            href="/contact" 
            className="inline-block bg-primary hover:bg-primary-dark text-white font-black py-4 px-10 rounded-full transition-all uppercase tracking-widest text-sm"
           >
             Contact Our Team
           </a>
        </div>
      </div>
    </div>
  );
}
