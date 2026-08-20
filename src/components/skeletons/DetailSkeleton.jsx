import SkeletonBase from './SkeletonBase.jsx';

export default function DetailSkeleton() {
  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-4) var(--pad-page) var(--pad-section-y)', display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 500px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,4vw,52px)', display: 'flex', justifyContent: 'center' }}>
            <SkeletonBase height={190} width="100%" style={{ maxWidth: 560 }} radius="var(--radius-xl)" />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <SkeletonBase width={64} height={64} radius="var(--radius-md)" />
            <SkeletonBase width={64} height={64} radius="var(--radius-md)" />
            <SkeletonBase width={64} height={64} radius="var(--radius-md)" />
          </div>
        </div>
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <SkeletonBase width={70} height={22} radius="var(--radius-pill)" />
            <SkeletonBase width={80} height={22} radius="var(--radius-pill)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SkeletonBase width="80%" height={28} />
            <SkeletonBase width="50%" height={16} />
          </div>
          <SkeletonBase height={70} radius="var(--radius-card)" />
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <SkeletonBase height={48} radius="var(--radius-pill)" style={{ flex: '1 1 120px' }} />
            <SkeletonBase height={48} radius="var(--radius-pill)" style={{ flex: '1 1 120px' }} />
          </div>
          <SkeletonBase height={90} radius="var(--radius-card)" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 'var(--space-3)' }}>
            <SkeletonBase height={54} radius="var(--radius-md)" />
            <SkeletonBase height={54} radius="var(--radius-md)" />
            <SkeletonBase height={54} radius="var(--radius-md)" />
            <SkeletonBase height={54} radius="var(--radius-md)" />
          </div>
        </div>
      </section>
    </div>
  );
}
