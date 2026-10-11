import { useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { Gavel, RefreshCw, ArrowRight } from 'lucide-react';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import { Select, SearchField } from '../../../components/index.jsx';
import MultiFilter from './MultiFilter.jsx';
import { useAdminCategories } from '../../../services/categories.js';
import { useVpaAuctionResults, exportVpaAuctionResultsCsv } from '../../../services/adminVpa.js';
import { formatDateTime } from '../../../lib/vpaFormat.js';

const money = (v) => (v == null ? '—' : `${new Intl.NumberFormat('vi-VN').format(v)}đ`);
const PER_PAGE = [{ value: 20, label: '20/trang' }, { value: 50, label: '50/trang' }, { value: 100, label: '100/trang' }];
const VEHICLES = [{ value: '', label: 'Tất cả' }, { value: 'Car', label: 'Ô tô' }, { value: 'MotorBike', label: 'Xe máy' }];
const catOpts = (list) => (list || []).map((c) => ({ value: c.id, label: c.name }));

const YES_NO = (yes, no) => [
  { value: '', label: 'Tất cả' },
  { value: 'true', label: yes },
  { value: 'false', label: no },
];

const AUCTION_STATE_OPTS = [
  { value: '', label: 'Mọi trạng thái giá' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'waiting', label: 'Chờ xác nhận' },
  { value: 'higher', label: 'Giá trúng > Khởi điểm' },
  { value: 'starting', label: 'Giá trúng = Khởi điểm' },
];

const dateField = {
  height: 32,
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface-sunken)',
  padding: '0 8px',
  font: 'var(--type-caption)',
  color: 'var(--text-body)',
  outline: 'none',
};

// Kết quả đấu giá đã cào (UC49): bảng RIÊNG (vpa_auction_results) — ghi giá trúng/giá khởi điểm của phiên đã đấu xong,
// Bộ lọc đồng bộ đầy đủ các chiều với trang Danh sách biển VPA và Duyệt giá.
export default function VpaAuctionResults() {
  const [q, setQ] = useState('');
  const [dq] = useDebouncedValue(q, 300);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [plateTypeIds, setPlateTypeIds] = useState([]);
  const [provinceIds, setProvinceIds] = useState([]);
  const [featured, setFeatured] = useState('');
  const [priceState, setPriceState] = useState('');
  const [hidden, setHidden] = useState('');
  const [manual, setManual] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [exporting, setExporting] = useState(false);

  const { data: provData } = useAdminCategories('province');
  const { data: typeData } = useAdminCategories('plate_type');
  const provinces = catOpts(provData?.items);
  const plateTypes = catOpts(typeData?.items);

  const params = {
    vehicle,
    provinceIds: provinceIds.join(','),
    plateTypeIds: plateTypeIds.join(','),
    q: dq,
    from,
    to,
    priceState,
    page,
    limit,
  };
  const { data, isLoading, isError, refetch } = useVpaAuctionResults(params);
  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const setDatePreset = (preset) => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    if (preset === 'today') {
      const s = fmt(d);
      setFrom(s);
      setTo(s);
    } else if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      const s = fmt(d);
      setFrom(s);
      setTo(s);
    } else if (preset === 'week') {
      const f = fmt(d);
      d.setDate(d.getDate() + 7);
      const t = fmt(d);
      setFrom(f);
      setTo(t);
    } else if (preset === 'clear') {
      setFrom('');
      setTo('');
    }
    setPage(1);
  };

  const clearCats = () => {
    setPlateTypeIds([]);
    setProvinceIds([]);
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportVpaAuctionResultsCsv(params);
    } catch {
      alert('Không thể xuất file CSV kết quả đấu giá.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Khối bộ lọc 2 tầng đồng nhất với trang Danh sách biển VPA & Duyệt giá */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Tầng 1: Tìm kiếm, Phiên ngày, Hiển thị, Nút công cụ */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
          <SearchField placeholder="Tìm biển số…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} width={220} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Phiên ngày</span>
              <div style={{ display: 'inline-flex', gap: 3 }}>
                {[['Hôm nay', 'today'], ['Ngày mai', 'tomorrow'], ['7 ngày', 'week']].map(([txt, val]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDatePreset(val)}
                    style={{
                      border: 'none',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-body)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'background-color 120ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--grey-200)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                  >
                    {txt}
                  </button>
                ))}
                {(from || to) && (
                  <button
                    type="button"
                    onClick={() => setDatePreset('clear')}
                    title="Xóa lọc ngày"
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--status-danger)',
                      padding: '1px 4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} style={dateField} title="Phiên từ ngày" />
              <ArrowRight size={11} color="var(--text-muted)" />
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} style={dateField} title="Đến ngày" />
            </div>
          </div>
          <Select label="Hiển thị" value={limit} options={PER_PAGE} onChange={(v) => { setLimit(Number(v)); setPage(1); }} />
          <Button
            variant="ghost"
            size="md"
            onClick={() => refetch()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Tải lại kết quả"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </Button>
          <Button
            variant="ghost"
            size="md"
            disabled={exporting}
            onClick={handleExport}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Xuất file CSV kết quả"
          >
            <span>{exporting ? 'Đang xuất…' : 'Xuất CSV'}</span>
          </Button>
          <div style={{ flex: 1 }} />
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            {new Intl.NumberFormat('vi-VN').format(total)} kết quả
          </span>
        </div>

        {/* Tầng 2: Đầy đủ 7 ô lọc danh mục & trạng thái */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
          <MultiFilter label="Loại biển" options={plateTypes} value={plateTypeIds} onChange={(v) => { setPlateTypeIds(v); setPage(1); }} />
          <Select label="Loại xe" value={vehicle} options={VEHICLES} onChange={(v) => { setVehicle(v); setPage(1); }} />
          <MultiFilter label="Tỉnh/thành" options={provinces} value={provinceIds} onChange={(v) => { setProvinceIds(v); setPage(1); }} searchable />
          <Select label="Nổi bật" value={featured} options={YES_NO('Chỉ nổi bật', 'Không nổi bật')} onChange={(v) => { setFeatured(v); setPage(1); }} />
          <Select label="Trạng thái giá" value={priceState} options={AUCTION_STATE_OPTS} onChange={(v) => { setPriceState(v); setPage(1); }} />
          <Select label="Ẩn/hiện" value={hidden} options={YES_NO('Đang ẩn', 'Đang hiện')} onChange={(v) => { setHidden(v); setPage(1); }} />
          <Select label="Nguồn" value={manual} options={[{ value: '', label: 'Tất cả' }, { value: 'false', label: 'Đồng bộ VPA' }]} onChange={(v) => { setManual(v); setPage(1); }} />
          {(plateTypeIds.length > 0 || provinceIds.length > 0) && (
            <Button variant="ghost" size="md" onClick={clearCats}>Xóa lọc loại biển/tỉnh</Button>
          )}
        </div>
      </div>

      {/* Bảng dữ liệu kết quả đấu giá */}
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
