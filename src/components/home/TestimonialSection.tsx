import Image from 'next/image';
import { getStorageUrl } from '@/lib/supabase';

const TESTIMONIALS = [
  {
    quote: "There you go mate 40.1kg. We got 4 yesterday - your braid doing the business.",
    author: "Charles Cockery",
    org: "THUNDER Charter"
  },
  {
    quote: "We landed a couple of 30+kg kingies on the new line. All on your braid.",
    author: "Charles Cockery",
    org: "THUNDER Charter"
  },
  {
    quote: "Been out catching 30kg kingfish on your 60lb braid 🤙 What your braid latched onto mate.",
    author: "Charles Cockery",
    org: "THUNDER Charter"
  },
  {
    quote: "2.5% of all profits donated to NZ Sea Cleaners. Quality gear that gives back.",
    author: "Ham & Ty",
    org: "Sledger Rigs"
  }
];

export function TestimonialSection() {
  return (
    <section aria-label="Testimonials — Trusted By Pros" className="bg-white py-32 overflow-hidden relative">
      {/* Texture Layer */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
          <div className="max-w-xl">
            <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Field Tested</span>
            <h2 className="text-4xl md:text-6xl font-black text-secondary uppercase tracking-tighter leading-[0.9]">
              Trusted <br /> By The <span className="text-slate-300">Pros</span>
            </h2>
          </div>
          <div className="h-px flex-grow bg-slate-100 hidden md:block mb-4 mx-12"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-4">Real results from NZ waters</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div 
              key={i} 
              className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 hover:border-primary/30 transition-all duration-500 group relative"
            >
              <div className="absolute top-8 left-8 text-4xl font-black text-slate-200 group-hover:text-primary transition-colors opacity-40">&quot;</div>
              <div className="relative z-10 pt-8">
                <p className="text-lg font-bold text-secondary leading-snug mb-10 min-h-[6rem]">
                  {t.quote}
                </p>
                <div className="flex items-center gap-4 border-t border-slate-200 pt-8">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white font-black text-[10px] uppercase">
                    {t.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-black text-secondary uppercase tracking-widest text-[10px]">{t.author}</p>
                    <p className="text-primary font-black uppercase tracking-widest text-[8px] mt-0.5">{t.org}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Brand Bar */}
        <div className="mt-32 pt-16 border-t border-slate-100">
           <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:opacity-60 transition-all duration-500">
              {/* Using local partner images identified earlier */}
              <div className="relative h-12 w-32">
                <Image src={getStorageUrl("logo.svg")} alt="Catch-22" fill className="object-contain" />
              </div>
              <p className="font-black text-secondary uppercase tracking-[0.5em] text-xs">Tested @ Bay of Plenty</p>
              <p className="font-black text-secondary uppercase tracking-[0.5em] text-xs">Custom Lures</p>
              <p className="font-black text-secondary uppercase tracking-[0.5em] text-xs">Premium Braid</p>
           </div>
        </div>
      </div>
    </section>
  );
}
