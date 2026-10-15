import { useState } from 'react';
import { ScrollText, Search, X, RotateCw, User, UserX, Download, Users2, Award } from 'lucide-react';
import { useDebouncedValue } from '@mantine/hooks';
import { useAdminFengShuiHistory, useAdminFengShuiHistoryStats } from '../../services/adminFengShuiHistory.js';
import { Badge, TableColumnMenu, TableSortHeader, useTableColumns, sortTableItems } from '../../components/index.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import Button from '../../components/Button.jsx';
import Pagination from '../../components/Pagination.jsx';
import { useExportCsv } from '../../hooks/useExportCsv.js';
import { formatDateTime } from '../../lib/date.js';
import FengShuiHistoryDetailModal from './fengshui-history/FengShuiHistoryDetailModal.jsx';
import AdminTabbedPage from '../../components/AdminTabbedPage.jsx';
import FengShuiMatchLogTab from './fengshui-history/FengShuiMatchLogTab.jsx';

export const FS_HISTORY_COLUMNS = [
  { key: 'plate', label: 'Biển số', default: true },
  { key: 'customer', label: 'Khách hàng', default: true },
  { key: 'purpose', label: 'Mục đích', default: true },
  { key: 'vehicle', label: 'Loại xe', default: true },
  { key: 'score', label: 'Điểm phong thủy', default: true },
  { key: 'status', label: 'Trạng thái', default: true },
  { key: 'time', label: 'Thời gian', default: true },
];

const ELEMENT_LABEL = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };

// Style lặp lại cho date input + select filter — hằng số module-scope, không tạo object mới mỗi render.
const FILTER_FIELD_STYLE = { height: 34, borderRadius: 'var(--radius-field)', border: '1px solid var(--border-hairline)', padding: '0 8px', font: 'var(--type-body-sm)' };

