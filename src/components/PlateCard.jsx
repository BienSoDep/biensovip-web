import { Card, Badge, IconButton } from './index.jsx';
import Button from './Button.jsx';
import PlateVisual from './PlateVisual.jsx';

export default function PlateCard({ prov, seri, num, cat, price, meta, hot, isNew, sold, fav, onFav, onOpen, onBuy }) {
  const plateLabel = `${prov || ''}${seri || ''} · ${num || ''}`;
  return (
    <Card tone="sunken" pad="10px" style={{ height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge tone="dark">{cat}</Badge>
          {hot && <Badge tone="rose">Còn 1 số</Badge>}
          {isNew && <Badge tone="amber">Mới</Badge>}
          <div style={{ flex: 1 }} />
          <span style={{ display: 'inline-flex', animation: fav ? 'heartBeat 260ms var(--ease-out)' : undefined }}>
            <IconButton name="heart" label={fav ? 'Bỏ lưu yêu thích' : 'Lưu yêu thích'} onClick={onFav} style={fav ? { color: 'var(--status-danger)' } : undefined} />
          </span>
        </div>

        <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }} className="pressable" style={{ cursor: 'pointer', position: 'relative', background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 12 }}>
          <PlateVisual size="md" prov={prov} seri={seri} num={num} />
          {sold && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,18,.5)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ font: 'var(--type-title-2)', letterSpacing: '.2em', color: 'var(--white)' }}>ĐÃ BÁN</span>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }} className="pressable" style={{ cursor: 'pointer', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{plateLabel}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{meta}</span>
            </div>
            <span style={{ font: 'var(--type-price)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{price}</span>
          </div>
          {!sold ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" size="sm" onClick={onBuy} style={{ flex: 1 }}>Gọi ngay</Button>
              <Button variant="outline" size="sm" onClick={onBuy} style={{ flex: 1 }}>Nhắn Zalo</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" disabled fullWidth>Đã bán</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
