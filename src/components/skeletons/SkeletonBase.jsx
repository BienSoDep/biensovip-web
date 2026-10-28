import '../../styles/motion-loaders.css';

export default function SkeletonBase({ width = '100%', height = 16, radius = 'var(--radius-md)', style }) {
  return (
    <div
      className="skeleton-shimmer motion-shimmer-base"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
