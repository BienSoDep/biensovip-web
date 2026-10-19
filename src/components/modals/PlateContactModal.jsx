import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import Button from '../Button.jsx';
import { Input, Select, Checkbox, IconButton } from '../index.jsx';
import PlateVisual from '../PlateVisual.jsx';
import PlateCard from '../PlateCard.jsx';
import { useSimilarPlates } from '../../services/plateDetail.js';
import { validateCoupon } from '../../services/couponService.js';
import { routeFor } from '../../config/routes.js';
import { useModalA11y } from '../../hooks/useModalA11y.js';

// Cùng bộ mục đích với PlateDetail.jsx's "Chốt biển này" — 2 form đồng nhất field/hành vi.
export const INTENT_OPTS = ['Hỏi chung', 'Đặt cọc giữ biển'];
export const INTENT_VAL = { 'Hỏi chung': 'inquiry', 'Đặt cọc giữ biển': 'deposit_request' };
export const NOTE_TEMPLATES = [
  'Muốn đặt cọc giữ biển',
  'Cần tư vấn thêm về giá',
  'Xem biển tận nơi được không?',
  'Hỗ trợ trả góp/thủ tục sang tên',
];

export function PlateContactModal({
  isOpen,
  onClose,
  cur,
  sent,
  onSentReset,
  name,
  onNameChange,
  phone,
  onPhoneChange,
  email,
  onEmailChange,
  intent,
  onIntentChange,
  note,
  onNoteChange,
  couponCode,
  onCouponCodeChange,
  subscribe,
  onSubscribeChange,
  errors = {},
  onSubmit,
  submitting,
  openPlate,
}) {
  const [couponStatus, setCouponStatus] = useState(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const checkCoupon = async () => {
    const code = (couponCode || '').trim();
    if (!code) {
      setCouponStatus(null);
      return;
    }
    setCheckingCoupon(true);
    try {
      setCouponStatus(await validateCoupon(code));
    } catch {
      setCouponStatus({ valid: false, error: 'CHECK_FAILED' });
    } finally {
      setCheckingCoupon(false);
    }
  };

  const { data: similar } = useSimilarPlates(sent ? cur?.id : null, 4);
  const suggestions = (similar?.sameProvince?.length ? similar.sameProvince : similar?.sameType) || [];
  const contactRef = useRef(null);

  useModalA11y({
    isOpen,
    onClose,
    containerRef: contactRef,
  });

  if (!isOpen || !cur) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-contact-title"
      aria-describedby="modal-contact-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal, 90)',
        background: 'var(--overlay)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 18px',
        overflow: 'auto',
        animation: 'fadeIn 140ms var(--ease-out)',
      }}
    >
      <div
        ref={contactRef}
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-4)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          animation: 'modalIn 180ms var(--ease-out)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              background: 'var(--surface-tint-cream)',
              borderRadius: 'var(--radius-card)',
              padding: 'var(--space-3) var(--space-4)',
            }}
          >
            <PlateVisual size="md" prov={cur.prov} seri={cur.seri} num={cur.num} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{cur.title}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                {cur.cat} · {cur.price}
              </span>
            </div>
          </div>
          <IconButton name="x" label="Đóng" onClick={onClose} />
        </div>

        {!sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <h2
                id="modal-contact-title"
                style={{
                  margin: '0 0 var(--space-1)',
                  font: 'var(--type-title-2)',
                  letterSpacing: 'var(--ls-title)',
                  color: 'var(--text-strong)',
                }}
              >
                Chốt biển này
              </h2>
              <p id="modal-contact-desc" style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                Shop gọi lại trong 15 phút, kể cả chủ nhật.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Input
                label="Họ và tên"
                required
                placeholder="Nguyễn Văn A"
                value={name}
                error={errors.name}
                onChange={onNameChange}
              />
              <Input
                label="Số điện thoại"
                required
                type="tel"
                placeholder="09xx xxx xxx"
                value={phone}
                error={errors.phone}
                onChange={onPhoneChange}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Select
                label="Mục đích"
                info="Chọn lý do bạn liên hệ để shop tư vấn đúng hướng (đặt cọc, mua ngay hay chỉ hỏi thêm)."
                value={INTENT_OPTS[Object.keys(INTENT_VAL).indexOf(intent)] || 'Đặt cọc giữ biển'}
                options={INTENT_OPTS.map((o) => ({ value: o, label: o }))}
                onChange={(v) => onIntentChange?.(INTENT_VAL[v] || 'deposit_request')}
              />
              <Input
                label="Mã giảm giá"
                value={couponCode || ''}
                onChange={onCouponCodeChange}
                onBlur={checkCoupon}
                placeholder="Nhập mã nếu có"
              />
            </div>
            {checkingCoupon && (
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang kiểm tra…</span>
            )}
            {!checkingCoupon && couponStatus?.valid && (
              <span style={{ font: 'var(--type-caption)', color: 'var(--status-success-ink)' }}>
                Áp dụng thành công — giảm {couponStatus.discountPercent}%
              </span>
            )}
            {!checkingCoupon && couponStatus && !couponStatus.valid && (
              <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>
                Mã không hợp lệ hoặc đã hết hạn
              </span>
            )}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
                Ghi chú<span style={{ color: 'var(--status-danger)' }}> *</span>
              </span>
              <textarea
                rows={3}
                placeholder="VD: muốn đặt cọc giữ biển"
                value={note}
                onChange={onNoteChange}
                style={{
                  background: 'var(--surface-sunken)',
                  border: 'none',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  borderRadius: 'var(--radius-field)',
                  padding: '12px 14px',
                  font: 'var(--type-body)',
                  color: 'var(--text-strong)',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              {errors.note && (
                <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{errors.note}</span>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {NOTE_TEMPLATES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onNoteChange?.({ target: { value: t } })}
                    style={{
                      font: 'var(--type-caption)',
                      color: 'var(--text-muted)',
                      background: 'var(--surface-tint-cream)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '4px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </label>
            <Input
              label="Email"
              required
              type="email"
              placeholder="email@example.com"
              value={email || ''}
              error={errors.email}
              onChange={onEmailChange}
            />
            <Checkbox
              label="Báo tôi khi có biển tương tự / khuyến mãi"
              checked={!!subscribe}
              onChange={(v) => onSubscribeChange?.(!!v)}
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => onSubmit?.(couponStatus)}
              disabled={submitting}
              loading={submitting}
            >
              Gửi yêu cầu
            </Button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-5)',
              animation: 'fadeIn 140ms var(--ease-out)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-3)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--status-success-bg)',
                  color: 'var(--status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={26} strokeWidth={2.5} />
              </div>
              <span
                style={{
                  font: 'var(--type-title-2)',
                  letterSpacing: 'var(--ls-title)',
                  color: 'var(--text-strong)',
                }}
              >
                Cảm ơn bạn
              </span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                Yêu cầu đã được ghi nhận. Chúng tôi gọi lại trong 15 phút.
              </span>
            </div>
            <div
              style={{
                background: 'var(--surface-tint-cream)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <PlateVisual size="sm" prov={cur.prov} seri={cur.seri} num={cur.num} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Biển số bạn vừa gửi yêu cầu
                </span>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{cur.title}</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                  {cur.cat} · {cur.price}
                </span>
              </div>
            </div>
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
                  Trong lúc chờ, xem thêm biển khác?
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {suggestions.map((p) => (
                    <PlateCard
                      key={p.id}
                      layout="row"
                      plateNumber={p.plateNumber}
                      province={p.province}
                      price={p.price}
                      thumbnailUrl={p.thumbnailUrl}
                      href={routeFor('detail', p.slug || p.id)}
                      onOpen={() => {
                        onClose();
                        openPlate?.(p.slug || p.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <Button variant="outline" size="md" fullWidth onClick={onClose}>
              Đóng
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlateContactModal;
