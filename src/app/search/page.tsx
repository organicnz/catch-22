import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { WishlistButton } from '@/components/products/WishlistButton';

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
  let posts: any[] = [];
  
  if (q) {
    // 1. Search Products
    const { data: prodData } = await supabase
      .from('products')
      .select('id, name, slug, price, image_url, stock_status')
      .ilike('name', `%${q}%`)
      .eq('stock_status', 'instock')
      .order('created_at', { ascending: false });
      
    products = prodData || [];

    // 2. Search Content (Posts/Pages)
    const { data: contentData } = await supabase
      .from('content')
      .select('id, title, slug, type, created_at')
      .or(`title.ilike.%${q}%,body.ilike.%${q}%`)
      .eq('status', 'publish')
      .limit(10);

    const spamKeywords = ['casino', 'slot', 'betting', 'gambling', 'poker', 'bingo', 'judi', 'genset'];
    posts = contentData?.filter(item => {
      const titleLower = item.title.toLowerCase();
      const isSpam = spamKeywords.some(kw => titleLower.includes(kw));
      const hasNonLatin = /[^\u0000-\u007F]/.test(item.title) && !titleLower.includes('catch-22');
      return !isSpam && !hasNonLatin;
    }) || [];
  }

  return (
    <div className="bg-white min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col mb-10">
          <h1 className="text-4xl font-black tracking-tight text-secondary uppercase">
            Search Results
          </h1>
          <div className="h-1.5 w-24 bg-primary mt-3"></div>
          <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs">
            Results for <span className="text-primary">"{q}"</span>
          </p>
        </div>

        {/* Product Results */}
        {products.length > 0 && (
          <div className="mb-20">
            <h2 className="text-2xl font-black text-secondary uppercase tracking-widest mb-8 border-b-2 border-primary pb-2 inline-block">Gear Found</h2>
            <div className="grid grid-cols-1 gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <div key={product.id} className="group flex flex-col h-full border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                  <Link href={`/products/${product.slug}`} className="relative h-64 overflow-hidden bg-slate-100 block">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="w-full h-full object-center object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-black uppercase tracking-widest text-[10px]">No Image</div>
                    )}
                  </Link>
                  <div className="absolute top-3 right-3 z-10 scale-90 origin-top-right">
                    <WishlistButton product={product} />
                  </div>
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

        {/* Content Results */}
        {posts.length > 0 && (
          <div className="mb-20">
            <h2 className="text-2xl font-black text-secondary uppercase tracking-widest mb-8 border-b-2 border-primary pb-2 inline-block">From the Logbook & Pages</h2>
            <div className="grid gap-6 max-w-3xl">
              {posts.map((post) => (
                <div key={post.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                   <h3 className="text-lg font-black text-secondary uppercase mb-2">
                     <Link href={`/${post.slug}`} className="hover:text-primary transition-colors">
                       {post.title}
                     </Link>
                   </h3>
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black bg-slate-200 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">{post.type}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()}</span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {products.length === 0 && posts.length === 0 && (
          <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-black uppercase tracking-widest mb-6">No matches found.</p>
            <Link 
              href="/products" 
              className="inline-block border-2 border-secondary text-secondary hover:bg-secondary hover:text-white font-black py-3 px-8 rounded-full transition-all uppercase tracking-widest text-xs"
            >
              Browse all gear
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
