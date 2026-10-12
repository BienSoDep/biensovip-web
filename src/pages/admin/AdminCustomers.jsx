import { useState, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  Loader2,
  Users,
  UserCheck,
  UserX,
  MailQuestion,
  Search,
  X,
  RotateCw,
  Download,
  Phone,
  MessageSquare,
  Copy,
  Check,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Eye,
  Heart,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAdminCustomers,
  useUpdateCustomerStatus,
  useResetCustomerPassword,
  useRequestDeleteUserOtp,
  useDeleteUser
} from '../../services/adminCustomers.js';
import CustomerDetailDrawer from './customers/CustomerDetailDrawer.jsx';
import { formatDate } from '../../lib/date.js';
import { Badge, Input, Select, TableColumnMenu, TableSortHeader, useTableColumns, sortTableItems } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import OtpBoxes from '../../components/OtpBoxes.jsx';
import Pagination from '../../components/Pagination.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { toZaloUrl } from '../../lib/zaloMessage.js';
import { useExportCsv } from '../../hooks/useExportCsv.js';

const CUSTOMER_COLUMNS = [
  { key: 'customer', label: 'Khách hàng / Email', default: true },
  { key: 'phone', label: 'Số điện thoại', default: true },
  { key: 'verified', label: 'Xác thực email', default: true },
  { key: 'favorites', label: 'Yêu thích', default: true },
  { key: 'createdAt', label: 'Ngày đăng ký', default: true },
  { key: 'status', label: 'Trạng thái', default: true },
  { key: 'actions', label: 'Hành động', default: true },
];

const PHONE_FILTER_OPTS = [
  { value: 'all', label: 'Mọi SĐT' },
  { value: 'has_phone', label: 'Đã có SĐT' },
  { value: 'no_phone', label: 'Chưa có SĐT' },
];

const VERIFIED_FILTER_OPTS = [
  { value: 'all', label: 'Mọi xác thực' },
  { value: 'verified', label: 'Đã xác thực email' },
  { value: 'unverified', label: 'Chưa xác thực email' },
];

const STATUS_OPTS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'unverified', label: 'Chưa xác thực' },
  { value: 'locked', label: 'Đã khóa' }
];
const STATUS_LABEL = { active: 'Hoạt động', locked: 'Đã khóa', unverified: 'Chưa xác thực' };
const STATUS_COLOR = { active: 'var(--intent-success)', locked: 'var(--intent-danger)', unverified: 'var(--text-muted)' };

