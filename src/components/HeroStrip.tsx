'use client';

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';
import type { EmployerBucket } from '@/lib/types';

const TOP_N = 50;
const SPEED_PX_PER_SEC = 32;     // baseline marquee speed
const NUDGE_PX = 280;            // one click ≈ 3 card widths
const NUDGE_SETTLE_SEC = 0.4;    // time the nudge ease takes to die down

/**
 * Top-sponsors strip: seamless infinite carousel.
 *
 * Why JS-driven (not pure CSS keyframe):
 *   - The arrow nudges have to compose with the auto-scroll cleanly. With a
 *     CSS keyframe driving the position, an outer "nudge" transform layer
 *     and the inner animation are simply additive, and after a few clicks
 *     the user can push the track entirely off-screen because there's no
 *     wrap-around. With a rAF loop owning `x`, we just modulo by the copy
 *     width every frame and stay in the seamless range forever.
 *
 * The track contains the cards rendered twice. We measure the first copy's
 * width via ResizeObserver, then `x` stays in (-copyWidth, 0]. When auto-
 * scroll or a nudge pushes it past either boundary, we instantly wrap by
 * one copy width — invisible because the second copy is rendered at the
 * exact pixel position the first copy just vacated.
 */
export function HeroStrip({
  employers,
  onPick,
}: {
  employers: EmployerBucket;
  onPick: (name: string) => void;
}) {
  const top = Object.entries(employers)
    .map(([name, v]) => ({ name, total: v.total, domain: v.domain }))
    .sort((a, b) => b.total - a.total)
    .slice(0, TOP_N);

  const trackRef = useRef<HTMLDivElement | null>(null);
  // Animation state lives in a ref so React renders don't disturb the rAF loop.
  const stateRef = useRef({
    x: 0,
    pendingNudge: 0,
    copyWidth: 0,
    paused: false,
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const measure = () => {
      const firstCopy = track.querySelector('.hero-group') as HTMLElement | null;
      // offsetWidth includes the inner gap between cards but not the trailing
      // padding; we add the same gap as between groups (10 px) so the wrap is
      // pixel-perfect.
      stateRef.current.copyWidth = firstCopy ? firstCopy.offsetWidth + 10 : 0;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    let raf = 0;
    let prev = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - prev) / 1000);  // clamp big stalls
      prev = t;
      const s = stateRef.current;

      if (!s.paused && !reducedMotion) {
        s.x -= SPEED_PX_PER_SEC * dt;
      }

      // Exponential ease toward the pending nudge — feels snappier than a
      // linear glide and merges multiple clicks cleanly.
      if (Math.abs(s.pendingNudge) > 0.5) {
        const k = 1 - Math.exp(-dt / (NUDGE_SETTLE_SEC / 4));
        const step = s.pendingNudge * k;
        s.x += step;
        s.pendingNudge -= step;
      } else {
        s.pendingNudge = 0;
      }

      // Wrap to keep x in (-copyWidth, 0]; the duplicate copy makes this seamless.
      const cw = s.copyWidth;
      if (cw > 0) {
        while (s.x <= -cw) s.x += cw;
        while (s.x > 0)    s.x -= cw;
      }

      track.style.transform = `translate3d(${s.x.toFixed(2)}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  if (top.length === 0) return null;

  const onLeft  = () => { stateRef.current.pendingNudge += NUDGE_PX; };
  const onRight = () => { stateRef.current.pendingNudge -= NUDGE_PX; };
  const onEnter = () => { stateRef.current.paused = true; };
  const onLeave = () => { stateRef.current.paused = false; };

  const renderCard = (e: typeof top[number], keySuffix: string) => (
    <button
      key={`${keySuffix}:${e.name}`}
      onClick={() => onPick(e.name)}
      title={`${e.name} · ${e.total.toLocaleString()} hires`}
      aria-label={`Filter by ${e.name}, ${e.total.toLocaleString()} hires`}
      className="hero-card flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg shrink-0 transition-transform hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        width: 116,
      }}
    >
      <CompanyLogo name={e.name} domain={e.domain} size={40} fallbackText />
      <span className="w-full text-[11.5px] font-medium leading-tight text-center truncate" style={{ color: 'var(--fg)' }}>
        {e.name}
      </span>
      <span className="text-[10.5px] num whitespace-nowrap" style={{ color: 'var(--fg-subtle)' }}>
        {e.total.toLocaleString()} hires
      </span>
    </button>
  );

  return (
    <div className="hero-marquee" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        type="button"
        className="hero-nav hero-nav-left"
        onClick={onLeft}
        aria-label="Scroll carousel back"
      >
        <ChevronLeft size={16} />
      </button>
      <div ref={trackRef} className="hero-track" role="region" aria-label="Top sponsors carousel">
        <ul className="hero-group">
          {top.map((e) => renderCard(e, 'a'))}
        </ul>
        <ul className="hero-group" aria-hidden="true">
          {top.map((e) => renderCard(e, 'b'))}
        </ul>
      </div>
      <button
        type="button"
        className="hero-nav hero-nav-right"
        onClick={onRight}
        aria-label="Scroll carousel forward"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
