import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 60;

export default async function Home() {
  const supabase = createClient();
  
  // Fetch 3 featured products
  const { data: featuredProducts } = await supabase
    .from('products')
    .select('id, name, slug, price, image_url')
    .eq('stock_status', 'instock')
    .limit(3);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-slate-900 h-[600px] flex items-center justify-center text-center">
        <div className="absolute inset-0 overflow-hidden">
          {/* Placeholder for a hero background if one exists, otherwise a gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 to-slate-900 opacity-90" />
        </div>
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
            Equip Yourself for the Elements
          </h1>
          <p className="mt-4 text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Premium fishing gear, apparel, and accessories tested in the harshest environments. Built for those who demand performance.
          </p>
          <Link
            href="/products"
            className="inline-block bg-white border border-transparent rounded-md py-3 px-8 text-base font-medium text-slate-900 hover:bg-slate-50 transition-colors"
          >
            Shop the Collection
          </Link>
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Trending Gear</h2>
          <Link href="/products" className="hidden text-sm font-medium text-indigo-600 hover:text-indigo-500 md:block">
            Shop all products <span aria-hidden="true"> &rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {featuredProducts?.map((product) => (
            <div key={product.id} className="group relative">
              <div className="w-full min-h-80 bg-slate-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none relative">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="w-full h-full object-center object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                )}
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-slate-700 font-medium">
                    <Link href={`/products/${product.slug}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </Link>
                  </h3>
                </div>
                <p className="text-sm font-semibold text-slate-900">${product.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/products" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Shop all products <span aria-hidden="true"> &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
