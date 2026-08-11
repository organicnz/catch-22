import { CouponCreator, CouponDelete } from '@/components/admin/CouponCreator';
import { requireAdmin } from '@/lib/admin-auth';
import { BadgePercent } from 'lucide-react';

export const metadata = {
  title: 'Coupons — Admin · Catch-22',
  robots: { index: false, follow: false },
};

type Coupon = {
  id: number;
  code: string;
  discount_type: string | null;
  amount: number | null;
  expiry_date: string | null;
};

export default async function AdminCouponsPage() {
  const { adminClient } = await requireAdmin();

  const { data: coupons } = await adminClient
    .from('coupons')
    .select('id, code, discount_type, amount, expiry_date')
    .order('code');

  const rows = (coupons || []) as Coupon[];
  const now = Date.now();

  return (
    <div>
      <div className="flex flex-col mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <BadgePercent size={14} className="text-secondary" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Admin Panel
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-secondary uppercase">Coupons</h1>
        <div className="h-1.5 w-24 bg-primary mt-3" />
        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          {rows.length} promo codes
        </p>
      </div>

      <CouponCreator />

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="bg-slate-50 p-16 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
              No coupons yet. Create one above.
            </p>
          </div>
        ) : (
          rows.map((c) => {
            const expired = c.expiry_date && new Date(c.expiry_date).getTime() < now;
            return (
              <div
                key={c.id}
                className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm"
              >
                <div className="px-8 py-5 grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-sm font-black text-secondary uppercase tracking-wider">
                      {c.code}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">#{c.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">
                      Discount
                    </p>
                    <p className="text-lg text-primary font-black">
                      {c.discount_type === 'percent'
                        ? `${c.amount}%`
                        : `$${Number(c.amount).toFixed(2)}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">
                      Expiry
                    </p>
                    <p
                      className={`text-sm font-black ${
                        expired ? 'text-rose-500' : 'text-secondary'
                      }`}
                    >
                      {c.expiry_date
                        ? new Date(c.expiry_date).toLocaleDateString('en-NZ', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    {expired && (
                      <span className="text-[10px] font-black uppercase tracking-widest rounded-full px-2.5 py-1 bg-rose-100 text-rose-700">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <CouponDelete id={c.id} code={c.code} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
