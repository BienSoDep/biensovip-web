import { useState, useEffect } from 'react';
import {
  useMeaningTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate,
  usePlateMeanings, useCreatePlateMeaning, useUpdatePlateMeaning, useDeletePlateMeaning, useReseedPlateMeanings,
} from '../../services/meanings.js';
import { useAdminPlates } from '../../services/adminPlates.js';
import { Select, SearchField, IconButton, Switch, InfoTip } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';

const CATEGORIES = [
  { value: 'plate_type', label: 'Kiểu biển' },
  { value: 'digit', label: 'Ý nghĩa số' },
  { value: 'series', label: 'Dãy số / Nút' },
  { value: 'general', label: 'Chung' },
];

const PLATE_CATEGORIES = [
  { value: 'plate_type', label: 'Kiểu biển' },
  { value: 'digit', label: 'Ý nghĩa số' },
  { value: 'series', label: 'Dãy số / Nút' },
  { value: 'general', label: 'Chung' },
  { value: 'custom', label: 'Tùy chỉnh' },
];

const catLabel = (v) => (CATEGORIES.find((c) => c.value === v) || PLATE_CATEGORIES.find((c) => c.value === v) || {}).label || v;

const EMPTY_TEMPLATE = { category: 'plate_type', key: '', title: '', content: '', active: true, sortOrder: 0 };
const EMPTY_MEANING = { category: 'plate_type', title: '', content: '', sortOrder: 0 };

const fieldWrap = { display: 'flex', flexDirection: 'column', gap: 6 };
const fieldLbl = { font: 'var(--type-label)', color: 'var(--text-strong)' };
const fieldInput = { minHeight: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '10px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none', resize: 'vertical' };
const modalCard = { width: '100%', maxWidth: 560, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' };
const overlayStyle = { position: 'fixed', inset: 0, zIndex: 90, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 18px', overflow: 'auto', animation: 'fadeIn 140ms var(--ease-out)' };

export default function AdminMeanings({ notify }) {
  const [tab, setTab] = useState('templates');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {[['templates', 'Mẫu chung'], ['plates', 'Theo từng biển']].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setTab(v)}
            style={{ height: 36, padding: '0 16px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
              background: tab === v ? 'var(--action-dark)' : 'var(--surface-muted)',
              color: tab === v ? 'var(--white)' : 'var(--text-body)', font: 'var(--type-body-sm)' }}>{l}</button>
        ))}
      </div>
      {tab === 'templates' ? <TemplatesTab notify={notify} /> : <PlatesTab notify={notify} />}
    </div>
  );
}

/* ============ Tab 1: Mẫu chung (MeaningTemplate CRUD) ============ */

