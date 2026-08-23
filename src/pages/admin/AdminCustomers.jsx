import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminCustomers, useUpdateCustomerStatus, useAdminCustomerDetail } from '../../services/adminCustomers.js';
import { SearchField, Select, Badge, IconButton } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';

const STATUS_OPTS = ['Tất cả', 'Hoạt động', 'Đã khóa', 'Chưa xác thực'];
const STATUS_VAL = { 'Hoạt động': 'active', 'Đã khóa': 'locked', 'Chưa xác thực': 'unverified' };
const STATUS_LABEL = { active: 'Hoạt động', locked: 'Đã khóa', unverified: 'Chưa xác thực' };
const STATUS_COLOR = { active: 'var(--status-success-ink)', locked: 'var(--status-danger)', unverified: 'var(--text-muted)' };

export default function AdminCustomers({ st, setSt, notify }) {
  const adminQ = (st.adminQ || '').trim();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [confirmLock, setConfirmLock] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { data, isLoading, isError, refetch } = useAdminCustomers({ status, q: adminQ || undefined, page, perPage: 20 });
  const updateStatus = useUpdateCustomerStatus();

  const result = data ?? { items: [], total: 0, page: 1, perPage: 20 };
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

  const handleToggle = (c) => {
    const next = c.status === 'locked' ? 'active' : 'locked';
    const verb = next === 'locked' ? 'khóa' : 'mở khóa';
    const warning = next === 'locked'
      ? `Khóa tài khoản "${c.email || c.fullName}" sẽ chấm dứt toàn bộ phiên đăng nhập hiện tại của khách hàng này.`
      : `Mở khóa tài khoản "${c.email || c.fullName}" — khách hàng sẽ có thể đăng nhập trở lại.`;

    setConfirmLock({ id: c.id, next, verb, warning });
  };

  const doToggle = () => {
    if (!confirmLock || updatingId) return;
    setUpdatingId(confirmLock.id);
    updateStatus.mutate({ id: confirmLock.id, status: confirmLock.next }, {
      onSuccess: () => { toast.success(`Đã ${confirmLock.verb} tài khoản`); setUpdatingId(null); },
      onError: (e) => { toast.error(e?.message || `Lỗi ${confirmLock.verb} tài khoản`); setUpdatingId(null); },
    });
    setConfirmLock(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <style>{'@keyframes bsd-spin { to { transform: rotate(360deg); } } .bsd-spin { animation: bsd-spin 0.8s linear infinite; }'}</style>
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
          <div key={c.id} onClick={() => setDetailId(c.id)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setDetailId(c.id); } }}
            style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', cursor: 'pointer' }}>
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
            <span style={{ flex: '0 0 88px' }} onClick={(e) => e.stopPropagation()}>
              {updatingId === c.id ? (
                <Loader2 size={20} className="bsd-spin" style={{ color: 'var(--text-muted)', margin: '8px 0' }} />
              ) : (
                <Button variant="ghost" size="sm" onClick={() => handleToggle(c)}>
                  {c.status === 'locked' ? 'Mở khóa' : 'Khóa'}
                </Button>
              )}
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

      <Modal open={!!confirmLock} onClose={() => setConfirmLock(null)} title={`Xác nhận ${confirmLock?.verb} tài khoản`} maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{confirmLock?.warning}</p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="md" onClick={() => setConfirmLock(null)}>Hủy</Button>
            <Button variant={confirmLock?.next === 'locked' ? 'danger' : 'primary'} size="md" onClick={doToggle} disabled={!!updatingId}>{updatingId ? 'Đang xử lý…' : 'Xác nhận'}</Button>
          </div>
        </div>
      </Modal>

      {!!detailId && <CustomerDetailDrawer id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

const ELEMENT_LABEL = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };
const GENDER_LABEL = { male: 'Nam', female: 'Nữ', other: 'Khác' };
const CONTACT_STATUS_LABEL = { new: 'Mới', consulting: 'Đang tư vấn', closed: 'Đã chốt' };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—');
const fmtVnd = (n) => (n == null ? null : Number(n).toLocaleString('vi-VN') + 'đ');

function DrawerSection({ title, count, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{title}{count != null ? ` (${count})` : ''}</span>
      {children}
    </div>
  );
}

function CustomerDetailDrawer({ id, onClose }) {
  const { data, isLoading, isError } = useAdminCustomerDetail(id);

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--overlay-scrim)', animation: 'fadeIn 140ms var(--ease-out)' }} />
      <div style={{
        position: 'relative', width: 'min(480px, 100vw)', height: '100%', background: 'var(--white)',
        boxShadow: 'var(--shadow-4)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 220ms var(--ease-out)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', flexShrink: 0 }}>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chi tiết khách hàng</span>
          <IconButton name="x" label="Đóng" onClick={onClose} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {isLoading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>Đang tải...</div>}
          {isError && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>Lỗi tải dữ liệu.</div>}

          {data && (
            <>
              {/* Hồ sơ cơ bản */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <span style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>{data.fullName || 'Chưa đặt tên'}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <Badge tone={data.status === 'active' ? 'mint' : 'rose'}>{data.status === 'active' ? 'Hoạt động' : 'Đã khóa'}</Badge>
                  <Badge tone={data.emailVerified ? 'mint' : 'neutral'}>{data.emailVerified ? 'Email đã xác thực' : 'Email chưa xác thực'}</Badge>
                  {data.fengShuiElement && <Badge tone="amber">Mệnh {ELEMENT_LABEL[data.fengShuiElement] || data.fengShuiElement}</Badge>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4, font: 'var(--type-body-sm)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email: <span style={{ color: 'var(--text-strong)' }}>{data.email || '—'}</span></span>
                  <span style={{ color: 'var(--text-muted)' }}>SĐT: <span style={{ color: 'var(--text-strong)' }}>{data.phone || '—'}</span></span>
                  <span style={{ color: 'var(--text-muted)' }}>Ngày sinh: <span style={{ color: 'var(--text-strong)' }}>{fmtDate(data.birthDate)}</span></span>
                  <span style={{ color: 'var(--text-muted)' }}>Giới tính: <span style={{ color: 'var(--text-strong)' }}>{GENDER_LABEL[data.gender] || '—'}</span></span>
                  <span style={{ color: 'var(--text-muted)' }}>Đăng ký: <span style={{ color: 'var(--text-strong)' }}>{fmtDate(data.createdAt)}</span></span>
                  <span style={{ color: 'var(--text-muted)' }}>Đăng nhập gần nhất: <span style={{ color: 'var(--text-strong)' }}>{fmtDateTime(data.lastLoginAt)}</span></span>
                </div>
              </div>

              <DrawerSection title="Biển yêu thích" count={data.favorites.length}>
                {data.favorites.length === 0 ? <EmptyRow /> : data.favorites.map((f) => (
                  <RowCard key={f.plateId}
                    left={f.plateNumber}
                    right={fmtVnd(f.currentPrice)}
                    sub={`Lưu lúc ${fmtVnd(f.priceSnapshot)} · ${fmtDate(f.createdAt)}`} />
                ))}
              </DrawerSection>

              <DrawerSection title="Biển xem nhiều nhất" count={data.topViewedPlates.length}>
                {data.topViewedPlates.length === 0 ? <EmptyRow /> : data.topViewedPlates.map((v) => (
                  <RowCard key={v.plateId} left={v.plateNumber} right={`${v.viewCount} lượt`} sub={`Xem gần nhất ${fmtDateTime(v.lastViewedAt)}`} />
                ))}
              </DrawerSection>

              <DrawerSection title="Liên hệ / đặt cọc" count={data.contactRequests.length}>
                {data.contactRequests.length === 0 ? <EmptyRow /> : data.contactRequests.map((c) => (
                  <RowCard key={c.id}
                    left={c.plateNumber || 'Liên hệ chung'}
                    right={<Badge tone={c.status === 'closed' ? 'mint' : c.status === 'consulting' ? 'blue' : 'neutral'}>{CONTACT_STATUS_LABEL[c.status] || c.status}</Badge>}
                    sub={`${c.intent === 'deposit' ? 'Đặt cọc' : 'Hỏi mua'}${c.depositAmount ? ' · ' + fmtVnd(c.depositAmount) : ''} · ${fmtDate(c.createdAt)}`} />
                ))}
              </DrawerSection>

              <DrawerSection title="Lịch sử tra cứu phong thủy" count={data.fengShuiLookups.length}>
                {data.fengShuiLookups.length === 0 ? <EmptyRow /> : data.fengShuiLookups.map((h, i) => (
                  <RowCard key={i} left={`Mệnh ${ELEMENT_LABEL[h.element] || h.element}`} right={fmtDate(h.birthDate)} sub={fmtDateTime(h.createdAt)} />
                ))}
              </DrawerSection>

              <DrawerSection title="Tìm kiếm đã lưu" count={data.savedSearches.length}>
                {data.savedSearches.length === 0 ? <EmptyRow /> : data.savedSearches.map((s) => (
                  <RowCard key={s.id} left={s.name} right={s.notifyEnabled ? 'Có thông báo' : 'Tắt thông báo'} sub={fmtDate(s.createdAt)} />
                ))}
              </DrawerSection>

              <DrawerSection title="Thông báo đã nhận" count={data.notifications.length}>
                {data.notifications.length === 0 ? <EmptyRow /> : data.notifications.map((n) => (
                  <RowCard key={n.id} left={n.title || n.type} right={n.read ? 'Đã đọc' : 'Chưa đọc'} sub={fmtDateTime(n.createdAt)} />
                ))}
              </DrawerSection>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RowCard({ left, right, sub }) {
  return (
    <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{left}</span>
        <span style={{ flexShrink: 0, color: 'var(--text-muted)' }}>{right}</span>
      </div>
      {sub && <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{sub}</span>}
    </div>
  );
}

function EmptyRow() {
  return <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Chưa có dữ liệu.</span>;
}
