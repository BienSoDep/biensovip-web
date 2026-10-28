import { MotionTableLoader, MotionGridLoader } from './MotionLoader.jsx';
import '../styles/motion-loaders.css';

export function SkeletonText({ width = '100%', height = 16, style, radius = 'var(--radius-sm, 6px)' }) {
  return (
    <div
      className="motion-shimmer-base"
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ height = 180, style }) {
  return (
    <div
      className="motion-shimmer-base"
      aria-hidden="true"
      style={{
        height,
        borderRadius: 'var(--radius-card, 16px)',
        border: '1px solid var(--border-subtle, rgba(0,0,0,0.05))',
        ...style,
      }}
    />
  );
}

export function SkeletonTable({ rows = 6, cols = 4, message, style }) {
  // Bảng Motion Table chuẩn Motion UI với hàng so le & hiệu ứng quét sáng sang trọng
  return <MotionTableLoader rows={rows} cols={cols} message={message} style={style} />;
}

export function SkeletonGrid({ count = 8, columns, style }) {
  return <MotionGridLoader count={count} columns={columns} style={style} />;
}

export default function Skeleton({ variant = 'text', ...props }) {
  if (variant === 'card') return <SkeletonCard {...props} />;
  if (variant === 'table') return <SkeletonTable {...props} />;
  if (variant === 'grid') return <SkeletonGrid {...props} />;
  return <SkeletonText {...props} />;
}
