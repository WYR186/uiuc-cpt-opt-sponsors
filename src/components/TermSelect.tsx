'use client';

import { ChevronDown } from 'lucide-react';
import type { Term, TermSelection } from '@/lib/types';

export function TermSelect({
  terms,
  value,
  onChange,
}: {
  terms: Term[];
  value: TermSelection;
  onChange: (v: TermSelection) => void;
}) {
  // Terms come in ascending sortKey from the build script; reverse so the
  // most recent term is on top of the menu.
  const ordered = [...terms].sort((a, b) => b.sortKey - a.sortKey);
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Term</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-8 pl-3 pr-7 rounded-md text-[13px] font-medium"
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          color: 'var(--fg)',
        }}
        aria-label="Term"
      >
        <option value="all">All time ({terms.length} terms)</option>
        {ordered.map((t) => (
          <option key={t.key} value={t.key}>{t.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2 pointer-events-none" style={{ color: 'var(--fg-subtle)' }} />
    </label>
  );
}
