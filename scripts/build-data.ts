/**
 * Build-time data pipeline: every xlsx in data/raw/** → public/data.json.
 *
 * The Career Center has used several different spreadsheet layouts across
 * terms. This script normalizes everything into a flat list of hire events:
 *
 *   { term, cohort, phase, majorIdx, employerIdx }
 *
 * Plus interned string tables for majors and employers. The client
 * aggregates on demand — that keeps data.json small even with ~10 terms
 * (compact rows beat denormalized per-term-per-bucket maps by ~20×).
 *
 * Handled layouts:
 *   - Modern (Fall 2023+): two sheets per file, `CPT by Major` and
 *     `OPT by Major`, with `Primary_Major | Employer_Name [| City | State]`.
 *     Phase is implied by the sheet name.
 *   - Legacy single-sheet (Spring 2020 / 2021 / Fall 2021 / 2022 / Spring
 *     2024): one combined sheet, columns `Primary_Major | Employer_Name |
 *     State | Work Authorization`. Phase comes from the per-row "Work
 *     Authorization" column.
 *   - Legacy multi-sheet (Spring 2018, Spring 2019): a stack of historical
 *     snapshots. Only the first sheet (most recent) is used; the older
 *     embedded snapshots overlap and would double-count.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import YAML from 'yaml';

type Cohort = 'ug' | 'grad';
type Phase = 'cpt' | 'opt';

const ROOT = path.resolve(process.cwd());
const RAW = path.join(ROOT, 'data/raw');
const OUT = path.join(ROOT, 'public/data.json');
const ALIAS_PATH = path.join(ROOT, 'data/aliases.yml');
const DOMAINS_PATH = path.join(ROOT, 'data/company-domains.json');

const norm = (s: unknown): string =>
  typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '';

function loadAliases(): Record<string, string> {
  if (!fs.existsSync(ALIAS_PATH)) return {};
  const raw = YAML.parse(fs.readFileSync(ALIAS_PATH, 'utf8')) ?? {};
  const direct: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    direct[norm(k)] = norm(v as string);
  }
  // Resolve chains: if A→B and B→C, store A→C. Detect cycles defensively.
  const resolved: Record<string, string> = {};
  for (const k of Object.keys(direct)) {
    const seen = new Set<string>([k]);
    let cur = direct[k];
    while (direct[cur] && !seen.has(cur)) {
      seen.add(cur);
      cur = direct[cur];
    }
    resolved[k] = cur;
  }
  return resolved;
}
function loadDomains(): Record<string, string> {
  if (!fs.existsSync(DOMAINS_PATH)) return {};
  return JSON.parse(fs.readFileSync(DOMAINS_PATH, 'utf8'));
}

// ---- File discovery ----

const TERM_RE = /(Spring|Fall|Summer|Winter)\s*[_ ]?(\d{2,4})/i;
const TERM_ORDER: Record<string, number> = { Spring: 0, Summer: 1, Fall: 2, Winter: 3 };

function parseTerm(filename: string): { key: string; label: string; sortKey: number } | null {
  const m = filename.match(TERM_RE);
  if (!m) return null;
  const season = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
  let yr = parseInt(m[2], 10);
  if (yr < 100) yr += 2000;
  const key = `${season}${yr}`;
  const label = `${season} ${yr}`;
  const sortKey = yr * 10 + (TERM_ORDER[season] ?? 0);
  return { key, label, sortKey };
}
function parseCohort(filename: string): Cohort | null {
  const f = filename.toLowerCase();
  if (f.startsWith('graduate') || f.startsWith('grad_') || f.startsWith('grad ')) return 'grad';
  if (f.startsWith('undergrad') || f.startsWith('ug_') || f.startsWith('ug ')) return 'ug';
  return null;
}
function listInputs(): Array<{ file: string; cohort: Cohort; term: ReturnType<typeof parseTerm> }> {
  const out: Array<{ file: string; cohort: Cohort; term: ReturnType<typeof parseTerm> }> = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.xlsx')) {
        const cohort = parseCohort(entry.name);
        const term = parseTerm(entry.name);
        if (cohort && term) out.push({ file: p, cohort, term });
      }
    }
  };
  walk(RAW);
  return out;
}

// ---- Sheet parsing ----

const MAJOR_HEADER_KEYS = ['Primary_Major', 'Major'];
const EMPLOYER_HEADER_KEYS = ['Employer_Name', 'Employer'];
const AUTH_HEADER_KEYS = ['Work Authorization', 'CPT/OPT', 'Authorization', 'Status'];

function findHeader(
  rows: unknown[][],
): { headerRowIdx: number; majorCol: number; employerCol: number; authCol: number } | null {
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const row = rows[i] ?? [];
    let major = -1, employer = -1, auth = -1;
    for (let c = 0; c < row.length; c++) {
      const v = norm(row[c]);
      if (major < 0 && MAJOR_HEADER_KEYS.includes(v)) major = c;
      if (employer < 0 && EMPLOYER_HEADER_KEYS.includes(v)) employer = c;
      if (auth < 0 && AUTH_HEADER_KEYS.includes(v)) auth = c;
    }
    if (major >= 0 && employer >= 0) return { headerRowIdx: i, majorCol: major, employerCol: employer, authCol: auth };
  }
  return null;
}

function phaseFromSheetName(name: string): Phase | null {
  const n = name.toLowerCase();
  const hasCpt = /\bcpt\b/.test(n);
  const hasOpt = /\bopt\b/.test(n);
  if (hasCpt && !hasOpt) return 'cpt';
  if (hasOpt && !hasCpt) return 'opt';
  return null;
}
function phaseFromCell(v: unknown): Phase | null {
  const s = norm(v).toUpperCase();
  if (s === 'CPT') return 'cpt';
  if (s === 'OPT') return 'opt';
  return null;
}

type RawHire = { major: string; employer: string; phase: Phase };

function parseFile(filepath: string): { hires: RawHire[]; mtimeIso: string } {
  const wb = XLSX.readFile(filepath);
  const fname = path.basename(filepath);
  const out: RawHire[] = [];

  // 2018/2019 archives stack historical snapshots in extra sheets — only use the first.
  const sheetsToParse =
    /Spring2018|Spring2019/i.test(fname) ? wb.SheetNames.slice(0, 1) : wb.SheetNames;

  for (const sheetName of sheetsToParse) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    const hdr = findHeader(rows);
    if (!hdr) continue;
    let authCol = hdr.authCol;
    // Legacy files sometimes label the work-auth column as "Column1" or leave
    // it blank. If the sheet name doesn't pin a phase, sniff the data rows
    // for the first column that contains CPT/OPT values.
    const sheetPhase = phaseFromSheetName(sheetName);
    if (authCol < 0 && !sheetPhase) {
      const sample = rows.slice(hdr.headerRowIdx + 1, hdr.headerRowIdx + 31);
      const maxCols = sample.reduce((m, r) => Math.max(m, r.length), 0);
      for (let c = 0; c < maxCols; c++) {
        if (c === hdr.majorCol || c === hdr.employerCol) continue;
        let hits = 0;
        for (const r of sample) if (phaseFromCell((r ?? [])[c])) hits++;
        if (hits >= 3) { authCol = c; break; }
      }
    }
    for (let i = hdr.headerRowIdx + 1; i < rows.length; i++) {
      const r = rows[i] ?? [];
      const major = norm(r[hdr.majorCol]);
      const employer = norm(r[hdr.employerCol]);
      if (!major || !employer) continue;
      let phase: Phase | null = null;
      if (authCol >= 0) phase = phaseFromCell(r[authCol]);
      if (!phase) phase = sheetPhase;
      if (!phase) continue;
      out.push({ major, employer, phase });
    }
  }

  return { hires: out, mtimeIso: fs.statSync(filepath).mtime.toISOString() };
}

// ---- Build ----

const ACADEMIC_NAME_RE = /\bUniversity\b|\bInstitute of Technology\b|\bNational Laborator(y|ies)\b|\bNational Lab\b|\bPolytechnic\b|\bArgonne\b|\bNCSA\b/i;
const ACADEMIC_GOV_DOMAINS = new Set([
  'anl.gov',   // Argonne
  'lbl.gov',   // Lawrence Berkeley Lab
  'lanl.gov',  // Los Alamos
  'llnl.gov',  // Lawrence Livermore
  'ornl.gov',  // Oak Ridge
  'sandia.gov',
  'pnnl.gov',  // Pacific Northwest
  'bnl.gov',   // Brookhaven
  'fnal.gov',  // Fermilab
  'jlab.org',
  'nrel.gov',
  'nist.gov',
  'nasa.gov',
]);

function isAcademic(name: string, domain?: string): boolean {
  if (domain) {
    if (domain.endsWith('.edu')) return true;
    if (ACADEMIC_GOV_DOMAINS.has(domain.toLowerCase())) return true;
  }
  return ACADEMIC_NAME_RE.test(name);
}

function main() {
  const start = Date.now();
  const aliases = loadAliases();
  const domains = loadDomains();

  const inputs = listInputs();
  if (inputs.length === 0) {
    console.error('No xlsx inputs found under data/raw/');
    process.exit(1);
  }

  // Stable indices for terms (chronological), majors, employers
  const termsMap = new Map<string, { key: string; label: string; sortKey: number; mtime: string; cohorts: Set<Cohort> }>();
  const majorIndex = new Map<string, number>();
  const employerIndex = new Map<string, number>();
  const majorList: string[] = [];
  const employerList: string[] = [];

  type Event = [termIdx: number, cohortCode: number, phaseCode: number, majorIdx: number, employerIdx: number];
  const events: Event[] = [];

  const internMajor = (n: string) => {
    let i = majorIndex.get(n);
    if (i === undefined) { i = majorList.length; majorList.push(n); majorIndex.set(n, i); }
    return i;
  };
  const internEmployer = (n: string) => {
    let i = employerIndex.get(n);
    if (i === undefined) { i = employerList.length; employerList.push(n); employerIndex.set(n, i); }
    return i;
  };

  // First pass: gather term metadata
  for (const { term, cohort, file } of inputs) {
    if (!term) continue;
    const entry = termsMap.get(term.key) ?? {
      key: term.key,
      label: term.label,
      sortKey: term.sortKey,
      mtime: fs.statSync(file).mtime.toISOString(),
      cohorts: new Set<Cohort>(),
    };
    entry.cohorts.add(cohort);
    // Keep most recent mtime
    const m = fs.statSync(file).mtime.toISOString();
    if (m > entry.mtime) entry.mtime = m;
    termsMap.set(term.key, entry);
  }

  const termOrder = [...termsMap.values()].sort((a, b) => a.sortKey - b.sortKey);
  const termKeyToIdx = new Map(termOrder.map((t, i) => [t.key, i]));

  // Second pass: parse rows
  for (const { file, cohort, term } of inputs) {
    if (!term) continue;
    const { hires } = parseFile(file);
    const termIdx = termKeyToIdx.get(term.key)!;
    const cohortCode = cohort === 'ug' ? 0 : 1;
    for (const h of hires) {
      const major = h.major;
      const employerRaw = h.employer;
      const employer = aliases[employerRaw] ?? employerRaw;
      const phaseCode = h.phase === 'cpt' ? 0 : 1;
      events.push([termIdx, cohortCode, phaseCode, internMajor(major), internEmployer(employer)]);
    }
  }

  // Attach domains + classify academic employers.
  // The "academic" flag drives a UI toggle that lets students hide universities,
  // national labs, and other non-corporate sponsors when they're looking for
  // industry roles. It's intentionally conservative: domain-based detection (.edu /
  // anl.gov / specific national-lab domains) plus a narrow name-pattern allow-list.
  const employers = employerList.map((name) => {
    const e: { name: string; domain?: string; academic?: boolean } = { name };
    if (domains[name]) e.domain = domains[name];
    if (isAcademic(name, e.domain)) e.academic = true;
    return e;
  });

  const payload = {
    meta: {
      sourceUrl: 'https://www.careercenter.illinois.edu/international-students/companies',
      generatedAt: new Date().toISOString(),
    },
    terms: termOrder.map((t) => ({
      key: t.key,
      label: t.label,
      sortKey: t.sortKey,
      lastUpdated: t.mtime,
      cohorts: [...t.cohorts].sort(),
    })),
    majors: majorList,
    employers,
    // Events: each row [termIdx, cohortCode, phaseCode, majorIdx, employerIdx]
    events,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload));

  const elapsed = Date.now() - start;
  const bytes = fs.statSync(OUT).size;
  const gzip = require('node:zlib').gzipSync(JSON.stringify(payload));

  // ---- Summary ----
  console.log('\n=== build-data summary ===');
  console.log(`elapsed: ${elapsed} ms`);
  console.log(`events: ${events.length.toLocaleString()}`);
  const academicCount = employers.filter((e) => e.academic).length;
  const academicEvents = events.filter((ev) => employers[ev[4]].academic).length;
  console.log(`unique majors: ${majorList.length}, unique employers: ${employerList.length}`);
  console.log(`academic employers: ${academicCount} (${academicEvents.toLocaleString()} events, ${(100 * academicEvents / events.length).toFixed(1)}% of total)`);
  console.log(`output: ${path.relative(ROOT, OUT)}  raw=${(bytes / 1024).toFixed(1)} KB  gz=${(gzip.length / 1024).toFixed(1)} KB`);

  console.log('\nterm                events     ug_cpt  ug_opt  grad_cpt  grad_opt');
  for (const [tIdx, t] of termOrder.entries()) {
    const stats = [0, 0, 0, 0];
    let total = 0;
    for (const ev of events) {
      if (ev[0] !== tIdx) continue;
      total++;
      stats[ev[1] * 2 + ev[2]]++;
    }
    console.log(`  ${t.label.padEnd(15)}  ${String(total).padStart(5)}    ${String(stats[0]).padStart(5)}  ${String(stats[1]).padStart(5)}    ${String(stats[2]).padStart(5)}    ${String(stats[3]).padStart(5)}`);
  }

  // Top employers all-time
  const totals = new Map<number, number>();
  for (const ev of events) totals.set(ev[4], (totals.get(ev[4]) ?? 0) + 1);
  const top = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);
  console.log('\ntop 30 employers (all time):');
  for (const [idx, c] of top) {
    const e = employers[idx];
    console.log(`  ${String(c).padStart(4)}  ${e.name}${e.domain ? '' : '   (no domain)'}`);
  }
  const missing = top.filter(([idx]) => !employers[idx].domain);
  if (missing.length) {
    console.log('\n⚠ top-30 employers without domain (add to data/company-domains.json):');
    for (const [idx, c] of missing) console.log(`  ${String(c).padStart(4)}  ${employers[idx].name}`);
  } else {
    console.log('\n✓ all top-30 employers have domain mappings');
  }
  console.log('');
}

main();
