import Image from 'next/image';
import Link from 'next/link';
import { createClient, getStorageUrl } from '@/lib/supabase';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { sanitizeText } from '@/lib/sanitize';
import { ProductCard } from '@/components/products/ProductCard';
import { CharitySection } from '@/components/home/CharitySection';
import { TestimonialSection } from '@/components/home/TestimonialSection';
import { ProductSlider } from '@/components/products/ProductSlider';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Catch-22 | Premium Fishing Gear New Zealand',
  description: 'Premium fishing braid, lures, and apparel tested in the harshest New Zealand environments. Built to endure. Free NZ shipping available.',
  openGraph: {
    title: 'Catch-22 | Premium Fishing Gear New Zealand',
    description: 'Premium fishing braid, lures, and apparel tested in the harshest New Zealand environments. Built to endure. Free NZ shipping available.',
    url: 'https://catch-22.co.nz',
    siteName: 'Catch-22',
    locale: 'en_NZ',
    type: 'website',
    images: [{ url: 'https://wcoaqlglwxwceqktpckt.supabase.co/storage/v1/object/public/media/site/thunder-charter.jpg', width: 1200, height: 630, alt: 'Catch-22 Premium Fishing Gear New Zealand' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catch-22 | Premium Fishing Gear New Zealand',
    description: 'Premium fishing braid, lures, and apparel tested in the harshest New Zealand environments. Built to endure. Free NZ shipping available.',
    images: ['https://wcoaqlglwxwceqktpckt.supabase.co/storage/v1/object/public/media/site/thunder-charter.jpg'],
  },
};

async function BestSellers() {
  const supabase = createClient();
  
  // Fetch featured products (Best Sellers)
  const { data: featuredProducts } = await supabase
    .from('products')
    .select('id, name, slug, price, regular_price, sale_price, image_url')
    .eq('stock_status', 'instock')
    .limit(8);

  return (
    <ProductSlider products={featuredProducts || []} />
  );
}

function BestSellersLoading() {
  return (
    <div className="flex gap-8 overflow-hidden pb-12 pt-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="min-w-[85%] sm:min-w-[45%] lg:min-w-[23%] flex flex-col h-full bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden animate-pulse">
           <div className="h-72 bg-slate-100"></div>
           <div className="p-8 space-y-6">
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              <div className="flex justify-between items-center pt-4">
                 <div className="h-8 bg-slate-100 rounded w-1/4"></div>
                 <div className="h-10 bg-slate-100 rounded-full w-24"></div>
              </div>
           </div>
        </div>
      ))}
    </div>
  );
}

