'use client';

import { CartesianGrid, Legend, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrendPoint } from '@/lib/trend';
import type { Phase, TermSelection } from '@/lib/types';

/**
 * Per-term line chart showing hire counts. Two phase lines (CPT, OPT) plus a
 * dimmed total line; whichever lines the active phase filter excludes are
 * hidden. A reference dot marks the currently-selected single term.
 */
export function TrendChart({
  data,
  phase,
  selectedTerm,
  height = 220,
}: {
  data: TrendPoint[];
  phase: Phase;
  selectedTerm: TermSelection;
  height?: number;
}) {
  const showCpt = phase === 'cpt' || phase === 'all';
  const showOpt = phase === 'opt' || phase === 'all';
  const showTotal = phase === 'all';

  const selected = selectedTerm !== 'all' ? data.find((p) => p.termKey === selectedTerm) : null;
  // If every value is 0, render an empty-state hint instead of an unreadable flat line.
  const hasAny = data.some((p) => p.total > 0);

  // Abbreviate axis ticks (10000 -> "10k") so the widest label fits the narrow
  // gutter; the raw 5-digit label was being clipped to "0000".
  const fmtAxis = (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`);

  return (
    <div style={{ width: '100%', height }} className="relative">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 6 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="short"
            stroke="var(--fg-subtle)"
            tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            stroke="var(--fg-subtle)"
            tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            width={34}
            allowDecimals={false}
            tickFormatter={fmtAxis}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '3 3' }}
            contentStyle={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: 12,
              color: 'var(--fg)',
            }}
            labelFormatter={(_, entries) => {
              const p = entries?.[0]?.payload as TrendPoint | undefined;
              return p?.label ?? '';
            }}
            formatter={(value: number, name: string) => [value.toLocaleString(), name]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={20}
            iconType="plainline"
            wrapperStyle={{ fontSize: 12, color: 'var(--fg-muted)', paddingBottom: 4 }}
          />
          {showTotal && (
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="var(--fg-subtle)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          )}
          {showCpt && (
            <Line
              type="monotone"
              dataKey="cpt"
              name="CPT"
              stroke="#0d9488"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#0d9488', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          )}
          {showOpt && (
            <Line
              type="monotone"
              dataKey="opt"
              name="OPT"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#8b5cf6', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          )}
          {selected && (
            <ReferenceDot
              x={selected.short}
              y={selected.total}
              r={6}
              fill="transparent"
              stroke="var(--accent)"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {!hasAny && (
        <div
          className="absolute inset-0 flex items-center justify-center text-[12.5px]"
          style={{ color: 'var(--fg-subtle)' }}
        >
          No matching hires in the selected filters.
        </div>
      )}
    </div>
  );
}
