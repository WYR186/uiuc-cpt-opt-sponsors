'use client';

import { useMemo } from 'react';
import { TopBar } from '@/components/TopBar';
import { Disclaimer } from '@/components/Disclaimer';
import { HeroStrip } from '@/components/HeroStrip';
import { TrendPanel } from '@/components/TrendPanel';
import { ViewTabs } from '@/components/ViewTabs';
import { MajorList } from '@/components/MajorList';
import { EmployerList } from '@/components/EmployerList';
import { SkeletonList } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { Footer } from '@/components/Footer';
import { useData } from '@/lib/data-fetch';
import { useUrlState } from '@/lib/url-state';
import { useDebounced, useSearchIndex } from '@/lib/search';
import type { Cohort, Phase, TermSelection, View } from '@/lib/types';
import { aggregate } from '@/lib/aggregate';

export default function Home() {
  const { data, error } = useData();
  const { state, update, hydrated } = useUrlState();
  const debouncedQ = useDebounced(state.q, 100);

  const { majors, employers } = useMemo(() => {
    if (!data) return { majors: {}, employers: {} } as ReturnType<typeof aggregate>;
    return aggregate(data, state.term, state.cohort, state.phase, state.hideAcademic);
  }, [data, state.term, state.cohort, state.phase, state.hideAcademic]);

  const search = useSearchIndex(majors, employers);

  const filteredMajors = useMemo(() => {
    if (!debouncedQ.trim()) return majors;
    const majorHits = search.majorMatches(debouncedQ);
    const employerHits = search.employerMatches(debouncedQ);
    const out: typeof majors = {};
    for (const [name, m] of Object.entries(majors)) {
      const employerHit = m.employers.some((e) => employerHits.has(e.name));
      if (majorHits.has(name) || employerHit) out[name] = m;
    }
    return out;
  }, [majors, debouncedQ, search]);

  const filteredEmployers = useMemo(() => {
    if (!debouncedQ.trim()) return employers;
    const employerHits = search.employerMatches(debouncedQ);
    const majorHits = search.majorMatches(debouncedQ);
    const out: typeof employers = {};
    for (const [name, e] of Object.entries(employers)) {
      const majorHit = e.majors.some((m) => majorHits.has(m.name));
      if (employerHits.has(name) || majorHit) out[name] = e;
    }
    return out;
  }, [employers, debouncedQ, search]);

  const counts = {
    major: Object.keys(filteredMajors).length,
    employer: Object.keys(filteredEmployers).length,
  };

  const termLabel = useMemo(() => {
    if (state.term === 'all') return `All time · ${data?.terms.length ?? 0} terms`;
    return data?.terms.find((t) => t.key === state.term)?.label ?? state.term;
  }, [data, state.term]);

  const onTerm = (t: TermSelection) => update({ term: t, pick: null });
  const onCohort = (c: Cohort) => update({ cohort: c, pick: null });
  const onPhase = (p: Phase) => update({ phase: p, pick: null });
  const onView = (v: View) => update({ view: v, pick: null });
  const onQuery = (q: string) => update({ q });

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        term={state.term}
        cohort={state.cohort}
        phase={state.phase}
        q={state.q}
        terms={data?.terms ?? []}
        hideAcademic={state.hideAcademic}
        onTerm={onTerm}
        onCohort={onCohort}
        onPhase={onPhase}
        onQuery={onQuery}
        onToggleAcademic={() => update({ hideAcademic: !state.hideAcademic })}
      />

      <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-4 flex-1 space-y-4">
        {data && (
          <TrendPanel
            data={data}
            cohort={state.cohort}
            phase={state.phase}
            term={state.term}
            view={state.view}
            pick={state.pick}
            hideAcademic={state.hideAcademic}
            onTermPick={(t) => update({ term: t })}
          />
        )}

        {data && Object.keys(employers).length > 0 && (
          <section aria-label="Top sponsors">
            <h2 className="text-[12px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--fg-subtle)' }}>
              Top sponsors · {state.cohort === 'ug' ? 'Undergrad' : state.cohort === 'grad' ? 'Grad' : 'UG + Grad'} · {state.phase === 'all' ? 'CPT + OPT' : state.phase.toUpperCase()} · {termLabel}
            </h2>
            <HeroStrip
              employers={employers}
              onPick={(name) => update({ view: 'employer', pick: name })}
            />
          </section>
        )}

        <section>
          <ViewTabs view={state.view} counts={counts} onChange={onView} />
        </section>

        <section>
          {!hydrated || !data ? (
            <SkeletonList rows={8} />
          ) : error ? (
            <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Failed to load data: {error}</p>
          ) : state.view === 'major' ? (
            counts.major === 0 ? (
              <EmptyState query={debouncedQ} onClear={() => onQuery('')} />
            ) : (
              <MajorList
                majors={filteredMajors}
                employers={employers}
                query={debouncedQ}
                pick={state.pick}
                onJumpToEmployer={(employer) => update({ view: 'employer', pick: employer })}
                onPickChange={(pick) => update({ pick })}
              />
            )
          ) : (
            counts.employer === 0 ? (
              <EmptyState query={debouncedQ} onClear={() => onQuery('')} />
            ) : (
              <EmployerList
                employers={filteredEmployers}
                query={debouncedQ}
                pick={state.pick}
                onJumpToMajor={(major) => update({ view: 'major', pick: major })}
                onPickChange={(pick) => update({ pick })}
              />
            )
          )}
        </section>

        {data && <Disclaimer terms={data.terms} />}
      </main>

      <Footer
        terms={data?.terms ?? []}
        sourceUrl={data?.meta.sourceUrl ?? 'https://www.careercenter.illinois.edu/'}
      />
    </div>
  );
}
