import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProductsPage() {
  const supabase = createClient();
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, price, image_url, stock_status')
    .eq('stock_status', 'instock')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return <div className="p-8 text-center text-red-500">Failed to load products.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-8">
        Catch-22 Gear
      </h1>
      
      <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
        {products?.map((product) => (
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
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  No Image
                </div>
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
              <p className="text-sm font-semibold text-slate-900">
                ${product.price.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
