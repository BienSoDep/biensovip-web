import { useState, useEffect, useRef } from 'react';
import { CarFront, ArrowUpDown, ArrowUp, ArrowDown, TriangleAlert, Copy, Star, Gift } from 'lucide-react';
import { useDebouncedValue } from '@mantine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  useAdminPlates, useDeletePlate, useUpdatePlateStatus,
  useUpdatePlateVisibility, useUpdatePlate, useCreatePlate,
  useBulkCreatePlate, useUploadImage, useAdminPlate, checkPlateVersion, useRestorePlate,
} from '../../services/adminPlates.js';
import { useAdminCategories } from '../../services/categories.js';
import { Select, IconButton, SearchField, InfoTip, Input } from '../../components/index.jsx';
import PlateVisual from '../../components/PlateVisual.jsx';
import Button from '../../components/Button.jsx';
import AuditHistoryButton from '../../components/AuditHistoryButton.jsx';
import { useExportCsv } from '../../hooks/useExportCsv.js';
import Modal from '../../components/Modal.jsx';
import ConfirmBulkModal from '../../components/ConfirmBulkModal.jsx';
import Drawer from '../../components/Drawer.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { formatDate } from '../../lib/date.js';
import { analyzePlateNumber } from '../../lib/compareInsights.js';
import { NUT_MEANING } from '../../lib/fengshui.js';
import { parsePlateNumber } from '../../lib/plateFormat.js';
import { IMPORT_PLATE_PROMPT } from '../../lib/importPlatePrompt.js';
import { fetchMissingMeaningPlates, useBulkSeedMeanings } from '../../services/meanings.js';
import { fetchMissingImagePlates, useBulkGenerateImages, generateOneImage, fetchGeneratedImagePlates, purgeGeneratedImageForPlate } from '../../services/plateImages.js';

// --- Tự động điền (auto-fill) — suy Tỉnh/Loại biển/Loại xe/Ý nghĩa từ biển số vừa gõ.
// options là catOpts(list) = {value,label,code}; label = tên category. Không khớp → '' (admin chọn tay).
const OTO_LETTERS = 'ABCDFHMNPTV';
// Quét N số giống liền nhau ở BẤT KỲ vị trí nào trong chuỗi (không chỉ hậu tố) —
// khớp cách backend MeaningAnalyzer.HasRepeated làm, để tam hoa/tứ quý/ngũ quý nằm
// đầu/giữa serial (VD 999.11 → "99911" có "999" ở đầu) không bị bỏ sót.
function hasRepeatedAnywhere(series, n) {
  for (let i = 0; i + n <= series.length; i++) {
    if (new Set(series.slice(i, i + n)).size === 1) return true;
  }
  return false;
}
function longestAscendingRun(series) {
  let max = 1, cur = 1;
  for (let i = 1; i < series.length; i++) {
    cur = +series[i] === +series[i - 1] + 1 ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return max;
}
function detectPlateTypeId(serial, plateTypes) {
  const byName = (n) => (plateTypes.find((o) => (o.label || '').toLowerCase().includes(n)) || {}).value || '';
  if (!serial) return '';
  if (hasRepeatedAnywhere(serial, 5)) return byName('ngũ quý');
  if (hasRepeatedAnywhere(serial, 4)) return byName('tứ quý');
  if (hasRepeatedAnywhere(serial, 3)) return byName('tam hoa');
  if (longestAscendingRun(serial) >= 3) return byName('sảnh tiến');
  const last2 = serial.slice(-2);
  if (last2 === '68' || last2 === '86') return byName('lộc phát');
  if (last2 === '39' || last2 === '79') return byName('thần tài');
  if (last2 === '38' || last2 === '78') return byName('ông địa');
  if (serial.length >= 4) {
    const q = serial.slice(-4);
    if (q[0] === q[3] && q[1] === q[2] && q[0] !== q[1]) return byName('số gánh');
  }
  if (last2.length === 2 && last2[0] === last2[1]) return byName('lặp đôi');
  // Số kép: có cặp số lặp bất kỳ vị trí (không rơi vào luật trên) — nới lỏng nhất, đặt cuối cùng.
  for (let i = 0; i + 1 < serial.length; i++) {
    if (serial[i] === serial[i + 1]) return byName('số kép');
  }
  return '';
}
function detectVehicleTypeId(seri, vehicleTypes) {
  const first = (seri || '').trim().charAt(0).toUpperCase();
  const isOto = !first || OTO_LETTERS.indexOf(first) >= 0;
  const key = isOto ? 'ô tô' : 'xe máy';
  return (vehicleTypes.find((o) => (o.label || '').toLowerCase().includes(key)) || {}).value || '';
}
function composeFengShuiMeaning(fullPlate) {
  const { patterns } = analyzePlateNumber(fullPlate);
  const serial = parsePlateNumber(fullPlate).num.replace(/\D/g, '');
  const parts = [];
  if (patterns.length) parts.push(patterns.join(', ') + '.');
  const digitMeans = serial.split('').map((d) => NUT_MEANING[d]).filter(Boolean);
  if (digitMeans.length) parts.push(`Từng số: ${digitMeans.join(' - ')}.`);
  return parts.join(' ');
}

const CAND_FIELDS = [
  { key: 'provinceId', label: 'Tỉnh/thành' },
  { key: 'plateTypeId', label: 'Loại biển' },
  { key: 'vehicleTypeId', label: 'Loại xe' },
  { key: 'fengShuiMeaning', label: 'Ý nghĩa phong thủy' },
];

const PER_PAGE_OPTIONS = [
  { value: 20, label: '20/trang' },
  { value: 50, label: '50/trang' },
  { value: 100, label: '100/trang' },
];

const HOT_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'true', label: 'Nổi bật' },
  { value: 'false', label: 'Không nổi bật' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'available', label: 'Còn hàng' },
  { value: 'sold', label: 'Đã bán' },
];

const INITIAL_FORM = {
  plateNumber: '', plateTypeId: '', provinceId: '', vehicleTypeId: '',
  price: '', costPrice: '', priceOnRequest: false, isHot: false,
  description: '', fengShuiMeaning: '', images: [], giftedPlateNumber: '',
  salePrice: '', saleDiscountPercent: '',
};

const fmt = (n) => (n == null ? '—' : n.toLocaleString('vi-VN') + 'đ');

// Cột có thể ẩn/hiện — key phải khớp field render bên dưới. plateType/vehicleType/province/price bật mặc định
// (thông tin cốt lõi để quản lý); cột phụ (liên hệ chờ/ảnh/ngày tạo/giá KM) tắt mặc định tránh rối bảng lần đầu.
const TOGGLEABLE_COLUMNS = [
  { key: 'plateType', label: 'Loại biển', default: true },
  { key: 'vehicleType', label: 'Loại xe', default: true },
  { key: 'province', label: 'Tỉnh/thành', default: true },
  { key: 'price', label: 'Giá', default: true },
  { key: 'gifted', label: 'Biển tặng', default: true },
  { key: 'isNew', label: 'Mới', default: true },
  { key: 'status', label: 'Trạng thái', default: true },
  { key: 'updatedAt', label: 'Cập nhật', default: true },
  { key: 'pendingContact', label: 'Liên hệ chờ', default: false },
  { key: 'imageCount', label: 'Số ảnh', default: false },
  { key: 'createdAt', label: 'Ngày tạo', default: false },
  { key: 'salePrice', label: 'Giá KM', default: false },
];
const COLUMN_PREFS_KEY = 'bsv.admin.plateColumns';

function loadColumnPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMN_PREFS_KEY) || 'null');
    if (saved && typeof saved === 'object') return { ...Object.fromEntries(TOGGLEABLE_COLUMNS.map((c) => [c.key, c.default])), ...saved };
  } catch { /* ignore malformed prefs */ }
  return Object.fromEntries(TOGGLEABLE_COLUMNS.map((c) => [c.key, c.default]));
}
const num = (v) => Number(String(v ?? '').replace(/[^\d]/g, '') || 0);
// Biển "Mới" = tạo trong 7 ngày gần nhất.
const isNewPlate = (p) => !!p.createdAt && (Date.now() - new Date(p.createdAt).getTime()) < 7 * 24 * 3600 * 1000;

// Windowed pagination: first, current±1, last, with ellipsis (null) between gaps.
function pageWindow(page, total) {
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push(null);
    out.push(sorted[i]);
  }
  return out;
}

const ERR_MSG = {
  DUPLICATE: 'Trùng biển',
  INVALID_PROVINCE: 'Sai tỉnh',
  EMPTY: 'Bỏ trống',
};

const canViewCost = (st) => st?.user?.role === 'super-admin' || st?.user?.permissions?.includes('*') || st?.user?.permissions?.includes('plates_cost:view');

