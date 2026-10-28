'use client';

import { Clock, Sparkles, TrendingUp, Zap } from 'lucide-react';

/**
 * Shows contextual payment method recommendations based on order total
 * and NZ-specific payment landscape insights:
 * - Under $50: Card/wallet is fastest (small BNPL overhead not worth it)
 * - $50–$2000: Afterpay recommended (NZ sweet spot for BNPL)
 * - Over $200: Bank transfer for savings-conscious (0% surcharge messaging)
 * - Pickup: Cash/EFTPOS instant completion
 */

type RecommendationType = 'fastest' | 'popular' | 'savings' | 'flexible';

interface Recommendation {
  type: RecommendationType;
  method: string;
  reason: string;
  icon: typeof Zap;
  accentColor: string;
  badgeText: string;
}

function getRecommendations(total: number): Recommendation[] {
  const recs: Recommendation[] = [];

  if (total < 50) {
    recs.push({
      type: 'fastest',
      method: 'card',
      reason: 'Fastest for small orders',
      icon: Zap,
      accentColor: 'text-blue-600 bg-blue-50 border-blue-100',
      badgeText: 'Fastest Checkout',
    });
  } else if (total >= 50 && total <= 2000) {
    recs.push({
      type: 'popular',
      method: 'afterpay',
      reason: `4 × $${(total / 4).toFixed(2)} fortnightly`,
      icon: TrendingUp,
      accentColor: 'text-[#1a1a1a] bg-[#B2FCE4]/30 border-[#B2FCE4]',
      badgeText: 'Most Popular in NZ',
    });
    recs.push({
      type: 'fastest',
      method: 'card',
      reason: 'Apple Pay & Google Pay',
      icon: Zap,
      accentColor: 'text-blue-600 bg-blue-50 border-blue-100',
      badgeText: 'Express',
    });
  } else {
    recs.push({
      type: 'savings',
      method: 'bank',
      reason: '0% surcharge · Direct bank deposit',
      icon: Sparkles,
      accentColor: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      badgeText: 'Best Value',
    });
  }

  if (total >= 100) {
    recs.push({
      type: 'flexible',
      method: 'afterpay',
      reason: 'Split into 4 interest-free payments',
      icon: Clock,
      accentColor: 'text-secondary bg-slate-50 border-slate-200',
      badgeText: 'Flexible',
    });
  }

  return recs;
}

interface PaymentRecommendationBadgeProps {
  /** The target method this badge applies to: 'card' | 'afterpay' | 'bank' */
  method: 'card' | 'afterpay' | 'bank';
  /** Cart/order total in NZD */
  total: number;
}

export function PaymentRecommendationBadge({ method, total }: PaymentRecommendationBadgeProps) {
  const recs = getRecommendations(total);
  const match = recs.find((r) => r.method === method);

  if (!match) return null;

  const Icon = match.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider ${match.accentColor}`}
    >
      <Icon size={9} strokeWidth={3} />
      {match.badgeText}
    </span>
  );
}

/**
 * Full recommendation strip shown above the payment buttons.
 * Highlights the smartest payment choice for the customer's order.
 */
export function PaymentRecommendationStrip({ total }: { total: number }) {
  const recs = getRecommendations(total);
  const primary = recs[0];

  if (!primary) return null;

  const Icon = primary.icon;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${primary.accentColor} mb-3 transition-all duration-300`}
    >
      <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center shrink-0 shadow-inner">
        <Icon size={15} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider leading-tight">
          {primary.badgeText}
        </p>
        <p className="text-[10px] font-medium opacity-70 mt-0.5 leading-tight">{primary.reason}</p>
      </div>
    </div>
  );
}
