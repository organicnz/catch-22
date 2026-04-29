import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 60;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createClient();
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';

  let products: any[] = [];
  
  if (q) {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, image_url, stock_status')
      .ilike('name', `%${q}%`)
      .eq('stock_status', 'instock')
      .order('created_at', { ascending: false });
      
    products = data || [];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[70vh]">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">
        Search Results
      </h1>
      <p className="text-slate-500 mb-8">
        Showing results for <span className="font-semibold text-slate-900">"{q}"</span>
      </p>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-lg text-slate-600 mb-4">No gear found matching your search.</p>
          <Link href="/products" className="text-indigo-600 font-semibold hover:text-indigo-700">
            Browse all products &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <div key={product.id} className="group relative">
              <div className="w-full min-h-64 bg-slate-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-64 lg:aspect-none relative">
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
      )}
    </div>
  );
}