import type { Cohort, Phase, RawData } from './types';
import { cohortCode } from './types';

export type TrendPoint = {
  termKey: string;
  label: string;
  short: string;     // e.g. 'F23', 'S26', 'Sm24' — for the X-axis tick
  sortKey: number;
  cpt: number;
  opt: number;
  total: number;
};

/**
 * Build the per-term hire-count series respecting the active filters.
 *
 * `pickMajor` / `pickEmployer` narrow to a single major / employer when set —
 * matches the "row expanded" state in the list views so the chart reacts to
 * the same picks that drive the list.
 *
 * Returns one point per term in chronological order, with CPT and OPT counts
 * (and a derived total) suitable for a multi-line Recharts series.
 */
export function computeTrend(
  data: RawData,
  opts: {
    cohort: Cohort;
    phase: Phase;
    pickMajor?: string | null;
    pickEmployer?: string | null;
    hideAcademic?: boolean;
  },
): TrendPoint[] {
  const wantCohortAll = opts.cohort === 'all';
  const wantCohort = wantCohortAll ? -1 : cohortCode(opts.cohort as 'ug' | 'grad');
  const wantCpt = opts.phase === 'cpt' || opts.phase === 'all';
  const wantOpt = opts.phase === 'opt' || opts.phase === 'all';

  const majorIdx = opts.pickMajor ? data.majors.indexOf(opts.pickMajor) : -1;
  const employerIdx = opts.pickEmployer
    ? data.employers.findIndex((e) => e.name === opts.pickEmployer)
    : -1;
  const filterMajor = opts.pickMajor != null && majorIdx >= 0;
  const filterEmployer = opts.pickEmployer != null && employerIdx >= 0;
  const academic = new Uint8Array(data.employers.length);
  if (opts.hideAcademic) {
    for (let i = 0; i < data.employers.length; i++) {
      if (data.employers[i].academic) academic[i] = 1;
    }
  }

  const cptByTerm = new Map<number, number>();
  const optByTerm = new Map<number, number>();
  for (const ev of data.events) {
    const [tIdx, cCode, pCode, mIdx, eIdx] = ev;
    if (!wantCohortAll && cCode !== wantCohort) continue;
    if (pCode === 0 ? !wantCpt : !wantOpt) continue;
    if (filterMajor && mIdx !== majorIdx) continue;
    if (filterEmployer && eIdx !== employerIdx) continue;
    if (opts.hideAcademic && academic[eIdx]) continue;
    if (pCode === 0) cptByTerm.set(tIdx, (cptByTerm.get(tIdx) ?? 0) + 1);
    else            optByTerm.set(tIdx, (optByTerm.get(tIdx) ?? 0) + 1);
  }

  // Always emit a point for every term in the dataset (zero-fill) so gaps in
  // the picked-major's history don't fool the eye into thinking the term is
  // missing entirely.
  const out: TrendPoint[] = data.terms.map((t, idx) => {
    const cpt = cptByTerm.get(idx) ?? 0;
    const opt = optByTerm.get(idx) ?? 0;
    return {
      termKey: t.key,
      label: t.label,
      short: shortLabel(t.label),
      sortKey: t.sortKey,
      cpt,
      opt,
      total: cpt + opt,
    };
  });
  out.sort((a, b) => a.sortKey - b.sortKey);
  return out;
}

function shortLabel(label: string): string {
  // 'Spring 2018' → 'S18', 'Fall 2023' → 'F23', 'Summer 2024' → 'Sm24'
  const m = label.match(/^(Spring|Summer|Fall|Winter)\s+(\d{4})$/);
  if (!m) return label;
  const prefix: Record<string, string> = { Spring: 'S', Summer: 'Sm', Fall: 'F', Winter: 'W' };
  return `${prefix[m[1]]}${m[2].slice(2)}`;
}
