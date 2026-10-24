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
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Filter,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  useAdminCustomers,
  useAdminCustomerStats,
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
  { key: 'source', label: 'Nguồn đăng ký', default: true },
  { key: 'phone', label: 'Số điện thoại', default: true },
  { key: 'verified', label: 'Xác thực email', default: true },
  { key: 'favorites', label: 'Yêu thích', default: true },
  { key: 'createdAt', label: 'Ngày đăng ký', default: true },
  { key: 'status', label: 'Trạng thái', default: true },
  { key: 'actions', label: 'Hành động', default: true },
];

const SOURCE_FILTER_OPTS = [
  { value: 'all', label: 'Mọi nguồn đăng ký' },
  { value: 'direct', label: 'Đăng ký trực tiếp' },
  { value: 'google', label: 'Google OAuth' },
  { value: 'referral', label: 'Giới thiệu CTV' },
  { value: 'quote_lead', label: 'Báo giá / Tư vấn' },
  { value: 'chat_lead', label: 'Trợ lý AI / Chat' },
  { value: 'newsletter', label: 'Bản tin / Tin tức' },
  { value: 'admin', label: 'Admin tạo' },
  { value: 'seed', label: 'Dữ liệu mẫu' },
];

const SOURCE_COLORS = {
  google: '#4285F4',
  direct: '#6B7280',
  referral: '#F59E0B',
  quote_lead: '#10B981',
  chat_lead: '#06B6D4',
  newsletter: '#EC4899',
  admin: '#8B5CF6',
  seed: '#64748B',
};

