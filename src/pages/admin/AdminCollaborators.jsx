import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { Select } from '../../components/index.jsx';
import Modal from '../../components/Modal.jsx';
import { useAdminCollaborators, useUpdateCollaboratorStatus, useMarkCommissionsPaid } from '../../services/adminCollaborators.js';

const STATUSES = ['active', 'pending', 'locked'];
const STATUS_LABEL = { active: 'Hoạt động', pending: 'Chờ duyệt', locked: 'Bị khóa' };
const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const opts = (arr) => arr.map((v) => ({ value: v, label: STATUS_LABEL[v] || v }));

const spinnerStyle = {
  width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--grey-300)',
  borderTopColor: 'var(--text-strong)', display: 'inline-block', animation: 'bs-spin .8s linear infinite', flexShrink: 0,
};

export default function AdminCollaborators({ st, patch, notify }) {
  const adminQ = (st.adminQ || '').trim();
  const { data, isLoading, isError, refetch } = useAdminCollaborators(adminQ || undefined);
  const updateStatus = useUpdateCollaboratorStatus();
  const markPaid = useMarkCommissionsPaid();
  const collabs = data?.items || [];
  const f = st.admCtv || 'Tất cả';
  const list = collabs.filter((c) => f === 'Tất cả' || c.status === f);
  const totalEarned = collabs.reduce((a, c) => a + (Number(c.commissionEarned) || 0), 0);
  const pendingPayout = collabs.reduce((a, c) => a + (Number(c.commissionPending) || 0), 0);

  const [updatingId, setUpdatingId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { id, to }
  const [payId, setPayId] = useState(null);

  const applyStatus = (id, v) => {
    setUpdatingId(id);
    updateStatus.mutate({ id, status: v }, {
      onSuccess: () => notify('Đã cập nhật trạng thái CTV'),
      onError: () => notify('Cập nhật trạng thái thất bại'),
      onSettled: () => { setUpdatingId(null); setConfirm(null); },
    });
  };

  const doPay = async () => {
    if (!payId) return;
    try {
      const count = await markPaid.mutateAsync(payId);
      notify(count > 0 ? `Đã đánh dấu chi trả ${count} khoản hoa hồng` : 'Không có hoa hồng chờ chi trả');
    } catch {
      notify('Cập nhật chi trả thất bại');
    }
    setPayId(null);
  };

  const payTarget = collabs.find((c) => c.id === payId);

  if (isLoading) return <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>;
  if (isError) return (
    <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span>Lỗi tải dữ liệu</span>
      <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--gutter-section)' }}>
        {[
          ['Tổng hoa hồng', money(totalEarned), 'var(--status-success)'],
          ['Hoa hồng chờ chi trả', money(pendingPayout), 'var(--status-warning)'],
          ['Tổng CTV', String(collabs.length), 'var(--text-strong)'],
          ['Đang hoạt động', String(collabs.filter((c) => c.status === 'active').length), 'var(--text-strong)'],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <Select label="Trạng thái" value={f} options={[{ value: 'Tất cả', label: 'Tất cả' }, ...opts(STATUSES)]} onChange={(v) => patch({ admCtv: v })} />
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 620 }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '1 1 120px' }}>Tên</span><span style={{ flex: '1 1 110px' }}>Điện thoại</span><span style={{ flex: '1 1 120px' }}>Mã giới thiệu</span><span style={{ flex: '1 1 96px' }}>Hoa hồng</span><span style={{ flex: '1 1 120px' }}>Trạng thái</span><span style={{ flex: '0 0 120px' }}>Chi trả</span>
        </div>
        {list.map((c) => (
          <div key={c.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
            <span style={{ flex: '1 1 120px', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{c.fullName}</span>
            <span style={{ flex: '1 1 110px', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{c.phone}</span>
            <span style={{ flex: '1 1 120px', font: 'var(--type-caption)', color: 'var(--text-body)' }}>{c.referralCode}</span>
            <span style={{ flex: '1 1 96px', font: 'var(--type-caption)', color: 'var(--text-strong)' }}>{money(c.commissionEarned)}</span>
            <span style={{ flex: '1 1 120px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ pointerEvents: updatingId === c.id ? 'none' : undefined, opacity: updatingId === c.id ? 0.6 : 1, display: 'inline-block' }}>
                  <Select value={c.status} options={opts(STATUSES)} onChange={(v) => setConfirm({ id: c.id, to: v })} variant="pill" style={{ whiteSpace: 'nowrap', color: 'var(--text-strong)' }} />
                </span>
                {updatingId === c.id && <span aria-hidden style={spinnerStyle} />}
              </span>
            </span>
            <span style={{ flex: '0 0 120px' }}>
              <button type="button" onClick={() => setPayId(c.id)} disabled={!c.commissionPending}
                title={c.commissionPending > 0 ? `Hoa hồng chờ chi trả: ${money(c.commissionPending)}` : 'Không có hoa hồng chờ chi trả'}
                style={{ border: 'none', borderRadius: 'var(--radius-pill)', padding: '4px 12px', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', cursor: c.commissionPending > 0 ? 'pointer' : 'default', background: c.commissionPending > 0 ? 'var(--surface-tint-cream)' : 'var(--surface-sunken)', color: c.commissionPending > 0 ? 'var(--action-primary)' : 'var(--text-faint)' }}>
                Chi trả {money(c.commissionPending)}
              </button>
            </span>
          </div>
        ))}
        </div>
        </div>
        {list.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có CTV nào khớp bộ lọc.</div>}
      </div>

      <Modal open={confirm != null} onClose={() => setConfirm(null)} title="Xác nhận đổi trạng thái" maxWidth="380px">
        <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Bạn có chắc muốn đổi trạng thái CTV này sang <b>{confirm ? STATUS_LABEL[confirm.to] || confirm.to : ''}</b>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="md" onClick={() => setConfirm(null)}>Hủy</Button>
          <Button variant="primary" size="md" disabled={updatingId === confirm?.id} onClick={() => confirm && applyStatus(confirm.id, confirm.to)}>
            {updatingId === confirm?.id ? 'Đang cập nhật…' : 'Xác nhận'}
          </Button>
        </div>
      </Modal>

      <Modal open={payId != null} onClose={() => setPayId(null)} title="Xác nhận chi trả" maxWidth="380px">
        <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Đánh dấu tất cả hoa hồng đang chờ của CTV <b>{payTarget ? payTarget.fullName : ''}</b> là đã chi trả (chuyển ra ngoài hệ thống thủ công)?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="md" onClick={() => setPayId(null)}>Hủy</Button>
          <Button variant="primary" size="md" onClick={doPay} loading={markPaid.isPending}>Xác nhận chi trả</Button>
        </div>
      </Modal>

      <style>{'@keyframes bs-spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
