'use server';

import { createAdminClient, createServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

const VALID_STATUSES = ['processing', 'completed', 'cancelled', 'refunded', 'on-hold'];
const VALID_STOCK = ['instock', 'outofstock', 'onbackorder'];

async function requireAdminClient() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminClient = await createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_admin')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!profile?.is_admin) throw new Error('Not authorised');
  return adminClient;
}

export async function updateOrderStatus(orderId: number, status: string) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error('Invalid status');
  }
  const adminClient = await requireAdminClient();
  const { error } = await adminClient.from('orders').update({ status }).eq('id', orderId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/account');
}

export async function updateFulfillment(
  orderId: number,
  payload: { tracking_number?: string | null; admin_notes?: string | null }
) {
  if (payload.tracking_number !== undefined && (payload.tracking_number || '').length > 200) {
    throw new Error('Tracking number is too long (max 200 chars)');
  }
  if (payload.admin_notes !== undefined && (payload.admin_notes || '').length > 2000) {
    throw new Error('Admin notes are too long (max 2000 chars)');
  }
  const adminClient = await requireAdminClient();
  const update: { tracking_number?: string | null; admin_notes?: string | null } = {};
  if (payload.tracking_number !== undefined) {
    update.tracking_number = payload.tracking_number === '' ? null : payload.tracking_number;
  }
  if (payload.admin_notes !== undefined) {
    update.admin_notes = payload.admin_notes === '' ? null : payload.admin_notes;
  }
  const { error } = await adminClient.from('orders').update(update).eq('id', orderId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateProduct(payload: {
  id: number;
  name?: string;
  price?: number;
  sale_price?: number | null;
  stock_status?: string;
  short_description?: string;
}) {
  const { id, ...fields } = payload;
  if (fields.price !== undefined && (!Number.isFinite(fields.price) || fields.price < 0)) {
    throw new Error('Price must be a non-negative number');
  }
  if (fields.sale_price !== undefined && fields.sale_price !== null) {
    if (!Number.isFinite(fields.sale_price) || fields.sale_price < 0) {
      throw new Error('Sale price must be a non-negative number');
    }
  }
  if (fields.stock_status !== undefined && !VALID_STOCK.includes(fields.stock_status)) {
    throw new Error('Invalid stock status');
  }
  if (fields.name !== undefined && fields.name.trim().length === 0) {
    throw new Error('Name cannot be empty');
  }

  const adminClient = await requireAdminClient();
  const { error } = await adminClient
    .from('products')
    .update({ ...fields, name: fields.name?.trim() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/products');
  revalidatePath('/products');
}

export async function createCoupon(payload: {
  code: string;
  discount_type: 'percent' | 'fixed';
  amount: number;
  expiry_date?: string | null;
}) {
  const code = payload.code.trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,50}$/.test(code)) {
    throw new Error('Code must be 3-50 chars of A-Z, 0-9 or -');
  }
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  if (payload.discount_type === 'percent' && payload.amount > 99) {
    throw new Error('Percent discounts must be between 1 and 99');
  }
  if (payload.expiry_date && Number.isNaN(new Date(payload.expiry_date).getTime())) {
    throw new Error('Invalid expiry date');
  }

  const adminClient = await requireAdminClient();
  const { data: existing } = await adminClient
    .from('coupons')
    .select('id')
    .eq('code', code)
    .maybeSingle();
  if (existing) throw new Error(`Coupon ${code} already exists`);

  const { error } = await adminClient.from('coupons').insert({
    code,
    discount_type: payload.discount_type,
    amount: payload.amount,
    expiry_date: payload.expiry_date || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/coupons');
}

export async function updateCoupon(
  id: number,
  payload: {
    code?: string;
    discount_type?: 'percent' | 'fixed';
    amount?: number;
    expiry_date?: string | null;
  }
) {
  if (payload.amount !== undefined && (!Number.isFinite(payload.amount) || payload.amount <= 0)) {
    throw new Error('Amount must be a positive number');
  }
  if (payload.discount_type === 'percent' && payload.amount !== undefined && payload.amount > 99) {
    throw new Error('Percent discounts must be between 1 and 99');
  }
  if (
    payload.expiry_date !== undefined &&
    payload.expiry_date !== null &&
    Number.isNaN(new Date(payload.expiry_date).getTime())
  ) {
    throw new Error('Invalid expiry date');
  }

  const adminClient = await requireAdminClient();
  const update: {
    code?: string;
    discount_type?: 'percent' | 'fixed';
    amount?: number;
    expiry_date?: string | null;
  } = { ...payload };
  if (payload.code) update.code = payload.code.trim().toUpperCase();
  const { error } = await adminClient.from('coupons').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/coupons');
}

export async function deleteCoupon(id: number) {
  const adminClient = await requireAdminClient();
  const { error } = await adminClient.from('coupons').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/coupons');
}

export async function markAdminUser(profileId: number, isAdmin: boolean) {
  const adminClient = await requireAdminClient();
  const { error } = await adminClient
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', profileId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/customers');
}
