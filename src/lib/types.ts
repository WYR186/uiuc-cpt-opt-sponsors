export type Cohort = 'ug' | 'grad' | 'all';
export type Phase = 'cpt' | 'opt' | 'all';
export type View = 'major' | 'employer';

export type EmployerEntry = { name: string; count: number };
export type MajorEntry = { name: string; count: number };

export type MajorBucket = Record<string, { total: number; employers: EmployerEntry[] }>;
export type EmployerBucket = Record<
  string,
  { total: number; majors: MajorEntry[]; domain?: string }
>;

export type Term = {
  key: string;
  label: string;
  sortKey: number;
  lastUpdated: string;
  cohorts: Cohort[];
};

/**
 * Wire shape of `public/data.json`. Events are stored as compact int tuples
 * with separate intern tables — gives us ~5× smaller payload than a
 * pre-aggregated byTerm × byCohort × byPhase map across 11+ terms.
 */
export type RawData = {
  meta: { sourceUrl: string; generatedAt: string };
  terms: Term[];
  majors: string[];
  /**
   * `academic` flags universities, national labs, and other research institutions
   * computed at build time (`.edu` / specific `.gov` domains / name keywords).
   * The UI uses it to drive an "industry-only" toggle.
   */
  employers: Array<{ name: string; domain?: string; academic?: boolean }>;
  /** [termIdx, cohortCode (0=ug, 1=grad), phaseCode (0=cpt, 1=opt), majorIdx, employerIdx] */
  events: ReadonlyArray<readonly [number, number, number, number, number]>;
};

export const cohortCode = (c: 'ug' | 'grad'): number => (c === 'ug' ? 0 : 1);
export const phaseCode = (p: 'cpt' | 'opt'): number => (p === 'cpt' ? 0 : 1);

/** `'all'` is a special term-selector value meaning "every term combined". */
export type TermSelection = string | 'all';
