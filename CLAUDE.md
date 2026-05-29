# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static, client-only Next.js 15 (App Router) site that visualises UIUC Career Center CPT/OPT reports across 11 terms (Spring 2018 – Spring 2026, ~60k hire events, ~12.6k unique employers). Not affiliated with UIUC. See [README.md](README.md) and [DISCLAIMER.md](DISCLAIMER.md) for context and update procedure.

## Common commands

```bash
pnpm install          # one-time
pnpm build:data       # parse data/raw/**/*.xlsx → public/data.json (≈1 s)
pnpm dev              # http://localhost:3000 (or :3001 if 3000 busy)
pnpm build            # produces ./out (Cloudflare Pages-ready static export)
pnpm start            # serves ./out via `npx serve` for prod smoke

pnpm exec tsc --noEmit                    # typecheck only
pnpm exec tsx scripts/suggest-aliases.ts --min-count 3   # near-duplicate employer report
pnpm exec tsx scripts/build-data.ts       # equivalent to `build:data`
```

`pnpm dev`/`build` first run `next build` which triggers `pnpm install` integrity check; we disable it via [.npmrc](.npmrc) (`verify-deps-before-run=false`, `strict-dep-builds=false`). If pnpm refuses to run scripts because of ignored builds (esbuild/sharp), re-run `pnpm config set strict-dep-builds false` once at user level.

No test suite exists yet. Sanity checks are done by running standalone `tsx` scripts against `public/data.json` (see "Verifying logic" below).

## High-level architecture

### Data pipeline (`scripts/build-data.ts`)

Every `.xlsx` under `data/raw/` and `data/raw/historical/` is auto-discovered. The cohort (UG/Grad) and term ("Spring 2024" etc.) are extracted from the filename via regex. **The Career Center has used four different sheet layouts over the years**; the parser handles all of them:

1. **Modern (Fall 2023+)**: two sheets per file — `CPT by Major` and `OPT by Major` — with columns `Primary_Major | Employer_Name [| City | State]`. Phase derived from sheet name.
2. **Legacy single-sheet w/ `Work Authorization` column** (Spring 2020 / 2021 / Fall 2021 / 2022 / Spring 2024): one combined sheet, phase from per-row cell value.
3. **Legacy w/ column header `Column1`** (Spring 2020 UG): same as above but the auth column header is wrong; parser sniffs data rows for CPT/OPT values to infer the column index.
4. **Legacy multi-sheet stacked snapshots** (Spring 2018 / 2019): historical snapshots overlap with newer files → only the first sheet of these files is used.

Output is a compact events JSON (`public/data.json`), not a per-term × per-cohort × per-phase nested map:

```ts
type RawData = {
  meta: { sourceUrl, generatedAt },
  terms: Array<{ key, label, sortKey, lastUpdated, cohorts }>,
  majors: string[],                                   // intern table
  employers: Array<{ name, domain?, academic? }>,     // intern table
  events: Array<[termIdx, cohortCode, phaseCode, majorIdx, employerIdx]>
};
```

This format is ~10× smaller than denormalized buckets for 60k events × 11 terms. The client aggregates on demand (see `src/lib/aggregate.ts`) — fast enough (<10 ms for 60k events) to recompute on every filter change.

### Curation files

