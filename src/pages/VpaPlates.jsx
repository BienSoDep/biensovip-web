import { useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { Select, SearchField } from '../components/index.jsx';
import Button from '../components/Button.jsx';
import PlateCard from '../components/PlateCard.jsx';
import Pagination from '../components/Pagination.jsx';
import PlateCardSkeleton from '../components/skeletons/PlateCardSkeleton.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { useCategories } from '../services/categories.js';
import { useVpaPlates, useVpaCounts, useVpaProvinces, openVpaPlate } from '../services/vpa.js';
import { vpaBadge, isCar } from '../lib/vpaFormat.js';

const PAGE_SIZE = 24;
const TABS = [
  { key: 'monthly', label: 'Biển tháng' },
  { key: 'weekly', label: 'Biển tuần' },
  { key: 'available', label: 'Biển có sẵn' },
  { key: 'expired', label: 'Biển hết hạn' },
];
const VEHICLES = [{ value: '', label: 'Tất cả loại xe' }, { value: 'Car', label: 'Ô tô' }, { value: 'MotorBike', label: 'Xe máy' }];
const SORTS = {
  monthly: [['soon', 'Phiên sắp diễn ra'], ['number', 'Số biển A→Z']],
  weekly: [['soon', 'Phiên sắp diễn ra'], ['number', 'Số biển A→Z']],
  expired: [['latest', 'Mới kết thúc'], ['number', 'Số biển A→Z']],
};
const GRID = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(268px,100%),1fr))', gap: 'var(--gutter-section)' };
const BOX = { background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' };

// Danh sách biển đấu giá VPA (UC49): 3 tab lấy từ API VPA + tab "Biển có sẵn" dẫn về danh sách kho Duy Định.
export default function VpaPlates({ go, openPlate, notify }) {
  const [tab, setTab] = useState('monthly');
  const [vehicle, setVehicle] = useState('');
  const [type, setType] = useState('');
  const [province, setProvince] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [opening, setOpening] = useState(null);
  const [dq] = useDebouncedValue(q, 350);

  const { data: counts } = useVpaCounts(vehicle);
  const { data: types } = useCategories('plate_type');
  const { data: provinces } = useVpaProvinces();
  const { data, isLoading, isError, refetch, isFetching } = useVpaPlates({ tab, vehicle, province, type, q: dq, sort, page, pageSize: PAGE_SIZE });
  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));

  const reset = (fn) => (v) => { fn(v); setPage(1); };
  const pickTab = (key) => {
    if (key === 'available') return go('list')();
    setTab(key); setSort(''); setPage(1);
  };
  const count = (key) => ({ monthly: counts?.monthly, weekly: counts?.weekly, expired: counts?.expired }[key]);

  // Bấm thẻ → tạo Plate (get-or-create) rồi dùng luồng chi tiết sẵn có.
  const open = async (p) => {
    if (opening) return;
    setOpening(p.id);
    try {
      const r = await openVpaPlate(p.id);
      openPlate(r.plateId);
    } catch (e) {
      notify?.(e.message || 'Không mở được biển này, vui lòng thử lại');
    } finally {
      setOpening(null);
    }
  };

  const typeList = types?.items || types || [];
  const typeOptions = [{ value: '', label: 'Tất cả loại biển' }, ...typeList.map((t) => ({ value: t.id, label: t.name }))];
  const provinceOptions = [{ value: '', label: 'Tất cả tỉnh/thành' }, ...(provinces || []).map((p) => ({ value: p.code, label: p.name }))];
  const sortOptions = (SORTS[tab] || SORTS.monthly).map(([value, label]) => ({ value, label }));

  return (
    <>
      <Breadcrumb items={[{ label: 'Trang chủ', onClick: go('home') }, { label: 'Biển đấu giá' }]} />
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-4) var(--pad-page) var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h1 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Biển số đấu giá</h1>

        <div role="tablist" style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.map((t) => {
            const active = t.key === tab;
            const n = count(t.key);
            return (
              <button key={t.key} type="button" role="tab" aria-selected={active} onClick={() => pickTab(t.key)}
                style={{
                  flex: '0 0 auto', height: 40, padding: '0 16px', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                  font: 'var(--type-body-sm)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  background: active ? 'var(--action-primary)' : 'var(--white)', color: active ? 'var(--text-inverse)' : 'var(--text-body)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                }}>
                {t.label}{n != null ? ` (${new Intl.NumberFormat('vi-VN').format(n)})` : ''}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchField placeholder="Tìm số biển, vd 8888" value={q} onChange={(e) => reset(setQ)(e && e.target ? e.target.value : e)} width="min(280px,100%)" ariaLabel="Tìm số biển" />
          <Select value={vehicle} options={VEHICLES} onChange={reset(setVehicle)} variant="pill" />
          <Select value={province} options={provinceOptions} onChange={reset(setProvince)} variant="pill" />
          <Select value={type} options={typeOptions} onChange={reset(setType)} variant="pill" />
          <Select value={sort || sortOptions[0].value} options={sortOptions} onChange={reset(setSort)} variant="pill" />
        </div>

        {isLoading ? (
          <div className="plate-grid" style={GRID}>{Array.from({ length: 8 }, (_, i) => <PlateCardSkeleton key={i} />)}</div>
        ) : isError ? (
          <div style={BOX}>
            <span style={{ font: 'var(--type-body)', color: 'var(--status-danger)' }}>Không tải được danh sách biển đấu giá.</span>
            <Button variant="outline" size="md" onClick={() => refetch()}>Thử lại</Button>
          </div>
        ) : items.length === 0 ? (
          <div style={BOX}>
            <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có biển phù hợp</span>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Thử đổi bộ lọc hoặc nhập đuôi số khác.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', opacity: isFetching ? 0.7 : 1, transition: 'opacity 120ms' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{new Intl.NumberFormat('vi-VN').format(data.total)} biển số</span>
            <div className="plate-grid" style={GRID}>
              {items.map((p) => (
                <PlateCard key={p.id} plateNumber={p.plateNumber} type={p.plateTypeName} province={p.provinceName}
                  vehicleType={isCar(p.vehicle) ? 'Ô tô' : 'Xe máy'} price={p.price} priceOnRequest={p.price == null}
                  isHot={p.isFeatured} priceOnRequestLabel="Liên hệ báo giá" badge={vpaBadge(p)} onOpen={() => open(p)} href="#" />
              ))}
            </div>
            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} style={{ paddingTop: 'var(--space-3)' }} />}
          </div>
        )}
      </section>
    </>
  );
}