async function DealOfTheDay() {
  const supabase = createClient();
  
  // Fetch one product on sale
  const { data: dealProduct, error: dealError } = await supabase
    .from('products')
    .select('id, name, slug, price, regular_price, sale_price, image_url, description')
    .not('sale_price', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (dealError || !dealProduct) return null;

  return (
    <section aria-label="Special Offer — Deal of the Day" className="bg-secondary py-24 relative overflow-hidden">
      {/* Visual background flair */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/20 -skew-x-12 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Limited Supply</span>
            </div>
            
            <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-10 leading-[0.85]">
              Deal of <br /> <span className="text-primary">The Day</span>
            </h2>
            
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl relative">
              <h3 className="text-3xl font-black text-white uppercase mb-6 tracking-tight">{dealProduct.name}</h3>
              <p className="text-slate-400 font-medium mb-10 leading-relaxed line-clamp-3">
                {dealProduct.description?.replace(/<[^>]*>/g, '') || 'Professional-grade fishing equipment engineered for performance.'}
              </p>
              
              <div className="flex items-center gap-8 mb-12">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">RRP</span>
                  <span className="text-2xl text-slate-500 line-through font-bold">${dealProduct.regular_price?.toFixed(2)}</span>
                </div>
                <div className="w-px h-12 bg-white/10"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Crew Price</span>
                  <span className="text-5xl font-black text-primary leading-none tracking-tighter">${dealProduct.price.toFixed(2)}</span>
                </div>
              </div>

              <Link 
                href={`/products/${dealProduct.slug}`}
                className="group relative inline-flex items-center justify-center bg-primary hover:bg-white text-secondary font-black py-6 px-12 rounded-2xl transition-all duration-500 uppercase tracking-[0.2em] text-xs w-full overflow-hidden"
              >
                <span className="relative z-10">Secure This Deal</span>
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </Link>
            </div>
          </div>
          
          <div className="lg:w-1/2 relative group">
            <div className="relative aspect-square w-full max-w-[600px] mx-auto">
               <div className="absolute inset-0 bg-primary/20 rounded-full blur-[120px] group-hover:bg-primary/30 transition-all duration-700" />
               {dealProduct.image_url && (
                 <Image 
                   src={getStorageUrl(dealProduct.image_url)}
                   alt={dealProduct.name}
                   fill
                   loading="lazy"
                   className="object-contain relative z-10 drop-shadow-[0_50px_50px_rgba(0,0,0,0.6)] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-700"
                 />
               )}
            </div>
            {/* Urgency Badge */}
            <div className="absolute top-10 right-10 bg-red-600 text-white w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl rotate-12 group-hover:rotate-0 transition-all">
               <span className="text-[10px] font-black uppercase tracking-tighter">Save</span>
               <span className="text-2xl font-black tracking-tighter">
                 {Math.round(100 - (dealProduct.price / (dealProduct.regular_price || dealProduct.price) * 100))}%
               </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  return (
    <div className="bg-white">
      {/* Schema.org Organization Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': 'https://catch-22.co.nz/#organization',
                name: 'Catch-22',
                url: 'https://catch-22.co.nz',
                logo: 'https://catch-22.co.nz/logo.svg',
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: '02102745622',
                  contactType: 'customer service',
                  areaServed: 'NZ',
                  availableLanguage: 'English',
                },
              },
              {
                '@type': 'WebSite',
                '@id': 'https://catch-22.co.nz/#website',
                url: 'https://catch-22.co.nz',
                name: 'Catch-22',
                description: 'Premium fishing gear for New Zealand anglers',
                publisher: { '@id': 'https://catch-22.co.nz/#organization' },
                inLanguage: 'en-NZ',
              },
            ],
          }),
        }}
      />

      {/* Hero Section: High Sensory Luxury */}
      <section aria-label="Hero — Equip Yourself for the Elements" className="relative h-[85vh] min-h-[700px] flex items-center overflow-hidden bg-secondary">
        <Image
          src={getStorageUrl('site/thunder-charter.jpg')}
          alt="Premium fishing gear in the New Zealand elements"
          fill
          className="object-cover opacity-60 scale-105 group-hover:scale-100 transition-transform duration-[2000ms]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/40 to-secondary" />
        
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="max-w-4xl">
            <span className="text-primary font-black uppercase tracking-[0.5em] text-xs mb-8 block animate-fade-in">Established NZ 2020</span>
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tight text-white uppercase leading-[0.8] mb-12">
              Built to <br /> <span className="text-primary">Endure.</span>
            </h1>
            <p className="mt-4 text-xl md:text-2xl text-slate-300 font-medium mb-16 max-w-2xl leading-relaxed">
              Premium fishing gear, apparel, and accessories tested in the harshest New Zealand environments.
            </p>
            <div className="flex flex-wrap gap-8 items-center">
              <Link
                href="/products"
                className="group relative inline-flex items-center justify-center bg-primary text-secondary font-black py-6 px-16 rounded-full transition-all duration-500 uppercase tracking-[0.3em] text-xs shadow-2xl shadow-primary/20 hover:scale-105"
              >
                Explore Collection
              </Link>
              <Link
                href="/about-us"
                className="text-xs font-black uppercase tracking-[0.4em] text-white border-b border-white/20 hover:border-primary hover:text-primary transition-all pb-2"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-white/40">
           <span className="text-[8px] font-black uppercase tracking-[0.5em] vertical-rl">Scroll</span>
           <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </section>

      {/* Featured Products: Best Sellers Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
          <div className="max-w-xl text-left">
            <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Store Selection</span>
            <h2 className="text-5xl md:text-7xl font-black text-secondary uppercase tracking-tighter leading-[0.9]">
              Best <br /> <span className="text-slate-300">Sellers</span>
            </h2>
          </div>
          <Link href="/products" className="group text-xs font-black uppercase tracking-[0.3em] text-secondary flex items-center gap-4 hover:gap-6 transition-all">
             View All Gear <span className="text-xl group-hover:text-primary transition-colors">&rarr;</span>
          </Link>
        </div>

        <Suspense fallback={<BestSellersLoading />}>
          <BestSellers />
        </Suspense>
      </section>

      {/* Deal of the Day: High Visibility */}
      <Suspense fallback={<div className="h-[600px] bg-secondary animate-pulse" />}>
        <DealOfTheDay />
      </Suspense>

      {/* Testimonials: Trusted By Pros */}
      <TestimonialSection />

      {/* Charity: NZ Sea Cleaners */}
      <CharitySection />


      {/* Final CTA: Crew Join */}
      <section className="bg-white py-40 text-center overflow-hidden relative">
         <div className="max-w-5xl mx-auto px-4 relative z-10">
           <h3 className="text-5xl md:text-8xl font-black text-secondary uppercase mb-12 tracking-tighter leading-[0.85]">
             Gear up and <br /> <span className="text-primary drop-shadow-sm">Join the Crew</span>
           </h3>
           <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-2xl mx-auto mb-16">
             Join thousands of NZ anglers who trust Catch-22 for their most demanding expeditions. High-performance gear, zero compromises.
           </p>
           
           <div className="flex flex-wrap justify-center gap-12 md:gap-24 mb-20">
              <div className="flex flex-col items-center">
                 <div className="text-4xl font-black text-secondary">4.9/5</div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Verified Anglers</div>
              </div>
              <div className="w-px h-16 bg-slate-100 hidden md:block"></div>
              <div className="flex flex-col items-center">
                 <div className="text-4xl font-black text-secondary tracking-tighter">FAST</div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">NZ Wide Delivery</div>
              </div>
              <div className="w-px h-16 bg-slate-100 hidden md:block"></div>
              <div className="flex flex-col items-center">
                 <div className="text-4xl font-black text-secondary tracking-tighter">FREE</div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Returns Policy</div>
              </div>
           </div>
           
           <Link 
             href="/login" 
             className="inline-block bg-primary text-secondary font-black py-6 px-16 rounded-full transition-all uppercase tracking-[0.3em] text-xs shadow-2xl shadow-primary/20 hover:scale-105"
           >
             Sign Up Now
           </Link>
         </div>
      </section>
    </div>
  );
}
