'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { colorFor, initialsOf } from '@/lib/logo-color';

type Stage = 'logodev' | 'gfavicon' | 'initials';

/**
 * Logo with a 3-stage fallback chain: Logo.dev → Google s2 favicons → text.
 *
 * Why a Set of failed (stage, domain) pairs lives in module scope:
 *   - When the user scrolls back to a row, we already know that stage failed;
 *     starting from stage 1 again would flash a broken image. Skipping straight
 *     to the working fallback keeps the UI calm.
 *
 * `fallbackText` swaps the final initials badge for the full company name
 * rendered as text inside a colored square — used by the hero carousel where
 * we need every card to have *something* readable, never a blank box.
 *
 * Google's default "we don't know this domain" favicon is a 16×16 globe, which
 * scales into our box as essentially nothing. `onLoad` checks `naturalWidth`
 * and treats anything ≤ 16 px as a miss, letting us fall through to initials.
 */
const failed = new Set<string>();
const failKey = (stage: Stage, domain: string) => `${stage}::${domain}`;
const tokenEnv = (process.env.NEXT_PUBLIC_LOGODEV_TOKEN || '').trim();

function nextStage(stage: Stage): Stage {
  if (stage === 'logodev') return 'gfavicon';
  return 'initials';
}

function initialStage(domain: string | undefined): Stage {
  if (!domain) return 'initials';
  if (!tokenEnv) return 'gfavicon';
  if (failed.has(failKey('logodev', domain))) {
    return failed.has(failKey('gfavicon', domain)) ? 'initials' : 'gfavicon';
  }
  return 'logodev';
}

function urlFor(stage: Stage, domain: string): string | null {
  if (stage === 'logodev') {
    return `https://img.logo.dev/${domain}?token=${tokenEnv}&size=64&format=png`;
  }
  if (stage === 'gfavicon') {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }
  return null;
}

export function CompanyLogo({
  name,
  domain,
  size = 32,
  className,
  fallbackText = false,
}: {
  name: string;
  domain?: string;
  size?: number;
  className?: string;
  /** When true, the final fallback is the full company name as text instead of a 1-2 char initials badge. */
  fallbackText?: boolean;
}) {
  const [stage, setStage] = useState<Stage>(() => initialStage(domain));
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  useEffect(() => {
    setStage(initialStage(domain));
  }, [domain]);

  const advance = () => {
    if (domain) failed.add(failKey(stage, domain));
    setStage((s) => nextStage(s));
  };

  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Google's "unknown domain" fallback is a 16×16 globe; treat it as a miss
    // so we slide down to the next stage. Logo.dev images come back ≥ 32 px.
    const w = e.currentTarget.naturalWidth;
    if (stage === 'gfavicon' && w > 0 && w <= 16) advance();
  };

  const url = domain && stage !== 'initials' ? urlFor(stage, domain) : null;

  if (!url) {
    const { bg, fg } = colorFor(name, isDark);
    if (fallbackText) {
      // Multi-line truncated name. Font scales with box size but stays readable.
      const fontSize = Math.max(8, Math.round(size * 0.18));
      return (
        <span
          aria-label={`${name} (no logo)`}
          role="img"
          className={clsx('inline-flex items-center justify-center select-none', className)}
          style={{
            width: size,
            height: size,
            borderRadius: 6,
            background: bg,
            color: fg,
            padding: 4,
            overflow: 'hidden',
            textAlign: 'center',
            lineHeight: 1.05,
            fontSize,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          >
            {name}
          </span>
        </span>
      );
    }
    return (
      <span
        aria-label={`${name} logo`}
        role="img"
        className={clsx('inline-flex items-center justify-center font-semibold select-none', className)}
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          background: bg,
          color: fg,
          fontSize: Math.round(size * 0.42),
          lineHeight: 1,
        }}
      >
        {initialsOf(name)}
      </span>
    );
  }

  return (
    <span
      className={clsx('inline-flex items-center justify-center bg-white', className)}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        border: '0.5px solid var(--border)',
        padding: 4,
        overflow: 'hidden',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={url}
        alt={`${name} logo`}
        width={size - 8}
        height={size - 8}
        loading="lazy"
        decoding="async"
        onError={advance}
        onLoad={onLoad}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </span>
  );
}
