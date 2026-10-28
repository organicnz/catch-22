'use client';

import { ArrowRight, Compass, X } from 'lucide-react';
import { useState } from 'react';

interface NZRuralDeliveryAssistantProps {
  addressText: string;
  currentShippingId: string;
  onSelectShipping: (id: string) => void;
  className?: string;
}

/**
 * Common NZ rural indicators:
 * - "RD 1", "RD1", "R.D. 2", "RD3", etc.
 * - "Rural"
 * - Suburbs or locations often strictly RD
 */
const RURAL_PATTERN = /\b(rd\s*\d+|r\.d\.\s*\d+|rural\s*delivery|rural)\b/i;

export function isNZRuralAddress(text: string): boolean {
  if (!text) return false;
  return RURAL_PATTERN.test(text);
}

export function NZRuralDeliveryAssistant({
  addressText,
  currentShippingId,
  onSelectShipping,
  className = '',
}: NZRuralDeliveryAssistantProps) {
  const [dismissed, setDismissed] = useState(false);

  const isRural = isNZRuralAddress(addressText);
  const isNonRuralShipping =
    currentShippingId === 'standard' || currentShippingId === 'standard-courier';

  if (!isRural || !isNonRuralShipping || dismissed) {
    return null;
  }

  return (
    <div
      role="status"
      className={`p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 transition-all shadow-xs ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Compass size={18} className="text-amber-700 shrink-0 mt-0.5" strokeWidth={2.5} />
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-amber-900">
              Rural Delivery (RD) Address Detected
            </p>
            <p className="text-xs font-medium text-amber-800 mt-0.5 leading-relaxed">
              We noticed an RD or rural indicator in your address. To ensure NZ Post or courier
              drivers deliver directly to your rural letterbox without hold-ups, we recommend
              selecting a rural rate:
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => onSelectShipping('rural-courier')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-900 text-white text-[11px] font-black uppercase tracking-wider hover:bg-amber-800 transition-colors shadow-xs"
              >
                <span>Rural Courier ($15.00)</span>
                <ArrowRight size={12} strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => onSelectShipping('rural')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-[11px] font-black uppercase tracking-wider hover:bg-amber-100 transition-colors shadow-xs"
              >
                <span>Rural Tracked ($14.00)</span>
                <ArrowRight size={12} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-900 p-1 rounded-lg transition-colors shrink-0"
          aria-label="Dismiss rural delivery notice"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
