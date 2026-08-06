import { useEffect, useRef } from 'react';
import { opts } from '../lib/mockData.js';
import Button from '../components/Button.jsx';
import { Input, Select, IconButton } from '../components/index.jsx';
import PlateVisual from '../components/PlateVisual.jsx';

export default function Modals({ st, patch, setForm, savePlate, doDelete, cur, submitContact, setField, catNames }) {
  const addRef = useRef(null);
  const confirmRef = useRef(null);
  const contactRef = useRef(null);

  // Escape key closes any open modal
  useEffect(() => {
    if (!st.addOpen && !st.confirm && !st.modal) return;
    const handler = (e) => {
      if (e.key !== 'Escape') return;
      if (st.addOpen) patch({ addOpen: false, editId: null });
      if (st.confirm) patch({ confirm: null });
      if (st.modal) patch({ modal: false, sent: false });
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [st.addOpen, st.confirm, st.modal, patch]);

  // Auto-focus first focusable element when modal opens
  useEffect(() => {
    const ref = st.addOpen ? addRef : st.confirm ? confirmRef : st.modal ? contactRef : null;
    if (!ref?.current) return;
    const t = setTimeout(() => {
      const focusable = ref.current.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();
    }, 100);
    return () => clearTimeout(t);
  }, [st.addOpen, st.confirm, st.modal]);

  return (
    <>
      {st.addOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="modal-add-title" style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 18px', overflow: 'auto', animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div ref={addRef} style={{ width: '100%', maxWidth: 520, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div style={{ flex: 1 }}><h2 id="modal-add-title" style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{st.editId ? 'Sửa biển số' : 'Thêm biển số'}</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{st.editId ? 'Cập nhật thông tin biển đang bán.' : 'Biển sẽ xuất hiện ngay ở đầu bảng và trang chủ.'}</p></div>
              <IconButton name="x" label="Đóng" onClick={() => patch({ addOpen: false, editId: null })} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Input label="Mã tỉnh" placeholder="43" value={st.form.prov || ''} error={st.formErr.prov} onChange={setForm('prov')} />
              <Input label="Seri" placeholder="A1" value={st.form.seri || ''} error={st.formErr.seri} onChange={setForm('seri')} />
            </div>
            <Input label="Số biển" placeholder="999.99" value={st.form.num || ''} error={st.formErr.num} onChange={setForm('num')} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Select label="Danh mục" value={st.form.cat || 'Ngũ quý'} options={opts(catNames)} onChange={setForm('cat')} />
              <Select label="Loại xe" value={st.form.vehicle || 'Ô tô'} options={opts(['Ô tô', 'Xe máy'])} onChange={setForm('vehicle')} />
              <Select label="Trạng thái" value={st.form.status || 'Còn hàng'} options={opts(['Còn hàng', 'Đã bán', 'Ẩn'])} onChange={setForm('status')} />
            </div>
            <Input label="Giá" placeholder="2.150.000.000" hint="Để trống nếu bán theo giá liên hệ" value={st.form.price || ''} onChange={setForm('price')} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: 1 }}>Xem trước</span>
              <PlateVisual size="sm" prov={st.form.prov || '43'} seri={st.form.seri || 'A1'} num={st.form.num || '000.00'} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="md" onClick={() => patch({ addOpen: false, editId: null })}>Hủy</Button>
              <Button variant="primary" size="md" onClick={savePlate}>{st.editId ? 'Lưu thay đổi' : 'Thêm biển số'}</Button>
            </div>
          </div>
        </div>
      )}

      {!!st.confirm && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="modal-confirm-title" style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div ref={confirmRef} style={{ width: '100%', maxWidth: 380, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <h2 id="modal-confirm-title" style={{ margin: 0, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Xác nhận xóa</h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{st.confirm.text}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="md" onClick={() => patch({ confirm: null })}>Hủy</Button>
              <Button variant="primary" size="md" onClick={doDelete} style={{ background: 'var(--status-danger)', boxShadow: '0 8px 20px rgba(229,72,77,.26)' }}>Xóa</Button>
            </div>
          </div>
        </div>
      )}

      {st.modal && (
        <div role="dialog" aria-modal="true" aria-labelledby="modal-contact-title" style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 18px', overflow: 'auto', animation: 'fadeIn 140ms var(--ease-out)' }}>
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
                <div><h2 id="modal-contact-title" style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Gửi yêu cầu tư vấn</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Shop gọi lại trong 15 phút, kể cả chủ nhật.</p></div>
                <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={st.mName} error={st.mErr.name} onChange={setField('mName')} />
                <Input label="Số điện thoại" placeholder="09xx xxx xxx" value={st.mPhone} error={st.mErr.phone} onChange={setField('mPhone')} />
                <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ghi chú</span>
                  <textarea rows={3} placeholder="VD: cần sang tên trong tuần này" value={st.mNote} onChange={setField('mNote')} style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
                </label>
                <Button variant="primary" size="lg" fullWidth onClick={submitContact}>Gửi yêu cầu</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', animation: 'fadeIn 140ms var(--ease-out)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-pill)', background: 'var(--status-success-bg)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                  <span style={{ font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Cảm ơn bạn</span>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Yêu cầu đã được ghi nhận. Chúng tôi gọi lại trong 15 phút.</span>
                </div>
                <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Muốn giữ chỗ nhanh? Chuyển khoản cọc:</span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', font: 'var(--type-body-sm)' }}><span style={{ color: 'var(--text-muted)', minWidth: 100 }}>Ngân hàng</span><span style={{ color: 'var(--text-strong)' }}>Vietcombank — Đà Nẵng</span></div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', font: 'var(--type-body-sm)' }}><span style={{ color: 'var(--text-muted)', minWidth: 100 }}>Số tài khoản</span><span style={{ color: 'var(--text-strong)' }}>0041 0000 998877</span></div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', font: 'var(--type-body-sm)' }}><span style={{ color: 'var(--text-muted)', minWidth: 100 }}>Chủ tài khoản</span><span style={{ color: 'var(--text-strong)' }}>DINH VAN DUY</span></div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', font: 'var(--type-body-sm)' }}><span style={{ color: 'var(--text-muted)', minWidth: 100 }}>Nội dung CK</span><span style={{ color: 'var(--text-strong)' }}>COC {cur.ref}</span></div>
                </div>
                <Button variant="outline" size="md" fullWidth onClick={() => patch({ modal: false, sent: false })}>Đóng</Button>
              </div>
            )}
          </div>
        </div>
      )}

    </>
  );
}
