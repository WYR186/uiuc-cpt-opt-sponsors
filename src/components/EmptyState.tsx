'use client';

import { SearchX } from 'lucide-react';

export function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div
      className="rounded-md p-6 text-center"
      style={{ border: '1px dashed var(--border)', background: 'var(--bg-elev)' }}
    >
      <SearchX size={20} className="mx-auto mb-2" style={{ color: 'var(--fg-subtle)' }} />
      <p className="text-[14px]" style={{ color: 'var(--fg)' }}>
        No matches for <span className="font-semibold">&ldquo;{query}&rdquo;</span>.
      </p>
      <p className="text-[12.5px] mt-1" style={{ color: 'var(--fg-muted)' }}>
        Try a broader term — companies are listed under their legal name (e.g. &ldquo;Alphabet&rdquo; won&rsquo;t find Google).
      </p>
      <button
        onClick={onClear}
        className="mt-3 inline-flex items-center h-8 px-3 text-[13px] rounded-md"
        style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
      >
        Clear search
      </button>
    </div>
  );
}
