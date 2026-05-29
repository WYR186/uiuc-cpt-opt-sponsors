'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { MajorBucket, EmployerBucket } from '@/lib/types';
import dynamic from 'next/dynamic';
import { CompanyLogo } from './CompanyLogo';
import { Highlight } from '@/lib/highlight';

const DonutMini = dynamic(() => import('./DonutMini').then((m) => m.DonutMini), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 200, borderRadius: 6 }} />,
});

export function MajorList({
  majors,
  employers,
  query,
  pick,
  onJumpToEmployer,
  onPickChange,
}: {
  majors: MajorBucket;
  employers: EmployerBucket;
  query: string;
  pick: string | null;
  onJumpToEmployer: (employer: string) => void;
  onPickChange: (pick: string | null) => void;
}) {
  const rows = Object.entries(majors)
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
              <span className="text-[14px] truncate">
                <Highlight text={row.name} query={query} />
              </span>
              <span
                className="ml-auto num text-[13px] tabular-nums shrink-0"
                style={{ color: 'var(--fg-muted)' }}
                aria-label={`${row.total} hires`}
              >
                {row.total}
              </span>
            </button>

            {isOpen && (
              <div
                className="px-4 pb-4"
                style={{ background: 'var(--bg-elev)' }}
              >
                <ExpandedMajor
                  employers={row.employers}
                  employerMeta={employers}
                  query={query}
                  onJumpToEmployer={onJumpToEmployer}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ExpandedMajor({
  employers,
  employerMeta,
  query,
  onJumpToEmployer,
}: {
  employers: { name: string; count: number }[];
  employerMeta: EmployerBucket;
  query: string;
  onJumpToEmployer: (name: string) => void;
}) {
  return (
    <div className="pt-3 space-y-4">
      <DonutMini
        rows={employers}
        onPick={onJumpToEmployer}
        renderLegendItem={(r) => (
          <span className="inline-flex items-center gap-2 min-w-0">
            <CompanyLogo name={r.name} domain={employerMeta[r.name]?.domain} size={18} />
            <span className="truncate">{r.name}</span>
          </span>
        )}
      />
      {employers.length > 10 && (
        <details>
          <summary
            className="cursor-pointer text-[12.5px] mb-2"
            style={{ color: 'var(--fg-muted)' }}
          >
            All {employers.length} employers
          </summary>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2">
            {employers.map((e) => (
              <li key={e.name} className="flex items-center gap-2 py-1">
                <CompanyLogo name={e.name} domain={employerMeta[e.name]?.domain} size={20} />
                <button
                  onClick={() => onJumpToEmployer(e.name)}
                  className="text-[13px] text-left truncate hover:underline"
                >
                  <Highlight text={e.name} query={query} />
                </button>
                <span className="ml-auto num text-[12px]" style={{ color: 'var(--fg-subtle)' }}>{e.count}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
