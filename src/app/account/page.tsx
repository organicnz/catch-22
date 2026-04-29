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

  // Find the customer record that matches the auth email
  const { data: customer } = await supabase
    .from('customers')
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-8">
        Account Overview
      </h1>
      <p className="text-slate-600 mb-12">
        Signed in as <span className="font-semibold text-slate-900">{user.email}</span>
      </p>

      <h2 className="text-xl font-bold text-slate-900 mb-6">Your Order History</h2>
      
      {orders.length === 0 ? (
        <div className="bg-slate-50 p-8 rounded-xl border border-slate-100 text-center">
          <p className="text-slate-500">No past orders found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Order Placed</p>
                  <p className="text-sm text-slate-900">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total</p>
                  <p className="text-sm text-slate-900">${Number(order.total_amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="px-6 py-4">
                <ul className="divide-y divide-slate-100">
                  {order.order_items.map((item: any, idx: number) => (
                    <li key={idx} className="py-4 flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.product_name}</p>
                        <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-900">${Number(item.total).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