// Tạo avatar màu sắc ngẫu nhiên nhưng nhất quán theo tên
function getAvatarBg(str = '') {
  const colors = [
    'linear-gradient(135deg, #2563eb, #1d4ed8)',
    'linear-gradient(135deg, #059669, #047857)',
    'linear-gradient(135deg, #d97706, #b45309)',
    'linear-gradient(135deg, #7c3aed, #6d28d9)',
    'linear-gradient(135deg, #db2777, #be185d)',
    'linear-gradient(135deg, #0891b2, #0e7490)',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function AdminCustomers({ st, setSt, notify }) {
  const adminQ = (st.adminQ || '').trim();
  const [debouncedQ] = useDebouncedValue(adminQ, 300);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [confirmLock, setConfirmLock] = useState(null);
  const [lockReason, setLockReason] = useState('');
  const [sendLockEmail, setSendLockEmail] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label }
  const [deletePhase, setDeletePhase] = useState('warn'); // 'warn' → gửi mã; 'otp' → nhập mã
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteErr, setDeleteErr] = useState('');
  const isSuperAdmin = st.user?.role === 'super-admin';

  const { data, isLoading, isError, refetch, isFetching } = useAdminCustomers({
    status,
    q: debouncedQ || undefined,
    page,
    perPage: 20
  });
  const updateStatus = useUpdateCustomerStatus();
  const { exportCsv, loading: exporting } = useExportCsv('/api/admin/customers');
  const requestDeleteOtp = useRequestDeleteUserOtp();
  const deleteUser = useDeleteUser();

  // Đổi mật khẩu hộ ngay từ bảng list
  const resetPassword = useResetCustomerPassword();
  const [pwTarget, setPwTarget] = useState(null); // { id, label }
  const [pwValue, setPwValue] = useState('');
  const [pwErr, setPwErr] = useState('');

  const openResetPassword = (c) => {
    setPwValue('');
    setPwErr('');
    setPwTarget({ id: c.id, label: c.fullName || c.email });
  };

  const confirmResetPassword = () => {
    if (!pwValue || pwValue.length < 6) {
      setPwErr('Mật khẩu tối thiểu 6 ký tự.');
      return;
    }
    resetPassword.mutate(
      { id: pwTarget.id, newPassword: pwValue },
      {
        onSuccess: () => {
          toast.success('Đã đổi mật khẩu. Hãy gửi mật khẩu mới cho khách qua kênh an toàn.');
          setPwTarget(null);
        },
        onError: (e) => setPwErr(e.message || 'Lỗi khi đổi mật khẩu.'),
      }
    );
  };

  const result = data ?? { items: [], total: 0, page: 1, perPage: 20 };
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

  const [phoneFilter, setPhoneFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : { key: '', dir: '' };
      }
      return { key, dir: 'asc' };
    });
  };

  const { cols, toggleCol, selectAll, deselectAll, resetDefault, isVisible } = useTableColumns({
    storageKey: 'bsv.admin.customerCols',
    columns: CUSTOMER_COLUMNS,
  });

  const processedItems = useMemo(() => {
    let list = result.items || [];
    if (phoneFilter === 'has_phone') list = list.filter((c) => Boolean(c.phone));
    if (phoneFilter === 'no_phone') list = list.filter((c) => !c.phone);
    if (verifiedFilter === 'verified') list = list.filter((c) => Boolean(c.isVerified));
    if (verifiedFilter === 'unverified') list = list.filter((c) => !c.isVerified);
    return sortTableItems(list, sort.key, sort.dir, {
      customer: (c) => c.fullName || c.email || '',
      phone: (c) => c.phone || '',
      verified: (c) => (c.isVerified ? 1 : 0),
      favorites: (c) => c.favoritesCount || 0,
      createdAt: (c) => c.createdAt || '',
      status: (c) => c.status || '',
    });
  }, [result.items, phoneFilter, verifiedFilter, sort]);

  // Thống kê nhanh từ danh sách hiện tại
  const stats = useMemo(() => {
    const items = result.items || [];
    const active = items.filter((i) => i.status === 'active').length;
    const locked = items.filter((i) => i.status === 'locked').length;
    const unverified = items.filter((i) => !i.isVerified || i.status === 'unverified').length;
    return { total: result.total, active, locked, unverified };
  }, [result]);

  const copyText = (e, text, id, label) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Đã sao chép ${label}: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggle = (c) => {
    const next = c.status === 'locked' ? 'active' : 'locked';
    const verb = next === 'locked' ? 'khóa' : 'mở khóa';
    const warning = next === 'locked'
      ? `Khóa tài khoản "${c.email || c.fullName}" sẽ lập tức chấm dứt toàn bộ phiên đăng nhập hiện tại của khách hàng này.`
      : `Mở khóa tài khoản "${c.email || c.fullName}" — khách hàng sẽ có thể đăng nhập trở lại bình thường.`;

    setLockReason('');
    setSendLockEmail(false);
    setConfirmLock({ id: c.id, next, verb, warning, hasEmail: !!c.email });
  };

  const doToggle = () => {
    if (!confirmLock || updatingId) return;
    setUpdatingId(confirmLock.id);
    updateStatus.mutate(
      {
        id: confirmLock.id,
        status: confirmLock.next,
        reason: confirmLock.next === 'locked' ? lockReason.trim() || undefined : undefined,
        sendEmail: confirmLock.next === 'locked' && sendLockEmail
      },
      {
        onSuccess: () => {
          toast.success(`Đã ${confirmLock.verb} tài khoản`);
          setUpdatingId(null);
        },
        onError: (e) => {
          toast.error(e?.message || `Lỗi ${confirmLock.verb} tài khoản`);
          setUpdatingId(null);
        },
      }
    );
    setConfirmLock(null);
  };

  const openDelete = (c) => {
    setDeletePhase('warn');
    setDeleteCode('');
    setDeleteErr('');
    setConfirmDelete({ id: c.id, label: c.email || c.fullName || c.id });
  };
  const closeDelete = () => setConfirmDelete(null);

  const sendDeleteOtp = () => {
    if (!confirmDelete) return;
    setDeleteErr('');
    requestDeleteOtp.mutate(confirmDelete.id, {
      onSuccess: () => setDeletePhase('otp'),
      onError: (e) => setDeleteErr(e.message || 'Không gửi được mã xác nhận.'),
    });
  };

  const confirmDeleteUser = () => {
    if (!confirmDelete || deleteCode.length !== 6) {
      setDeleteErr('Nhập đủ 6 chữ số.');
      return;
    }
    setDeleteErr('');
    deleteUser.mutate(
      { id: confirmDelete.id, code: deleteCode },
      {
        onSuccess: () => {
          toast.success('Đã xóa tài khoản vĩnh viễn');
          closeDelete();
        },
        onError: (e) => setDeleteErr(e.message || 'Xóa thất bại.'),
      }
    );
  };

  const clearFilters = () => {
    setSt((s) => ({ ...s, adminQ: '' }));
    setStatus('all');
    setPhoneFilter('all');
    setVerifiedFilter('all');
    setPage(1);
  };

  const hasActiveFilters = !!adminQ || status !== 'all' || phoneFilter !== 'all' || verifiedFilter !== 'all';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <style>{`
        @keyframes bsd-spin { to { transform: rotate(360deg); } }
        .bsd-spin { animation: bsd-spin 0.8s linear infinite; }
        .customer-row:hover { background: var(--surface-sunken) !important; }
      `}</style>

      {/* KPI Cards Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        {/* Tổng số khách */}
        <div
          onClick={() => { setStatus('all'); setPage(1); }}
          style={{
            background: 'var(--white)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            border: status === 'all' ? '1.5px solid var(--action-primary)' : '1px solid var(--border-hairline)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            transition: 'all 140ms ease'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng khách hàng</div>
            <div style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)', fontWeight: 700 }}>{result.total}</div>
          </div>
        </div>

        {/* Hoạt động */}
        <div
          onClick={() => { setStatus('active'); setPage(1); }}
          style={{
            background: 'var(--white)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            border: status === 'active' ? '1.5px solid var(--intent-success)' : '1px solid var(--border-hairline)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            transition: 'all 140ms ease'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--intent-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={20} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang hoạt động</div>
            <div style={{ font: 'var(--type-title-2)', color: 'var(--intent-success)', fontWeight: 700 }}>
              {status === 'active' ? result.total : `${stats.active} trên trang`}
            </div>
          </div>
        </div>

        {/* Chưa xác thực */}
        <div
          onClick={() => { setStatus('unverified'); setPage(1); }}
          style={{
            background: 'var(--white)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            border: status === 'unverified' ? '1.5px solid #d97706' : '1px solid var(--border-hairline)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            transition: 'all 140ms ease'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(217, 119, 6, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MailQuestion size={20} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chưa xác thực email</div>
            <div style={{ font: 'var(--type-title-2)', color: '#d97706', fontWeight: 700 }}>
              {status === 'unverified' ? result.total : `${stats.unverified} trên trang`}
            </div>
          </div>
        </div>

        {/* Đã khóa */}
        <div
          onClick={() => { setStatus('locked'); setPage(1); }}
          style={{
            background: 'var(--white)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            border: status === 'locked' ? '1.5px solid var(--intent-danger)' : '1px solid var(--border-hairline)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            transition: 'all 140ms ease'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--intent-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserX size={20} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tài khoản bị khóa</div>
            <div style={{ font: 'var(--type-title-2)', color: 'var(--intent-danger)', fontWeight: 700 }}>
              {status === 'locked' ? result.total : `${stats.locked} trên trang`}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tìm kiếm, Bộ lọc & Công cụ */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        alignItems: 'center',
        background: 'var(--white)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)'
      }}>
        {/* Search input with icon */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 240px',
          maxWidth: 380,
          background: 'var(--surface-sunken)',
          borderRadius: 'var(--radius-field)',
          border: '1px solid var(--border-hairline)',
          padding: '0 10px'
        }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginRight: 8 }} />
          <input
            type="text"
            placeholder="Tìm theo email, họ tên hoặc SĐT…"
            value={st.adminQ || ''}
            onChange={(e) => {
              setSt((s) => ({ ...s, adminQ: e.target.value }));
              setPage(1);
            }}
            style={{
              width: '100%',
              height: 36,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              font: 'var(--type-body-sm)',
              color: 'var(--text-strong)'
            }}
          />
          {adminQ && (
            <button
              type="button"
              onClick={() => { setSt((s) => ({ ...s, adminQ: '' })); setPage(1); }}
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tab lọc trạng thái */}
        <div style={{ display: 'inline-flex', background: 'var(--surface-sunken)', padding: 3, borderRadius: 'var(--radius-pill)', gap: 2 }}>
          {STATUS_OPTS.map((opt) => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setStatus(opt.value); setPage(1); }}
                style={{
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  font: 'var(--type-label)',
                  cursor: 'pointer',
                  background: active ? 'var(--white)' : 'transparent',
                  color: active ? 'var(--text-strong)' : 'var(--text-muted)',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  fontWeight: active ? 600 : 500,
                  transition: 'all 120ms ease'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Lọc danh mục: Số điện thoại */}
        <div style={{ minWidth: 120 }}>
          <Select
            label=""
            value={phoneFilter}
            options={PHONE_FILTER_OPTS}
            onChange={(v) => setPhoneFilter(v)}
          />
        </div>

        {/* Lọc danh mục: Xác thực email */}
        <div style={{ minWidth: 150 }}>
          <Select
            label=""
            value={verifiedFilter}
            options={VERIFIED_FILTER_OPTS}
            onChange={(v) => setVerifiedFilter(v)}
          />
        </div>

        {/* Tùy chọn ẩn / hiện cột */}
        <TableColumnMenu
          columns={CUSTOMER_COLUMNS}
          cols={cols}
          toggleCol={toggleCol}
          selectAll={selectAll}
          deselectAll={deselectAll}
          resetDefault={resetDefault}
        />

        {/* Clear filter */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} style={{ color: 'var(--text-muted)' }}>
            <X size={14} style={{ marginRight: 4 }} /> Xóa bộ lọc
          </Button>
        )}

        <div style={{ flex: 1 }} />

        {/* Nút Làm mới */}
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => refetch()}
          title="Tải lại danh sách khách hàng"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RotateCw size={14} className={isFetching ? 'bsd-spin' : ''} />
          Làm mới
        </Button>

        {/* Nút Xuất CSV */}
        <Button
          variant="outline"
          size="sm"
          disabled={exporting}
          onClick={() => exportCsv({ status, q: adminQ || undefined }).catch((e) => notify?.(e.message))}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Download size={14} />
          {exporting ? 'Đang xuất…' : 'Xuất CSV'}
        </Button>

        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          <b>{processedItems.length}</b> / {result.total} khách hàng
        </span>
      </div>

      {/* Danh sách Khách hàng */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div className="admin-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 990 }}>
            {/* Table Header với SortHeader */}
            <div style={{
              display: 'flex',
              gap: 'var(--space-3)',
              padding: '12px var(--gutter-card)',
              background: 'var(--surface-sunken)',
              font: 'var(--type-caption)',
              fontSize: 'var(--fs-micro)',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-hairline)'
            }}>
              {isVisible('customer') && (
                <span style={{ flex: '1 1 200px' }}>
                  <TableSortHeader sort={sort} onSort={toggleSort} sortKey="customer" label="Khách hàng / Email" />
                </span>
              )}
              {isVisible('phone') && (
                <span style={{ flex: '1 1 140px' }}>
                  <TableSortHeader sort={sort} onSort={toggleSort} sortKey="phone" label="Số điện thoại" />
                </span>
              )}
              {isVisible('verified') && (
                <span style={{ flex: '0 0 100px' }}>
                  <TableSortHeader sort={sort} onSort={toggleSort} sortKey="verified" label="Xác thực email" />
                </span>
              )}
              {isVisible('favorites') && (
                <span style={{ flex: '0 0 90px', textAlign: 'center' }}>
                  <TableSortHeader sort={sort} onSort={toggleSort} sortKey="favorites" label="Yêu thích" align="center" />
                </span>
              )}
              {isVisible('createdAt') && (
                <span style={{ flex: '0 0 100px' }}>
                  <TableSortHeader sort={sort} onSort={toggleSort} sortKey="createdAt" label="Ngày đăng ký" />
                </span>
              )}
              {isVisible('status') && (
                <span style={{ flex: '0 0 110px' }}>
                  <TableSortHeader sort={sort} onSort={toggleSort} sortKey="status" label="Trạng thái" />
                </span>
              )}
              {isVisible('actions') && (
                <span style={{ flex: '0 0 270px', textAlign: 'right' }}>Hành động</span>
              )}
            </div>

            {/* Skeleton Loading */}
            {isLoading && <div style={{ padding: 'var(--gutter-card)' }}><SkeletonTable rows={6} cols={6} /></div>}

            {/* Lỗi tải */}
            {isError && (
              <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
                <AlertCircle size={32} style={{ color: 'var(--intent-danger)' }} />
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Lỗi tải dữ liệu khách hàng. Vui lòng thử lại.</span>
                <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
              </div>
            )}

            {/* Danh sách dữ liệu */}
            {!isLoading && !isError && processedItems.map((c) => {
              const displayName = c.fullName || c.email || 'Khách vãng lai';
              const firstLetter = (c.fullName?.[0] || c.email?.[0] || 'K').toUpperCase();
              const avatarBg = getAvatarBg(c.email || c.fullName || String(c.id));
              const zaloUrl = c.phone ? toZaloUrl(c.phone) : null;

              return (
                <div
                  key={c.id}
                  onClick={() => setDetailId(c.id)}
                  role="button"
                  tabIndex={0}
                  className="customer-row"
                  onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      setDetailId(c.id);
                    }
                  }}
                  style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    alignItems: 'center',
                    padding: '12px var(--gutter-card)',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 120ms ease'
                  }}
                >
                  {/* Email & Tên with Avatar */}
                  {isVisible('customer') && (
                    <div style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: avatarBg,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {firstLetter}
                      </div>
                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ font: 'var(--type-body-strong)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.fullName || c.email}
                          </span>
                          {c.email && (
                            <button
                              type="button"
                              onClick={(e) => copyText(e, c.email, `email-${c.id}`, 'Email')}
                              title="Sao chép email"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 2,
                                cursor: 'pointer',
                                color: copiedId === `email-${c.id}` ? 'var(--intent-success)' : 'var(--text-muted)'
                              }}
                            >
                              {copiedId === `email-${c.id}` ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.fullName ? c.email : `ID: #${c.id}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Số điện thoại & Quick Call/Zalo */}
                  {isVisible('phone') && (
                    <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                      {c.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', letterSpacing: '0.01em' }}>
                            {c.phone}
                          </span>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => copyText(e, c.phone, `phone-${c.id}`, 'SĐT')}
                              title="Sao chép SĐT"
                              style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: copiedId === `phone-${c.id}` ? 'var(--intent-success)' : 'var(--text-muted)' }}
                            >
                              {copiedId === `phone-${c.id}` ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                            <a
                              href={`tel:${c.phone}`}
                              title="Gọi điện"
                              style={{ color: 'var(--brand-primary)', display: 'inline-flex', alignItems: 'center', padding: 2 }}
                            >
                              <Phone size={12} />
                            </a>
                            {zaloUrl && (
                              <a
                                href={zaloUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat Zalo"
                                style={{ color: '#0068ff', display: 'inline-flex', alignItems: 'center', padding: 2 }}
                              >
                                <MessageSquare size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', fontStyle: 'italic' }}>Chưa cập nhật</span>
                      )}
                    </div>
                  )}

                  {/* Xác thực Email */}
                  {isVisible('verified') && (
                    <div style={{ flex: '0 0 100px' }}>
                      <Badge tone={c.isVerified ? 'mint' : 'neutral'}>
                        {c.isVerified ? 'Đã xác thực' : 'Chưa'}
                      </Badge>
                    </div>
                  )}

                  {/* Yêu thích */}
                  {isVisible('favorites') && (
                    <div style={{ flex: '0 0 90px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Heart size={13} style={{ color: c.favoritesCount > 0 ? '#ef4444' : 'var(--text-faint)' }} />
                      <span style={{ font: 'var(--type-body-sm)', color: c.favoritesCount > 0 ? 'var(--text-strong)' : 'var(--text-faint)', fontWeight: c.favoritesCount > 0 ? 600 : 400 }}>
                        {c.favoritesCount || 0}
                      </span>
                    </div>
                  )}

                  {/* Ngày đăng ký */}
                  {isVisible('createdAt') && (
                    <div style={{ flex: '0 0 100px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      {formatDate(c.createdAt)}
                    </div>
                  )}

                  {/* Trạng thái tài khoản */}
                  {isVisible('status') && (
                    <div style={{ flex: '0 0 110px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-pill)',
                        font: 'var(--type-caption)',
                        fontSize: 'var(--fs-micro)',
                        fontWeight: 'var(--fw-semibold)',
                        background: (STATUS_COLOR[c.status] || 'var(--grey-400)') + '15',
                        color: STATUS_COLOR[c.status] || 'var(--text-muted)'
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[c.status] || 'var(--text-muted)' }} />
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </div>
                  )}

                  {/* Cột Hành động */}
                  {isVisible('actions') && (
                    <div
                      style={{
                        flex: '0 0 270px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 6,
                        flexShrink: 0,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Nút Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => setDetailId(c.id)}
                        title="Xem chi tiết hồ sơ"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          height: 28,
                          padding: '0 8px',
                          borderRadius: 'var(--radius-field)',
                          border: '1px solid var(--border-hairline)',
                          background: 'var(--white)',
                          color: 'var(--text-strong)',
                          font: 'var(--type-caption)',
                          fontSize: 12,
                          fontWeight: 'var(--fw-medium)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={13} style={{ flexShrink: 0 }} /> Chi tiết
                      </button>

                      {/* Nút Khóa / Mở khóa */}
                      {updatingId === c.id ? (
                        <div style={{ width: 56, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                          <Loader2 size={16} className="bsd-spin" style={{ color: 'var(--text-muted)' }} />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggle(c)}
                          title={c.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            height: 28,
                            padding: '0 8px',
                            borderRadius: 'var(--radius-field)',
                            border: '1px solid var(--border-hairline)',
                            background: 'var(--white)',
                            color: c.status === 'locked' ? 'var(--intent-success)' : 'var(--text-strong)',
                            font: 'var(--type-caption)',
                            fontSize: 12,
                            fontWeight: 'var(--fw-medium)',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            cursor: 'pointer',
                          }}
                        >
                          {c.status === 'locked' ? <Unlock size={13} style={{ flexShrink: 0 }} /> : <Lock size={13} style={{ flexShrink: 0 }} />}
                          {c.status === 'locked' ? 'Mở' : 'Khóa'}
                        </button>
                      )}

                      {/* Nút Đổi mật khẩu */}
                      <button
                        type="button"
                        onClick={() => openResetPassword(c)}
                        title="Đặt lại mật khẩu hộ khách hàng"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          height: 28,
                          padding: '0 8px',
                          borderRadius: 'var(--radius-field)',
                          border: '1px solid var(--border-hairline)',
                          background: 'var(--white)',
                          color: 'var(--text-strong)',
                          font: 'var(--type-caption)',
                          fontSize: 12,
                          fontWeight: 'var(--fw-medium)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          cursor: 'pointer',
                        }}
                      >
                        <KeyRound size={13} style={{ flexShrink: 0 }} /> Đổi MK
                      </button>

                      {/* Nút Xóa (Super admin) */}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => openDelete(c)}
                          title="Xóa vĩnh viễn tài khoản (Super admin)"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 28,
                            width: 28,
                            padding: 0,
                            borderRadius: 'var(--radius-field)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            background: 'rgba(239, 68, 68, 0.06)',
                            color: 'var(--intent-danger)',
                            flexShrink: 0,
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} style={{ flexShrink: 0 }} />
                        </button>
                      )}
                    </div>
                  )}                </div>
              );
            })}
          </div>
        </div>

        {/* Trạng thái rỗng */}
        {!isLoading && !isError && result.items.length === 0 && (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Users size={36} style={{ color: 'var(--text-faint)' }} />
            <span style={{ font: 'var(--type-body-strong)', color: 'var(--text-strong)' }}>
              {hasActiveFilters ? 'Không tìm thấy khách hàng nào khớp bộ lọc' : 'Chưa có khách hàng nào đăng ký'}
            </span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              {hasActiveFilters ? 'Hãy thử đổi từ khóa tìm kiếm hoặc bỏ các tiêu chí lọc hiện tại.' : 'Khách hàng mới tạo tài khoản sẽ tự động xuất hiện tại đây.'}
            </span>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} style={{ marginTop: 'var(--space-2)' }}>
                Xóa bộ lọc tìm kiếm
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Phân trang Pagination chuẩn cửa sổ trượt */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--space-2) 0' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Trang <b>{page}</b> / <b>{totalPages}</b> (Hiển thị 20 khách hàng/trang)
          </span>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(p) => setPage(p)}
            size="sm"
          />
        </div>
      )}

      {/* Modal Xác nhận Khóa / Mở khóa tài khoản */}
      <Modal open={!!confirmLock} onClose={() => setConfirmLock(null)} title={`Xác nhận ${confirmLock?.verb} tài khoản`} maxWidth="440px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: confirmLock?.next === 'locked' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', padding: '12px 14px', borderRadius: 'var(--radius-field)' }}>
            {confirmLock?.next === 'locked' ? (
              <ShieldAlert size={20} style={{ color: 'var(--intent-danger)', flexShrink: 0, marginTop: 2 }} />
            ) : (
              <UserCheck size={20} style={{ color: 'var(--intent-success)', flexShrink: 0, marginTop: 2 }} />
            )}
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-strong)', lineHeight: 1.5 }}>
              {confirmLock?.warning}
            </p>
          </div>

          {confirmLock?.next === 'locked' && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, font: 'var(--type-label)', color: 'var(--text-strong)' }}>
                Lý do khóa tài khoản (khách sẽ thấy khi đăng nhập)
                <textarea
                  rows={3}
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="VD: Phát hiện hoạt động bất thường hoặc vi phạm quy định đặt cọc…"
                  style={{
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-field)',
                    padding: '8px 10px',
                    font: 'var(--type-body-sm)',
                    color: 'var(--text-strong)',
                    resize: 'vertical'
                  }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', color: confirmLock.hasEmail ? 'var(--text-strong)' : 'var(--text-faint)', cursor: confirmLock.hasEmail ? 'pointer' : 'default' }}>
                <input type="checkbox" checked={sendLockEmail} disabled={!confirmLock.hasEmail} onChange={(e) => setSendLockEmail(e.target.checked)} />
                Gửi email thông báo lý do + hướng dẫn liên hệ hỗ trợ Zalo{!confirmLock.hasEmail && ' (tài khoản này chưa có email)'}
              </label>
            </>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
            <Button variant="ghost" size="md" onClick={() => setConfirmLock(null)}>Hủy</Button>
            <Button variant={confirmLock?.next === 'locked' ? 'danger' : 'primary'} size="md" onClick={doToggle} disabled={!!updatingId}>
              {updatingId ? 'Đang xử lý…' : `Xác nhận ${confirmLock?.verb}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Drawer Chi tiết khách hàng */}
      {!!detailId && <CustomerDetailDrawer id={detailId} onClose={() => setDetailId(null)} notify={notify} />}

      {/* Modal Đổi mật khẩu hộ */}
      <Modal open={!!pwTarget} onClose={() => setPwTarget(null)} title="Đặt lại mật khẩu khách hàng" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Đặt mật khẩu mới cho <b>{pwTarget?.label}</b>. Khách hàng sẽ bị đăng xuất khỏi mọi phiên hiện tại.
          </p>
          <Input
            label="Mật khẩu mới"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            value={pwValue}
            error={pwErr}
            onChange={(e) => { setPwValue(e.target.value); setPwErr(''); }}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setPwTarget(null)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={confirmResetPassword} disabled={resetPassword.isPending}>
              {resetPassword.isPending ? 'Đang lưu…' : 'Đổi mật khẩu'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Xóa vĩnh viễn với xác thực OTP 2 lớp */}
      <Modal open={!!confirmDelete} onClose={closeDelete} title="Xóa vĩnh viễn tài khoản" maxWidth="440px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {deletePhase === 'warn' ? (
            <>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Bạn sắp xóa vĩnh viễn tài khoản <b>{confirmDelete?.label}</b>. Mọi thông tin cá nhân (email, SĐT, họ tên, danh sách yêu thích…) sẽ bị xóa và <b style={{ color: 'var(--status-danger)' }}>hoàn toàn không thể khôi phục</b>.
              </p>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px 12px', borderRadius: 'var(--radius-field)', font: 'var(--type-caption)', color: 'var(--status-danger)' }}>
                Hệ thống yêu cầu gửi mã xác nhận OTP 6 số về email của bạn (Super Admin) để xác thực hành động nguy hiểm này.
              </div>
              {deleteErr && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{deleteErr}</span>}
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <Button variant="ghost" size="md" onClick={closeDelete}>Hủy</Button>
                <Button variant="danger" size="md" onClick={sendDeleteOtp} disabled={requestDeleteOtp.isPending}>
                  {requestDeleteOtp.isPending ? 'Đang gửi…' : 'Gửi mã OTP xác nhận'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                Nhập mã 6 chữ số đã gửi về email của bạn để xác nhận xóa vĩnh viễn <b>{confirmDelete?.label}</b>.
              </p>
              <OtpBoxes value={deleteCode} onChange={(v) => { setDeleteCode(v); setDeleteErr(''); }} error={deleteErr} disabled={deleteUser.isPending} />
              {deleteErr && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{deleteErr}</span>}
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <Button variant="ghost" size="md" onClick={closeDelete}>Hủy</Button>
                <Button variant="danger" size="md" onClick={confirmDeleteUser} disabled={deleteUser.isPending}>
                  {deleteUser.isPending ? 'Đang xóa…' : 'Xác nhận xóa tài khoản'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
