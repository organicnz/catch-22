'use client';

import {
  ArrowRight,
  Code,
  Eye,
  EyeOff,
  Fingerprint,
  Globe,
  Loader2,
  Lock,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/account');
    });

    if (typeof window !== 'undefined') {
      const err = new URLSearchParams(window.location.search).get('error');
      if (err) {
        const friendlyMessage =
          err === 'Invalid_Token'
            ? 'That sign-in or verification link has expired or has already been used. Please request a new one below.'
            : err.replace(/_/g, ' ');
        setMessage({ type: 'error', text: `❌ ${friendlyMessage}` });
      }
    }
  }, [supabase, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (authMethod === 'otp') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: '✅ A magic link has been sent to your inbox.' });
      } else {
        if (isSignUp) {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (error) throw error;
          setMessage({
            type: 'success',
            text: '✅ Account created! Please check your email to verify.',
          });
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          router.push('/account');
          router.refresh();
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: `❌ ${error.message}` });
      } else {
        setMessage({ type: 'error', text: '❌ An unknown error occurred.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: '❌ Please enter your email address first.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/update-password`,
    });

    if (error) {
      setMessage({ type: 'error', text: `❌ ${error.message}` });
    } else {
      setMessage({ type: 'success', text: '✅ Password reset link sent to your email.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-32 selection:bg-primary selection:text-secondary">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-secondary/5 rounded-full mb-8 border border-secondary/5">
            <Shield className="w-3.5 h-3.5 text-secondary" />
            <span className="text-secondary font-black uppercase tracking-[0.3em] text-[10px]">
              Customer Account
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-secondary uppercase tracking-tight leading-none mb-4">
            {isSignUp ? 'Create' : 'Welcome'} <br />
            <span className="text-primary italic">{isSignUp ? 'Account' : 'Back'}</span>
          </h1>
          <p className="text-slate-600 font-bold text-sm max-w-md mx-auto">
            {isSignUp
              ? 'Create a free Catch-22 account to track orders & save gear'
              : 'Sign in to access your order history & account details'}
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(15,23,42,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-1000 delay-200">
          {/* Method Tabs */}
          <div className="flex p-3 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setAuthMethod('otp')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-all rounded-[2rem] flex items-center justify-center gap-2.5 ${
                authMethod === 'otp'
                  ? 'bg-secondary text-white shadow-xl shadow-secondary/20'
                  : 'text-slate-400 hover:text-secondary'
              }`}
            >
              <Fingerprint size={16} /> Magic Link (Email)
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('password')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-all rounded-[2rem] flex items-center justify-center gap-2.5 ${
                authMethod === 'password'
                  ? 'bg-secondary text-white shadow-xl shadow-secondary/20'
                  : 'text-slate-400 hover:text-secondary'
              }`}
            >
              <Lock size={16} /> Password
            </button>
          </div>

          <div className="p-10 md:p-16">
            <form onSubmit={handleAuth} className="space-y-8">
              <div className="space-y-6">
                <div className="group">
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-black text-secondary uppercase tracking-wider ml-1 mb-2 group-focus-within:text-primary transition-colors"
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:bg-white focus:border-primary outline-none transition-all font-bold text-secondary text-sm placeholder:text-slate-400"
                  />
                </div>

                {authMethod === 'password' && (
                  <div className="group animate-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center ml-1 mb-2">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-black text-secondary uppercase tracking-wider group-focus-within:text-primary transition-colors"
                      >
                        Password
                      </label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={handleResetPassword}
                          className="text-[10px] font-black text-primary-ink uppercase tracking-wider hover:text-secondary transition-colors"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:bg-white focus:border-primary outline-none transition-all font-bold text-secondary text-sm placeholder:text-slate-400 pr-14"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-secondary transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-white font-black rounded-full py-5 hover:bg-primary hover:text-secondary transition-all uppercase tracking-widest text-xs shadow-xl shadow-secondary/15 flex items-center justify-center gap-3 group disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>
                      {authMethod === 'otp'
                        ? 'Send Magic Link'
                        : isSignUp
                          ? 'Create Free Account'
                          : 'Sign In'}
                    </span>
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1.5 transition-transform duration-300"
                    />
                  </>
                )}
              </button>
            </form>

            {message && (
              <div
                className={`mt-8 p-5 rounded-2xl border text-xs font-bold text-center animate-in zoom-in-95 duration-300 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* OAuth Section */}
            <div className="mt-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px bg-slate-200 flex-1" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Or Continue With
                </span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  className="flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 rounded-2xl hover:border-secondary hover:bg-slate-50 transition-all text-xs font-black text-secondary uppercase tracking-wider group shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  <Globe size={16} className="group-hover:text-primary-ink transition-colors" />{' '}
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth('github')}
                  className="flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 rounded-2xl hover:border-secondary hover:bg-slate-50 transition-all text-xs font-black text-secondary uppercase tracking-wider group shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  <Code size={16} className="group-hover:text-primary-ink transition-colors" />{' '}
                  GitHub
                </button>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="bg-slate-50 p-8 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
              }}
              className="group text-xs font-black text-secondary hover:text-primary-ink transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : 'New customer? Create a free account'}
              </span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Security Badges */}
        <div className="mt-16 flex items-center justify-center gap-8 opacity-30">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary">
              Encryption Active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary">
              Supabase v2 Vault
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
