/**
 * Deterministic color palette for the initials-badge logo fallback.
 * Same name → same color, regardless of where it appears.
 */
const PALETTE_LIGHT = [
  { bg: '#e2e8f0', fg: '#0f172a' },  // slate-200
  { bg: '#e4e4e7', fg: '#27272a' },  // zinc-200
  { bg: '#99f6e4', fg: '#134e4a' },  // teal-200
  { bg: '#a7f3d0', fg: '#064e3b' },  // emerald-200
  { bg: '#ddd6fe', fg: '#3b0764' },  // violet-200
  { bg: '#fde68a', fg: '#78350f' },  // amber-200
];

const PALETTE_DARK = [
  { bg: '#334155', fg: '#f1f5f9' },
  { bg: '#3f3f46', fg: '#fafafa' },
  { bg: '#115e59', fg: '#ccfbf1' },
  { bg: '#065f46', fg: '#d1fae5' },
  { bg: '#4c1d95', fg: '#ede9fe' },
  { bg: '#78350f', fg: '#fef3c7' },
];

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function colorFor(name: string, isDark: boolean) {
  const palette = isDark ? PALETTE_DARK : PALETTE_LIGHT;
  return palette[hash(name) % palette.length];
}

export function initialsOf(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
