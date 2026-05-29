/**
 * Build two fuse.js indexes per active bucket — one over majors, one over
 * employers. We index lazily (only when the user first types) to keep
 * first-paint cheap.
 */
import Fuse from 'fuse.js';
import { useMemo } from 'react';
import type { EmployerBucket, MajorBucket } from './types';

type MajorHit = { name: string };
type EmployerHit = { name: string };

const FUSE_OPTS = {
  threshold: 0.3,
  ignoreLocation: true,
  includeScore: false,
  keys: ['name'],
};

export type SearchIndex = {
  majorMatches: (q: string) => Set<string>;
  employerMatches: (q: string) => Set<string>;
};

export function useSearchIndex(majors: MajorBucket, employers: EmployerBucket): SearchIndex {
  return useMemo(() => {
    const majorList: MajorHit[] = Object.keys(majors).map((name) => ({ name }));
    const employerList: EmployerHit[] = Object.keys(employers).map((name) => ({ name }));
    const majorFuse = new Fuse(majorList, FUSE_OPTS);
    const employerFuse = new Fuse(employerList, FUSE_OPTS);
    return {
      majorMatches: (q: string) => {
        if (!q.trim()) return new Set(majorList.map((m) => m.name));
        return new Set(majorFuse.search(q).map((r) => r.item.name));
      },
      employerMatches: (q: string) => {
        if (!q.trim()) return new Set(employerList.map((e) => e.name));
        return new Set(employerFuse.search(q).map((r) => r.item.name));
      },
    };
  }, [majors, employers]);
}

/** Standard debounce — returns a state-like value that lags `value` by `delay` ms. */
import { useEffect, useState } from 'react';
export function useDebounced<T>(value: T, delay = 100): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}
