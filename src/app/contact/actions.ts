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

  // Control characters have no business in identity fields (header-injection
  // defense); messages may contain newlines and are JSON-transported anyway.
  const controlChars = /\p{C}/u;
  if (controlChars.test(name)) return { error: 'Name contains invalid characters.' };
  if (controlChars.test(email)) return { error: 'Email contains invalid characters.' };

  if (name.length < 2) return { error: 'Name is too short.' };
  if (message.length < 10) return { error: 'Message is too short.' };
  if (!email.includes('@')) return { error: 'Invalid email address.' };

  // Upper bounds keep payloads sane for PostgREST and Resend alike.
  if (name.length > 100) return { error: 'Name is too long.' };
  if (email.length > 254) return { error: 'Email is too long.' };
  if (message.length > 5000) return { error: 'Message is too long (5000 characters max).' };

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
    wants_copy: formData.get('sendCopy') === 'on',
  });

  if (error) {
    console.error('Contact submission error:', error.message);
    return { error: 'Failed to send message. Please try again later.' };
  }

  revalidatePath('/contact');
  return { success: true };
}
