import { useState } from 'react';
import { X, RotateCw, User, UserX, Compass, Users2, PhoneCall } from 'lucide-react';
import { useAdminFengShuiMatchLog, useAdminFengShuiMatchLogStats } from '../../../services/adminFengShuiHistory.js';
import { Badge } from '../../../components/index.jsx';
import { SkeletonTable } from '../../../components/Skeleton.jsx';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import { formatDateTime, formatDate } from '../../../lib/date.js';

const ELEMENT_LABEL = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };
const PURPOSE_LABEL = {
  kinh_doanh: 'Kinh doanh', ca_nhan: 'Đi lại cá nhân', xe_gia_dinh: 'Xe gia đình',
  xe_dich_vu: 'Xe dịch vụ', sua_tam: 'Sang tên / sưu tầm',
};
const FILTER_FIELD_STYLE = { height: 34, borderRadius: 'var(--radius-field)', border: '1px solid var(--border-hairline)', padding: '0 8px', font: 'var(--type-body-sm)' };

function money(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
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

// Lượt khách tìm biển hợp mệnh ở trang công khai /hop-menh — khác tab "Luận giải biển có sẵn"
// (khách nhập 1 biển cụ thể). Ở đây khách nhập ngày sinh/mục đích để hệ thống gợi ý biển, nên
// không có tên/SĐT — chỉ phục vụ xem phễu tìm kiếm. Khi khách bấm "Yêu cầu tư vấn" trên kết quả,
// 1 ContactRequest (source=lucky_plate) được tạo riêng — xem ở trang Khách quan tâm/Liên hệ.
export default function FengShuiMatchLogTab() {
  const [page, setPage] = useState(1);
  const [elementFilter, setElementFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, isError, refetch, isFetching } = useAdminFengShuiMatchLog({
    element: elementFilter !== 'all' ? elementFilter : undefined,
    fromDate: fromDate || undefined, toDate: toDate || undefined, page, perPage: 20,
  });
  const { data: stats } = useAdminFengShuiMatchLogStats();

  const result = data ?? { items: [], total: 0, page: 1, perPage: 20 };
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

  const hasActiveFilters = !!fromDate || !!toDate || elementFilter !== 'all';
  const clearFilters = () => { setFromDate(''); setToDate(''); setElementFilter('all'); setPage(1); };

  const memberPct = stats?.totalCount ? Math.round((stats.memberCount / stats.totalCount) * 100) : 0;
  const conversionPct = stats?.totalCount ? Math.round((stats.contactRequestCount / stats.totalCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <style>{`@keyframes bsd-spin { to { transform: rotate(360deg); } } .bsd-spin { animation: bsd-spin 0.8s linear infinite; }`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        <KpiCard icon={Compass} label="Tổng lượt tìm (hôm nay / 7 ngày)" value={stats ? `${stats.totalCount} (${stats.today} / ${stats.last7Days})` : '—'} color="var(--text-strong)" />
        <KpiCard icon={Users2} label="Đã đăng ký tài khoản" value={stats ? `${memberPct}%` : '—'} color="var(--brand-primary)" />
        <KpiCard icon={PhoneCall} label="Đã yêu cầu tư vấn (toàn kỳ)" value={stats ? `${stats.contactRequestCount} (~${conversionPct}%)` : '—'} color="var(--intent-success)" />
      </div>
      <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
        Lượt tìm không có tên/SĐT (form /hop-menh không thu) nên không nối trực tiếp 1-1 với yêu cầu tư vấn —
        số "đã yêu cầu tư vấn" là tổng số liên hệ có nguồn "Tìm biển hợp mệnh" trong cùng giai đoạn, xem chi tiết ở trang Khách quan tâm.
      </p>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center',
        background: 'var(--white)', padding: '12px 16px', borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Từ:</span>
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} style={FILTER_FIELD_STYLE} />
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đến:</span>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} style={FILTER_FIELD_STYLE} />
        </div>

        <select value={elementFilter} onChange={(e) => { setElementFilter(e.target.value); setPage(1); }} style={FILTER_FIELD_STYLE}>
          <option value="all">Tất cả mệnh</option>
          {Object.entries(ELEMENT_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} style={{ color: 'var(--text-muted)' }}>
            <X size={14} style={{ marginRight: 4 }} /> Xóa lọc
          </Button>
        )}

        <div style={{ flex: 1 }} />

        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RotateCw size={14} className={isFetching ? 'bsd-spin' : ''} />
          Làm mới
        </Button>

        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          <b>{result.total}</b> lượt tìm
        </span>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div className="admin-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 760 }}>
            <div style={{
              display: 'flex', gap: 'var(--space-3)', padding: '12px var(--gutter-card)',
              background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)',
              letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-hairline)',
            }}>
              <div style={{ flex: '0 0 110px' }}>Tài khoản</div>
              <div style={{ flex: '0 0 100px' }}>Ngày sinh</div>
              <div style={{ flex: '0 0 80px' }}>Mệnh</div>
              <div style={{ flex: '1 1 150px' }}>Mục đích</div>
              <div style={{ flex: '0 0 130px' }}>Ngân sách</div>
              <div style={{ flex: '0 0 110px' }}>Kết quả</div>
              <div style={{ flex: '0 0 140px' }}>Thời gian</div>
            </div>

            {isLoading && <div style={{ padding: 'var(--gutter-card)' }}><SkeletonTable rows={5} cols={7} /></div>}

            {isError && (
              <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Lỗi tải dữ liệu lượt tìm biển hợp mệnh.</span>
                <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
              </div>
            )}

            {!isLoading && !isError && (result.items || []).map((item) => (
              <div key={item.id} style={{
                display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: '12px var(--gutter-card)',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div style={{ flex: '0 0 110px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.hasUserAccount ? <User size={13} style={{ color: 'var(--action-primary)' }} /> : <UserX size={13} style={{ color: 'var(--text-faint)' }} />}
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{item.hasUserAccount ? 'Thành viên' : 'Vãng lai'}</span>
                </div>
                <div style={{ flex: '0 0 100px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDate(item.birthDate)}</div>
                <div style={{ flex: '0 0 80px' }}>
                  <Badge tone="blue">{ELEMENT_LABEL[item.element] || item.element}</Badge>
                </div>
                <div style={{ flex: '1 1 150px', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                  {PURPOSE_LABEL[item.purpose] || item.purpose || '—'}
                </div>
                <div style={{ flex: '0 0 130px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{money(item.budget)}</div>
                <div style={{ flex: '0 0 110px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  {item.resultCount} biển{item.topScore != null ? ` · ${item.topScore}đ` : ''}
                </div>
                <div style={{ flex: '0 0 140px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDateTime(item.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>

        {!isLoading && !isError && (result.items || []).length === 0 && (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Compass size={36} style={{ color: 'var(--text-faint)' }} />
            <span style={{ font: 'var(--type-body-strong)', color: 'var(--text-strong)' }}>
              {hasActiveFilters ? 'Không tìm thấy lượt tìm nào khớp bộ lọc' : 'Chưa có lượt tìm biển hợp mệnh nào'}
            </span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Khách tìm biển hợp mệnh tại trang công khai /hop-menh sẽ tự động xuất hiện tại đây.
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
    </div>
  );
}
