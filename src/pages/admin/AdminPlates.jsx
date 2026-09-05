import { useState, useEffect } from 'react';
import { CarFront, ArrowUpDown, ArrowUp, ArrowDown, TriangleAlert } from 'lucide-react';
import { useDebouncedValue } from '@mantine/hooks';
import toast from 'react-hot-toast';
import {
  useAdminPlates, useDeletePlate, useUpdatePlateStatus,
  useUpdatePlateVisibility, useUpdatePlate, useCreatePlate,
  useBulkCreatePlate, useUploadImage, useAdminPlate, checkPlateVersion, useRestorePlate,
} from '../../services/adminPlates.js';
import { useAdminCategories } from '../../services/categories.js';
import { Select, IconButton, SearchField, InfoTip } from '../../components/index.jsx';
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

// --- Tự động điền (auto-fill) — suy Tỉnh/Loại biển/Loại xe/Ý nghĩa từ biển số vừa gõ.
// options là catOpts(list) = {value,label,code}; label = tên category. Không khớp → '' (admin chọn tay).
const OTO_LETTERS = 'ABCDFHMNPTV';
function allSame(series, k) { return !!series && series.length >= k && new Set(series.slice(-k)).size === 1; }
function detectPlateTypeId(serial, plateTypes) {
  const byName = (n) => (plateTypes.find((o) => (o.label || '').toLowerCase().includes(n)) || {}).value || '';
  if (!serial) return '';
  if (allSame(serial, 5)) return byName('ngũ quý');
  if (allSame(serial, 4)) return byName('tứ quý');
  if (allSame(serial, 3)) return byName('tam hoa');
  const last2 = serial.slice(-2);
  if (last2 === '68' || last2 === '86') return byName('lộc phát');
  if (last2 === '39' || last2 === '79') return byName('thần tài');
  for (let i = 0; i + 2 < serial.length; i++) {
    const a = +serial[i], b = +serial[i + 1], c = +serial[i + 2];
    if (a && a + 1 === b && b + 1 === c) return byName('sảnh tiến');
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

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'available', label: 'Còn hàng' },
  { value: 'sold', label: 'Đã bán' },
];

const INITIAL_FORM = {
  plateNumber: '', plateTypeId: '', provinceId: '', vehicleTypeId: '',
  price: '', costPrice: '', priceOnRequest: false, isHot: false,
  description: '', fengShuiMeaning: '', images: [],
};

const fmt = (n) => (n == null ? '—' : n.toLocaleString('vi-VN') + 'đ');
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

