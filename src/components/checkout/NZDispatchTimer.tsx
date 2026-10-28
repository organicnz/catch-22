'use client';

import { Clock, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AucklandDispatchStatus {
  isSameDayPossible: boolean;
  message: string;
  subtext: string;
  hoursLeft: number;
  minutesLeft: number;
}

/**
 * Calculates dispatch readiness based on Pacific/Auckland local time.
 * Standard dispatch cut-off is 2:00 PM (14:00) Monday–Friday.
 */
function getAucklandDispatchStatus(): AucklandDispatchStatus {
  const now = new Date();

  // Get current day and time in Auckland timezone
  const aucklandFormatter = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = aucklandFormatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
  const hour = Number.parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = Number.parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  const isBeforeCutoff = !isWeekend && (hour < 14 || (hour === 14 && minute === 0));

  if (isBeforeCutoff) {
    const totalMinutesLeft = (14 - hour) * 60 - minute;
    const hoursLeft = Math.floor(totalMinutesLeft / 60);
    const minutesLeft = totalMinutesLeft % 60;

    const timeString =
      hoursLeft > 0
        ? `${hoursLeft}h ${minutesLeft}m`
        : `${minutesLeft} min${minutesLeft === 1 ? '' : 's'}`;

    return {
      isSameDayPossible: true,
      message: `Order in the next ${timeString} for same-day dispatch`,
      subtext: 'Dispatched from Auckland North Shore via tracked NZ courier',
      hoursLeft,
      minutesLeft,
    };
  }

  if (isWeekend) {
    return {
      isSameDayPossible: false,
      message: 'Weekend order — dispatches Monday 8:00 AM',
      subtext: 'Fresh spools packed first thing Monday morning from Auckland',
      hoursLeft: 0,
      minutesLeft: 0,
    };
  }

  // Weekday afternoon after 2 PM
  return {
    isSameDayPossible: false,
    message: 'Dispatches tomorrow morning at 8:00 AM',
    subtext: 'Packed & dispatched priority from Auckland North Shore',
    hoursLeft: 0,
    minutesLeft: 0,
  };
}

export function NZDispatchTimer({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState<AucklandDispatchStatus | null>(null);

  useEffect(() => {
    setStatus(getAucklandDispatchStatus());
    const interval = window.setInterval(() => {
      setStatus(getAucklandDispatchStatus());
    }, 60000); // refresh every minute

    return () => window.clearInterval(interval);
  }, []);

  if (!status) return null;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition-all duration-300 ${
        status.isSameDayPossible
          ? 'bg-primary/10 border-primary/30 text-secondary'
          : 'bg-slate-50 border-slate-200 text-slate-700'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              status.isSameDayPossible ? 'bg-primary text-secondary' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {status.isSameDayPossible ? (
              <Clock size={14} strokeWidth={2.5} />
            ) : (
              <Truck size={14} strokeWidth={2.5} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-secondary">
                {status.message}
              </span>
              {status.isSameDayPossible && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-primary text-secondary px-2 py-0.5 rounded-full shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  Same-Day
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-500 mt-0.5">{status.subtext}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
          <span className="text-primary-ink">📍</span>
          <span>Auckland Warehouse</span>
        </div>
      </div>
    </div>
  );
}
