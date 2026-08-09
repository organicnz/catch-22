import { MfaSettings } from '@/components/account/MfaSettings';
import { UserSettings } from '@/components/account/UserSettings';
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect';
import { createAdminClient, createServerClient } from '@/lib/supabase-server';
import { ExternalLink, MapPin, Package, ShoppingBag, TrendingUp, User } from 'lucide-react';
import { redirect } from 'next/navigation';
import { LogoutButton } from '../../components/account/LogoutButton';

export default async function AccountPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check MFA status
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData && aalData.nextLevel !== aalData.currentLevel && aalData.nextLevel === 'aal2') {
    redirect('/auth/mfa');
  }

  // Find the profile record that matches the auth email
  const { data: customer } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, user_id, is_admin')
    .or(`email.eq.${user.email},user_id.eq.${user.id}`)
    .single();

  // If found by email but user_id is not set, link it now
  if (customer && !customer.user_id) {
    await supabase.from('profiles').update({ user_id: user.id }).eq('id', customer.id);
  }

  const isAdmin = customer?.is_admin === true;

  // Admin: fetch all orders; regular user: fetch own orders only
  type OrderItem = { product_name: string | null; quantity: number | null; total: number | null };
  type ShippingAddress = {
    line1?: string; line2?: string; city?: string;
    state?: string; postal_code?: string; country?: string;
  };
  type AdminOrder = {
    id: number;
    created_at: string | null;
    status: string | null;
    total_amount: number | null;
    currency: string | null;
    stripe_session_id: string | null;
    shipping_address: ShippingAddress | null;
    order_items: OrderItem[];
    profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
  };

  let allOrders: AdminOrder[] = [];
  if (isAdmin) {
    const adminClient = await createAdminClient();
    const { data } = await adminClient
      .from('orders')
      .select(`
        id, created_at, status, total_amount, currency,
        stripe_session_id, shipping_address,
        order_items ( product_name, quantity, total ),
        profiles ( first_name, last_name, email )
      `)
      .order('created_at', { ascending: false })
      .limit(200);
    allOrders = (data || []) as AdminOrder[];
  }

  let orders: {
    id: number;
    created_at: string | null;
    status: string | null;
    total_amount: number | null;
    order_items: OrderItem[];
  }[] = [];
  if (customer && !isAdmin) {
    const { data } = await supabase
      .from('orders')
      .select('id, created_at, status, total_amount, order_items(product_name, quantity, total)')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
    orders = data || [];
  }

  const formatAddress = (addr: ShippingAddress | null) => {
    if (!addr) return 'No address';
    return [addr.line1, addr.line2, addr.city, addr.postal_code, addr.country]
      .filter(Boolean).join(', ');
  };

  // Admin stats
  const totalRevenue = allOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
  const processing = allOrders.filter((o) => o.status === 'processing').length;
  const completed = allOrders.filter((o) => o.status === 'completed').length;

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mb-10">
          <h1 className="text-4xl font-black tracking-tight text-secondary uppercase">
            Account Overview
          </h1>
          <div className="h-1.5 w-24 bg-primary mt-3" />
          <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">
            Signed in as <span className="text-secondary font-black">{user.email}</span>
          </p>
        </div>

        {/* ── Admin Dashboard (visible to admins only) ─────────────────── */}
        {isAdmin && (
          <section className="mt-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Package size={14} className="text-secondary" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Admin
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-secondary uppercase mb-2">
              All Orders
            </h2>
            <div className="h-1.5 w-24 bg-primary mb-10" />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { label: 'Total Orders', value: allOrders.length, icon: ShoppingBag },
                { label: 'Processing', value: processing, icon: Package },
                { label: 'Completed', value: completed, icon: TrendingUp },
                { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-secondary rounded-3xl p-6">
                  <Icon size={16} className="text-primary mb-3" />
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">
                    {label}
                  </p>
                  <p className="text-2xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Orders list */}
            <div className="space-y-6">
              {allOrders.length === 0 ? (
                <div className="bg-slate-50 p-16 rounded-3xl border border-dashed border-slate-200 text-center">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                    No orders yet.
                  </p>
                </div>
              ) : (
                allOrders.map((order) => {
                  const cust = order.profiles;
                  const name = cust
                    ? [cust.first_name, cust.last_name].filter(Boolean).join(' ') || cust.email
                    : 'Guest';
                  const stripeUrl = order.stripe_session_id
                    ? `https://dashboard.stripe.com/payments/${order.stripe_session_id}`
                    : null;

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Order</p>
                          <p className="text-sm text-secondary font-black">#{order.id}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString('en-NZ', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Customer</p>
                          <div className="flex items-center gap-1.5">
                            <User size={11} className="text-slate-400 shrink-0" />
                            <p className="text-sm text-secondary font-black truncate">{name}</p>
                          </div>
                          {cust?.email && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{cust.email}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Ship To</p>
                          <div className="flex items-start gap-1.5">
                            <MapPin size={11} className="text-slate-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-600 font-bold leading-tight">
                              {formatAddress(order.shipping_address)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Total</p>
                          <p className="text-lg text-primary font-black">
                            ${Number(order.total_amount).toFixed(2)}
                            <span className="text-[10px] text-slate-400 font-bold ml-1">
                              {(order.currency || 'NZD').toUpperCase()}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <OrderStatusSelect
                            orderId={order.id}
                            currentStatus={order.status || 'processing'}
                          />
                          {stripeUrl && (
                            <a
                              href={stripeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
                            >
                              <ExternalLink size={11} /> Stripe
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="px-8 py-5">
                        <ul className="divide-y divide-slate-50">
                          {order.order_items.map((item) => (
                            <li
                              key={item.product_name ?? String(Math.random())}
                              className="py-3 flex justify-between items-center group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform" />
                                <div>
                                  <p className="text-sm font-black text-secondary uppercase tracking-wider">
                                    {item.product_name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                    Qty: {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm font-black text-secondary">
                                ${Number(item.total).toFixed(2)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* ── My Order History (regular users) ─────────────────────────── */}
        <div className="flex flex-col mb-8 mt-16">
          <h2 className="text-2xl font-black text-secondary uppercase tracking-widest mb-2 inline-block">
            {isAdmin ? 'My Orders' : 'Order History'}
          </h2>
          <div className="h-1 w-12 bg-primary" />
        </div>

        {orders.length === 0 ? (
          <div className="bg-slate-50 p-16 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
              No past orders found.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">
                      Order Placed
                    </p>
                    <p className="text-sm text-secondary font-black">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString('en-NZ', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">
                      Total Amount
                    </p>
                    <p className="text-sm text-primary font-black">
                      ${Number(order.total_amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">
                      Status
                    </p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        order.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-end items-center">
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
                      ID: {order.id.toString().substring(0, 8)}
                    </p>
                  </div>
                </div>
                <div className="px-8 py-6">
                  <ul className="divide-y divide-slate-50">
                    {order.order_items.map((item) => (
                      <li
                        key={item.product_name ?? String(Math.random())}
                        className="py-4 flex justify-between items-center group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform" />
                          <div>
                            <p className="text-sm font-black text-secondary uppercase tracking-wider">
                              {item.product_name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-secondary">
                          ${Number(item.total).toFixed(2)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Preferences Section */}
        <UserSettings />

        <div className="max-w-xl">
          <MfaSettings />
        </div>

        {/* Danger Zone / Logout */}
        <div className="mt-24 pt-12 border-t border-slate-100 flex flex-col items-start gap-8">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-secondary uppercase tracking-widest mb-2">
              Session Control
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Sign out of your account on this device
            </p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
