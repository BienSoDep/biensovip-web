import { useState, useMemo } from 'react';
import {
  MessageCircle,
  Phone,
  Heart,
  Eye,
  Flame,
  UserCheck,
  UserPlus,
  CheckCircle2,
  Clock,
  Search,
  X,
  RotateCw,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAdminInterestLeads,
  useClaimInterestLead,
  useUnclaimInterestLead,
  useMarkInterestLeadContacted
} from '../../services/adminInterestLeads.js';
import { timeAgo, formatDateTime } from '../../lib/date.js';
import { Badge } from '../../components/index.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import Button from '../../components/Button.jsx';
import Pagination from '../../components/Pagination.jsx';
import { loadAuth } from '../../lib/authStore.js';
import { toZaloUrl } from '../../lib/zaloMessage.js';

const STATUS_TABS = [
  { val: 'all', label: 'Tất cả' },
  { val: 'unassigned', label: 'Chưa ai nhận' },
  { val: 'mine', label: 'Của tôi' },
  { val: 'contacted', label: 'Đã liên hệ' }
];

const SIGNAL_OPTS = [
  { val: 'all', label: 'Tất cả tín hiệu' },
  { val: 'favorited', label: 'Đã thả tim', icon: Heart, color: '#ef4444' },
  { val: 'repeat_view', label: 'Xem nhiều lần', icon: Eye, color: '#2563eb' }
];

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

