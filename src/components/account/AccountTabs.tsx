'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useTransition, type ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TabDef<TId extends string = string> {
  id: TId;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface TabsProps<TId extends string> {
  tabs: TabDef<TId>[];
  panels: Record<TId, ComponentType>;
  defaultTab?: TId;
}

// ---------------------------------------------------------------------------
// Inner component (uses useSearchParams — must be wrapped in Suspense)
// ---------------------------------------------------------------------------
function TabsInner<TId extends string>({ tabs, panels, defaultTab }: TabsProps<TId>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeId = (searchParams.get('tab') as TId) ?? defaultTab ?? tabs[0].id;
  const ActivePanel = panels[activeId] ?? panels[tabs[0].id];

  const setTab = useCallback(
    (id: TId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', id);
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  return (
    <div className={isPending ? 'opacity-60 transition-opacity duration-150' : ''}>
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Account navigation"
        className="flex border-b border-slate-100 mb-10 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeId === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setTab(tab.id)}
              onKeyDown={(e) => {
                const idx = tabs.findIndex((t) => t.id === tab.id);
                if (e.key === 'ArrowRight') setTab(tabs[(idx + 1) % tabs.length].id);
                if (e.key === 'ArrowLeft') setTab(tabs[(idx - 1 + tabs.length) % tabs.length].id);
              }}
              className={[
                'relative flex items-center gap-2 px-5 py-4',
                'text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap',
                'transition-colors duration-150 outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                isActive
                  ? 'text-secondary after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                  : 'text-slate-400 hover:text-slate-700',
              ].join(' ')}
            >
              <Icon size={13} aria-hidden="true" />
              {tab.label}
              {(tab.badge ?? 0) > 0 && (
                <span
                  aria-label={`${tab.badge} pending`}
                  className="ml-1 bg-primary text-secondary text-[9px] font-black rounded-full min-w-[1rem] h-4 px-1 flex items-center justify-center leading-none"
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active panel only — no hidden DOM bloat */}
      <div
        role="tabpanel"
        id={`panel-${activeId}`}
        aria-labelledby={`tab-${activeId}`}
        tabIndex={0}
        className="outline-none"
      >
        <ActivePanel />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export — wraps inner in Suspense (required for useSearchParams)
// ---------------------------------------------------------------------------
export function AccountTabs<TId extends string>(props: TabsProps<TId>) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse">
          <div className="flex border-b border-slate-100 mb-10 gap-2">
            {props.tabs.map((t) => (
              <div key={t.id} className="h-12 w-28 rounded-t-lg bg-slate-100" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-slate-50" />
        </div>
      }
    >
      <TabsInner {...props} />
    </Suspense>
  );
}