function TemplatesTab({ notify }) {
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | template object
  const [form, setForm] = useState(EMPTY_TEMPLATE);
  const [formErr, setFormErr] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, isLoading, isError } = useMeaningTemplates({ category: category || undefined, keyword: keyword || undefined });
  const items = data?.items || [];

  const createMut = useCreateTemplate();
  const updateMut = useUpdateTemplate();
  const deleteMut = useDeleteTemplate();

  const openAdd = () => { setEditing('new'); setForm(EMPTY_TEMPLATE); setFormErr({}); };
  const openEdit = (t) => { setEditing(t); setForm({ category: t.category, key: t.key, title: t.title, content: t.content, active: t.active, sortOrder: t.sortOrder }); setFormErr({}); };

  const save = () => {
    const errs = {};
    if (!form.key.trim()) errs.key = 'Nhập key';
    if (!form.title.trim()) errs.title = 'Nhập tiêu đề';
    if (!form.content.trim()) errs.content = 'Nhập nội dung';
    setFormErr(errs);
    if (Object.keys(errs).length) return;

    const body = { ...form, key: form.key.trim(), title: form.title.trim(), content: form.content.trim(), sortOrder: Number(form.sortOrder) || 0 };
    const done = () => { setEditing(null); notify(editing === 'new' ? 'Đã thêm mẫu' : 'Đã cập nhật mẫu'); };
    const err = (e) => {
      if (e.code === 'DUPLICATE_TEMPLATE') setFormErr({ key: 'Mẫu với loại + key này đã tồn tại.' });
      else if (e.code === 'INVALID_CATEGORY') setFormErr({ category: 'Loại ý nghĩa không hợp lệ.' });
      else notify(e.message || 'Lỗi lưu mẫu.');
    };
    if (editing === 'new') createMut.mutate(body, { onSuccess: done, onError: err });
    else updateMut.mutate({ id: editing.id, body }, { onSuccess: done, onError: err });
  };

  const remove = () => {
    deleteMut.mutate(confirmDelete.id, {
      onSuccess: () => { setConfirmDelete(null); notify('Đã xóa mẫu'); },
      onError: (e) => notify(e.message || 'Xóa thất bại.'),
    });
  };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
        <Select label="Loại ý nghĩa" value={category} style={{ width: 200 }}
          options={[{ value: '', label: 'Tất cả' }, ...CATEGORIES]} onChange={setCategory} />
        <SearchField placeholder="Tìm tiêu đề / nội dung…" value={keyword} onChange={(e) => setKeyword(e.target.value)} width={240} />
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="md" onClick={openAdd}>Thêm mẫu</Button>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        {isLoading && <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải…</div>}
        {isError && <div style={{ padding: 48, textAlign: 'center', color: 'var(--status-danger)' }}>Không tải được danh sách mẫu.</div>}
        {!isLoading && !isError && items.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có mẫu nào. Thêm mẫu hoặc kiểm tra bộ lọc.</div>
        )}
        {items.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
            <span style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{t.title}</div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'pre-line' }}>{t.content}</div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 8 }}>{catLabel(t.category)} · <code>{t.key}</code> · thứ tự {t.sortOrder}</div>
            </span>
            <span style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
              <Switch checked={t.active} onChange={() => updateMut.mutate({ id: t.id, body: { active: !t.active } }, { onError: (e) => notify(e.message || 'Lỗi cập nhật.') })} label="Kích hoạt" />
              <span style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <IconButton name="pencil" label="Sửa mẫu" size="sm" onClick={() => openEdit(t)} />
                <IconButton name="trash-2" label="Xóa mẫu" size="sm" onClick={() => setConfirmDelete(t)} />
              </span>
            </span>
          </div>
        ))}
      </div>

      {editing != null && (
        <TemplateModal form={form} editId={editing === 'new' ? 'new' : editing.id} formErr={formErr}
          saving={createMut.isPending || updateMut.isPending}
          onSet={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
          onSave={save} onClose={() => setEditing(null)} />
      )}
      {!!confirmDelete && (
        <ConfirmModal title="Xác nhận xóa mẫu"
          message="Xóa mẫu này? Ý nghĩa đang gắn vào biển đã sinh sẽ không bị ảnh hưởng." onCancel={() => setConfirmDelete(null)} onConfirm={remove} />
      )}
    </>
  );
}

