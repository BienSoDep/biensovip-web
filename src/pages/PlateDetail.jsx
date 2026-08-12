import { useEffect } from 'react';
import { MessageCircle, ClipboardCheck, HandCoins, KeyRound, Star } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Badge, IconButton } from '../components/index.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import { usePlateDetail, useSimilarPlates, useLogPlateView, useLogPlateContact } from '../services/plateDetail.js';
import { useCompareIds } from '../services/compareService.js';
import { usePlateReviews } from '../services/reviewService.js';

const CONTACT_STEPS = [
  { icon: MessageCircle, title: '1. Nhắn Zalo', desc: 'Bấm "Nhắn Zalo", gửi biển số bạn quan tâm. Shop phản hồi trong 5–15 phút, kể cả cuối tuần.' },
  { icon: ClipboardCheck, title: '2. Tư vấn & kiểm tra hồ sơ', desc: 'Nhân viên tư vấn chi tiết về biển số, kiểm tra hồ sơ gốc và giải đáp thắc mắc của bạn.' },
  { icon: HandCoins, title: '3. Thống nhất giá & đặt cọc', desc: 'Chốt giá cuối cùng, đặt cọc giữ chỗ để tiến hành thủ tục sang tên.' },
  { icon: KeyRound, title: '4. Sang tên & nhận biển', desc: 'Hoàn tất thủ tục sang tên, thanh toán phần còn lại và nhận biển số mang tên bạn.' },
];

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

export default function PlateDetail({ plateId, favs, onFav, openPlate, go, notify }) {
  const { data: plate, isLoading, isError } = usePlateDetail(plateId);
  const { data: similar } = useSimilarPlates(plateId, 8);
  const logView = useLogPlateView();
  const logContact = useLogPlateContact();

  useEffect(() => {
    if (plateId) logView.mutate(plateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateId]);

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
  const { data: reviewData } = usePlateReviews(plate.id);
  const { add: addCompare, remove: removeCompare, isInList } = useCompareIds();
  const inCompare = isInList(plate.id);

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-4) var(--pad-page) var(--pad-section-y)', display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 500px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,4vw,52px)', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 560, background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: 24 }}>
              {plate.images?.length > 0 ? (
                <img src={plate.images[0]} alt={plate.plateNumber} style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
              ) : (
                <PlateVisual size="lg" prov={prov} seri={seri} num={num} />
              )}
            </div>
          </div>
          {plate.images?.length > 1 && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {plate.images.slice(1).map((url, i) => (
                <img key={i} src={url} alt={`${plate.plateNumber} ${i + 2}`} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          )}

          {similar?.items?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Biển số tương tự</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                {similar.items.map((p) => {
                  const sp = splitPlateNumber(p.plateNumber);
                  return (
                    <div key={p.id} onClick={() => openPlate(p.slug || p.id)} className="pressable" style={{ cursor: 'pointer', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', transition: 'var(--transition-card)' }}>
                      <PlateVisual size="sm" prov={sp.prov} seri={sp.seri} num={sp.num} />
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{formatPrice(p.price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {plate.seller?.phone && (
              <LinkButton href={`tel:${plate.seller.phone}`} variant="primary" disabled={sold} onClick={() => handleContact('call')} style={{ flex: '1 1 120px' }}>Gọi ngay</LinkButton>
            )}
            {plate.seller?.zalo && (
              <LinkButton href={`https://zalo.me/${plate.seller.zalo}`} target="_blank" rel="noreferrer" variant="outline" disabled={sold} onClick={() => handleContact('contact')} style={{ flex: '1 1 120px' }}>Nhắn Zalo</LinkButton>
            )}
            <IconButton name="heart" label="Lưu yêu thích" size="lg" onClick={() => { onFav?.(plate.id); notify(isFav ? 'Đã bỏ khỏi yêu thích' : 'Đã lưu vào yêu thích'); }} style={isFav ? { color: 'var(--status-danger)' } : undefined} />
            <IconButton name={inCompare ? 'check-circle' : 'plus-circle'} label={inCompare ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'} size="lg" onClick={() => { (inCompare ? removeCompare : addCompare)(plate.id); notify(inCompare ? 'Đã bỏ khỏi so sánh' : 'Đã thêm vào so sánh'); }} style={inCompare ? { color: 'var(--action-primary)' } : undefined} />
          </div>
          {plate.fengShuiMeaning && (
            <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ý nghĩa phong thủy</span>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{plate.fengShuiMeaning}</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 'var(--space-3)' }}>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Loại xe</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{plate.vehicleType}</div></div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tỉnh / thành</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{plate.province}</div></div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Hồ sơ</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Sang tên ngay</div></div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Bảo đảm</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Hồ sơ gốc</div></div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div>
          <h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Liên hệ đơn giản thế nào?</h2>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chỉ 4 bước từ lúc nhắn Zalo đến khi nhận biển số mang tên bạn.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--gutter-section)' }}>
          {CONTACT_STEPS.map((s) => (
            <div key={s.title} style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-pill)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} style={{ color: 'var(--action-primary)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{s.title}</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
