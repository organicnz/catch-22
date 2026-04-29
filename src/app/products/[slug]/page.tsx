import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/components/checkout/AddToCartButton';

export const revalidate = 60;

export default async function ProductDetails({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const slug = (await params).slug;
  
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      product_categories (
        category_id
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !product) {
    return notFound();
  }

  // Fetch related products from the same category
  let relatedProducts: any[] = [];
  const categoryIds = product.product_categories?.map((pc: any) => pc.category_id) || [];

  if (categoryIds.length > 0) {
    const { data: related } = await supabase
      .from('products')
      .select(`
        id, name, slug, price, image_url, stock_status,
        product_categories!inner (category_id)
      `)
      .in('product_categories.category_id', categoryIds)
      .neq('id', product.id)
      .eq('stock_status', 'instock')
      .limit(4);
      
    // Filter duplicates locally if the query returns multiple due to multiple categories
    if (related) {
      const uniqueIds = new Set();
      relatedProducts = related.filter((p) => {
        if (!uniqueIds.has(p.id)) {
          uniqueIds.add(p.id);
          return true;
        }
        return false;
      });
    }
  }

  return (
    <div className="bg-white">
      <div className="pt-6">
        <div className="mx-auto mt-6 max-w-2xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
          <div className="aspect-w-3 aspect-h-4 rounded-lg overflow-hidden lg:block bg-slate-100 relative min-h-[500px]">
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
            
            <div className="mt-10">
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mx-auto mt-24 max-w-2xl sm:px-6 lg:max-w-7xl lg:px-8 pb-16 border-t border-slate-100 pt-16">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-8">You might also like</h2>
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className="group relative">
                  <div className="w-full min-h-64 bg-slate-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-64 lg:aspect-none relative">
                    {relatedProduct.image_url ? (
                      <Image
                        src={relatedProduct.image_url}
                        alt={relatedProduct.name}
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
                        <Link href={`/products/${relatedProduct.slug}`}>
                          <span aria-hidden="true" className="absolute inset-0" />
                          {relatedProduct.name}
                        </Link>
                      </h3>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">${relatedProduct.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}