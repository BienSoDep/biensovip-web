import { useState } from 'react';
import { useAdminCoupons, useCreateCoupon, useUpdateCoupon } from '../../services/adminCoupons.js';
import { Switch } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import { Input } from '../../components/index.jsx';

const EMPTY = { code: '', discountPercent: '', maxUses: '', expiresAt: '' };

export default function AdminCoupons({ notify }) {
  const { data, isLoading, isError, refetch } = useAdminCoupons();
  const createMut = useCreateCoupon();
  const updateMut = useUpdateCoupon();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState(null);

  const items = data?.items || [];

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e && e.target ? e.target.value : e }));

  const submit = async () => {
    setErr(null);
    if (!form.code.trim()) return setErr('Vui lòng nhập mã');
    const pct = Number(form.discountPercent);
    if (!pct || pct < 1 || pct > 100) return setErr('% giảm phải từ 1 đến 100');
    try {
      await createMut.mutateAsync({
        code: form.code.trim(),
        discountPercent: pct,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      notify('Đã tạo mã giảm giá');
      setOpen(false);
      setForm(EMPTY);
    } catch (e) {
      notify(e.message || 'Lỗi tạo mã');
    }
  };

  const toggleActive = async (c) => {
    try {
      await updateMut.mutateAsync({ id: c.id, body: { active: !c.active } });
    } catch (e) {
      notify(e.message || 'Lỗi cập nhật');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="md" onClick={() => setOpen(true)}>Tạo mã mới</Button>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', padding: '10px 16px', font: 'var(--type-label)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-hairline)' }}>
          <span style={{ flex: '1 1 140px' }}>Mã</span>
          <span style={{ flex: '0 0 100px' }}>% giảm</span>
          <span style={{ flex: '0 0 120px' }}>Đã dùng / Tối đa</span>
          <span style={{ flex: '0 0 140px' }}>Hết hạn</span>
          <span style={{ flex: '0 0 100px' }}>Trạng thái</span>
        </div>
        {isLoading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải…</div>
        ) : isError ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--status-danger)' }}>
            Lỗi tải danh sách mã giảm giá.{' '}
            <button type="button" onClick={() => refetch()} style={{ color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Thử lại</button>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có mã giảm giá nào.</div>
        ) : items.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-hairline)', font: 'var(--type-body-sm)' }}>
            <span style={{ flex: '1 1 140px', fontWeight: 'var(--fw-semibold)' }}>{c.code}</span>
            <span style={{ flex: '0 0 100px' }}>{c.discountPercent}%</span>
            <span style={{ flex: '0 0 120px' }}>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ' / ∞'}</span>
            <span style={{ flex: '0 0 140px' }}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
            <span style={{ flex: '0 0 100px' }}>
              <Switch checked={c.active} onChange={() => toggleActive(c)} label={c.active ? 'Hoạt động' : 'Tắt'} />
            </span>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Tạo mã giảm giá" maxWidth="440px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input label="Mã" value={form.code} onChange={setF('code')} placeholder="SALE10" required />
          <Input label="% giảm" type="number" min="1" max="100" value={form.discountPercent} onChange={setF('discountPercent')} placeholder="10" required />
          <Input label="Số lần dùng tối đa (để trống = không giới hạn)" type="number" min="1" value={form.maxUses} onChange={setF('maxUses')} placeholder="100" />
          <Input label="Ngày hết hạn (để trống = không hết hạn)" type="date" value={form.expiresAt} onChange={setF('expiresAt')} />
          {err && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err}</span>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={submit} loading={createMut.isPending}>Tạo</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
