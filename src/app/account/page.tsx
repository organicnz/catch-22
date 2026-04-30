import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AccountPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Find the profile record that matches the auth email
  const { data: customer } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('email', user.email)
    .single();

  let orders: any[] = [];
  if (customer) {
    const { data } = await supabase
      .from('orders')
      .select('id, created_at, status, total_amount, order_items(product_name, quantity, total)')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
    
    orders = data || [];
  }

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mb-10">
          <h1 className="text-4xl font-black tracking-tight text-secondary uppercase">
            Account Overview
          </h1>
          <div className="h-1.5 w-24 bg-primary mt-3"></div>
          <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">
            Signed in as <span className="text-secondary font-black">{user.email}</span>
          </p>
        </div>

        <div className="flex flex-col mb-8 mt-16">
          <h2 className="text-2xl font-black text-secondary uppercase tracking-widest mb-2 inline-block">Order History</h2>
          <div className="h-1 w-12 bg-primary"></div>
        </div>
        
        {orders.length === 0 ? (
          <div className="bg-slate-50 p-16 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No past orders found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Order Placed</p>
                    <p className="text-sm text-secondary font-black">{new Date(order.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Total Amount</p>
                    <p className="text-sm text-primary font-black">${Number(order.total_amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-end items-center">
                     <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">ID: {order.id.toString().substring(0, 8)}</p>
                  </div>
                </div>
                <div className="px-8 py-6">
                  <ul className="divide-y divide-slate-50">
                    {order.order_items.map((item: any, idx: number) => (
                      <li key={idx} className="py-4 flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform"></div>
                          <div>
                            <p className="text-sm font-black text-secondary uppercase tracking-wider">{item.product_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-secondary">${Number(item.total).toFixed(2)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
