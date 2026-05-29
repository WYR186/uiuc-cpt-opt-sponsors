'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { MajorBucket, EmployerBucket } from '@/lib/types';
import { COLLEGES, collegeForMajor, collegeMeta, type CollegeId } from '@/lib/colleges';
import dynamic from 'next/dynamic';
import { CompanyLogo } from './CompanyLogo';
import { Highlight } from '@/lib/highlight';

const DonutMini = dynamic(() => import('./DonutMini').then((m) => m.DonutMini), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 200, borderRadius: 6 }} />,
});

const COLLEGE_ORDER = new Map(COLLEGES.map((c, i) => [c.id, i] as const));

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
  const { groups, max } = useMemo(() => {
    const rows = Object.entries(majors).map(([name, v]) => ({ name, ...v }));
    const maxTotal = rows.reduce((m, r) => Math.max(m, r.total), 0) || 1;
    const byCollege = new Map<CollegeId, typeof rows>();
    for (const r of rows) {
      const c = collegeForMajor(r.name);
      (byCollege.get(c) ?? byCollege.set(c, []).get(c)!).push(r);
    }
    const out = [...byCollege.entries()].map(([id, list]) => ({
      id,
      meta: collegeMeta(id),
      majors: list.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
      total: list.reduce((s, r) => s + r.total, 0),
    }));
    out.sort((a, b) => b.total - a.total || (COLLEGE_ORDER.get(a.id)! - COLLEGE_ORDER.get(b.id)!));
    return { groups: out, max: maxTotal };
  }, [majors]);

  const [expanded, setExpanded] = useState<string | null>(pick);
  const [opened, setOpened] = useState<Set<CollegeId>>(() =>
    pick ? new Set([collegeForMajor(pick)]) : new Set()
  );
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});

  // Colleges are collapsed by default; searching reveals all so no match hides.
  const forceOpen = query.trim().length > 0;
  const isCollegeOpen = (id: CollegeId) => forceOpen || opened.has(id);

  useEffect(() => {
    setExpanded(pick);
    if (pick) {
      const c = collegeForMajor(pick);
      setOpened((prev) => (prev.has(c) ? prev : new Set(prev).add(c)));
      requestAnimationFrame(() => {
        rowRefs.current[pick]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }
  }, [pick]);

  if (!groups.length) return null;

  const toggleCollege = (id: CollegeId) =>
    setOpened((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {groups.map((g, gi) => {
        const open = isCollegeOpen(g.id);
        return (
          <section key={g.id} style={{ borderTop: gi === 0 ? 'none' : '1px solid var(--border)' }}>
            <button
              onClick={() => toggleCollege(g.id)}
              aria-expanded={open}
              title={g.meta.full}
              className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--bg-elev)]"
              style={{ background: 'var(--bg-elev)' }}
            >
              <ChevronRight
                size={13}
                className={clsx('transition-transform shrink-0', open && 'rotate-90')}
                style={{ color: 'var(--fg-subtle)' }}
              />
              <span className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--fg)' }}>
                {g.meta.short}
              </span>
              <span className="text-[11px] shrink-0" style={{ color: 'var(--fg-subtle)' }}>
                {g.majors.length}
              </span>
              <span className="ml-auto num text-[12px] tabular-nums shrink-0" style={{ color: 'var(--fg-muted)' }}>
                {g.total.toLocaleString()}
              </span>
            </button>

            {open && (
              <ul>
                {g.majors.map((row) => {
                  const isOpen = expanded === row.name;
                  const pct = Math.max(2, Math.round((row.total / max) * 100));
                  return (
                    <li
                      key={row.name}
                      ref={(el) => { rowRefs.current[row.name] = el; }}
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <button
                        onClick={() => {
                          const next = isOpen ? null : row.name;
                          setExpanded(next);
                          onPickChange(next);
                        }}
                        aria-expanded={isOpen}
                        className="relative w-full flex items-center gap-2 pl-7 pr-3 py-1.5 text-left transition-colors hover:bg-[var(--bg-elev)]"
                        style={isOpen ? { boxShadow: 'inset 2px 0 0 var(--accent)' } : undefined}
                      >
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-0 pointer-events-none"
                          style={{ width: `${pct}%`, background: 'color-mix(in srgb, var(--accent) 9%, transparent)' }}
                        />
                        <ChevronRight
                          size={12}
                          className={clsx('transition-transform shrink-0 relative', isOpen && 'rotate-90')}
                          style={{ color: 'var(--fg-subtle)' }}
                        />
                        <span className="text-[13px] truncate relative">
                          <Highlight text={row.name} query={query} />
                        </span>
                        <span
                          className="ml-auto num text-[12.5px] tabular-nums shrink-0 relative"
                          style={{ color: 'var(--fg-muted)' }}
                          aria-label={`${row.total} hires`}
                        >
                          {row.total}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="pl-7 pr-4 pb-4" style={{ background: 'var(--bg-elev)' }}>
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
            )}
          </section>
        );
      })}
    </div>
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
