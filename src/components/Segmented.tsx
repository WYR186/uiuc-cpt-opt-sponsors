'use client';

import clsx from 'clsx';

type Option<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-md p-0.5"
      style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)' }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'px-3 h-8 text-[13px] font-medium rounded-[5px] transition-colors min-w-[64px]',
            )}
            style={{
              background: selected ? 'var(--accent)' : 'transparent',
              color: selected ? 'var(--accent-fg)' : 'var(--fg-muted)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
