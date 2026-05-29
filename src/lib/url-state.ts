/**
 * Sync UI state to the URL hash so links are shareable and refresh-safe.
 *
 * The hash takes the form
 *   `#term=all&cohort=ug&phase=opt&view=major&q=tesla&pick=Tesla`.
 * `pick` is the major or employer to pre-expand when arriving from a
 * cross-link.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Cohort, Phase, View, TermSelection } from './types';

export type UrlState = {
  term: TermSelection;
  cohort: Cohort;
  phase: Phase;
  view: View;
  q: string;
  pick: string | null;
  hideAcademic: boolean;
};

const DEFAULTS: UrlState = {
  term: 'all',
  cohort: 'all',
  phase: 'all',
  view: 'employer',
  q: '',
  pick: null,
  hideAcademic: false,
};

function parseHash(hash: string): UrlState {
  const out: UrlState = { ...DEFAULTS };
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return out;
  const params = new URLSearchParams(raw);
  const term = params.get('term');
  if (term) out.term = term;
  const cohort = params.get('cohort');
  if (cohort === 'ug' || cohort === 'grad' || cohort === 'all') out.cohort = cohort;
  const phase = params.get('phase');
  if (phase === 'cpt' || phase === 'opt' || phase === 'all') out.phase = phase;
  const view = params.get('view');
  if (view === 'major' || view === 'employer') out.view = view;
  const q = params.get('q');
  if (q) out.q = q;
  const pick = params.get('pick');
  if (pick) out.pick = pick;
  if (params.get('no_academic') === '1') out.hideAcademic = true;
  return out;
}

function serialize(state: UrlState): string {
  const params = new URLSearchParams();
  params.set('term', state.term);
  params.set('cohort', state.cohort);
  params.set('phase', state.phase);
  params.set('view', state.view);
  if (state.q) params.set('q', state.q);
  if (state.pick) params.set('pick', state.pick);
  if (state.hideAcademic) params.set('no_academic', '1');
  return '#' + params.toString();
}

export function useUrlState() {
  const [state, setState] = useState<UrlState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(parseHash(window.location.hash));
    setHydrated(true);
    const onHash = () => setState(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const update = useCallback((patch: Partial<UrlState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      const hash = serialize(next);
      if (typeof window !== 'undefined' && window.location.hash !== hash) {
        history.replaceState(null, '', hash);
      }
      return next;
    });
  }, []);

  return { state, update, hydrated };
}
