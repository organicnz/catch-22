'use client';

import { Check, Clock, ExternalLink, Zap } from 'lucide-react';

export interface NZBankOption {
  id: string;
  name: string;
  shortName: string;
  speed: 'instant' | '1-2h';
  speedText: string;
  portalUrl: string;
  appScheme?: string;
  notes: string;
}

export const NZ_BANKS: NZBankOption[] = [
  {
    id: 'anz',
    name: 'ANZ Bank New Zealand',
    shortName: 'ANZ',
    speed: 'instant',
    speedText: 'Instant Clearance',
    portalUrl: 'https://www.anz.co.nz/banking/',
    notes:
      'ANZ-to-ANZ transfers clear instantly 24/7 into our Catch-22 ANZ account. Your order is processed immediately!',
  },
  {
    id: 'asb',
    name: 'ASB Bank (FastNet)',
    shortName: 'ASB',
    speed: '1-2h',
    speedText: '1–2 Hours',
    portalUrl: 'https://online.asb.co.nz/',
    notes:
      'Transfers via ASB FastNet clear in 1–2 hours under Payments NZ 365-day settlement (7 days a week, including weekends).',
  },
  {
    id: 'bnz',
    name: 'Bank of New Zealand',
    shortName: 'BNZ',
    speed: '1-2h',
    speedText: '1–2 Hours',
    portalUrl: 'https://www.bnz.co.nz/ib/',
    notes:
      'BNZ internet banking payments clear in 1–2 hours under Payments NZ 365-day hourly settlement.',
  },
  {
    id: 'westpac',
    name: 'Westpac New Zealand (Westpac One)',
    shortName: 'Westpac',
    speed: '1-2h',
    speedText: '1–2 Hours',
    portalUrl: 'https://www.westpac.co.nz/',
    notes:
      'Westpac One transfers clear in 1–2 hours 7 days a week under Payments NZ 365-day hourly settlement.',
  },
  {
    id: 'kiwibank',
    name: 'Kiwibank',
    shortName: 'Kiwibank',
    speed: '1-2h',
    speedText: '1–2 Hours',
    portalUrl: 'https://www.kiwibank.co.nz/',
    notes:
      '100% Kiwi-owned Kiwibank transfers clear within 1–2 hours under Payments NZ 365-day settlement.',
  },
  {
    id: 'tsb',
    name: 'TSB Bank',
    shortName: 'TSB',
    speed: '1-2h',
    speedText: '1–2 Hours',
    portalUrl: 'https://www.tsb.co.nz/',
    notes:
      'TSB internet banking transfers clear within 1–2 hours during hourly interbank clearing cycles.',
  },
  {
    id: 'cooperative',
    name: 'The Co-operative Bank',
    shortName: 'Co-op Bank',
    speed: '1-2h',
    speedText: '1–2 Hours',
    portalUrl: 'https://www.co-operativebank.co.nz/',
    notes:
      'The Co-operative Bank internet banking transfers clear in 1–2 hours under Payments NZ 365-day hourly settlement.',
  },
  {
    id: 'sbs',
    name: 'SBS Bank',
    shortName: 'SBS Bank',
    speed: '1-2h',
    speedText: '1–2 Hours',
    portalUrl: 'https://www.sbsbank.co.nz/',
    notes:
      'SBS Bank internet banking transfers clear within 1–2 hours during hourly interbank clearing cycles.',
  },
  {
    id: 'heartland',
    name: 'Heartland Bank',
    shortName: 'Heartland',
    speed: '1-2h',
    speedText: '1–2 Hours',
    portalUrl: 'https://www.heartland.co.nz/',
    notes: 'Heartland Bank transfers clear in 1–2 hours under Payments NZ 365-day settlement.',
  },
  {
    id: 'other',
    name: 'Other NZ Bank / Credit Union',
    shortName: 'Other NZ Bank',
    speed: '1-2h',
    speedText: '1–2 Hours',
    portalUrl: '',
    notes:
      'NZ Credit Unions, Building Societies, and other institutions clear within 1–2 business hours.',
  },
];

interface NZBankSelectorProps {
  selectedBankId: string;
  onSelectBank: (bankId: string) => void;
  className?: string;
}

export function NZBankSelector({
  selectedBankId,
  onSelectBank,
  className = '',
}: NZBankSelectorProps) {
  const currentBank = NZ_BANKS.find((b) => b.id === selectedBankId) || NZ_BANKS[0];

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="bank-selector"
            className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1"
          >
            Which NZ bank are you transferring from?{' '}
            <span className="text-slate-400 font-medium lowercase">(optional)</span>
          </label>
          <span className="text-[10px] font-bold text-primary-ink">
            {currentBank.speed === 'instant' ? '⚡ Instant Clearance' : '🕒 1–2h 365-Day Clearing'}
          </span>
        </div>

        {/* Bank pill grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {NZ_BANKS.map((bank) => {
            const isSelected = selectedBankId === bank.id;
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => onSelectBank(bank.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-secondary bg-secondary text-white shadow-sm ring-1 ring-secondary/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-secondary'
                }`}
              >
                <div className="min-w-0 pr-1">
                  <span className="block text-xs font-black uppercase tracking-wider truncate">
                    {bank.shortName}
                  </span>
                  <span
                    className={`block text-[9px] font-bold ${
                      isSelected
                        ? 'text-primary'
                        : bank.speed === 'instant'
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                    }`}
                  >
                    {bank.speedText}
                  </span>
                </div>
                {isSelected && (
                  <Check size={14} className="text-primary shrink-0" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected bank clearance notice */}
      <div
        className={`p-3.5 rounded-2xl border transition-all text-xs ${
          currentBank.speed === 'instant'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-start gap-2">
          {currentBank.speed === 'instant' ? (
            <Zap size={14} className="text-emerald-700 shrink-0 mt-0.5" strokeWidth={2.5} />
          ) : (
            <Clock size={14} className="text-secondary shrink-0 mt-0.5" strokeWidth={2.5} />
          )}
          <div className="flex-1">
            <p className="font-bold leading-relaxed">{currentBank.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the prioritized bank launcher on the success screen
 * tailored to the bank the customer used or selected.
 */
export function NZBankQuickLauncher({
  bankId,
  total,
  reference,
}: {
  bankId?: string;
  total: number;
  reference: string;
}) {
  const chosenBank = NZ_BANKS.find((b) => b.id === bankId);
  const banksToShow = chosenBank?.portalUrl ? [chosenBank] : [];

  // Add the remaining top banks
  const otherBanks = NZ_BANKS.filter((b) => b.id !== bankId && b.portalUrl && b.id !== 'other');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] text-slate-300 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
        <span>
          Amount: <strong className="text-primary font-mono">${total.toFixed(2)} NZD</strong>
        </span>
        <span>
          Reference: <strong className="text-white font-mono">{reference}</strong>
        </span>
      </div>

      {chosenBank?.portalUrl && (
        <a
          href={chosenBank.portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-secondary border-2 border-primary text-xs font-black uppercase tracking-wider transition-all hover:bg-primary shadow-sm"
        >
          <ExternalLink size={14} strokeWidth={2.5} />
          Open {chosenBank.name} Online Banking
        </a>
      )}

      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
          Open your NZ bank to transfer:
        </p>
        <div className="flex flex-wrap gap-2">
          {(banksToShow.length > 0 ? otherBanks : NZ_BANKS.filter((b) => b.portalUrl)).map(
            (bank) => (
              <a
                key={bank.id}
                href={bank.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors border border-white/10"
              >
                <span>{bank.shortName}</span>
                <ExternalLink size={10} className="opacity-60" />
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}
