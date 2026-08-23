import { useState, useEffect } from 'react';
import { CarFront, ArrowUpDown, ArrowUp, ArrowDown, TriangleAlert } from 'lucide-react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  useAdminPlates, useDeletePlate, useUpdatePlateStatus,
  useUpdatePlateVisibility, useUpdatePlate, useCreatePlate,
  useBulkCreatePlate, useUploadImage, useAdminPlate,
} from '../../services/adminPlates.js';
import { useAdminCategories } from '../../services/categories.js';
import { Select, IconButton, SearchField, InfoTip } from '../../components/index.jsx';
import PlateVisual from '../../components/PlateVisual.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import Drawer from '../../components/Drawer.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { formatDate } from '../../lib/date.js';

// Parse "43A1-999.99" → { prov, seri, num }
function parsePlateNumber(raw) {
  if (!raw) return { prov: '', seri: '', num: '' };
  const s = raw.trim();
  const idx = Math.max(s.lastIndexOf('-'), s.lastIndexOf(' '));
  if (idx < 0) return { prov: '', seri: '', num: s };
  const left = s.slice(0, idx).replace(/[\s-]/g, '');
  const num = s.slice(idx + 1).trim();
  const prov = left.match(/^\d{1,2}/)?.[0] || '';
  const seri = left.slice(prov.length);
  return { prov, seri, num };
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'available', label: 'Còn hàng' },
  { value: 'sold', label: 'Đã bán' },
  { value: 'inactive', label: 'Hết hạn đấu giá' },
];

