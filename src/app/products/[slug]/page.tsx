import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/components/checkout/AddToCartButton';

export const revalidate = 60;

export default async function ProductDetails({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  
  // Need to await params in Next 15+
  const slug = (await params).slug;
  
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !product) {
    return notFound();
  }

  return (
    <div className="bg-white">
      <div className="pt-6">
        <div className="mx-auto mt-6 max-w-2xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
          <div className="aspect-w-3 aspect-h-4 rounded-lg overflow-hidden lg:block bg-slate-100 relative min-h-[500px]">
            {product.image_url && (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="w-full h-full object-center object-cover"
              />
            )}
          </div>
          
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{product.name}</h1>
            <div className="mt-3">
              <p className="text-3xl text-slate-900">${product.price.toFixed(2)}</p>
            </div>
            
            <div className="mt-6">
              <div
                className="text-base text-slate-700 space-y-6"
                dangerouslySetInnerHTML={{ __html: product.description || product.short_description || '' }}
              />
            </div>
            
            <form className="mt-10">
              <button
                type="submit"
                disabled={product.stock_status !== 'instock'}
                className="w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock_status === 'instock' ? 'Add to bag' : 'Out of stock'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
