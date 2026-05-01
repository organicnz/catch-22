'use server';

import { createServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { UserSettings } from '@/lib/store/settings';

/**
 * Server Action to update user settings.
 * This provides a secure way to update settings and handles cache invalidation.
 */
export async function updateUserSettingsAction(settings: Partial<UserSettings>) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  // Simple validation
  const allowedKeys: (keyof UserSettings)[] = ['marketing_emails', 'order_updates', 'preferred_currency'];
  const filteredSettings: Partial<UserSettings> = {};
  
  for (const key of allowedKeys) {
    if (key in settings) {
      filteredSettings[key] = settings[key] as any;
    }
  }

  // Fetch current settings to merge
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('settings')
    .eq('user_id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    return { error: 'Failed to fetch current settings' };
  }

  const updatedSettings = {
    ...(profile?.settings || {}),
    ...filteredSettings
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ settings: updatedSettings })
    .eq('user_id', user.id);

  if (updateError) {
    // Fallback for legacy email-only profiles
    const { error: emailError } = await supabase
      .from('profiles')
      .update({ settings: updatedSettings })
      .eq('email', user.email);
    
    if (emailError) {
      return { error: emailError.message };
    }
  }

  // Revalidate the entire app since settings can affect many pages (currency, etc)
  revalidatePath('/', 'layout');
  
  return { success: true, settings: updatedSettings };
}