- **[data/aliases.yml](data/aliases.yml)** — raw employer name → canonical name. `loadAliases()` in `build-data.ts` **chain-resolves** A→B→C so multiple aliases can compose. Cycle protection via `seen` set; cycles between e.g. `"Bloomberg LP" → Bloomberg` and `Bloomberg → Bloomberg LP` need to be hand-broken (`scripts/suggest-aliases.ts`'s output assumes one direction).
- **[data/company-domains.json](data/company-domains.json)** — canonical employer name → domain. Drives the logo system. Top-100 employers have 100% coverage, top-500 ~93%.
- **[scripts/suggest-aliases.ts](scripts/suggest-aliases.ts)** — clusters near-duplicate employer names via case-folded + suffix-stripped + token-set equality, emits ready-to-paste yaml. Run after adding a new term's xlsx; review and append to `aliases.yml`.

### Academic-employer flag

`isAcademic(name, domain)` in `build-data.ts` tags each employer at build time:
- domain ends in `.edu`
- domain is in a curated `.gov` whitelist (`anl.gov`, `lbl.gov`, `lanl.gov`, `llnl.gov`, `ornl.gov`, …)
- name matches `/\bUniversity\b|\bInstitute of Technology\b|\bNational Laborator(y|ies)\b|\bArgonne\b|\bNCSA\b/i`

The "🎓 Hide academic" top-bar toggle uses this flag. UIUC itself, NCSA, Board of Trustees, national labs, peer universities all get hidden when on. ~10% of events fall under this.

### Client architecture

**URL hash is the single source of truth** for UI state ([src/lib/url-state.ts](src/lib/url-state.ts)). The state object has `term`, `cohort` (`'ug' | 'grad' | 'all'`), `phase` (`'cpt' | 'opt' | 'all'`), `view`, `q`, `pick`, `hideAcademic`. Every interaction goes through `update(patch)` which serialises back to the hash via `history.replaceState`. This makes every state shareable.

**Aggregation happens at render-time** ([src/lib/aggregate.ts](src/lib/aggregate.ts), [src/lib/trend.ts](src/lib/trend.ts)). Two functions walk the events array once, filter by `(term, cohort, phase, hideAcademic[, pickMajor, pickEmployer])`, and emit either:
- `{ majors, employers }` bucket maps for the list views, or
- A per-term `TrendPoint[]` for the line chart.

Both use `Uint8Array` lookup tables for "is this employer academic" so the inner loop is tight.

**Cohort sums**: `cohort: 'all'` skips the cohort filter entirely; `phase: 'all'` masks both CPT and OPT. Sanity identity: `aggregate(ug) + aggregate(grad) = aggregate(all)` for every (term, phase). Verified via standalone scripts.

### Visual components worth knowing about

- **[CompanyLogo.tsx](src/components/CompanyLogo.tsx)** — 3-stage fallback: Logo.dev → Google s2 favicons → either initials badge OR full-name text (when `fallbackText` prop is set, used by the hero carousel). Module-scope `failed` set caches stage-failures so re-renders skip straight to the working stage. `onLoad` detects Google's 16×16 globe placeholder via `naturalWidth ≤ 16` and falls through.
- **[HeroStrip.tsx](src/components/HeroStrip.tsx)** — top-50 sponsors carousel. **JS rAF-driven**, not CSS keyframe — the auto-scroll, arrow nudges, and seamless wrap-around all compose in a single `x` ref that's `mod copyWidth` every frame. CSS keyframes can't wrap so they were abandoned. `ResizeObserver` re-measures the copy width when filters change. Pause on hover, respects `prefers-reduced-motion`.
- **[TrendChart.tsx](src/components/TrendChart.tsx)** + **[TrendPanel.tsx](src/components/TrendPanel.tsx)** — Recharts multi-line per-term chart, dynamic-imported so recharts only ships when needed. Lines for CPT / OPT / Total. Reacts to the same top-bar filters; if `pick` is set, narrows to that major or employer.
- **[DonutMini.tsx](src/components/DonutMini.tsx)** — inside expanded list rows. Top 8 + "Other" slice, with a logo legend.

### data.json cache busting

Schema can change between deploys. [next.config.mjs](next.config.mjs) injects `NEXT_PUBLIC_BUILD_TIME` at build time; [src/lib/data-fetch.ts](src/lib/data-fetch.ts) appends `data.json?v=<ISO>` to the fetch URL. Browsers reload it cleanly across deploys. Don't reintroduce `cache: 'force-cache'`.

## Working with the data

Updating data each semester (full instructions in [README.md](README.md#updating-data-each-semester)):

1. Drop the new xlsx into `data/raw/` (filename must include cohort + season + year).
2. `pnpm build:data` — prints per-term breakdown and any top-30 employer missing a domain.
3. `pnpm exec tsx scripts/suggest-aliases.ts --min-count 3` — append vetted clusters to `data/aliases.yml`.
4. Add missing domains to `data/company-domains.json`.
5. Re-run `pnpm build:data`; warning list should shrink.

Verifying aggregation logic (no test harness — use ad-hoc `tsx` scripts):

```ts
// /tmp/check.ts
import data from './public/data.json';
import { aggregate } from './src/lib/aggregate.ts';
const r = aggregate(data as any, 'all', 'all', 'all', false);
// inspect r.majors / r.employers
```

Run with `pnpm exec tsx /tmp/check.ts`.

## Pinned dependencies — why

[package.json](package.json) pins exact versions (no `^`) and prefers betas / RCs:

- **`next@15.0.3` + `react@19.0.0-rc`**: matched to a specific Next 15 build that paired with this RC; upgrading either alone has broken types in the past.
- **`tailwindcss@4.0.0-beta.3` + `@tailwindcss/postcss`**: Tailwind 4 syntax + CSS variables theme.
- **`recharts@2.13.3`**: 3.x changed types. Keep on 2.x for now.

If you bump any of these, expect to touch styles or type signatures.

## Static export caveats

`next.config.mjs` sets `output: 'export'` + `trailingSlash: true` + `images.unoptimized: true`. Implications:
- `pnpm start` cannot be `next start`; we use `npx serve out` to serve the static export.
- No middleware, no API routes, no `next/image` optimization.
- `cache: 'force-cache'` does the wrong thing here — use the build-time-version query string instead.

## Deploy

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds on push to main and deploys `out/` to Cloudflare Pages. Required secrets: `LOGODEV_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Required vars: `PLAUSIBLE_DOMAIN`, `CLOUDFLARE_PROJECT_NAME`.

## Things to keep in mind

- The Career Center reports are **rolling cumulative snapshots**, so an event can appear across consecutive terms. "All time" mode therefore over-counts very recent activity. Disclaimer surfaces this; don't claim higher precision than the source data supports.
- Source data has **no per-student identifier** — deduping across terms is impossible by design.
- Never use UIUC orange (`#E84A27`) or UIUC blue (`#13294B`) in styling (trademark concern). Accent is `teal-600` / `teal-400`.
- "Industry only" toggle defaults off; flipping it removes ~10% of events. Always re-test changes with both states.
