import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Select, Checkbox, Radio, Input } from '../components/index.jsx';
import PlateCard from '../components/PlateCard.jsx';
import PlateCardSkeleton from '../components/skeletons/PlateCardSkeleton.jsx';
import { useStaggeredReveal } from '../hooks/useStaggeredReveal.js';
import { useCategories } from '../services/categories.js';
import { usePlates } from '../services/plates.js';
import { useCompareIds } from '../services/compareService.js';
import { useCreateSavedSearch } from '../services/savedSearchService.js';
import { loadAuth } from '../lib/authStore.js';

const PER_PAGE = 20;

function readFiltersFromUrl() {
  const qIdx = window.location.hash.indexOf('?');
  const params = new URLSearchParams(qIdx >= 0 ? window.location.hash.slice(qIdx + 1) : '');
  return {
    cat: params.getAll('cat'),
    city: params.getAll('city'),
    vehicle: params.get('vehicle') || '',
    q: params.get('q') || '',
    sort: params.get('sort') || 'newest',
    page: Number(params.get('page')) || 1,
  };
}

function writeFiltersToUrl(filters) {
  const params = new URLSearchParams();
  filters.cat.forEach((id) => params.append('cat', id));
  filters.city.forEach((id) => params.append('city', id));
  if (filters.vehicle) params.set('vehicle', filters.vehicle);
  if (filters.q) params.set('q', filters.q);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  const qs = params.toString();
  const base = window.location.hash.split('?')[0] || '#/danh-sach';
  const next = qs ? `${base}?${qs}` : base;
  if (next !== window.location.hash) history.replaceState(null, '', next);
}

