const base = {
  background: 'var(--surface-sunken)',
  borderRadius: 'var(--radius-sm)',
  animation: 'fadeIn 400ms var(--ease-out) infinite alternate',
};

export function SkeletonText({ width = '100%', height = 16 }) {
  return <div aria-hidden style={{ ...base, width, height }} />;
}

export function SkeletonCard({ height = 180 }) {
  return <div aria-hidden style={{ ...base, height, borderRadius: 'var(--radius-card)' }} />;
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12 }}>
          {Array.from({ length: cols }, (_, j) => (
            <div key={j} style={{ ...base, flex: 1, height: 28 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Skeleton({ variant = 'text', ...props }) {
  if (variant === 'card') return <SkeletonCard {...props} />;
  if (variant === 'table') return <SkeletonTable {...props} />;
  return <SkeletonText {...props} />;
}
