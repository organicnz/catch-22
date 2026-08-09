'use client';

import { type UserSettings, useSettingsStore } from '@/lib/store/settings';
import { useEffect, useRef } from 'react';

export function SettingsHydrator({ settings }: { settings: UserSettings | null }) {
  const initialize = useSettingsStore((state) => state.initialize);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialize(settings);
      initialized.current = true;
    }
  }, [settings, initialize]);

  return null;
}
