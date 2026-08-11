import { OrdersExport } from '@/components/admin/OrdersExport';
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect';
import { requireAdmin } from '@/lib/admin-auth';
import { ExternalLink, MapPin, Package, Search, ShoppingBag, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Orders — Admin · Catch-22',
  robots: { index: false, follow: false },
};

type ShippingAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

type OrderItem = {
  id: number;
  product_name: string | null;
  quantity: number | null;
  total: number | null;
};

type Order = {
  id: number;
  created_at: string | null;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  payment_method: string | null;
  stripe_session_id: string | null;
  shipping_address: ShippingAddress | null;
  order_items: OrderItem[];
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
};

const STATUS_FILTERS = ['all', 'processing', 'completed', 'cancelled', 'refunded', 'on-hold'];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { adminClient } = await requireAdmin();
  const { status, q } = await searchParams;

  const statusFilter = STATUS_FILTERS.includes(status || 'all') ? status || 'all' : 'all';
  const query = (q || '').trim().toLowerCase();

  // Stats need the full picture regardless of the filter
  const { data: allOrders } = await adminClient
    .from('orders')
    .select(
      `id, created_at, status, total_amount, currency,
       payment_method, stripe_session_id,
       shipping_address,
       order_items ( id, product_name, quantity, total ),
       profiles ( first_name, last_name, email )`
    )
    .order('created_at', { ascending: false })
    .limit(500);

  const orders = (allOrders || []) as Order[];

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (!query) return true;
    const customer = o.profiles;
    const name = customer
      ? [customer.first_name, customer.last_name].filter(Boolean).join(' ').toLowerCase()
      : '';
    const email = customer?.email?.toLowerCase() || '';
    const items = o.order_items
      .map((i) => i.product_name || '')
      .join(' ')
      .toLowerCase();
    return (
      String(o.id).includes(query) ||
      name.includes(query) ||
      email.includes(query) ||
      items.includes(query)
    );
  });

  const totalRevenue = orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
  const processing = orders.filter((o) => o.status === 'processing').length;
  const completed = orders.filter((o) => o.status === 'completed').length;

  const formatAddress = (addr: ShippingAddress | Record<string, string> | null) => {
    if (!addr) return 'No address';
    const a = addr as Record<string, string>;
    const line1 = a.line1 ?? a.address_1;
    const line2 = a.line2 ?? a.address_2;
    const postal = a.postal_code ?? a.postcode;
    return [line1, line2, a.city, postal, a.country].filter(Boolean).join(', ');
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
        <h1 className="text-4xl font-black tracking-tight text-secondary uppercase">Orders</h1>
        <div className="h-1.5 w-24 bg-primary mt-3" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: orders.length, icon: ShoppingBag },
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

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <nav className="flex items-center gap-2 overflow-x-auto" aria-label="Order status filter">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={s === 'all' ? '/admin' : `/admin?status=${s}`}
              className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-secondary'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-secondary'
              }`}
            >
              {s}
            </Link>
          ))}
        </nav>
        <form className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 ml-auto">
          <Search size={13} className="text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search order, customer, item…"
            className="bg-transparent text-sm font-bold text-secondary outline-none placeholder:text-slate-400 w-56"
          />
        </form>
        <OrdersExport
          orders={filtered.map((order) => {
            const customer = order.profiles;
            return {
              id: order.id,
              created_at: order.created_at,
              status: order.status,
              customer: customer
                ? [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
                  customer.email ||
                  'Guest'
                : 'Guest',
              email: customer?.email || null,
              shipping: formatAddress(order.shipping_address),
              items: order.order_items
                .map((i) => `${i.product_name || 'Item'} x${i.quantity || 1}`)
                .join('; '),
              total: order.total_amount,
            };
          })}
        />
      </div>

      {/* Orders */}
      <div className="space-y-6">
        {filtered.length === 0 ? (
          <div className="bg-slate-50 p-16 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
              {orders.length === 0 ? 'No orders yet.' : 'No orders match the filter.'}
            </p>
          </div>
        ) : (
          filtered.map((order) => {
            const customer = order.profiles;
            const name = customer
              ? [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
                customer.email
              : 'Guest';
            const shippingAddr = formatAddress(order.shipping_address);
            const stripeUrl = order.stripe_session_id
              ? `https://dashboard.stripe.com/payments/${order.stripe_session_id}`
              : null;

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Order header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">
                      Order
                    </p>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-sm text-secondary font-black hover:text-primary transition-colors"
                    >
                      #{order.id} <ExternalLink size={10} className="inline text-slate-300" />
                    </Link>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString('en-NZ', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">
                      Customer
                    </p>
                    <div className="flex items-center gap-1.5">
                      <User size={11} className="text-slate-400 shrink-0" />
                      <p className="text-sm text-secondary font-black truncate">{name}</p>
                    </div>
                    {customer?.email && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{customer.email}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">
                      Ship To
                    </p>
                    <div className="flex items-start gap-1.5">
                      <MapPin size={11} className="text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-600 font-bold leading-tight">
                        {shippingAddr}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">
                      Total
                    </p>
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

                {/* Line items */}
                <div className="px-8 py-5">
                  <ul className="divide-y divide-slate-50">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="py-3 flex justify-between items-center group">
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
    </div>
  );
}
