import { useEffect, useState } from 'react';
import { Select } from './index.jsx';
import Button from './Button.jsx';
import PlateCard from './PlateCard.jsx';
import Pagination from './Pagination.jsx';
import PlateCardSkeleton from './skeletons/PlateCardSkeleton.jsx';
import { useCategories } from '../services/categories.js';
import { useCompareIds } from '../services/compareService.js';
import { useVpaPlates, useVpaProvinces, openVpaPlate } from '../services/vpa.js';
import { vpaBadge, isCar } from '../lib/vpaFormat.js';

const PAGE_SIZE = 24;
const VEHICLES = [{ value: '', label: 'Tất cả loại xe' }, { value: 'Car', label: 'Ô tô' }, { value: 'MotorBike', label: 'Xe máy' }];
const SORTS = {
  monthly: [['soon', 'Phiên sắp diễn ra'], ['number', 'Số biển A→Z']],
  weekly: [['soon', 'Phiên sắp diễn ra'], ['number', 'Số biển A→Z']],
  expired: [['latest', 'Mới kết thúc'], ['number', 'Số biển A→Z']],
};
const GRID = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(268px,100%),1fr))', gap: 'var(--gutter-section)' };
const BOX = { background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' };

// Nội dung 3 tab VPA (UC49: tháng / tuần / hết hạn) trong trang Biển số. Tab do trang cha chọn; đổi tab thì cha remount (key).
export default function VpaPlatesPanel({ tab, q: dq, openPlate, notify, favs, onFav }) {
  const [vehicle, setVehicle] = useState('');
  const [type, setType] = useState('');
  const [province, setProvince] = useState('');
  const [sort, setSort] = useState('');
  const [pageState, setPageState] = useState({ q: dq, page: 1 });
  const page = pageState.q === dq ? pageState.page : 1; // đổi từ khóa (ô tìm ở trang cha) → về trang 1
  const setPage = (p) => setPageState({ q: dq, page: p });
  const [opening, setOpening] = useState(null);
  const [plateIds, setPlateIds] = useState({}); // vpaId → plateId đã tạo trong phiên (danh sách chưa tải lại)
  const [now, setNow] = useState(() => Date.now());
  const { add: addCompare, remove: removeCompare, isInList } = useCompareIds();

  // Đếm ngược tab Tuần cập nhật mỗi 30 giây.
  useEffect(() => {
    if (tab !== 'weekly') return undefined;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [tab]);

  const { data: types } = useCategories('plate_type');
  const { data: provinces } = useVpaProvinces();
  const { data, isLoading, isError, refetch, isFetching } = useVpaPlates({ tab, vehicle, province, type, q: dq, sort, page, pageSize: PAGE_SIZE });
  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));

  const reset = (fn) => (v) => { fn(v); setPage(1); };

  // Tương tác lần đầu (mở, yêu thích, so sánh) → tạo Plate (get-or-create) rồi dùng luồng biển thường. null nếu lỗi.
  const ensurePlate = async (p) => {
    const known = plateIds[p.id] || p.plateId;
    if (known) return known;
    if (opening) return null;
    setOpening(p.id);
    try {
      const r = await openVpaPlate(p.id);
      setPlateIds((m) => ({ ...m, [p.id]: r.plateId }));
      return r.plateId;
    } catch (e) {
      notify?.(e.message || 'Không thực hiện được với biển này, vui lòng thử lại');
      return null;
    } finally {
      setOpening(null);
    }
  };
  const open = async (p) => { const id = await ensurePlate(p); if (id) openPlate(id); };
  const toggleFavorite = async (p) => { const id = await ensurePlate(p); if (id && onFav) onFav(id); };
  const toggleCompare = async (p) => {
    const id = await ensurePlate(p);
    if (!id) return;
    if (isInList(id)) removeCompare(id); else addCompare(id);
  };
  const pidOf = (p) => plateIds[p.id] || p.plateId;

  const typeList = types?.items || types || [];
  const typeOptions = [{ value: '', label: 'Tất cả loại biển' }, ...typeList.map((t) => ({ value: t.id, label: t.name }))];
  const provinceOptions = [{ value: '', label: 'Tất cả tỉnh/thành' }, ...(provinces || []).map((p) => ({ value: p.code, label: p.name }))];
  const sortOptions = (SORTS[tab] || SORTS.monthly).map(([value, label]) => ({ value, label }));

  return (
    <>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
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
                  isHot={p.isFeatured} priceOnRequestLabel="Liên hệ báo giá" badge={vpaBadge(p, now)} onOpen={() => open(p)} href="#"
                  fav={!!(pidOf(p) && favs?.[pidOf(p)])} onFav={onFav ? () => toggleFavorite(p) : undefined}
                  inCompare={!!(pidOf(p) && isInList(pidOf(p)))} onCompare={() => toggleCompare(p)} />
              ))}
            </div>
            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} style={{ paddingTop: 'var(--space-3)' }} />}
          </div>
        )}
      </section>
    </>
  );
}
