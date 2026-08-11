import { ProductEditor } from '@/components/admin/ProductEditor';
import { requireAdmin } from '@/lib/admin-auth';
import { Package } from 'lucide-react';

export const metadata = {
  title: 'Products — Admin · Catch-22',
  robots: { index: false, follow: false },
};

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  stock_status: string | null;
  image_url: string | null;
  categories: { categories: { name: string }[] }[];
};

export default async function AdminProductsPage() {
  const { adminClient } = await requireAdmin();

  const { data: products } = await adminClient
    .from('products')
    .select(
      `id, name, slug, price, sale_price, stock_status, image_url,
       product_categories ( categories ( name ) )`
    )
    .order('name');

  const rows = (products || []) as unknown as ProductRow[];

  const stockBadge: Record<string, string> = {
    instock: 'bg-emerald-100 text-emerald-800',
    outofstock: 'bg-rose-100 text-rose-800',
    onbackorder: 'bg-amber-100 text-amber-800',
  };

  return (
    <div>
      <div className="flex flex-col mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Package size={14} className="text-secondary" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Admin Panel
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-secondary uppercase">Products</h1>
        <div className="h-1.5 w-24 bg-primary mt-3" />
        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          {rows.length} products
        </p>
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="bg-slate-50 p-16 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
              No products found.
            </p>
          </div>
        ) : (
          rows.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm"
            >
              <div className="px-8 py-5 flex flex-wrap items-center gap-6">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-14 h-14 rounded-2xl object-cover bg-slate-100 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 shrink-0" />
                )}

                <div className="flex-1 min-w-64">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-sm font-black text-secondary uppercase tracking-wider">
                      {p.name}
                    </p>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest rounded-full px-2.5 py-1 ${
                        stockBadge[p.stock_status || ''] || 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.stock_status || 'unknown'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">
                    {p.categories
                      .flatMap((c) => c.categories ?? [])
                      .map((c) => c.name)
                      .filter(Boolean)
                      .join(' · ') || 'Uncategorised'}{' '}
                    · #{p.id}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-lg text-primary font-black">
                    ${Number(p.price).toFixed(2)}
                    {p.sale_price !== null && (
                      <span className="text-[10px] text-slate-400 font-bold ml-1 line-through">
                        ${Number(p.sale_price).toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>

                <ProductEditor
                  product={{
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    sale_price: p.sale_price,
                    stock_status: p.stock_status,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
