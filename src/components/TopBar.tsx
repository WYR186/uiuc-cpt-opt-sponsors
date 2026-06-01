'use client';

import { Search, Sun, Moon, X, GraduationCap } from 'lucide-react';
import { Segmented } from './Segmented';
import { TermSelect } from './TermSelect';
import { useTheme } from '@/lib/theme';
import type { Cohort, Phase, Term, TermSelection } from '@/lib/types';

export function TopBar({
  term, cohort, phase, q, terms, hideAcademic,
  onTerm, onCohort, onPhase, onQuery, onToggleAcademic,
}: {
  term: TermSelection;
  cohort: Cohort;
  phase: Phase;
  q: string;
  terms: Term[];
  hideAcademic: boolean;
  onTerm: (t: TermSelection) => void;
  onCohort: (c: Cohort) => void;
  onPhase: (p: Phase) => void;
  onQuery: (s: string) => void;
  onToggleAcademic: () => void;
}) {
  const { theme, toggle } = useTheme();
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur"
      style={{
        background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[15px] font-semibold tracking-tight mr-2">
            Who hires international students <span style={{ color: 'var(--fg-subtle)' }}>· UIUC</span>
          </h1>

          <div className="flex items-center gap-2 sm:ml-auto order-3 sm:order-2 w-full sm:w-auto flex-wrap">
            {terms.length > 0 && <TermSelect terms={terms} value={term} onChange={onTerm} />}
            <Segmented
              ariaLabel="Cohort"
              value={cohort}
              onChange={onCohort}
              options={[
                { value: 'ug', label: 'UG' },
                { value: 'grad', label: 'Grad' },
                { value: 'all', label: 'All' },
              ]}
            />
            <Segmented
              ariaLabel="Phase"
              value={phase}
              onChange={onPhase}
              options={[
                { value: 'cpt', label: 'CPT' },
                { value: 'opt', label: 'OPT' },
                { value: 'all', label: 'All' },
              ]}
            />
            <button
              aria-label={hideAcademic ? 'Show all employers (including academic)' : 'Hide academic employers (universities, labs)'}
              aria-pressed={hideAcademic}
              onClick={onToggleAcademic}
              title={hideAcademic ? 'Showing industry only · click to include academic' : 'Showing all · click to hide universities & labs'}
              className="ml-1 inline-flex items-center justify-center w-9 h-9 rounded-md transition-colors"
              style={{
                background: hideAcademic ? 'var(--accent)' : 'var(--bg-elev)',
                border: '1px solid var(--border)',
                color: hideAcademic ? 'var(--accent-fg)' : 'var(--fg-muted)',
              }}
            >
              <GraduationCap size={16} />
            </button>
            <button
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggle}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md"
              style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', color: 'var(--fg-muted)' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <label className="relative order-2 sm:order-3 w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--fg-subtle)' }}
            />
            <input
              type="search"
              value={q}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search majors or companies…"
              aria-label="Search majors or companies"
              className="w-full h-9 pl-9 pr-9 rounded-md text-[13px]"
              style={{
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
                color: 'var(--fg)',
              }}
            />
            {q && (
              <button
                aria-label="Clear search"
                onClick={() => onQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-6 h-6 rounded"
                style={{ color: 'var(--fg-subtle)' }}
              >
                <X size={14} />
              </button>
            )}
          </label>
        </div>
      </div>
    </header>
  );
}
