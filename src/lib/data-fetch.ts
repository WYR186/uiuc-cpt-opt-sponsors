import { useEffect, useState } from 'react';
import type { RawData } from './types';

/**
 * Fetch `data.json`. Cache strategy is `default` (not `force-cache`) so the
 * browser will revalidate via ETag / Last-Modified; we also append a build
 * timestamp as a query string to bust stale caches when the data shape
 * changes between deploys.
 */
const VERSION = process.env.NEXT_PUBLIC_BUILD_TIME || '';
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function useData() {
  const [data, setData] = useState<RawData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = VERSION ? `${BASE}/data.json?v=${encodeURIComponent(VERSION)}` : `${BASE}/data.json`;
    fetch(url, { cache: 'default' })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load data.json (${r.status})`);
        return r.json();
      })
      .then((json: RawData) => {
        if (cancelled) return;
        if (!Array.isArray(json?.events)) {
          throw new Error('data.json is missing the `events` array (likely a stale cached copy — hard-refresh the page).');
        }
        setData(json);
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  return { data, error };
}
