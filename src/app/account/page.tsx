import { AccountTabs, type AdminOrder, type MyOrder } from '@/components/account/AccountTabs';
import { createAdminClient, createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Account — Catch-22',
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // MFA check
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData?.nextLevel !== aalData?.currentLevel && aalData?.nextLevel === 'aal2') {
    redirect('/auth/mfa');
  }

  // Profile — admin client bypasses RLS so is_admin is always readable
  const adminClient = await createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, user_id, is_admin')
    .or(`email.eq.${user.email},user_id.eq.${user.id}`)
    .single();

  // Link auth user_id if missing (legacy profiles)
  if (profile && !profile.user_id) {
    await adminClient.from('profiles').update({ user_id: user.id }).eq('id', profile.id);
  }

  const isAdmin = profile?.is_admin === true;

  // Fetch data in parallel
  const [allOrdersResult, myOrdersResult] = await Promise.all([
    isAdmin
      ? adminClient
          .from('orders')
          .select(`
            id, created_at, status, total_amount, currency,
            payment_method, stripe_session_id,
            shipping_address, billing_address,
            order_items ( id, product_name, quantity, total ),
            profiles ( first_name, last_name, email )
          `)
          .order('created_at', { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] }),
    profile
      ? supabase
          .from('orders')
          .select('id, created_at, status, total_amount, order_items(product_name, quantity, total)')
          .eq('customer_id', profile.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const allOrders = (allOrdersResult.data || []) as AdminOrder[];
  const myOrders = (myOrdersResult.data || []) as MyOrder[];

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col mb-10">
          <h1 className="text-4xl font-black tracking-tight text-secondary uppercase">
            {isAdmin ? 'Dashboard' : 'My Account'}
          </h1>
          <div className="h-1.5 w-24 bg-primary mt-3" />
        </div>

        <AccountTabs
          isAdmin={isAdmin}
          allOrders={allOrders}
          myOrders={myOrders}
          email={user.email ?? ''}
        />
      </div>
    </div>
  );
}
