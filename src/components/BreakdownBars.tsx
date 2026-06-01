'use client';

import type { ReactNode } from 'react';

type Row = { name: string; count: number };

const TOP_N = 8;

/**
 * Ranked horizontal-bar breakdown.
 *
 * Replaces an earlier donut: for the long-tail distributions in this data
 * (e.g. a popular major's employers) a pie collapses into one dominant grey
 * "Other" wedge and conveys almost nothing. A ranked bar list keeps the top
 * entries individually comparable — each bar's width is relative to the #1
 * entry — and states each entry's share of the whole, while the long tail is
 * folded into a single muted "Other" line instead of swallowing the chart.
 */
export function BreakdownBars({
  rows,
  onPick,
  renderLegendItem,
}: {
  rows: Row[];
  onPick: (name: string) => void;
  renderLegendItem: (row: Row, color?: string) => ReactNode;
}) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const top = rows.slice(0, TOP_N);
  const rest = rows.slice(TOP_N);
  const restTotal = rest.reduce((s, r) => s + r.count, 0);
  const max = top.length ? top[0].count : 0;

  if (!total) return null;

  return (
    <div className="space-y-2">
      <div className="text-[12px]" style={{ color: 'var(--fg-subtle)' }}>
        <span className="num tabular-nums" style={{ color: 'var(--fg-muted)' }}>
          {total.toLocaleString()}
        </span>{' '}
        total
        {rows.length > top.length && <> · top {top.length} of {rows.length.toLocaleString()}</>}
      </div>

      <ul className="space-y-0.5">
        {top.map((r) => {
          const pct = total ? (r.count / total) * 100 : 0;
          const w = max ? Math.max(3, (r.count / max) * 100) : 0;
          return (
            <li key={r.name}>
              <button
                onClick={() => onPick(r.name)}
                title={`${r.name} · ${r.count.toLocaleString()} (${pct.toFixed(1)}%)`}
                className="relative w-full flex items-center gap-2 px-2 py-1.5 rounded text-left overflow-hidden transition-colors hover:bg-[var(--bg)]"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0.5 left-0 rounded-sm pointer-events-none"
                  style={{ width: `${w}%`, background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
                />
                <span className="relative min-w-0 flex-1 text-[12.5px]">
                  {renderLegendItem({ name: r.name, count: r.count })}
                </span>
                <span
                  className="relative num text-[12px] tabular-nums shrink-0"
                  style={{ color: 'var(--fg-muted)' }}
                >
                  {r.count.toLocaleString()}
                </span>
                <span
                  className="relative num text-[11px] tabular-nums shrink-0 w-12 text-right"
                  style={{ color: 'var(--fg-subtle)' }}
                >
                  {pct.toFixed(1)}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {restTotal > 0 && (
        <div
          className="flex items-center gap-2 px-2 py-1.5 text-[12.5px]"
          style={{ color: 'var(--fg-subtle)', borderTop: '1px solid var(--border)' }}
        >
          <span className="flex-1 min-w-0 truncate">Other ({rest.length.toLocaleString()})</span>
          <span className="num text-[12px] tabular-nums shrink-0">{restTotal.toLocaleString()}</span>
          <span className="num text-[11px] tabular-nums shrink-0 w-12 text-right">
            {((restTotal / total) * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
