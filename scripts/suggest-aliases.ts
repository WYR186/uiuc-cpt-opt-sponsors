/**
 * Cluster near-duplicate employer names so we can grow data/aliases.yml.
 *
 * Heuristics (in order, most → least confident):
 *   1. Exact match after case-folding + corporate-suffix stripping
 *      ("Tesla Inc.", "TESLA INC", "Tesla, Inc" → "tesla").
 *   2. Exact match after additionally stripping punctuation / common
 *      legal suffixes (Co, Corp, LLC, LP, LLP, plc, GmbH, etc.).
 *   3. Token-set equality: ignore order ("Goldman Sachs Group" ≈ "The
 *      Goldman Sachs Group").
 *
 * For each cluster we pick a canonical name (shortest already-canonical
 * employer if domains.json has it, else the highest-count member) and
 * print a yaml snippet ready to paste into aliases.yml.
 *
 * Run with: pnpm exec tsx scripts/suggest-aliases.ts
 *           [optional: --min-count N    (default 3)]
 *           [optional: --canonical-min M (default 0)]
 */
import fs from 'node:fs';
import path from 'node:path';

type RawData = {
  employers: Array<{ name: string; domain?: string }>;
  events: Array<[number, number, number, number, number]>;
};

const DATA_PATH = path.resolve('public/data.json');
const DOMAINS_PATH = path.resolve('data/company-domains.json');
const ALIASES_PATH = path.resolve('data/aliases.yml');

const SUFFIXES = [
  // Order matters: longer phrases first so they strip cleanly.
  'and its affiliates and subsidiaries',
  'and its subsidiaries and affiliates',
  'and its affiliates',
  'and its subsidiaries',
  'its affiliates and subsidiaries',
  'a delaware corporation',
  'global services',
  'worldwide services',
  'web services',
  'data center',
  'data centers',
  'development center',
  'development center us',
  'usa',
  'us',
  'inc',
  'incorporated',
  'corp',
  'corporation',
  'company',
  'co',
  'co ltd',
  'ltd',
  'limited',
  'llc',
  'llp',
  'lp',
  'plc',
  'pllc',
  'gmbh',
  'ag',
  'sa',
  'group',
  'holdings',
  'holding',
  'technologies',
  'technology',
  'tech',
  'solutions',
  'services',
  'systems',
  'enterprises',
  'enterprise',
  'industries',
  'international',
  'global',
  'na',
  'north america',
  'americas',
  'america',
];

function stripSuffixes(s: string): string {
  let cur = ' ' + s + ' ';
  let changed = true;
  while (changed) {
    changed = false;
    for (const suf of SUFFIXES) {
      const re = new RegExp(`\\s${suf}\\b\\s*$`, 'i');
      if (re.test(cur)) {
        cur = cur.replace(re, '');
        changed = true;
      }
    }
  }
  return cur.trim();
}

function normalize(s: string): string {
  return s
    .replace(/[.,'"()&]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/-/g, ' ')
    .toLowerCase()
    .trim();
}

function tokenSet(s: string): string {
  return [...new Set(normalize(s).split(/\s+/))].sort().join(' ');
}

function key(s: string): string {
  return normalize(stripSuffixes(normalize(s)));
}
function tokenKey(s: string): string {
  return tokenSet(stripSuffixes(normalize(s)));
}

function loadExistingAliases(): Set<string> {
  // Don't parse YAML — we just want the set of LHS keys already covered.
  if (!fs.existsSync(ALIASES_PATH)) return new Set();
  const raw = fs.readFileSync(ALIASES_PATH, 'utf8');
  const out = new Set<string>();
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*"([^"]+)"\s*:/);
    if (m) out.add(m[1]);
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const minCount = Number(args[args.indexOf('--min-count') + 1]) || 3;
  const canonicalMin = Number(args[args.indexOf('--canonical-min') + 1]) || 0;

  const data: RawData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const domains: Record<string, string> = JSON.parse(fs.readFileSync(DOMAINS_PATH, 'utf8'));
  const existingAliases = loadExistingAliases();

  // Total occurrences per employer
  const totals = new Map<number, number>();
  for (const ev of data.events) totals.set(ev[4], (totals.get(ev[4]) ?? 0) + 1);

  // Cluster: first by stripped exact, then by token-set
  const byKey = new Map<string, number[]>();
  const byTokenKey = new Map<string, number[]>();
  for (let i = 0; i < data.employers.length; i++) {
    const name = data.employers[i].name;
    const k = key(name);
    const tk = tokenKey(name);
    if (k.length < 3) continue;
    (byKey.get(k) ?? byKey.set(k, []).get(k)!).push(i);
    (byTokenKey.get(tk) ?? byTokenKey.set(tk, []).get(tk)!).push(i);
  }

  // Merge token clusters into key clusters where they don't overlap
  const seen = new Set<number>();
  const clusters: number[][] = [];
  for (const indices of byKey.values()) {
    if (indices.length < 2) continue;
    const c = indices.filter((i) => !seen.has(i));
    if (c.length >= 2) { c.forEach((i) => seen.add(i)); clusters.push(c); }
  }
  for (const indices of byTokenKey.values()) {
    if (indices.length < 2) continue;
    const c = indices.filter((i) => !seen.has(i));
    if (c.length >= 2) { c.forEach((i) => seen.add(i)); clusters.push(c); }
  }

  // Score each cluster, pick canonical, print suggestion
  type Suggestion = { canonical: string; members: Array<{ name: string; count: number }>; totalCount: number };
  const suggestions: Suggestion[] = [];

  for (const cluster of clusters) {
    const members = cluster
      .map((i) => ({ name: data.employers[i].name, count: totals.get(i) ?? 0 }))
      .sort((a, b) => b.count - a.count);
    const totalCount = members.reduce((s, m) => s + m.count, 0);
    if (totalCount < minCount) continue;

    // Pick canonical:
    //   1) member that already has a domain mapping in company-domains.json
    //   2) member already used as RHS in aliases.yml
    //   3) shortest name with the highest count
    const withDomain = members.find((m) => domains[m.name]);
    const canonical =
      withDomain?.name ??
      [...members].sort((a, b) => b.count - a.count || a.name.length - b.name.length)[0].name;

    // Skip cluster if every member is already aliased to the same canonical
    const allAliased = members.every((m) => m.name === canonical || existingAliases.has(m.name));
    if (allAliased) continue;
    if (members.find((m) => m.count >= canonicalMin && m.name === canonical) === undefined && canonicalMin > 0) continue;

    suggestions.push({ canonical, members, totalCount });
  }

  suggestions.sort((a, b) => b.totalCount - a.totalCount);

  // Emit
  console.log(`\n# ${suggestions.length} candidate alias clusters (totals ≥ ${minCount})\n`);
  for (const s of suggestions) {
    console.log(`# total ${s.totalCount}  ${s.canonical}`);
    for (const m of s.members) {
      if (m.name === s.canonical) {
        console.log(`#   ← ${m.name}  (${m.count})  [canonical]`);
      } else if (existingAliases.has(m.name)) {
        console.log(`#   ✓ "${m.name}"  (${m.count})  already aliased`);
      } else {
        console.log(`"${m.name}": ${needsQuote(s.canonical) ? `"${s.canonical}"` : s.canonical}  # ${m.count}`);
      }
    }
    console.log('');
  }
}

function needsQuote(s: string): boolean {
  return /[:#&*!|>'"%@`]/.test(s) || s.startsWith(' ') || s.endsWith(' ');
}

main();
