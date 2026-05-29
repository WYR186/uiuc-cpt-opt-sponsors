'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import type { Term } from '@/lib/types';

export function Disclaimer({ terms }: { terms: Term[] }) {
  const latest = terms.length
    ? [...terms].sort((a, b) => b.sortKey - a.sortKey)[0]
    : null;
  const oldest = terms.length
    ? [...terms].sort((a, b) => a.sortKey - b.sortKey)[0]
    : null;
  const range = latest && oldest && latest.key !== oldest.key
    ? `${oldest.label} – ${latest.label}`
    : latest?.label ?? '—';
  return (
    <div
      className="px-3 py-2 text-[12.5px] leading-snug rounded-md flex items-start gap-2"
      style={{
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        color: 'var(--fg-muted)',
      }}
    >
      <Info size={14} className="mt-0.5 shrink-0" />
      <span>
        Not affiliated with the University of Illinois. Aggregated from publicly available UIUC Career Center CPT/OPT reports across <span style={{ color: 'var(--fg)' }}>{terms.length} terms</span> (<span className="num" style={{ color: 'var(--fg)' }}>{range}</span>). Each event is one work-authorization grant; the same student can appear in more than one term. Hiring policies change — verify with the company before applying.{' '}
        <Link href="/about/" className="underline" style={{ color: 'var(--fg)' }}>About &amp; methodology →</Link>
      </span>
    </div>
  );
}
