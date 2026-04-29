'use server';

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function submitContact(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  if (!name || !email || !message) {
    return { error: 'All fields are required.' };
  }

  // We must use the Service Role key to insert if RLS restricts anon inserts, 
  // or we can just use the standard client if we enable anon inserts on the table.
  // For safety and anti-spam, backend insertion is preferred.
  const supabase = createClient();
  
  const { error } = await supabase.from('contact_submissions').insert({
    name,
    email,
    message
  });

  if (error) {
    console.error('Contact submission error:', error.message);
    return { error: 'Failed to send message. Please try again later.' };
  }

  revalidatePath('/contact');
  return { success: true };
}
