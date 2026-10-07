// CLEAN-CODE-ISSUES.md #1 — PlateList.jsx pure logic (URL↔filter-state serialization), tách khỏi
// component để giữ PlateList.jsx ở mức fetch+compose.

// Tab biển VPA trong trang Biển số: '' = Biển có sẵn (kho Duy Định). Giá trị URL ngắn gọn, tiếng Việt không dấu.
export const VPA_TAB_PARAM = { monthly: 'thang', weekly: 'tuan', expired: 'het-han' };
const VPA_TAB_BY_PARAM = Object.fromEntries(Object.entries(VPA_TAB_PARAM).map(([k, v]) => [v, k]));

export function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tab = VPA_TAB_BY_PARAM[params.get('tab')] || '';
  let q = params.get('q') || '';
  if (!q && typeof window !== 'undefined' && window.location.pathname.startsWith('/tim-kiem/')) {
    const raw = window.location.pathname.slice('/tim-kiem/'.length).split('/')[0];
    if (raw) q = decodeURIComponent(raw).replace(/-/g, ' ');
  }
  return {
    cat: params.getAll('cat'),
    city: params.getAll('city'),
    avoidNumbers: params.getAll('avoidNumbers'),
    vehicle: params.get('vehicle') || '',
    q,
    sort: params.get('sort') || 'newest',
    page: Number(params.get('page')) || 1,
    perPage: Number(params.get('perPage')) || 18,
    view: params.get('view') === 'list' ? 'list' : 'grid',
    priceMin: params.get('priceMin') || '',
    priceMax: params.get('priceMax') || '',
    status: params.get('status') || '',
    tab,
  };
}

export function writeFiltersToUrl(filters) {
  const params = new URLSearchParams();
  filters.cat.forEach((id) => params.append('cat', id));
  filters.city.forEach((id) => params.append('city', id));
  filters.avoidNumbers.forEach((n) => params.append('avoidNumbers', n));
  if (filters.vehicle) params.set('vehicle', filters.vehicle);
  if (filters.tab) params.set('tab', VPA_TAB_PARAM[filters.tab]);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isSearchPath = pathname.startsWith('/tim-kiem/');
  const pathTerm = isSearchPath ? decodeURIComponent(pathname.slice('/tim-kiem/'.length).split('/')[0]).replace(/-/g, ' ') : '';

  if (filters.q) {
    if (!isSearchPath || filters.q.toLowerCase() !== pathTerm.toLowerCase()) {
      params.set('q', filters.q);
    }
  }
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  if (filters.perPage !== 18) params.set('perPage', String(filters.perPage));
  if (filters.view === 'list') params.set('view', 'list');
  if (filters.priceMin) params.set('priceMin', filters.priceMin);
  if (filters.priceMax) params.set('priceMax', filters.priceMax);
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  let base = pathname && pathname !== '/bien-dau-gia' ? pathname : '/danh-sach';
  if (isSearchPath && (!filters.q || filters.q.toLowerCase() !== pathTerm.toLowerCase())) {
    base = '/danh-sach';
  }
  const next = qs ? `${base}?${qs}` : base;
  if (next !== window.location.pathname + window.location.search) history.replaceState(null, '', next);
}

export function buildPageUrl(filters, targetPage) {
  const params = new URLSearchParams();
  filters.cat?.forEach((id) => params.append('cat', id));
  filters.city?.forEach((id) => params.append('city', id));
  filters.avoidNumbers?.forEach((n) => params.append('avoidNumbers', n));
  if (filters.vehicle) params.set('vehicle', filters.vehicle);
  if (filters.q) params.set('q', filters.q);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (targetPage > 1) params.set('page', String(targetPage));
  if (filters.perPage && filters.perPage !== 18) params.set('perPage', String(filters.perPage));
  if (filters.priceMin) params.set('priceMin', filters.priceMin);
  if (filters.priceMax) params.set('priceMax', filters.priceMax);
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  return qs ? `/danh-sach?${qs}` : '/danh-sach';
}