// Gõ biển tặng kèm → sổ xuống gợi ý biển có sẵn trong hệ thống để chọn thay vì gõ tay dễ sai chính
// tả (biển không khớp thì tính năng tặng kèm ở trang chi tiết không tìm ra biển tương ứng).
function GiftedPlateField({ value, onChange, excludeId }) {
  const [open, setOpen] = useState(false);
  const [debouncedValue] = useDebouncedValue(value, 300);
  const keyword = (debouncedValue || '').trim();
  const { data } = useAdminPlates({ keyword, page: 1, perPage: 8 });
  const suggestions = (data?.items || []).filter((p) => p.id !== excludeId);

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Tặng kèm biển số (VD ô tô tặng biển xe máy)</span>
      <input
        value={value || ''}
        placeholder="43AB-668.88 (để trống nếu không tặng)"
        onChange={(e) => { onChange(e); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }}
      />
      {open && keyword.length >= 2 && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--white)', borderRadius: 'var(--radius-field)', boxShadow: 'var(--shadow-4)', maxHeight: 220, overflow: 'auto' }}>
          {suggestions.map((p) => (
            <button key={p.id} type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange({ target: { value: p.plateNumber } }); setOpen(false); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}>
              {p.plateNumber}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

export default function AdminPlates({ go, notify, st }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [plateTypeFilter, setPlateTypeFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [hotFilter, setHotFilter] = useState('');
  const { exportCsv, loading: exporting } = useExportCsv('/api/admin/plates');
  const [sort, setSort] = useState(null); // { key, dir: 'asc' | 'desc' }
  const [debouncedKeyword] = useDebouncedValue(keyword, 250);

  const [colPrefs, setColPrefs] = useState(loadColumnPrefs);
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const toggleCol = (key) => setColPrefs((prev) => {
    const next = { ...prev, [key]: !prev[key] };
    try { localStorage.setItem(COLUMN_PREFS_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
    return next;
  });

  // Sinh ý nghĩa phong thủy hàng loạt cho biển đang thiếu
  const [missingMeaningPlates, setMissingMeaningPlates] = useState(null); // null=chưa mở, []=đã check hết
  const [checkingMissing, setCheckingMissing] = useState(false);
  const bulkSeedMut = useBulkSeedMeanings();

  const openMissingMeaningModal = async () => {
    setCheckingMissing(true);
    try {
      const res = await fetchMissingMeaningPlates();
      setMissingMeaningPlates(res.items || []);
    } catch (err) {
      notify(err.message || 'Lỗi kiểm tra biển thiếu ý nghĩa');
    } finally {
      setCheckingMissing(false);
    }
  };

  const confirmBulkSeedMeanings = async () => {
    try {
      const res = await bulkSeedMut.mutateAsync();
      notify(`Đã sinh ý nghĩa cho ${res.seeded} biển${res.skipped ? `, ${res.skipped} biển không khớp mẫu nào` : ''}`);
      setMissingMeaningPlates(null);
    } catch (err) {
      notify(err.message || 'Lỗi sinh ý nghĩa hàng loạt');
    }
  };

  // Sinh ảnh đại diện hàng loạt cho biển đang thiếu ảnh — UC42: tuần tự từng biển, lưu DB ngay
  // sau mỗi biển (không phải 1 request lớn) để đóng modal giữa chừng không mất phần đã sinh.
  const [missingImagePlates, setMissingImagePlates] = useState(null); // null=chưa mở, []=đã check hết
  const [checkingMissingImage, setCheckingMissingImage] = useState(false);
  const [genProgress, setGenProgress] = useState(null); // { done, total, errors: [] } | null khi chưa chạy
  const genCancelledRef = useRef(false);
  const bulkGenImagesMut = useBulkGenerateImages(); // giữ lại cho endpoint cũ (không còn gọi từ UI này)
  // Mở modal → auto-chọn hết; user bỏ chọn bớt trước khi chạy, không cần bấm "chọn tất cả" trước.
  const [selectedGenIds, setSelectedGenIds] = useState(new Set());
  const toggleGenSelected = (id) => setSelectedGenIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const openMissingImageModal = async () => {
    setCheckingMissingImage(true);
    setGenProgress(null);
    try {
      const res = await fetchMissingImagePlates();
      const items = res.items || [];
      setMissingImagePlates(items);
      setSelectedGenIds(new Set(items.map((p) => p.id)));
    } catch (err) {
      notify(err.message || 'Lỗi kiểm tra biển thiếu ảnh');
    } finally {
      setCheckingMissingImage(false);
    }
  };

  const closeMissingImageModal = () => {
    genCancelledRef.current = true;
    setMissingImagePlates(null);
  };

  const confirmBulkGenerateImages = async () => {
    const plates = (missingImagePlates || []).filter((p) => selectedGenIds.has(p.id));
    genCancelledRef.current = false;
    const errors = [];
    setGenProgress({ done: 0, total: plates.length, errors });
    for (let i = 0; i < plates.length; i++) {
      if (genCancelledRef.current) break;
      try {
        await generateOneImage(plates[i].id);
      } catch (err) {
        errors.push(plates[i].plateNumber);
      }
      setGenProgress({ done: i + 1, total: plates.length, errors: [...errors] });
    }
    if (!genCancelledRef.current) {
      queryClient.invalidateQueries({ queryKey: ['admin-plates'] });
      notify(`Đã sinh ảnh cho ${plates.length - errors.length} biển${errors.length ? `, ${errors.length} biển lỗi` : ''}`);
    }
  };

  // Sinh ảnh cho đúng 1 biển ngay từ dòng trong bảng — trước đây chỉ có modal hàng loạt.
  const [generatingRowId, setGeneratingRowId] = useState(null);
  const generateRowImage = async (p) => {
    setGeneratingRowId(p.id);
    try {
      await generateOneImage(p.id);
      queryClient.invalidateQueries({ queryKey: ['admin-plates'] });
      notify('Đã sinh ảnh');
    } catch (err) {
      notify(err.message || 'Sinh ảnh thất bại');
    } finally {
      setGeneratingRowId(null);
    }
  };

  // Xóa ảnh sinh cũ — cùng pattern UC42 với sinh ảnh: liệt kê trước, xóa tuần tự từng biển, lưu
  // ngay sau mỗi biển để hủy giữa chừng không mất phần đã xóa.
  const [generatedImagePlates, setGeneratedImagePlates] = useState(null); // null=chưa mở
  const [checkingGeneratedImage, setCheckingGeneratedImage] = useState(false);
  const [purgeProgress, setPurgeProgress] = useState(null); // { done, total, errors: [] } | null
  const purgeCancelledRef = useRef(false);
  const [selectedPurgeIds, setSelectedPurgeIds] = useState(new Set());
  const togglePurgeSelected = (id) => setSelectedPurgeIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const openPurgeImageModal = async () => {
    setCheckingGeneratedImage(true);
    setPurgeProgress(null);
    try {
      const res = await fetchGeneratedImagePlates();
      const items = res.items || [];
      setGeneratedImagePlates(items);
      setSelectedPurgeIds(new Set(items.map((p) => p.id)));
    } catch (err) {
      notify(err.message || 'Lỗi kiểm tra ảnh sinh tự động');
    } finally {
      setCheckingGeneratedImage(false);
    }
  };

  const closePurgeImageModal = () => {
    purgeCancelledRef.current = true;
    setGeneratedImagePlates(null);
  };

  const confirmPurgeGeneratedImages = async () => {
    const plates = (generatedImagePlates || []).filter((p) => selectedPurgeIds.has(p.id));
    purgeCancelledRef.current = false;
    const errors = [];
    setPurgeProgress({ done: 0, total: plates.length, errors });
    for (let i = 0; i < plates.length; i++) {
      if (purgeCancelledRef.current) break;
      try {
        await purgeGeneratedImageForPlate(plates[i].id);
      } catch (err) {
        errors.push(plates[i].plateNumber);
      }
      setPurgeProgress({ done: i + 1, total: plates.length, errors: [...errors] });
    }
    if (!purgeCancelledRef.current) {
      queryClient.invalidateQueries({ queryKey: ['admin-plates'] });
      notify(`Đã xóa ảnh cho ${plates.length - errors.length} biển${errors.length ? `, ${errors.length} biển lỗi` : ''}`);
    }
  };

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErr, setFormErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const restoreMut = useRestorePlate();

  // UC35 — toast "Đã xóa N mục — Hoàn tác" 5s cho soft-delete.
  const undoToast = (count, ids) => {
    toast((t) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        Đã xóa {count} biển
        <button type="button" onClick={() => { toast.dismiss(t.id); Promise.allSettled(ids.map((id) => restoreMut.mutateAsync(id))).then(() => notify('Đã hoàn tác')); }}
          style={{ border: 'none', background: 'none', color: 'var(--action-primary)', fontWeight: 'var(--fw-bold)', cursor: 'pointer', textDecoration: 'underline' }}>
          Hoàn tác
        </button>
      </span>
    ), { duration: 5000 });
  };

  // Quick-add + paste/CSV
  const [quickNum, setQuickNum] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickStatus, setQuickStatus] = useState('available');
  const [quickVehicleTypeId, setQuickVehicleTypeId] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkView, setBulkView] = useState('list'); // 'list' | 'card' — xem README trong hàm parseLine
  // Inline edit cell: { id, field, value }
  const [cell, setCell] = useState(null);
  // Bulk selection: Set of plate ids on current page
  const [selected, setSelected] = useState(new Set());

  const filters = {
    status, keyword: debouncedKeyword, page, perPage,
    ...(fromDate && { fromDate }), ...(toDate && { toDate }),
    ...(sort && { sortBy: sort.key, sortDir: sort.dir }),
    ...(plateTypeFilter && { plateTypeId: plateTypeFilter }),
    ...(vehicleTypeFilter && { vehicleTypeId: vehicleTypeFilter }),
    ...(provinceFilter && { provinceId: provinceFilter }),
    ...(hotFilter && { isHot: hotFilter }),
  };
  const { data, isLoading, isError, refetch } = useAdminPlates(filters);
  const plates = data?.items || [];
  const total = data?.total || 0;

  const allSelected = plates.length > 0 && plates.every((p) => selected.has(p.id));
  const someSelected = plates.some((p) => selected.has(p.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(plates.map((p) => p.id)));
  const toggleOne = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const sortedPlates = plates;

  const toggleSort = (key) => { setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })); setPage(1); };

  const { data: plateTypesData } = useAdminCategories('plate_type');
  const { data: provincesData } = useAdminCategories('province');
  const { data: vehicleTypesData } = useAdminCategories('vehicle_type');
  const plateTypes = plateTypesData?.items || [];
  const provinces = provincesData?.items || [];
  const vehicleTypes = vehicleTypesData?.items || [];
  // Thêm nhanh: loại xe mặc định "Xe máy" (đa số biển admin nhập tay là xe máy) — admin đổi tay khi cần.
  const defaultQuickVehicleTypeId = (vehicleTypes.find((v) => (v.name || '').toLowerCase().includes('xe máy')) || {}).id || '';

  const [editPlateId, setEditPlateId] = useState(null);
  const { data: editDetail } = useAdminPlate(editPlateId);

  const deleteMut = useDeletePlate();
  const statusMut = useUpdatePlateStatus();
  const visMut = useUpdatePlateVisibility();
  const createMut = useCreatePlate();
  const updateMut = useUpdatePlate();
  const bulkMut = useBulkCreatePlate();
  const uploadMut = useUploadImage();

  const catOpts = (list) => (list || []).map((c) => ({ value: c.id, label: c.name, code: c.code }));
  const provinceByCode = (code) => (provinces.find((c) => (c.code || '').trim() === (code || '').trim()) || {}).id;
  const provNameOf = (code) => (provinces.find((c) => (c.code || '').trim() === (code || '').trim()) || {}).name || '';

  // Nhập biển số → tự chọn tỉnh/thành theo 2 số đầu (VD "43" → Đà Nẵng)
  const handlePlateNumberChange = (v) => {
    const prov = parsePlateNumber(v).prov;
    setForm((f) => {
      const patch = { plateNumber: v };
      if (prov && !f.provinceId) patch.provinceId = provinceByCode(prov) || f.provinceId;
      return { ...f, ...patch };
    });
  };

  const openAdd = () => {
    setEditId('new');
    setEditPlateId(null);
    setForm(INITIAL_FORM);
    setFormErr({});
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setEditPlateId(p.id);
    setForm(INITIAL_FORM);
    setFormErr({});
  };

  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState(null);

  // Populate form when edit detail loads
  useEffect(() => {
    if (editDetail && editId && editId === editPlateId) {
      setForm({
        plateNumber: editDetail.plateNumber || '',
        plateTypeId: editDetail.plateTypeId || '',
        provinceId: editDetail.provinceId || '',
        vehicleTypeId: editDetail.vehicleTypeId || '',
        price: editDetail.priceOnRequest ? '' : String(editDetail.price || ''),
        costPrice: editDetail.costPrice != null ? String(editDetail.costPrice) : '',
        priceOnRequest: editDetail.priceOnRequest || false,
        isHot: editDetail.isHot || false,
        description: editDetail.description || '',
        fengShuiMeaning: editDetail.fengShuiMeaning || '',
        images: (editDetail.images || []).map((img) => img.url),
        giftedPlateNumber: editDetail.giftedPlateNumber || '',
        salePrice: editDetail.salePrice != null ? String(editDetail.salePrice) : '',
        saleDiscountPercent: editDetail.salePrice != null && editDetail.price > 0
          ? String(Math.round((1 - editDetail.salePrice / editDetail.price) * 100)) : '',
      });
      setLoadedUpdatedAt(editDetail.updatedAt || null);
    }
  }, [editDetail]); // ponytail: runs once when detail arrives; editId/editPlateId stable at this point

  const setF = (k) => (v) => setForm((f) => ({ ...f, [k]: v && v.target ? v.target.value : v }));

  const handleUpload = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    const remaining = 8 - (form.images?.length || 0);
    if (list.length > remaining) { notify(`Tối đa 8 ảnh (còn ${remaining} ảnh)`); return; }
    if (list.some((f) => f.size > 5 * 1024 * 1024)) { notify('Ảnh vượt quá 5MB'); return; }
    setUploading(true);
    try {
      const results = await Promise.all(list.map((f) => uploadMut.mutateAsync(f)));
      setForm((f) => ({ ...f, images: [...f.images, ...results.map((r) => r.url)] }));
      notify(`Đã tải ${results.length} ảnh lên`);
    } catch (err) {
      notify(err?.message || 'Lỗi tải ảnh');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url) => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));

  // Validate 1 field ngay khi rời khỏi ô — báo lỗi sớm thay vì dồn hết về lúc bấm "Lưu biển số"
  // ở cuối drawer dài. Dùng lại đúng rule của handleSave để không lệch 2 nguồn validate.
  const blurValidateField = (field, valueOverride) => () => {
    setFormErr((prev) => {
      const next = { ...prev };
      const v = (val) => (valueOverride !== undefined ? valueOverride : val);
      if (field === 'plateNumber') {
        if (!v(form.plateNumber).trim()) next.plateNumber = 'Vui lòng nhập biển số'; else delete next.plateNumber;
      } else if (field === 'plateTypeId') {
        if (!v(form.plateTypeId)) next.plateTypeId = 'Chọn loại biển'; else delete next.plateTypeId;
      } else if (field === 'provinceId') {
        if (!v(form.provinceId)) next.provinceId = 'Chọn tỉnh/thành'; else delete next.provinceId;
      } else if (field === 'vehicleTypeId') {
        if (!v(form.vehicleTypeId)) next.vehicleTypeId = 'Chọn loại xe'; else delete next.vehicleTypeId;
      }
      return next;
    });
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.plateNumber.trim()) errs.plateNumber = 'Vui lòng nhập biển số';
    if (!form.plateTypeId) errs.plateTypeId = 'Chọn loại biển';
    if (!form.provinceId) errs.provinceId = 'Chọn tỉnh/thành';
    if (!form.vehicleTypeId) errs.vehicleTypeId = 'Chọn loại xe';
    if (!form.priceOnRequest && num(form.price) < 0) errs.price = 'Giá không được âm';
    if (!form.priceOnRequest && form.salePrice && num(form.salePrice) >= num(form.price)) errs.salePrice = 'Giá sau giảm phải nhỏ hơn giá gốc';
    setFormErr(errs);
    if (Object.keys(errs).length) return;

    const body = {
      plateNumber: form.plateNumber.trim(),
      plateTypeId: form.plateTypeId,
      provinceId: form.provinceId,
      vehicleTypeId: form.vehicleTypeId,
      price: form.priceOnRequest ? 0 : num(form.price),
      costPrice: form.costPrice.trim() ? num(form.costPrice) : null,
      priceOnRequest: form.priceOnRequest,
      isHot: form.isHot,
      description: form.description || null,
      fengShuiMeaning: form.fengShuiMeaning || null,
      images: form.images,
      giftedPlateNumber: form.giftedPlateNumber?.trim() || null,
      salePrice: form.priceOnRequest || !form.salePrice ? null : num(form.salePrice),
      clearSalePrice: form.priceOnRequest || !form.salePrice,
    };

    setSaving(true);
    try {
      if (typeof editId === 'string' && editId === 'new') {
        await createMut.mutateAsync(body);
      } else {
        if (loadedUpdatedAt) {
          const conflict = await checkPlateVersion(editId, loadedUpdatedAt);
          if (conflict) {
            notify('Dữ liệu đã bị đổi bởi người khác — tải lại trang trước khi lưu để tránh ghi đè.');
            setSaving(false);
            return;
          }
        }
        await updateMut.mutateAsync({ id: editId, body });
      }
      setEditId(null);
      setEditPlateId(null);
      setForm(INITIAL_FORM);
      notify(typeof editId === 'string' ? 'Đã thêm biển số mới' : 'Đã cập nhật biển số');
    } catch (err) {
      notify(err.code === 'network' ? 'Mất kết nối — kiểm tra mạng và thử lại' : (err.message || 'Lỗi lưu biển số'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete;
    try {
      await deleteMut.mutateAsync(id);
      setConfirmDelete(null);
      undoToast(1, [id]);
    } catch (err) {
      notify(err.message || 'Lỗi xóa biển số');
    }
  };

  const STATUS_LABEL = { available: 'Còn hàng', sold: 'Đã bán', inactive: 'Hết hạn' };
  const bulkStatus = async (status) => {
    const ids = plates.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (!ids.length) return;
    if (!window.confirm(`Đổi trạng thái ${ids.length} biển thành "${STATUS_LABEL[status] || status}"?`)) return;
    const results = await Promise.allSettled(ids.map((id) => statusMut.mutateAsync({ id, status })));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ok;
    setSelected(new Set());
    if (failed === 0) {
      notify(`Đã cập nhật trạng thái ${ok} biển`);
    } else {
      const firstReason = results.find((r) => r.status === 'rejected')?.reason?.message;
      notify(`Cập nhật ${ok}/${results.length} biển thành công — ${failed} biển lỗi${firstReason ? ` (${firstReason})` : ''}`);
    }
  };

  const bulkDelete = async () => {
    const ids = plates.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (!ids.length) return;
    const results = await Promise.allSettled(ids.map((id) => deleteMut.mutateAsync(id)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const okIds = ids.filter((_, i) => results[i].status === 'fulfilled');
    const failed = results.length - ok;
    setSelected(new Set());
    setConfirmBulkDelete(false);
    undoToast(ok, okIds);
    if (failed > 0) {
      const firstReason = results.find((r) => r.status === 'rejected')?.reason?.message;
      notify(`${failed} biển không xóa được${firstReason ? ` (${firstReason})` : ''}`);
    }
  };

  // Delete dialog — plate pending contacts: block hard delete, offer hide instead
  const confirmPlate = plates.find((p) => p.id === confirmDelete) || null;
  const pendingCount = confirmPlate?.pendingContactCount ?? 0;

  const hideInsteadOfDelete = async () => {
    if (!confirmDelete) return;
    try {
      await visMut.mutateAsync({ id: confirmDelete, visible: false });
      setConfirmDelete(null);
      notify('Đã ẩn biển thay vì xóa');
    } catch (err) {
      notify(err.message || 'Lỗi ẩn biển');
    }
  };

  // ── Quick-add & batch-in-grid: tạo 1 biển qua bulk(1) → server tự detect tỉnh/loại biển.
  // Loại xe gửi kèm luôn (mặc định "Xe máy" nếu admin không đổi) — đúng field "Dán nhiều" đã dùng.
  const quickCreate = async (number, price, status, vehicleTypeId) => {
    const n = (number || '').trim();
    if (!n || !/-\d/.test(n)) { notify('Nhập biển số hợp lệ (VD: 43A1-999.99)'); return false; }
    if (!String(price ?? '').trim()) { notify('Nhập giá biển số'); return false; }
    if (!status) { notify('Chọn trạng thái'); return false; }
    const priceOnRequest = false;
    try {
      const res = await bulkMut.mutateAsync([{
        plateNumber: n, price: num(price), isHot: false, priceOnRequest,
        sold: status === 'sold', vehicleTypeId: vehicleTypeId || undefined,
      }]);
      if (res[0]?.success) { notify(`Đã thêm ${n}`); return true; }
      notify(ERR_MSG[res[0]?.error] || 'Không thêm được biển');
      return false;
    } catch (err) {
      notify(err.message || 'Lỗi thêm biển');
      return false;
    }
  };

  const quickAdd = async () => {
    const ok = await quickCreate(quickNum, quickPrice, quickStatus, quickVehicleTypeId || defaultQuickVehicleTypeId);
    if (ok) { setQuickNum(''); setQuickPrice(''); setQuickStatus('available'); setQuickVehicleTypeId(''); }
  };

  // Copy prompt để dán vào ChatGPT/Claude/Gemini — nhờ AI chuyển Excel/PDF danh sách biển số sang
  // đúng format dán ở đây, tránh admin phải gõ tay tài liệu dài. Nguồn: lib/importPlatePrompt.js
  // (đồng bộ nội dung với biensodep-infrastructure/docs/ops/PROMPT-IMPORT-BIEN-SO-TU-EXCEL-PDF.md).
  const copyImportPrompt = async () => {
    try {
      await navigator.clipboard.writeText(IMPORT_PLATE_PROMPT);
      notify('Đã copy prompt — dán vào ChatGPT/Claude kèm file Excel/PDF');
    } catch {
      notify('Không copy được — trình duyệt chặn clipboard');
    }
  };

  // ── Paste / CSV: parse từng dòng "số biển,giá[,trạng thái]" → preview xanh/đỏ. Giá bỏ trống (không
  // có phần thứ 2, hoặc có dấu phân tách nhưng rỗng — VD "43A1-999.99," từ ô Excel trống) →
  // priceOnRequest = true. Cột thứ 3 (tùy chọn) đánh dấu biển đã bán trước đây (nhập lại dữ liệu lịch
  // sử) — chỉ nhận khi khớp rõ ràng "đã bán"/"da ban"/"sold" (không phân biệt hoa thường, dấu), mọi
  // giá trị khác (kể cả bỏ trống hoặc gõ sai chính tả) đều mặc định Available — tránh lỡ tay đánh dấu
  // nhầm biển còn bán thành đã bán.
  const SOLD_MARKERS = ['đã bán', 'da ban', 'sold', '1'];
  const isSoldMarker = (s) => SOLD_MARKERS.includes(s.trim().toLowerCase());
  // Detect category (tỉnh/loại xe/loại biển) ngay lúc parse để admin thấy và sửa TRƯỚC khi bấm Thêm —
  // dùng lại đúng logic detect của form "Thêm biển số (đầy đủ)" (detectPlateTypeId/detectVehicleTypeId)
  // để 2 nơi không lệch kết quả. provinceId ở đây chỉ để hiển thị/cho phép sửa tay; nếu admin không sửa
  // (giữ nguyên giá trị detect), submitBulk vẫn không gửi override — để server tự resolve như cũ.
  const OTO_MARKERS = ['oto', 'o to', 'ô tô', 'car', 'xe hoi', 'xe hơi'];
  const XEMAY_MARKERS = ['xe may', 'xe máy', 'moto', 'motorbike'];
  // Cột thứ 4 (tùy chọn) ghi rõ loại xe — override kết quả detect tự động từ seri (detectVehicleTypeId)
  // khi seri mơ hồ hoặc admin biết chắc hơn máy. Không khớp marker nào → giữ nguyên giá trị detect.
  const detectVehicleTypeOverride = (raw, vehicleTypesRaw) => {
    const s = raw.trim().toLowerCase();
    if (OTO_MARKERS.includes(s)) return (vehicleTypesRaw.find((o) => (o.name || '').toLowerCase().includes('ô tô')) || {}).id || '';
    if (XEMAY_MARKERS.includes(s)) return (vehicleTypesRaw.find((o) => (o.name || '').toLowerCase().includes('xe máy')) || {}).id || '';
    return null;
  };
  const parseLine = (line) => {
    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    const numberPart = (parts[0] || '').trim();
    const number = numberPart.split(/\s+/)[0] || '';
    if (!number) return null;
    const priceRaw = parts.length > 1 ? parts[1] : numberPart.split(/\s+/).slice(1).join(' ').trim();
    const priceOnRequest = !priceRaw;
    const price = priceOnRequest ? 0 : num(priceRaw);
    const sold = parts.length > 2 && isSoldMarker(parts[2]);
    const ok = /-\d/.test(number);
    const { prov, seri, num: serial } = parsePlateNumber(number);
    const provinceId = ok ? provinceByCode(prov) : '';
    const plateTypeId = ok ? detectPlateTypeId(serial.replace(/\D/g, ''), catOpts(plateTypes)) : '';
    const vehicleOverride = parts.length > 3 ? detectVehicleTypeOverride(parts[3], vehicleTypes) : null;
    const vehicleTypeId = ok ? (vehicleOverride ?? detectVehicleTypeId(seri, catOpts(vehicleTypes))) : '';
    const giftedPlateNumber = parts.length > 4 ? (parts[4] || '').trim() : '';
    return {
      number, price, priceOnRequest, sold, provinceId, plateTypeId, vehicleTypeId, giftedPlateNumber,
      provName: prov ? provNameOf(prov) : '', ok, reason: ok ? '' : 'Sai định dạng',
    };
  };

  const onBulkTextChange = (v) => {
    setBulkText(v);
    setBulkRows(v.split('\n').map(parseLine).filter(Boolean).map((r, i) => ({ key: i, done: false, ...r })));
  };

  // Admin sửa tay Loại biển/Loại xe/Tỉnh detect sai — chỉ sửa dòng chưa submit (done=false).
  const editBulkRow = (key, field, value) => {
    setBulkRows((rows) => rows.map((r) => (r.key === key && !r.done ? { ...r, [field]: value } : r)));
  };

  const submitBulk = async () => {
    const valid = bulkRows.filter((r) => r.ok && !r.done);
    if (valid.length === 0) { notify('Không có dòng hợp lệ để thêm'); return; }
    try {
      const res = await bulkMut.mutateAsync(valid.map((r) => ({
        plateNumber: r.number, price: r.price, isHot: false, priceOnRequest: r.priceOnRequest, sold: r.sold,
        plateTypeId: r.plateTypeId || undefined, vehicleTypeId: r.vehicleTypeId || undefined, provinceId: r.provinceId || undefined,
        giftedPlateNumber: r.giftedPlateNumber || undefined,
      })));
      const results = res.results || [];
      setBulkRows((rows) => rows.map((r) => {
        const res = results.find((x) => x.plateNumber === r.number);
        if (!res) return r;
        const reason = res.success ? (res.statusUpdated ? 'Đã cập nhật trạng thái' : '') : (ERR_MSG[res.error] || 'Lỗi');
        return { ...r, done: true, ok: res.success, reason };
      }));
      const createdCount = results.filter((r) => r.success && !r.statusUpdated).length;
      const updatedCount = results.filter((r) => r.success && r.statusUpdated).length;
      notify(`Đã thêm ${createdCount} biển mới${updatedCount ? `, cập nhật trạng thái ${updatedCount} biển trùng` : ''}`);
    } catch (err) {
      notify(err.message || 'Lỗi thêm hàng loạt');
    }
  };

  // ── Inline edit grid
  const commitPrice = (p) => {
    if (!cell) return;
    const price = num(cell.value);
    if (price < 0) { notify('Giá không được âm'); setCell(null); return; }
    updateMut.mutate({ id: p.id, body: { price, priceOnRequest: false } }, {
      onSuccess: () => notify('Đã cập nhật giá'),
      onError: (err) => { notify(err.message || 'Lỗi cập nhật giá'); setCell(null); },
    });
    setCell(null);
  };

  const toggleHot = (p) => updateMut.mutate({ id: p.id, body: { isHot: !p.isHot } }, {
    onSuccess: () => notify(p.isHot ? 'Đã bỏ nổi bật' : 'Đã đánh dấu nổi bật'),
    onError: (err) => notify(err.message || 'Lỗi cập nhật nổi bật'),
  });

  const renderCell = (p, field) => {
    const editing = cell?.id === p.id && cell?.field === field;
    const cellStyle = { border: 'none', background: 'none', cursor: 'text', font: 'var(--type-caption)', color: 'var(--text-strong)', textAlign: 'left', padding: '4px 6px', borderRadius: 'var(--radius-sm)', width: '100%' };
    if (field === 'price') {
      if (editing) {
        return (
          <input autoFocus value={cell.value} onChange={(e) => setCell({ ...cell, value: e.target.value })}
            onBlur={() => commitPrice(p)} onKeyDown={(e) => { if (e.key === 'Enter') commitPrice(p); if (e.key === 'Escape') setCell(null); }}
            onFocus={(e) => e.target.select()}
            style={{ ...cellStyle, background: 'var(--white)', boxShadow: 'inset 0 0 0 1.5px var(--action-primary)' }} />
        );
      }
      return (
        <button type="button" onClick={() => setCell({ id: p.id, field: 'price', value: p.priceOnRequest ? '' : String(p.price || '') })} style={cellStyle} title="Bấm để sửa giá">
          {p.priceOnRequest ? 'Giá liên hệ' : (p.price ? fmt(p.price) : '—')}
        </button>
      );
    }
    return null;
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const SortHeader = ({ label, sortKey, style, className }) => (
    <button type="button" className={className} onClick={() => toggleSort(sortKey)}
      aria-sort={sort?.key === sortKey ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
      style={{ ...style, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit' }}>
      {label}
      {sort?.key === sortKey ? (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
    </button>
  );

  const inputCell = (v, setV, ph) => (
    <input value={v} placeholder={ph} onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
      style={{ height: 36, minWidth: 0, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 12px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none', flex: '1 1 150px' }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Header row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
        <Select label="Trạng thái" value={status} options={STATUS_OPTIONS} onChange={(v) => { setStatus(v); setPage(1); }} />
        <SearchField placeholder="Tìm biển số…" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} width={220} />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          Từ ngày
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} style={{ height: 32, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', padding: '0 8px', font: 'var(--type-caption)' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          Đến ngày
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} style={{ height: 32, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', padding: '0 8px', font: 'var(--type-caption)' }} />
        </label>
        <Select label="Hiển thị" value={perPage} options={PER_PAGE_OPTIONS} onChange={(v) => { setPerPage(Number(v)); setPage(1); }} />
        <div style={{ position: 'relative' }}>
          <Button variant="ghost" size="md" onClick={() => setColMenuOpen((o) => !o)}>Cột hiển thị</Button>
          {colMenuOpen && (
            <>
              <div onClick={() => setColMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 10, background: 'var(--white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-2)', minWidth: 200, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {TOGGLEABLE_COLUMNS.map((c) => (
                  <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                    <input type="checkbox" checked={!!colPrefs[c.key]} onChange={() => toggleCol(c.key)} style={{ width: 14, height: 14, accentColor: 'var(--action-primary)', cursor: 'pointer' }} />
                    {c.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="md" disabled={exporting} onClick={() => exportCsv({ status, keyword: debouncedKeyword, ...(fromDate && { fromDate }), ...(toDate && { toDate }) }).catch((e) => notify(e.message))}>
          {exporting ? 'Đang xuất…' : 'Xuất CSV'}
        </Button>
        <Button variant="ghost" size="md" disabled={checkingMissing} onClick={openMissingMeaningModal}>
          {checkingMissing ? 'Đang kiểm tra…' : 'Sinh ý nghĩa hàng loạt'}
        </Button>
        <Button variant="ghost" size="md" disabled={checkingMissingImage} onClick={openMissingImageModal}>
          {checkingMissingImage ? 'Đang kiểm tra…' : 'Sinh ảnh hàng loạt'}
        </Button>
        <Button variant="ghost" size="md" disabled={checkingGeneratedImage} onClick={openPurgeImageModal}>
          {checkingGeneratedImage ? 'Đang kiểm tra…' : 'Xóa ảnh sinh cũ'}
        </Button>
        <Button variant="primary" size="md" onClick={openAdd}>Thêm biển số (đầy đủ)</Button>
      </div>

      {/* Category filters — loại biển/loại xe/tỉnh/nổi bật, ngoài lọc trạng thái */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
        <Select label="Loại biển" value={plateTypeFilter} options={[{ value: '', label: 'Tất cả' }, ...catOpts(plateTypes)]} onChange={(v) => { setPlateTypeFilter(v); setPage(1); }} />
        <Select label="Loại xe" value={vehicleTypeFilter} options={[{ value: '', label: 'Tất cả' }, ...catOpts(vehicleTypes)]} onChange={(v) => { setVehicleTypeFilter(v); setPage(1); }} />
        <Select label="Tỉnh/thành" value={provinceFilter} options={[{ value: '', label: 'Tất cả' }, ...catOpts(provinces)]} onChange={(v) => { setProvinceFilter(v); setPage(1); }} />
        <Select label="Nổi bật" value={hotFilter} options={HOT_OPTIONS} onChange={(v) => { setHotFilter(v); setPage(1); }} />
      </div>

      {/* Quick-add bar */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', flex: '0 0 auto' }}>Thêm nhanh</span>
          {inputCell(quickNum, setQuickNum, '43A1-999.99')}
          {inputCell(quickPrice, setQuickPrice, 'Giá (VNĐ)')}
          <Select value={quickStatus} options={[{ value: 'available', label: 'Còn hàng' }, { value: 'sold', label: 'Đã bán' }]} onChange={setQuickStatus} />
          <Select value={quickVehicleTypeId || defaultQuickVehicleTypeId} options={catOpts(vehicleTypes)} onChange={setQuickVehicleTypeId} />
          <Button variant="primary" size="md" onClick={quickAdd} disabled={bulkMut.isPending}>{bulkMut.isPending ? 'Đang thêm…' : 'Thêm'}</Button>
          <Button variant="ghost" size="md" onClick={() => setBulkOpen(!bulkOpen)}>{bulkOpen ? 'Đóng dán nhiều' : 'Dán nhiều / CSV'}</Button>
          <Button variant="ghost" size="md" onClick={copyImportPrompt} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Copy size={14} /> Copy prompt import từ Excel/PDF</Button>
        </div>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Nhập biển số, giá, trạng thái (bắt buộc) rồi bấm Thêm. Loại xe mặc định Xe máy — đổi tay nếu cần. Hệ thống tự nhận tỉnh từ số biển. Dán nhiều hỗ trợ thêm cột 3 "đã bán", cột 4 "ô tô"/"xe máy" (ghi đè khi hệ thống đoán sai), cột 5 biển số tặng kèm (VD ô tô tặng biển xe máy). Có file Excel/PDF danh sách biển? Bấm "Copy prompt" rồi dán vào ChatGPT/Claude kèm file — AI tự xuất sẵn format dán vào đây.</span>

        {bulkOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <textarea value={bulkText} onChange={(e) => onBulkTextChange(e.target.value)} rows={5}
              placeholder={'Mỗi dòng 1 biển, cách nhau bằng dấu phẩy / tab:\n43A1-999.99, 350000000\n43A1-666.66, 500000000\n43A1-777.77 (bỏ trống giá = Giá liên hệ)\n43A1-555.55, 45000000, đã bán (nhập lại biển đã bán trước đây)\n43AB-668.88, 39000000, , xe máy (cột 4 ghi rõ loại xe nếu hệ thống đoán sai từ seri)'}
              style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none', fontFamily: 'monospace' }} />
            {bulkRows.length > 0 && (
              <>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button variant={bulkView === 'list' ? 'dark' : 'ghost'} size="sm" onClick={() => setBulkView('list')}>Danh sách</Button>
                  <Button variant={bulkView === 'card' ? 'dark' : 'ghost'} size="sm" onClick={() => setBulkView('card')}>Xem biển (UI đầy đủ)</Button>
                </div>
                {bulkView === 'list' ? (
                  <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <div style={{ minWidth: 900 }}>
                        {/* Cột khớp đúng width header bảng quản lý bên dưới (checkbox 34 → bỏ vì preview chưa
                            chọn hàng loạt được, Ảnh 56 → bỏ vì preview chưa có ảnh) để 2 bảng thẳng hàng mắt. */}
                        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-2) var(--gutter-card)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                          <span style={{ flex: '1 1 120px' }}>Biển số</span>
                          <span style={{ flex: '1 1 88px' }}>Loại biển</span>
                          <span style={{ flex: '1 1 88px' }}>Loại xe</span>
                          <span style={{ flex: '1 1 88px' }}>Tỉnh</span>
                          <span style={{ flex: '1 1 110px' }}>Giá</span>
                          <span style={{ flex: '1 1 100px' }}>Trạng thái</span>
                          <span style={{ flex: '0 0 96px' }}>Kết quả</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflow: 'auto' }}>
                          {bulkRows.map((r) => (
                            <div key={r.key} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: '4px var(--gutter-card)', borderRadius: 'var(--radius-sm)', background: r.done ? (r.ok ? 'var(--mint-100)' : 'var(--rose-100)') : 'transparent', font: 'var(--type-body-sm)' }}>
                              <span style={{ color: 'var(--text-strong)', flex: '1 1 120px' }}>{r.number || '—'}</span>
                              <select value={r.plateTypeId || ''} disabled={r.done} onChange={(e) => editBulkRow(r.key, 'plateTypeId', e.target.value)} style={{ flex: '1 1 88px', height: 28, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: r.plateTypeId ? 'var(--text-strong)' : 'var(--status-danger)' }}>
                                <option value="">— Loại? —</option>
                                {plateTypes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <select value={r.vehicleTypeId || ''} disabled={r.done} onChange={(e) => editBulkRow(r.key, 'vehicleTypeId', e.target.value)} style={{ flex: '1 1 88px', height: 28, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: r.vehicleTypeId ? 'var(--text-strong)' : 'var(--status-danger)' }}>
                                <option value="">— Xe? —</option>
                                {vehicleTypes.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                              </select>
                              <select value={r.provinceId || ''} disabled={r.done} onChange={(e) => editBulkRow(r.key, 'provinceId', e.target.value)} style={{ flex: '1 1 88px', height: 28, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: r.provinceId ? 'var(--text-strong)' : 'var(--status-danger)' }}>
                                <option value="">— Tỉnh? —</option>
                                {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <span style={{ color: 'var(--text-muted)', flex: '1 1 110px' }}>{r.priceOnRequest ? 'Liên hệ' : fmt(r.price)}</span>
                              <span style={{ flex: '1 1 100px', color: r.sold ? 'var(--status-danger)' : 'var(--text-muted)' }}>{r.sold ? 'Đã bán' : 'Còn hàng'}</span>
                              <span style={{ color: r.ok ? 'var(--mint-700)' : 'var(--status-danger)', flex: '0 0 96px', textAlign: 'right', font: 'var(--type-caption)' }}>
                                {r.done ? (r.ok ? '✓ Đã thêm' : `✗ ${r.reason}`) : (r.ok ? 'Sẵn sàng' : r.reason || 'Bỏ trống')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {bulkRows.some((r) => !r.ok) && (
                      <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>
                        {bulkRows.filter((r) => !r.ok).length} dòng lỗi định dạng không hiện ở đây — xem "Danh sách" để sửa.
                      </span>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)', maxHeight: 560, overflow: 'auto', padding: 8 }}>
                    {bulkRows.filter((r) => r.ok).map((r) => {
                      const { prov, seri, num: plateNum } = parsePlateNumber(r.number);
                      return (
                        <div key={r.key} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 12 }}>
                          <PlateVisual size="md" prov={prov} seri={seri} num={plateNum} shape="short" />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px' }}>
                            <select value={r.plateTypeId || ''} disabled={r.done} onChange={(e) => editBulkRow(r.key, 'plateTypeId', e.target.value)} style={{ height: 26, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: r.plateTypeId ? 'var(--text-strong)' : 'var(--status-danger)' }}>
                              <option value="">— Loại biển? —</option>
                              {plateTypes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select value={r.provinceId || ''} disabled={r.done} onChange={(e) => editBulkRow(r.key, 'provinceId', e.target.value)} style={{ height: 26, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: r.provinceId ? 'var(--text-strong)' : 'var(--status-danger)' }}>
                              <option value="">— Tỉnh? —</option>
                              {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{r.priceOnRequest ? 'Liên hệ' : fmt(r.price)}</span>
                            <span style={{ font: 'var(--type-caption)', color: r.done ? (r.ok ? 'var(--mint-700)' : 'var(--status-danger)') : 'var(--text-muted)' }}>
                              {r.sold ? 'Đã bán · ' : ''}{r.done ? (r.ok ? '✓ Đã thêm' : `✗ ${r.reason}`) : 'Sẵn sàng'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </>
                )}
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="primary" size="md" onClick={submitBulk} disabled={bulkMut.isPending || bulkRows.filter((r) => r.ok && !r.done).length === 0}>
                {bulkMut.isPending ? 'Đang thêm…' : `Thêm ${bulkRows.filter((r) => r.ok && !r.done).length} biển hợp lệ`}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table — grid notion, edit inline */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
      <div className="admin-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 1180 }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '0 0 34px' }}>
            <input type="checkbox" aria-label="Chọn tất cả" checked={allSelected} onChange={toggleAll}
              ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
              style={{ width: 16, height: 16, accentColor: 'var(--action-primary)', cursor: 'pointer' }} />
          </span>
          <span style={{ flex: '0 0 56px' }}>Ảnh</span>
          <SortHeader label="Biển số" sortKey="plateNumber" style={{ flex: '1 1 120px' }} />
          {colPrefs.plateType && <SortHeader label="Loại biển" sortKey="plateTypeName" style={{ flex: '1 1 88px' }} />}
          {colPrefs.vehicleType && <SortHeader label="Loại xe" sortKey="vehicleTypeName" style={{ flex: '1 1 88px' }} />}
          {colPrefs.province && <SortHeader label="Tỉnh" sortKey="provinceName" style={{ flex: '1 1 88px' }} />}
          {colPrefs.price && <SortHeader label="Giá (bấm sửa)" sortKey="price" style={{ flex: '1 1 110px' }} />}
          {colPrefs.salePrice && <SortHeader label="Giá KM" sortKey="salePrice" style={{ flex: '1 1 96px' }} />}
          {colPrefs.gifted && <span style={{ flex: '1 1 96px' }}>Biển tặng</span>}
          {colPrefs.isNew && <span className="plate-col-new" style={{ flex: '0 0 48px' }}>Mới</span>}
          {colPrefs.status && (
            <span style={{ flex: '1 1 100px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <SortHeader label="Trạng thái" sortKey="status" />
              <InfoTip size={12} text="Trạng thái biển: Còn hàng = đang bán; Đã bán = chốt giao dịch; Hết hạn = biển đấu giá quá hạn, tự ẩn khỏi trang." />
            </span>
          )}
          {colPrefs.pendingContact && <SortHeader label="Liên hệ chờ" sortKey="pendingContactCount" style={{ flex: '0 0 96px' }} />}
          {colPrefs.imageCount && <SortHeader label="Số ảnh" sortKey="imageCount" style={{ flex: '0 0 76px' }} />}
          {colPrefs.createdAt && <SortHeader label="Ngày tạo" sortKey="createdAt" style={{ flex: '1 1 96px' }} />}
          {colPrefs.updatedAt && <SortHeader label="Cập nhật" sortKey="updatedAt" className="plate-col-updated" style={{ flex: '1 1 96px' }} />}
          <span style={{ flex: '0 0 80px' }}>Thao tác</span>
        </div>

        {isLoading && <div style={{ padding: 'var(--space-4)' }}><Skeleton variant="table" rows={6} /></div>}

        {!isLoading && sortedPlates.map((p) => {
          const parsed = parsePlateNumber(p.plateNumber);
          return (
            <div key={p.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-2) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <span style={{ flex: '0 0 34px' }}>
                <input type="checkbox" aria-label={`Chọn ${p.plateNumber}`} checked={selected.has(p.id)} onChange={() => toggleOne(p.id)}
                  style={{ width: 16, height: 16, accentColor: 'var(--action-primary)', cursor: 'pointer' }} />
              </span>
              <span style={{ flex: '0 0 56px' }}>
                {p.images?.[0]?.url ? (
                  <img src={p.images[0].url} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                ) : (
                  <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} />
                )}
              </span>
              <span style={{ flex: '1 1 120px', display: 'flex', alignItems: 'center', gap: 4, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <button type="button" onClick={() => toggleHot(p)} title={p.isHot ? 'Bỏ đánh dấu nổi bật' : 'Đánh dấu nổi bật'}
                  style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', flexShrink: 0 }}>
                  <Star size={14} fill={p.isHot ? 'var(--amber-500)' : 'none'} color={p.isHot ? 'var(--amber-500)' : 'var(--grey-300)'} />
                </button>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.plateNumber}</span>
              </span>
              {colPrefs.plateType && <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.plateTypeName}</span>}
              {colPrefs.vehicleType && <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.vehicleTypeName}</span>}
              {colPrefs.province && <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.provinceName}</span>}
              {colPrefs.price && <span style={{ flex: '1 1 110px' }}>{renderCell(p, 'price')}</span>}
              {colPrefs.salePrice && <span style={{ flex: '1 1 96px', font: 'var(--type-body-sm)', color: p.salePrice ? 'var(--status-danger)' : 'var(--text-faint)' }}>{p.salePrice ? fmt(p.salePrice) : '—'}</span>}
              {colPrefs.gifted && (
                <span style={{ flex: '1 1 96px', font: 'var(--type-body-sm)' }}>
                  {p.giftedPlateNumber ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>
                      <Gift size={13} />{p.giftedPlateNumber}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-faint)' }}>—</span>
                  )}
                </span>
              )}
              {colPrefs.isNew && (
                <span className="plate-col-new" style={{ flex: '0 0 48px' }}>
                  {isNewPlate(p) ? (
                    <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--mint-100)', color: 'var(--mint-700)', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)' }}>Mới</span>
                  ) : (
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>—</span>
                  )}
                </span>
              )}
              {colPrefs.status && (
                <span style={{ flex: '1 1 100px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <select value={p.status} onChange={(e) => statusMut.mutate({ id: p.id, status: e.target.value }, {
                    onSuccess: () => notify(e.target.value === 'sold' ? 'Đã đánh dấu Đã bán' : 'Đã đổi sang Còn hàng'),
                    onError: (err) => notify(err.message || 'Lỗi cập nhật trạng thái'),
                  })}
                    style={{ border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', font: 'var(--type-caption)', color: 'var(--text-body)', outline: 'none', cursor: 'pointer' }}>
                    <option value="available">Còn hàng</option>
                    <option value="sold">Đã bán</option>
                  </select>
                </span>
              )}
              {colPrefs.pendingContact && (
                <span style={{ flex: '0 0 96px', font: 'var(--type-body-sm)', color: p.pendingContactCount > 0 ? 'var(--action-primary)' : 'var(--text-faint)', fontWeight: p.pendingContactCount > 0 ? 'var(--fw-semibold)' : 'var(--fw-regular)' }}>
                  {p.pendingContactCount > 0 ? p.pendingContactCount : '—'}
                </span>
              )}
              {colPrefs.imageCount && <span style={{ flex: '0 0 76px', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{p.imageCount ?? 0}</span>}
              {colPrefs.createdAt && <span style={{ flex: '1 1 96px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</span>}
              {colPrefs.updatedAt && <span className="plate-col-updated" style={{ flex: '1 1 96px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDate(p.updatedAt)}</span>}
              <span style={{ flex: '0 0 104px', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                {!p.imageCount && (
                  <IconButton name="image" label="Sinh ảnh" size="sm" disabled={generatingRowId === p.id} onClick={() => generateRowImage(p)} />
                )}
                <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEdit(p)} />
                <IconButton name="trash-2" label="Xóa" size="sm" onClick={() => setConfirmDelete(p.id)} />
                <AuditHistoryButton entityType="plate" entityId={p.id} />
              </span>
            </div>
          );
        })}
        </div>
        </div>

        {!isLoading && isError && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--status-danger)' }}>
            Lỗi tải danh sách biển số.{' '}
            <button type="button" onClick={() => refetch()} style={{ color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Thử lại</button>
          </div>
        )}
        {!isLoading && !isError && plates.length === 0 && (status !== 'all' || keyword) && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có biển số nào khớp bộ lọc.</div>
        )}
        {!isLoading && !isError && plates.length === 0 && status === 'all' && !keyword && (
          <div style={{ padding: '56px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <CarFront size={40} style={{ color: 'var(--text-faint)' }} />
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có biển số nào trong hệ thống</span>
            <Button variant="primary" size="md" onClick={openAdd}>Thêm biển số mới</Button>
          </div>
        )}
      </div>

      {/* Pagination — prev/next + windowed pages */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}
            style={{ minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-pill)', cursor: page <= 1 ? 'default' : 'pointer', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', background: 'var(--surface-sunken)', color: page <= 1 ? 'var(--grey-300)' : 'var(--text-body)' }}>
            ‹ Trước
          </button>
          {pageWindow(page, totalPages).map((p, idx) =>
            p === null
              ? <span key={`e${idx}`} style={{ color: 'var(--text-faint)', font: 'var(--type-caption)' }}>…</span>
              : <button key={p} type="button" onClick={() => setPage(p)}
                  style={{ minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-caption)',
                    background: p === page ? 'var(--action-primary)' : 'var(--surface-sunken)',
                    color: p === page ? 'var(--white)' : 'var(--text-body)', fontWeight: p === page ? 'var(--fw-bold)' : 'var(--fw-medium)' }}>
                  {p}
                </button>
          )}
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            style={{ minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-pill)', cursor: page >= totalPages ? 'default' : 'pointer', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', background: 'var(--surface-sunken)', color: page >= totalPages ? 'var(--grey-300)' : 'var(--text-body)' }}>
            Sau ›
          </button>
        </div>
      )}

      {/* Bulk action bar — floats above table when plates are selected */}
      {selected.size > 0 && (
        <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 'var(--z-bulk, 80)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-4)', background: 'var(--text-strong)', color: 'var(--white)', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-4)' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--white)' }}>Đã chọn {selected.size} biển</span>
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value) { bulkStatus(e.target.value); e.target.value = ''; } }}
            style={{ border: 'none', background: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', font: 'var(--type-caption)', color: 'var(--text-strong)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="" disabled>Đổi trạng thái ▾</option>
            <option value="available">Còn hàng</option>
            <option value="sold">Đã bán</option>
            <option value="inactive">Hết hạn</option>
          </select>
          <button type="button" onClick={() => setConfirmBulkDelete(true)} style={{ border: 'none', background: 'var(--status-danger)', color: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '4px 12px', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', cursor: 'pointer' }}>Xóa</button>
        </div>
      )}

      {/* Modal: Add/Edit — only render when modal is open */}
      {editId != null && (
        <PlateFormModal
          form={form} setF={setF} formErr={formErr} blurValidateField={blurValidateField}
          notify={notify}
          showCost={canViewCost(st)}
          saving={saving} uploading={uploading}
          plateTypes={catOpts(plateTypes)}
          provinces={catOpts(provinces)}
          onPlateNumberChange={handlePlateNumberChange}
          vehicleTypes={catOpts(vehicleTypes)}
          editDetail={editPlateId ? editDetail : null}
          onSave={handleSave}
          onUpload={handleUpload}
          onRemoveImage={removeImage}
          onClose={() => { setEditId(null); setEditPlateId(null); setForm(INITIAL_FORM); setFormErr({}); }}
        />
      )}

      {/* Confirm delete — shared Modal, blocks hard delete while contacts pending */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Xác nhận xóa" maxWidth="440px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {pendingCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--amber-100)', color: 'var(--amber-800)', font: 'var(--type-body-sm)' }}>
              <span aria-hidden style={{ display: 'inline-flex' }}><TriangleAlert size={16} /></span>
              <span>Biển này đang có <b>{pendingCount}</b> yêu cầu chưa xử lý. Hãy <b>Ẩn thay vì xóa</b> để giữ lịch sử giao dịch.</span>
            </div>
          )}
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Biển số này sẽ được ẩn khỏi hệ thống. Bạn có thể khôi phục lại sau nếu cần.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="ghost" size="md" onClick={() => setConfirmDelete(null)}>Hủy</Button>
            {pendingCount > 0 ? (
              <Button variant="ghost" size="md" onClick={hideInsteadOfDelete}>Ẩn thay vì xóa</Button>
            ) : (
              <Button variant="danger" size="md" onClick={handleDelete} loading={deleteMut.isPending}>Xóa</Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Sinh ý nghĩa phong thủy hàng loạt — liệt kê biển thiếu trước khi sinh */}
      <Modal open={missingMeaningPlates !== null} onClose={() => setMissingMeaningPlates(null)} title="Sinh ý nghĩa hàng loạt" maxWidth="480px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {missingMeaningPlates?.length ? (
            <>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                <b>{missingMeaningPlates.length}</b> biển chưa có ý nghĩa phong thủy. Biển không khớp mẫu nào (số thường) sẽ bị bỏ qua.
              </p>
              <div style={{ maxHeight: 220, overflow: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
                {missingMeaningPlates.map((p) => (
                  <span key={p.id} style={{ font: 'var(--type-caption)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--white)', color: 'var(--text-strong)' }}>{p.plateNumber}</span>
                ))}
              </div>
            </>
          ) : (
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Mọi biển đã có ý nghĩa phong thủy.</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="ghost" size="md" onClick={() => setMissingMeaningPlates(null)}>Hủy</Button>
            {!!missingMeaningPlates?.length && (
              <Button variant="primary" size="md" onClick={confirmBulkSeedMeanings} loading={bulkSeedMut.isPending}>Sinh ý nghĩa cho {missingMeaningPlates.length} biển</Button>
            )}
          </div>
        </div>
      </Modal>

      <Modal open={missingImagePlates !== null} onClose={closeMissingImageModal} title="Sinh ảnh hàng loạt" maxWidth="480px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {missingImagePlates?.length ? (
            <>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                <b>{missingImagePlates.length}</b> biển chưa có ảnh. Hệ thống sẽ tự vẽ ảnh biển số làm ảnh đại diện tạm, có thể thay bằng ảnh thật sau.
              </p>
              {!genProgress && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đã chọn {selectedGenIds.size}/{missingImagePlates.length}</span>
                  <button type="button" onClick={() => setSelectedGenIds(new Set(missingImagePlates.map((p) => p.id)))} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Chọn tất cả</button>
                  <button type="button" onClick={() => setSelectedGenIds(new Set())} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Bỏ chọn hết</button>
                </div>
              )}
              {genProgress && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(genProgress.done / genProgress.total) * 100}%`, background: 'var(--action-primary)', transition: 'width 150ms var(--ease-out)' }} />
                  </div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Đã sinh {genProgress.done}/{genProgress.total}{genProgress.errors.length ? ` — ${genProgress.errors.length} lỗi` : ''}
                  </span>
                </div>
              )}
              <div style={{ maxHeight: 220, overflow: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
                {missingImagePlates.map((p) => {
                  const runList = genProgress ? missingImagePlates.filter((x) => selectedGenIds.has(x.id)) : null;
                  const runIdx = runList ? runList.findIndex((x) => x.id === p.id) : -1;
                  const inRun = runIdx >= 0;
                  const done = genProgress && inRun && runIdx < genProgress.done;
                  const failed = genProgress?.errors.includes(p.plateNumber);
                  const selected = selectedGenIds.has(p.id);
                  return (
                    <span key={p.id} role={genProgress ? undefined : 'button'} tabIndex={genProgress ? undefined : 0}
                      onClick={genProgress ? undefined : () => toggleGenSelected(p.id)}
                      onKeyDown={genProgress ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGenSelected(p.id); } }}
                      style={{
                        font: 'var(--type-caption)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', cursor: genProgress ? 'default' : 'pointer',
                        border: !genProgress && !selected ? '1px dashed var(--grey-300)' : '1px solid transparent',
                        opacity: !genProgress && !selected ? 0.5 : 1,
                        background: failed ? 'var(--status-danger-bg)' : done ? 'var(--status-success-bg)' : 'var(--white)',
                        color: failed ? 'var(--status-danger)' : done ? 'var(--status-success)' : 'var(--text-strong)',
                      }}>{p.plateNumber}</span>
                  );
                })}
              </div>
            </>
          ) : (
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Mọi biển đã có ảnh.</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="ghost" size="md" onClick={closeMissingImageModal}>{genProgress ? 'Đóng' : 'Hủy'}</Button>
            {!!missingImagePlates?.length && !genProgress && (
              <Button variant="primary" size="md" disabled={selectedGenIds.size === 0} onClick={confirmBulkGenerateImages}>Sinh ảnh cho {selectedGenIds.size} biển</Button>
            )}
          </div>
        </div>
      </Modal>

      <Modal open={generatedImagePlates !== null} onClose={closePurgeImageModal} title="Xóa ảnh sinh cũ" maxWidth="480px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {generatedImagePlates?.length ? (
            <>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                <b>{generatedImagePlates.length}</b> biển đang dùng ảnh do hệ thống tự vẽ. Xóa xong dùng "Sinh ảnh hàng loạt" để tạo lại bằng renderer mới (đã fix font). Ảnh admin upload tay không bị đụng.
              </p>
              {!purgeProgress && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đã chọn {selectedPurgeIds.size}/{generatedImagePlates.length}</span>
                  <button type="button" onClick={() => setSelectedPurgeIds(new Set(generatedImagePlates.map((p) => p.id)))} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Chọn tất cả</button>
                  <button type="button" onClick={() => setSelectedPurgeIds(new Set())} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Bỏ chọn hết</button>
                </div>
              )}
              {purgeProgress && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(purgeProgress.done / purgeProgress.total) * 100}%`, background: 'var(--action-primary)', transition: 'width 150ms var(--ease-out)' }} />
                  </div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Đã xóa {purgeProgress.done}/{purgeProgress.total}{purgeProgress.errors.length ? ` — ${purgeProgress.errors.length} lỗi` : ''}
                  </span>
                </div>
              )}
              <div style={{ maxHeight: 220, overflow: 'auto', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
                {generatedImagePlates.map((p) => {
                  const runList = purgeProgress ? generatedImagePlates.filter((x) => selectedPurgeIds.has(x.id)) : null;
                  const runIdx = runList ? runList.findIndex((x) => x.id === p.id) : -1;
                  const inRun = runIdx >= 0;
                  const done = purgeProgress && inRun && runIdx < purgeProgress.done;
                  const failed = purgeProgress?.errors.includes(p.plateNumber);
                  const selected = selectedPurgeIds.has(p.id);
                  return (
                    <span key={p.id} role={purgeProgress ? undefined : 'button'} tabIndex={purgeProgress ? undefined : 0}
                      onClick={purgeProgress ? undefined : () => togglePurgeSelected(p.id)}
                      onKeyDown={purgeProgress ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePurgeSelected(p.id); } }}
                      style={{
                        font: 'var(--type-caption)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', cursor: purgeProgress ? 'default' : 'pointer',
                        border: !purgeProgress && !selected ? '1px dashed var(--grey-300)' : '1px solid transparent',
                        opacity: !purgeProgress && !selected ? 0.5 : 1,
                        background: failed ? 'var(--status-danger-bg)' : done ? 'var(--status-success-bg)' : 'var(--white)',
                        color: failed ? 'var(--status-danger)' : done ? 'var(--status-success)' : 'var(--text-strong)',
                      }}>{p.plateNumber}</span>
                  );
                })}
              </div>
            </>
          ) : (
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có ảnh sinh tự động nào.</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="ghost" size="md" onClick={closePurgeImageModal}>{purgeProgress ? 'Đóng' : 'Hủy'}</Button>
            {!!generatedImagePlates?.length && !purgeProgress && (
              <Button variant="danger" size="md" disabled={selectedPurgeIds.size === 0} onClick={confirmPurgeGeneratedImages}>Xóa ảnh cho {selectedPurgeIds.size} biển</Button>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmBulkModal
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={bulkDelete}
        count={selected.size}
        actionLabel="xóa"
        itemLabel="biển số"
        danger
        loading={deleteMut.isPending}
      />
    </div>
  );
}

// ── Plate Form Modal ──

function PlateFormModal({
  form, setF, formErr, blurValidateField, saving, uploading, showCost, notify,
  plateTypes, provinces, vehicleTypes,
  editDetail, onPlateNumberChange, onSave, onUpload, onRemoveImage, onClose,
}) {
  const fileRef = (e) => {
    if (e?.target?.files?.length) {
      onUpload(e.target.files);
      e.target.value = '';
    }
  };

  // Auto-fill: candidates sinh từ biển số; mỗi field có toggle thêm/xóa riêng + "Thêm tất cả".
  const [candidates, setCandidates] = useState(null);
  const [candOn, setCandOn] = useState({});
  const generateCandidates = () => {
    const raw = (form.plateNumber || '').trim();
    const { prov, seri, num } = parsePlateNumber(raw);
    const serial = num.replace(/\D/g, '');
    const provinceId = (provinces.find((o) => (o.code || '').trim() === (prov || '').trim()) || {}).value || '';
    const cand = {
      provinceId,
      plateTypeId: detectPlateTypeId(serial, plateTypes),
      vehicleTypeId: detectVehicleTypeId(seri, vehicleTypes),
      fengShuiMeaning: composeFengShuiMeaning(raw),
    };
    setCandidates(cand);
    const on = {};
    CAND_FIELDS.forEach((f) => { on[f.key] = !!cand[f.key]; });
    setCandOn(on);
    if (!Object.values(cand).some(Boolean)) notify?.('Không tự nhận diện được thông tin từ biển số này — vui lòng chọn tay.');
  };
  const toggleCandidate = (key) => {
    const next = !candOn[key];
    setCandOn((prev) => ({ ...prev, [key]: next }));
    setF(key)(next ? candidates[key] : '');
  };
  const applyAll = () => {
    const on = {};
    CAND_FIELDS.forEach((f) => {
      const v = candidates?.[f.key];
      if (v) { on[f.key] = true; setF(f.key)(v); } else { on[f.key] = false; }
    });
    setCandOn(on);
  };
  const candRows = candidates ? CAND_FIELDS.filter((f) => candidates[f.key]) : [];
  // Hiển thị tên thật (label) thay vì id category cho các field trong panel gợi ý.
  const candidateLabel = (key, value) => {
    const map = { provinceId: provinces, plateTypeId: plateTypes, vehicleTypeId: vehicleTypes }[key];
    if (map) return (map.find((o) => o.value === value) || {}).label || value;
    return value;
  };

  const moveImage = (i, dir) => {
    const arr = [...(form.images || [])];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setF('images')(arr);
  };

  const parsed = (() => {
    const s = (form.plateNumber || '').trim();
    const idx = Math.max(s.lastIndexOf('-'), s.lastIndexOf(' '));
    if (idx < 0) return { prov: '43', seri: 'A1', num: '000.00' };
    const left = s.slice(0, idx).replace(/[\s-]/g, '');
    const num = s.slice(idx + 1).trim() || '000.00';
    const prov = left.match(/^\d{1,2}/)?.[0] || '43';
    const seri = left.slice(prov.length) || 'A1';
    return { prov, seri, num };
  })();

  return (
    <Drawer open onClose={onClose} title={editDetail ? 'Sửa biển số' : 'Thêm biển số'} width="min(52%, 720px)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          {editDetail ? 'Cập nhật thông tin biển đang bán.' : 'Biển sẽ xuất hiện ở đầu bảng và trang chủ.'}
        </p>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Biển số</span>
          <span style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
            <input
              type="text" placeholder="43A1-999.99" value={form.plateNumber ?? ''}
              onChange={(e) => onPlateNumberChange(e.target.value)}
              onBlur={blurValidateField('plateNumber')}
              style={{ height: 40, flex: '1 1 auto', border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)',
                boxShadow: formErr.plateNumber ? 'inset 0 0 0 1.5px var(--status-danger)' : 'var(--shadow-inset-hairline)',
                padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }}
            />
            <Button variant="outline" size="sm" onClick={generateCandidates} disabled={!(form.plateNumber || '').trim()} style={{ whiteSpace: 'nowrap' }}>Tự động điền</Button>
          </span>
          {formErr.plateNumber && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{formErr.plateNumber}</span>}
        </label>

        {candRows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Gợi ý từ biển số</span>
              <Button variant="primary" size="sm" onClick={applyAll} style={{ whiteSpace: 'nowrap' }}>Thêm tất cả</Button>
            </div>
            {candRows.map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!candOn[key]} onChange={() => toggleCandidate(key)} style={{ width: 16, height: 16, accentColor: 'var(--action-primary)' }} />
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', flex: '0 0 140px' }}>{label}</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', flex: '1 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{candidateLabel(key, candidates[key])}</span>
              </label>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Select label="Loại biển" value={form.plateTypeId} options={plateTypes} onChange={(v) => { setF('plateTypeId')(v); blurValidateField('plateTypeId', v)(); }} style={{ flex: '1 1 140px' }} required />
          <Select label="Tỉnh/thành" value={form.provinceId} options={provinces} onChange={(v) => { setF('provinceId')(v); blurValidateField('provinceId', v)(); }} style={{ flex: '1 1 140px' }} required />
          <Select label="Loại xe" value={form.vehicleTypeId} options={vehicleTypes} onChange={(v) => { setF('vehicleTypeId')(v); blurValidateField('vehicleTypeId', v)(); }} style={{ flex: '1 1 140px' }} required />
        </div>
        {(formErr.plateTypeId || formErr.provinceId || formErr.vehicleTypeId) && (
          <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>
            {[formErr.plateTypeId, formErr.provinceId, formErr.vehicleTypeId].filter(Boolean).join(' · ')}
          </span>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Giá</span>
              <input
                type="text" placeholder="2.150.000.000" value={form.price ?? ''}
                onChange={setF('price')} disabled={form.priceOnRequest}
                style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: form.priceOnRequest ? 'var(--grey-100)' : 'var(--surface-sunken)',
                  boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)',
                  outline: 'none', opacity: form.priceOnRequest ? 0.6 : 1 }}
              />
            </label>
          </div>
          {showCost && (
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Giá vốn<InfoTip size={12} text="Chỉ hiện với người có quyền xem giá vốn — không công khai, dùng tính lợi nhuận nội bộ." /></span>
                <input
                  type="text" placeholder="1.500.000.000" value={form.costPrice ?? ''}
                  onChange={setF('costPrice')}
                  style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)',
                    boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }}
                />
              </label>
            </div>
          )}
          {!form.priceOnRequest && (
            <>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>% giảm</span>
                  <input
                    type="text" placeholder="10" value={form.saleDiscountPercent ?? ''}
                    onChange={(e) => {
                      const pct = e.target.value.replace(/[^\d]/g, '');
                      setForm((f) => ({
                        ...f, saleDiscountPercent: pct,
                        salePrice: pct && num(f.price) > 0 ? String(Math.round(num(f.price) * (1 - Number(pct) / 100))) : '',
                      }));
                    }}
                    style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)',
                      boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }}
                  />
                </label>
              </div>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Giá sau giảm</span>
                  <input
                    type="text" placeholder="Để trống nếu không giảm" value={form.salePrice ?? ''}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, '');
                      setForm((f) => ({
                        ...f, salePrice: v,
                        saleDiscountPercent: v && num(f.price) > 0 ? String(Math.round((1 - Number(v) / num(f.price)) * 100)) : '',
                      }));
                    }}
                    style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)',
                      boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }}
                  />
                </label>
              </div>
            </>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.priceOnRequest} onChange={(e) => setF('priceOnRequest')(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Giá liên hệ<InfoTip size={12} text="Không hiện giá công khai — khách phải gọi/Zalo để hỏi giá. Thường dùng cho biển đắt, giá nhạy cảm." /></span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isHot} onChange={(e) => setF('isHot')(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Biển HOT<InfoTip size={12} text="Đánh dấu biển đẹp/bán chạy để ưu tiên hiện lên đầu trang chủ và danh sách, gắn nhãn HOT." /></span>
          </label>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 240px' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mô tả</span>
            <textarea rows={2} placeholder="Mô tả ngắn về biển số" value={form.description} onChange={setF('description')}
              style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '10px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 240px' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ý nghĩa phong thủy</span>
            <textarea rows={2} placeholder="Phân tích phong thủy của biển" value={form.fengShuiMeaning} onChange={setF('fengShuiMeaning')}
              style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '10px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
          </label>
        </div>

        <GiftedPlateField value={form.giftedPlateNumber} onChange={setF('giftedPlateNumber')} excludeId={editDetail?.id} />

        {/* Images — optional (biển không ảnh vẫn lưu, hiển thị bằng PlateVisual) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
            Ảnh biển số
            {formErr.images && <span style={{ color: 'var(--status-danger)', font: 'var(--type-caption)' }}> — {formErr.images}</span>}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {(form.images || []).map((url, i) => (
              <div key={url} style={{ position: 'relative', width: 72, height: 72, borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-inset-hairline)' }}>
                <img src={url} alt={`Ảnh ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {i === 0 && (
                  <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.55)', color: 'var(--white)', font: 'var(--type-caption)', fontSize: 10, textAlign: 'center', padding: '1px 0' }}>Đại diện</span>
                )}
                <button type="button" onClick={() => onRemoveImage(url)}
                  style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.55)', color: 'var(--white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✕</button>
                <div style={{ position: 'absolute', top: 2, left: 2, display: 'flex', gap: 2 }}>
                  <button type="button" disabled={i === 0} aria-label="Chuyển ảnh lên trước" onClick={() => moveImage(i, -1)}
                    style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.55)', color: 'var(--white)', cursor: i === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, opacity: i === 0 ? 0.4 : 1 }}>‹</button>
                  <button type="button" disabled={i === (form.images || []).length - 1} aria-label="Chuyển ảnh xuống sau" onClick={() => moveImage(i, 1)}
                    style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.55)', color: 'var(--white)', cursor: i === (form.images || []).length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, opacity: i === (form.images || []).length - 1 ? 0.4 : 1 }}>›</button>
                </div>
              </div>
            ))}
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer?.files?.length) onUpload(e.dataTransfer.files); }}
              style={{ width: 72, height: 72, borderRadius: 'var(--radius-md)', border: '2px dashed var(--grey-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', font: 'var(--type-caption)' }}>
              {uploading ? '…' : '+ Ảnh'}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={fileRef} />
            </label>
          </div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Tối đa 8 ảnh, ≤5MB/ảnh. Ảnh đầu tiên là ảnh đại diện.</span>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: 1 }}>Xem trước</span>
          <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="md" onClick={onClose}>Hủy</Button>
          <Button variant="primary" size="md" onClick={onSave} disabled={saving || uploading}>
            {saving ? 'Đang lưu…' : 'Lưu biển số'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
