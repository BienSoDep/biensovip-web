import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Badge, IconButton } from '../components/index.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import { usePlateDetail, useSimilarPlates, useLogPlateView, useLogPlateContact } from '../services/plateDetail.js';
import { useCompareIds } from '../services/compareService.js';
import { usePlateReviews } from '../services/reviewService.js';
import { content } from '../lib/content/index.js';

const BADGE_TONE = { 'Mới lên sàn': 'amber', 'Đã có khách cọc': 'rose' };

function LinkButton({ href, target, rel, variant, disabled, onClick, children, style }) {
  const bg = variant === 'outline' ? 'transparent' : 'var(--action-primary)';
  const color = variant === 'outline' ? 'var(--text-strong)' : 'var(--white)';
  const shadow = variant === 'outline' ? 'inset 0 0 0 1.5px var(--border-strong)' : 'var(--shadow-blue)';
  return (
    <a
      href={disabled ? undefined : href}
      target={target}
      rel={rel}
      onClick={disabled ? (e) => e.preventDefault() : onClick}
      aria-disabled={disabled}
      style={{
        height: 48, padding: '0 20px', border: 'none', borderRadius: 'var(--radius-pill)',
        font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', whiteSpace: 'nowrap',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        background: bg, color, boxShadow: shadow, ...style,
      }}
    >
      {children}
    </a>
  );
}

