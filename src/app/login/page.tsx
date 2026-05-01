import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Mail, Key, Shield, Globe, Code, ArrowRight, Loader2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/account');
    });
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
        setMessage({ type: 'success', text: '✅ Check your email for the magic link!' });
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
          setMessage({ type: 'success', text: '✅ Account created! Please check your email to verify.' });
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          router.push('/account');
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `❌ ${error.message}` });
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

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-32">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-secondary/5 rounded-full mb-6">
            <Shield className="w-3 h-3 text-secondary" />
            <span className="text-secondary font-black uppercase tracking-[0.3em] text-[10px]">Secure Access</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-secondary uppercase tracking-tighter leading-none mb-6">
            {isSignUp ? 'Join' : 'Welcome'} <br /> 
            <span className="text-primary italic">{isSignUp ? 'The Crew' : 'Back'}</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">
            {isSignUp 
              ? 'Create an account to track orders and save your wishlist.' 
              : 'Sign in to access your gear, orders, and preferences.'}
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-[3rem] shadow-2xl shadow-secondary/5 overflow-hidden">
          {/* Method Tabs */}
          <div className="flex border-b border-slate-50">
            <button 
              onClick={() => { setAuthMethod('otp'); setIsSignUp(false); }}
              className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                authMethod === 'otp' ? 'bg-secondary text-white' : 'bg-white text-slate-400 hover:text-secondary'
              }`}
            >
              <Mail size={14} /> Magic Link
            </button>
            <button 
              onClick={() => setAuthMethod('password')}
              className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                authMethod === 'password' ? 'bg-secondary text-white' : 'bg-white text-slate-400 hover:text-secondary'
              }`}
            >
              <Key size={14} /> Password
            </button>
          </div>

          <div className="p-10 md:p-14">
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-[10px] font-black text-secondary uppercase tracking-widest ml-1 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="YOUR@EMAIL.COM"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-bold text-secondary uppercase tracking-widest text-xs"
                  />
                </div>

                {authMethod === 'password' && (
                  <div className="relative animate-in slide-in-from-top-4 duration-300">
                    <label className="block text-[10px] font-black text-secondary uppercase tracking-widest ml-1 mb-2">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-bold text-secondary tracking-widest text-xs"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-white font-black rounded-full py-5 hover:bg-primary transition-all uppercase tracking-[0.2em] text-sm shadow-xl shadow-secondary/10 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    {authMethod === 'otp' ? 'Send Magic Link' : (isSignUp ? 'Create Account' : 'Sign In')}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {message && (
              <div className={`mt-8 p-6 rounded-2xl border text-[10px] font-black uppercase tracking-widest text-center animate-in zoom-in-95 duration-300 ${
                message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}>
                {message.text}
              </div>
            )}

            {/* OAuth Separator */}
            <div className="mt-12 mb-8 flex items-center gap-4">
              <div className="h-px bg-slate-100 flex-1"></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Or Continue With</span>
              <div className="h-px bg-slate-100 flex-1"></div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleOAuth('google')}
                className="flex items-center justify-center gap-3 py-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all text-[10px] font-black text-secondary uppercase tracking-widest"
              >
                <Globe size={18} /> Google
              </button>
              <button 
                onClick={() => handleOAuth('github')}
                className="flex items-center justify-center gap-3 py-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all text-[10px] font-black text-secondary uppercase tracking-widest"
              >
                <Code size={18} /> Github
              </button>
            </div>
          </div>

          {/* Footer Action */}
          <div className="bg-slate-50 p-8 text-center border-t border-slate-100">
             <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-secondary transition-colors"
             >
               {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Join The Crew"}
             </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-12 flex items-center justify-center gap-4 opacity-40">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-secondary">SSL Encrypted</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-secondary">Supabase Auth</span>
           </div>
        </div>
      </div>
    </div>
  );
}