function scoreTone(tier) {
  if (!tier) return 'neutral';
  if (tier.includes('Cực Phẩm') || tier.includes('Đại Cát')) return 'mint';
  if (tier.includes('Cát')) return 'blue';
  if (tier.includes('Cải Thiện')) return 'rose';
  return 'amber';
}

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--white)', padding: '14px 16px', borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-inset-hairline)', border: '1px solid var(--border-hairline)',
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${color}1f`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ font: 'var(--type-title-2)', color, fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}

const PURPOSE_OPTIONS = [
  { value: 'kinh_doanh', label: 'Kinh doanh' },
  { value: 'ca_nhan', label: 'Đi lại cá nhân' },
  { value: 'xe_gia_dinh', label: 'Xe gia đình' },
  { value: 'xe_dich_vu', label: 'Xe dịch vụ' },
  { value: 'sua_tam', label: 'Sang tên / sưu tầm' },
];

function AnalysisHistoryTab() {
  const [search, setSearch] = useState('');
  const [q] = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [elementFilter, setElementFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all'); // all | guest | member
  const [followUpFilter, setFollowUpFilter] = useState('all'); // all | pending | done
  const [sort, setSort] = useState({ key: 'time', dir: 'desc' });
  const [detailId, setDetailId] = useState(null);

  const { isVisible, colMenuProps } = useTableColumns({
    storageKey: 'bsv.admin.fsHistoryCols',
    columns: FS_HISTORY_COLUMNS,
  });

  const { data, isLoading, isError, refetch, isFetching } = useAdminFengShuiHistory({
    q, page, perPage: 20, fromDate: fromDate || undefined, toDate: toDate || undefined,
    element: elementFilter !== 'all' ? elementFilter : undefined,
    purpose: purposeFilter !== 'all' ? purposeFilter : undefined,
    hasAccount: accountFilter === 'all' ? undefined : accountFilter === 'member',
    followedUp: followUpFilter === 'all' ? undefined : followUpFilter === 'done',
  });
  const { data: stats } = useAdminFengShuiHistoryStats();
  const { exportCsv, loading: exporting } = useExportCsv('/api/admin/fengshui-analysis-history');

  const result = data ?? { items: [], total: 0, page: 1, perPage: 20 };
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

  // Lọc + sort server-side (element/purpose/hasAccount/followedUp đều gửi lên API) — bảng trên
  // chỉ còn sort hiển thị cho 20 dòng trang hiện tại, không lọc lại phía client nữa.
  const sortedItems = sortTableItems(result.items || [], sort.key, sort.dir, {
    plate: (i) => i.plateNumberRaw || '',
    customer: (i) => i.fullName || '',
    purpose: (i) => i.purpose || '',
    vehicle: (i) => i.vehicleType || '',
    score: (i) => i.score || 0,
    status: (i) => (i.followedUp ? 1 : 0),
    time: (i) => i.createdAt || '',
  });

  const hasActiveFilters = !!search || !!fromDate || !!toDate || elementFilter !== 'all' || purposeFilter !== 'all' || accountFilter !== 'all' || followUpFilter !== 'all';
  const clearFilters = () => {
    setSearch(''); setFromDate(''); setToDate('');
    setElementFilter('all'); setPurposeFilter('all'); setAccountFilter('all'); setFollowUpFilter('all');
    setPage(1);
  };

  const guestPct = stats?.totalCount ? Math.round((stats.guestCount / stats.totalCount) * 100) : 0;
  const memberPct = stats?.totalCount ? Math.round((stats.memberCount / stats.totalCount) * 100) : 0;
  const goodTierPct = stats?.totalCount ? Math.round((stats.goodTierCount / stats.totalCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <style>{`
        @keyframes bsd-spin { to { transform: rotate(360deg); } }
        .bsd-spin { animation: bsd-spin 0.8s linear infinite; }
        .fs-history-row:hover { background: var(--surface-sunken) !important; cursor: pointer; }
      `}</style>

      {/* KPI card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        <KpiCard icon={ScrollText} label="Tổng lượt (hôm nay / 7 ngày)" value={stats ? `${stats.totalCount} (${stats.today} / ${stats.last7Days})` : '—'} color="var(--text-strong)" />
        <KpiCard icon={UserX} label="Khách vãng lai" value={stats ? `${guestPct}%` : '—'} color="#ea580c" />
        <KpiCard icon={Users2} label="Đã đăng ký tài khoản" value={stats ? `${memberPct}%` : '—'} color="var(--brand-primary)" />
        <KpiCard icon={Award} label="Điểm Đại Cát trở lên" value={stats ? `${goodTierPct}%` : '—'} color="var(--intent-success)" />
      </div>

      {/* Control bar: tìm kiếm + khoảng ngày + làm mới */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center',
        background: 'var(--white)', padding: '12px 16px', borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
      }}>
        <div style={{
          position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 220px', maxWidth: 320,
          background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)',
          border: '1px solid var(--border-hairline)', padding: '0 10px',
        }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginRight: 6 }} />
          <input
            type="text"
            placeholder="Tìm theo biển số, tên khách…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', height: 34, background: 'transparent', border: 'none', outline: 'none', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Từ:</span>
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            style={FILTER_FIELD_STYLE} />
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đến:</span>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            style={FILTER_FIELD_STYLE} />
        </div>

        <select value={elementFilter} onChange={(e) => { setElementFilter(e.target.value); setPage(1); }}
          style={FILTER_FIELD_STYLE}>
          <option value="all">Tất cả mệnh</option>
          {Object.entries(ELEMENT_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>

        <select value={purposeFilter} onChange={(e) => { setPurposeFilter(e.target.value); setPage(1); }}
          style={FILTER_FIELD_STYLE}>
          <option value="all">Tất cả mục đích</option>
          {PURPOSE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        <select value={accountFilter} onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}
          style={FILTER_FIELD_STYLE}>
          <option value="all">Khách vãng lai + đăng ký</option>
          <option value="guest">Chỉ khách vãng lai</option>
          <option value="member">Chỉ đã đăng ký</option>
        </select>

        <select value={followUpFilter} onChange={(e) => { setFollowUpFilter(e.target.value); setPage(1); }}
          style={FILTER_FIELD_STYLE}>
          <option value="all">Mọi trạng thái</option>
          <option value="pending">Chưa xử lý</option>
          <option value="done">Đã xử lý</option>
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} style={{ color: 'var(--text-muted)' }}>
            <X size={14} style={{ marginRight: 4 }} /> Xóa lọc
          </Button>
        )}

        <div style={{ flex: 1 }} />

        <TableColumnMenu {...colMenuProps} />

        <Button variant="outline" size="sm" disabled={exporting} onClick={() => exportCsv({ ...(q && { q }), ...(fromDate && { fromDate }), ...(toDate && { toDate }) })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Download size={14} />
          Xuất CSV
        </Button>

        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RotateCw size={14} className={isFetching ? 'bsd-spin' : ''} />
          Làm mới
        </Button>

        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          <b>{result.total}</b> lượt luận giải
        </span>
      </div>

      {/* Bảng */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div className="admin-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 820 }}>
            <div style={{
              display: 'flex', gap: 'var(--space-3)', padding: '12px var(--gutter-card)',
              background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)',
              letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-hairline)',
            }}>
              {isVisible('plate') && <TableSortHeader label="Biển số" sortKey="plate" currentSort={sort} onSort={setSort} style={{ flex: '0 0 150px' }} />}
              {isVisible('customer') && <TableSortHeader label="Khách hàng" sortKey="customer" currentSort={sort} onSort={setSort} style={{ flex: '1 1 180px' }} />}
              {isVisible('purpose') && <TableSortHeader label="Mục đích" sortKey="purpose" currentSort={sort} onSort={setSort} style={{ flex: '0 0 150px' }} />}
              {isVisible('vehicle') && <TableSortHeader label="Loại xe" sortKey="vehicle" currentSort={sort} onSort={setSort} style={{ flex: '0 0 100px' }} />}
              {isVisible('score') && <TableSortHeader label="Điểm phong thủy" sortKey="score" currentSort={sort} onSort={setSort} style={{ flex: '0 0 170px' }} />}
              {isVisible('status') && <TableSortHeader label="Trạng thái" sortKey="status" currentSort={sort} onSort={setSort} style={{ flex: '0 0 110px' }} />}
              {isVisible('time') && <TableSortHeader label="Thời gian" sortKey="time" currentSort={sort} onSort={setSort} style={{ flex: '0 0 140px' }} />}
            </div>

            {isLoading && <div style={{ padding: 'var(--gutter-card)' }}><SkeletonTable rows={5} cols={6} /></div>}

            {isError && (
              <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Lỗi tải dữ liệu lịch sử luận giải.</span>
                <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
              </div>
            )}

            {!isLoading && !isError && sortedItems.map((item) => (
              <div
                key={item.id}
                className="fs-history-row"
                onClick={() => setDetailId(item.id)}
                style={{
                  display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: '12px var(--gutter-card)',
                  borderBottom: '1px solid var(--border-subtle)', transition: 'background 120ms ease',
                }}
              >
                {isVisible('plate') && (
                  <div style={{ flex: '0 0 150px', font: 'var(--type-body-strong)', color: 'var(--text-strong)', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {item.plateNumberRaw}
                  </div>
                )}
                {isVisible('customer') && (
                  <div style={{ flex: '1 1 180px', minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {item.hasUserAccount ? <User size={13} style={{ color: 'var(--action-primary)', flexShrink: 0 }} /> : <UserX size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />}
                    <span style={{ font: 'var(--type-body-sm)', color: item.fullName ? 'var(--text-strong)' : 'var(--text-faint)', fontStyle: item.fullName ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.fullName || 'Khách vãng lai'}
                    </span>
                  </div>
                )}
                {isVisible('purpose') && (
                  <div style={{ flex: '0 0 150px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    {item.purpose || '—'}
                  </div>
                )}
                {isVisible('vehicle') && (
                  <div style={{ flex: '0 0 100px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    {item.vehicleType}
                  </div>
                )}
                {isVisible('score') && (
                  <div style={{ flex: '0 0 170px' }}>
                    <Badge tone={scoreTone(item.scoreTier)}>
                      {item.score} điểm · {item.scoreTier}
                    </Badge>
                  </div>
                )}
                {isVisible('status') && (
                  <div style={{ flex: '0 0 110px' }}>
                    <Badge tone={item.followedUp ? 'mint' : 'neutral'}>{item.followedUp ? 'Đã xử lý' : 'Chưa xử lý'}</Badge>
                  </div>
                )}
                {isVisible('time') && (
                  <div style={{ flex: '0 0 140px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    {formatDateTime(item.createdAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {!isLoading && !isError && sortedItems.length === 0 && (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ScrollText size={36} style={{ color: 'var(--text-faint)' }} />
            <span style={{ font: 'var(--type-body-strong)', color: 'var(--text-strong)' }}>
              {hasActiveFilters ? 'Không tìm thấy lượt luận giải nào khớp bộ lọc' : 'Chưa có lượt luận giải nào'}
            </span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Khách luận giải biển số tại trang công khai /luan-bien-so sẽ tự động xuất hiện tại đây.
            </span>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--space-2) 0' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Trang <b>{page}</b> / <b>{totalPages}</b>
          </span>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} size="sm" />
        </div>
      )}

      <FengShuiHistoryDetailModal id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

export default function AdminFengShuiHistory() {
  const tabs = [
    { key: 'analysis', label: 'Luận giải biển có sẵn', render: () => <AnalysisHistoryTab /> },
    { key: 'match', label: 'Tìm biển hợp mệnh', render: () => <FengShuiMatchLogTab /> },
  ];
  return <AdminTabbedPage tabs={tabs} initialTab="analysis" />;
}
