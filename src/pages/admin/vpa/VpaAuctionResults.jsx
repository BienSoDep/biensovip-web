import { useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { Gavel } from 'lucide-react';
import Pagination from '../../../components/Pagination.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import { Select, SearchField } from '../../../components/index.jsx';
import MultiFilter from './MultiFilter.jsx';
import { useAdminCategories } from '../../../services/categories.js';
import { useVpaAuctionResults } from '../../../services/adminVpa.js';
import { formatDateTime } from '../../../lib/vpaFormat.js';

const money = (v) => (v == null ? '—' : `${new Intl.NumberFormat('vi-VN').format(v)}đ`);
const PER_PAGE = [{ value: 20, label: '20/trang' }, { value: 50, label: '50/trang' }, { value: 100, label: '100/trang' }];
const VEHICLES = [{ value: '', label: 'Tất cả' }, { value: 'Car', label: 'Ô tô' }, { value: 'MotorBike', label: 'Xe máy' }];
const catOpts = (list) => (list || []).map((c) => ({ value: c.id, label: c.name }));

// Kết quả đấu giá đã cào (UC49): bảng RIÊNG (vpa_auction_results) — ghi giá trúng/giá khởi điểm của phiên đã đấu xong,
// không chung schema với 4 tab biển VPA (Tháng/Tuần/Hết hạn/Hết hạn nội bộ). Cào cả Ô tô lẫn Xe máy.
export default function VpaAuctionResults() {
  const [vehicle, setVehicle] = useState('');
  const [provinceIds, setProvinceIds] = useState([]);
  const [q, setQ] = useState('');
  const [dq] = useDebouncedValue(q, 300);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const { data: provData } = useAdminCategories('province');
  const provinces = catOpts(provData?.items);
  const params = { vehicle, provinceId: provinceIds[0], q: dq, page, limit };
  const { data, isLoading, isError } = useVpaAuctionResults(params);
  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
        <SearchField placeholder="Tìm biển số…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} width={220} />
        <Select label="Loại xe" value={vehicle} options={VEHICLES} onChange={(v) => { setVehicle(v); setPage(1); }} />
        <MultiFilter label="Tỉnh/thành" options={provinces} value={provinceIds} onChange={(v) => { setProvinceIds(v); setPage(1); }} />
        <Select label="Hiển thị" value={limit} options={PER_PAGE} onChange={(v) => { setLimit(Number(v)); setPage(1); }} />
        <div style={{ flex: 1 }} />
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          {new Intl.NumberFormat('vi-VN').format(total)} kết quả
        </span>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        {isLoading && <div style={{ padding: 'var(--space-4)' }}><Skeleton variant="table" rows={6} /></div>}
        {isError && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--status-danger)' }}>Lỗi tải kết quả đấu giá.</div>
        )}
        {!isLoading && !isError && items.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Gavel size={40} style={{ color: 'var(--text-faint)' }} />
            Không có kết quả đấu giá nào khớp bộ lọc.
          </div>
        )}
        {!isLoading && items.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--type-body-sm)' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', font: 'var(--type-caption)', borderBottom: '1px solid var(--grey-100)' }}>
                <th style={{ padding: '10px 16px' }}>Biển số</th>
                <th style={{ padding: '10px 16px' }}>Loại xe</th>
                <th style={{ padding: '10px 16px' }}>Tỉnh/thành</th>
                <th style={{ padding: '10px 16px' }}>Loại biển</th>
                <th style={{ padding: '10px 16px' }}>Giá khởi điểm</th>
                <th style={{ padding: '10px 16px' }}>Giá trúng</th>
                <th style={{ padding: '10px 16px' }}>Thời gian đấu giá</th>
                <th style={{ padding: '10px 16px' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--grey-100)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{r.plateNumber}</td>
                  <td style={{ padding: '10px 16px' }}>{r.vehicle === 'Car' || r.vehicle === 1 ? 'Ô tô' : 'Xe máy'}</td>
                  <td style={{ padding: '10px 16px' }}>{r.provinceName || '—'}</td>
                  <td style={{ padding: '10px 16px' }}>{r.plateTypeName || '—'}</td>
                  <td style={{ padding: '10px 16px' }}>{money(r.startingPrice)}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>{money(r.auctionPrice)}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>
                    {formatDateTime(r.auctionStartAt)}{r.auctionEndAt ? ` → ${formatDateTime(r.auctionEndAt)}` : ''}
                  </td>
                  <td style={{ padding: '10px 16px' }}>{r.waitingConfirm ? 'Chờ xác nhận' : 'Đã xác nhận'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
