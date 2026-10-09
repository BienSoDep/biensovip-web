import { Phone, Heart, GitCompareArrows, CheckCircle2 } from 'lucide-react';
import { Card, Badge, IconButton } from './index.jsx';
import Button from './Button.jsx';
import PlateVisual from './PlateVisual.jsx';
import ZaloIcon from './ZaloIcon.jsx';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import { optimizeImageUrl } from '../lib/cloudinary.js';
import { buildConsultMessage, openZaloWithMessage, callOrCopyPhone, isMobileDevice } from '../lib/zaloMessage.js';
import { shouldShowGeneratedImage } from '../lib/plateImageDisplay.js';
import { useSiteSettings } from '../services/siteSettings.js';
import { trackCtaClick } from '../services/tracking/events.js';

const BADGE_TONE = { 'Mới lên sàn': 'amber', 'Đã có khách cọc': 'rose' };

export default function PlateCard({
  plate,
  plateNumber = plate?.plateNumber,
  type = plate?.type,
  province = plate?.province,
  vehicleType = plate?.vehicleType,
  price = plate?.price,
  priceOnRequest = plate?.priceOnRequest,
  isHot = plate?.isHot,
  thumbnailUrl = plate?.thumbnailUrl,
  status = plate?.status,
  badge = plate?.badge,
  fav, onFav, onCompare, inCompare, onOpen, onSelect, href, onBuy, style, plateSize = 'md',
  contact, salePrice = plate?.salePrice, layout = 'grid', priceOnRequestLabel, fengShui,
}) {
  const handleOpen = onOpen || onSelect || (() => {});
  // Ảnh biển số sinh tự động chỉ hiện khi admin đã bật cờ toàn hệ thống (mặc định tắt — ưu tiên
  // PlateVisual). Xem AdminMaintenance > "Hiển thị biển số" hoặc trang cài đặt tương ứng.
  const { data: settings } = useSiteSettings();
  const showThumbnail = shouldShowGeneratedImage(settings, thumbnailUrl ? [thumbnailUrl] : []);
  const { prov, seri, num } = splitPlateNumber(plateNumber);
  const sold = status === 'sold';
  const meta = [vehicleType, province].filter(Boolean).join(' · ');
  const isZeroOrNoPrice = priceOnRequest || !price || Number(price) <= 0;
  const onSale = !isZeroOrNoPrice && salePrice != null && salePrice < price;
  const discountPct = onSale ? Math.round((1 - salePrice / price) * 100) : 0;
  // Biển hợp mệnh của khách: viền xanh lá + nhãn 🍀 (biển nổi bật giữ viền hổ phách, vẫn có nhãn hợp mệnh).
  const fsRing = fengShui && !sold && !isHot ? { boxShadow: '0 0 0 2px var(--mint-500), var(--shadow-2)' } : null;
  const fsBadge = fengShui ? <Badge tone="mint">🍀 Hợp mệnh {fengShui.element} · {fengShui.score}%</Badge> : null;

  if (layout === 'row') {
    return (
      <Card tone="sunken" pad="10px" className="plate-card" style={{ background: 'var(--surface-muted)', ...(isHot && !sold ? { boxShadow: '0 0 0 2px var(--amber-500), var(--shadow-2)' } : fsRing), ...style }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <a href={href || '#'} onClick={(e) => { e.preventDefault(); handleOpen(); }} className="pressable" style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', cursor: 'pointer', flex: '1 1 260px', minWidth: 0 }}>
            <div style={{ position: 'relative', flexShrink: 0, width: 108, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--white)' }}>
              {showThumbnail ? (
                <img src={optimizeImageUrl(thumbnailUrl)} alt={`Biển số ${plateNumber}${meta ? ' — ' + meta : ''}`} style={{ width: '100%', aspectRatio: '1.6/1', objectFit: 'cover', display: 'block' }} />
              ) : (
                <PlateVisual size="sm" prov={prov} seri={seri} num={num} shape="short" />
              )}
              {sold && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,18,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ font: 'var(--type-caption)', fontSize: 10, letterSpacing: '.1em', color: 'var(--white)', background: 'rgba(14,15,18,.72)', padding: '2px 8px', borderRadius: 'var(--radius-xs)' }}>ĐÃ BÁN</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {isHot && <Badge tone="hot">🔥 HOT</Badge>}
                {fsBadge}
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
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{priceOnRequest && priceOnRequestLabel ? priceOnRequestLabel : formatPrice(price, priceOnRequest)}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {onFav && (
                <span style={{ display: 'inline-flex', animation: fav ? 'heartBeat 260ms var(--ease-out)' : undefined }}>
                  <IconButton name="heart" label={fav ? 'Bỏ lưu yêu thích' : 'Lưu yêu thích'} onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!fav) trackCtaClick('yeu_thich', plateNumber); onFav(); }} style={fav ? { color: 'var(--status-danger)' } : undefined} />
                </span>
              )}
              {onCompare && (
                <IconButton name={inCompare ? 'check-circle' : 'scale'} label={inCompare ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'} onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!inCompare) trackCtaClick('so_sanh', plateNumber); onCompare(); }} style={inCompare ? { color: 'var(--action-primary)' } : undefined} />
              )}
            </div>
          </a>
          {!sold && (onBuy || contact?.phone || contact?.zalo) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
              {onBuy && (
                <Button variant="primary" size="sm" onClick={() => { trackCtaClick('chot_bien', plateNumber); onBuy(); }} className="plate-card-cta-primary" style={{ whiteSpace: 'nowrap' }}>Chốt biển này</Button>
              )}
              {contact?.phone && (
                isMobileDevice() ? (
                  <a href={`tel:${contact.phone}`} onClick={() => trackCtaClick('goi_ngay', plateNumber)} aria-label="Gọi ngay" title="Gọi ngay" className="plate-card-cta-secondary plate-btn-phone" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Phone size={17} /></a>
                ) : (
                  <button type="button" onClick={() => { trackCtaClick('goi_ngay', plateNumber); callOrCopyPhone(contact.phone); }} aria-label="Sao chép số điện thoại" title={`Sao chép số ${contact.phone}`} className="plate-card-cta-secondary plate-btn-phone" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Phone size={17} /></button>
                )
              )}
              {contact?.zalo && (
                <button type="button" onClick={() => { trackCtaClick('zalo', plateNumber); openZaloWithMessage(contact.zalo, buildConsultMessage(plateNumber)); }} aria-label="Nhắn Zalo" title="Nhắn Zalo" className="plate-card-cta-secondary plate-btn-zalo" style={{ minWidth: 44, height: 36, padding: '0 6px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: 13, lineHeight: 1 }}>
                  Zalo
                </button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      tone="sunken"
      pad="10px"
      className="plate-card"
      style={{
        height: '100%',
        background: 'var(--surface-muted)',
        ...(isHot && !sold ? { boxShadow: '0 0 0 2px var(--amber-500), var(--shadow-2)' } : fsRing),
        ...style,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
        {/* Vùng huy hiệu chuẩn hóa: cố định 58px với 2 hàng thẳng thớm để vùng biển số chính luôn bằng phẳng tuyệt đối giữa các thẻ cạnh nhau */}
        <div style={{ minHeight: 58, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          {/* Hàng 1: Huy hiệu trạng thái chính (HOT, Sale, Phiên) + Nút yêu thích/so sánh */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
              {isHot && <Badge tone="hot">🔥 HOT</Badge>}
              {onSale && !sold && <Badge tone="rose">-{discountPct}%</Badge>}
              {badge && <Badge tone={BADGE_TONE[badge] || 'neutral'}>{badge}</Badge>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {onFav && (
                <button
                  type="button"
                  aria-label={fav ? 'Bỏ lưu yêu thích' : 'Lưu yêu thích'}
                  title={fav ? 'Bỏ lưu yêu thích' : 'Lưu yêu thích'}
                  onClick={() => { if (!fav) trackCtaClick('yeu_thich', plateNumber); onFav(); }}
                  style={{
                    width: 28,
                    height: 28,
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: fav ? 'var(--status-danger)' : 'var(--text-muted)',
                    padding: 0,
                    animation: fav ? 'heartBeat 260ms var(--ease-out)' : undefined,
                    transition: 'background-color 140ms ease, color 140ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
                </button>
              )}
              {onCompare && (
                <button
                  type="button"
                  aria-label={inCompare ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'}
                  title={inCompare ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'}
                  onClick={() => { if (!inCompare) trackCtaClick('so_sanh', plateNumber); onCompare(); }}
                  style={{
                    width: 28,
                    height: 28,
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: inCompare ? 'var(--action-primary)' : 'var(--text-muted)',
                    padding: 0,
                    transition: 'background-color 140ms ease, color 140ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {inCompare ? <CheckCircle2 size={16} /> : <GitCompareArrows size={16} />}
                </button>
              )}
            </div>
          </div>

          {/* Hàng 2: Huy hiệu phân loại & phong thủy dàn đều toàn bộ chiều rộng thẻ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 24, minWidth: 0, overflow: 'hidden' }}>
            {fsBadge}
            {type && <Badge tone="dark">{type}</Badge>}
          </div>
        </div>

        <a href={href || '#'} onClick={(e) => { e.preventDefault(); handleOpen(); }} className="pressable plate-card-stage" style={{ cursor: 'pointer', position: 'relative', borderRadius: 'var(--radius-md)', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          {showThumbnail ? (
            <img src={optimizeImageUrl(thumbnailUrl)} alt={`Biển số ${plateNumber}${meta ? ' — ' + meta : ''}`} style={{ width: '100%', aspectRatio: '1.6/1', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
          ) : (
            <div style={{ width: '100%', maxWidth: plateSize === 'listLg' ? 420 : undefined, margin: plateSize === 'listLg' ? '0 auto' : undefined }}>
              <PlateVisual size={plateSize} prov={prov} seri={seri} num={num} shape="short" />
            </div>
          )}
          {sold && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,18,.14)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ font: 'var(--type-title-3)', letterSpacing: '.15em', color: 'var(--white)', background: 'rgba(14,15,18,.72)', padding: '4px 14px', borderRadius: 'var(--radius-xs)' }}>ĐÃ BÁN</span>
            </div>
          )}
        </a>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <a href={href || '#'} onClick={(e) => { e.preventDefault(); handleOpen(); }} style={{ textDecoration: 'none', padding: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prov}{seri} · {num}</a>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</span>
          </div>
          {onSale ? (
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ font: 'var(--type-price)', color: 'var(--status-danger)', whiteSpace: 'nowrap' }}>{formatPrice(salePrice, false)}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>{formatPrice(price, false)}</span>
            </span>
          ) : (
            <span style={{ font: 'var(--type-price)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{priceOnRequest && priceOnRequestLabel ? priceOnRequestLabel : formatPrice(price, priceOnRequest)}</span>
          )}
          {!sold ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {onBuy && (
                <Button variant="primary" size="sm" onClick={() => { trackCtaClick('chot_bien', plateNumber); onBuy(); }} className="plate-card-cta-primary" fullWidth style={{ paddingTop: 12, paddingBottom: 12 }}>Chốt biển này</Button>
              )}
              {(contact?.phone || contact?.zalo) && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {contact?.phone && (
                    isMobileDevice() ? (
                      <a href={`tel:${contact.phone}`} onClick={() => trackCtaClick('goi_ngay', plateNumber)} aria-label="Gọi ngay" title="Gọi ngay" className="plate-btn-phone" style={{ flex: 1, minWidth: 0, height: 36, borderRadius: 'var(--radius-sm)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}><Phone size={18} /></a>
                    ) : (
                      <button type="button" onClick={() => { trackCtaClick('goi_ngay', plateNumber); callOrCopyPhone(contact.phone); }} aria-label="Sao chép số điện thoại" title={`Sao chép số ${contact.phone}`} className="plate-btn-phone" style={{ flex: 1, minWidth: 0, height: 36, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={18} /></button>
                    )
                  )}
                  {contact?.zalo && (
                    <button type="button" onClick={() => { trackCtaClick('zalo', plateNumber); openZaloWithMessage(contact.zalo, buildConsultMessage(plateNumber)); }} aria-label="Nhắn Zalo" title="Nhắn Zalo" className="plate-btn-zalo" style={{ flex: 1, minWidth: 0, height: 36, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, letterSpacing: '0.3px', lineHeight: 1 }}>
                      Zalo
                    </button>
                  )}
                </div>
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
