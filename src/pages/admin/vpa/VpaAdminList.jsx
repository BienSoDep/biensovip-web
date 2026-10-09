import { useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  CarFront, Check, X, Users, ArrowUpDown, ArrowUp, ArrowDown, Star, Pin, Eye, EyeOff, Lock, SlidersHorizontal, LayoutGrid, List as ListIcon, ChevronDown, ChevronUp, Sparkles,
  Copy, ExternalLink, MoreHorizontal, Plus, Calendar, TrendingUp, TrendingDown, RefreshCw,
} from 'lucide-react';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import PlateVisual from '../../../components/PlateVisual.jsx';
import AuditHistoryButton from '../../../components/AuditHistoryButton.jsx';
import { Badge, Select, IconButton, SearchField, InfoTip, PlateIssueTip } from '../../../components/index.jsx';
import VpaPlateDrawer from './VpaPlateDrawer.jsx';
import MultiFilter from './MultiFilter.jsx';
import VpaIntegrityPanel from './VpaIntegrityPanel.jsx';
import VpaStatsCharts from './VpaStatsCharts.jsx';
import VpaBulkSeedModal, { getVpaPlateIssues } from './VpaBulkSeedModal.jsx';
import PlateCountSummary from '../PlateCountSummary.jsx';
import { useAdminCategories } from '../../../services/categories.js';
import { useVpaCounts } from '../../../services/vpa.js';
import {
  useVpaAdminPlates, useVpaAdminFacets, useSetVpaPrice, useApproveVpaSuggested, useStartApproveAllVpaSuggested, useStartApproveRecomputedVpa, useVpaApproveRun,
  useRejectVpaPrice, useApproveVpaGroup, useHideVpaPlate, usePinVpaPlate,
  useUpdateVpaPlate, useCreateVpaPlate, useBulkEditVpa, exportVpaCsv, useVpaPlatePriceReference, useRecomputeVpaSuggestions,
} from '../../../services/adminVpa.js';
import ConfirmModal from '../../../components/ConfirmModal.jsx';
import { parsePlateNumber } from '../../../lib/plateFormat.js';
import { formatDate } from '../../../lib/date.js';
import { VPA_TAB_LABELS, VPA_PRICE_STATES, VPA_HELP, formatDateTime, isCar } from '../../../lib/vpaFormat.js';
import PriceReferenceModal from '../../../components/PriceReferenceModal.jsx';
import Modal from '../../../components/Modal.jsx';

const MAX_BULK = 500;
const COL_KEY = 'bsv.admin.vpaColumns';
const money = (v) => (v == null ? '—' : `${new Intl.NumberFormat('vi-VN').format(v)}đ`);
const PER_PAGE = [{ value: 20, label: '20/trang' }, { value: 50, label: '50/trang' }, { value: 100, label: '100/trang' }];
const ALL = { value: '', label: 'Tất cả' };
const VPA_FILTER_TABS = [
  { value: '', label: 'Tất cả biển VPA', note: 'Toàn bộ danh sách', countKey: 'all' },
  { value: '2', label: 'Biển số tuần', note: 'Biển chính thức', countKey: 'weekly' },
  { value: '1', label: 'Biển số tháng', note: 'Biển công bố', countKey: 'monthly' },
  { value: '3', label: 'Biển hết hạn', note: 'Biển hết hạn', countKey: 'expired' },
  { value: '4', label: 'Hết hạn nội bộ', note: 'Rút khỏi công bố', countKey: null },
];
const TAB_FULL_LABELS = {
  1: 'Biển tháng (công bố)',
  2: 'Biển tuần (chính thức)',
  3: 'Biển hết hạn',
  4: 'Hết hạn nội bộ',
};
const TAB_ROW = Object.entries(TAB_FULL_LABELS).map(([value, label]) => ({ value, label }));
const VEHICLES = [ALL, { value: 'Car', label: 'Ô tô' }, { value: 'MotorBike', label: 'Xe máy' }];
const STATE_OPTS = [{ value: '', label: 'Mọi trạng thái giá' }, ...Object.entries(VPA_PRICE_STATES).map(([value, s]) => ({ value, label: s.label }))];
const QUEUE_STATE_OPTS = [
  { value: '', label: 'Đang chờ duyệt (Có gợi ý & Đổi giá)' },
  { value: '0', label: 'Chưa có giá trên hệ thống (Cần sinh giá)' },
  { value: '1', label: 'Chỉ biển có giá gợi ý' },
  { value: '4', label: 'Chỉ biển đề xuất đổi giá' },
];
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
const FILTER_KEY = 'bsv.admin.vpaFilters';
// UC49 — "deep link" 1 lần từ popup nguồn giá gợi ý (trang Biển số) sang đây: ghi số biển cần tìm trước khi điều
// hướng, đọc + xóa ngay khi trang này mở để không ảnh hưởng lần mở sau.
const DEEPLINK_Q_KEY = 'bsv.admin.vpaDeepLinkQ';
export function openVpaWithSearch(go, plateNumber) {
  try { sessionStorage.setItem(DEEPLINK_Q_KEY, plateNumber); } catch { /* ignore */ }
  go('avpa')();
}
const consumeDeepLinkQ = () => {
  try {
    const v = sessionStorage.getItem(DEEPLINK_Q_KEY);
    if (v) sessionStorage.removeItem(DEEPLINK_Q_KEY);
    return v || '';
  } catch { return ''; }
};
// Loại biển / tỉnh đã chọn được nhớ cho lần mở sau (chỉ trang danh sách, không áp cho hàng đợi duyệt giá).
const loadSavedFilters = () => {
  try {
    const s = JSON.parse(localStorage.getItem(FILTER_KEY) || 'null') || {};
    return { plateTypeIds: Array.isArray(s.plateTypeIds) ? s.plateTypeIds : [], provinceIds: Array.isArray(s.provinceIds) ? s.provinceIds : [] };
  } catch { return { plateTypeIds: [], provinceIds: [] }; }
};
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

