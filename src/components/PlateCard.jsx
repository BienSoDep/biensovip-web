import { Card, Badge, IconButton } from './index.jsx';
import Button from './Button.jsx';
import PlateVisual from './PlateVisual.jsx';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';

const BADGE_TONE = { 'Mới lên sàn': 'amber', 'Đã có khách cọc': 'rose' };
const AUCTION_SOON_DAYS = 3;

function auctionDaysLeft(auctionEndAt) {
  if (!auctionEndAt) return null;
  const diffMs = new Date(auctionEndAt).getTime() - Date.now();
  return Math.ceil(diffMs / 86400000);
}

export default function PlateCard({
  plateNumber, type, province, vehicleType, price, priceOnRequest, isHot, thumbnailUrl,
  status, badge, fav, onFav, onCompare, inCompare, onOpen, onBuy, style, plateSize = 'md',
  contact, listingType, auctionEndAt,
}) {
  const { prov, seri, num } = splitPlateNumber(plateNumber);
  const sold = status === 'sold';
  const meta = [vehicleType, province].filter(Boolean).join(' · ');
  const daysLeft = listingType === 'auction' ? auctionDaysLeft(auctionEndAt) : null;
  const auctionEndingSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= AUCTION_SOON_DAYS;

  return (
    <Card tone="sunken" pad="10px" style={{ height: '100%', ...style }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
        <div style={{ minHeight: 60, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', rowGap: 6 }}>
              {type && <Badge tone="dark">{type}</Badge>}
              {isHot && <Badge tone="rose">VIP</Badge>}
              {badge && <Badge tone={BADGE_TONE[badge] || 'neutral'}>{badge}</Badge>}
              {auctionEndingSoon && <Badge tone="amber">Còn {daysLeft <= 0 ? '<1' : daysLeft} ngày đấu giá</Badge>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {onFav && (
                <span style={{ display: 'inline-flex', animation: fav ? 'heartBeat 260ms var(--ease-out)' : undefined }}>
                  <IconButton name="heart" label={fav ? 'Bỏ lưu yêu thích' : 'Lưu yêu thích'} onClick={onFav} style={fav ? { color: 'var(--status-danger)' } : undefined} />
                </span>
              )}
              {onCompare && (
                <IconButton name={inCompare ? 'check-circle' : 'plus-circle'} label={inCompare ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'} onClick={onCompare} style={inCompare ? { color: 'var(--action-primary)' } : undefined} />
              )}
            </div>
          </div>
        </div>

        <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }} className="pressable plate-card-stage" style={{ cursor: 'pointer', position: 'relative', borderRadius: 'var(--radius-md)', padding: 16 }}>
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={plateNumber} style={{ width: '100%', aspectRatio: '1.6/1', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
          ) : (
            <div style={{ maxWidth: plateSize === 'listLg' ? 420 : undefined, margin: plateSize === 'listLg' ? '0 auto' : undefined }}>
              <PlateVisual size={plateSize} prov={prov} seri={seri} num={num} shape="short" />
            </div>
          )}
          {sold && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,18,.5)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ font: 'var(--type-title-2)', letterSpacing: '.2em', color: 'var(--white)' }}>ĐÃ BÁN</span>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <button type="button" onClick={onOpen} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', font: 'var(--type-title-3)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prov}{seri} · {num}</button>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</span>
          </div>
          <span style={{ font: 'var(--type-price)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{formatPrice(price, priceOnRequest)}</span>
          {!sold ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {contact?.phone ? (
                <a href={`tel:${contact.phone}`} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}><Button variant="primary" size="sm" className="plate-card-cta-primary" style={{ width: '100%' }}>Gọi ngay</Button></a>
              ) : onBuy ? (
                <Button variant="primary" size="sm" onClick={onBuy} className="plate-card-cta-primary" style={{ flex: 1 }}>Gọi ngay</Button>
              ) : null}
              {contact?.zalo ? (
                <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}><Button variant="outline" size="sm" className="plate-card-cta-secondary" style={{ width: '100%' }}>Nhắn Zalo</Button></a>
              ) : onBuy ? (
                <Button variant="outline" size="sm" onClick={onBuy} className="plate-card-cta-secondary" style={{ flex: 1 }}>Nhắn Zalo</Button>
              ) : null}
            </div>
          ) : (
            <Button variant="ghost" size="sm" disabled fullWidth>Đã bán</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
