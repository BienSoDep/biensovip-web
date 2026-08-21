import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAdminCustomers, useUpdateCustomerStatus } from '../../services/adminCustomers.js';
import { SearchField, Select, Badge } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';

const STATUS_OPTS = ['Tất cả', 'Hoạt động', 'Đã khóa', 'Chưa xác thực'];
const STATUS_VAL = { 'Hoạt động': 'active', 'Đã khóa': 'locked', 'Chưa xác thực': 'unverified' };
const STATUS_LABEL = { active: 'Hoạt động', locked: 'Đã khóa', unverified: 'Chưa xác thực' };
const STATUS_COLOR = { active: 'var(--status-success-ink)', locked: 'var(--status-danger)', unverified: 'var(--text-muted)' };

export default function AdminCustomers({ st, setSt, notify }) {
  const adminQ = (st.adminQ || '').trim();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [confirmLock, setConfirmLock] = useState(null);

  const { data, isLoading, isError, refetch } = useAdminCustomers({ status, q: adminQ || undefined, page, perPage: 20 });
  const updateStatus = useUpdateCustomerStatus();

  const result = data ?? { items: [], total: 0, page: 1, perPage: 20 };
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

  const handleToggle = (c) => {
    const next = c.status === 'active' ? 'locked' : 'active';
    const verb = next === 'locked' ? 'khóa' : 'mở khóa';
    const warning = next === 'locked'
      ? `Khóa tài khoản "${c.email || c.fullName}" sẽ chấm dứt toàn bộ phiên đăng nhập hiện tại của khách hàng này.`
      : `Mở khóa tài khoản "${c.email || c.fullName}" — khách hàng sẽ có thể đăng nhập trở lại.`;

    setConfirmLock({ id: c.id, next, verb, warning });
  };

  const doToggle = () => {
    if (!confirmLock) return;
    updateStatus.mutate({ id: confirmLock.id, status: confirmLock.next }, {
      onSuccess: () => toast.success(`Đã ${confirmLock.verb} tài khoản`),
      onError: (e) => toast.error(e?.message || `Lỗi ${confirmLock.verb} tài khoản`),
    });
    setConfirmLock(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
        <SearchField placeholder="Tìm theo email hoặc tên…" value={st.adminQ || ''} onChange={(e) => { setSt((s) => ({ ...s, adminQ: e.target.value })); setPage(1); }} width={260} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Trạng thái:</span>
          <Select value={status === 'all' ? 'Tất cả' : (STATUS_LABEL[status] || 'Chưa xác thực')} options={STATUS_OPTS.map((o) => ({ value: o, label: o }))} onChange={(v) => { setStatus(v === 'Tất cả' ? 'all' : STATUS_VAL[v]); setPage(1); }} variant="pill" />
        </div>
        <span style={{ flex: 1, font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'right' }}>{result.total} khách hàng</span>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 760 }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '1 1 160px' }}>Email / Tên</span>
          <span style={{ flex: '1 1 100px' }}>Điện thoại</span>
          <span style={{ flex: '1 1 72px' }}>Xác thực</span>
          <span style={{ flex: '1 1 72px' }}>Yêu thích</span>
          <span style={{ flex: '1 1 80px' }}>Ngày đăng ký</span>
          <span style={{ flex: '1 1 100px' }}>Trạng thái</span>
          <span style={{ flex: '0 0 88px' }}>Hành động</span>
        </div>

        {isLoading && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>}

        {isError && (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Lỗi tải dữ liệu. Vui lòng thử lại.</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
          </div>
        )}

        {!isLoading && !isError && result.items.map((c) => (
          <div key={c.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
            <span style={{ flex: '1 1 160px', minWidth: 0 }}>
              <span style={{ display: 'block', font: 'var(--type-title-3)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email || '—'}</span>
              <span style={{ display: 'block', font: 'var(--type-caption)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.fullName || '—'}</span>
            </span>
            <span style={{ flex: '1 1 100px', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{c.phone || '—'}</span>
            <span style={{ flex: '1 1 72px' }}>
              <Badge tone={c.isVerified ? 'mint' : 'neutral'}>{c.isVerified ? 'Đã xác thực' : 'Chưa'}</Badge>
            </span>
            <span style={{ flex: '1 1 72px', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{c.favoritesCount}</span>
            <span style={{ flex: '1 1 80px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '—'}
            </span>
            <span style={{ flex: '1 1 100px' }}>
              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)', background: (STATUS_COLOR[c.status] || 'var(--grey-400)') + '18', color: STATUS_COLOR[c.status] || 'var(--text-muted)' }}>
                {STATUS_LABEL[c.status] || c.status}
              </span>
            </span>
            <span style={{ flex: '0 0 88px' }}>
              <Button variant="ghost" size="sm" onClick={() => handleToggle(c)}>
                {c.status === 'locked' ? 'Mở khóa' : 'Khóa'}
              </Button>
            </span>
          </div>
        ))}
        </div>
        </div>

        {!isLoading && !isError && result.items.length === 0 && (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            {adminQ ? 'Không có khách hàng nào khớp tìm kiếm.' : 'Chưa có khách hàng nào đăng ký.'}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} style={{
              minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)',
              background: p === page ? 'var(--action-primary)' : 'var(--white)',
              color: p === page ? 'var(--white)' : 'var(--text-body)',
              font: 'var(--type-body-sm)', fontWeight: p === page ? 'var(--fw-bold)' : 'var(--fw-medium)',
              cursor: 'pointer', boxShadow: 'var(--shadow-inset-hairline)',
            }}>{p}</button>
          ))}
        </div>
      )}

      {!!confirmLock && (
        <div role="alertdialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div style={{ width: '100%', maxWidth: 400, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <h2 style={{ margin: 0, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Xác nhận {confirmLock.verb} tài khoản</h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{confirmLock.warning}</p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="md" onClick={() => setConfirmLock(null)}>Hủy</Button>
              <Button variant="primary" size="md" onClick={doToggle}>Xác nhận</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