// UC49 — thanh tiến trình cho "Duyệt tất cả theo bộ lọc" / "Duyệt lại giá toàn bộ": run chạy nền, FE polling
// (useVpaApproveRun) mỗi giây. Chưa có Total (server đếm xong mới biết) → thanh pulse không xác định %.
function ApproveRunModal({ run, onClose }) {
  const running = !run || run.status === 'running';
  const pct = run?.total ? Math.min(100, Math.round((run.done * 100) / run.total)) : null;
  return (
    <Modal open title={running ? 'Đang duyệt giá…' : run.status === 'success' ? 'Duyệt giá xong' : 'Duyệt giá lỗi'} maxWidth="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div role="progressbar" aria-valuenow={pct ?? undefined} aria-valuemin={0} aria-valuemax={100}
          style={{ height: 8, borderRadius: 4, background: 'var(--grey-200)', overflow: 'hidden' }}>
          {pct == null ? (
            <div style={{
              width: '40%', height: '100%', background: 'var(--action-primary)', borderRadius: 4,
              animation: running ? 'vpaApproveIndeterminate 1.1s ease-in-out infinite' : 'none',
            }} />
          ) : (
            <div style={{ width: `${pct}%`, height: '100%', background: run?.status === 'error' ? 'var(--status-danger)' : 'var(--action-primary)', transition: 'width 300ms var(--ease-standard)' }} />
          )}
        </div>
        <style>{'@keyframes vpaApproveIndeterminate { 0% { margin-left: 0%; } 50% { margin-left: 60%; } 100% { margin-left: 0%; } }'}</style>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          {running
            ? (run?.total ? `Đã xét ${run.done.toLocaleString('vi-VN')}/${run.total.toLocaleString('vi-VN')} biển, duyệt được ${run.approved.toLocaleString('vi-VN')}…` : 'Đang khởi động…')
            : run.status === 'success'
              ? `Đã duyệt ${run.approved.toLocaleString('vi-VN')} biển (xét ${run.done.toLocaleString('vi-VN')}/${run.total.toLocaleString('vi-VN')}).`
              : run.error || 'Có lỗi xảy ra.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant={running ? 'ghost' : 'primary'} size="md" onClick={onClose}>{running ? 'Chạy nền (đóng)' : 'Đóng'}</Button>
        </div>
      </div>
    </Modal>
  );
}

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  font: 'var(--type-caption)',
  color: 'var(--text-strong)',
  textAlign: 'left',
  width: '100%',
  transition: 'background-color 120ms var(--ease-standard)',
};

