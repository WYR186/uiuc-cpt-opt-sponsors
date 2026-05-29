import type {
  Cohort,
  EmployerBucket,
  MajorBucket,
  Phase,
  RawData,
  TermSelection,
} from './types';
import { cohortCode } from './types';

/**
 * Walk the event list once, filter by (term, cohort, phase), and produce the
 * `MajorBucket` and `EmployerBucket` shapes the list views already know how
 * to render. Cheap enough (<10 ms for 60 k events) to run on every filter
 * change without memoizing across phase/cohort transitions.
 */
export function aggregate(
  data: RawData,
  term: TermSelection,
  cohort: Cohort,
  phase: Phase,
  hideAcademic = false,
): { majors: MajorBucket; employers: EmployerBucket } {
  // Pre-compute "is academic employer" lookup so the hot loop reads a typed array
  const academic = new Uint8Array(data.employers.length);
  if (hideAcademic) {
    for (let i = 0; i < data.employers.length; i++) {
      if (data.employers[i].academic) academic[i] = 1;
    }
  }
  const wantTermIdx =
    term === 'all'
      ? null
      : data.terms.findIndex((t) => t.key === term);
  const wantCohortAll = cohort === 'all';
  const wantCohort = wantCohortAll ? -1 : cohortCode(cohort);
  // phaseMask: bitset over phase codes (0=cpt, 1=opt)
  const wantCpt = phase === 'cpt' || phase === 'all';
  const wantOpt = phase === 'opt' || phase === 'all';

  // intern-index-keyed accumulators avoid hashing strings on the hot path
  const majorTotals = new Map<number, number>();
  const employerTotals = new Map<number, number>();
  const majorEmployer = new Map<number, Map<number, number>>(); // major → employer → count
  const employerMajor = new Map<number, Map<number, number>>();

  for (const ev of data.events) {
    const [tIdx, cCode, pCode, mIdx, eIdx] = ev;
    if (wantTermIdx !== null && tIdx !== wantTermIdx) continue;
    if (!wantCohortAll && cCode !== wantCohort) continue;
    if (pCode === 0 ? !wantCpt : !wantOpt) continue;
    if (hideAcademic && academic[eIdx]) continue;

    majorTotals.set(mIdx, (majorTotals.get(mIdx) ?? 0) + 1);
    employerTotals.set(eIdx, (employerTotals.get(eIdx) ?? 0) + 1);

    let me = majorEmployer.get(mIdx);
    if (!me) { me = new Map(); majorEmployer.set(mIdx, me); }
    me.set(eIdx, (me.get(eIdx) ?? 0) + 1);

    let em = employerMajor.get(eIdx);
    if (!em) { em = new Map(); employerMajor.set(eIdx, em); }
    em.set(mIdx, (em.get(mIdx) ?? 0) + 1);
  }

  const majors: MajorBucket = {};
  for (const [mIdx, total] of majorTotals) {
    const name = data.majors[mIdx];
    const employers = [...(majorEmployer.get(mIdx) ?? new Map<number, number>()).entries()]
      .map(([eIdx, count]) => ({ name: data.employers[eIdx].name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    majors[name] = { total, employers };
  }

  const employers: EmployerBucket = {};
  for (const [eIdx, total] of employerTotals) {
    const e = data.employers[eIdx];
    const ms = [...(employerMajor.get(eIdx) ?? new Map<number, number>()).entries()]
      .map(([mIdx, count]) => ({ name: data.majors[mIdx], count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const entry: EmployerBucket[string] = { total, majors: ms };
    if (e.domain) entry.domain = e.domain;
    employers[e.name] = entry;
  }

  return { majors, employers };
}
