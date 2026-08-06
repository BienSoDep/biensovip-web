import SkeletonBase from './SkeletonBase.jsx';
import PlateCardSkeleton from './PlateCardSkeleton.jsx';
import PostCardSkeleton from './PostCardSkeleton.jsx';
import DetailSkeleton from './DetailSkeleton.jsx';

function ListSkeletonLayout() {
  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-7) var(--pad-page) var(--pad-section-y)' }}>
      <SkeletonBase width={240} height={32} style={{ marginBottom: 'var(--space-2)' }} />
      <SkeletonBase width={160} height={16} style={{ marginBottom: 'var(--space-5)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(268px,1fr))', gap: 'var(--gutter-section)' }}>
        {Array.from({ length: 8 }, (_, i) => <PlateCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

function BlogSkeletonLayout() {
  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)' }}>
      <SkeletonBase width={220} height={32} style={{ marginBottom: 'var(--space-2)' }} />
      <SkeletonBase width={320} height={16} style={{ marginBottom: 'var(--space-5)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 'var(--gutter-section)' }}>
        {Array.from({ length: 6 }, (_, i) => <PostCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

function GenericPageSkeleton() {
  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <SkeletonBase width={260} height={32} />
      <SkeletonBase width="60%" height={16} />
      <SkeletonBase height={160} radius="var(--radius-card)" />
      <SkeletonBase height={160} radius="var(--radius-card)" />
    </div>
  );
}

export default function PageSkeleton({ screen }) {
  if (screen === 'list') return <ListSkeletonLayout />;
  if (screen === 'detail') return <DetailSkeleton />;
  if (screen === 'blog') return <BlogSkeletonLayout />;
  return <GenericPageSkeleton />;
}