function RowMoreMenu({ plate, pending, onReject, onGroupApprove, onToggleHide, onTogglePin, onCopy, notify }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        title="Thao tác khác"
        aria-label="Thao tác khác"
        onClick={() => setOpen((v) => !v)}
        style={{
          ...roundBtn,
          background: open ? 'var(--surface-sunken)' : 'var(--surface-muted)',
          color: 'var(--text-body)',
        }}
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              zIndex: 20,
              background: 'var(--white)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-4)',
              padding: 4,
              minWidth: 175,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {pending && (
              <button
                type="button"
                onClick={() => { setOpen(false); onReject(); }}
                style={menuItemStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <X size={14} color="var(--status-danger)" />
                <span style={{ color: 'var(--status-danger)' }}>Từ chối giá</span>
              </button>
            )}
            {pending && plate.priceGroupId && plate.suggestedPrice && (
              <button
                type="button"
                onClick={() => { setOpen(false); onGroupApprove(); }}
                style={menuItemStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <Users size={14} />
                <span>Duyệt cả nhóm</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => { setOpen(false); onToggleHide(); }}
              style={menuItemStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              {plate.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{plate.isHidden ? 'Hiện biển' : 'Ẩn khỏi khách'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onTogglePin(); }}
              style={menuItemStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Pin size={14} color={plate.isPinned ? 'var(--action-primary)' : 'currentColor'} />
              <span>{plate.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onCopy(); }}
              style={menuItemStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Copy size={14} />
              <span>Sao chép số biển</span>
            </button>
            <a
              href={`/tim-kiem/${encodeURIComponent(plate.plateNumber)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              style={{ ...menuItemStyle, textDecoration: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <ExternalLink size={14} />
              <span>Xem trang khách</span>
            </a>
            <div style={{ height: 1, background: 'var(--grey-100)', margin: '2px 0' }} />
            <div style={{ padding: '2px 8px' }}>
              <AuditHistoryButton entityType="vpa_plate" entityId={plate.id} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Danh sách biển VPA cho Admin — cùng bố cục và công cụ với trang Biển số (lọc, cột, sắp xếp, sửa nhanh, hàng loạt, CSV, ngăn kéo).
// queue = hàng đợi Duyệt giá (chỉ biển Có gợi ý / Đề xuất đổi giá).
export default function VpaAdminList({ queue = false, notify }) {
  const [f, setF] = useState({ tab: '', vehicle: '', priceState: '', hidden: '', featured: '', manual: '', from: '', to: '', ...(queue ? { plateTypeIds: [], provinceIds: [] } : loadSavedFilters()) });
  const [q, setQ] = useState(queue ? '' : consumeDeepLinkQ);
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
  const [integrity, setIntegrity] = useState(false);
  const [bulkSeedOpen, setBulkSeedOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quick, setQuick] = useState({ plateNumber: '', vehicle: 'Car', tab: '1', price: '' });
  const [priceRefId, setPriceRefId] = useState(null); // UC49 — biển đang xem popup nguồn giá gợi ý
  const priceRefQuery = useVpaPlatePriceReference(priceRefId, !!priceRefId);

  const copyPlate = (plateNumber) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(plateNumber);
      notify?.(`Đã sao chép số biển ${plateNumber}`);
    }
  };

  const setDatePreset = (preset) => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    if (preset === 'today') {
      const s = fmt(d);
      setF((x) => ({ ...x, from: s, to: s }));
    } else if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      const s = fmt(d);
      setF((x) => ({ ...x, from: s, to: s }));
    } else if (preset === 'week') {
      const from = fmt(d);
      d.setDate(d.getDate() + 7);
      const to = fmt(d);
      setF((x) => ({ ...x, from, to }));
    } else if (preset === 'clear') {
      setF((x) => ({ ...x, from: '', to: '' }));
    }
    setPage(1);
  };

  const { data: typeData } = useAdminCategories('plate_type');
  const { data: provData } = useAdminCategories('province');
  const plateTypes = catOpts(typeData?.items);
  const provinces = catOpts(provData?.items);

  const params = { queue: queue || undefined, ...f, q: dq, page, limit, sort: sort?.key, dir: sort?.dir };
  const { data, isLoading, isError, refetch } = useVpaAdminPlates(params);
  const { data: baseData } = useVpaAdminPlates({ queue: queue || undefined, tab: f.tab, page: 1, limit: 1 }); // tổng của tab, không lọc khác
  const { data: facets } = useVpaAdminFacets({ queue: queue || undefined, ...f, q: dq });
  const { data: vpaCounts } = useVpaCounts(f.vehicle);
  // Tổng mỗi tab là CẢ Ô TÔ + XE MÁY cộng lại — hiện rõ breakdown để không nhầm với số trên trang VPA gốc (họ tách
  // riêng từng loại xe theo tab, ví dụ "Danh sách chính thức" > "Xe mô tô, xe gắn máy" chỉ hiện phần xe máy).
  const { data: vpaCountsCar } = useVpaCounts('Car');
  const { data: vpaCountsMoto } = useVpaCounts('MotorBike');
  const setPrice = useSetVpaPrice();
  const approve = useApproveVpaSuggested();
  const startApproveAll = useStartApproveAllVpaSuggested();
  const startApproveRecomputed = useStartApproveRecomputedVpa();
  const [confirmAction, setConfirmAction] = useState(null); // null | 'all' | 'recomputed' | 'recomputed-override'
  const [approveRunId, setApproveRunId] = useState(null); // UC49 — lượt duyệt nền đang theo dõi (thanh %)
  const { data: approveRun } = useVpaApproveRun(approveRunId, !!approveRunId);
  const reject = useRejectVpaPrice();
  const approveGroup = useApproveVpaGroup();
  const hide = useHideVpaPlate();
  const pin = usePinVpaPlate();
  const update = useUpdateVpaPlate();
  const create = useCreateVpaPlate();
  const bulk = useBulkEditVpa();
  const recomputeSuggestions = useRecomputeVpaSuggestions();
  const [recomputing, setRecomputing] = useState(false);

  const handleRecomputeSuggestions = async () => {
    setRecomputing(true);
    try {
      const res = await recomputeSuggestions.mutateAsync();
      const info = res?.data || {};
      notify?.(
        `Đã quét và tính xong giá gợi ý: gán mới cho ${Number(info.platesAssigned || 0).toLocaleString('vi-VN')} biển chưa có giá, cập nhật ${Number(info.platesUpdated || 0).toLocaleString('vi-VN')} biển!`,
        'success'
      );
      refetch();
    } catch (err) {
      notify?.(err?.message || 'Có lỗi khi tính lại giá gợi ý.', 'error');
    } finally {
      setRecomputing(false);
    }
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const filterCount = Object.values(f).filter((v) => (Array.isArray(v) ? v.length : v)).length;
  const setFilter = (k) => (v) => {
    setF((x) => {
      const n = { ...x, [k]: v };
      if (!queue && (k === 'plateTypeIds' || k === 'provinceIds')) {
        try { localStorage.setItem(FILTER_KEY, JSON.stringify({ plateTypeIds: n.plateTypeIds, provinceIds: n.provinceIds })); } catch { /* ignore */ }
      }
      return n;
    });
    setPage(1); setSel(new Set());
  };
  const clearCats = () => { setFilter('plateTypeIds')([]); setFilter('provinceIds')([]); };
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
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {pending(p) && p.suggestedPrice && (
        <button
          type="button"
          aria-label="Duyệt giá gợi ý"
          title={`Duyệt giá gợi ý: ${money(p.suggestedPrice)}`}
          onClick={() => run(() => approve.mutateAsync([p.id]), 'Đã đồng ý giá gợi ý')}
          style={{ ...roundBtn, background: 'var(--action-primary)', color: 'var(--white)' }}
        >
          <Check size={15} />
        </button>
      )}
      <IconButton name="pencil" label="Sửa chi tiết" size="sm" onClick={() => setDrawer({ plate: p })} />
      <button
        type="button"
        aria-label={`Sao chép ${p.plateNumber}`}
        title="Sao chép số biển"
        onClick={() => copyPlate(p.plateNumber)}
        style={{ ...roundBtn, background: 'var(--surface-muted)', color: 'var(--text-body)' }}
      >
        <Copy size={13} />
      </button>
      <RowMoreMenu
        plate={p}
        pending={pending(p)}
        onReject={() => run(() => reject.mutateAsync([p.id]), 'Đã từ chối')}
        onGroupApprove={() => run(() => approveGroup.mutateAsync(p.priceGroupId), (r) => `Đã đồng ý ${r.affected} biển trong nhóm`)}
        onToggleHide={() => toggleHide(p)}
        onTogglePin={() => togglePin(p)}
        onCopy={() => copyPlate(p.plateNumber)}
        notify={notify}
      />
    </div>
  );

  const tabSelect = (p) => (
    <select value={String(p.tab)} onChange={(e) => changeTab(p, e.target.value)} aria-label="Đổi tab"
      style={{ border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', font: 'var(--type-caption)', color: 'var(--text-body)', outline: 'none', cursor: 'pointer' }}>
      {TAB_ROW.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
    </select>
  );

  const catSelect = (p, field, options, label) => {
    const key = field === 'plateTypeId' ? p.plateTypeId : p.provinceId;
    const none = { value: '', label: '—' };
    return (
      <select value={key || ''} aria-label={label} title={`${label} (sửa tay → khóa, crawl không ghi đè)`}
        onChange={(e) => e.target.value && run(() => update.mutateAsync({ id: p.id, body: { [field]: e.target.value } }), `Đã đổi ${label.toLowerCase()} (khóa, crawl không ghi đè)`)}
        style={{ border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', font: 'var(--type-caption)', color: 'var(--text-body)', outline: 'none', cursor: 'pointer', maxWidth: '100%' }}>
        {!key && <option value={none.value}>{none.label}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  };

  const emptyBox = !isLoading && !isError && items.length === 0 && (
    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
      <CarFront size={40} style={{ color: 'var(--text-faint)' }} />
      {queue ? (
        f.priceState === '0' ? (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>
              Không có biển nào chưa có giá trên hệ thống!
            </div>
            <div style={{ fontSize: 'var(--type-body-sm)', maxWidth: 480, margin: '0 auto' }}>
              Toàn bộ biển VPA đều đã có giá duyệt hoặc đã được tính giá gợi ý sẵn sàng trong hàng đợi duyệt.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>
              Không có biển nào đang chờ duyệt giá.
            </div>
            <div style={{ fontSize: 'var(--type-body-sm)', maxWidth: 520, margin: '0 auto 12px auto' }}>
              Nếu bạn vừa cào danh sách công bố biển mới và chưa thấy giá hiển thị, hãy bấm <b>Tính lại giá gợi ý</b> để hệ thống tự động ghép nhóm và tính giá cho các biển mới.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="sm"
                disabled={recomputing}
                onClick={handleRecomputeSuggestions}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={13} className={recomputing ? 'animate-spin' : ''} />
                <span>{recomputing ? 'Đang tính lại…' : 'Tính lại giá gợi ý ngay'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter('priceState')('0')}
              >
                Xem biển chưa có giá
              </Button>
            </div>
          </div>
        )
      ) : (
        'Không có biển VPA nào khớp bộ lọc.'
      )}
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
      {!queue && <VpaStatsCharts />}
      {!queue && quickOpen && (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', border: '1px solid var(--grey-200)', animation: 'fadeIn 160ms ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} color="var(--action-primary)" />
              Thêm nhanh biển VPA
            </span>
            <button
              type="button"
              onClick={() => setQuickOpen(false)}
              aria-label="Đóng thêm nhanh"
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
            {[['plateNumber', '30A-567.89', 'text'], ['price', 'Giá (VNĐ) — trống = Giá liên hệ', 'text']].map(([k, ph]) => (
              <input key={k} value={quick[k]} placeholder={ph} onChange={(e) => setQuick((x) => ({ ...x, [k]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') quickAdd(); }}
                style={{ height: 36, minWidth: 0, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 12px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none', flex: '1 1 150px' }} />
            ))}
            <Select value={quick.tab} options={TAB_ROW.slice(0, 3)} onChange={(v) => setQuick((x) => ({ ...x, tab: v }))} />
            <Select value={quick.vehicle} options={VEHICLES.slice(1)} onChange={(v) => setQuick((x) => ({ ...x, vehicle: v }))} />
            <Button variant="primary" size="md" loading={create.isPending} onClick={quickAdd}>Thêm ngay</Button>
          </div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Nhập biển số, giá (bỏ trống = Giá liên hệ), chọn tab và loại xe rồi bấm Thêm. Hệ thống tự nhận loại biển và tỉnh từ số biển; crawl không đổi biển thêm tay.
          </span>
        </div>
      )}

      {integrity && !queue && <VpaIntegrityPanel notify={notify} onClose={() => setIntegrity(false)} />}

      {!queue && (
        <div
          role="tablist"
          aria-label="Bộ lọc nguồn biển VPA"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          {VPA_FILTER_TABS.map((t) => {
            const active = f.tab === t.value;
            let count = null;
            let carCount = null;
            let motoCount = null;
            if (t.countKey === 'weekly') { count = vpaCounts?.weekly; carCount = vpaCountsCar?.weekly; motoCount = vpaCountsMoto?.weekly; }
            else if (t.countKey === 'monthly') { count = vpaCounts?.monthly; carCount = vpaCountsCar?.monthly; motoCount = vpaCountsMoto?.monthly; }
            else if (t.countKey === 'expired') { count = vpaCounts?.expired; carCount = vpaCountsCar?.expired; motoCount = vpaCountsMoto?.expired; }
            else if (t.countKey === 'all') {
              count = (vpaCounts?.weekly != null && vpaCounts?.monthly != null && vpaCounts?.expired != null)
                ? (vpaCounts.weekly + vpaCounts.monthly + vpaCounts.expired)
                : (f.tab === '' ? baseData?.total : null);
              const sum3 = (c) => (c?.weekly != null && c?.monthly != null && c?.expired != null ? c.weekly + c.monthly + c.expired : null);
              carCount = sum3(vpaCountsCar);
              motoCount = sum3(vpaCountsMoto);
            }

            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter('tab')(t.value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  gap: 4,
                  padding: 'var(--space-3) var(--space-4)',
                  border: active ? '1.5px solid var(--action-primary)' : '1px solid var(--grey-200, #e5e7eb)',
                  borderRadius: 'var(--radius-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: active ? 'var(--action-primary)' : 'var(--white)',
                  color: active ? 'var(--action-primary-text)' : 'var(--text-strong)',
                  boxShadow: active ? 'var(--shadow-2)' : 'var(--shadow-inset-hairline)',
                  transition: 'background-color 160ms var(--ease-standard), border-color 160ms var(--ease-standard), box-shadow 160ms var(--ease-standard)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                  <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', fontSize: '14px' }}>
                    {t.label}
                  </span>
                  {count != null && (
                    <span
                      style={{
                        font: 'var(--type-caption)',
                        fontWeight: 'var(--fw-semibold)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        background: active ? 'rgba(255,255,255,0.22)' : 'var(--surface-sunken)',
                        color: active ? 'var(--action-primary-text)' : 'var(--text-muted)',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Intl.NumberFormat('vi-VN').format(count)} biển
                    </span>
                  )}
                </div>
                <span
                  style={{
                    font: 'var(--type-caption)',
                    fontSize: '12px',
                    color: active ? 'var(--action-primary-text)' : 'var(--action-primary, #C75B00)',
                    opacity: active ? 0.9 : 1,
                    fontWeight: active ? 'var(--fw-medium)' : 'var(--fw-semibold)',
                  }}
                >
                  {t.note}
                </span>
                {(carCount != null || motoCount != null) && (
                  <span
                    style={{
                      font: 'var(--type-caption)',
                      fontSize: '11px',
                      color: active ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
                    }}
                  >
                    Ô tô {new Intl.NumberFormat('vi-VN').format(carCount || 0)} · Xe máy {new Intl.NumberFormat('vi-VN').format(motoCount || 0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <PlateCountSummary
        matched={data?.total}
        all={baseData?.total}
        filtered={filterCount > 0 || !!dq}
        scope={
          f.tab
            ? `trong ${
                {
                  '1': 'Biển số tháng (công bố)',
                  '2': 'Biển số tuần (chính thức)',
                  '3': 'Biển hết hạn',
                  '4': 'Hết hạn nội bộ',
                }[f.tab] || VPA_TAB_LABELS[f.tab]
              }`
            : queue
            ? 'đang chờ duyệt'
            : ''
        }
      />

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
                {(f.from || f.to) && (
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
              <input type="date" value={f.from} onChange={(e) => setFilter('from')(e.target.value)} style={dateField} title="Phiên từ ngày" />
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>→</span>
              <input type="date" value={f.to} onChange={(e) => setFilter('to')(e.target.value)} style={dateField} title="Đến ngày" />
            </div>
          </div>
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
          {!queue && (
            <Button
              variant={quickOpen ? 'dark' : 'ghost'}
              size="md"
              onClick={() => setQuickOpen((v) => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} />
              <span>{quickOpen ? 'Đóng thêm nhanh' : 'Thêm nhanh'}</span>
            </Button>
          )}
          {!queue && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => setBulkSeedOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Tự động nhận diện loại biển, tỉnh thành, chữ ký phong thủy và duyệt giá gợi ý cho các biển còn thiếu"
            >
              <Sparkles size={14} color="var(--amber-500)" />
              <span>Sinh thông tin hàng loạt</span>
            </Button>
          )}
          {!queue && <Button variant={integrity ? 'dark' : 'ghost'} size="md" onClick={() => setIntegrity((v) => !v)}>Kiểm tra dữ liệu</Button>}
          <Button variant="ghost" size="md" disabled={exporting} onClick={doExport}>{exporting ? 'Đang xuất…' : 'Xuất CSV'}</Button>
          {queue && (
            <>
              <Button
                variant="dark"
                size="md"
                disabled={recomputing}
                onClick={handleRecomputeSuggestions}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                title="Quét toàn bộ kho biển VPA, tự động tìm nhóm giá tương ứng và sinh giá gợi ý cho các biển mới chưa có giá"
              >
                <RefreshCw size={14} className={recomputing ? 'animate-spin' : ''} />
                <span>{recomputing ? 'Đang tính lại…' : 'Tính lại giá gợi ý'}</span>
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => refetch()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                title="Tải lại danh sách biển"
              >
                <RefreshCw size={14} />
                <span>Làm mới</span>
              </Button>

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Button variant="primary" size="md" title={VPA_HELP.approveAll} onClick={() => setConfirmAction('all')}>Duyệt tất cả theo bộ lọc</Button>
                <InfoTip size={13} text={VPA_HELP.approveAll} />
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Button variant="ghost" size="md" title={VPA_HELP.approveRecomputed} onClick={() => setConfirmAction('recomputed')}>Duyệt lại giá toàn bộ</Button>
                <InfoTip size={13} text={VPA_HELP.approveRecomputed} />
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Button variant="ghost" size="md" title={VPA_HELP.approveRecomputedOverride} onClick={() => setConfirmAction('recomputed-override')}>Duyệt lại giá toàn bộ (ghi đè cả sửa tay)</Button>
                <InfoTip size={13} text={VPA_HELP.approveRecomputedOverride} />
              </span>
            </>
          )}
          {!queue && <Button variant="primary" size="md" onClick={() => setDrawer({})}>+ Thêm chi tiết</Button>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
          <MultiFilter label="Loại biển" options={plateTypes} value={f.plateTypeIds} onChange={setFilter('plateTypeIds')} counts={facets?.types} />
          <Select label="Loại xe" value={f.vehicle} options={VEHICLES} onChange={setFilter('vehicle')} />
          <MultiFilter label="Tỉnh/thành" options={provinces} value={f.provinceIds} onChange={setFilter('provinceIds')} counts={facets?.provinces} searchable />
          <Select label="Nổi bật" value={f.featured} options={YES_NO('Chỉ nổi bật', 'Không nổi bật')} onChange={setFilter('featured')} />
          {queue ? (
            <Select label="Trạng thái giá" value={f.priceState} options={QUEUE_STATE_OPTS} onChange={setFilter('priceState')} />
          ) : (
            <Select label="Trạng thái giá" value={f.priceState} options={STATE_OPTS} onChange={setFilter('priceState')} />
          )}
          {!queue && <Select label="Ẩn/hiện" value={f.hidden} options={YES_NO('Đang ẩn', 'Đang hiện')} onChange={setFilter('hidden')} />}
          {!queue && <Select label="Nguồn" value={f.manual} options={YES_NO('Thêm tay', 'Đồng bộ VPA')} onChange={setFilter('manual')} />}
          {(f.plateTypeIds.length > 0 || f.provinceIds.length > 0) && (
            <Button variant="ghost" size="md" onClick={clearCats}>Xóa lọc loại biển/tỉnh</Button>
          )}
        </div>
        {queue && f.priceState === '0' && (
          <div style={{ marginTop: 'var(--space-3)', padding: '10px 14px', background: 'var(--amber-50, #fffbeb)', border: '1px solid var(--amber-200, #fde68a)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 'var(--type-body-sm)', color: 'var(--amber-900, #78350f)' }}>
              ⚠️ <strong>Đang lọc biển chưa có giá trên hệ thống:</strong> Các biển này vừa cào về nhưng chưa được gán giá gợi ý. Bấm <strong>Tính lại giá gợi ý</strong> để hệ thống tự động nhóm và sinh giá cho các biển này.
            </div>
            <Button
              variant="dark"
              size="sm"
              disabled={recomputing}
              onClick={handleRecomputeSuggestions}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} className={recomputing ? 'animate-spin' : ''} />
              <span>{recomputing ? 'Đang tính lại…' : 'Tính lại giá gợi ý ngay'}</span>
            </Button>
          </div>
        )}
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
                      {(() => {
                        const issues = getVpaPlateIssues(p);
                        if (issues.length === 0) return null;
                        const hasErr = issues.some((x) => x.severity === 'error');
                        return (
                          <PlateIssueTip
                            issues={issues}
                            tone={hasErr ? 'danger' : 'warning'}
                            size={14}
                            onClick={() => setDrawer({ plate: p })}
                          />
                        );
                      })()}
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
              <span style={{ flex: '0 0 160px' }}>Thao tác</span>
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
                    {(() => {
                      const issues = getVpaPlateIssues(p);
                      if (issues.length === 0) return null;
                      const hasErr = issues.some((x) => x.severity === 'error');
                      return (
                        <PlateIssueTip
                          issues={issues}
                          tone={hasErr ? 'danger' : 'warning'}
                          size={14}
                          onClick={() => setDrawer({ plate: p })}
                        />
                      );
                    })()}
                    <button
                      type="button"
                      onClick={() => copyPlate(p.plateNumber)}
                      title={`Sao chép ${p.plateNumber}`}
                      style={{ border: 'none', background: 'none', padding: 2, cursor: 'pointer', display: 'inline-flex', color: 'var(--text-muted)', flexShrink: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--action-primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <Copy size={13} />
                    </button>
                    {rowBadges(p)}
                  </span>
                  {cols.plateType && <span style={{ flex: '1 1 88px', minWidth: 0 }}>{catSelect(p, 'plateTypeId', plateTypes, 'Loại biển')}</span>}
                  {cols.vehicle && <span style={{ flex: '0 0 72px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{isCar(p.vehicle) ? 'Ô tô' : 'Xe máy'}</span>}
                  {cols.province && <span style={{ flex: '1 1 96px', minWidth: 0 }}>{catSelect(p, 'provinceId', provinces, 'Tỉnh/thành')}</span>}
                  {cols.tab && (
                    <span style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {tabSelect(p)}
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }} title="Giờ bắt đầu → kết thúc phiên đấu giá">
                        {p.auctionStartAt ? `${formatDateTime(p.auctionStartAt)} → ${p.auctionEndAt ? formatDateTime(p.auctionEndAt).slice(0, 5) : '?'}` : 'Chưa có phiên'}
                      </span>
                    </span>
                  )}
                  {cols.startingPrice && <span style={{ flex: '1 1 104px', font: 'var(--type-body-sm)' }}>{money(p.startingPrice)}</span>}
                  {cols.suggested && (
                    <div style={{ flex: '1 1 130px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        type="button"
                        onClick={() => setPriceRefId(p.id)}
                        title="Xem nguồn tính giá gợi ý"
                        style={{ font: 'var(--type-body-sm)', background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit', textDecoration: 'underline dotted', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <span>{p.suggestedPrice ? money(p.suggestedPrice) : '—'}</span>
                        {p.suggestedPrice && p.approvedPrice && p.priceState === 4 && (() => {
                          const delta = p.suggestedPrice - p.approvedPrice;
                          const pct = p.approvedPrice > 0 ? Math.round((delta / p.approvedPrice) * 100) : 0;
                          const isUp = delta > 0;
                          return (
                            <span
                              title={`Lệch so với giá duyệt cũ (${money(p.approvedPrice)})`}
                              style={{
                                fontSize: '11px',
                                fontWeight: 'var(--fw-bold)',
                                padding: '1px 5px',
                                borderRadius: 'var(--radius-pill)',
                                background: isUp ? '#ecfdf5' : '#fff1f2',
                                color: isUp ? '#059669' : '#e11d48',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 2,
                              }}
                            >
                              {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                              {isUp ? `+${pct}%` : `${pct}%`}
                            </span>
                          );
                        })()}
                      </button>
                      <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: (p.sampleCount || 0) > 0 ? 'var(--text-muted)' : 'var(--amber-600, #d97706)' }}>
                        {(p.sampleCount || 0) > 0 ? `${p.sampleCount} mẫu kết quả` : 'Chưa có mẫu'}
                      </span>
                    </div>
                  )}
                  {cols.approved && (
                    <span style={{ flex: '1 1 110px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {priceCell(p)}
                      {p.suggestedPrice > 0 && p.approvedPrice > 0 && Math.abs(p.approvedPrice - p.suggestedPrice) > p.suggestedPrice * 0.1 && (
                        <PlateIssueTip
                          text={`Giá duyệt lệch ${Math.round(Math.abs(p.approvedPrice - p.suggestedPrice) / p.suggestedPrice * 100)}% so với giá gợi ý VPA (${money(p.suggestedPrice)})`}
                          tone="warning"
                          size={13}
                        />
                      )}
                    </span>
                  )}
                  {cols.priceState && <span style={{ flex: '1 1 120px' }}><Badge tone={st.tone}>{st.label}</Badge></span>}
                  {cols.updatedAt && <span style={{ flex: '1 1 90px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDate(p.updatedAt)}</span>}
                  <span style={{ flex: '0 0 160px', display: 'flex', alignItems: 'center' }}>{actions(p)}</span>
                </div>
              );
            })}
          </div>
        </div>
        {errorBox}{emptyBox}
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} size="sm" />}

      
      <VpaBulkSeedModal
        open={bulkSeedOpen}
        onClose={() => setBulkSeedOpen(false)}
        plates={items}
        notify={notify}
        onSuccess={() => refetch()}
      />

      <PriceReferenceModal
        open={!!priceRefId}
        onClose={() => setPriceRefId(null)}
        data={priceRefQuery.data}
        isLoading={priceRefQuery.isLoading}
        onOpenPlate={(plateNumber) => { setPriceRefId(null); setQ(plateNumber); }}
      />

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
          {[['Loại biển ▾', 'plateTypeId', plateTypes, 'Đã đổi loại biển cho'], ['Tỉnh ▾', 'provinceId', provinces, 'Đã đổi tỉnh cho']].map(([ph, field, opts, verb]) => (
            <select key={field} defaultValue="" aria-label={ph} onChange={(e) => { if (e.target.value) { bulkEdit({ [field]: e.target.value }, verb); e.target.value = ''; } }}
              style={{ border: 'none', background: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', font: 'var(--type-caption)', color: 'var(--text-strong)', cursor: 'pointer', outline: 'none', maxWidth: 140 }}>
              <option value="" disabled>{ph}</option>
              {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
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

      {confirmAction && (
        <ConfirmModal
          open
          onClose={() => setConfirmAction(null)}
          title={confirmAction === 'all' ? 'Duyệt tất cả theo bộ lọc' : 'Duyệt lại giá toàn bộ'}
          message={
            confirmAction === 'all'
              ? `Duyệt giá gợi ý cho TẤT CẢ ${total.toLocaleString('vi-VN')} biển đang khớp bộ lọc — không chỉ trang đang xem. Có thể mất một lúc với số lượng lớn.`
              : confirmAction === 'recomputed'
                ? 'Tính lại giá mọi nhóm (theo kết quả đấu giá mới nhất) rồi áp giá gợi ý mới cho các biển đã duyệt — CHỈ biển nghi chưa từng sửa giá tay (giá duyệt cũ khớp giá gợi ý cũ). Dùng khi Published/Official đi chậm hơn Results nên lúc duyệt lần đầu còn thiếu mẫu.'
                : 'Tính lại giá mọi nhóm rồi áp giá gợi ý mới cho TẤT CẢ biển đã duyệt — kể cả biển nghi đã sửa giá tay. Có thể ghi đè giá Admin đã cố ý chỉnh khác giá gợi ý.'
          }
          confirmLabel="Thực hiện"
          danger={confirmAction === 'recomputed-override'}
          loading={startApproveAll.isPending || startApproveRecomputed.isPending}
          onConfirm={() => {
            const action = confirmAction;
            const onStarted = (r) => { setConfirmAction(null); setApproveRunId(r.runId); };
            const onError = (e) => { setConfirmAction(null); notify?.(e.message || 'Thao tác thất bại'); };
            if (action === 'all') {
              startApproveAll.mutateAsync({ queue: true, ...f, q: dq }).then(onStarted).catch(onError);
            } else {
              startApproveRecomputed.mutateAsync(action === 'recomputed-override').then(onStarted).catch(onError);
            }
          }}
        />
      )}

      {approveRunId && (
        <ApproveRunModal
          run={approveRun}
          onClose={() => {
            setApproveRunId(null);
            if (approveRun?.status === 'success') { notify?.(`Đã duyệt ${approveRun.approved} biển`); refetch(); }
            else if (approveRun?.status === 'error') notify?.(approveRun.error || 'Thao tác thất bại');
          }}
        />
      )}
    </div>
  );
}