function AutoCarousel({ items, openPlate }) {
  const trackRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || items.length <= 1) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const cardWidth = 188 + 12; // width + gap (var(--space-3))
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + cardWidth, behavior: 'smooth' });
    }, 2800);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <div
      ref={trackRef}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      className="similar-carousel"
      style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 4 }}
    >
      {items.map((p) => {
        const sp = splitPlateNumber(p.plateNumber);
        return (
          <div key={p.id} onClick={() => openPlate(p.slug || p.id)} className="pressable" style={{ scrollSnapAlign: 'start', flex: '0 0 auto', width: 188, cursor: 'pointer', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', transition: 'var(--transition-card)' }}>
            <PlateVisual size="md" prov={sp.prov} seri={sp.seri} num={sp.num} />
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{formatPrice(p.price)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function PlateDetail({ plateId, favs, onFav, openPlate, openPost, go, notify }) {
  const { data: plate, isLoading, isError } = usePlateDetail(plateId);
  const { data: similar } = useSimilarPlates(plateId, 8);
  const logView = useLogPlateView();
  const logContact = useLogPlateContact();

  useEffect(() => {
    if (plateId) logView.mutate(plateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateId]);

  // Hooks phải chạy vô điều kiện trước mọi early-return (rules-of-hooks)
  const { data: reviewData } = usePlateReviews(plateId);
  const { add: addCompare, remove: removeCompare, isInList } = useCompareIds();

  const [lightbox, setLightbox] = useState(-1);
  const images = plate?.images || [];

  useEffect(() => {
    if (lightbox < 0) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(-1);
      else if (e.key === 'ArrowRight') setLightbox((i) => (i + 1) % images.length);
      else if (e.key === 'ArrowLeft') setLightbox((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, images.length]);

  const handleContact = (action) => {
    if (plateId) logContact.mutate({ id: plateId, action });
  };

  if (isLoading) {
    return (
      <div style={{ animation: 'pageIn 180ms var(--ease-out)', maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-10) var(--pad-page)' }}>
        <div style={{ height: 300, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)' }} />
      </div>
    );
  }

  if (isError || !plate) {
    return (
      <div style={{ animation: 'pageIn 180ms var(--ease-out)', maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-10) var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
        <h1 style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Biển số không tồn tại</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>Biển số này có thể đã được bán hoặc đường dẫn không chính xác.</p>
        <Button variant="primary" size="md" onClick={() => go('list')()}>Về kho biển số</Button>
      </div>
    );
  }

  const { prov, seri, num } = splitPlateNumber(plate.plateNumber);
  const sold = plate.status === 'sold';
  const isFav = !!favs?.[plate.id];
  const inCompare = isInList(plate.id);
  const isCar = plate.vehicleType === 'Ô tô';

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-4) var(--pad-page) var(--space-8)', display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 500px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,4vw,52px)', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 560, background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: 24 }}>
              {plate.images?.length > 0 ? (
                <img src={plate.images[0]} alt={plate.plateNumber} onClick={() => setLightbox(0)} style={{ width: '100%', borderRadius: 'var(--radius-md)', cursor: 'zoom-in' }} />
              ) : isCar ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <span style={{ display: 'block', font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 6 }}>Biển ngắn</span>
                    <PlateVisual size="lg" prov={prov} seri={seri} num={num} shape="short" />
                  </div>
                  <div>
                    <span style={{ display: 'block', font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 6 }}>Biển dài</span>
                    <PlateVisual size="lg" prov={prov} seri={seri} num={num} shape="long" />
                  </div>
                </div>
              ) : (
                <PlateVisual size="lg" prov={prov} seri={seri} num={num} shape="short" />
              )}
            </div>
          </div>
          {plate.images?.length > 1 && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {plate.images.slice(1).map((url, i) => (
                <img key={i} src={url} alt={`${plate.plateNumber} ${i + 2}`} onClick={() => setLightbox(i + 1)} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)', cursor: 'zoom-in' }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {plate.type && <Badge tone="dark">{plate.type}</Badge>}
            <Badge tone={sold ? 'rose' : 'mint'}>{sold ? 'Đã bán' : 'Còn hàng'}</Badge>
            {plate.badge && <Badge tone={BADGE_TONE[plate.badge] || 'neutral'}>{plate.badge}</Badge>}
          </div>
          <div>
            <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{prov}{seri} · {num}</h1>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{[plate.vehicleType, plate.province].filter(Boolean).join(' · ')} · {plate.viewCount} lượt xem</p>
            {reviewData?.totalReviews > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 1 }}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill={n <= Math.round(reviewData.averageRating) ? 'var(--amber-400)' : 'none'} style={{ color: n <= Math.round(reviewData.averageRating) ? 'var(--amber-400)' : 'var(--grey-300)' }} />)}</div>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{reviewData.averageRating.toFixed(1)} ({reviewData.totalReviews} đánh giá)</span>
              </div>
            ) : (
              <span style={{ display: 'block', marginTop: 6, font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Chưa có đánh giá</span>
            )}
          </div>
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Giá bán</span>
            <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{formatPrice(plate.price, plate.priceOnRequest)}</span>
          </div>
          <div className="plate-actions-desktop" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {plate.seller?.phone && (
              <LinkButton href={`tel:${plate.seller.phone}`} variant="primary" disabled={sold} onClick={() => handleContact('call')} style={{ flex: '1 1 120px' }}>Gọi ngay</LinkButton>
            )}
            {plate.seller?.zalo && (
              <LinkButton href={`https://zalo.me/${plate.seller.zalo}`} target="_blank" rel="noreferrer" variant="outline" disabled={sold} onClick={() => handleContact('contact')} style={{ flex: '1 1 120px' }}>Nhắn Zalo</LinkButton>
            )}
            <IconButton name="heart" label="Lưu yêu thích" size="lg" onClick={() => { onFav?.(plate.id); notify(isFav ? 'Đã bỏ khỏi yêu thích' : 'Đã lưu vào yêu thích'); }} style={isFav ? { color: 'var(--status-danger)' } : undefined} />
            <IconButton name={inCompare ? 'check-circle' : 'plus-circle'} label={inCompare ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'} size="lg" onClick={() => { (inCompare ? removeCompare : addCompare)(plate.id); notify(inCompare ? 'Đã bỏ khỏi so sánh' : 'Đã thêm vào so sánh'); }} style={inCompare ? { color: 'var(--action-primary)' } : undefined} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 'var(--space-3)' }}>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Loại xe</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{plate.vehicleType}</div></div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tỉnh / thành</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{plate.province}</div></div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Hồ sơ</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Sang tên ngay</div></div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Bảo đảm</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Hồ sơ gốc</div></div>
          </div>
        </div>
      </section>

      {similar?.sameProvince?.length > 0 && (
        <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Biển số cùng tỉnh/thành</span>
          <AutoCarousel items={similar.sameProvince} openPlate={openPlate} />
        </section>
      )}

      {similar?.sameType?.length > 0 && (
        <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Biển số tương tự kiểu</span>
          <AutoCarousel items={similar.sameType} openPlate={openPlate} />
        </section>
      )}

      {plate.meanings?.length > 0 && (
        <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Ý nghĩa phong thủy biển {prov}{seri} · {num}</h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Phân tích chi tiết theo con số, ngũ hành, vận trình sự nghiệp &amp; tài lộc.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {plate.meanings.map((m) => (
              <div key={m.id} style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', overflow: 'hidden', display: 'flex', flexWrap: 'wrap' }}>
                {m.imageUrl && (
                  <div style={{ flex: '1 1 240px', maxWidth: 300, minHeight: 180 }}>
                    <img src={m.imageUrl} alt={m.title || 'Phong thủy'} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                <div style={{ flex: '2 1 320px', padding: 'clamp(16px,2.5vw,24px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {m.title && <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{m.title}</h3>}
                  <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-body)', whiteSpace: 'pre-line' }}>{m.content}</p>
                  {m.blogSlug && (
                    <button type="button" onClick={() => openPost?.(m.blogSlug)} style={{ alignSelf: 'flex-start', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Xem chi tiết →</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--pad-section-y)' }}>
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div>
            <h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{content.process.teaser.title}</h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{content.process.teaser.desc}</p>
          </div>
          <Button variant="outline" size="lg" onClick={() => go('chat')()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {content.process.teaser.cta}<ArrowRight size={16} />
          </Button>
        </div>
      </section>

      <div className="plate-actions-mobile">
        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Giá bán</span>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatPrice(plate.price, plate.priceOnRequest)}</span>
        </div>
        {plate.seller?.phone && (
          <LinkButton href={`tel:${plate.seller.phone}`} variant="primary" disabled={sold} onClick={() => handleContact('call')} style={{ flex: '1 1 0' }}>Gọi ngay</LinkButton>
        )}
        {plate.seller?.zalo && (
          <LinkButton href={`https://zalo.me/${plate.seller.zalo}`} target="_blank" rel="noreferrer" variant="outline" disabled={sold} onClick={() => handleContact('contact')} style={{ flex: '1 1 0' }}>Zalo</LinkButton>
        )}
        <IconButton name="heart" label="Lưu yêu thích" size="lg" onClick={() => { onFav?.(plate.id); notify(isFav ? 'Đã bỏ khỏi yêu thích' : 'Đã lưu vào yêu thích'); }} style={isFav ? { color: 'var(--status-danger)' } : undefined} />
      </div>

      {lightbox >= 0 && images.length > 0 && (
        <div className="detail-lightbox" onClick={() => setLightbox(-1)}>
          <button type="button" className="lightbox-close" aria-label="Đóng" onClick={() => setLightbox(-1)}><X size={24} /></button>
          <button type="button" className="lightbox-nav lightbox-prev" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + images.length) % images.length); }}><ChevronLeft size={28} /></button>
          <img src={images[lightbox]} alt={`${plate.plateNumber} ${lightbox + 1}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-4)' }} />
          <button type="button" className="lightbox-nav lightbox-next" aria-label="Ảnh tiếp" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % images.length); }}><ChevronRight size={28} /></button>
          <span className="lightbox-counter">{lightbox + 1}/{images.length}</span>
        </div>
      )}
    </div>
  );
}
