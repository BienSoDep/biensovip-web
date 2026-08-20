import { Card } from '../index.jsx';
import SkeletonBase from './SkeletonBase.jsx';

export default function PlateCardSkeleton({ style }) {
  return (
    <Card tone="sunken" pad="10px" style={{ height: '100%', ...style }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SkeletonBase width={64} height={22} radius="var(--radius-pill)" />
          <div style={{ flex: 1 }} />
          <SkeletonBase width={28} height={28} radius="var(--radius-pill)" />
        </div>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 12 }}>
          <SkeletonBase height={72} radius="var(--radius-sm)" />
        </div>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <SkeletonBase width="70%" height={18} />
              <SkeletonBase width="50%" height={13} />
            </div>
            <SkeletonBase width={90} height={17} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <SkeletonBase height={32} radius="var(--radius-pill)" style={{ flex: 1 }} />
            <SkeletonBase height={32} radius="var(--radius-pill)" style={{ flex: 1 }} />
          </div>
        </div>
      </div>
    </Card>
  );
}
