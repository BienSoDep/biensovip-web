import { Phone } from 'lucide-react';
import { Card, Badge, IconButton } from './index.jsx';
import Button from './Button.jsx';
import PlateVisual from './PlateVisual.jsx';
import ZaloIcon from './ZaloIcon.jsx';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import { optimizeImageUrl } from '../lib/cloudinary.js';
import { buildConsultMessage, openZaloWithMessage } from '../lib/zaloMessage.js';
import { shouldShowGeneratedImage } from '../lib/plateImageDisplay.js';
import { useSiteSettings } from '../services/siteSettings.js';

const BADGE_TONE = { 'Mới lên sàn': 'amber', 'Đã có khách cọc': 'rose' };

export default function PlateCard({
  plateNumber, type, province, vehicleType, price, priceOnRequest, isHot, thumbnailUrl,
  status, badge, fav, onFav, onCompare, inCompare, onOpen, href, onBuy, style, plateSize = 'md',
  contact, salePrice, layout = 'grid',
}) {
  // Ảnh biển số sinh tự động chỉ hiện khi admin đã bật cờ toàn hệ thống (mặc định tắt — ưu tiên
  // PlateVisual). Xem AdminMaintenance > "Hiển thị biển số" hoặc trang cài đặt tương ứng.
  const { data: settings } = useSiteSettings();
  const showThumbnail = shouldShowGeneratedImage(settings, thumbnailUrl ? [thumbnailUrl] : []);
  const { prov, seri, num } = splitPlateNumber(plateNumber);
  const sold = status === 'sold';
  const meta = [vehicleType, province].filter(Boolean).join(' · ');
  const onSale = !priceOnRequest && salePrice != null && salePrice < price;
  const discountPct = onSale ? Math.round((1 - salePrice / price) * 100) : 0;

  if (layout === 'row') {
    return (
      <Card tone="sunken" pad="10px" style={{ ...(isHot && !sold ? { boxShadow: '0 0 0 2px var(--amber-500), var(--shadow-2)' } : null), ...style }}>
        <a href={href || '#'} onClick={(e) => { e.preventDefault(); onOpen(); }} className="pressable" style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', cursor: 'pointer' }}>
          <div style={{ position: 'relative', flexShrink: 0, width: 108, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--white)' }}>
            {showThumbnail ? (
              <img src={optimizeImageUrl(thumbnailUrl)} alt={`Biển số ${plateNumber}${meta ? ' — ' + meta : ''}`} style={{ width: '100%', aspectRatio: '1.6/1', objectFit: 'cover', display: 'block' }} />
            ) : (
              <PlateVisual size="sm" prov={prov} seri={seri} num={num} shape="short" />
            )}
            {sold && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,18,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ font: 'var(--type-caption)', fontSize: 10, letterSpacing: '.1em', color: 'var(--white)', background: 'rgba(14,15,18,.72)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>ĐÃ BÁN</span>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {isHot && <Badge tone="hot">🔥 HOT</Badge>}
              {type && <Badge tone="dark">{type}</Badge>}
              {badge && <Badge tone={BADGE_TONE[badge] || 'neutral'}>{badge}</Badge>}
            </div>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prov}{seri} · {num}</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</span>
            {onSale ? (
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--status-danger)', whiteSpace: 'nowrap' }}>{formatPrice(salePrice, false)}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>{formatPrice(price, false)}</span>
              </span>
            ) : (
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{formatPrice(price, priceOnRequest)}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {onFav && (
              <span style={{ display: 'inline-flex', animation: fav ? 'heartBeat 260ms var(--ease-out)' : undefined }}>
                <IconButton name="heart" label={fav ? 'Bỏ lưu yêu thích' : 'Lưu yêu thích'} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFav(); }} style={fav ? { color: 'var(--status-danger)' } : undefined} />
              </span>
            )}
            {onCompare && (
              <IconButton name={inCompare ? 'check-circle' : 'scale'} label={inCompare ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCompare(); }} style={inCompare ? { color: 'var(--action-primary)' } : undefined} />
            )}
          </div>
        </a>
      </Card>
    );
  }

  return (
    <Card
      tone="sunken"
      pad="10px"
      style={{
        height: '100%',
        ...(isHot && !sold ? { boxShadow: '0 0 0 2px var(--amber-500), var(--shadow-2)' } : null),
        ...style,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
        <div style={{ minHeight: 60, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', rowGap: 6 }}>
              {isHot && <Badge tone="hot">🔥 HOT</Badge>}
              {onSale && !sold && <Badge tone="rose">-{discountPct}%</Badge>}
              {type && <Badge tone="dark">{type}</Badge>}
              {badge && <Badge tone={BADGE_TONE[badge] || 'neutral'}>{badge}</Badge>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {onFav && (
                <span style={{ display: 'inline-flex', animation: fav ? 'heartBeat 260ms var(--ease-out)' : undefined }}>
                  <IconButton name="heart" label={fav ? 'Bỏ lưu yêu thích' : 'Lưu yêu thích'} onClick={onFav} style={fav ? { color: 'var(--status-danger)' } : undefined} />
                </span>
              )}
              {onCompare && (
                <IconButton name={inCompare ? 'check-circle' : 'scale'} label={inCompare ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'} onClick={onCompare} style={inCompare ? { color: 'var(--action-primary)' } : undefined} />
              )}
            </div>
          </div>
        </div>

        <a href={href || '#'} onClick={(e) => { e.preventDefault(); onOpen(); }} className="pressable plate-card-stage" style={{ cursor: 'pointer', position: 'relative', borderRadius: 'var(--radius-md)', padding: 16, display: 'block', textDecoration: 'none' }}>
          {showThumbnail ? (
            <img src={optimizeImageUrl(thumbnailUrl)} alt={`Biển số ${plateNumber}${meta ? ' — ' + meta : ''}`} style={{ width: '100%', aspectRatio: '1.6/1', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
          ) : (
            <div style={{ maxWidth: plateSize === 'listLg' ? 420 : undefined, margin: plateSize === 'listLg' ? '0 auto' : undefined }}>
              <PlateVisual size={plateSize} prov={prov} seri={seri} num={num} shape="short" />
            </div>
          )}
          {sold && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,18,.14)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 10, paddingBottom: 10 }}>
              <span style={{ font: 'var(--type-title-3)', letterSpacing: '.15em', color: 'var(--white)', background: 'rgba(14,15,18,.72)', padding: '4px 14px', borderRadius: 'var(--radius-pill)' }}>ĐÃ BÁN</span>
            </div>
          )}
        </a>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <a href={href || '#'} onClick={(e) => { e.preventDefault(); onOpen(); }} style={{ textDecoration: 'none', padding: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prov}{seri} · {num}</a>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</span>
          </div>
          {onSale ? (
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ font: 'var(--type-price)', color: 'var(--status-danger)', whiteSpace: 'nowrap' }}>{formatPrice(salePrice, false)}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>{formatPrice(price, false)}</span>
            </span>
          ) : (
            <span style={{ font: 'var(--type-price)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{formatPrice(price, priceOnRequest)}</span>
          )}
          {!sold ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {contact?.phone ? (
                <a href={`tel:${contact.phone}`} aria-label="Gọi ngay" title="Gọi ngay" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'var(--status-success-ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={16} /></a>
              ) : onBuy ? (
                <button type="button" onClick={onBuy} aria-label="Gọi ngay" title="Gọi ngay" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--status-success-ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={16} /></button>
              ) : null}
              {onBuy && (
                <Button variant="primary" size="sm" onClick={onBuy} className="plate-card-cta-primary" style={{ flex: 1, minWidth: 0 }}>Chốt biển này</Button>
              )}
              {contact?.zalo && (
                <button type="button" onClick={() => openZaloWithMessage(contact.zalo, buildConsultMessage(plateNumber))} aria-label="Nhắn Zalo" title="Nhắn Zalo" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#0068FF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ZaloIcon width={16} height={16} />
                </button>
              )}
            </div>
          ) : (
            <Button variant="ghost" size="sm" disabled fullWidth>Đã bán</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
