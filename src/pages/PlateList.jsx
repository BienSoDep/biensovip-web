import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import { Select, Checkbox } from '../components/index.jsx';
import PlateCard from '../components/PlateCard.jsx';
import PlateCardSkeleton from '../components/skeletons/PlateCardSkeleton.jsx';
import { useStaggeredReveal } from '../hooks/useStaggeredReveal.js';
import { useCategories } from '../services/categories.js';
import { usePlates } from '../services/plates.js';

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

export default function PlateList({ favs, onFav, openPlate, openBuy }) {
  const [filters, setFilters] = useState(readFiltersFromUrl);
  useEffect(() => { writeFiltersToUrl(filters); }, [filters]);

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  const { data: plateTypes } = useCategories('plate_type');
  const { data: provinces } = useCategories('province');

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
    onOpen: () => openPlate(p.id),
    onBuy: () => openBuy?.(p.id),
  });

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-7) var(--pad-page) var(--space-4)' }}>
        <h1 style={{ margin: 'var(--space-3) 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Kho biển số đẹp</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{total} biển số phù hợp bộ lọc hiện tại</p>
      </section>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-5) var(--pad-page) var(--pad-section-y)', display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        <aside style={{ flex: '0 0 272px', minWidth: 250, position: 'sticky', top: 78, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
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
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Từ khóa</span>
            <input value={filters.q} onChange={(e) => setFilter({ q: e.target.value })} placeholder="VD: 51A"
              style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }} />
          </div>
          <Button variant="outline" size="sm" fullWidth onClick={clearFilters}>Xóa bộ lọc</Button>
        </aside>
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <Select label="Sắp xếp" value={filters.sort} options={[{ value: 'newest', label: 'Mới nhất' }, { value: 'price_asc', label: 'Giá thấp → cao' }, { value: 'price_desc', label: 'Giá cao → thấp' }]} onChange={(v) => setFilter({ sort: v })} variant="pill" />
          </div>
          {(isLoading || isFetching) ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(268px,1fr))', gap: 'var(--gutter-section)' }}>
              {Array.from({ length: items.length || 8 }, (_, i) => <PlateCardSkeleton key={i} />)}
            </div>
          ) : isError ? (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center' }}>
              <span style={{ font: 'var(--type-body)', color: 'var(--status-danger)' }}>Không tải được danh sách biển số.</span>
            </div>
          ) : items.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(268px,1fr))', gap: 'var(--gutter-section)' }}>
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
    </div>
  );
}
