# Who hires international students at UIUC

A static, fast, search-first explorer of the publicly available UIUC Career Center **CPT / OPT employer reports**. Covers **11 reporting terms (Spring 2018 – Spring 2026)** with ~60 k hire events across ~14 k unique employers. Helps international students answer:

- *I'm in major X — which companies sponsor people like me?*
- *I'm interested in company Y — do they hire international students, and for what majors?*
- *Which companies sponsor consistently across years, not just this semester?*

Filter by term (or pick **All time** for the cumulative view), cohort (UG / Grad), and phase (CPT / OPT / All).

**Not affiliated with the University of Illinois.** Current-term files come straight from the Career Center; older terms were recovered from public Internet Archive snapshots. See [DISCLAIMER.md](./DISCLAIMER.md).

## Stack

- Next.js 15 (App Router) + TypeScript, static export (`output: 'export'`).
- Tailwind CSS 4, `clsx`, CSS variables for theming.
- `fuse.js` fuzzy search.
- `recharts` (lazy-loaded) for in-row bar charts.
- `xlsx` (build-time only) for parsing the source spreadsheets.
- Plausible analytics (cookie-free, optional via env var).
- Cloudflare Pages hosting.

## Repo layout

```
data/raw/                  # input .xlsx — gitignored (see "Getting the data" below)
data/aliases.yml           # employer alias merge rules
data/company-domains.json  # employer → domain map for logos
scripts/build-data.ts      # xlsx → normalized data.json (build-time)
public/data.json           # generated, gitignored
src/app/                   # routes (App Router)
src/components/            # UI
src/lib/                   # data helpers, fuse, theme, url-state
src/styles/globals.css
```

## Getting the data

The source `.xlsx` files are copyright University of Illinois Career Center and are not redistributed in this repo. You need to obtain them before running `build:data`.

**Current term** — download directly from the [UIUC Career Center employer reports page](https://go.illinois.edu/CPTOPTreport) and drop both files into `data/raw/`. Filenames must include the cohort (`Undergrad` / `Graduate`) and the term (`Spring 2026`, etc.).

**Historical terms (Spring 2018 – Spring 2025)** — archived snapshots are available via the [Wayback Machine](https://web.archive.org/web/*/https://go.illinois.edu/CPTOPTreport). Save each file into `data/raw/historical/` using the same naming convention.

## Local dev

Requires Node 20+ and pnpm 9+.

```bash
pnpm install
# Place .xlsx files under data/raw/ (see "Getting the data" above)
pnpm build:data    # parses xlsx → public/data.json
pnpm dev           # http://localhost:3000
```

Optional environment variables (`.env.local`):

```
NEXT_PUBLIC_LOGODEV_TOKEN=...        # better company logos via logo.dev
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=...     # enables Plausible analytics
NEXT_PUBLIC_REPO_URL=https://...     # shown in footer
```

Without a `LOGODEV_TOKEN`, logos fall back to Google's S2 favicons, then to a deterministic initials badge — the site still works.

## Updating data each semester

The pipeline auto-discovers every `.xlsx` under `data/raw/` and `data/raw/historical/`. To add a new term:

1. Download the two new spreadsheets from the UIUC Career Center and drop them in `data/raw/` (the current term's two files live there; the back-catalog lives in `data/raw/historical/`). The filenames must contain the cohort (`Undergrad` / `Graduate`) and the term (`Spring 2026`, `Fall 2023`, `Summer 2024`, …) — the script extracts both via regex.
2. `pnpm build:data`. The script prints:
   - Total hire events and unique major/employer counts.
   - Per-term breakdown across the four (cohort × phase) buckets.
   - The top 30 employers all-time, with any missing domain mappings flagged.
3. Review the warning list:
   - Edit `data/aliases.yml` to merge name variants of the same company (e.g. *"Tesla Inc"* → *Tesla*).
   - Add the canonical name to `data/company-domains.json` with the correct domain.
4. Re-run `pnpm build:data` and confirm the warnings shrink.
5. Commit edits to `aliases.yml` and `company-domains.json`. **Don't** commit `public/data.json` or the `.xlsx` files — both are gitignored.

### Supported xlsx layouts

The parser handles three legacy + one modern format the Career Center has used over the years:

| Layout                                        | Used by terms                                  | Phase derived from        |
| --------------------------------------------- | ---------------------------------------------- | ------------------------- |
| Modern: separate `CPT` / `OPT` sheets         | Fall 2023, Summer 2024, Spring 2025, Spring 2026 | Sheet name                |
| Legacy single-sheet w/ `Work Authorization` col | Spring 2020, Spring 2021, Fall 2021, Fall 2022, Spring 2024 | Per-row column            |
| Legacy single-sheet w/ column header `Column1` | Spring 2020 UG                                 | Inferred by scanning data |
| Legacy multi-sheet (historical snapshots stacked) | Spring 2018, Spring 2019                     | First sheet only (rest discarded as duplicate) |

## Deploy

The included `.github/workflows/deploy.yml` builds on `push` to `main` and ships `out/` to Cloudflare Pages. Required repository secrets:

| Secret                       | What                                           |
| ---------------------------- | ---------------------------------------------- |
| `LOGODEV_TOKEN`              | Publishable token from logo.dev (optional)     |
| `CLOUDFLARE_API_TOKEN`       | Cloudflare API token with Pages edit scope     |
| `CLOUDFLARE_ACCOUNT_ID`      | Your Cloudflare account ID                     |

Repository variables: `PLAUSIBLE_DOMAIN`, `CLOUDFLARE_PROJECT_NAME`.

Manual deploy:

```bash
pnpm install
pnpm build:data
pnpm build         # produces ./out
# upload ./out to any static host
```

## Acceptance checklist

- [x] `pnpm install && pnpm build:data && pnpm build && pnpm start` produces a working site locally.
- [x] Cohort + phase filters work; URL hash syncs both ways.
- [x] Search "tesla" finds Tesla; "comp sci" fuzzy-matches Computer Science.
- [x] Clicking an employer in the By-major view jumps to By-employer with that employer pre-expanded (and vice versa).
- [x] Top-50 employers (by total hires) render real logos; the long tail falls back to initials.
- [x] Dark mode works; preference persists in localStorage.
- [x] Mobile-first; tested at 360 px.
- [x] Static export — `output: 'export'`, no server runtime required.
- [x] Bundle: initial JS **~124 KB** First Load (under the 150 KB target).
- [x] `public/data.json`: ~1.4 MB raw, **~291 KB gzipped** for 11 terms / 60 k events / 14 k employers. Stored as a flat event list `[termIdx, cohort, phase, majorIdx, employerIdx]` plus string intern tables, then aggregated on the fly in the browser. A single-term denormalized shape would have been ~10× larger.

## Known follow-ups

- `public/og.png` (1200×630) for richer social previews — currently omitted; layout has no `og:image` tag, so links unfurl as text.
- Logo.dev free tier requires a publishable token; without it the site uses Google's S2 favicon service, which is lower-resolution but never 404s.
- The Career Center's reports are rolling cumulative snapshots, so "All time" overcounts events that appear in multiple consecutive terms. There is no way to dedupe without per-student identifiers (intentionally excluded from the source data).

## License & attribution

Source data © University of Illinois Career Center. This site is an independent, non-affiliated re-presentation of that data for the benefit of international students. The University of Illinois name and logo are trademarks of the University.

Site code: MIT.