function renderSourceBadge(source) {
  const s = source || 'direct';
  if (s === 'google') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 'var(--fs-caption)',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 'var(--radius-pill)',
        background: '#eef2ff',
        color: '#4338ca',
        border: '1px solid #c7d2fe',
        whiteSpace: 'nowrap'
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        Google
      </span>
    );
  }
  if (s === 'referral') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 'var(--fs-caption)',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 'var(--radius-pill)',
        background: '#fffbeb',
        color: '#b45309',
        border: '1px solid #fde68a',
        whiteSpace: 'nowrap'
      }}>
        🤝 Giới thiệu CTV
      </span>
    );
  }
  if (s === 'quote_lead' || s === 'contact') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 'var(--fs-caption)',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 'var(--radius-pill)',
        background: '#ecfdf5',
        color: '#065f46',
        border: '1px solid #a7f3d0',
        whiteSpace: 'nowrap'
      }}>
        📋 Báo giá / Tư vấn
      </span>
    );
  }
  if (s === 'chat_lead' || s === 'chatbot') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 'var(--fs-caption)',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 'var(--radius-pill)',
        background: '#f0fdfa',
        color: '#0f766e',
        border: '1px solid #99f6e4',
        whiteSpace: 'nowrap'
      }}>
        💬 Trợ lý AI
      </span>
    );
  }
  if (s === 'newsletter' || s === 'subscriber') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 'var(--fs-caption)',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 'var(--radius-pill)',
        background: '#fdf2f8',
        color: '#9d174d',
        border: '1px solid #fbcfe8',
        whiteSpace: 'nowrap'
      }}>
        📧 Bản tin
      </span>
    );
  }
  if (s === 'admin') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 'var(--fs-caption)',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 'var(--radius-pill)',
        background: '#f3e8ff',
        color: '#7e22ce',
        border: '1px solid #e9d5ff',
        whiteSpace: 'nowrap'
      }}>
        🛡️ Admin tạo
      </span>
    );
  }
  if (s === 'seed') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 'var(--fs-caption)',
        fontWeight: 500,
        padding: '3px 8px',
        borderRadius: 'var(--radius-pill)',
        background: '#f1f5f9',
        color: '#475569',
        border: '1px solid #cbd5e1',
        whiteSpace: 'nowrap'
      }}>
        🧪 Dữ liệu mẫu
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 'var(--fs-caption)',
      fontWeight: 500,
      padding: '3px 8px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-sunken)',
      color: 'var(--text-muted)',
      border: '1px solid var(--border-hairline)',
      whiteSpace: 'nowrap'
    }}>
      ✍️ Trực tiếp
    </span>
  );
}

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
    'linear-gradient(135deg, #C75B00, #C75B00)',
    'linear-gradient(135deg, #3FBF8F, #2E9970)',
    'linear-gradient(135deg, #d97706, #b45309)',
    'linear-gradient(135deg, #6B7180, #4A4F59)',
    'linear-gradient(135deg, #A8485A, #8a3645)',
    'linear-gradient(135deg, #C75B00, #8a3d00)',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function AdminCustomers({ st, setSt, notify }) {
  const adminQ = (st.adminQ || '').trim();
  const [debouncedQ] = useDebouncedValue(adminQ, 300);
  const [status, setStatus] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
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
  const [showCharts, setShowCharts] = useState(true);
  const isSuperAdmin = st.user?.role === 'super-admin';

  const { data, isLoading, isError, refetch, isFetching } = useAdminCustomers({
    status,
    source: sourceFilter,
    q: debouncedQ || undefined,
    page,
    perPage: 20
  });
  const { data: statsData, isLoading: statsLoading } = useAdminCustomerStats();
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
      source: (c) => c.registrationSource || 'direct',
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
    setSourceFilter('all');
    setPhoneFilter('all');
    setVerifiedFilter('all');
    setPage(1);
  };

  const hasActiveFilters = !!adminQ || status !== 'all' || sourceFilter !== 'all' || phoneFilter !== 'all' || verifiedFilter !== 'all';

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
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(199,91,0, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(63,191,143, 0.12)', color: 'var(--intent-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* Analytics & Charts Section */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
        border: '1px solid var(--border-hairline)',
        overflow: 'hidden',
        transition: 'all 200ms ease'
      }}>
        {/* Analytics Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: showCharts ? '1px solid var(--border-hairline)' : 'none',
          background: 'var(--surface-sunken)',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(66, 133, 244, 0.12)',
              color: '#4285F4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={17} />
            </div>
            <div>
              <div style={{ font: 'var(--type-label)', fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Phân tích Nguồn Khách hàng & Xu hướng Đăng ký
                <span style={{
                  fontSize: 'var(--fs-micro)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#065f46',
                  fontWeight: 600
                }}>
                  Thời gian thực
                </span>
              </div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                Nắm bắt chi tiết tỷ trọng nguồn đưa khách đến và tốc độ tăng trưởng 14 ngày qua
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {sourceFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSourceFilter('all')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--white)',
                  border: '1px solid var(--border-hairline)',
                  font: 'var(--type-caption)',
                  color: 'var(--action-primary)',
                  cursor: 'pointer'
                }}
              >
                <X size={12} /> Bỏ lọc nguồn: <strong>{SOURCE_FILTER_OPTS.find(o => o.value === sourceFilter)?.label}</strong>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCharts(s => !s)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 'var(--radius-field)',
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                font: 'var(--type-caption)',
                color: 'var(--text-strong)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {showCharts ? (
                <>
                  <ChevronUp size={14} /> Thu gọn biểu đồ
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> Mở rộng biểu đồ
                </>
              )}
            </button>
          </div>
        </div>

        {/* Charts Body */}
        {showCharts && (
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Quick Metrics Bar */}
            {statsData && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12,
                padding: '10px 14px',
                background: 'var(--surface-sunken)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--border-hairline)'
              }}>
                <div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Khách đã có SĐT</div>
                  <div style={{ font: 'var(--type-title-3)', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    {statsData.withPhone}
                    <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', fontWeight: 500 }}>
                      ({statsData.total > 0 ? Math.round((statsData.withPhone * 100) / statsData.total) : 0}%)
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đăng ký qua Google</div>
                  <div style={{ font: 'var(--type-title-3)', fontWeight: 700, color: '#4285F4', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    {statsData.sources?.find(s => s.source === 'google')?.count || 0}
                    <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', fontWeight: 500 }}>
                      ({statsData.sources?.find(s => s.source === 'google')?.percentage || 0}%)
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Qua giới thiệu CTV</div>
                  <div style={{ font: 'var(--type-title-3)', fontWeight: 700, color: '#F59E0B', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    {statsData.sources?.find(s => s.source === 'referral')?.count || 0}
                    <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', fontWeight: 500 }}>
                      ({statsData.sources?.find(s => s.source === 'referral')?.percentage || 0}%)
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Từ Lead Báo giá / Tư vấn</div>
                  <div style={{ font: 'var(--type-title-3)', fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    {(statsData.sources?.find(s => s.source === 'quote_lead')?.count || 0) + (statsData.sources?.find(s => s.source === 'chat_lead')?.count || 0)}
                    <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', fontWeight: 500 }}>
                      tài khoản
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: 24,
              alignItems: 'stretch'
            }}>
              {/* Chart 1: Donut breakdown theo nguồn */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                padding: '16px',
                borderRadius: 'var(--radius-card)',
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border-hairline)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PieChartIcon size={16} style={{ color: 'var(--action-primary)' }} />
                    <span style={{ font: 'var(--type-label)', fontWeight: 700, color: 'var(--text-strong)' }}>
                      Cơ cấu nguồn người dùng
                    </span>
                  </div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Bấm nguồn để lọc nhanh
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                  {/* Pie Graphic */}
                  <div style={{ width: 180, height: 180, position: 'relative', flexShrink: 0, margin: '0 auto' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statsData?.sources || []}
                          dataKey="count"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {(statsData?.sources || []).map((entry) => (
                            <Cell key={`cell-${entry.source}`} fill={SOURCE_COLORS[entry.source] || '#6B7280'} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value, name) => [`${value} khách hàng`, name]}
                          contentStyle={{
                            background: '#1F2937',
                            border: 'none',
                            borderRadius: 8,
                            color: '#F9FAFB',
                            fontSize: 12,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none'
                    }}>
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: 10 }}>TỔNG</span>
                      <span style={{ font: 'var(--type-title-2)', fontWeight: 800, color: 'var(--text-strong)', lineHeight: 1 }}>
                        {statsData?.total || result.total}
                      </span>
                    </div>
                  </div>

                  {/* Sources List & Progress */}
                  <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(statsData?.sources || []).map((s) => {
                      const color = SOURCE_COLORS[s.source] || '#6B7280';
                      const isSelected = sourceFilter === s.source;
                      return (
                        <div
                          key={s.source}
                          onClick={() => {
                            setSourceFilter(prev => prev === s.source ? 'all' : s.source);
                            setPage(1);
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-field)',
                            background: isSelected ? 'var(--white)' : 'transparent',
                            border: isSelected ? `1.5px solid ${color}` : '1px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 120ms ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                              <span style={{ font: 'var(--type-caption)', fontWeight: isSelected ? 700 : 500, color: 'var(--text-strong)' }}>
                                {s.label}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                              <span style={{ font: 'var(--type-caption)', fontWeight: 700, color: 'var(--text-strong)' }}>{s.count}</span>
                              <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-muted)' }}>({s.percentage}%)</span>
                            </div>
                          </div>
                          <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                            <div style={{ width: `${s.percentage}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 300ms ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Chart 2: Xu hướng 14 ngày */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                padding: '16px',
                borderRadius: 'var(--radius-card)',
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border-hairline)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={16} style={{ color: '#10B981' }} />
                    <span style={{ font: 'var(--type-label)', fontWeight: 700, color: 'var(--text-strong)' }}>
                      Tốc độ đăng ký 14 ngày qua
                    </span>
                  </div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Tổng khách mới theo ngày
                  </span>
                </div>

                <div style={{ width: '100%', height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData?.trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4285F4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorDirect" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6B7280" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6B7280" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorReferral" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-hairline)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => v ? v.slice(5).replace('-', '/') : ''}
                        tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                        axisLine={{ stroke: 'var(--border-hairline)' }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        labelFormatter={(v) => `Ngày ${v}`}
                        contentStyle={{
                          background: '#1F2937',
                          border: 'none',
                          borderRadius: 8,
                          color: '#F9FAFB',
                          fontSize: 12,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={30}
                        iconSize={10}
                        wrapperStyle={{ fontSize: 11 }}
                      />
                      <Area type="monotone" dataKey="google" name="Google" stroke="#4285F4" fillOpacity={1} fill="url(#colorGoogle)" strokeWidth={2} />
                      <Area type="monotone" dataKey="referral" name="CTV" stroke="#F59E0B" fillOpacity={1} fill="url(#colorReferral)" strokeWidth={2} />
                      <Area type="monotone" dataKey="leads" name="Leads" stroke="#10B981" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={2} />
                      <Area type="monotone" dataKey="direct" name="Trực tiếp" stroke="#6B7280" fillOpacity={1} fill="url(#colorDirect)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
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

        {/* Lọc danh mục: Nguồn đăng ký */}
        <div style={{ minWidth: 155 }}>
          <Select
            label=""
            value={sourceFilter}
            options={SOURCE_FILTER_OPTS}
            onChange={(v) => { setSourceFilter(v); setPage(1); }}
          />
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
          onClick={() => exportCsv({ status, source: sourceFilter !== 'all' ? sourceFilter : undefined, q: adminQ || undefined }).catch((e) => notify?.(e.message))}
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
          <div style={{ minWidth: 1060 }}>
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
              {isVisible('source') && (
                <span style={{ flex: '0 0 130px' }}>
                  <TableSortHeader sort={sort} onSort={toggleSort} sortKey="source" label="Nguồn" />
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

                  {/* Nguồn đăng ký */}
                  {isVisible('source') && (
                    <div style={{ flex: '0 0 130px' }}>
                      {renderSourceBadge(c.registrationSource)}
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
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: confirmLock?.next === 'locked' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(63,191,143, 0.08)', padding: '12px 14px', borderRadius: 'var(--radius-field)' }}>
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
