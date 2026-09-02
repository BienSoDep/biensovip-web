// CLEAN-CODE-ISSUES.md #1 — PlateList.jsx pure logic (URL↔filter-state serialization), tách khỏi
// component để giữ PlateList.jsx ở mức fetch+compose.

export function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    cat: params.getAll('cat'),
    city: params.getAll('city'),
    avoidNumbers: params.getAll('avoidNumbers'),
    vehicle: params.get('vehicle') || '',
    q: params.get('q') || '',
    sort: params.get('sort') || 'newest',
    page: Number(params.get('page')) || 1,
    perPage: Number(params.get('perPage')) || 18,
    view: params.get('view') === 'list' ? 'list' : 'grid',
    priceMin: params.get('priceMin') || '',
    priceMax: params.get('priceMax') || '',
    status: params.get('status') || '',
  };
}

export function writeFiltersToUrl(filters) {
  const params = new URLSearchParams();
  filters.cat.forEach((id) => params.append('cat', id));
  filters.city.forEach((id) => params.append('city', id));
  filters.avoidNumbers.forEach((n) => params.append('avoidNumbers', n));
  if (filters.vehicle) params.set('vehicle', filters.vehicle);
  if (filters.q) params.set('q', filters.q);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  if (filters.perPage !== 18) params.set('perPage', String(filters.perPage));
  if (filters.view === 'list') params.set('view', 'list');
  if (filters.priceMin) params.set('priceMin', filters.priceMin);
  if (filters.priceMax) params.set('priceMax', filters.priceMax);
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  const base = window.location.pathname || '/danh-sach';
  const next = qs ? `${base}?${qs}` : base;
  if (next !== window.location.pathname + window.location.search) history.replaceState(null, '', next);
}
