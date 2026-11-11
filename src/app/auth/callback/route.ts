import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/account';
  const errorDescription = searchParams.get('error_description') ?? searchParams.get('error');

  if (errorDescription) {
    console.error('[auth/callback] Supabase auth error:', errorDescription);
    const redirectUrl = new URL(`${origin}/login`);
    redirectUrl.searchParams.set('error', errorDescription);
    return NextResponse.redirect(redirectUrl.toString());
  }

  // 1. Handle token_hash verification (email signup confirmation, magic link, password recovery)
  if (token_hash && type) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[auth/callback] verifyOtp failed:', error.message);
  }

  // 2. Handle PKCE code exchange
  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message);
  }

  // Fallback if neither code nor token_hash succeeded
  return NextResponse.redirect(`${origin}/login?error=Invalid_Token`);
}
