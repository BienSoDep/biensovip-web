import { useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  CarFront, Check, X, Users, ArrowUpDown, ArrowUp, ArrowDown, Star, Pin, Eye, EyeOff, Lock, SlidersHorizontal, LayoutGrid, List as ListIcon, ChevronDown, ChevronUp,
} from 'lucide-react';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';
import AuditHistoryButton from '../../../components/AuditHistoryButton.jsx';
import { Badge, Select, IconButton, SearchField, InfoTip } from '../../../components/index.jsx';
import VpaPlateDrawer from './VpaPlateDrawer.jsx';
import { useAdminCategories } from '../../../services/categories.js';
import {
  useVpaAdminPlates, useSetVpaPrice, useApproveVpaSuggested, useRejectVpaPrice, useApproveVpaGroup, useHideVpaPlate, usePinVpaPlate,
  useUpdateVpaPlate, useCreateVpaPlate, useBulkEditVpa, exportVpaCsv,
} from '../../../services/adminVpa.js';
import { parsePlateNumber } from '../../../lib/plateFormat.js';
import { formatDate } from '../../../lib/date.js';
import { VPA_TAB_LABELS, VPA_PRICE_STATES, VPA_HELP, formatDateTime, isCar } from '../../../lib/vpaFormat.js';

const MAX_BULK = 500;
const COL_KEY = 'bsv.admin.vpaColumns';
const money = (v) => (v == null ? '—' : `${new Intl.NumberFormat('vi-VN').format(v)}đ`);
const PER_PAGE = [{ value: 20, label: '20/trang' }, { value: 50, label: '50/trang' }, { value: 100, label: '100/trang' }];
const ALL = { value: '', label: 'Tất cả' };
const TAB_FILTER = [{ value: '', label: 'Mọi tab' }, ...Object.entries(VPA_TAB_LABELS).map(([value, label]) => ({ value, label }))];
const TAB_ROW = Object.entries(VPA_TAB_LABELS).map(([value, label]) => ({ value, label }));
const VEHICLES = [ALL, { value: 'Car', label: 'Ô tô' }, { value: 'MotorBike', label: 'Xe máy' }];
const STATE_OPTS = [{ value: '', label: 'Mọi trạng thái giá' }, ...Object.entries(VPA_PRICE_STATES).map(([value, s]) => ({ value, label: s.label }))];
const YES_NO = (yes, no) => [ALL, { value: 'true', label: yes }, { value: 'false', label: no }];
const COLUMNS = [
  { key: 'plateType', label: 'Loại biển', default: true },
  { key: 'vehicle', label: 'Loại xe', default: true },
  { key: 'province', label: 'Tỉnh/thành', default: true },
  { key: 'tab', label: 'Tab / Phiên', default: true },
  { key: 'startingPrice', label: 'Giá khởi điểm', default: true },
  { key: 'suggested', label: 'Giá gợi ý (mẫu)', default: true },
  { key: 'approved', label: 'Giá duyệt', default: true },
  { key: 'priceState', label: 'Trạng thái giá', default: true },
  { key: 'updatedAt', label: 'Cập nhật', default: false },
];
const loadCols = () => {
  const base = Object.fromEntries(COLUMNS.map((c) => [c.key, c.default]));
  try { return { ...base, ...(JSON.parse(localStorage.getItem(COL_KEY) || 'null') || {}) }; } catch { return base; }
};
const dateField = { height: 32, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', padding: '0 8px', font: 'var(--type-caption)' };
const catOpts = (list) => (list || []).map((c) => ({ value: c.id, label: c.name }));
const chip = { background: 'var(--surface-sunken)', color: 'var(--text-body)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', font: 'var(--type-caption)' };
const bulkBtn = { border: 'none', background: 'var(--white)', color: 'var(--text-strong)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' };
const roundBtn = { width: 36, height: 36, borderRadius: '50%', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

function SortHeader({ sort, toggleSort, label, sortKey, style, tip }) {
  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <button type="button" onClick={() => toggleSort(sortKey)} aria-sort={sort?.key === sortKey ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit' }}>
        {label}
        {sort?.key === sortKey ? (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
      </button>
      {tip && <InfoTip size={12} text={tip} />}
    </span>
  );
}

// Danh sách biển VPA cho Admin — cùng bố cục và công cụ với trang Biển số (lọc, cột, sắp xếp, sửa nhanh, hàng loạt, CSV, ngăn kéo).
// queue = hàng đợi Duyệt giá (chỉ biển Có gợi ý / Đề xuất đổi giá).
export default function VpaAdminList({ queue = false, notify }) {
  const [f, setF] = useState({ tab: '', vehicle: '', priceState: '', hidden: '', featured: '', manual: '', plateTypeId: '', provinceId: '', from: '', to: '' });
  const [q, setQ] = useState('');
  const [dq] = useDebouncedValue(q, 300);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sort, setSort] = useState(null);
  const [sel, setSel] = useState(() => new Set());
  const [cols, setCols] = useState(loadCols);
  const [colMenu, setColMenu] = useState(false);
  const [mobileView, setMobileView] = useState('card');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [drawer, setDrawer] = useState(null); // null | { plate? }
  const [cell, setCell] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [quick, setQuick] = useState({ plateNumber: '', vehicle: 'Car', tab: '1', price: '' });

  const { data: typeData } = useAdminCategories('plate_type');
  const { data: provData } = useAdminCategories('province');
  const plateTypes = catOpts(typeData?.items);
  const provinces = catOpts(provData?.items);

  const params = { queue: queue || undefined, ...f, q: dq, page, limit, sort: sort?.key, dir: sort?.dir };
  const { data, isLoading, isError, refetch } = useVpaAdminPlates(params);
  const setPrice = useSetVpaPrice();
  const approve = useApproveVpaSuggested();
  const reject = useRejectVpaPrice();
  const approveGroup = useApproveVpaGroup();
  const hide = useHideVpaPlate();
  const pin = usePinVpaPlate();
  const update = useUpdateVpaPlate();
  const create = useCreateVpaPlate();
  const bulk = useBulkEditVpa();

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const filterCount = Object.values(f).filter(Boolean).length;
  const setFilter = (k) => (v) => { setF((x) => ({ ...x, [k]: v })); setPage(1); setSel(new Set()); };
  const toggleCol = (key) => setCols((p) => {
    const n = { ...p, [key]: !p[key] };
    try { localStorage.setItem(COL_KEY, JSON.stringify(n)); } catch { /* ignore */ }
    return n;
  });
  const toggleSort = (key) => { setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })); setPage(1); };
  const toggleOne = (id) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allSelected = items.length > 0 && items.every((i) => sel.has(i.id));
  const someSelected = items.some((i) => sel.has(i.id));
  const toggleAll = () => setSel(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  const bulkIds = [...sel].slice(0, MAX_BULK);

  const run = async (fn, okMsg, clear = false) => {
    try {
      const r = await fn();
      notify?.(typeof okMsg === 'function' ? okMsg(r) : okMsg);
      if (clear) setSel(new Set());
      return true;
    } catch (e) {
      notify?.(e.message || 'Thao tác thất bại');
      return false;
    }
  };
  const bulkMsg = (verb) => (r) => `${verb} ${r.affected} biển${r.skipped ? ` (bỏ qua ${r.skipped})` : ''}`;
  const bulkEdit = (body, verb) => run(() => bulk.mutateAsync({ ids: bulkIds, ...body }), bulkMsg(verb), true);

  const doExport = async () => {
    setExporting(true);
    try { await exportVpaCsv({ ...params, page: undefined, limit: undefined }); } catch (e) { notify?.(e.message); } finally { setExporting(false); }
  };

  const quickAdd = async () => {
    const price = quick.price === '' ? null : Number(quick.price);
    if (!quick.plateNumber.trim()) { notify?.('Nhập số biển'); return; }
    if (price != null && (!Number.isFinite(price) || price <= 0)) { notify?.('Giá phải lớn hơn 0'); return; }
    const ok = await run(() => create.mutateAsync({
      plateNumber: quick.plateNumber.trim(), vehicle: quick.vehicle, tab: Number(quick.tab), approvedPrice: price, isFeatured: false,
    }), 'Đã thêm biển VPA');
    if (ok) setQuick((x) => ({ ...x, plateNumber: '', price: '' }));
  };

  const commitPrice = async (p) => {
    const price = Number(cell?.value);
    setCell(null);
    if (!Number.isFinite(price) || price <= 0) { notify?.('Giá phải lớn hơn 0'); return; }
    await run(() => setPrice.mutateAsync({ id: p.id, price }), 'Đã cập nhật giá');
  };
  const changeTab = (p, tab) => run(() => update.mutateAsync({ id: p.id, body: { tab: Number(tab) } }), 'Đã đổi tab (khóa, crawl không ghi đè)');
  const toggleFeatured = (p) => run(() => update.mutateAsync({ id: p.id, body: { isFeatured: !p.isFeatured } }), p.isFeatured ? 'Đã bỏ nổi bật' : 'Đã đánh dấu nổi bật');
  const toggleHide = (p) => run(() => hide.mutateAsync({ id: p.id, value: !p.isHidden }), p.isHidden ? 'Đã hiện biển' : 'Đã ẩn biển');
  const togglePin = (p) => run(() => pin.mutateAsync({ id: p.id, value: !p.isPinned }), p.isPinned ? 'Đã bỏ ghim' : 'Đã ghim lên đầu');
  const pending = (p) => p.priceState === 1 || p.priceState === 4;

  const sh = { sort, toggleSort };

  const priceCell = (p) => {
    if (cell?.id === p.id) {
      return (
        <input autoFocus value={cell.value} onChange={(e) => setCell({ ...cell, value: e.target.value })} onBlur={() => commitPrice(p)} onFocus={(e) => e.target.select()}
          onKeyDown={(e) => { if (e.key === 'Enter') commitPrice(p); if (e.key === 'Escape') setCell(null); }}
          style={{ border: 'none', font: 'var(--type-caption)', padding: '4px 6px', borderRadius: 'var(--radius-sm)', width: '100%', background: 'var(--white)', boxShadow: 'inset 0 0 0 1.5px var(--action-primary)' }} />
      );
    }
    return (
      <button type="button" title="Bấm để sửa giá duyệt" onClick={() => setCell({ id: p.id, value: String(p.approvedPrice || p.suggestedPrice || '') })}
        style={{ border: 'none', background: 'none', cursor: 'text', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', textAlign: 'left', padding: '4px 6px', borderRadius: 'var(--radius-sm)', width: '100%' }}>
        {p.approvedPrice ? money(p.approvedPrice) : '—'}
      </button>
    );
  };

  const flags = (p, size) => (
    <>
      <button type="button" onClick={() => toggleFeatured(p)} title={p.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', flexShrink: 0 }}>
        <Star size={size} fill={p.isFeatured ? 'var(--amber-500)' : 'none'} color={p.isFeatured ? 'var(--amber-500)' : 'var(--grey-300)'} />
      </button>
      {p.isPinned && <Pin size={size} color="var(--action-primary)" aria-label="Đã ghim" />}
      {p.lockedFields > 0 && <span title={VPA_HELP.lock} style={{ display: 'inline-flex' }}><Lock size={size - 1} color="var(--text-muted)" /></span>}
    </>
  );

  const actions = (p) => (
    <>
      {pending(p) && p.suggestedPrice && (
        <button type="button" aria-label="Duyệt giá gợi ý" title="Duyệt giá gợi ý" onClick={() => run(() => approve.mutateAsync([p.id]), 'Đã đồng ý giá gợi ý')}
          style={{ ...roundBtn, background: 'var(--action-primary)', color: 'var(--white)' }}><Check size={16} /></button>
      )}
      {pending(p) && (
        <button type="button" aria-label="Từ chối giá gợi ý" title="Từ chối giá gợi ý" onClick={() => run(() => reject.mutateAsync([p.id]), 'Đã từ chối')}
          style={{ ...roundBtn, background: 'var(--surface-muted)', color: 'var(--status-danger)' }}><X size={16} /></button>
      )}
      {pending(p) && p.priceGroupId && p.suggestedPrice && (
        <button type="button" aria-label="Duyệt cả nhóm" title="Duyệt cả nhóm biển cùng giá" onClick={() => run(() => approveGroup.mutateAsync(p.priceGroupId), (r) => `Đã đồng ý ${r.affected} biển trong nhóm`)}
          style={{ ...roundBtn, background: 'var(--surface-muted)', color: 'var(--text-body)' }}><Users size={16} /></button>
      )}
      <IconButton name="pencil" label="Sửa" size="sm" onClick={() => setDrawer({ plate: p })} />
      <button type="button" aria-label={p.isHidden ? 'Hiện biển' : 'Ẩn biển'} title={p.isHidden ? 'Hiện biển' : 'Ẩn khỏi khách'} onClick={() => toggleHide(p)}
        style={{ ...roundBtn, background: 'var(--surface-muted)', color: 'var(--text-body)' }}>
        {p.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <button type="button" aria-label={p.isPinned ? 'Bỏ ghim' : 'Ghim'} title={p.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'} onClick={() => togglePin(p)}
        style={{ ...roundBtn, background: p.isPinned ? 'var(--brand-50)' : 'var(--surface-muted)', color: p.isPinned ? 'var(--action-primary)' : 'var(--text-body)' }}>
        <Pin size={16} />
      </button>
      <AuditHistoryButton entityType="vpa_plate" entityId={p.id} />
    </>
  );

  const tabSelect = (p) => (
    <select value={String(p.tab)} onChange={(e) => changeTab(p, e.target.value)} aria-label="Đổi tab"
      style={{ border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', font: 'var(--type-caption)', color: 'var(--text-body)', outline: 'none', cursor: 'pointer' }}>
      {TAB_ROW.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
    </select>
  );

  const emptyBox = !isLoading && !isError && items.length === 0 && (
    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
      <CarFront size={40} style={{ color: 'var(--text-faint)' }} />
      {queue ? 'Không có biển nào đang chờ duyệt giá.' : 'Không có biển VPA nào khớp bộ lọc.'}
    </div>
  );
  const errorBox = !isLoading && isError && (
    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--status-danger)' }}>
      Lỗi tải danh sách biển VPA.{' '}
      <button type="button" onClick={() => refetch()} style={{ color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Thử lại</button>
    </div>
  );
  const rowBadges = (p) => (
    <>
      {p.isManual && <Badge tone="blue">Thêm tay</Badge>}
      {p.isHidden && <Badge tone="neutral">Ẩn</Badge>}
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {!queue && (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', flex: '0 0 auto' }}>Thêm nhanh</span>
            {[['plateNumber', '30A-567.89', 'text'], ['price', 'Giá (VNĐ) — trống = Giá liên hệ', 'text']].map(([k, ph]) => (
              <input key={k} value={quick[k]} placeholder={ph} onChange={(e) => setQuick((x) => ({ ...x, [k]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') quickAdd(); }}
                style={{ height: 36, minWidth: 0, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 12px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none', flex: '1 1 150px' }} />
            ))}
            <Select value={quick.tab} options={TAB_ROW.slice(0, 3)} onChange={(v) => setQuick((x) => ({ ...x, tab: v }))} />
            <Select value={quick.vehicle} options={VEHICLES.slice(1)} onChange={(v) => setQuick((x) => ({ ...x, vehicle: v }))} />
            <Button variant="primary" size="md" loading={create.isPending} onClick={quickAdd}>Thêm</Button>
          </div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Nhập biển số, giá (bỏ trống = Giá liên hệ), chọn tab và loại xe rồi bấm Thêm. Hệ thống tự nhận loại biển và tỉnh từ số biển; crawl không đổi biển thêm tay. Cần chỉnh thêm loại biển/tỉnh/giờ phiên? Bấm &quot;Thêm biển VPA (đầy đủ)&quot;.
          </span>
        </div>
      )}

      <div className="admin-plates-mobile-bar" style={{ flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <div style={{ flex: 1 }}><SearchField placeholder="Tìm biển số…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
          {!queue && <Button variant="primary" size="sm" onClick={() => setDrawer({})} style={{ flexShrink: 0 }}>+ Thêm</Button>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button variant={filtersOpen ? 'dark' : 'ghost'} size="sm" onClick={() => setFiltersOpen((v) => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <SlidersHorizontal size={14} /><span>Bộ lọc {filterCount > 0 ? `(${filterCount})` : ''}</span>{filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
          <div style={{ display: 'inline-flex', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', padding: 2, border: '1px solid var(--grey-200)' }}>
            {[['card', 'Thẻ', LayoutGrid], ['table', 'Bảng', ListIcon]].map(([k, text, Ic]) => (
              <button key={k} type="button" onClick={() => setMobileView(k)}
                style={{ border: 'none', background: mobileView === k ? 'var(--white)' : 'none', boxShadow: mobileView === k ? 'var(--shadow-1)' : 'none', borderRadius: 'var(--radius-pill)', padding: '4px 10px', font: 'var(--type-caption)', fontWeight: mobileView === k ? 'var(--fw-semibold)' : 'var(--fw-regular)', color: mobileView === k ? 'var(--text-strong)' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <Ic size={13} /> {text}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`admin-plates-filters ${filtersOpen ? 'admin-filters-mobile-open' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
          {!queue && <Select label="Tab" value={f.tab} options={TAB_FILTER} onChange={setFilter('tab')} />}
          <SearchField placeholder="Tìm biển số…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} width={220} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 2, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Phiên từ ngày
            <input type="date" value={f.from} onChange={(e) => setFilter('from')(e.target.value)} style={dateField} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 2, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Đến ngày
            <input type="date" value={f.to} onChange={(e) => setFilter('to')(e.target.value)} style={dateField} />
          </label>
          <Select label="Hiển thị" value={limit} options={PER_PAGE} onChange={(v) => { setLimit(Number(v)); setPage(1); }} />
          <div style={{ position: 'relative' }}>
            <Button variant="ghost" size="md" onClick={() => setColMenu((o) => !o)}>Cột hiển thị</Button>
            {colMenu && (
              <>
                <div onClick={() => setColMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 10, background: 'var(--white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-2)', minWidth: 200, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {COLUMNS.map((c) => (
                    <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                      <input type="checkbox" checked={!!cols[c.key]} onChange={() => toggleCol(c.key)} style={{ width: 14, height: 14, accentColor: 'var(--action-primary)', cursor: 'pointer' }} />
                      {c.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <Button variant="ghost" size="md" disabled={exporting} onClick={doExport}>{exporting ? 'Đang xuất…' : 'Xuất CSV'}</Button>
          {!queue && <Button variant="primary" size="md" onClick={() => setDrawer({})}>Thêm biển VPA (đầy đủ)</Button>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
          <Select label="Loại biển" value={f.plateTypeId} options={[ALL, ...plateTypes]} onChange={setFilter('plateTypeId')} />
          <Select label="Loại xe" value={f.vehicle} options={VEHICLES} onChange={setFilter('vehicle')} />
          <Select label="Tỉnh/thành" value={f.provinceId} options={[ALL, ...provinces]} onChange={setFilter('provinceId')} />
          <Select label="Nổi bật" value={f.featured} options={YES_NO('Chỉ nổi bật', 'Không nổi bật')} onChange={setFilter('featured')} />
          {!queue && <Select label="Trạng thái giá" value={f.priceState} options={STATE_OPTS} onChange={setFilter('priceState')} />}
          {!queue && <Select label="Ẩn/hiện" value={f.hidden} options={YES_NO('Đang ẩn', 'Đang hiện')} onChange={setFilter('hidden')} />}
          {!queue && <Select label="Nguồn" value={f.manual} options={YES_NO('Thêm tay', 'Đồng bộ VPA')} onChange={setFilter('manual')} />}
        </div>
      </div>

      <div className={`admin-plates-cards-container ${mobileView === 'card' ? 'is-active' : ''}`}>
        {isLoading && <div style={{ padding: 'var(--space-4)' }}><Skeleton variant="table" rows={6} /></div>}
        {errorBox}{emptyBox}
        {!isLoading && items.map((p) => {
          const parsed = parsePlateNumber(p.plateNumber);
          const st = VPA_PRICE_STATES[p.priceState];
          return (
            <div key={p.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-3) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
                  <input type="checkbox" aria-label={`Chọn ${p.plateNumber}`} checked={sel.has(p.id)} onChange={() => toggleOne(p.id)} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)', cursor: 'pointer', flexShrink: 0 }} />
                  <div style={{ flexShrink: 0 }}><PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {flags(p, 15)}
                      <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.plateNumber}</span>
                    </div>
                    <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{rowBadges(p)}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)' }}>{p.approvedPrice ? money(p.approvedPrice) : 'Giá liên hệ'}</div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Gợi ý: {p.suggestedPrice ? `${money(p.suggestedPrice)} (${p.sampleCount})` : '—'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {p.plateTypeName && <span style={chip}>{p.plateTypeName}</span>}
                <span style={chip}>{isCar(p.vehicle) ? 'Ô tô' : 'Xe máy'}</span>
                {p.provinceName && <span style={chip}>{p.provinceName}</span>}
                <Badge tone={st.tone}>{st.label}</Badge>
                <span style={chip}>{formatDateTime(p.auctionStartAt)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--grey-100)', flexWrap: 'wrap' }}>
                {tabSelect(p)}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap' }}>{actions(p)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`admin-plates-table-container ${mobileView === 'table' ? 'force-mobile-table' : ''}`} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div className="admin-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 1280 }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              <span style={{ flex: '0 0 34px' }}>
                <input type="checkbox" aria-label="Chọn tất cả" checked={allSelected} onChange={toggleAll} ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }} style={{ width: 16, height: 16, accentColor: 'var(--action-primary)', cursor: 'pointer' }} />
              </span>
              <span style={{ flex: '0 0 56px' }}>Ảnh</span>
              <SortHeader {...sh} label="Biển số" sortKey="plateNumber" style={{ flex: '1 1 150px' }} />
              {cols.plateType && <SortHeader {...sh} label="Loại biển" sortKey="plateTypeName" style={{ flex: '1 1 88px' }} />}
              {cols.vehicle && <SortHeader {...sh} label="Loại xe" sortKey="vehicle" style={{ flex: '0 0 72px' }} />}
              {cols.province && <SortHeader {...sh} label="Tỉnh" sortKey="provinceName" style={{ flex: '1 1 96px' }} />}
              {cols.tab && <SortHeader {...sh} label="Tab / Phiên" sortKey="auctionStartAt" tip={VPA_HELP.tab} style={{ flex: '1 1 140px' }} />}
              {cols.startingPrice && <SortHeader {...sh} label="Giá khởi điểm" sortKey="startingPrice" tip={VPA_HELP.startingPrice} style={{ flex: '1 1 104px' }} />}
              {cols.suggested && <SortHeader {...sh} label="Giá gợi ý (mẫu)" sortKey="suggestedPrice" tip={VPA_HELP.suggested} style={{ flex: '1 1 124px' }} />}
              {cols.approved && <SortHeader {...sh} label="Giá duyệt" sortKey="approvedPrice" tip={VPA_HELP.approved} style={{ flex: '1 1 110px' }} />}
              {cols.priceState && <SortHeader {...sh} label="Trạng thái giá" sortKey="priceState" tip={VPA_HELP.priceState} style={{ flex: '1 1 120px' }} />}
              {cols.updatedAt && <SortHeader {...sh} label="Cập nhật" sortKey="updatedAt" style={{ flex: '1 1 90px' }} />}
              <span style={{ flex: '0 0 296px' }}>Thao tác</span>
            </div>

            {isLoading && <div style={{ padding: 'var(--space-4)' }}><Skeleton variant="table" rows={6} /></div>}

            {!isLoading && items.map((p) => {
              const parsed = parsePlateNumber(p.plateNumber);
              const st = VPA_PRICE_STATES[p.priceState];
              return (
                <div key={p.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-2) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', opacity: p.isHidden ? 0.6 : 1 }}>
                  <span style={{ flex: '0 0 34px' }}>
                    <input type="checkbox" aria-label={`Chọn ${p.plateNumber}`} checked={sel.has(p.id)} onChange={() => toggleOne(p.id)} style={{ width: 16, height: 16, accentColor: 'var(--action-primary)', cursor: 'pointer' }} />
                  </span>
                  <span style={{ flex: '0 0 56px' }}><PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} /></span>
                  <span style={{ flex: '1 1 150px', display: 'flex', alignItems: 'center', gap: 4, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', minWidth: 0 }}>
                    {flags(p, 14)}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.plateNumber}</span>
                    {rowBadges(p)}
                  </span>
                  {cols.plateType && <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.plateTypeName}</span>}
                  {cols.vehicle && <span style={{ flex: '0 0 72px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{isCar(p.vehicle) ? 'Ô tô' : 'Xe máy'}</span>}
                  {cols.province && <span style={{ flex: '1 1 96px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.provinceName}</span>}
                  {cols.tab && (
                    <span style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {tabSelect(p)}
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDateTime(p.auctionStartAt)}</span>
                    </span>
                  )}
                  {cols.startingPrice && <span style={{ flex: '1 1 104px', font: 'var(--type-body-sm)' }}>{money(p.startingPrice)}</span>}
                  {cols.suggested && <span style={{ flex: '1 1 124px', font: 'var(--type-body-sm)' }}>{p.suggestedPrice ? `${money(p.suggestedPrice)} (${p.sampleCount})` : `— (${p.sampleCount ?? 0} mẫu)`}</span>}
                  {cols.approved && <span style={{ flex: '1 1 110px' }}>{priceCell(p)}</span>}
                  {cols.priceState && <span style={{ flex: '1 1 120px' }}><Badge tone={st.tone}>{st.label}</Badge></span>}
                  {cols.updatedAt && <span style={{ flex: '1 1 90px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDate(p.updatedAt)}</span>}
                  <span style={{ flex: '0 0 296px', display: 'flex', gap: 'var(--space-1)', alignItems: 'center', flexWrap: 'wrap' }}>{actions(p)}</span>
                </div>
              );
            })}
          </div>
        </div>
        {errorBox}{emptyBox}
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} size="sm" />}

      {sel.size > 0 && (
        <div style={{
          position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 'var(--z-bulk)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center',
          padding: 'var(--space-2) var(--space-4)', background: 'var(--text-strong)', color: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', maxWidth: 'calc(100vw - 24px)', boxSizing: 'border-box',
        }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--white)' }}>Đã chọn {sel.size} biển{sel.size > MAX_BULK ? ` (chỉ xử lý ${MAX_BULK} đầu)` : ''}</span>
          <select defaultValue="" onChange={(e) => { if (e.target.value) { bulkEdit({ tab: Number(e.target.value) }, 'Đã đổi tab cho'); e.target.value = ''; } }}
            style={{ border: 'none', background: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', font: 'var(--type-caption)', color: 'var(--text-strong)', cursor: 'pointer', outline: 'none' }}>
            <option value="" disabled>Đổi tab ▾</option>
            {TAB_ROW.slice(0, 3).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {[
            ['Nổi bật', { isFeatured: true }, 'Đã đánh dấu nổi bật'], ['Bỏ nổi bật', { isFeatured: false }, 'Đã bỏ nổi bật'],
            ['Ghim', { isPinned: true }, 'Đã ghim'], ['Bỏ ghim', { isPinned: false }, 'Đã bỏ ghim'],
            ['Ẩn', { isHidden: true }, 'Đã ẩn'], ['Hiện', { isHidden: false }, 'Đã hiện'],
          ].map(([text, body, verb]) => (
            <button key={text} type="button" onClick={() => bulkEdit(body, verb)} disabled={bulk.isPending} style={bulkBtn}>{text}</button>
          ))}
          <button type="button" onClick={() => run(() => approve.mutateAsync(bulkIds), bulkMsg('Đã đồng ý giá gợi ý cho'), true)}
            style={{ ...bulkBtn, background: 'var(--action-primary)', color: 'var(--white)', fontWeight: 'var(--fw-bold)' }}>Duyệt giá gợi ý</button>
          <button type="button" onClick={() => run(() => reject.mutateAsync(bulkIds), bulkMsg('Đã từ chối'), true)}
            style={{ ...bulkBtn, background: 'var(--status-danger)', color: 'var(--white)', fontWeight: 'var(--fw-bold)' }}>Từ chối giá</button>
          <button type="button" onClick={() => setSel(new Set())} style={{ border: 'none', background: 'none', color: 'var(--white)', textDecoration: 'underline', font: 'var(--type-caption)', cursor: 'pointer' }}>Bỏ chọn</button>
        </div>
      )}

      {drawer && <VpaPlateDrawer plate={drawer.plate} plateTypes={plateTypes} provinces={provinces} notify={notify} onClose={() => setDrawer(null)} />}
    </div>
  );
}
