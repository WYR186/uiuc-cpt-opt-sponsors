'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { EmployerBucket } from '@/lib/types';
import { CompanyLogo } from './CompanyLogo';
import { Highlight } from '@/lib/highlight';
import { BreakdownBars } from './BreakdownBars';

export function EmployerList({
  employers,
  query,
  pick,
  onJumpToMajor,
  onPickChange,
}: {
  employers: EmployerBucket;
  query: string;
  pick: string | null;
  onJumpToMajor: (major: string) => void;
  onPickChange: (pick: string | null) => void;
}) {
  const rows = Object.entries(employers)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const [expanded, setExpanded] = useState<string | null>(pick);
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    setExpanded(pick);
    if (pick && rowRefs.current[pick]) {
      rowRefs.current[pick]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [pick]);

  if (!rows.length) return null;

  return (
    <ul className="rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {rows.map((row, i) => {
        const isOpen = expanded === row.name;
        return (
          <li
            key={row.name}
            ref={(el) => { rowRefs.current[row.name] = el; }}
            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
          >
            <button
              onClick={() => {
                const next = isOpen ? null : row.name;
                setExpanded(next);
                onPickChange(next);
              }}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--bg-elev)] transition-colors"
              style={{ minHeight: 44 }}
            >
              <ChevronRight
                size={14}
                className={clsx('transition-transform shrink-0', isOpen && 'rotate-90')}
                style={{ color: 'var(--fg-subtle)' }}
              />
              <CompanyLogo name={row.name} domain={row.domain} size={32} />
              <span className="text-[14px] truncate">
                <Highlight text={row.name} query={query} />
              </span>
              <span
                className="ml-auto num text-[13px] tabular-nums shrink-0"
                style={{ color: 'var(--fg-muted)' }}
              >
                {row.total.toLocaleString()}
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4" style={{ background: 'var(--bg-elev)' }}>
                <ExpandedEmployer
                  majors={row.majors}
                  onJumpToMajor={onJumpToMajor}
                  query={query}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ExpandedEmployer({
  majors,
  onJumpToMajor,
  query,
}: {
  majors: { name: string; count: number }[];
  onJumpToMajor: (name: string) => void;
  query: string;
}) {
  return (
    <div className="pt-3 space-y-4">
      <BreakdownBars
        rows={majors}
        onPick={onJumpToMajor}
        renderLegendItem={(r) => <span className="truncate">{r.name}</span>}
      />
      {majors.length > 10 && (
        <details>
          <summary className="cursor-pointer text-[12.5px] mb-2" style={{ color: 'var(--fg-muted)' }}>
            All {majors.length} majors
          </summary>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2">
            {majors.map((m) => (
              <li key={m.name} className="flex items-center gap-2 py-1">
                <button
                  onClick={() => onJumpToMajor(m.name)}
                  className="text-[13px] text-left truncate hover:underline"
                >
                  <Highlight text={m.name} query={query} />
                </button>
                <span className="ml-auto num text-[12px]" style={{ color: 'var(--fg-subtle)' }}>{m.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
