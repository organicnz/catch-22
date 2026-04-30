'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage('✅ Check your email for the magic login link!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] bg-white flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-slate-50 p-10 rounded-3xl shadow-sm text-center border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-black text-secondary uppercase tracking-tight mb-2">Welcome Back</h1>
          <div className="h-1.5 w-16 bg-primary"></div>
        </div>
        
        <p className="text-slate-600 mb-10 font-medium leading-relaxed">
          Sign in via magic link to view your Catch-22 order history and account details.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="text-left">
            <label htmlFor="email" className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="YOUR@EMAIL.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold text-secondary uppercase tracking-wider text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white font-black rounded-full py-5 hover:bg-primary transition-all uppercase tracking-[0.2em] text-sm shadow-xl shadow-secondary/10 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <div className="mt-8 p-4 bg-white rounded-2xl border border-slate-100 text-xs font-black uppercase tracking-widest text-secondary shadow-sm">
            {message}
          </div>
        )}
        
        <div className="mt-10 pt-8 border-t border-slate-100">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
             New to Catch-22? Your account will be created automatically upon your first order.
           </p>
        </div>
      </div>
    </div>
  );
}
