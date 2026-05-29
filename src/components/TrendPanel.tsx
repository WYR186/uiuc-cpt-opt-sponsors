'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { computeTrend } from '@/lib/trend';
import type { Cohort, Phase, RawData, TermSelection } from '@/lib/types';

const TrendChart = dynamic(() => import('./TrendChart').then((m) => m.TrendChart), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 220, borderRadius: 6 }} />,
});

const cohortLabel: Record<Cohort, string> = { ug: 'Undergrad', grad: 'Grad', all: 'UG + Grad' };
const phaseLabel: Record<Phase, string> = { cpt: 'CPT', opt: 'OPT', all: 'CPT + OPT' };

export function TrendPanel({
  data,
  cohort,
  phase,
  term,
  view,
  pick,
  hideAcademic,
  onTermPick,
}: {
  data: RawData;
  cohort: Cohort;
  phase: Phase;
  term: TermSelection;
  view: 'major' | 'employer';
  pick: string | null;
  hideAcademic: boolean;
  onTermPick?: (term: TermSelection) => void;
}) {
  const trend = useMemo(() => {
    const pickMajor = view === 'major' ? pick : null;
    const pickEmployer = view === 'employer' ? pick : null;
    return computeTrend(data, { cohort, phase, pickMajor, pickEmployer, hideAcademic });
  }, [data, cohort, phase, view, pick, hideAcademic]);

  const total = trend.reduce((s, p) => s + p.total, 0);

  let focus: string;
  if (pick) focus = pick;
  else if (cohort === 'all' && phase === 'all') focus = 'all majors · all phases';
  else focus = `${cohortLabel[cohort]} · ${phaseLabel[phase]}`;
  if (hideAcademic) focus += ' · industry only';

  return (
    <section
      aria-label="Hire trend over time"
      className="rounded-md p-4"
      style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
    >
      <header className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>
            Hire trend by term
          </h2>
          <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--fg-subtle)' }}>
            {focus} · {trend.length} terms · <span className="num" style={{ color: 'var(--fg-muted)' }}>{total.toLocaleString()}</span> events
          </p>
        </div>
        {term !== 'all' && onTermPick && (
          <button
            onClick={() => onTermPick('all')}
            className="text-[11.5px] underline"
            style={{ color: 'var(--fg-subtle)' }}
          >
            Showing all terms; clear single-term filter
          </button>
        )}
      </header>
      <TrendChart data={trend} phase={phase} selectedTerm={term} />
    </section>
  );
}
