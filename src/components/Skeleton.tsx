export function SkeletonList({ rows = 8 }: { rows?: number }) {
  return (
    <ul aria-busy="true" aria-live="polite" className="rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ height: 44, borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
        >
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 12, width: `${30 + (i * 7) % 40}%`, borderRadius: 4 }} />
          <div className="ml-auto skeleton" style={{ height: 12, width: 28, borderRadius: 4 }} />
        </li>
      ))}
    </ul>
  );
}
