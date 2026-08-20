import SkeletonBase from './SkeletonBase.jsx';

export default function PostCardSkeleton() {
  return (
    <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <SkeletonBase height={170} radius={0} />
      <div style={{ padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <SkeletonBase width={72} height={20} radius="var(--radius-pill)" />
          <SkeletonBase width={80} height={13} />
        </div>
        <SkeletonBase width="90%" height={20} />
        <SkeletonBase width="60%" height={20} />
        <SkeletonBase width="100%" height={14} />
        <SkeletonBase width="80%" height={14} />
      </div>
    </div>
  );
}
