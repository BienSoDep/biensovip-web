export default function SkeletonBase({ width = '100%', height = 16, radius = 'var(--radius-md)', style }) {
  return <div className="skeleton-shimmer" aria-hidden style={{ width, height, borderRadius: radius, ...style }} />;
}
