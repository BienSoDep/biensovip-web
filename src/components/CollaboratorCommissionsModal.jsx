import { useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { Select } from './index.jsx';
import { useCollaboratorCommissions, usePayCommissions } from '../services/adminCollaborators.js';
import { formatDate, formatDateTime } from '../lib/date.js';

const STATUS_OPTS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'paid', label: 'Đã trả' },
  { value: 'cancelled', label: 'Đã hủy' },
];
const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

// UC34 — breakdown chi tiết Commission theo CTV + xác nhận chi trả nhiều khoản cùng lúc.
export default function CollaboratorCommissionsModal({ collaborator, onClose, notify }) {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [payForm, setPayForm] = useState(null); // { total, amount, note }
  const { data, isLoading } = useCollaboratorCommissions(collaborator?.id, { status, page, limit: 20 });
  const payCommissions = usePayCommissions(collaborator?.id);

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / (data?.perPage || 20)));
  const payable = items.filter((c) => c.status === 'pending' || c.status === 'approved');

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () => setSelected((s) => (s.length === payable.length ? [] : payable.map((c) => c.id)));

  const selectedSum = items.filter((c) => selected.includes(c.id)).reduce((a, c) => a + Number(c.amount), 0);

  const openPayForm = () => setPayForm({ amount: String(selectedSum), note: '' });

  const submitPay = async () => {
    const amount = Number(payForm.amount);
    if (!(amount > 0)) { notify('Số tiền phải lớn hơn 0'); return; }
    try {
      await payCommissions.mutateAsync({ commissionIds: selected, paidAmount: amount, paidNote: payForm.note || undefined });
      notify('Đã xác nhận chi trả');
      setSelected([]);
      setPayForm(null);
    } catch (e) {
      notify(e.message || 'Lỗi khi chi trả');
    }
  };

  return (
    <Modal open={!!collaborator} onClose={onClose} title={`Hoa hồng — ${collaborator?.fullName || ''}`} maxWidth="720px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Select value={status} options={STATUS_OPTS} onChange={(v) => { setStatus(v); setPage(1); setSelected([]); }} />
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{total} khoản</span>
        </div>

        {isLoading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Không có khoản hoa hồng nào.</div>
        ) : (
          <div style={{ border: '1px solid var(--grey-100)', borderRadius: 'var(--radius-field)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', padding: '8px 12px', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', color: 'var(--text-muted)' }}>
              <span style={{ flex: '0 0 24px' }}>
                {payable.length > 0 && <input type="checkbox" checked={selected.length === payable.length} onChange={toggleAll} />}
              </span>
              <span style={{ flex: '1 1 80px' }}>Ngày</span>
              <span style={{ flex: '1 1 90px' }}>Biển số</span>
              <span style={{ flex: '1 1 80px' }}>Số tiền</span>
              <span style={{ flex: '1 1 80px' }}>Trạng thái</span>
              <span style={{ flex: '1 1 120px' }}>Chi trả</span>
            </div>
            {items.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 'var(--space-2)', padding: '8px 12px', alignItems: 'center', boxShadow: 'inset 0 -1px 0 var(--grey-100)', font: 'var(--type-caption)' }}>
                <span style={{ flex: '0 0 24px' }}>
                  {(c.status === 'pending' || c.status === 'approved') && (
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                  )}
                </span>
                <span style={{ flex: '1 1 80px', color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</span>
                <span style={{ flex: '1 1 90px' }}>{c.plateNumber || '—'}</span>
                <span style={{ flex: '1 1 80px', fontWeight: 'var(--fw-semibold)' }}>{money(c.amount)}</span>
                <span style={{ flex: '1 1 80px' }}>{STATUS_OPTS.find((o) => o.value === c.status)?.label || c.status}</span>
                <span style={{ flex: '1 1 120px', color: 'var(--text-faint)' }}>
                  {c.status === 'paid' ? `${c.paidByLabel || '—'} · ${formatDateTime(c.paidAt)}` : '—'}
                </span>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} style={{ minWidth: 32, height: 32, border: 'none', borderRadius: 'var(--radius-field)', background: p === page ? 'var(--action-primary)' : 'var(--white)', color: p === page ? 'var(--white)' : 'var(--text-body)', cursor: 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }}>{p}</button>
            ))}
          </div>
        )}

        {selected.length > 0 && !payForm && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', padding: '10px 14px', background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-field)' }}>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>Đã chọn {selected.length} khoản — tổng {money(selectedSum)}</span>
            <Button variant="primary" size="sm" onClick={openPayForm}>Xác nhận chi trả</Button>
          </div>
        )}

        {payForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Số tiền thực trả
              <input type="number" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                style={{ height: 36, border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-field)', padding: '0 10px', font: 'var(--type-body-sm)' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Ghi chú (VD mã giao dịch)
              <input value={payForm.note} onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))}
                style={{ height: 36, border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-field)', padding: '0 10px', font: 'var(--type-body-sm)' }} />
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => setPayForm(null)}>Hủy</Button>
              <Button variant="primary" size="sm" disabled={payCommissions.isPending} onClick={submitPay}>Xác nhận</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
