import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Star, X, ChevronLeft, ChevronRight, Share2, Link2, MessageCircle } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Badge, IconButton, Input, Select, Checkbox, Avatar } from '../components/index.jsx';
import Modal from '../components/Modal.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import { validatePhone, normalizePhone } from '../lib/phone.js';
import { useSubmitContact } from '../services/contactService.js';
import { usePlateDetail, useSimilarPlates, useLogPlateView, useLogPlateContact } from '../services/plateDetail.js';
import { useCompareIds } from '../services/compareService.js';
import { usePlateReviews } from '../services/reviewService.js';
import { content } from '../lib/content/index.js';

const BADGE_TONE = { 'Mới lên sàn': 'amber', 'Đã có khách cọc': 'rose' };
const REVIEWS_PER_PAGE = 5;

function maskName(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Khách hàng';
  if (parts.length === 1) return parts[0][0] + '***';
  return `${parts[0]} *** ${parts[parts.length - 1]}`;
}

const INTENT_OPTS = ['Hỏi chung', 'Đặt cọc giữ biển', 'Mua đứt', 'Săn hộ / tư vấn theo nhu cầu'];
const INTENT_VAL = { 'Hỏi chung': 'inquiry', 'Đặt cọc giữ biển': 'deposit_request', 'Mua đứt': 'buy', 'Săn hộ / tư vấn theo nhu cầu': 'hunting' };

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
          <a key={p.id} href={`#/bien/${p.slug || p.id}`} onClick={(e) => { e.preventDefault(); openPlate(p.slug || p.id); }} className="pressable" aria-label={`Xem biển ${p.plateNumber}`} style={{ scrollSnapAlign: 'start', flex: '0 0 auto', width: 188, textDecoration: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', transition: 'var(--transition-card)' }}>
            <PlateVisual size="md" prov={sp.prov} seri={sp.seri} num={sp.num} />
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{formatPrice(p.price)}</span>
          </a>
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
  const [tab, setTab] = useState('info');
  const [reviewPage, setReviewPage] = useState(1);
  const { data: reviewData } = usePlateReviews(plateId, { page: reviewPage, perPage: REVIEWS_PER_PAGE });
  const { add: addCompare, remove: removeCompare, isInList } = useCompareIds();

  const submitContact = useSubmitContact();
  const [contactOpen, setContactOpen] = useState(false);
  const [cForm, setCForm] = useState({ fullName: '', phone: '', email: '', note: '', intent: 'inquiry', subscribe: false, honeypot: '' });
  const [cErr, setCErr] = useState('');
  const [copied, setCopied] = useState(false);

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
  const reviewTotalPages = Math.max(1, Math.ceil((reviewData?.total || 0) / REVIEWS_PER_PAGE));

  const shareUrl = `${location.origin}${location.pathname}#/bien/${plate.slug || plate.id}`;
  const shareFb = () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener'); handleContact('share'); };
  const shareZalo = () => { window.open(`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener'); handleContact('share'); };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); } catch { /* clipboard blocked */ }
    setCopied(true);
    notify('Đã sao chép liên kết');
    setTimeout(() => setCopied(false), 2000);
  };
  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (cForm.honeypot) { setContactOpen(false); return; } // bot trap
    if (!cForm.fullName.trim()) return setCErr('Vui lòng nhập họ tên');
    if (!validatePhone(cForm.phone)) return setCErr('Số điện thoại không hợp lệ');
    setCErr('');
    submitContact.mutate({
      fullName: cForm.fullName.trim(), phone: normalizePhone(cForm.phone),
      email: cForm.email?.trim() || null, plateId: plate.id, plateNumber: plate.plateNumber,
      note: cForm.note?.trim() || '', source: 'plate-detail', intent: cForm.intent,
      depositAmount: null, subscribeToNotifications: !!cForm.subscribe,
      honeypot: cForm.honeypot || null,
    }, {
      onSuccess: () => { notify('Đã gửi yêu cầu — admin sẽ liên hệ sớm.'); setContactOpen(false); handleContact('contact'); setCForm({ fullName: '', phone: '', email: '', note: '', intent: 'inquiry', subscribe: false, honeypot: '' }); },
      onError: () => setCErr('Gửi thất bại, vui lòng thử lại.'),
    });
  };
  const setCF = (k) => (e) => setCForm((f) => ({ ...f, [k]: e.target?.value ?? e }));

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
                <div style={{ display: 'flex', gap: 1 }}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill={n <= Math.round(reviewData.averageRating) ? 'var(--action-primary)' : 'none'} style={{ color: n <= Math.round(reviewData.averageRating) ? 'var(--action-primary)' : 'var(--grey-300)' }} />)}</div>
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
            {!sold && (
              <Button variant="primary" size="lg" onClick={() => setContactOpen(true)} style={{ flex: '1 1 160px' }}>Chốt biển này</Button>
            )}
            {plate.seller?.phone && (
              <LinkButton href={`tel:${plate.seller.phone}`} variant="primary" disabled={sold} onClick={() => handleContact('call')} style={{ flex: '1 1 120px' }}>Gọi ngay</LinkButton>
            )}
            {plate.seller?.zalo && (
              <LinkButton href={`https://zalo.me/${plate.seller.zalo}`} target="_blank" rel="noreferrer" variant="outline" disabled={sold} onClick={() => handleContact('contact')} style={{ flex: '1 1 120px' }}>Nhắn Zalo</LinkButton>
            )}
            <IconButton name="heart" label="Lưu yêu thích" size="lg" onClick={() => { onFav?.(plate.id); notify(isFav ? 'Đã bỏ khỏi yêu thích' : 'Đã lưu vào yêu thích'); }} style={isFav ? { color: 'var(--status-danger)' } : undefined} />
            <IconButton name={inCompare ? 'check-circle' : 'plus-circle'} label={inCompare ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'} size="lg" onClick={() => { (inCompare ? removeCompare : addCompare)(plate.id); notify(inCompare ? 'Đã bỏ khỏi so sánh' : 'Đã thêm vào so sánh'); }} style={inCompare ? { color: 'var(--action-primary)' } : undefined} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginRight: 4 }}>Chia sẻ:</span>
            <IconButton name="share" label="Chia sẻ Facebook" size="lg" onClick={shareFb} />
            <button type="button" aria-label="Chia sẻ Zalo" onClick={shareZalo} style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-body)', cursor: 'pointer' }}><MessageCircle size={24} /></button>
            <IconButton name={copied ? 'check' : 'copy'} label="Sao chép liên kết" size="lg" onClick={copyLink} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 'var(--space-3)' }}>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Loại xe</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{plate.vehicleType}</div></div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tỉnh / thành</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{plate.province}</div></div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Hồ sơ</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Sang tên ngay</div></div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Bảo đảm</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Hồ sơ gốc</div></div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page)' }}>
        <div role="tablist" aria-label="Nội dung biển số" style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-hairline)' }}>
          {[['info', 'Thông tin'], ['reviews', `Đánh giá${reviewData?.totalReviews ? ` (${reviewData.totalReviews})` : ''}`]].map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} style={{ height: 48, padding: '0 20px', border: 'none', borderBottom: tab === k ? '2px solid var(--action-primary)' : '2px solid transparent', background: 'transparent', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: tab === k ? 'var(--fw-semibold)' : 'var(--fw-medium)', color: tab === k ? 'var(--action-primary)' : 'var(--text-muted)' }}>{label}</button>
          ))}
        </div>
      </section>

      {tab === 'info' && (
      <>

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

      </>
      )}

      {tab === 'reviews' && (
        <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-6) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {!reviewData || reviewData.totalReviews === 0 ? (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '48px var(--space-6)', textAlign: 'center' }}>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có đánh giá nào cho biển số này.</p>
            </div>
          ) : (
            <>
              {reviewData.items.map((r) => (
                <div key={r.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Avatar name={r.reviewerName} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{maskName(r.reviewerName)}</span><span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span></div>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', gap: 2 }}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill={n <= r.rating ? 'var(--action-primary)' : 'none'} style={{ color: n <= r.rating ? 'var(--action-primary)' : 'var(--grey-300)' }} />)}</div>
                  </div>
                  {r.comment && <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{r.comment}</p>}
                </div>
              ))}
              {reviewTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Button variant="outline" size="sm" disabled={reviewPage <= 1} onClick={() => setReviewPage((p) => Math.max(1, p - 1))}>Trước</Button>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Trang {reviewPage} / {reviewTotalPages}</span>
                  <Button variant="outline" size="sm" disabled={reviewPage >= reviewTotalPages} onClick={() => setReviewPage((p) => Math.min(reviewTotalPages, p + 1))}>Sau</Button>
                </div>
              )}
            </>
          )}
        </section>
      )}

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
        {!sold && (
          <Button variant="primary" size="lg" onClick={() => setContactOpen(true)} style={{ flex: '1 1 0' }}>Chốt biển này</Button>
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

      <Modal open={contactOpen} onClose={() => setContactOpen(false)} title="Chốt biển này" maxWidth="480px">
        <form onSubmit={handleContactSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <input type="text" name="company" value={cForm.honeypot} onChange={setCF('honeypot')} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} aria-hidden="true" />
          <div>
            <Input label="Họ tên" value={cForm.fullName} onChange={setCF('fullName')} placeholder="Tên của bạn" error={cErr === 'Vui lòng nhập họ tên' ? cErr : undefined} required />
          </div>
          <div>
            <Input label="Số điện thoại" type="tel" value={cForm.phone} onChange={setCF('phone')} placeholder="0xxxxxxxxx" error={cErr === 'Số điện thoại không hợp lệ' ? cErr : undefined} required />
          </div>
          <div>
            <Select label="Mục đích" value={cForm.intent} onChange={(v) => setCForm((f) => ({ ...f, intent: v }))} options={INTENT_OPTS.map((o) => ({ value: INTENT_VAL[o], label: o }))} />
          </div>
          <div>
            <Input label="Biển số" value={plate.plateNumber} onChange={() => {}} disabled />
          </div>
          <div>
            <Input label="Ghi chú" value={cForm.note} onChange={setCF('note')} placeholder="Ví dụ: muốn đặt cọc giữ biển" />
          </div>
          <div>
            <Input label="Email (tùy chọn)" type="email" value={cForm.email} onChange={setCF('email')} placeholder="email@example.com" />
          </div>
          <div>
            <Checkbox label="Báo tôi khi có biển tương tự / khuyến mãi" checked={cForm.subscribe} onChange={(v) => setCForm((f) => ({ ...f, subscribe: !!v }))} />
          </div>
          {cErr && (cErr !== 'Vui lòng nhập họ tên' && cErr !== 'Số điện thoại không hợp lệ') && (
            <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{cErr}</span>
          )}
          <Button type="submit" variant="primary" size="lg" disabled={submitContact.isPending}>
            {submitContact.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