export default function AdminPlates({ go, notify, st }) {
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const { exportCsv, loading: exporting } = useExportCsv('/api/admin/plates');
  const [sort, setSort] = useState(null); // { key, dir: 'asc' | 'desc' }
  const [debouncedKeyword] = useDebouncedValue(keyword, 250);

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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkRows, setBulkRows] = useState([]);
  // Inline edit cell: { id, field, value }
  const [cell, setCell] = useState(null);
  // Bulk selection: Set of plate ids on current page
  const [selected, setSelected] = useState(new Set());

  const filters = { status, keyword: debouncedKeyword, page, perPage: 20, ...(fromDate && { fromDate }), ...(toDate && { toDate }), ...(sort && { sortBy: sort.key, sortDir: sort.dir }) };
  const { data, isLoading } = useAdminPlates(filters);
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
      notify(err.message || 'Lỗi tải ảnh');
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
    setSelected(new Set());
    notify(`Đã cập nhật trạng thái ${ok} biển`);
  };

  const bulkDelete = async () => {
    const ids = plates.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (!ids.length) return;
    const results = await Promise.allSettled(ids.map((id) => deleteMut.mutateAsync(id)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const okIds = ids.filter((_, i) => results[i].status === 'fulfilled');
    setSelected(new Set());
    setConfirmBulkDelete(false);
    undoToast(ok, okIds);
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

  // ── Quick-add & batch-in-grid: tạo 1 biển qua bulk(1) → server tự detect tỉnh/xe/loại biển
  const quickCreate = async (number, price) => {
    const n = (number || '').trim();
    if (!n || !/-\d/.test(n)) { notify('Nhập biển số hợp lệ (VD: 43A1-999.99)'); return false; }
    try {
      const res = await bulkMut.mutateAsync([{ plateNumber: n, price: num(price), isHot: false, priceOnRequest: false }]);
      if (res[0]?.success) { notify(`Đã thêm ${n}`); return true; }
      notify(ERR_MSG[res[0]?.error] || 'Không thêm được biển');
      return false;
    } catch (err) {
      notify(err.message || 'Lỗi thêm biển');
      return false;
    }
  };

  const quickAdd = async () => {
    const ok = await quickCreate(quickNum, quickPrice);
    if (ok) { setQuickNum(''); setQuickPrice(''); }
  };

  // ── Paste / CSV: parse từng dòng "số biển,giá" → preview xanh/đỏ
  const parseLine = (line) => {
    const parts = line.split(/[,;\t ]+/).filter(Boolean);
    if (parts.length === 0) return null;
    const number = parts[0].trim();
    const price = num(parts[1]);
    const prov = parsePlateNumber(number).prov;
    return { number, price, provName: prov ? provNameOf(prov) : '', ok: /-\d/.test(number), reason: /-\d/.test(number) ? '' : 'Sai định dạng' };
  };

  const onBulkTextChange = (v) => {
    setBulkText(v);
    setBulkRows(v.split('\n').map(parseLine).filter(Boolean).map((r, i) => ({ key: i, done: false, ...r })));
  };

  const submitBulk = async () => {
    const valid = bulkRows.filter((r) => r.ok && !r.done);
    if (valid.length === 0) { notify('Không có dòng hợp lệ để thêm'); return; }
    try {
      const results = await bulkMut.mutateAsync(valid.map((r) => ({ plateNumber: r.number, price: r.price, isHot: false, priceOnRequest: false })));
      setBulkRows((rows) => rows.map((r) => {
        const res = results.find((x) => x.plateNumber === r.number);
        return res ? { ...r, done: true, ok: res.success, reason: res.success ? '' : (ERR_MSG[res.error] || 'Lỗi') } : r;
      }));
      const okCount = results.filter((r) => r.success).length;
      notify(`Đã thêm ${okCount}/${valid.length} biển`);
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

  const totalPages = Math.max(1, Math.ceil(total / 20));

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
        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="md" disabled={exporting} onClick={() => exportCsv({ status, keyword: debouncedKeyword, ...(fromDate && { fromDate }), ...(toDate && { toDate }) }).catch((e) => notify(e.message))}>
          {exporting ? 'Đang xuất…' : 'Xuất CSV'}
        </Button>
        <Button variant="primary" size="md" onClick={openAdd}>Thêm biển số (đầy đủ)</Button>
      </div>

      {/* Quick-add bar */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', flex: '0 0 auto' }}>Thêm nhanh</span>
          {inputCell(quickNum, setQuickNum, '43A1-999.99')}
          {inputCell(quickPrice, setQuickPrice, 'Giá (VNĐ)')}
          <Button variant="primary" size="md" onClick={quickAdd} disabled={bulkMut.isPending}>{bulkMut.isPending ? 'Đang thêm…' : 'Thêm'}</Button>
          <Button variant="ghost" size="md" onClick={() => setBulkOpen(!bulkOpen)}>{bulkOpen ? 'Đóng dán nhiều' : 'Dán nhiều / CSV'}</Button>
        </div>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Gõ biển số + giá rồi bấm Thêm. Hệ thống tự nhận tỉnh & loại xe từ số biển.</span>

        {bulkOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <textarea value={bulkText} onChange={(e) => onBulkTextChange(e.target.value)} rows={5}
              placeholder={'Mỗi dòng 1 biển, cách nhau bằng dấu phẩy / tab:\n43A1-999.99, 350000000\n43A1-666.66, 500000000'}
              style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none', fontFamily: 'monospace' }} />
            {bulkRows.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflow: 'auto' }}>
                {bulkRows.map((r) => (
                  <div key={r.key} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: r.done ? (r.ok ? 'var(--mint-100)' : 'var(--rose-100)') : 'transparent', font: 'var(--type-body-sm)' }}>
                    <span style={{ color: 'var(--text-strong)', flex: '1 1 160px' }}>{r.number || '—'}</span>
                    <span style={{ color: 'var(--text-muted)', flex: '1 1 120px' }}>{r.provName || '…'}</span>
                    <span style={{ color: 'var(--text-muted)', flex: '1 1 100px' }}>{r.price ? fmt(r.price) : '0'}</span>
                    <span style={{ color: r.ok ? 'var(--mint-700)' : 'var(--status-danger)', flex: '0 0 130px', textAlign: 'right' }}>
                      {r.done ? (r.ok ? '✓ Đã thêm' : `✗ ${r.reason}`) : (r.ok ? 'Sẵn sàng' : r.reason || 'Bỏ trống')}
                    </span>
                  </div>
                ))}
              </div>
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
        <div style={{ minWidth: 900 }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '0 0 34px' }}>
            <input type="checkbox" aria-label="Chọn tất cả" checked={allSelected} onChange={toggleAll}
              ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
              style={{ width: 16, height: 16, accentColor: 'var(--action-primary)', cursor: 'pointer' }} />
          </span>
          <span style={{ flex: '0 0 56px' }}>Ảnh</span>
          <SortHeader label="Biển số" sortKey="plateNumber" style={{ flex: '1 1 120px' }} />
          <SortHeader label="Loại biển" sortKey="plateTypeName" style={{ flex: '1 1 88px' }} />
          <span style={{ flex: '1 1 88px' }}>Loại xe</span>
          <SortHeader label="Tỉnh" sortKey="provinceName" style={{ flex: '1 1 88px' }} />
          <SortHeader label="Giá (bấm sửa)" sortKey="price" style={{ flex: '1 1 110px' }} />
          <span className="plate-col-new" style={{ flex: '0 0 48px' }}>Mới</span>
          <span style={{ flex: '1 1 100px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Trạng thái<InfoTip size={12} text="Trạng thái biển: Còn hàng = đang bán; Đã bán = chốt giao dịch; Hết hạn = biển đấu giá quá hạn, tự ẩn khỏi trang." /></span>
          <SortHeader label="Cập nhật" sortKey="updatedAt" className="plate-col-updated" style={{ flex: '1 1 96px' }} />
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
              <span style={{ flex: '1 1 120px', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.plateNumber}</span>
              <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.plateTypeName}</span>
              <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.vehicleTypeName}</span>
              <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.provinceName}</span>
              <span style={{ flex: '1 1 110px' }}>{renderCell(p, 'price')}</span>
              <span className="plate-col-new" style={{ flex: '0 0 48px' }}>
                {isNewPlate(p) ? (
                  <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--mint-100)', color: 'var(--mint-700)', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)' }}>Mới</span>
                ) : (
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>—</span>
                )}
              </span>
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
              <span className="plate-col-updated" style={{ flex: '1 1 96px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDate(p.updatedAt)}</span>
              <span style={{ flex: '0 0 104px', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEdit(p)} />
                <IconButton name="trash-2" label="Xóa" size="sm" onClick={() => setConfirmDelete(p.id)} />
                <AuditHistoryButton entityType="plate" entityId={p.id} />
              </span>
            </div>
          );
        })}
        </div>
        </div>

        {!isLoading && plates.length === 0 && (status !== 'all' || keyword) && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có biển số nào khớp bộ lọc.</div>
        )}
        {!isLoading && plates.length === 0 && status === 'all' && !keyword && (
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
          <Select label="Loại biển" value={form.plateTypeId} options={plateTypes} onChange={(v) => { setF('plateTypeId')(v); blurValidateField('plateTypeId', v)(); }} style={{ flex: '1 1 140px' }} />
          <Select label="Tỉnh/thành" value={form.provinceId} options={provinces} onChange={(v) => { setF('provinceId')(v); blurValidateField('provinceId', v)(); }} style={{ flex: '1 1 140px' }} />
          <Select label="Loại xe" value={form.vehicleTypeId} options={vehicleTypes} onChange={(v) => { setF('vehicleTypeId')(v); blurValidateField('vehicleTypeId', v)(); }} style={{ flex: '1 1 140px' }} />
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