export default function PlateList({ favs, onFav, openPlate, openBuy, notify, go }) {
  const [filters, setFilters] = useState(readFiltersFromUrl);
  useEffect(() => { writeFiltersToUrl(filters); }, [filters]);

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  const { data: plateTypes } = useCategories('plate_type');
  const { data: provinces } = useCategories('province');
  const { data: vehicleTypes } = useCategories('vehicle_type');
  const { add: addCompare, remove: removeCompare, isInList } = useCompareIds();
  const createSavedSearch = useCreateSavedSearch();
  const isLoggedIn = !!loadAuth()?.accessToken;
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = filters.cat.length + filters.city.length + (filters.vehicle ? 1 : 0) + (filters.q ? 1 : 0);

  const hasActiveFilters = filters.cat.length > 0 || filters.city.length > 0 || !!filters.vehicle || !!filters.q;

  const openSaveModal = () => {
    if (!isLoggedIn) { notify?.('Vui lòng đăng nhập để lưu tìm kiếm.'); go?.('login')(); return; }
    setSaveName('');
    setSaveOpen(true);
  };

  const submitSave = async () => {
    if (!saveName.trim()) { notify?.('Nhập tên cho tiêu chí tìm kiếm.'); return; }
    try {
      await createSavedSearch.mutateAsync({
        name: saveName.trim(),
        filters: JSON.stringify({ cat: filters.cat, city: filters.city, vehicle: filters.vehicle, q: filters.q }),
      });
      setSaveOpen(false);
      notify?.('Đã lưu tiêu chí tìm kiếm. Bạn sẽ nhận thông báo khi có biển mới phù hợp.');
    } catch (e) {
      if (e.status === 400 && e.code === 'search_limit_reached') notify?.('Bạn đã đạt giới hạn 10 tiêu chí đã lưu.');
      else notify?.(e.message || 'Lỗi khi lưu tiêu chí.');
    }
  };

  const apiFilters = useMemo(() => ({
    cat: filters.cat, city: filters.city, vehicle: filters.vehicle || undefined,
    q: filters.q || undefined, sort: filters.sort, page: filters.page, perPage: PER_PAGE,
  }), [filters]);

  const { data, isLoading, isError, isFetching } = usePlates(apiFilters);
  const stagger = useStaggeredReveal();

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const page = data?.page || filters.page;

  const toggleArrayFilter = (key, id) => setFilter({
    [key]: filters[key].includes(id) ? filters[key].filter((x) => x !== id) : [...filters[key], id],
  });

  const clearFilters = () => setFilters({ cat: [], city: [], vehicle: '', q: '', sort: 'newest', page: 1 });

  const cardProps = (p) => ({
    ...p,
    fav: !!favs?.[p.id],
    onFav: onFav ? () => onFav(p.id) : undefined,
    onCompare: () => isInList(p.id) ? removeCompare(p.id) : addCompare(p.id),
    inCompare: isInList(p.id),
    onOpen: () => openPlate(p.id),
    onBuy: () => openBuy?.(p.id),
  });

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-7) var(--pad-page) var(--space-4)' }}>
        <h1 style={{ margin: 'var(--space-3) 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Kho biển số đẹp</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{total} biển số phù hợp bộ lọc hiện tại</p>
      </section>
      <section className="list-filter-toggle-row" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page)', display: 'none' }}>
        <button type="button" onClick={() => setFilterOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 16px', border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', cursor: 'pointer' }}>
          <SlidersHorizontal size={16} />
          Bộ lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </section>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-5) var(--pad-page) var(--pad-section-y)', display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        {filterOpen && (
          <div className="list-filter-overlay" style={{ position: 'fixed', inset: 0, zIndex: 85 }}>
            <div aria-hidden="true" onClick={() => setFilterOpen(false)} style={{ position: 'absolute', inset: 0, background: 'var(--overlay-scrim)', animation: 'fadeIn 140ms var(--ease-out)' }} />
            <div role="dialog" aria-modal="true" aria-label="Bộ lọc biển số" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 'min(320px, 88vw)', background: 'var(--white)', boxShadow: 'var(--shadow-4)', display: 'flex', flexDirection: 'column', animation: 'modalIn 180ms var(--ease-out)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-5)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Bộ lọc</span>
                <button type="button" onClick={() => setFilterOpen(false)} aria-label="Đóng bộ lọc" style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Loại biển</span>
                  {(plateTypes?.items || []).map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <Checkbox label={c.name} checked={filters.cat.includes(c.id)} onChange={() => toggleArrayFilter('cat', c.id)} style={{ flex: 1 }} />
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{c.plateCount}</span>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: 'var(--border-hairline)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Tỉnh / thành</span>
                  {(provinces?.items || []).map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <Checkbox label={c.name} checked={filters.city.includes(c.id)} onChange={() => toggleArrayFilter('city', c.id)} style={{ flex: 1 }} />
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{c.plateCount}</span>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: 'var(--border-hairline)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Loại xe</span>
                  {(vehicleTypes?.items || []).map((v) => (
                    <Radio key={v.id} label={v.name} checked={filters.vehicle === v.id} onChange={() => setFilter({ vehicle: filters.vehicle === v.id ? '' : v.id })} />
                  ))}
                </div>
                <div style={{ height: 1, background: 'var(--border-hairline)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Từ khóa</span>
                  <input value={filters.q} onChange={(e) => setFilter({ q: e.target.value })} placeholder="VD: 51A"
                    style={{ height: 44, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-4) var(--space-5)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
                <Button variant="outline" size="md" onClick={() => { clearFilters(); }} style={{ flex: 1 }}>Xóa bộ lọc</Button>
                <Button variant="primary" size="md" onClick={() => setFilterOpen(false)} style={{ flex: 1 }}>Xem kết quả</Button>
              </div>
            </div>
          </div>
        )}
        <aside className="list-filter-aside" style={{ flex: '0 0 272px', minWidth: 250, position: 'sticky', top: 78, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Loại biển</span>
            {(plateTypes?.items || []).map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Checkbox label={c.name} checked={filters.cat.includes(c.id)} onChange={() => toggleArrayFilter('cat', c.id)} style={{ flex: 1 }} />
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{c.plateCount}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--border-hairline)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Tỉnh / thành</span>
            {(provinces?.items || []).map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Checkbox label={c.name} checked={filters.city.includes(c.id)} onChange={() => toggleArrayFilter('city', c.id)} style={{ flex: 1 }} />
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{c.plateCount}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--border-hairline)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Loại xe</span>
            {(vehicleTypes?.items || []).map((v) => (
              <Radio key={v.id} label={v.name} checked={filters.vehicle === v.id} onChange={() => setFilter({ vehicle: filters.vehicle === v.id ? '' : v.id })} />
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--border-hairline)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Từ khóa</span>
            <input value={filters.q} onChange={(e) => setFilter({ q: e.target.value })} placeholder="VD: 51A"
              style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }} />
          </div>
          <Button variant="outline" size="sm" fullWidth onClick={clearFilters}>Xóa bộ lọc</Button>
        </aside>
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            {hasActiveFilters && <Button variant="outline" size="sm" onClick={openSaveModal}>Lưu tìm kiếm này</Button>}
            <Select label="Sắp xếp" value={filters.sort} options={[{ value: 'newest', label: 'Mới nhất' }, { value: 'price_asc', label: 'Giá thấp → cao' }, { value: 'price_desc', label: 'Giá cao → thấp' }]} onChange={(v) => setFilter({ sort: v })} variant="pill" />
          </div>
          {(isLoading || isFetching) ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(268px,100%),1fr))', gap: 'var(--gutter-section)' }}>
              {Array.from({ length: items.length || 8 }, (_, i) => <PlateCardSkeleton key={i} />)}
            </div>
          ) : isError ? (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center' }}>
              <span style={{ font: 'var(--type-body)', color: 'var(--status-danger)' }}>Không tải được danh sách biển số.</span>
            </div>
          ) : items.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(268px,100%),1fr))', gap: 'var(--gutter-section)' }}>
              {items.map((p, i) => <PlateCard key={p.id} {...cardProps(p)} style={stagger(i)} />)}
            </div>
          ) : (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
              <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Không tìm thấy biển số phù hợp</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 380 }}>Thử bỏ một vài bộ lọc, hoặc nhập đuôi số khác.</span>
              <Button variant="dark" size="md" onClick={clearFilters}>Xóa bộ lọc</Button>
            </div>
          )}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-2)', paddingTop: 'var(--space-3)' }}>
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, page - 1) }))}>Trước</Button>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Trang {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, page + 1) }))}>Sau</Button>
            </div>
          )}
        </div>
      </section>

      {saveOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 18px', animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <div>
              <h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Lưu tìm kiếm này</h2>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Nhận thông báo khi có biển mới phù hợp bộ lọc hiện tại.</p>
            </div>
            <Input label="Tên tiêu chí" placeholder="VD: Biển ngũ quý Đà Nẵng" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="md" onClick={() => setSaveOpen(false)}>Hủy</Button>
              <Button variant="primary" size="md" onClick={submitSave} disabled={createSavedSearch.isPending}>{createSavedSearch.isPending ? 'Đang lưu…' : 'Lưu'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
