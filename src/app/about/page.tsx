import Link from 'next/link';

export const metadata = {
  title: 'About · Who hires international students at UIUC',
  description: 'Methodology, data source, update cadence, and disclaimer for the UIUC CPT/OPT employer database.',
};

export default function About() {
  return (
    <div className="min-h-screen flex flex-col" style={{ color: 'var(--fg)' }}>
      <header className="sticky top-0 z-10 backdrop-blur" style={{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)', borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-[14px] font-medium hover:underline">← Back to explorer</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-8 space-y-6 flex-1">
        <h1 className="text-2xl font-bold tracking-tight">About this site</h1>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">What this is</h2>
          <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
            A static, searchable view of the publicly available <strong>UIUC Career Center CPT/OPT employer reports</strong>, covering 11 reporting terms from Spring 2018 through Spring 2026. The goal is to help international students at UIUC quickly answer: <em>which companies have hired people like me?</em>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Data source</h2>
          <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
            The data is sourced from spreadsheets published by the UIUC Career Center showing CPT and OPT authorizations granted to undergraduate and graduate students, listed by primary major and employer. The current term&rsquo;s files are linked directly from the Career Center website; older terms were recovered from public archived snapshots on the Internet Archive. Each row in the source data represents one work-authorization event, not necessarily a job offer or a current open role.
          </p>
          <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
            The Career Center&rsquo;s reports appear to be rolling cumulative snapshots — the same student&rsquo;s work-authorization event may appear in consecutive terms&rsquo; reports. The &ldquo;All time&rdquo; mode therefore over-counts very recent activity vs. truly distinct hire events; it&rsquo;s best read as a popularity signal, not an exact head-count.
          </p>
          <p className="text-[14px]">
            <a className="underline" href="https://www.careercenter.illinois.edu/international-students/companies" target="_blank" rel="noopener noreferrer">UIUC Career Center · Companies that have hired Illini with CPT/OPT →</a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Methodology</h2>
          <ul className="text-[14px] space-y-1 list-disc list-inside" style={{ color: 'var(--fg-muted)' }}>
            <li>Whitespace is trimmed and internal whitespace runs are collapsed.</li>
            <li>Obvious aliases are merged (e.g. &ldquo;Amazon Services&rdquo;, &ldquo;Amazon and its affiliates and subsidiaries&rdquo; → &ldquo;Amazon&rdquo;). The full alias list is in <code className="text-[12px]">data/aliases.yml</code> in the repo.</li>
            <li>Counts are aggregated by (cohort, phase, major, employer). Each row in the source is one hire event.</li>
            <li>Logos are fetched at view time from Logo.dev or Google&rsquo;s favicon service. If neither returns an image, an initials badge is shown.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Update cadence</h2>
          <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
            The site is rebuilt manually each semester when the Career Center publishes new reports. See the repo README for the update procedure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Corrections</h2>
          <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
            Spot a bad alias merge or a missing logo? Open an issue on GitHub or email the address in the repo README.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Disclaimer</h2>
          <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
            This site is <strong>not affiliated with, endorsed by, or sponsored by the University of Illinois Urbana-Champaign</strong>. The University of Illinois name, logo, and trademarks belong to the University. Data is aggregated from publicly available reports; hiring practices change, and inclusion of a company here is not a guarantee that the company currently sponsors visas or hires international students. Always verify with the employer before applying.
          </p>
        </section>
      </main>
    </div>
  );
}
