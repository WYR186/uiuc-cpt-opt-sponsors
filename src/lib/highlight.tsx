import type { ReactNode } from 'react';

/**
 * Render `text` with case-insensitive substrings of `query` wrapped in <mark>.
 * Splits on the literal query — fuse.js indices would be ideal but querying
 * fuse for every item we render is wasteful when the query is a plain prefix.
 */
export function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={idx} className="match">{text.slice(idx, idx + needle.length)}</mark>,
    );
    i = idx + needle.length;
  }
  return <>{parts}</>;
}
