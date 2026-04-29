import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createClient();
  
  // Await searchParams in Next 15+
  const resolvedSearchParams = await searchParams;
  const categorySlug = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : null;

  // Fetch Categories for the Sidebar
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  // Fetch Products (with optional category filtering)
  let query = supabase
    .from('products')
    .select(`
      id, name, slug, price, image_url, stock_status,
      product_categories!inner (
        categories!inner (slug)
      )
    `)
    .eq('stock_status', 'instock')
    .order('created_at', { ascending: false });

  if (categorySlug) {
    query = query.eq('product_categories.categories.slug', categorySlug);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return <div className="p-8 text-center text-red-500">Failed to load products.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar / Categories */}
        <div className="w-full md:w-64 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Categories</h2>
          <ul className="space-y-2">
            <li>
              <Link 
                href="/products" 
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${!categorySlug ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                All Gear
              </Link>
            </li>
            {categories?.map((category) => (
              <li key={category.id}>
                <Link 
                  href={`/products?category=${category.slug}`}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${categorySlug === category.slug ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-8">
            {categorySlug ? categories?.find(c => c.slug === categorySlug)?.name || 'Gear' : 'All Catch-22 Gear'}
          </h1>
          
          {products?.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-slate-500">No products found in this category.</p>
            </div>
          ) : (
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
          )}
        </div>

      </div>
    </div>
  );
}
