import { useState, useEffect } from 'react';
import {
  useAdminPlates, useDeletePlate, useUpdatePlateStatus,
  useUpdatePlateVisibility, useUpdatePlate, useCreatePlate,
  useBulkCreatePlate, useUploadImage, useAdminPlate,
} from '../../services/adminPlates.js';
import { useAdminCategories } from '../../services/categories.js';
import { Select, IconButton, SearchField } from '../../components/index.jsx';
import PlateVisual from '../../components/PlateVisual.jsx';
import Button from '../../components/Button.jsx';

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
];

const INITIAL_FORM = {
  plateNumber: '', plateTypeId: '', provinceId: '', vehicleTypeId: '',
  price: '', priceOnRequest: false, isHot: false,
  description: '', fengShuiMeaning: '', images: [],
};

const fmt = (n) => (n == null ? '—' : n.toLocaleString('vi-VN') + 'đ');
const num = (v) => Number(String(v ?? '').replace(/[^\d]/g, '') || 0);

const ERR_MSG = {
  DUPLICATE: 'Trùng biển',
  INVALID_PROVINCE: 'Sai tỉnh',
  EMPTY: 'Bỏ trống',
};

export default function AdminPlates({ go, notify }) {
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

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

  const filters = { status, keyword, page, perPage: 20 };
  const { data, isLoading } = useAdminPlates(filters);
  const plates = data?.items || [];
  const total = data?.total || 0;

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
      });
    }
  }, [editDetail]); // ponytail: runs once when detail arrives; editId/editPlateId stable at this point

  const setF = (k) => (v) => setForm((f) => ({ ...f, [k]: v && v.target ? v.target.value : v }));

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const result = await uploadMut.mutateAsync(file);
      setForm((f) => ({ ...f, images: [...f.images, result.url] }));
      notify('Đã tải ảnh lên');
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
    setFormErr(errs);
    if (Object.keys(errs).length) return;

    const body = {
      plateNumber: form.plateNumber.trim(),
      plateTypeId: form.plateTypeId,
      provinceId: form.provinceId,
      vehicleTypeId: form.vehicleTypeId,
      price: form.priceOnRequest ? 0 : Number(form.price || '0'),
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
      notify('Đã xóa biển số');
    } catch (err) {
      notify(err.message || 'Lỗi xóa biển số');
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
    updateMut.mutate({ id: p.id, body: { price, priceOnRequest: false } });
    setCell(null);
  };

  const toggleHot = (p) => updateMut.mutate({ id: p.id, body: { isHot: !p.isHot } });

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
          <span style={{ flex: '1 1 150px' }}>Biển số</span>
          <span style={{ flex: '1 1 90px' }}>Loại</span>
          <span style={{ flex: '1 1 90px' }}>Tỉnh</span>
          <span style={{ flex: '1 1 130px' }}>Giá (bấm sửa)</span>
          <span style={{ flex: '1 1 90px' }}>Trạng thái</span>
          <span style={{ flex: '1 1 60px' }}>HOT</span>
          <span style={{ flex: '1 1 70px' }}>Hiển thị</span>
          <span style={{ flex: '0 0 80px' }}>Thao tác</span>
        </div>

        {isLoading && <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải…</div>}

        {!isLoading && plates.map((p) => {
          const parsed = parsePlateNumber(p.plateNumber);
          return (
            <div key={p.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-2) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <span style={{ flex: '1 1 150px' }}>
                <PlateVisual size="sm" prov={parsed.prov} seri={parsed.seri} num={parsed.num} />
              </span>
              <span style={{ flex: '1 1 90px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.plateTypeName}</span>
              <span style={{ flex: '1 1 90px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.provinceName}</span>
              <span style={{ flex: '1 1 130px' }}>{renderCell(p, 'price')}</span>
              <span style={{ flex: '1 1 90px' }}>
                <select value={p.status} onChange={(e) => statusMut.mutate({ id: p.id, status: e.target.value })}
                  style={{ border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', font: 'var(--type-caption)', color: 'var(--text-body)', outline: 'none', cursor: 'pointer' }}>
                  <option value="available">Còn hàng</option>
                  <option value="sold">Đã bán</option>
                </select>
              </span>
              <span style={{ flex: '1 1 60px' }}>
                <button type="button" onClick={() => toggleHot(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: p.isHot ? 'var(--action-primary)' : 'var(--text-muted)' }}>
                  {p.isHot ? '🔥 HOT' : 'Bình thường'}
                </button>
              </span>
              <span style={{ flex: '1 1 70px' }}>
                <button type="button" onClick={() => visMut.mutate({ id: p.id, visible: !p.visible })} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: p.visible ? 'var(--mint-700)' : 'var(--text-muted)' }}>
                  {p.visible ? '👁 Hiện' : '— Ẩn'}
                </button>
              </span>
              <span style={{ flex: '0 0 80px', display: 'flex', gap: 'var(--space-2)' }}>
                <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEdit(p)} />
                <IconButton name="trash-2" label="Xóa" size="sm" onClick={() => setConfirmDelete(p.id)} />
              </span>
            </div>
          );
        })}
        </div>
        </div>

        {!isLoading && plates.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có biển số nào khớp tìm kiếm.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} type="button" onClick={() => setPage(i + 1)}
              style={{ minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-caption)',
                background: page === i + 1 ? 'var(--action-primary)' : 'var(--surface-sunken)',
                color: page === i + 1 ? 'var(--white)' : 'var(--text-body)' }}>
              {i + 1}
            </button>
          ))}
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

      {/* Confirm delete */}
      {!!confirmDelete && (
        <div role="alertdialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div style={{ width: '100%', maxWidth: 380, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Xác nhận xóa</h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Xóa biển số này khỏi hệ thống? Hành động này không thể hoàn tác.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="md" onClick={() => setConfirmDelete(null)}>Hủy</Button>
              <Button variant="primary" size="md" onClick={handleDelete} style={{ background: 'var(--status-danger)', boxShadow: '0 8px 20px rgba(229,72,77,.26)' }}>Xóa</Button>
            </div>
          </div>
        </div>
      )}
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
    if (e?.target?.files?.[0]) {
      onUpload(e.target.files[0]);
      e.target.value = '';
    }
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
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 18px', overflow: 'auto', animation: 'fadeIn 140ms var(--ease-out)' }}>
      <div style={{ width: '100%', maxWidth: 560, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>
              {editDetail ? 'Sửa biển số' : 'Thêm biển số'}
            </h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              {editDetail ? 'Cập nhật thông tin biển đang bán.' : 'Biển sẽ xuất hiện ở đầu bảng và trang chủ.'}
            </p>
          </div>
          <IconButton name="x" label="Đóng" onClick={onClose} />
        </div>

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
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Giá liên hệ</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isHot} onChange={(e) => setF('isHot')(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Biển HOT</span>
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
            {form.images.map((url, i) => (
              <div key={url} style={{ position: 'relative', width: 72, height: 72, borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-inset-hairline)' }}>
                <img src={url} alt={`Ảnh ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => onRemoveImage(url)}
                  style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.55)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✕</button>
              </div>
            ))}
            <label style={{ width: 72, height: 72, borderRadius: 'var(--radius-md)', border: '2px dashed var(--grey-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', font: 'var(--type-caption)' }}>
              {uploading ? '…' : '+ Ảnh'}
              <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={fileRef} />
            </label>
          </div>
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
    </div>
  );
}
