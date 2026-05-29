'use client';

import clsx from 'clsx';
import type { View } from '@/lib/types';

export function ViewTabs({
  view,
  counts,
  onChange,
}: {
  view: View;
  counts: { major: number; employer: number };
  onChange: (v: View) => void;
}) {
  const tab = (v: View, label: string, count: number) => {
    const active = v === view;
    return (
      <button
        key={v}
        role="tab"
        aria-selected={active}
        onClick={() => onChange(v)}
        className={clsx('relative pb-2 pt-1 px-1 text-[14px] font-medium')}
        style={{ color: active ? 'var(--fg)' : 'var(--fg-muted)' }}
      >
        {label}
        <span className="ml-1.5 text-[12px] num" style={{ color: 'var(--fg-subtle)' }}>{count}</span>
        {active && (
          <span
            aria-hidden
            className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full"
            style={{ background: 'var(--accent)' }}
          />
        )}
      </button>
    );
  };
  return (
    <div role="tablist" className="flex items-end gap-6 border-b" style={{ borderColor: 'var(--border)' }}>
      {tab('major', 'By major', counts.major)}
      {tab('employer', 'By employer', counts.employer)}
    </div>
  );
}
