import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { SlidersHorizontal, X, LayoutGrid, List as ListIcon } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Select, Checkbox, Radio, Input, Icon } from '../components/index.jsx';
import PlateCard from '../components/PlateCard.jsx';
import PlateCardSkeleton from '../components/skeletons/PlateCardSkeleton.jsx';
import { useStaggeredReveal } from '../hooks/useStaggeredReveal.js';
import { useCategories } from '../services/categories.js';
import { usePlates, useInfinitePlates } from '../services/plates.js';
import { useCompareIds } from '../services/compareService.js';
import { useCreateSavedSearch } from '../services/savedSearchService.js';
import { loadAuth } from '../lib/authStore.js';
import { routeFor } from '../config/routes.js';
import { readFiltersFromUrl, writeFiltersToUrl } from '../lib/plateListFilters.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { useSeo } from '../hooks/useSeo.js';
import {
  trackViewItemList, trackSelectItem, trackSearch, trackFilterApply,
  trackSearchNoResults, trackSelectPricePreset, trackAvoidNumberToggle, trackSaveSearch,
} from '../services/tracking/events.js';

const PER_PAGE_OPTIONS = [
  { value: '9', label: '9 / trang' },
  { value: '18', label: '18 / trang' },
  { value: '0', label: 'Xem tất cả' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'hot_first', label: 'Nổi bật trước' },
  { value: 'most_viewed', label: 'Xem nhiều nhất' },
  { value: 'plate_number', label: 'Số biển A→Z' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
];

const PRICE_PRESETS = [
  { label: 'Dưới 200tr', min: '', max: '200000000' },
  { label: '200tr–500tr', min: '200000000', max: '500000000' },
  { label: '500tr–1 tỷ', min: '500000000', max: '1000000000' },
  { label: 'Trên 1 tỷ', min: '1000000000', max: '' },
];

// Quan niệm dân gian tránh số xui — lọc loại trừ biển chứa chuỗi số này (không phải bốc thuốc y khoa,
// chỉ theo quan niệm phổ biến khách hàng hay hỏi).
const AVOID_NUMBER_PRESETS = ['4', '7', '49', '53', '13'];

const PROVINCE_VISIBLE_COUNT = 10;

export default function PlateList({ favs, onFav, openPlate, openBuy, notify, go, listNotice, onClearNotice, contact }) {
  const [filters, setFilters] = useState(readFiltersFromUrl);
  const [provinceExpanded, setProvinceExpanded] = useState(false);
  useEffect(() => { writeFiltersToUrl(filters); }, [filters]);

  const setFilter = (patch, isPreset = false) => {
    if (patch.q === undefined) trackFilterApply(patch, isPreset);
    setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  };

  const { data: plateTypes } = useCategories('plate_type');
  const { data: provinces } = useCategories('province');
  const { data: vehicleTypes } = useCategories('vehicle_type');

  // SEO — landing "ẩn" cho tổ hợp tỉnh/loại xe qua filter query (ưu tiên Đà Nẵng + xe máy —
  // thị trường chính, đối thủ làm sơ sài mảng này). Ghi đè title/desc base của useSeo(list) khi
  // filter tỉnh/loại xe đang active, để mỗi tổ hợp URL có tiêu đề riêng thay vì dùng chung 1 title.
  useEffect(() => {
    if (!provinces || !vehicleTypes) return;
    const cityNames = filters.city.map((id) => provinces.items?.find((c) => c.id === id)?.name).filter(Boolean);
    const vehicleName = vehicleTypes.items?.find((v) => v.id === filters.vehicle)?.name;
    if (!cityNames.length && !vehicleName) return;
    const parts = [vehicleName, cityNames.join(', ')].filter(Boolean);
    const label = parts.join(' tại ');
    document.title = `Biển số đẹp ${label} | Biensovip — Biển số đẹp Đà Nẵng`;
    const desc = document.head.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', `Danh sách biển số đẹp ${label} — giá tốt, hồ sơ rõ ràng, tư vấn phong thủy theo mệnh. Cập nhật liên tục.`);
  }, [filters.city, filters.vehicle, provinces, vehicleTypes]);
  const { add: addCompare, remove: removeCompare, isInList } = useCompareIds();
  const createSavedSearch = useCreateSavedSearch();
  const isLoggedIn = !!loadAuth()?.accessToken;
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [infinite, setInfinite] = useState(false);
  const filterPanelRef = useRef(null);

  // Focus trap cho drawer bộ lọc mobile — cùng contract a11y với Modal.jsx/Drawer.jsx (focus vào
  // phần tử đầu tiên khi mở, Tab/Shift+Tab quẩn trong panel, trả focus về nút trigger khi đóng).
  useEffect(() => {
    if (!filterOpen) return;
    const panel = filterPanelRef.current;
    if (!panel) return;
    const trigger = document.activeElement;
    const focusables = () =>
      Array.from(panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter((el) => !el.disabled && el.offsetParent !== null);
    (focusables()[0] || panel).focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setFilterOpen(false); return; }
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (!els.length) return;
      const f = els[0], l = els[els.length - 1];
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
    };
    panel.addEventListener('keydown', onKeyDown);
    return () => {
      panel.removeEventListener('keydown', onKeyDown);
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
    };
  }, [filterOpen]);

  const activeFilterCount = filters.cat.length + filters.city.length + filters.avoidNumbers.length + (filters.vehicle ? 1 : 0) + (filters.q ? 1 : 0) + ((filters.priceMin || filters.priceMax) ? 1 : 0) + (filters.status ? 1 : 0);

  const hasActiveFilters = filters.cat.length > 0 || filters.city.length > 0 || filters.avoidNumbers.length > 0 || !!filters.vehicle || !!filters.q || !!filters.priceMin || !!filters.priceMax || !!filters.status;

  const openSaveModal = () => {
    if (!isLoggedIn) { notify?.('Vui lòng đăng nhập để lưu tìm kiếm.'); go?.('login')(); return; }
    setSaveName('');
    setSaveOpen(true);
  };

  const submitSave = async () => {
    if (!saveName.trim()) { notify?.('Nhập tên cho tiêu chí tìm kiếm.'); return; }
    try {
      const savedFilters = { cat: filters.cat, city: filters.city, vehicle: filters.vehicle, q: filters.q, priceMin: filters.priceMin, priceMax: filters.priceMax, status: filters.status };
      await createSavedSearch.mutateAsync({ name: saveName.trim(), filters: JSON.stringify(savedFilters) });
      trackSaveSearch(savedFilters);
      setSaveOpen(false);
      notify?.('Đã lưu tiêu chí tìm kiếm. Bạn sẽ nhận thông báo khi có biển mới phù hợp.');
    } catch (e) {
      if (e.status === 400 && e.code === 'search_limit_reached') notify?.('Bạn đã đạt giới hạn 10 tiêu chí đã lưu.');
      else notify?.(e.message || 'Lỗi khi lưu tiêu chí.');
    }
  };

  const [qDebounced] = useDebouncedValue(filters.q, 300);

  const apiFilters = useMemo(() => ({
    cat: filters.cat, city: filters.city, avoidNumbers: filters.avoidNumbers, vehicle: filters.vehicle || undefined,
    q: qDebounced || undefined, priceMin: filters.priceMin || undefined, priceMax: filters.priceMax || undefined,
    status: filters.status || undefined, sort: filters.sort, page: filters.page,
    perPage: filters.perPage === 0 ? 100 : filters.perPage, // "Xem tất cả" → dùng trần backend cho phép (100)
  }), [filters, qDebounced]);

  const { data, isLoading, isError, isFetching, refetch } = usePlates(apiFilters, { enabled: !infinite && filters.perPage !== 0 });

  // Infinite scroll: bật khi toggle bật hoặc chọn "Xem tất cả" (bỏ cap 100).
  const useInfinite = infinite || filters.perPage === 0;
  const infiniteFilters = useMemo(() => ({
    cat: filters.cat, city: filters.city, avoidNumbers: filters.avoidNumbers, vehicle: filters.vehicle || undefined,
    q: qDebounced || undefined, priceMin: filters.priceMin || undefined, priceMax: filters.priceMax || undefined,
    status: filters.status || undefined, sort: filters.sort, perPage: 18,
  }), [filters, qDebounced]);
  const inf = useInfinitePlates(infiniteFilters, { enabled: useInfinite });
  const stagger = useStaggeredReveal();

  useEffect(() => {
    if (!useInfinite) return;
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 640 && inf.hasNextPage && !inf.isFetchingNextPage) inf.fetchNextPage();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [useInfinite, inf.hasNextPage, inf.isFetchingNextPage, inf.fetchNextPage]);

  const infiniteItems = inf.data?.pages?.flatMap((p) => p.items || []) || [];
  const items = useInfinite ? infiniteItems : (data?.items || []);
  const total = useInfinite ? (inf.data?.pages?.[0]?.total || 0) : (data?.total || 0);
  const totalPages = useInfinite ? (inf.data?.pages?.[0]?.totalPages || 1) : (data?.totalPages || 1);
  const page = useInfinite ? 0 : (data?.page || filters.page);

  useEffect(() => {
    if (qDebounced) trackSearch(qDebounced);
  }, [qDebounced]);

  const listReady = useInfinite ? !inf.isLoading : !isLoading;
  useEffect(() => {
    if (!listReady) return;
    if (items.length > 0) {
      trackViewItemList(filters.q ? 'search_results' : 'danh-sach', items);
    } else if (filters.q) {
      trackSearchNoResults(filters.q, { cat: filters.cat, city: filters.city, vehicle: filters.vehicle, priceMin: filters.priceMin, priceMax: filters.priceMax });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listReady, items.length, filters.q]);

  // Khôi phục vị trí cuộn đã lưu (quay lại từ trang chi tiết biển) — chỉ chạy 1 lần sau khi có dữ liệu,
  // tránh cuộn hụt trong lúc trang còn đang load skeleton.
  const loading = useInfinite ? inf.isLoading : isLoading;
  useEffect(() => {
    if (loading || !items.length) return;
    const y = Number(sessionStorage.getItem('bsd_plate_list_scroll') || 0);
    if (y > 0) { window.scrollTo(0, y); sessionStorage.removeItem('bsd_plate_list_scroll'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);
  const showSkeleton = useInfinite ? inf.isLoading : (isLoading || isFetching);
  const showError = useInfinite ? inf.isError : isError;

  useSeo('list', { items });

  const toggleArrayFilter = (key, id) => {
    const isRemoving = filters[key].includes(id);
    if (key === 'avoidNumbers') trackAvoidNumberToggle(id, isRemoving ? 'remove' : 'add');
    setFilter({ [key]: isRemoving ? filters[key].filter((x) => x !== id) : [...filters[key], id] });
  };

  const clearFilters = () => setFilters((f) => ({ cat: [], city: [], avoidNumbers: [], vehicle: '', q: '', priceMin: '', priceMax: '', status: '', sort: 'newest', page: 1, perPage: f.perPage, view: f.view }));

  const goToPage = (p) => {
    setFilters((f) => ({ ...f, page: p }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Lưu vị trí cuộn trước khi vào chi tiết biển — bộ lọc đã tự lưu qua URL (readFiltersFromUrl),
  // chỉ còn vị trí cuộn cần lưu riêng để quay lại không phải lướt tìm lại từ đầu.
  const saveScrollBeforeOpen = () => {
    try { sessionStorage.setItem('bsd_plate_list_scroll', String(window.scrollY)); } catch { /* storage blocked */ }
  };

  const cardProps = (p) => ({
    ...p,
    fav: !!favs?.[p.id],
    onFav: onFav ? () => onFav(p.id) : undefined,
    onCompare: () => isInList(p.id) ? removeCompare(p.id) : addCompare(p.id),
    inCompare: isInList(p.id),
    onOpen: () => { trackSelectItem(p, 'danh-sach'); saveScrollBeforeOpen(); openPlate(p.id); },
    href: routeFor('detail', p.slug || p.id),
    onBuy: () => openBuy?.(p.id),
    contact,
  });

  // Breadcrumb bám theo filter tỉnh/loại biển đang chọn (chỉ khi đúng 1 giá trị — nhiều lựa chọn thì
  // không còn 1 "đường dẫn" rõ ràng để hiện, giữ flat "Biển số").
  const activeProvince = filters.city.length === 1 ? (provinces?.items || []).find((c) => c.id === filters.city[0]) : null;
  const activeType = filters.cat.length === 1 ? (plateTypes?.items || []).find((c) => c.id === filters.cat[0]) : null;

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      {go && (
        <Breadcrumb items={[
          { label: 'Trang chủ', onClick: go('home') },
          { label: 'Biển số', onClick: (activeProvince || activeType) ? () => setFilters((f) => ({ ...f, city: [], cat: [] })) : undefined },
          ...(activeProvince ? [{ label: activeProvince.name }] : []),
          ...(activeType ? [{ label: activeType.name }] : []),
        ]} />
      )}
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-7) var(--pad-page) var(--space-4)' }}>
        <h1 style={{ margin: 'var(--space-3) 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Kho biển số đẹp</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{total} biển số phù hợp bộ lọc hiện tại</p>
      </section>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <button type="button" aria-pressed={filters.cat.length === 0} onClick={() => setFilter({ cat: [] })}
          style={{ height: 40, padding: '0 18px', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: filters.cat.length === 0 ? 'var(--fw-bold)' : 'var(--fw-medium)', background: filters.cat.length === 0 ? 'var(--action-primary)' : 'var(--surface-sunken)', color: filters.cat.length === 0 ? 'var(--text-inverse)' : 'var(--text-body)', boxShadow: filters.cat.length === 0 ? 'none' : 'var(--shadow-inset-hairline)' }}>
          Tất cả
        </button>
        {(plateTypes?.items || []).map((c) => {
          const active = filters.cat.length === 1 && filters.cat[0] === c.id;
          return (
            <button key={c.id} type="button" aria-pressed={active} onClick={() => setFilter({ cat: active ? [] : [c.id] })}
              style={{ height: 40, padding: '0 18px', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)', background: active ? 'var(--action-primary)' : 'var(--surface-sunken)', color: active ? 'var(--text-inverse)' : 'var(--text-body)', boxShadow: active ? 'none' : 'var(--shadow-inset-hairline)' }}>
              {c.name}
            </button>
          );
        })}
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
            <div ref={filterPanelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Bộ lọc biển số" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 'min(320px, 88vw)', background: 'var(--white)', boxShadow: 'var(--shadow-4)', display: 'flex', flexDirection: 'column', animation: 'modalIn 180ms var(--ease-out)', outline: 'none' }}>
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
                  {(provinceExpanded ? (provinces?.items || []) : (provinces?.items || []).slice(0, PROVINCE_VISIBLE_COUNT)).map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <Checkbox label={c.name} checked={filters.city.includes(c.id)} onChange={() => toggleArrayFilter('city', c.id)} style={{ flex: 1 }} />
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{c.plateCount}</span>
                    </div>
                  ))}
                  {(provinces?.items?.length || 0) > PROVINCE_VISIBLE_COUNT && (
                    <button type="button" onClick={() => setProvinceExpanded((v) => !v)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', font: 'var(--type-body-sm)', color: 'var(--action-primary)' }}>
                      {provinceExpanded ? 'Thu gọn' : `Xem thêm ${provinces.items.length - PROVINCE_VISIBLE_COUNT} tỉnh`}
                    </button>
                  )}
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
                <div style={{ height: 1, background: 'var(--border-hairline)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Khoảng giá (đồng)</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {PRICE_PRESETS.map((p) => {
                      const active = filters.priceMin === p.min && filters.priceMax === p.max;
                      return (
                        <button key={p.label} type="button" aria-pressed={active} onClick={() => { if (!active) trackSelectPricePreset(p.label); setFilter(active ? { priceMin: '', priceMax: '' } : { priceMin: p.min, priceMax: p.max }, true); }}
                          style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', background: active ? 'var(--action-primary)' : 'var(--surface-muted)', color: active ? 'var(--white)' : 'var(--text-body)' }}>{p.label}</button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <input type="number" min="0" step="1000000" inputMode="numeric" value={filters.priceMin} onChange={(e) => setFilter({ priceMin: e.target.value })} placeholder="Từ"
                      style={{ flex: 1, minWidth: 0, height: 44, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }} />
                    <span style={{ color: 'var(--text-faint)' }}>—</span>
                    <input type="number" min="0" step="1000000" inputMode="numeric" value={filters.priceMax} onChange={(e) => setFilter({ priceMax: e.target.value })} placeholder="Đến"
                      style={{ flex: 1, minWidth: 0, height: 44, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ height: 1, background: 'var(--border-hairline)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Tránh số</span>
                  {AVOID_NUMBER_PRESETS.map((n) => (
                    <Checkbox key={n} label={`Tránh ${n}`} checked={filters.avoidNumbers.includes(n)} onChange={() => toggleArrayFilter('avoidNumbers', n)} />
                  ))}
                </div>
                <div style={{ height: 1, background: 'var(--border-hairline)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Trạng thái</span>
                  <Checkbox label="Chỉ xem biển đã bán" checked={filters.status === 'sold'} onChange={() => setFilter({ status: filters.status === 'sold' ? '' : 'sold' })} />
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
            {(provinceExpanded ? (provinces?.items || []) : (provinces?.items || []).slice(0, PROVINCE_VISIBLE_COUNT)).map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Checkbox label={c.name} checked={filters.city.includes(c.id)} onChange={() => toggleArrayFilter('city', c.id)} style={{ flex: 1 }} />
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{c.plateCount}</span>
              </div>
            ))}
            {(provinces?.items?.length || 0) > PROVINCE_VISIBLE_COUNT && (
              <button type="button" onClick={() => setProvinceExpanded((v) => !v)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', font: 'var(--type-body-sm)', color: 'var(--action-primary)' }}>
                {provinceExpanded ? 'Thu gọn' : `Xem thêm ${provinces.items.length - PROVINCE_VISIBLE_COUNT} tỉnh`}
              </button>
            )}
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
          <div style={{ height: 1, background: 'var(--border-hairline)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Khoảng giá (đồng)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRICE_PRESETS.map((p) => {
                const active = filters.priceMin === p.min && filters.priceMax === p.max;
                return (
                  <button key={p.label} type="button" aria-pressed={active} onClick={() => { if (!active) trackSelectPricePreset(p.label); setFilter(active ? { priceMin: '', priceMax: '' } : { priceMin: p.min, priceMax: p.max }, true); }}
                    style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', background: active ? 'var(--action-primary)' : 'var(--surface-muted)', color: active ? 'var(--white)' : 'var(--text-body)' }}>{p.label}</button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <input type="number" min="0" step="1000000" inputMode="numeric" value={filters.priceMin} onChange={(e) => setFilter({ priceMin: e.target.value })} placeholder="Từ"
                style={{ flex: 1, minWidth: 0, height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }} />
              <span style={{ color: 'var(--text-faint)' }}>—</span>
              <input type="number" min="0" step="1000000" inputMode="numeric" value={filters.priceMax} onChange={(e) => setFilter({ priceMax: e.target.value })} placeholder="Đến"
                style={{ flex: 1, minWidth: 0, height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }} />
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--border-hairline)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Tránh số</span>
            {AVOID_NUMBER_PRESETS.map((n) => (
              <Checkbox key={n} label={`Tránh ${n}`} checked={filters.avoidNumbers.includes(n)} onChange={() => toggleArrayFilter('avoidNumbers', n)} />
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--border-hairline)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Trạng thái</span>
            <Checkbox label="Chỉ xem biển đã bán" checked={filters.status === 'sold'} onChange={() => setFilter({ status: filters.status === 'sold' ? '' : 'sold' })} />
          </div>
          <Button variant="outline" size="sm" fullWidth onClick={clearFilters}>Xóa bộ lọc</Button>
        </aside>
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {listNotice && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-pill)', padding: '8px 16px', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
              <Icon name="sparkles" size={16} />
              <span style={{ flex: 1 }}>{listNotice.text}</span>
              <Button variant="ghost" size="sm" onClick={() => { setFilters((f) => ({ ...f, q: '', page: 1 })); onClearNotice?.(); }}>Bỏ lọc</Button>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {activeFilterCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-tint-cream)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>
                  {activeFilterCount} bộ lọc đang bật
                </span>
              )}
              <div style={{ display: 'flex', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', padding: 3, gap: 2 }}>
                <button type="button" aria-label="Xem dạng lưới" aria-pressed={filters.view !== 'list'} onClick={() => setFilter({ view: 'grid', page: filters.page })}
                  style={{ width: 34, height: 34, border: 'none', borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: filters.view !== 'list' ? 'var(--white)' : 'transparent', boxShadow: filters.view !== 'list' ? 'var(--shadow-1, 0 1px 2px rgba(0,0,0,.08))' : 'none', color: filters.view !== 'list' ? 'var(--action-primary)' : 'var(--text-muted)' }}>
                  <LayoutGrid size={16} />
                </button>
                <button type="button" aria-label="Xem dạng danh sách" aria-pressed={filters.view === 'list'} onClick={() => setFilter({ view: 'list', page: filters.page })}
                  style={{ width: 34, height: 34, border: 'none', borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: filters.view === 'list' ? 'var(--white)' : 'transparent', boxShadow: filters.view === 'list' ? 'var(--shadow-1, 0 1px 2px rgba(0,0,0,.08))' : 'none', color: filters.view === 'list' ? 'var(--action-primary)' : 'var(--text-muted)' }}>
                  <ListIcon size={16} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
              {hasActiveFilters && <Button className="list-toolbar-secondary" variant="outline" size="sm" onClick={openSaveModal}>Lưu tìm kiếm này</Button>}
              <button type="button" className="list-toolbar-secondary" aria-pressed={infinite} onClick={() => setInfinite((v) => !v)} style={{ height: 36, padding: '0 14px', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', background: infinite ? 'var(--action-primary)' : 'var(--surface-sunken)', color: infinite ? 'var(--white)' : 'var(--text-body)', boxShadow: 'var(--shadow-inset-hairline)' }}>Cuộn tải thêm: {infinite ? 'Bật' : 'Tắt'}</button>
              {!infinite && <Select value={String(filters.perPage)} options={PER_PAGE_OPTIONS} onChange={(v) => setFilter({ perPage: Number(v), page: 1 })} variant="pill" />}
              <Select  value={filters.sort} options={SORT_OPTIONS} onChange={(v) => setFilter({ sort: v })} variant="pill" />
            </div>
          </div>
          {showSkeleton ? (
            <div className="plate-grid" style={{ display: 'grid', gridTemplateColumns: filters.view === 'list' ? '1fr' : 'repeat(auto-fill,minmax(min(268px,100%),1fr))', gap: 'var(--gutter-section)' }}>
              {Array.from({ length: items.length || 8 }, (_, i) => <PlateCardSkeleton key={i} />)}
            </div>
          ) : showError ? (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
              <span style={{ font: 'var(--type-body)', color: 'var(--status-danger)' }}>Không tải được danh sách biển số.</span>
              <Button variant="outline" size="md" onClick={() => (useInfinite ? inf.refetch() : refetch())}>Thử lại</Button>
            </div>
          ) : items.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{total} biển số</span>
              <div className="plate-grid" style={{ display: 'grid', gridTemplateColumns: filters.view === 'list' ? '1fr' : 'repeat(auto-fill,minmax(min(268px,100%),1fr))', gap: 'var(--gutter-section)' }}>
                {items.map((p, i) => <PlateCard key={p.id} {...cardProps(p)} plateSize={filters.view === 'list' ? 'listLg' : 'md'} style={stagger(i)} />)}
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
              <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Không tìm thấy biển số phù hợp</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 380 }}>Thử bỏ một vài bộ lọc, hoặc nhập đuôi số khác.</span>
              <Button variant="dark" size="md" onClick={clearFilters}>Xóa bộ lọc</Button>
            </div>
          )}
          {useInfinite && inf.isFetchingNextPage && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4) 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải thêm…</div>
          )}
          {!useInfinite && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-2)', paddingTop: 'var(--space-3)' }}>
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => goToPage(Math.max(1, page - 1))}>Trước</Button>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Trang {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => goToPage(Math.min(totalPages, page + 1))}>Sau</Button>
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
