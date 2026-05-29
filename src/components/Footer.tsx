import Link from 'next/link';
import { Github } from 'lucide-react';
import type { Term } from '@/lib/types';

export function Footer({
  terms,
  sourceUrl,
}: {
  terms: Term[];
  sourceUrl: string;
}) {
  const repo = process.env.NEXT_PUBLIC_REPO_URL || 'https://github.com/';
  const range = terms.length
    ? (() => {
        const sorted = [...terms].sort((a, b) => a.sortKey - b.sortKey);
        const last = sorted[sorted.length - 1];
        return sorted.length > 1 ? `${sorted[0].label} – ${last.label}` : last.label;
      })()
    : '—';
  return (
    <footer
      className="mt-8"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elev)' }}
    >
      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px]" style={{ color: 'var(--fg-muted)' }}>
        <a className="hover:underline" href={sourceUrl} target="_blank" rel="noopener noreferrer">
          Source: UIUC Career Center
        </a>
        <span>Coverage: <span className="num">{range}</span></span>
        <Link className="hover:underline" href="/about/">About</Link>
        <a className="ml-auto inline-flex items-center gap-1.5 hover:underline" href={repo} target="_blank" rel="noopener noreferrer">
          <Github size={13} /> Repo
        </a>
      </div>
    </footer>
  );
}
