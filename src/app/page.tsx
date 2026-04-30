import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { sanitizeText } from '@/lib/sanitize';

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
    images: [{ url: '/thunder-charter.jpg', width: 1200, height: 630, alt: 'Catch-22 Premium Fishing Gear New Zealand' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catch-22 | Premium Fishing Gear New Zealand',
    description: 'Premium fishing braid, lures, and apparel tested in the harshest New Zealand environments. Built to endure. Free NZ shipping available.',
    images: ['/thunder-charter.jpg'],
  },
};

import { ProductCard } from '@/components/products/ProductCard';

async function BestSellers() {
  const supabase = createClient();
  
  // Fetch 4 featured products (Best Sellers)
  const { data: featuredProducts } = await supabase
    .from('products')
    .select('id, name, slug, price, regular_price, sale_price, image_url')
    .eq('stock_status', 'instock')
    .limit(4);

  return (
    <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
      {featuredProducts?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function BestSellersLoading() {
  return (
    <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col h-full bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden">
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

  if (dealError) {
    console.error('[DealOfTheDay] Supabase error:', dealError.message);
  }
  if (!dealProduct) return (
    <div className="bg-slate-900 py-24 text-center">
      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No deal available today.</p>
    </div>
  );

  return (
    <div className="bg-slate-900 py-24 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#D1FF00_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <span className="text-primary font-black uppercase tracking-[0.4em] text-xs mb-6 block">Limited Time Offer</span>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-8 leading-[0.9]">
              Deal of <br /> <span className="text-primary">The Day</span>
            </h2>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] mb-12">
              <h3 className="text-2xl font-black text-white uppercase mb-4">{dealProduct.name}</h3>
              <p className="text-slate-400 font-medium mb-8 line-clamp-3">
                {dealProduct.description?.replace(/<[^>]*>/g, '') || 'Premium fishing gear at an unbeatable price.'}
              </p>
              <div className="flex items-end gap-6 mb-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Was</span>
                  <span className="text-2xl text-slate-500 line-through font-bold">${dealProduct.regular_price?.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Now Only</span>
                  <span className="text-5xl font-black text-primary leading-none">${dealProduct.price.toFixed(2)}</span>
                </div>
              </div>
              <Link 
                href={`/products/${dealProduct.slug}`}
                className="inline-block bg-primary hover:bg-primary-dark text-white font-black py-5 px-12 rounded-full transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 w-full text-center"
              >
                Claim This Deal
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="relative aspect-square w-full max-w-[500px] mx-auto">
               <div className="absolute inset-0 bg-primary rounded-full blur-[100px] opacity-20 animate-pulse" />
               {dealProduct.image_url && (
                 <Image 
                   src={dealProduct.image_url}
                   alt={dealProduct.name}
                   fill
                   loading="lazy"
                   className="object-contain relative z-10 drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)]"
                 />
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustedByPros() {
  const testimonials = [
    {
      quote: "There you go mate 40.1kg. We got 4 yesterday - your braid doing the business.",
      author: "Charles Cockery",
      role: "THUNDER Charter"
    },
    {
      quote: "We landed a couple of 30+kg kingies on the new line.",
      author: "Charles Cockery",
      role: "THUNDER Charter"
    },
    {
      quote: "Been out catching 30kg kingfish on your 60lb braid 🤙",
      author: "Charles Cockery",
      role: "THUNDER Charter"
    },
    {
      quote: "All on your braid - your braid latched onto mate 40.1kg. Legendary Sledger Rigs doing the work.",
      author: "Ham & Ty",
      role: "Fishing Adventures"
    }
  ];

  return (
    <div className="bg-white py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-24">
          <h2 className="text-4xl font-black tracking-tighter text-secondary uppercase">Trusted By The Pros</h2>
          <div className="h-2 w-24 bg-primary mt-4 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {testimonials.map((t, i) => (
            <div key={i} className="relative group">
              <div className="absolute -top-10 -left-6 text-[120px] font-black text-slate-100 select-none group-hover:text-primary/10 transition-colors">&quot;</div>
              <div className="relative z-10">
                <p className="text-xl font-bold text-secondary italic mb-8 leading-relaxed">
                  {t.quote}
                </p>
                <div>
                  <p className="font-black text-secondary uppercase tracking-widest text-xs">{t.author}</p>
                  <p className="text-primary font-black uppercase tracking-widest text-[10px] mt-1">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function LatestLogbookEntries() {
  const supabase = createClient();
  
  // Fetch latest 3 posts
  const { data: posts, error: postsError } = await supabase
    .from('content')
    .select('id, title, slug, created_at')
    .eq('status', 'publish')
    .eq('type', 'post')
    .order('created_at', { ascending: false })
    .limit(3);

  if (postsError) {
    console.error('[LatestLogbookEntries] Supabase error:', postsError.message);
  }
  if (!posts || posts.length === 0) return (
    <div className="text-center py-12">
      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No logbook entries yet.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {posts.map((post) => {
        // Sanitize title using shared utility
        const sanitizedTitle = sanitizeText(post.title);
        
        return (
          <article key={post.id} className="group bg-white p-10 rounded-[3rem] border border-slate-100 hover:border-primary/40 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="w-24 h-24 bg-primary rounded-full blur-2xl" />
            </div>
            <time dateTime={post.created_at} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 block">
              {new Date(post.created_at).toLocaleDateString('en-NZ', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </time>
            <h3 className="text-xl font-black text-secondary uppercase leading-tight mb-8 group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
              <Link href={`/${post.slug}`}>
                {sanitizedTitle}
              </Link>
            </h3>
            <Link 
              href={`/${post.slug}`}
              className="text-[10px] font-black text-primary uppercase tracking-[0.25em] inline-flex items-center gap-3 group-hover:gap-5 transition-all"
            >
              Read Story <span className="text-lg">&rarr;</span>
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export default async function Home() {
  return (
    <div className="bg-white">
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
                sameAs: [],
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
      {/* Hero Section */}
      <section aria-label="Hero — Equip Yourself for the Elements" className="relative h-[650px] flex items-center overflow-hidden">
        <Image
          src="/thunder-charter.jpg"
          alt="THUNDER Charter boat on Bay of Plenty waters with Catch-22 gear"
          fill
          className="object-cover scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/80 to-secondary/20" />
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl mb-8 uppercase leading-[0.9]">
              Equip <br/> Yourself <br/> <span className="text-primary">for the Elements</span>
            </h1>
            <p className="mt-4 text-lg text-slate-200 font-medium mb-12 max-w-lg leading-relaxed">
              Premium fishing gear, apparel, and accessories tested in the harshest New Zealand environments. Built to endure.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-block bg-primary hover:bg-primary-dark text-white font-black py-5 px-12 rounded-full transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
              >
                Shop All Gear
              </Link>
              <Link
                href="/about-us"
                className="inline-block bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black py-5 px-12 rounded-full transition-all uppercase tracking-[0.2em] text-xs border border-white/30"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Charity Banner */}
      <section aria-label="Charity — Sea Cleaners donation" className="bg-secondary py-10 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 left-10 w-40 h-40 bg-primary rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-10 w-40 h-40 bg-primary rounded-full blur-[80px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-secondary font-black text-xl shadow-lg">2.5%</div>
             <div className="text-left">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider leading-tight">
                  of all profits donated
                </h2>
                <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">NZ Sea Cleaners Charity Trust</p>
             </div>
          </div>
          <Link href="/about-us" className="text-[10px] font-black uppercase tracking-widest border-b border-white/30 hover:border-primary hover:text-primary transition-all">
            Learn more about our mission
          </Link>
        </div>
      </section>

      <Suspense fallback={<div className="h-[600px] bg-slate-900 animate-pulse" />}>
        <DealOfTheDay />
      </Suspense>

      <TrustedByPros />

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="flex flex-col items-center mb-20">
          <h2 className="text-4xl font-black tracking-tighter text-secondary uppercase">Best Sellers</h2>
          <div className="h-2 w-24 bg-primary mt-4 rounded-full"></div>
        </div>

        <Suspense fallback={<BestSellersLoading />}>
          <BestSellers />
        </Suspense>

        <div className="mt-24 text-center">
          <Link 
            href="/products" 
            className="inline-block border-2 border-secondary/10 text-secondary hover:bg-secondary hover:text-white font-black py-5 px-12 rounded-full transition-all uppercase tracking-[0.2em] text-xs shadow-sm hover:shadow-xl"
          >
            View All Products
          </Link>
        </div>
      </div>

      {/* Latest from the Logbook */}
      <div className="bg-slate-50 border-y border-slate-100 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center mb-20 text-center">
            <h2 className="text-4xl font-black tracking-tighter text-secondary uppercase">The Logbook</h2>
            <div className="h-2 w-24 bg-primary mt-4 rounded-full"></div>
            <p className="mt-6 text-slate-500 font-medium max-w-2xl leading-relaxed text-lg">
              Stay updated with our latest adventures, gear reviews, and fishing tips from the Catch-22 crew.
            </p>
          </div>

          <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-300 font-black uppercase tracking-[0.3em] text-[10px]">Loading Logbook...</div>}>
            <LatestLogbookEntries />
          </Suspense>

          <div className="mt-20 text-center">
            <Link 
              href="/blog" 
              className="text-[10px] font-black text-primary uppercase tracking-[0.3em] hover:text-secondary transition-all flex items-center justify-center gap-4"
            >
              Explore more stories <span className="text-xl">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Thank you section */}
      <div className="bg-white py-32 text-center overflow-hidden relative">
         <div className="max-w-4xl mx-auto px-4 relative z-10">
           <h3 className="text-4xl md:text-5xl font-black text-secondary uppercase mb-8 tracking-tighter">Thank you for <br/> joining the crew</h3>
           <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl mx-auto mb-12">
             We appreciate your support in our mission to provide high-quality gear while giving back to the oceans we love.
           </p>
           <div className="flex justify-center gap-8">
              <div className="flex flex-col items-center">
                 <div className="text-2xl font-black text-secondary">4.9/5</div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Rating</div>
              </div>
              <div className="w-px h-12 bg-slate-100"></div>
              <div className="flex flex-col items-center">
                 <div className="text-2xl font-black text-secondary">Fast</div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NZ Wide Delivery</div>
              </div>
           </div>
         </div>
         
         {/* Background accent */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 pointer-events-none">
            <div className="w-[800px] h-[800px] bg-primary rounded-full blur-[150px] mx-auto" />
         </div>
      </div>
    </div>
  );
}