const INITIAL_FORM = {
  plateNumber: '', plateTypeId: '', provinceId: '', vehicleTypeId: '',
  price: '', priceOnRequest: false, isHot: false,
  description: '', fengShuiMeaning: '', images: [],
  listingType: 'direct', auctionEndAt: '',
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

export default function AdminPlates({ go, notify }) {
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(null); // { key, dir: 'asc' | 'desc' }
  const [debouncedKeyword] = useDebouncedValue(keyword, 250);

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErr, setFormErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

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

  const filters = { status, keyword: debouncedKeyword, page, perPage: 20 };
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

  // Sắp xếp client-side trên trang đã load (admin list endpoint chưa hỗ trợ sort param).
  const sortedPlates = sort ? [...plates].sort((a, b) => {
    const k = sort.key;
    let av, bv;
    if (k === 'price') { av = Number(a.price) || 0; bv = Number(b.price) || 0; }
    else if (k === 'updatedAt') { av = a.updatedAt || ''; bv = b.updatedAt || ''; }
    else { av = a[k] || ''; bv = b[k] || ''; }
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv), 'vi');
    return sort.dir === 'asc' ? cmp : -cmp;
  }) : plates;

  const toggleSort = (key) => setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

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

  // Populate form when edit detail loads
  useEffect(() => {
    if (editDetail && editId && editId === editPlateId) {
      setForm({
        plateNumber: editDetail.plateNumber || '',
        plateTypeId: editDetail.plateTypeId || '',
        provinceId: editDetail.provinceId || '',
        vehicleTypeId: editDetail.vehicleTypeId || '',
        price: editDetail.priceOnRequest ? '' : String(editDetail.price || ''),
        priceOnRequest: editDetail.priceOnRequest || false,
        isHot: editDetail.isHot || false,
        description: editDetail.description || '',
        fengShuiMeaning: editDetail.fengShuiMeaning || '',
        images: (editDetail.images || []).map((img) => img.url),
        listingType: editDetail.listingType || 'direct',
        auctionEndAt: editDetail.auctionEndAt ? editDetail.auctionEndAt.slice(0, 16) : '',
      });
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

  const handleSave = async () => {
    const errs = {};
    if (!form.plateNumber.trim()) errs.plateNumber = 'Vui lòng nhập biển số';
    if (!form.plateTypeId) errs.plateTypeId = 'Chọn loại biển';
    if (!form.provinceId) errs.provinceId = 'Chọn tỉnh/thành';
    if (!form.vehicleTypeId) errs.vehicleTypeId = 'Chọn loại xe';
    if (form.listingType === 'auction' && !form.auctionEndAt) errs.auctionEndAt = 'Chọn hạn đấu giá';
    setFormErr(errs);
    if (Object.keys(errs).length) return;

    const body = {
      plateNumber: form.plateNumber.trim(),
      plateTypeId: form.plateTypeId,
      provinceId: form.provinceId,
      vehicleTypeId: form.vehicleTypeId,
      price: form.priceOnRequest ? 0 : num(form.price),
      priceOnRequest: form.priceOnRequest,
      isHot: form.isHot,
      description: form.description || null,
      fengShuiMeaning: form.fengShuiMeaning || null,
      images: form.images,
      listingType: form.listingType,
      auctionEndAt: form.listingType === 'auction' ? new Date(form.auctionEndAt).toISOString() : null,
    };

    setSaving(true);
    try {
      if (typeof editId === 'string' && editId === 'new') {
        await createMut.mutateAsync(body);
      } else {
        await updateMut.mutateAsync({ id: editId, body });
      }
      setEditId(null);
      setEditPlateId(null);
      setForm(INITIAL_FORM);
      notify(typeof editId === 'string' ? 'Đã thêm biển số mới' : 'Đã cập nhật biển số');
    } catch (err) {
      notify(err.message || 'Lỗi lưu biển số');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMut.mutateAsync(confirmDelete);
      setConfirmDelete(null);
      notify('Đã xóa (ẩn) biển số');
    } catch (err) {
      notify(err.message || 'Lỗi xóa biển số');
    }
  };

  const bulkStatus = async (status) => {
    const ids = plates.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (!ids.length) return;
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
    setSelected(new Set());
    notify(`Đã xóa ${ok} biển`);
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

  const SortHeader = ({ label, sortKey, style }) => (
    <button type="button" onClick={() => toggleSort(sortKey)}
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
        <div style={{ flex: 1 }} />
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
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
          <span style={{ flex: '0 0 48px' }}>Mới</span>
          <span style={{ flex: '1 1 100px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Trạng thái<InfoTip size={12} text="Trạng thái biển: Còn hàng = đang bán; Đã bán = chốt giao dịch; Hết hạn = biển đấu giá quá hạn, tự ẩn khỏi trang." /></span>
          <SortHeader label="Cập nhật" sortKey="updatedAt" style={{ flex: '1 1 96px' }} />
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
              <span style={{ flex: '0 0 48px' }}>
                {isNewPlate(p) ? (
                  <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--mint-100)', color: 'var(--mint-700)', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)' }}>Mới</span>
                ) : (
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>—</span>
                )}
              </span>
              <span style={{ flex: '1 1 100px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <select value={p.status} onChange={(e) => statusMut.mutate({ id: p.id, status: e.target.value }, {
                  onSuccess: () => notify(e.target.value === 'sold' ? 'Đã đánh dấu Đã bán' : e.target.value === 'inactive' ? 'Đã ẩn khỏi trang' : 'Đã đổi sang Còn hàng'),
                  onError: (err) => notify(err.message || 'Lỗi cập nhật trạng thái'),
                })}
                  style={{ border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', font: 'var(--type-caption)', color: 'var(--text-body)', outline: 'none', cursor: 'pointer' }}>
                  <option value="available">Còn hàng</option>
                  <option value="sold">Đã bán</option>
                  <option value="inactive">Hết hạn</option>
                </select>
                {p.listingType === 'auction' && (
                  <span style={{ font: 'var(--type-caption)', fontSize: 11, color: 'var(--text-muted)' }}>
                    Đấu giá · hạn {formatDate(p.auctionEndAt)}
                  </span>
                )}
              </span>
              <span style={{ flex: '1 1 96px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDate(p.updatedAt)}</span>
              <span style={{ flex: '0 0 80px', display: 'flex', gap: 'var(--space-2)' }}>
                <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEdit(p)} />
                <IconButton name="trash-2" label="Xóa" size="sm" onClick={() => setConfirmDelete(p.id)} />
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
          <button type="button" onClick={bulkDelete} style={{ border: 'none', background: 'var(--status-danger)', color: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '4px 12px', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', cursor: 'pointer' }}>Xóa</button>
        </div>
      )}

      {/* Modal: Add/Edit — only render when modal is open */}
      {editId != null && (
        <PlateFormModal
          form={form} setF={setF} formErr={formErr}
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
    </div>
  );
}

// ── Plate Form Modal ──

function PlateFormModal({
  form, setF, formErr, saving, uploading,
  plateTypes, provinces, vehicleTypes,
  editDetail, onPlateNumberChange, onSave, onUpload, onRemoveImage, onClose,
}) {
  const fileRef = (e) => {
    if (e?.target?.files?.length) {
      onUpload(e.target.files);
      e.target.value = '';
    }
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
          <input
            type="text" placeholder="43A1-999.99" value={form.plateNumber ?? ''}
            onChange={(e) => onPlateNumberChange(e.target.value)}
            style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)',
              boxShadow: formErr.plateNumber ? 'inset 0 0 0 1.5px var(--status-danger)' : 'var(--shadow-inset-hairline)',
              padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }}
          />
          {formErr.plateNumber && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{formErr.plateNumber}</span>}
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Select label="Loại biển" value={form.plateTypeId} options={plateTypes} onChange={setF('plateTypeId')} style={{ flex: '1 1 140px' }} />
          <Select label="Tỉnh/thành" value={form.provinceId} options={provinces} onChange={setF('provinceId')} style={{ flex: '1 1 140px' }} />
          <Select label="Loại xe" value={form.vehicleTypeId} options={vehicleTypes} onChange={setF('vehicleTypeId')} style={{ flex: '1 1 140px' }} />
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.priceOnRequest} onChange={(e) => setF('priceOnRequest')(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Giá liên hệ<InfoTip size={12} text="Không hiện giá công khai — khách phải gọi/Zalo để hỏi giá. Thường dùng cho biển đắt, giá nhạy cảm." /></span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isHot} onChange={(e) => setF('isHot')(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Biển HOT<InfoTip size={12} text="Đánh dấu biển đẹp/bán chạy để ưu tiên hiện lên đầu trang chủ và danh sách, gắn nhãn HOT." /></span>
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Kiểu đăng biển<InfoTip size={12} text="Cách đăng biển: Sở hữu trực tiếp = hiển thị vô hạn tới khi bán; Đấu giá trung gian = chỉ hiện tới hạn, quá hạn tự ẩn." /></span>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="listingType" checked={form.listingType === 'direct'} onChange={() => setF('listingType')('direct')} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Sở hữu trực tiếp (hiển thị vô hạn tới khi bán)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="listingType" checked={form.listingType === 'auction'} onChange={() => setF('listingType')('auction')} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Đấu giá trung gian (có hạn)</span>
            </label>
          </div>
          {form.listingType === 'auction' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 260 }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Hạn đấu giá — hết hạn tự ẩn khỏi trang, có thể đặt lại sau</span>
              <input
                type="datetime-local" value={form.auctionEndAt}
                onChange={setF('auctionEndAt')}
                style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)',
                  boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }}
              />
              {formErr.auctionEndAt && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{formErr.auctionEndAt}</span>}
            </label>
          )}
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
