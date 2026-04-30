import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

export const revalidate = 60;

async function BestSellers() {
  const supabase = createClient();
  
  // Fetch 4 featured products (Best Sellers)
  const { data: featuredProducts } = await supabase
    .from('products')
    .select('id, name, slug, price, image_url')
    .eq('stock_status', 'instock')
    .limit(4);

  return (
    <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
      {featuredProducts?.map((product) => (
        <div key={product.id} className="group flex flex-col h-full border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <Link href={`/products/${product.slug}`} className="relative h-64 overflow-hidden bg-slate-100 block">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="w-full h-full object-center object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
            )}
          </Link>
          <div className="p-4 flex-grow flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-secondary uppercase mb-1 line-clamp-2 min-h-[2.5rem]">
                <Link href={`/products/${product.slug}`}>
                  {product.name}
                </Link>
              </h3>
            </div>
            <div className="flex items-center justify-between mt-4">
               <p className="text-lg font-black text-primary">${product.price.toFixed(2)}</p>
               <Link 
                href={`/products/${product.slug}`}
                className="bg-secondary text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-primary transition-colors uppercase"
               >
                 View
               </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BestSellersLoading() {
  return (
    <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col h-full border border-slate-50 rounded-xl overflow-hidden">
           <div className="h-64 bg-slate-50"></div>
           <div className="p-4 space-y-4">
              <div className="h-4 bg-slate-50 rounded w-3/4"></div>
              <div className="flex justify-between items-center">
                 <div className="h-6 bg-slate-50 rounded w-1/4"></div>
                 <div className="h-8 bg-slate-50 rounded-full w-16"></div>
              </div>
           </div>
        </div>
      ))}
    </div>
  );
}

export default async function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative h-[500px] flex items-center overflow-hidden">
        <Image
          src="/hero.jpg"
          alt="Fishing background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-secondary/40" />
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="max-w-xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6 uppercase">
              Equip Yourself for the Elements
            </h1>
            <p className="mt-4 text-xl text-white font-medium mb-10">
              Premium fishing gear, apparel, and accessories tested in the harshest environments.
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold py-4 px-10 rounded-full transition-all uppercase tracking-widest text-sm"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* Charity Banner */}
      <div className="bg-secondary py-8 text-center text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wider">
            2.5% of all profits donated to NZ Sea Cleaners Charity Trust
          </h2>
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl font-black tracking-tight text-secondary uppercase">Best Sellers</h2>
          <div className="h-1 w-20 bg-primary mt-2"></div>
        </div>

        <Suspense fallback={<BestSellersLoading />}>
          <BestSellers />
        </Suspense>

        <div className="mt-16 text-center">
          <Link 
            href="/products" 
            className="inline-block border-2 border-secondary text-secondary hover:bg-secondary hover:text-white font-bold py-3 px-8 rounded-full transition-all uppercase tracking-widest text-sm"
          >
            View All Products
          </Link>
        </div>
      </div>

      {/* Thank you section */}
      <div className="bg-slate-50 py-16 text-center border-t border-slate-100">
         <h3 className="text-3xl font-black text-secondary uppercase mb-4">Thank you for shopping with us!</h3>
         <p className="text-slate-500 max-w-xl mx-auto px-4">
           We appreciate your support in our mission to provide high-quality gear while giving back to our oceans.
         </p>
      </div>
    </div>
  );
}
