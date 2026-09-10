import { useEffect, useRef, useState } from 'react';
import Button from '../components/Button.jsx';
import { Input, Select, Checkbox, IconButton } from '../components/index.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import PlateCard from '../components/PlateCard.jsx';
import { useSimilarPlates } from '../services/plateDetail.js';
import { validateCoupon } from '../services/couponService.js';
import { routeFor } from '../config/routes.js';

// Cùng bộ mục đích với PlateDetail.jsx's "Chốt biển này" — 2 form phải đồng nhất field/hành vi.
const INTENT_OPTS = ['Hỏi chung', 'Đặt cọc giữ biển'];
const INTENT_VAL = { 'Hỏi chung': 'inquiry', 'Đặt cọc giữ biển': 'deposit_request' };

export default function Modals({ st, patch, cur, submitContact, mSending, setField, openPlate }) {
  // Mã giảm giá live-check khi rời ô — cùng UX với PlateDetail.jsx.
  const [couponStatus, setCouponStatus] = useState(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const checkCoupon = async () => {
    const code = (st.mCouponCode || '').trim();
    if (!code) { setCouponStatus(null); return; }
    setCheckingCoupon(true);
    try { setCouponStatus(await validateCoupon(code)); }
    catch { setCouponStatus({ valid: false, error: 'CHECK_FAILED' }); }
    finally { setCheckingCoupon(false); }
  };
  // Gợi ý biển khác sau khi gửi thành công — cùng nguồn dữ liệu với PlateDetail (ưu tiên cùng tỉnh).
  const { data: similar } = useSimilarPlates(st.sent ? cur?.id : null, 4);
  const suggestions = (similar?.sameProvince?.length ? similar.sameProvince : similar?.sameType) || [];
  const contactRef = useRef(null);

  // Escape key closes any open modal
  useEffect(() => {
    if (!st.modal) return;
    const handler = (e) => {
      if (e.key !== 'Escape') return;
      if (st.modal) patch({ modal: false, sent: false });
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [st.modal, patch]);

  // Auto-focus first focusable + focus-trap + scroll-lock + focus-restore when modal opens
  useEffect(() => {
    const ref = st.modal ? contactRef : null;
    if (!ref?.current) return;
    const trigger = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = ref.current;
    const focusable = dialog.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const els = Array.from(dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!els.length) return;
      const f = els[0];
      const l = els[els.length - 1];
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
    };
    dialog.addEventListener('keydown', onKey);
    return () => {
      dialog.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
    };
  }, [st.modal]);

  return (
    <>
      {st.modal && cur && (
        <div role="dialog" aria-modal="true" aria-labelledby="modal-contact-title" aria-describedby="modal-contact-desc" style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--overlay)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 18px', overflow: 'auto', animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div ref={contactRef} style={{ width: '100%', maxWidth: 460, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <PlateVisual size="sm" prov={cur.prov} seri={cur.seri} num={cur.num} />
                <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{cur.title}</span><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{cur.cat} · {cur.price}</span></div>
              </div>
              <IconButton name="x" label="Đóng" onClick={() => patch({ modal: false, sent: false })} />
            </div>
            {!st.sent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div><h2 id="modal-contact-title" style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Chốt biển này</h2><p id="modal-contact-desc" style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Shop gọi lại trong 15 phút, kể cả chủ nhật.</p></div>
                <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={st.mName} error={st.mErr.name} onChange={setField('mName')} />
                <Input label="Số điện thoại" type="tel" placeholder="09xx xxx xxx" value={st.mPhone} error={st.mErr.phone} onChange={setField('mPhone')} />
                <Select label="Mục đích" value={INTENT_OPTS[Object.keys(INTENT_VAL).indexOf(st.mIntent)] || 'Đặt cọc giữ biển'} options={INTENT_OPTS.map((o) => ({ value: o, label: o }))} onChange={(v) => patch({ mIntent: INTENT_VAL[v] || 'deposit_request' })} />
                <Input label="Mã giảm giá" value={st.mCouponCode || ''} onChange={setField('mCouponCode')} onBlur={checkCoupon} placeholder="Nhập mã nếu có" />
                {checkingCoupon && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang kiểm tra…</span>}
                {!checkingCoupon && couponStatus?.valid && (
                  <span style={{ font: 'var(--type-caption)', color: 'var(--status-success-ink)' }}>Áp dụng thành công — giảm {couponStatus.discountPercent}%</span>
                )}
                {!checkingCoupon && couponStatus && !couponStatus.valid && (
                  <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Mã không hợp lệ hoặc đã hết hạn</span>
                )}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ghi chú</span>
                  <textarea rows={3} placeholder="VD: muốn đặt cọc giữ biển" value={st.mNote} onChange={setField('mNote')} style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
                </label>
                <Input label="Email" type="email" placeholder="email@example.com" value={st.mEmail || ''} error={st.mErr.email} onChange={setField('mEmail')} />
                <Checkbox label="Báo tôi khi có biển tương tự / khuyến mãi" checked={!!st.mSubscribe} onChange={(v) => patch({ mSubscribe: !!v })} />
                <Button variant="primary" size="lg" fullWidth onClick={() => submitContact(couponStatus)} disabled={mSending} loading={mSending}>Gửi yêu cầu</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', animation: 'fadeIn 140ms var(--ease-out)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-pill)', background: 'var(--status-success-bg)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                  <span style={{ font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Cảm ơn bạn</span>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Yêu cầu đã được ghi nhận. Chúng tôi gọi lại trong 15 phút.</span>
                </div>
                <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <PlateVisual size="sm" prov={cur.prov} seri={cur.seri} num={cur.num} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Biển số bạn vừa gửi yêu cầu</span>
                    <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{cur.title}</span>
                    <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{cur.cat} · {cur.price}</span>
                  </div>
                </div>
                {suggestions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Trong lúc chờ, xem thêm biển khác?</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {suggestions.map((p) => (
                        <PlateCard key={p.id} layout="row" plateNumber={p.plateNumber} province={p.province}
                          price={p.price} thumbnailUrl={p.thumbnailUrl}
                          href={routeFor('detail', p.slug || p.id)}
                          onOpen={() => { patch({ modal: false, sent: false }); openPlate?.(p.slug || p.id); }} />
                      ))}
                    </div>
                  </div>
                )}
                <Button variant="outline" size="md" fullWidth onClick={() => patch({ modal: false, sent: false })}>Đóng</Button>
              </div>
            )}
          </div>
        </div>
      )}

    </>
  );
}
