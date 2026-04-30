import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { WishlistButton } from '@/components/products/WishlistButton';

export const revalidate = 60; // Revalidate every 60 seconds

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const categorySlug = typeof resolvedParams.category === 'string' ? resolvedParams.category : null;
  
  if (categorySlug) {
    const supabase = createClient();
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('slug', categorySlug)
      .single();
      
    if (category) {
      return {
        title: `${category.name} | Catch-22 Gear`,
        description: `Premium ${category.name.toLowerCase()} and fishing equipment from Catch-22. Built for the elements.`,
      };
    }
  }

  return {
    title: 'All Gear | Catch-22',
    description: 'Browse our full collection of premium fishing braid, lures, and apparel. High performance gear for harsh environments.',
  };
}

import { ProductCard } from '@/components/products/ProductCard';

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
        category_id,
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
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Sidebar / Categories */}
          <div className="w-full md:w-64 flex-shrink-0">
            <h2 className="text-xl font-black text-secondary uppercase tracking-widest mb-6 border-b-2 border-primary pb-2 inline-block">Categories</h2>
            <ul className="space-y-1">
              <li>
                <Link 
                  href="/products" 
                  className={`block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${!categorySlug ? 'bg-primary text-white shadow-md' : 'text-secondary hover:bg-slate-50 hover:text-primary'}`}
                >
                  All Gear
                </Link>
              </li>
              {categories?.map((category) => (
                <li key={category.id}>
                  <Link 
                    href={`/products?category=${category.slug}`}
                    className={`block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${categorySlug === category.slug ? 'bg-primary text-white shadow-md' : 'text-secondary hover:bg-slate-50 hover:text-primary'}`}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-12 bg-slate-50 p-6 rounded-2xl border border-slate-100 hidden md:block">
              <h3 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Need Help?</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
                Can't find what you're looking for? Contact our gear experts for advice.
              </p>
              <Link href="/contact" className="text-xs font-black text-primary uppercase hover:underline">
                Contact Us &rarr;
              </Link>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex flex-col mb-10">
              <h1 className="text-4xl font-black tracking-tight text-secondary uppercase">
                {categorySlug ? categories?.find(c => c.slug === categorySlug)?.name || 'Gear' : 'All Catch-22 Gear'}
              </h1>
              <div className="h-1.5 w-24 bg-primary mt-3"></div>
            </div>
            
            {products?.length === 0 ? (
              <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-bold uppercase tracking-widest">No gear found in this category.</p>
                <Link href="/products" className="inline-block mt-4 text-primary font-black uppercase text-sm hover:underline">
                  View all products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                {products?.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
