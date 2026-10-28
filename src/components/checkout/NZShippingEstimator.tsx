'use client';

import { ChevronDown, MapPin, Truck } from 'lucide-react';
import { useState } from 'react';
import { SHIPPING_RATES } from '@/config/shipping';
import { getNZDeliveryEstimate, inferNZRegion, type NZDeliveryEstimate } from '@/lib/nz-regions';

const NZ_REGIONS_LIST = [
  'Northland',
  'Auckland',
  'Waikato',
  'Bay of Plenty',
  'Gisborne',
  "Hawke's Bay",
  'Taranaki',
  'Manawatū-Whanganui',
  'Wellington',
  'Tasman',
  'Nelson',
  'Marlborough',
  'West Coast',
  'Canterbury',
  'Otago',
  'Southland',
];

interface NZShippingEstimatorProps {
  selectedShippingId: string;
  onSelectShipping: (shippingId: string, amountCents: number) => void;
  postcode: string;
  onPostcodeChange: (postcode: string) => void;
  className?: string;
}

export function NZShippingEstimator({
  selectedShippingId,
  onSelectShipping,
  postcode,
  onPostcodeChange,
  className = '',
}: NZShippingEstimatorProps) {
  const [isRural, setIsRural] = useState(selectedShippingId.startsWith('rural'));
  const [selectedRegion, setSelectedRegion] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handlePostcode = (val: string) => {
    onPostcodeChange(val);
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length === 4) {
      const region = inferNZRegion(cleaned);
      if (region) {
        setSelectedRegion(region);
      }
    }
  };

  const handleRegionSelect = (reg: string) => {
    setSelectedRegion(reg);
    if (!postcode) {
      // Pick a canonical postcode for the region for estimation
      const canonicalMap: Record<string, string> = {
        Northland: '0110',
        Auckland: '1010',
        Waikato: '3204',
        'Bay of Plenty': '3116',
        Gisborne: '4010',
        "Hawke's Bay": '4110',
        Taranaki: '4310',
        'Manawatū-Whanganui': '4410',
        Wellington: '6011',
        Nelson: '7010',
        Tasman: '7020',
        Marlborough: '7201',
        'West Coast': '7805',
        Canterbury: '8011',
        Otago: '9016',
        Southland: '9810',
      };
      if (canonicalMap[reg]) {
        onPostcodeChange(canonicalMap[reg]);
      }
    }
  };

  const activePostcode = postcode.replace(/\D/g, '').slice(0, 4);
  const deliveryEstimate: NZDeliveryEstimate | null =
    activePostcode.length === 4
      ? getNZDeliveryEstimate(activePostcode, isRural)
      : selectedRegion
        ? getNZDeliveryEstimate(selectedRegion === 'Auckland' ? '1010' : '8011', isRural)
        : null;

  const currentRate = SHIPPING_RATES.find((r) => r.id === selectedShippingId) || SHIPPING_RATES[0];

  // Filter rates based on rural toggle to simplify decisions, but keep pickup available
  const visibleRates = SHIPPING_RATES.filter((rate) => {
    if (rate.id === 'pickup') return true;
    if (isRural) {
      return rate.id.startsWith('rural');
    }
    return !rate.id.startsWith('rural');
  });

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0">
            <Truck size={14} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-secondary">
              NZ Delivery &amp; Shipping
            </h3>
            <p className="text-[10px] font-medium text-slate-500">
              Calculate exact courier rates to your destination
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-1 hover:text-primary-ink transition-colors"
          aria-expanded={isOpen}
        >
          <span className="text-[11px]">{currentRate.displayPrice}</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Selected rate summary pill */}
      <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-bold text-secondary truncate">{currentRate.name}</span>
        </div>
        <span className="font-black text-secondary shrink-0">{currentRate.displayPrice}</span>
      </div>

      {/* Expandable calculator section */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="cart-postcode"
                className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1"
              >
                NZ Postcode
              </label>
              <div className="relative">
                <input
                  id="cart-postcode"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="e.g. 0626 or 8011"
                  value={postcode}
                  onChange={(e) => handlePostcode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-secondary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
                />
                <MapPin
                  size={14}
                  className="absolute right-3 top-2.5 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="cart-region"
                className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1"
              >
                Region
              </label>
              <select
                id="cart-region"
                value={selectedRegion}
                onChange={(e) => handleRegionSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-secondary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner"
              >
                <option value="">Select Region…</option>
                {NZ_REGIONS_LIST.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rural Delivery Toggle */}
          <label
            htmlFor="cart-rural-toggle"
            className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 cursor-pointer select-none transition-colors hover:bg-amber-50"
          >
            <input
              type="checkbox"
              id="cart-rural-toggle"
              checked={isRural}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsRural(checked);
                // Switch default shipping rate matching rural status
                if (
                  checked &&
                  !selectedShippingId.startsWith('rural') &&
                  selectedShippingId !== 'pickup'
                ) {
                  const ruralMatch =
                    selectedShippingId === 'standard-courier' ? 'rural-courier' : 'rural';
                  const rate = SHIPPING_RATES.find((r) => r.id === ruralMatch);
                  if (rate) onSelectShipping(rate.id, rate.amount);
                } else if (!checked && selectedShippingId.startsWith('rural')) {
                  const stdMatch =
                    selectedShippingId === 'rural-courier' ? 'standard-courier' : 'standard';
                  const rate = SHIPPING_RATES.find((r) => r.id === stdMatch);
                  if (rate) onSelectShipping(rate.id, rate.amount);
                }
              }}
              className="mt-0.5 h-4 w-4 rounded accent-secondary cursor-pointer"
            />
            <div className="flex-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 block">
                Rural Delivery (RD Address)
              </span>
              <span className="text-[10px] font-medium text-amber-800 block">
                Required for NZ Post rural contractor delivery outside courier towns
              </span>
            </div>
          </label>

          {/* Transit Time Estimate if determined */}
          {deliveryEstimate && (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-secondary shrink-0" strokeWidth={2.5} />
                <span className="text-[11px] font-bold text-secondary">
                  Estimated delivery to {deliveryEstimate.region}:
                </span>
              </div>
              <span className="font-black text-primary-ink text-[11px] bg-white px-2 py-0.5 rounded-full border border-primary/30">
                {deliveryEstimate.transitDays}
              </span>
            </div>
          )}

          {/* Rate selection options */}
          <div className="space-y-2 pt-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">
              Select Delivery Option
            </span>
            {visibleRates.map((rate) => {
              const isSelected = selectedShippingId === rate.id;
              return (
                <label
                  key={rate.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-secondary bg-slate-50 ring-1 ring-secondary/10 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="cart-shipping-rate"
                      value={rate.id}
                      checked={isSelected}
                      onChange={() => onSelectShipping(rate.id, rate.amount)}
                      className="h-3.5 w-3.5 accent-secondary"
                    />
                    <div>
                      <span className="font-bold text-secondary block leading-snug">
                        {rate.name}
                      </span>
                      {rate.displayEstimate && (
                        <span className="text-[10px] font-medium text-slate-400 block">
                          {rate.displayEstimate}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-black text-secondary whitespace-nowrap ml-2">
                    {rate.displayPrice}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