export default function AdminInterestLeads({ notify }) {
  const [status, setStatus] = useState('all');
  const [signal, setSignal] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const currentUserId = loadAuth()?.user?.id;
  const isSuperAdmin = loadAuth()?.user?.role === 'super-admin';

  const { data, isLoading, isError, refetch, isFetching } = useAdminInterestLeads({
    status,
    signal: signal !== 'all' ? signal : undefined,
    page,
    perPage: 20
  });

  const claim = useClaimInterestLead();
  const unclaim = useUnclaimInterestLead();
  const markContacted = useMarkInterestLeadContacted();

  const result = data ?? { items: [], total: 0, page: 1, perPage: 20 };
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

  // Lọc client-side theo từ khóa tìm kiếm (Tên, SĐT, Biển số)
  const filteredItems = useMemo(() => {
    if (!searchQ.trim()) return result.items;
    const q = searchQ.trim().toLowerCase();
    return result.items.filter((item) =>
      (item.userFullName && item.userFullName.toLowerCase().includes(q)) ||
      (item.userPhone && item.userPhone.includes(q)) ||
      (item.plateNumber && item.plateNumber.toLowerCase().includes(q))
    );
  }, [result.items, searchQ]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const items = result.items || [];
    const unassigned = items.filter((i) => !i.assignedStaffId && !i.contacted).length;
    const mine = items.filter((i) => i.assignedStaffId === currentUserId && !i.contacted).length;
    const contacted = items.filter((i) => i.contacted).length;
    const favorited = items.filter((i) => i.signal === 'favorited').length;
    return { unassigned, mine, contacted, favorited };
  }, [result.items, currentUserId]);

  const handleClaim = (id) => {
    setActionLoadingId(id);
    claim.mutate(id, {
      onSuccess: () => {
        toast.success('Đã nhận tư vấn khách hàng này thành công');
        setActionLoadingId(null);
      },
      onError: (e) => {
        toast.error(e?.code === 'ALREADY_CLAIMED' ? 'Nhân viên khác vừa nhận khách này rồi' : (e?.message || 'Nhận tư vấn thất bại, thử lại.'));
        setActionLoadingId(null);
      },
    });
  };

  const handleUnclaim = (id) => {
    setActionLoadingId(id);
    unclaim.mutate(id, {
      onSuccess: () => {
        toast.success('Đã giải phóng lead cho nhân viên khác');
        setActionLoadingId(null);
      },
      onError: (e) => {
        toast.error(e?.message || 'Bỏ nhận thất bại, thử lại.');
        setActionLoadingId(null);
      },
    });
  };

  const handleContacted = (id) => {
    setActionLoadingId(id);
    markContacted.mutate(id, {
      onSuccess: () => {
        toast.success('Đã đánh dấu liên hệ thành công');
        setActionLoadingId(null);
      },
      onError: (e) => {
        toast.error(e?.message || 'Đánh dấu đã liên hệ thất bại, thử lại.');
        setActionLoadingId(null);
      },
    });
  };

  const copyPhone = (e, phone, id) => {
    e.stopPropagation();
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    toast.success(`Đã sao chép: ${phone}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearFilters = () => {
    setStatus('all');
    setSignal('all');
    setSearchQ('');
    setPage(1);
  };

  const hasActiveFilters = status !== 'all' || signal !== 'all' || !!searchQ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <style>{`
        @keyframes bsd-spin { to { transform: rotate(360deg); } }
        .bsd-spin { animation: bsd-spin 0.8s linear infinite; }
        .lead-row:hover { background: var(--surface-sunken) !important; }
      `}</style>

      {/* KPI Cards Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        {/* Thẻ Lead nóng chưa ai nhận */}
        <div
          onClick={() => { setStatus('unassigned'); setPage(1); }}
          style={{
            background: 'var(--white)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            border: status === 'unassigned' ? '1.5px solid #f97316' : '1px solid var(--border-hairline)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            transition: 'all 140ms ease'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(249, 115, 22, 0.12)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={20} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chưa ai nhận (Lead nóng)</div>
            <div style={{ font: 'var(--type-title-2)', color: '#ea580c', fontWeight: 700 }}>
              {status === 'unassigned' ? result.total : `${stats.unassigned} trên trang`}
            </div>
          </div>
        </div>

        {/* Thẻ Khách của tôi */}
        <div
          onClick={() => { setStatus('mine'); setPage(1); }}
          style={{
            background: 'var(--white)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            border: status === 'mine' ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-hairline)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            transition: 'all 140ms ease'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={20} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tôi đang phụ trách</div>
            <div style={{ font: 'var(--type-title-2)', color: 'var(--brand-primary)', fontWeight: 700 }}>
              {status === 'mine' ? result.total : `${stats.mine} trên trang`}
            </div>
          </div>
        </div>

        {/* Thẻ Đã liên hệ */}
        <div
          onClick={() => { setStatus('contacted'); setPage(1); }}
          style={{
            background: 'var(--white)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            border: status === 'contacted' ? '1.5px solid var(--intent-success)' : '1px solid var(--border-hairline)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            transition: 'all 140ms ease'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--intent-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đã liên hệ tư vấn</div>
            <div style={{ font: 'var(--type-title-2)', color: 'var(--intent-success)', fontWeight: 700 }}>
              {status === 'contacted' ? result.total : `${stats.contacted} trên trang`}
            </div>
          </div>
        </div>

        {/* Thẻ Tổng số khách */}
        <div
          onClick={() => { setStatus('all'); setPage(1); }}
          style={{
            background: 'var(--white)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            border: status === 'all' ? '1.5px solid var(--text-strong)' : '1px solid var(--border-hairline)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            transition: 'all 140ms ease'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', color: 'var(--text-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng lead quan tâm</div>
            <div style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)', fontWeight: 700 }}>
              {result.total}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Bộ lọc Tab, Lọc tín hiệu, Tìm kiếm & Làm mới */}
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
        {/* Tab trạng thái nhận việc */}
        <div style={{ display: 'inline-flex', background: 'var(--surface-sunken)', padding: 3, borderRadius: 'var(--radius-pill)', gap: 2 }}>
          {STATUS_TABS.map((tab) => {
            const active = status === tab.val;
            return (
              <button
                key={tab.val}
                type="button"
                onClick={() => { setStatus(tab.val); setPage(1); }}
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
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Bộ lọc Tín hiệu hành vi (Favorited / Repeat view) */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tín hiệu:</span>
          <div style={{ display: 'inline-flex', background: 'var(--surface-sunken)', padding: 2, borderRadius: 'var(--radius-pill)', gap: 2 }}>
            {SIGNAL_OPTS.map((opt) => {
              const active = signal === opt.val;
              const IconComp = opt.icon;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => { setSignal(opt.val); setPage(1); }}
                  style={{
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-pill)',
                    font: 'var(--type-caption)',
                    cursor: 'pointer',
                    background: active ? 'var(--white)' : 'transparent',
                    color: active ? (opt.color || 'var(--text-strong)') : 'var(--text-muted)',
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    fontWeight: active ? 600 : 400,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {IconComp && <IconComp size={12} />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ô Tìm kiếm nhanh */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 200px',
          maxWidth: 320,
          background: 'var(--surface-sunken)',
          borderRadius: 'var(--radius-field)',
          border: '1px solid var(--border-hairline)',
          padding: '0 10px'
        }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginRight: 6 }} />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, biển số…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            style={{
              width: '100%',
              height: 34,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              font: 'var(--type-body-sm)',
              color: 'var(--text-strong)'
            }}
          />
          {searchQ && (
            <button
              type="button"
              onClick={() => setSearchQ('')}
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex' }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Clear filter */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} style={{ color: 'var(--text-muted)' }}>
            <X size={14} style={{ marginRight: 4 }} /> Xóa lọc
          </Button>
        )}

        <div style={{ flex: 1 }} />

        {/* Nút Làm mới */}
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => refetch()}
          title="Tải lại danh sách"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RotateCw size={14} className={isFetching ? 'bsd-spin' : ''} />
          Làm mới
        </Button>

        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          <b>{result.total}</b> khách quan tâm
        </span>
      </div>

      {/* Bảng Dữ liệu Khách quan tâm */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div className="admin-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 840 }}>
            {/* Table Header */}
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
              <span style={{ flex: '1 1 200px' }}>Khách hàng tiềm năng</span>
              <span style={{ flex: '1 1 140px' }}>Biển số quan tâm</span>
              <span style={{ flex: '0 0 150px' }}>Tín hiệu hành vi</span>
              <span style={{ flex: '0 0 130px' }}>Thời gian tương tác</span>
              <span style={{ flex: '0 0 240px', textAlign: 'right' }}>Xử lý tư vấn</span>
            </div>

            {/* Skeleton Loading */}
            {isLoading && <div style={{ padding: 'var(--gutter-card)' }}><SkeletonTable rows={5} cols={5} /></div>}

            {/* Lỗi tải */}
            {isError && (
              <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Lỗi tải dữ liệu danh sách khách quan tâm.</span>
                <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
              </div>
            )}

            {/* Danh sách Items */}
            {!isLoading && !isError && filteredItems.map((lead) => {
              const mine = lead.assignedStaffId === currentUserId;
              const firstLetter = (lead.userFullName?.[0] || 'K').toUpperCase();
              const avatarBg = getAvatarBg(lead.userFullName || lead.userPhone || String(lead.id));
              const zaloUrl = lead.userPhone ? toZaloUrl(lead.userPhone) : null;
              const isActionLoading = actionLoadingId === lead.id;

              return (
                <div
                  key={lead.id}
                  className="lead-row"
                  style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    alignItems: 'center',
                    padding: '12px var(--gutter-card)',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 120ms ease'
                  }}
                >
                  {/* Khách hàng with Avatar & Phone actions */}
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
                      <span style={{ font: 'var(--type-body-strong)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.userFullName || 'Khách vãng lai'}
                      </span>
                      {lead.userPhone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', letterSpacing: '0.02em', fontWeight: 500 }}>
                            {lead.userPhone}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copyPhone(e, lead.userPhone, lead.id)}
                            title="Sao chép SĐT"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 2,
                              cursor: 'pointer',
                              color: copiedId === lead.id ? 'var(--intent-success)' : 'var(--text-muted)'
                            }}
                          >
                            {copiedId === lead.id ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                          <a
                            href={`tel:${lead.userPhone}`}
                            title={`Gọi điện ${lead.userPhone}`}
                            style={{ color: 'var(--action-primary)', display: 'inline-flex', padding: 2 }}
                          >
                            <Phone size={12} />
                          </a>
                          {zaloUrl && (
                            <a
                              href={zaloUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat Zalo"
                              style={{ color: '#0068ff', display: 'inline-flex', padding: 2 }}
                            >
                              <MessageCircle size={12} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', fontStyle: 'italic' }}>Chưa cập nhật SĐT</span>
                      )}
                    </div>
                  </div>

                  {/* Biển số quan tâm */}
                  <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px',
                      background: 'var(--surface-sunken)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-hairline)'
                    }}>
                      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)', fontWeight: 700, letterSpacing: '0.04em' }}>
                        {lead.plateNumber}
                      </span>
                      <a
                        href={`/danh-sach-bien-so?q=${encodeURIComponent(lead.plateNumber)}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Xem biển số trên web"
                        style={{ color: 'var(--text-muted)', display: 'inline-flex' }}
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  {/* Tín hiệu hành vi */}
                  <div style={{ flex: '0 0 150px' }}>
                    {lead.signal === 'favorited' ? (
                      <Badge tone="rose">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Heart size={12} style={{ fill: '#ef4444' }} /> Thả tim quan tâm
                        </span>
                      </Badge>
                    ) : (
                      <Badge tone="blue">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={12} /> Xem lặp lại ({lead.viewCount} lượt)
                        </span>
                      </Badge>
                    )}
                  </div>

                  {/* Thời gian tương tác */}
                  <div style={{ flex: '0 0 130px', display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                      font: 'var(--type-caption)',
                      color: 'var(--text-strong)',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                      {timeAgo(lead.lastActivityAt)}
                    </span>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: 11 }}>
                      {formatDateTime(lead.lastActivityAt)}
                    </span>
                  </div>

                  {/* Xử lý tư vấn (Claim, Unclaim, Contacted) */}
                  <div style={{ flex: '0 0 240px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                    {lead.contacted ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--intent-success)',
                        font: 'var(--type-caption)',
                        fontWeight: 600
                      }}>
                        <CheckCircle2 size={13} /> Đã liên hệ
                      </span>
                    ) : !lead.assignedStaffId ? (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleClaim(lead.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-field)',
                          background: 'var(--action-primary)',
                          color: '#fff',
                          border: 'none',
                          font: 'var(--type-label)',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                        }}
                      >
                        {isActionLoading ? <RotateCw size={13} className="bsd-spin" /> : <UserPlus size={13} />}
                        Nhận tư vấn ngay
                      </button>
                    ) : mine ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleContacted(lead.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            borderRadius: 'var(--radius-field)',
                            background: 'var(--intent-success)',
                            color: '#fff',
                            border: 'none',
                            font: 'var(--type-label)',
                            cursor: 'pointer'
                          }}
                        >
                          {isActionLoading ? <RotateCw size={13} className="bsd-spin" /> : <Check size={13} />}
                          Đã gọi điện
                        </button>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleUnclaim(lead.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 8px',
                            borderRadius: 'var(--radius-field)',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-hairline)',
                            font: 'var(--type-caption)',
                            cursor: 'pointer'
                          }}
                        >
                          Bỏ nhận
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', background: 'var(--surface-sunken)', padding: '4px 8px', borderRadius: 'var(--radius-pill)' }}>
                          Phụ trách: <b>{lead.assignedStaffName || 'Đồng nghiệp'}</b>
                        </span>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleUnclaim(lead.id)}
                            title="Super Admin: Giải phóng để phân lại người khác"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--intent-danger)',
                              font: 'var(--type-caption)',
                              cursor: 'pointer',
                              padding: 2
                            }}
                          >
                            Thu hồi
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trạng thái rỗng */}
        {!isLoading && !isError && filteredItems.length === 0 && (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Sparkles size={36} style={{ color: 'var(--text-faint)' }} />
            <span style={{ font: 'var(--type-body-strong)', color: 'var(--text-strong)' }}>
              {hasActiveFilters ? 'Không tìm thấy khách quan tâm nào khớp bộ lọc' : 'Chưa có dữ liệu khách quan tâm'}
            </span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              {hasActiveFilters ? 'Hãy thử đổi từ khóa tìm kiếm hoặc bỏ chọn các tab lọc hiện tại.' : 'Khách hàng có hành vi thả tim hoặc xem nhiều lần sẽ tự động xuất hiện tại đây.'}
            </span>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} style={{ marginTop: 'var(--space-2)' }}>
                Xóa bộ lọc
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Phân trang Pagination chuẩn */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--space-2) 0' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Trang <b>{page}</b> / <b>{totalPages}</b> (Hiển thị 20 lead/trang)
          </span>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(p) => setPage(p)}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}
