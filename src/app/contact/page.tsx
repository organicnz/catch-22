'use client';

import { useState } from 'react';
import { submitContact } from './actions';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    
    const formData = new FormData(e.currentTarget);
    const result = await submitContact(formData);
    
    if (result.error) {
      setErrorMessage(result.error);
      setStatus('error');
    } else {
      setStatus('success');
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8 min-h-[80vh]">
      <div className="max-w-2xl mx-auto bg-slate-50 p-8 sm:p-12 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col items-center text-center mb-10">
          <h1 className="text-4xl font-black text-secondary uppercase tracking-tight mb-2">Contact Us</h1>
          <div className="h-1.5 w-20 bg-primary"></div>
        </div>
        
        <p className="text-slate-600 mb-4 text-center font-medium">
          Have a question about our gear or an existing order? Send us a message and we&apos;ll get back to you as soon as possible.
        </p>
        <p className="text-primary mb-10 text-center font-black uppercase tracking-widest text-[10px] bg-primary/5 py-3 rounded-full">
          Note: Our store is currently TEMPORARILY ONLINE ONLY
        </p>

        {status === 'success' && (
          <div id="form-success-message" role="status" className="mb-8 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl font-bold text-sm uppercase tracking-wider text-center">
            ✅ Message sent successfully! We will be in touch soon.
          </div>
        )}

        {status === 'error' && (
          <div id="form-error-message" role="alert" className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl font-bold text-sm uppercase tracking-wider text-center">
            ❌ {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          aria-describedby={status === 'success' ? 'form-success-message' : status === 'error' ? 'form-error-message' : undefined}
        >
          {/* Honeypot field for anti-spam */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Leave this field empty</label>
            <input type="text" name="website" id="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div>
            <label htmlFor="name" className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Full Name</label>
            <input
              type="text"
              name="name"
              id="name"
              required
              placeholder="Your name"
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold text-secondary"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <input
              type="email"
              name="email"
              id="email"
              required
              placeholder="your@email.com"
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold text-secondary"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-xs font-black text-secondary uppercase tracking-widest mb-2 ml-1">Message</label>
            <textarea
              name="message"
              id="message"
              rows={5}
              required
              placeholder="How can we help you?"
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold text-secondary resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            aria-busy={status === 'loading'}
            className="w-full bg-secondary text-white font-black rounded-full py-5 hover:bg-primary transition-all uppercase tracking-[0.2em] text-sm shadow-xl shadow-secondary/10 disabled:opacity-50 focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {status === 'loading' ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <div className="mt-16 pt-10 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Contact Info</h3>
            <div className="space-y-3">
              <p className="text-slate-600 font-bold flex items-center gap-3">
                <span className="text-primary text-lg">✉</span> 
                <a href="mailto:Catch-22NZ@hotmail.com" className="hover:text-primary transition-colors">Catch-22NZ@hotmail.com</a>
              </p>
              <p className="text-slate-600 font-bold flex items-center gap-3">
                <span className="text-primary text-lg">📞</span> 
                <a href="tel:02102745622" className="hover:text-primary transition-colors">02102745622</a>
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Business Hours</h3>
            <div className="space-y-1 text-slate-600 font-medium text-sm uppercase tracking-wider">
              <p><span className="font-black text-secondary">Mon – Fri:</span> 9am – 4pm</p>
              <p><span className="font-black text-secondary">Sat – Sun:</span> 11am – 3pm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
