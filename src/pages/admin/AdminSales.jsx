import { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  Wallet,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  TrendingUp,
} from 'lucide-react';
import AdminKanban from './AdminKanban.jsx';
import AdminContacts from './AdminContacts.jsx';
import AdminTransactions from './AdminTransactions.jsx';
import { useContactStats, useAdminContacts } from '../../services/adminContacts.js';
import { useAdminTransactions } from '../../services/adminTransactions.js';

const VIEWS = [
  { key: 'pipeline', label: 'Quy trình Kanban', Icon: LayoutGrid },
  { key: 'list', label: 'Danh sách liên hệ', Icon: List },
  { key: 'transactions', label: 'Giao dịch thanh toán', Icon: Wallet },
];

const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

export default function AdminSales({ notify, go, st, initialView }) {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialStatus = urlParams?.get('status') || st?.contactStatus;
  const targetView = initialStatus ? 'list' : (VIEWS.some((v) => v.key === initialView) ? initialView : 'pipeline');
  const [view, setView] = useState(targetView);
  const [focusQ, setFocusQ] = useState(null);

  // Dữ liệu thống kê tổng hợp để hiển thị KPI và badge số lượng
  const { data: stats } = useContactStats({});
  const { data: contactsData } = useAdminContacts({ page: 1, perPage: 1 });
  const { data: txData } = useAdminTransactions({ page: 1, limit: 100 });

  const txItems = txData?.items || [];
  const pendingTx = useMemo(() => txItems.filter((t) => t.status === 'pending'), [txItems]);
  const confirmedTx = useMemo(() => txItems.filter((t) => t.status === 'payment_confirmed'), [txItems]);
  const confirmedTotalAmount = useMemo(
    () => confirmedTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    [confirmedTx],
  );

  const openContact = (c) => {
    setFocusQ(c.fullName || '');
    setView('list');
  };

  const getBadgeCount = (key) => {
    if (key === 'pipeline') {
      const activeContacts = (stats?.new || 0) + (stats?.consulting || 0) + (stats?.closed || 0);
      return activeContacts + pendingTx.length;
    }
    if (key === 'list') {
      return contactsData?.total ?? (stats ? (stats.new || 0) + (stats.consulting || 0) + (stats.closed || 0) + (stats.cancelled || 0) : null);
    }
    if (key === 'transactions') {
      return txData?.total ?? null;
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 1. Header Banner & KPI Tổng quan luồng Bán hàng */}
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-inset-hairline)',
          border: '1px solid var(--border-hairline)',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <div>
            <h1 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} style={{ color: 'var(--action-primary)' }} />
              Quản lý Bán hàng & Chốt cọc
            </h1>
            <p style={{ margin: '4px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Theo dõi toàn bộ phễu bán hàng từ liên hệ khách mới, tư vấn, đặt cọc cho đến chốt giao dịch và hoa hồng CTV
            </p>
          </div>
        </div>

        {/* Hàng 5 Thẻ KPI nhanh */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap: 'var(--space-2)' }}>
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-pill)', background: 'var(--blue-50, #eff6ff)', color: 'var(--blue-600, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneCall size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Khách mới</span>
              <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', fontSize: '16px', color: 'var(--text-strong)' }}>
                {stats?.new ?? 0}
              </span>
            </div>
          </div>

          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-pill)', background: 'var(--amber-50, #fffbeb)', color: 'var(--amber-600, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Đang tư vấn</span>
              <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', fontSize: '16px', color: 'var(--text-strong)' }}>
                {stats?.consulting ?? 0}
              </span>
            </div>
          </div>

          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-pill)', background: 'var(--mint-50, #ecfdf5)', color: 'var(--status-success-ink, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Đã chốt bán</span>
              <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', fontSize: '16px', color: 'var(--status-success-ink, #059669)' }}>
                {stats?.closed ?? 0}
              </span>
            </div>
          </div>

          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-pill)', background: 'var(--brand-50, #fff7ed)', color: 'var(--action-primary, #C75B00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Chờ xác nhận tiền</span>
              <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', fontSize: '16px', color: 'var(--action-primary, #C75B00)' }}>
                {pendingTx.length}
              </span>
            </div>
          </div>

          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-pill)', background: 'var(--mint-50, #ecfdf5)', color: 'var(--status-success-ink, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircleDollarSign size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Đã thu (chốt cọc)</span>
              <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', fontSize: '15px', color: 'var(--text-strong)' }}>
                {money(confirmedTotalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Thanh Tab chuyển đổi View có Badge số lượng */}
      <div
        role="tablist"
        className="admin-tablist"
        aria-label="Chế độ xem bán hàng"
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          background: 'var(--white)',
          padding: '6px',
          borderRadius: 'var(--radius-pill)',
          boxShadow: 'var(--shadow-inset-hairline)',
          border: '1px solid var(--border-hairline)',
          width: 'fit-content',
        }}
      >
        {VIEWS.map(({ key, label, Icon }) => {
          const active = view === key;
          const count = getBadgeCount(key);
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setView(key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 36,
                padding: '0 16px',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                font: 'var(--type-body-sm)',
                fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                background: active ? 'var(--action-primary)' : 'transparent',
                color: active ? 'var(--action-primary-text)' : 'var(--text-body)',
                boxShadow: active ? 'var(--shadow-1)' : 'none',
                transition: 'all 160ms ease',
              }}
            >
              <Icon size={15} />
              <span>{label}</span>
              {count != null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 20,
                    height: 20,
                    padding: '0 6px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '11px',
                    fontWeight: 'var(--fw-semibold)',
                    background: active ? 'rgba(255,255,255,0.24)' : 'var(--surface-sunken)',
                    color: active ? 'var(--action-primary-text)' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Vùng nội dung của từng View */}
      <div hidden={view !== 'pipeline'}>
        <AdminKanban notify={notify} go={go} onOpenContact={openContact} />
      </div>
      <div hidden={view !== 'list'}>
        <AdminContacts
          key={focusQ ?? initialStatus ?? 'default'}
          notify={notify}
          go={go}
          st={focusQ != null ? { ...st, adminQ: focusQ } : { ...st, contactStatus: initialStatus }}
        />
      </div>
      <div hidden={view !== 'transactions'}>
        <AdminTransactions notify={notify} />
      </div>
    </div>
  );
}
