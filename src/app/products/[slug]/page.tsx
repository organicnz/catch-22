import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/components/checkout/AddToCartButton';
import { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = (await params).slug;
  const supabase = createClient();
  
  const { data: product } = await supabase
    .from('products')
    .select('name, short_description, description, image_url')
    .eq('slug', slug)
    .single();

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const rawDescription = product.short_description || product.description || '';
  const cleanDescription = rawDescription.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
  const description = cleanDescription.length > 150 ? cleanDescription.substring(0, 147) + '...' : cleanDescription;

  return {
    title: `${product.name} | Catch-22 Gear`,
    description: description,
    openGraph: {
      title: product.name,
      description: description,
      images: product.image_url ? [{ url: product.image_url }] : [],
    },
  };
}

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
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          {/* Image gallery */}
          <div className="flex flex-col">
            <div className="aspect-square rounded-3xl overflow-hidden bg-slate-50 relative border border-slate-100 shadow-inner">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="w-full h-full object-center object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">No Image</div>
              )}
            </div>
            
            {/* Gallery placeholder if more images existed */}
            {product.gallery_urls && product.gallery_urls.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                 {product.gallery_urls.slice(0, 4).map((url: string, index: number) => (
                    <div key={index} className="aspect-square relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                      <Image src={url} alt={`${product.name} gallery ${index}`} fill className="object-cover" />
                    </div>
                 ))}
              </div>
            )}
          </div>
          
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0 flex flex-col">
            <div className="mb-6">
               <nav className="flex mb-4" aria-label="Breadcrumb">
                 <ol className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                   <li><Link href="/products" className="hover:text-primary transition-colors">Gear</Link></li>
                   <li><span className="mx-1">/</span></li>
                   <li className="text-primary truncate">{product.name}</li>
                 </ol>
               </nav>
               <h1 className="text-4xl font-black tracking-tight text-secondary uppercase leading-tight mb-4">{product.name}</h1>
               <div className="flex items-center gap-4">
                  <p className="text-3xl font-black text-primary">${product.price.toFixed(2)}</p>
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">In Stock</span>
               </div>
            </div>
            
            <div className="prose prose-slate max-w-none">
              <h3 className="text-sm font-black text-secondary uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Description</h3>
              <div
                className="text-base text-slate-600 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: product.description || product.short_description || '' }}
              />
            </div>
            
            <div className="mt-10 pt-10 border-t border-slate-100">
              <AddToCartButton product={product} variations={product.product_variations || []} />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                  <span className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Shipping</span>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">NZ Wide Delivery</span>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                  <span className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Charity</span>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">2.5% to Sea Cleaners</span>
               </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pb-16 border-t border-slate-100 pt-16">
            <div className="flex flex-col items-center mb-12">
              <h2 className="text-3xl font-black tracking-tight text-secondary uppercase">You might also like</h2>
              <div className="h-1 w-20 bg-primary mt-2"></div>
            </div>
            <div className="grid grid-cols-1 gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className="group flex flex-col h-full border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                  <Link href={`/products/${relatedProduct.slug}`} className="relative h-64 overflow-hidden bg-slate-100 block">
                    {relatedProduct.image_url ? (
                      <Image
                        src={relatedProduct.image_url}
                        alt={relatedProduct.name}
                        fill
                        className="w-full h-full object-center object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Image</div>
                    )}
                  </Link>
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-secondary uppercase mb-1 line-clamp-2 min-h-[2.5rem]">
                        <Link href={`/products/${relatedProduct.slug}`}>
                          {relatedProduct.name}
                        </Link>
                      </h3>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                       <p className="text-lg font-black text-primary">${relatedProduct.price.toFixed(2)}</p>
                       <Link 
                        href={`/products/${relatedProduct.slug}`}
                        className="bg-secondary text-white text-[10px] font-bold px-4 py-2 rounded-full hover:bg-primary transition-colors uppercase tracking-widest"
                       >
                         View
                       </Link>
                    </div>
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
