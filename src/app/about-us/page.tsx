import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { getStorageUrl } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'About Us - Catch-22',
  description: 'Learn about Catch-22, our products, and our mission to provide top-of-the-line fishing gear.',
};

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[400px] flex items-center overflow-hidden">
        <Image
          src={getStorageUrl('site/about-hero.jpg')}
          alt="Fishing in New Zealand"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-secondary/50" />
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-4 italic">
            Our <span className="text-primary not-italic">Story</span>
          </h1>
          <div className="h-2 w-24 bg-primary mx-auto"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="space-y-20">
          <section className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <h2 className="text-3xl font-black text-secondary uppercase mb-6 tracking-tight italic">
                Who <span className="text-primary not-italic">We Are</span>
              </h2>
              <p className="text-slate-600 text-lg font-medium leading-relaxed">
                Here at Catch-22 we are dedicated to providing top of the line products so you&apos;re never out of a catch. 
                As fishermen ourselves, we understand the needs of our customers so you can see these products are tried 
                and true by our partners Hamish and Ty.
              </p>
            </div>
            <div className="flex-1 w-full h-80 relative rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
               <Image 
                src={getStorageUrl('site/team.jpg')}
                alt="Catch-22 Team" 
                fill 
                className="object-cover"
               />
            </div>
          </section>

          <section className="bg-slate-50 p-10 sm:p-16 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-secondary uppercase mb-6 tracking-tight text-center italic">
                Our <span className="text-primary not-italic">Products</span>
              </h2>
              <p className="text-slate-600 text-lg font-medium leading-relaxed text-center max-w-2xl mx-auto">
                All our braid products are made with 100% quality Japanese fibre, ready to be delivered to your door. 
                We warrant that your information including the sensitive information submitted by you is protected both 
                online and off-line.
              </p>
            </div>
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          </section>

          <section className="flex flex-col-reverse md:flex-row gap-12 items-center">
            <div className="flex-1 w-full h-80 relative rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
               <Image 
                src={getStorageUrl('site/thunder-charter.jpg')}
                alt="Thunder Charter" 
                fill 
                className="object-cover"
               />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-black text-secondary uppercase mb-6 tracking-tight italic">
                How <span className="text-primary not-italic">We Work</span>
              </h2>
              <p className="text-slate-600 text-lg font-medium leading-relaxed">
                Our gear is tested down at Bay of Plenty Boat Hire by none other than Charles of the legendary 
                THUNDER charter. We don&apos;t just sell gear; we provide tools that we use and trust every day on the water.
              </p>
              <div className="mt-8 flex items-center gap-4">
                 <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-secondary font-black text-xl shadow-lg shadow-primary/20">2.5</div>
                 <p className="text-sm font-black text-secondary uppercase tracking-widest">
                   % of all profits donated to NZ Sea Cleaners
                 </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-secondary py-20 text-center text-white mt-10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-8 italic">
            Ready to <span className="text-primary not-italic">get equipped?</span>
          </h2>
          <Link 
            href="/shop" 
            className="inline-block bg-primary hover:bg-primary-dark text-secondary font-black py-5 px-12 rounded-full transition-all uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/20"
          >
            Explore our Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
