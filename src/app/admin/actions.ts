'use server';

import { createAdminClient, createServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

const VALID_STATUSES = ['processing', 'completed', 'cancelled', 'refunded', 'on-hold'];

export async function updateOrderStatus(orderId: number, status: string) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error('Invalid status');
  }

  // Auth + admin check
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

  const { error } = await adminClient.from('orders').update({ status }).eq('id', orderId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin');
}
