'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

export function MfaSettings() {
  const [factors, setFactors] = useState<{ id: string; status: string; totp?: { qr_code: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    fetchFactors();
  }, []);

  async function fetchFactors() {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      console.error('Error fetching factors:', error);
    } else {
      setFactors(data.all || []);
    }
    setLoading(false);
  }

  async function startEnrollment() {
    setError('');
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'Catch-22',
      friendlyName: 'Default'
    });

    if (error) {
      setError(error.message);
      setEnrolling(false);
    } else {
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
    }
  }

  async function verifyEnrollment() {
    setError('');
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) {
      setError(error.message);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: data.id,
      code: verifyCode
    });

    if (verifyError) {
      setError(verifyError.message);
    } else {
      setSuccess('2FA enabled successfully!');
      setEnrolling(false);
      fetchFactors();
    }
  }

  async function unenrollFactor(id: string) {
    if (!confirm('Are you sure you want to disable 2FA?')) return;
    
    setError('');
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) {
      setError(error.message);
    } else {
      setSuccess('2FA disabled.');
      fetchFactors();
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;

  const activeFactor = factors.find(f => f.status === 'verified');

  return (
    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm p-8 mt-12">
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-2xl ${activeFactor ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
          {activeFactor ? <ShieldCheck size={24} /> : <Shield size={24} />}
        </div>
        <div>
          <h3 className="text-lg font-black text-secondary uppercase tracking-tight">Two-Factor Authentication</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Secure your account with TOTP</p>
        </div>
      </div>

      {activeFactor ? (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">2FA is currently active</p>
            </div>
            <button 
              onClick={() => unenrollFactor(activeFactor.id)}
              className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
            >
              Disable 2FA
            </button>
          </div>
        </div>
      ) : enrolling ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <QRCodeSVG value={qrCode} size={180} />
             </div>
             <p className="text-xs text-slate-500 text-center font-medium max-w-xs leading-relaxed">
               Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
             </p>
          </div>
          
          <div className="space-y-4">
             <label className="block text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Verification Code</label>
             <div className="flex gap-4">
               <input 
                type="text" 
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="flex-1 px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-black text-secondary tracking-[0.5em] text-center"
               />
               <button 
                onClick={verifyEnrollment}
                className="bg-primary text-white font-black px-8 py-4 rounded-2xl hover:bg-primary-dark transition-all uppercase tracking-widest text-xs"
               >
                 Verify
               </button>
             </div>
             <button 
              onClick={() => setEnrolling(false)}
              className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-secondary transition-colors"
             >
               Cancel
             </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Add an extra layer of security to your account. When enabled, you will be asked for a verification code from your mobile device when signing in.
          </p>
          <button 
            onClick={startEnrollment}
            className="bg-secondary text-white font-black px-8 py-4 rounded-full hover:bg-primary transition-all uppercase tracking-widest text-xs shadow-lg shadow-secondary/10"
          >
            Enable 2FA
          </button>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
          <ShieldAlert size={18} />
          <p className="text-xs font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600">
          <ShieldCheck size={18} />
          <p className="text-xs font-black uppercase tracking-widest">{success}</p>
        </div>
      )}
    </div>
  );
}
