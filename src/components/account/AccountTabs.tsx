'use client';

import { MfaSettings } from '@/components/account/MfaSettings';
import { UserSettings } from '@/components/account/UserSettings';
import { LogoutButton } from '@/components/account/LogoutButton';
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect';
import {
  ExternalLink,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  TrendingUp,
  User,
} from 'lucide-react';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type OrderItem = {
  id?: number;
  product_name: string | null;
  quantity: number | null;
  total: number | null;
};

export type ShippingAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

export type AdminOrder = {
  id: number;
  created_at: string | null;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  payment_method: string | null;
  stripe_session_id: string | null;
  shipping_address: ShippingAddress | null;
  billing_address: ShippingAddress | null;
  order_items: OrderItem[];
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

export type MyOrder = {
  id: number;
  created_at: string | null;
  status: string | null;
  total_amount: number | null;
  order_items: OrderItem[];
};

interface Props {
  isAdmin: boolean;
  allOrders: AdminOrder[];
  myOrders: MyOrder[];
  email: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatAddress(addr: ShippingAddress | null) {
  if (!addr) return 'No address';
  return [addr.line1, addr.line2, addr.city, addr.postal_code, addr.country]
    .filter(Boolean)
    .join(', ');
}

function statusBadge(status: string | null) {
  switch (status) {
    case 'completed': return 'bg-emerald-100 text-emerald-800';
    case 'cancelled': return 'bg-rose-100 text-rose-800';
    case 'refunded':  return 'bg-slate-100 text-slate-600';
    case 'on-hold':   return 'bg-blue-100 text-blue-800';
    default:          return 'bg-amber-100 text-amber-800';
  }
}

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------
function AdminOrdersPanel({ orders }: { orders: AdminOrder[] }) {
  const totalRevenue = orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
  const processing = orders.filter((o) => o.status === 'processing').length;
  const completed = orders.filter((o) => o.status === 'completed').length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Orders', value: orders.length, icon: ShoppingBag },
          { label: 'Processing',   value: processing,    icon: Package },
          { label: 'Completed',    value: completed,     icon: TrendingUp },
          { label: 'Revenue',      value: `$${totalRevenue.toFixed(2)}`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-secondary rounded-3xl p-6">
            <Icon size={16} className="text-primary mb-3" />
            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Orders */}
      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="bg-slate-50 p-16 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No orders yet.</p>
          </div>
        ) : orders.map((order) => {
          const cust = order.profiles;
          const name = cust
            ? [cust.first_name, cust.last_name].filter(Boolean).join(' ') || cust.email
            : 'Guest';
          const stripeUrl = order.stripe_session_id
            ? `https://dashboard.stripe.com/payments/${order.stripe_session_id}`
            : null;

          return (
            <div key={order.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
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
                  {cust?.email && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{cust.email}</p>}
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
                  <OrderStatusSelect orderId={order.id} currentStatus={order.status || 'processing'} />
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
              <div className="px-6 py-4">
                <ul className="divide-y divide-slate-50">
                  {order.order_items.map((item) => (
                    <li key={item.id ?? item.product_name ?? Math.random()} className="py-3 flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform" />
                        <div>
                          <p className="text-sm font-black text-secondary uppercase tracking-wider">{item.product_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-secondary">${Number(item.total).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MyOrdersPanel({ orders }: { orders: MyOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="bg-slate-50 p-16 rounded-3xl border border-dashed border-slate-200 text-center">
        <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No past orders found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Order Placed</p>
              <p className="text-sm text-secondary font-black">
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Total</p>
              <p className="text-sm text-primary font-black">${Number(order.total_amount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="flex justify-end items-center">
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">#{order.id}</p>
            </div>
          </div>
          <div className="px-6 py-5">
            <ul className="divide-y divide-slate-50">
              {order.order_items.map((item) => (
                <li key={item.product_name ?? Math.random()} className="py-4 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform" />
                    <div>
                      <p className="text-sm font-black text-secondary uppercase tracking-wider">{item.product_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Qty: {item.quantity}</p>
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
  );
}

function SettingsPanel({ email }: { email: string }) {
  return (
    <div className="space-y-12 max-w-2xl">
      <UserSettings />
      <MfaSettings />
      <div className="pt-8 border-t border-slate-100">
        <h3 className="text-sm font-black text-secondary uppercase tracking-widest mb-1">Session Control</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">
          Signed in as <span className="text-secondary">{email}</span>
        </p>
        <LogoutButton />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main tabs component
// ---------------------------------------------------------------------------
export function AccountTabs({ isAdmin, allOrders, myOrders, email }: Props) {
  const adminTabs = isAdmin
    ? [{ id: 'admin', label: 'All Orders', icon: Package, badge: allOrders.filter(o => o.status === 'processing').length || undefined }]
    : [];

  const tabs = [
    ...adminTabs,
    { id: 'orders', label: isAdmin ? 'My Orders' : 'Orders', icon: ShoppingBag, badge: undefined },
    { id: 'settings', label: 'Settings', icon: Settings, badge: undefined },
  ];

  const [active, setActive] = useState(tabs[0].id);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-100 mb-10 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`
                relative flex items-center gap-2 px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-colors
                ${isActive
                  ? 'text-secondary border-b-2 border-primary -mb-px'
                  : 'text-slate-400 hover:text-secondary border-b-2 border-transparent -mb-px'
                }
              `}
            >
              <Icon size={13} />
              {tab.label}
              {tab.badge ? (
                <span className="ml-1 bg-primary text-secondary text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      {active === 'admin' && isAdmin && <AdminOrdersPanel orders={allOrders} />}
      {active === 'orders' && <MyOrdersPanel orders={myOrders} />}
      {active === 'settings' && <SettingsPanel email={email} />}
    </div>
  );
}