function TemplateModal({ form, editId, formErr, saving, onSet, onSave, onClose }) {
  return (
    <div role="dialog" aria-modal="true" style={overlayStyle}>
      <div style={modalCard}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>{editId === 'new' ? 'Thêm mẫu ý nghĩa' : 'Sửa mẫu ý nghĩa'}</h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Mẫu dùng chung — sửa ở đây KHÔNG ảnh hưởng biển đã seed.</p>
          </div>
          <IconButton name="x" label="Đóng" onClick={onClose} />
        </div>

        <Select label="Loại" value={form.category} options={CATEGORIES}
          onChange={(v) => onSet('category', v)} style={{ flex: 1 }} />
        <label style={fieldWrap}>
          <span style={fieldLbl}>Key (mã) <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>— thuật toán dò theo key</span></span>
          <input type="text" placeholder="plate_type:tu_quy_8888" value={form.key} onChange={(e) => onSet('key', e.target.value)} style={{ ...fieldInput, height: 40, padding: '0 14px' }} />
          {formErr.key && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{formErr.key}</span>}
        </label>
        <label style={fieldWrap}>
          <span style={fieldLbl}>Tiêu đề</span>
          <input type="text" placeholder="Tứ quý 8888" value={form.title} onChange={(e) => onSet('title', e.target.value)} style={{ ...fieldInput, height: 40, padding: '0 14px' }} />
          {formErr.title && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{formErr.title}</span>}
        </label>
        <label style={fieldWrap}>
          <span style={fieldLbl}>Nội dung</span>
          <textarea rows={4} placeholder="Mô tả ý nghĩa…" value={form.content} onChange={(e) => onSet('content', e.target.value)} style={fieldInput} />
          {formErr.content && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{formErr.content}</span>}
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
          <label style={fieldWrap}>
            <span style={{ ...fieldLbl, display: 'inline-flex', alignItems: 'center', gap: 6 }}>Thứ tự<InfoTip size={12} text="Thứ tự hiển thị mẫu trên trang biển. Số nhỏ hiện trước. Mẫu chỉ hiện nếu bật Kích hoạt." /></span>
            <input type="number" value={form.sortOrder} onChange={(e) => onSet('sortOrder', e.target.value)} style={{ ...fieldInput, height: 40, padding: '0 14px', width: 120 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.active} onChange={(e) => onSet('active', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Kích hoạt (dùng để seed)</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="md" onClick={onClose}>Hủy</Button>
          <Button variant="primary" size="md" onClick={onSave} disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu mẫu'}</Button>
        </div>
      </div>
    </div>
  );
}

/* ============ Tab 2: Theo từng biển (PlateMeaning CRUD + reseed) ============ */

function PlatesTab({ notify }) {
  const [plateKeyword, setPlateKeyword] = useState('');
  const [plate, setPlate] = useState(null);   // selected plate { id, plateNumber }
  const [editing, setEditing] = useState(null); // null | 'new' | meaning
  const [form, setForm] = useState(EMPTY_MEANING);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: plateData, isLoading: plateLoading } = useAdminPlates({ keyword: plateKeyword, status: 'all', page: 1, perPage: 20 });
  const plates = (plateData?.items || []).filter((p) => p.id);

  const { data: meaningsData, isLoading: meaningsLoading } = usePlateMeanings(plate?.id);
  const meanings = meaningsData?.items || [];

  const createMut = useCreatePlateMeaning(plate?.id);
  const updateMut = useUpdatePlateMeaning(plate?.id);
  const deleteMut = useDeletePlateMeaning(plate?.id);
  const reseedMut = useReseedPlateMeanings(plate?.id);

  useEffect(() => {
    if (!plate) return;
    if (!plates.length || !plates.some((p) => p.id === plate.id)) {
      if (plateKeyword.trim() && !plateLoading) setPlate(null);
    }
  }, [plates, plateKeyword, plateLoading, plate]);

  const openAdd = () => { setEditing('new'); setForm(EMPTY_MEANING); };
  const openEdit = (m) => { setEditing(m); setForm({ category: m.category, title: m.title || '', content: m.content, sortOrder: m.sortOrder }); };

  const save = () => {
    if (!form.content.trim()) { notify('Nội dung không được để trống.'); return; }
    const body = { category: form.category, title: form.title?.trim() || null, content: form.content.trim(), sortOrder: Number(form.sortOrder) || 0 };
    const done = () => { setEditing(null); notify(editing === 'new' ? 'Đã thêm ý nghĩa' : 'Đã cập nhật ý nghĩa'); };
    const err = (e) => notify(e.message || 'Lỗi lưu ý nghĩa.');
    if (editing === 'new') createMut.mutate(body, { onSuccess: done, onError: err });
    else updateMut.mutate({ id: editing.id, body }, { onSuccess: done, onError: err });
  };

  const remove = () => {
    deleteMut.mutate(confirmDelete.id, {
      onSuccess: () => { setConfirmDelete(null); notify('Đã xóa ý nghĩa'); },
      onError: (e) => notify(e.message || 'Xóa thất bại.'),
    });
  };

  const reseed = () => {
    if (!plate) return;
    reseedMut.mutate({ plateNumber: plate.plateNumber }, {
      onSuccess: () => notify('Đã sinh lại ý nghĩa từ mẫu đang kích hoạt'),
      onError: (e) => notify(e.message || 'Sinh lại thất bại.'),
    });
  };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
        <SearchField placeholder="Tìm biển số (VD 43A1-999.99)…" value={plateKeyword} onChange={(e) => setPlateKeyword(e.target.value)} width={260} />
        {plate && <Button variant="ghost" size="sm" onClick={() => { setPlate(null); setPlateKeyword(''); }}>Bỏ chọn</Button>}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Biển số</div>
          {plateLoading && plateKeyword && <div style={{ padding: 'var(--space-4) var(--gutter-card)', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>Đang tìm…</div>}
          {!plateLoading && plateKeyword.trim() && plates.length === 0 && <div style={{ padding: 'var(--space-4) var(--gutter-card)', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>Không tìm thấy biển.</div>}
          {!plateKeyword.trim() && <div style={{ padding: 'var(--space-4) var(--gutter-card)', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>Gõ biển số để tìm.</div>}
          {plates.map((p) => (
            <button key={p.id} type="button" onClick={() => setPlate({ id: p.id, plateNumber: p.plateNumber })}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--gutter-card)', background: plate?.id === p.id ? 'var(--surface-sunken)' : 'none', border: 'none', borderBottom: '1px solid var(--grey-100)', cursor: 'pointer', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
              {p.plateNumber}
            </button>
          ))}
        </div>

        <div style={{ flex: '1 1 440px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {!plate ? (
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>
              Chọn một biển số để quản lý ý nghĩa riêng của nó.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{plate.plateNumber}</span>
                <div style={{ flex: 1 }} />
                <Button variant="ghost" size="sm" onClick={reseed} disabled={reseedMut.isPending}>{reseedMut.isPending ? 'Đang sinh…' : 'Sinh lại từ mẫu'}</Button>
                <Button variant="primary" size="sm" onClick={openAdd}>Thêm ý nghĩa</Button>
              </div>

              {meaningsLoading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải…</div>}
              {!meaningsLoading && meanings.length === 0 && (
                <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>
                  Biển chưa có ý nghĩa nào. Bấm "Sinh lại từ mẫu" để tự tạo theo thuật toán, hoặc thêm tay.
                </div>
              )}
              {meanings.map((m) => (
                <div key={m.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-4) var(--gutter-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {m.title && <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{m.title}</div>}
                      <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', marginTop: m.title ? 4 : 0, whiteSpace: 'pre-line' }}>{m.content}</div>
                      <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 8 }}>{catLabel(m.category)} · thứ tự {m.sortOrder}</div>
                    </span>
                    <span style={{ display: 'flex', gap: 'var(--space-2)', flex: '0 0 auto' }}>
                      <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEdit(m)} />
                      <IconButton name="trash-2" label="Xóa" size="sm" onClick={() => setConfirmDelete(m)} />
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {editing != null && (
        <MeaningModal form={form} editId={editing === 'new' ? 'new' : editing.id} saving={createMut.isPending || updateMut.isPending}
          onSet={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
          onSave={save} onClose={() => setEditing(null)} />
      )}
      {!!confirmDelete && (
        <ConfirmModal title="Xóa ý nghĩa?" onCancel={() => setConfirmDelete(null)} onConfirm={remove} message="Xóa phần ý nghĩa này riêng cho biển đã chọn." />
      )}
    </>
  );
}

function MeaningModal({ form, editId, saving, onSet, onSave, onClose }) {
  return (
    <div role="dialog" aria-modal="true" style={overlayStyle}>
      <div style={modalCard}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>{editId === 'new' ? 'Thêm ý nghĩa' : 'Sửa ý nghĩa'}</h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chỉ áp dụng cho biển đang chọn — không ảnh hưởng biển khác.</p>
          </div>
          <IconButton name="x" label="Đóng" onClick={onClose} />
        </div>

        <Select label="Loại" value={form.category} options={PLATE_CATEGORIES} onChange={(v) => onSet('category', v)} style={{ flex: 1 }} />
        <label style={fieldWrap}>
          <span style={fieldLbl}>Tiêu đề <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(bỏ trống nếu không cần)</span></span>
          <input type="text" placeholder="VD: Tứ quý 8888" value={form.title} onChange={(e) => onSet('title', e.target.value)} style={{ ...fieldInput, height: 40, padding: '0 14px' }} />
        </label>
        <label style={fieldWrap}>
          <span style={fieldLbl}>Nội dung</span>
          <textarea rows={4} placeholder="Mô tả ý nghĩa của phần này…" value={form.content} onChange={(e) => onSet('content', e.target.value)} style={fieldInput} />
        </label>
        <label style={fieldWrap}>
          <span style={{ ...fieldLbl, display: 'inline-flex', alignItems: 'center', gap: 6 }}>Thứ tự hiển thị<InfoTip size={12} text="Vị trí phần ý nghĩa này trong khối phong thủy của biển. Số nhỏ hiện trước." /></span>
          <input type="number" value={form.sortOrder} onChange={(e) => onSet('sortOrder', e.target.value)} style={{ ...fieldInput, height: 40, padding: '0 14px', width: 120 }} />
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="md" onClick={onClose}>Hủy</Button>
          <Button variant="primary" size="md" onClick={onSave} disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, onCancel, onConfirm }) {
  return (
    <div role="alertdialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 140ms var(--ease-out)' }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
        <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{title}</h2>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="md" onClick={onCancel}>Hủy</Button>
          <Button variant="primary" size="md" onClick={onConfirm} style={{ background: 'var(--status-danger)', boxShadow: '0 8px 20px rgba(229,72,77,.26)' }}>Xóa</Button>
        </div>
      </div>
    </div>
  );
}
