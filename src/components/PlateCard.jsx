import { Card, Badge, IconButton } from './index.jsx';
import Button from './Button.jsx';
import PlateVisual from './PlateVisual.jsx';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';

const BADGE_TONE = { 'Mới lên sàn': 'amber', 'Đã có khách cọc': 'rose' };

export default function PlateCard({
  plateNumber, type, province, vehicleType, price, priceOnRequest, isHot, thumbnailUrl,
  status, badge, fav, onFav, onOpen, onBuy, style,
}) {
  const { prov, seri, num } = splitPlateNumber(plateNumber);
  const sold = status === 'sold';
  const meta = [vehicleType, province].filter(Boolean).join(' · ');

  return (
    <Card tone="sunken" pad="10px" style={{ height: '100%', ...style }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {type && <Badge tone="dark">{type}</Badge>}
          {isHot && <Badge tone="rose">VIP</Badge>}
          {badge && <Badge tone={BADGE_TONE[badge] || 'neutral'}>{badge}</Badge>}
          <div style={{ flex: 1 }} />
          {onFav && (
            <span style={{ display: 'inline-flex', animation: fav ? 'heartBeat 260ms var(--ease-out)' : undefined }}>
              <IconButton name="heart" label={fav ? 'Bỏ lưu yêu thích' : 'Lưu yêu thích'} onClick={onFav} style={fav ? { color: 'var(--status-danger)' } : undefined} />
            </span>
          )}
        </div>

        <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }} className="pressable" style={{ cursor: 'pointer', position: 'relative', background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 12 }}>
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={plateNumber} style={{ width: '100%', aspectRatio: '1.6/1', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
          ) : (
            <PlateVisual size="md" prov={prov} seri={seri} num={num} />
          )}
          {sold && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,18,.5)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ font: 'var(--type-title-2)', letterSpacing: '.2em', color: 'var(--white)' }}>ĐÃ BÁN</span>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }} className="pressable" style={{ cursor: 'pointer', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{prov}{seri} · {num}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{meta}</span>
            </div>
            <span style={{ font: 'var(--type-price)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{formatPrice(price, priceOnRequest)}</span>
          </div>
          {!sold ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" size="sm" onClick={onBuy} className="plate-card-cta-primary" style={{ flex: 1 }}>Gọi ngay</Button>
              <Button variant="outline" size="sm" onClick={onBuy} className="plate-card-cta-secondary" style={{ flex: 1 }}>Nhắn Zalo</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" disabled fullWidth>Đã bán</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
