'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { createServerClient } from '@/lib/supabase-server';

export async function submitContact(formData: FormData) {
  // 1. Honeypot check (bots often fill all fields)
  const honeypot = formData.get('website') as string;
  if (honeypot) {
    // Silently reject by pretending it worked
    return { success: true };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  // 2. Basic validation
  if (!name || !email || !message) {
    return { error: 'All fields are required.' };
  }

  if (name.length < 2) return { error: 'Name is too short.' };
  if (message.length < 10) return { error: 'Message is too short.' };
  if (!email.includes('@')) return { error: 'Invalid email address.' };

  // 3. Spam keyword check for content
  const spamKeywords = ['casino', 'slot', 'judi', 'togel', 'crypto', 'loan'];
  if (spamKeywords.some((kw) => message.toLowerCase().includes(kw))) {
    return { error: 'Message flagged as potential spam. Please revise.' };
  }

  // 3 submissions / 10 minutes / IP (on top of the honeypot + keyword filter).
  const gate = rateLimit(clientKey(await headers(), 'contact'), 3, 10 * 60_000);
  if (!gate.ok) {
    return { error: `Too many messages sent. Please try again in ${gate.retryAfterSec}s.` };
  }

  const supabase = await createServerClient();

  const { error } = await supabase.from('contact_submissions').insert({
    name,
    email,
    message,
  });

  if (error) {
    console.error('Contact submission error:', error.message);
    return { error: 'Failed to send message. Please try again later.' };
  }

  revalidatePath('/contact');
  return { success: true };
}
