import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { Select } from '../../components/index.jsx';
import Modal from '../../components/Modal.jsx';
import AuditHistoryButton from '../../components/AuditHistoryButton.jsx';
import CollaboratorCommissionsModal from '../../components/CollaboratorCommissionsModal.jsx';
import { useAdminCollaborators, useUpdateCollaboratorStatus } from '../../services/adminCollaborators.js';
import { useZaloClickStats } from '../../services/zaloClicks.js';
import { useExportCsv } from '../../hooks/useExportCsv.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const STATUSES = ['active', 'locked']; // P1.1 bỏ 'pending' — đăng ký auto-active, không còn trạng thái chờ duyệt
const STATUS_LABEL = { active: 'Hoạt động', locked: 'Bị khóa' };
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
  const { exportCsv, loading: exporting } = useExportCsv('/api/admin/collaborators');
  const collabs = data?.items || [];
  const f = st.admCtv || 'Tất cả';
  const list = collabs.filter((c) => f === 'Tất cả' || c.status === f);
  const totalEarned = collabs.reduce((a, c) => a + (Number(c.commissionEarned) || 0), 0);
  const pendingPayout = collabs.reduce((a, c) => a + (Number(c.commissionPending) || 0), 0);
  const { data: zaloStats } = useZaloClickStats();

  const [updatingId, setUpdatingId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { id, to }
  const [reasonDraft, setReasonDraft] = useState('');
  const [detailCollab, setDetailCollab] = useState(null);
  const [rateDraft, setRateDraft] = useState({}); // { [id]: string (%) }

  const applyStatus = (id, v) => {
    setUpdatingId(id);
    updateStatus.mutate({ id, status: v, suspendReason: v === 'locked' ? (reasonDraft.trim() || undefined) : undefined }, {
      onSuccess: () => notify('Đã cập nhật trạng thái CTV'),
      onError: () => notify('Cập nhật trạng thái thất bại'),
      onSettled: () => { setUpdatingId(null); setConfirm(null); setReasonDraft(''); },
    });
  };

  const applyRate = (c) => {
    const raw = rateDraft[c.id];
    const pct = Number(raw);
    if (raw === undefined || raw === '' || Number.isNaN(pct) || pct < 0 || pct > 100) {
      notify('Hệ số hoa hồng phải là số từ 0-100');
      return;
    }
    setUpdatingId(c.id);
    updateStatus.mutate({ id: c.id, status: c.status, commissionRate: pct / 100 }, {
      onSuccess: () => notify('Đã cập nhật hệ số hoa hồng'),
      onError: () => notify('Cập nhật hệ số thất bại'),
      onSettled: () => setUpdatingId(null),
    });
  };

  if (isLoading) return <div style={{ padding: 'var(--gutter-card)' }}><SkeletonTable rows={5} cols={5} /></div>;
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
          ['Lượt bấm Nhắn Zalo', String(zaloStats?.totalClicks ?? 0), 'var(--action-primary)'],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <Select label="Trạng thái" value={f} options={[{ value: 'Tất cả', label: 'Tất cả' }, ...opts(STATUSES)]} onChange={(v) => patch({ admCtv: v })} />
        <Button variant="ghost" size="md" disabled={exporting} onClick={() => exportCsv({ q: adminQ || undefined }).catch((e) => notify(e.message))}>
          {exporting ? 'Đang xuất…' : 'Xuất CSV'}
        </Button>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 620 }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '1 1 120px' }}>Tên</span><span style={{ flex: '1 1 110px' }}>Điện thoại</span><span style={{ flex: '1 1 120px' }}>Mã giới thiệu</span><span style={{ flex: '1 1 96px' }}>Hoa hồng</span><span style={{ flex: '1 1 140px' }}>Hệ số %</span><span style={{ flex: '1 1 120px' }}>Trạng thái</span><span style={{ flex: '0 0 120px' }}>Chi trả</span>
        </div>
        {list.map((c) => (
          <div key={c.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
            <span style={{ flex: '1 1 120px', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{c.fullName}</span>
            <span style={{ flex: '1 1 110px', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{c.phone}</span>
            <span style={{ flex: '1 1 120px', font: 'var(--type-caption)', color: 'var(--text-body)' }}>{c.referralCode}</span>
            <span style={{ flex: '1 1 96px', font: 'var(--type-caption)', color: 'var(--text-strong)' }}>{money(c.commissionEarned)}</span>
            <span style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number" min="0" max="100" step="0.5"
                placeholder={c.commissionRate != null ? String(c.commissionRate * 100) : '5 (mặc định)'}
                value={rateDraft[c.id] ?? (c.commissionRate != null ? String(c.commissionRate * 100) : '')}
                onChange={(e) => setRateDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                style={{ width: 64, padding: '4px 6px', borderRadius: 'var(--radius-input)', border: '1px solid var(--border-hairline)', font: 'var(--type-caption)' }}
              />
              <button type="button" onClick={() => applyRate(c)} disabled={updatingId === c.id}
                title="Lưu hệ số hoa hồng riêng CTV này"
                style={{ border: 'none', borderRadius: 'var(--radius-pill)', padding: '4px 10px', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', background: 'var(--surface-tint-cream)', color: 'var(--action-primary)' }}>
                Lưu
              </button>
            </span>
            <span style={{ flex: '1 1 120px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ pointerEvents: updatingId === c.id ? 'none' : undefined, opacity: updatingId === c.id ? 0.6 : 1, display: 'inline-block' }}>
                  <Select value={c.status} options={opts(STATUSES)} onChange={(v) => setConfirm({ id: c.id, to: v })} variant="pill" style={{ whiteSpace: 'nowrap', color: 'var(--text-strong)' }} />
                </span>
                {updatingId === c.id && <span aria-hidden style={spinnerStyle} />}
              </span>
            </span>
            <span style={{ flex: '0 0 120px', display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => setDetailCollab(c)}
                title="Xem chi tiết hoa hồng"
                style={{ border: 'none', borderRadius: 'var(--radius-pill)', padding: '4px 12px', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', background: 'var(--surface-tint-cream)', color: 'var(--action-primary)' }}>
                Chi tiết
              </button>
            </span>
            <AuditHistoryButton entityType="collaborator" entityId={c.id} />
          </div>
        ))}
        </div>
        </div>
        {list.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có CTV nào khớp bộ lọc.</div>}
      </div>

      <Modal open={confirm != null} onClose={() => setConfirm(null)} title="Xác nhận đổi trạng thái" maxWidth="380px">
        <p style={{ margin: '0 0 var(--space-3)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Bạn có chắc muốn đổi trạng thái CTV này sang <b>{confirm ? STATUS_LABEL[confirm.to] || confirm.to : ''}</b>?
        </p>
        {confirm?.to === 'locked' && (
          <input
            type="text" maxLength={255} value={reasonDraft} onChange={(e) => setReasonDraft(e.target.value)}
            placeholder="Lý do khóa (ghi để lưu vết cho CTV)"
            style={{ width: '100%', marginBottom: 'var(--space-3)', padding: '8px 10px', borderRadius: 'var(--radius-input)', border: '1px solid var(--border-hairline)', font: 'var(--type-body-sm)' }}
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="md" onClick={() => setConfirm(null)}>Hủy</Button>
          <Button variant="primary" size="md" disabled={updatingId === confirm?.id} onClick={() => confirm && applyStatus(confirm.id, confirm.to)}>
            {updatingId === confirm?.id ? 'Đang cập nhật…' : 'Xác nhận'}
          </Button>
        </div>
      </Modal>

      <CollaboratorCommissionsModal collaborator={detailCollab} onClose={() => setDetailCollab(null)} notify={notify} />

      <style>{'@keyframes bs-spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
