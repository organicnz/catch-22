'use client';

import { CheckCircle, Heart, Lock, Shield, Truck } from 'lucide-react';

/**
 * NZ-specific trust badges and checkout confidence strip.
 * Renders contextual reassurance signals throughout the checkout funnel:
 * - Consumer Guarantees Act protection (NZ law)
 * - Payments NZ secure settlement
 * - NZ-owned business badge
 * - Free tracked shipping threshold
 * - Sea Cleaners charitable contribution
 */

interface NZCheckoutConfidenceProps {
  /** 'full' shows all badges in a grid; 'strip' renders inline. */
  variant?: 'full' | 'strip' | 'compact';
  className?: string;
}

const BADGES = [
  {
    id: 'guarantee',
    icon: Shield,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    title: 'Consumer Guarantees Act',
    detail: 'Protected under NZ consumer law',
  },
  {
    id: 'secure',
    icon: Lock,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    title: 'Payments NZ Secure',
    detail: 'Bank-grade 256-bit SSL encryption',
  },
  {
    id: 'nzowned',
    icon: CheckCircle,
    color: 'text-primary-ink',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    title: '100% NZ Owned',
    detail: 'Auckland-based, Kiwi-run store',
  },
  {
    id: 'shipping',
    icon: Truck,
    color: 'text-secondary',
    bg: 'bg-slate-50',
    border: 'border-slate-100',
    title: 'NZ-Wide Shipping',
    detail: 'Tracked courier to your door',
  },
  {
    id: 'charity',
    icon: Heart,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    title: '2.5% to Sea Cleaners',
    detail: 'Every order cleans NZ waterways',
  },
] as const;

export function NZCheckoutConfidence({
  variant = 'full',
  className = '',
}: NZCheckoutConfidenceProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 ${className}`}>
        {BADGES.map((badge) => (
          <div key={badge.id} className="flex items-center gap-1.5">
            <badge.icon size={11} className={badge.color} strokeWidth={2.5} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              {badge.title}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'strip') {
    return (
      <div
        className={`bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-100 rounded-2xl p-4 ${className}`}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          {BADGES.map((badge) => (
            <div key={badge.id} className="flex items-center gap-2 group">
              <div
                className={`w-7 h-7 rounded-lg ${badge.bg} ${badge.border} border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300`}
              >
                <badge.icon size={13} className={badge.color} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-secondary uppercase tracking-wider leading-tight">
                  {badge.title}
                </span>
                <span className="text-[9px] font-medium text-slate-400 leading-tight">
                  {badge.detail}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full grid variant
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="h-px bg-slate-200 flex-1" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
          🇳🇿 NZ Checkout Guarantee
        </span>
        <div className="h-px bg-slate-200 flex-1" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {BADGES.map((badge) => (
          <div
            key={badge.id}
            className={`${badge.bg} border ${badge.border} rounded-2xl p-3 flex flex-col items-center text-center group transition-all hover:shadow-sm hover:-translate-y-0.5 duration-300`}
          >
            <div
              className={`w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center mb-2 shadow-inner transition-transform group-hover:scale-110 duration-300`}
            >
              <badge.icon size={15} className={badge.color} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-black text-secondary uppercase tracking-wider leading-tight mb-0.5">
              {badge.title}
            </span>
            <span className="text-[8px] font-medium text-slate-400 leading-tight">
              {badge.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
