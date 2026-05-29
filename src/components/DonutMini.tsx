'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ReactNode } from 'react';

type Row = { name: string; count: number };

const PALETTE = [
  '#0d9488', // teal-600
  '#0ea5e9', // sky-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
];
const OTHER_COLOR = '#94a3b8'; // slate-400

const TOP_N = 8;

/**
 * Donut chart with a logo-aware legend.
 *
 * Why donut over pure pie:
 *   - The hollow center makes room for the total — answering "out of how many?"
 *     before the user reads any slice.
 *   - The same number of pixels at higher angular resolution near the rim,
 *     so adjacent thin slices stay legible.
 *
 * Top 8 rows get individual slices; everything else is bucketed into "Other"
 * to keep the chart readable. The legend still lets you click any of the
 * top 8 to cross-jump.
 */
export function DonutMini({
  rows,
  onPick,
  renderLegendItem,
}: {
  rows: Row[];
  onPick: (name: string) => void;
  renderLegendItem: (row: Row, color: string) => ReactNode;
}) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const top = rows.slice(0, TOP_N);
  const rest = rows.slice(TOP_N);
  const restTotal = rest.reduce((s, r) => s + r.count, 0);

  const slices: Array<{ name: string; count: number; color: string; isOther: boolean }> = top.map(
    (r, i) => ({ name: r.name, count: r.count, color: PALETTE[i % PALETTE.length], isOther: false }),
  );
  if (restTotal > 0) {
    slices.push({
      name: `Other (${rest.length})`,
      count: restTotal,
      color: OTHER_COLOR,
      isOther: true,
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-[200px_1fr] items-center">
      <div className="relative mx-auto md:mx-0" style={{ width: 200, height: 200 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={1.5}
              stroke="var(--bg-elev)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell
                  key={s.name}
                  fill={s.color}
                  cursor={s.isOther ? 'default' : 'pointer'}
                  onClick={() => { if (!s.isOther) onPick(s.name); }}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 12,
                color: 'var(--fg)',
              }}
              formatter={(v: number, _name, item) => {
                const pct = total ? ((v / total) * 100).toFixed(1) : '0';
                return [`${v} (${pct}%)`, (item as { name?: string })?.name ?? ''];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[20px] font-semibold num leading-none" style={{ color: 'var(--fg)' }}>
            {total}
          </span>
          <span className="text-[11px] mt-1" style={{ color: 'var(--fg-subtle)' }}>
            total hires
          </span>
        </div>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-1.5">
        {slices.map((s) => {
          const pct = total ? (s.count / total) * 100 : 0;
          const interactive = !s.isOther;
          const Tag = interactive ? 'button' : 'div';
          return (
            <li key={s.name}>
              <Tag
                onClick={interactive ? () => onPick(s.name) : undefined}
                className={
                  'w-full flex items-center gap-2 text-left rounded px-1.5 py-1 ' +
                  (interactive ? 'hover:bg-[var(--bg)] cursor-pointer' : '')
                }
              >
                <span
                  aria-hidden
                  className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: s.color }}
                />
                {s.isOther ? (
                  <span className="text-[12.5px] flex-1 truncate" style={{ color: 'var(--fg-muted)' }}>
                    {s.name}
                  </span>
                ) : (
                  <span className="text-[12.5px] flex-1 min-w-0">
                    {renderLegendItem({ name: s.name, count: s.count }, s.color)}
                  </span>
                )}
                <span className="num text-[12px] tabular-nums shrink-0" style={{ color: 'var(--fg-muted)' }}>
                  {s.count}
                </span>
                <span className="num text-[11px] tabular-nums shrink-0 w-10 text-right" style={{ color: 'var(--fg-subtle)' }}>
                  {pct.toFixed(1)}%
                </span>
              </Tag>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
