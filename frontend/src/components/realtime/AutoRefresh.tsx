'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  /** How often to refresh, in milliseconds. Defaults to 10s. */
  intervalMs?: number;
}


export function AutoRefresh({ intervalMs = 10_000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    // Skip polling when the tab is hidden — no point refreshing
    // a page no one is looking at, and it wastes backend calls.
    const tick = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };

    const id = setInterval(tick, intervalMs);

    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}