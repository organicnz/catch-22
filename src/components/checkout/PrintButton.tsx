'use client';

import { Printer } from 'lucide-react';

export function PrintButton({ label = 'Print receipt' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-secondary transition-all hover:border-secondary hover:bg-secondary hover:text-white print:hidden"
    >
      <Printer size={16} strokeWidth={2.5} />
      {label}
    </button>
  );
}
