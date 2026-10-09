import { useState, useEffect, useMemo } from 'react';
import {
  Compass, Hash, Layers, Sparkles, Plus, Pencil, Trash2,
  RotateCw, Search, X, CheckCircle2, Car, Eye, SlidersHorizontal,
  ChevronRight, RefreshCw, FileText
} from 'lucide-react';
import {
  useMeaningTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate,
  usePlateMeanings, useCreatePlateMeaning, useUpdatePlateMeaning, useDeletePlateMeaning, useReseedPlateMeanings,
  previewSeedPlateMeanings,
} from '../../services/meanings.js';
import { useAdminPlates } from '../../services/adminPlates.js';
import { Select, SearchField, Switch, InfoTip, Badge } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import Drawer from '../../components/Drawer.jsx';

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

const CATEGORY_STYLE = {
  plate_type: { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: 'rgba(59, 130, 246, 0.25)', label: 'Kiểu biển' },
  digit: { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: 'rgba(16, 185, 129, 0.25)', label: 'Ý nghĩa số' },
  series: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)', label: 'Dãy số / Nút' },
  general: { bg: 'rgba(107, 114, 128, 0.1)', color: '#4b5563', border: 'rgba(107, 114, 128, 0.25)', label: 'Chung' },
  custom: { bg: 'rgba(236, 72, 153, 0.1)', color: '#db2777', border: 'rgba(236, 72, 153, 0.25)', label: 'Tùy chỉnh' },
};

const catLabel = (v) => (CATEGORIES.find((c) => c.value === v) || PLATE_CATEGORIES.find((c) => c.value === v) || {}).label || v;

const EMPTY_TEMPLATE = { category: 'plate_type', key: '', title: '', content: '', active: true, sortOrder: 0 };
const EMPTY_MEANING = { category: 'plate_type', title: '', content: '', sortOrder: 0 };

const fieldWrap = { display: 'flex', flexDirection: 'column', gap: 6 };
const fieldLbl = { font: 'var(--type-label)', color: 'var(--text-strong)', fontWeight: 600 };
const fieldInput = { minHeight: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '10px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none', resize: 'vertical' };

export default function AdminMeanings({ notify, prefillKeyword }) {
  const [tab, setTab] = useState('templates');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Tab Navigation Navigation Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        padding: '6px 8px',
        background: 'var(--white)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)'
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'templates', label: 'Mẫu quy tắc chung', icon: Sparkles, desc: 'Dùng thuật toán tự động phân tích ý nghĩa' },
            { id: 'plates', label: 'Ý nghĩa theo biển số', icon: Compass, desc: 'Tùy biến hoặc xem phong thủy từng biển' },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'var(--action-dark)' : 'transparent',
                  color: active ? 'var(--white)' : 'var(--text-body)',
                  font: 'var(--type-body-sm)',
                  fontWeight: active ? '600' : '500',
                  transition: 'all 150ms ease',
                }}
              >
                <Icon size={16} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'templates' ? <TemplatesTab notify={notify} prefillKeyword={prefillKeyword} /> : <PlatesTab notify={notify} />}
    </div>
  );
}

/* ============ Tab 1: Mẫu chung (MeaningTemplate CRUD) ============ */

function TemplatesTab({ notify, prefillKeyword }) {
  const [category, setCategory] = useState(prefillKeyword ? 'plate_type' : '');
  const [keyword, setKeyword] = useState(prefillKeyword || '');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_TEMPLATE);
  const [formErr, setFormErr] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, isLoading, isError, refetch } = useMeaningTemplates({
    category: category || undefined,
    keyword: keyword || undefined,
  });
  const items = data?.items || [];

  const createMut = useCreateTemplate();
  const updateMut = useUpdateTemplate();
  const deleteMut = useDeleteTemplate();

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = items.length;
    const activeCount = items.filter((i) => i.active).length;
    const plateTypeCount = items.filter((i) => i.category === 'plate_type').length;
    const digitCount = items.filter((i) => i.category === 'digit').length;
    const seriesCount = items.filter((i) => i.category === 'series').length;
    return { total, activeCount, plateTypeCount, digitCount, seriesCount };
  }, [items]);

  const openAdd = () => { setEditing('new'); setForm(EMPTY_TEMPLATE); setFormErr({}); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({ category: t.category, key: t.key, title: t.title, content: t.content, active: t.active, sortOrder: t.sortOrder });
    setFormErr({});
  };

  const save = () => {
    const errs = {};
    if (!form.key.trim()) errs.key = 'Vui lòng nhập Key định danh';
    if (!form.title.trim()) errs.title = 'Vui lòng nhập Tiêu đề';
    if (!form.content.trim()) errs.content = 'Vui lòng nhập Nội dung ý nghĩa';
    setFormErr(errs);
    if (Object.keys(errs).length) return;

    const body = {
      ...form,
      key: form.key.trim(),
      title: form.title.trim(),
      content: form.content.trim(),
      sortOrder: Number(form.sortOrder) || 0
    };
    const done = () => { setEditing(null); notify(editing === 'new' ? 'Đã thêm mẫu thành công' : 'Đã cập nhật mẫu'); };
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
      onSuccess: () => { setConfirmDelete(null); notify('Đã xóa mẫu thành công'); },
      onError: (e) => notify(e.message || 'Xóa thất bại.'),
    });
  };

  return (
    <>
      {/* 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng mẫu quy tắc</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang kích hoạt</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)' }}>{stats.activeCount} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-faint)' }}>/ {stats.total}</span></div>
          </div>
        </div>

        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Mẫu Kiểu biển</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)' }}>{stats.plateTypeCount}</div>
          </div>
        </div>

        <div style={{ background: 'var(--white)', padding: '16px 20px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hash size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Ý nghĩa số & Nút</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)' }}>{stats.digitCount + stats.seriesCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Select
            label="Loại ý nghĩa"
            value={category}
            style={{ width: 190 }}
            options={[{ value: '', label: 'Tất cả danh mục' }, ...CATEGORIES]}
            onChange={setCategory}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', fontWeight: 600 }}>Tìm kiếm</span>
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Tìm tiêu đề, nội dung, key…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 34px 0 34px',
                  borderRadius: 'var(--radius-field)',
                  border: 'none',
                  background: 'var(--surface-sunken)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  font: 'var(--type-body-sm)',
                  color: 'var(--text-strong)',
                  outline: 'none',
                }}
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {(category || keyword) && (
            <button
              type="button"
              onClick={() => { setCategory(''); setKeyword(''); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                height: 40,
                alignSelf: 'flex-end',
                padding: '0 12px',
                borderRadius: 'var(--radius-field)',
                border: '1px solid var(--border-hairline)',
                background: 'var(--white)',
                cursor: 'pointer',
                font: 'var(--type-caption)',
                color: 'var(--text-muted)',
              }}
            >
              <X size={14} /> Xóa bộ lọc
            </button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            title="Làm mới danh sách"
            style={{
              height: 40,
              width: 40,
              alignSelf: 'flex-end',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-field)',
              border: '1px solid var(--border-hairline)',
              background: 'var(--white)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <RotateCw size={15} />
          </button>
        </div>

        <Button variant="primary" size="md" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Thêm mẫu ý nghĩa
        </Button>
      </div>

      {/* Main List Table */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        {isLoading && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <RotateCw size={24} className="animate-spin" style={{ color: 'var(--action-primary)' }} />
            <span>Đang tải danh sách mẫu quy tắc…</span>
          </div>
        )}

        {isError && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span>Không tải được danh sách mẫu ý nghĩa.</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Sparkles size={32} style={{ color: 'var(--text-faint)' }} />
            <div style={{ font: 'var(--type-body-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>Chưa có mẫu quy tắc nào</div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Thêm mẫu mới hoặc kiểm tra lại từ khóa tìm kiếm.</div>
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((t, idx) => {
              const catConfig = CATEGORY_STYLE[t.category] || CATEGORY_STYLE.general;
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-4)',
                    padding: '16px 20px',
                    borderBottom: idx < items.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                    transition: 'background 120ms ease',
                    background: t.active ? 'transparent' : 'rgba(0, 0, 0, 0.015)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-sunken)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = t.active ? 'transparent' : 'rgba(0, 0, 0, 0.015)'}
                >
                  {/* Category Pill Tag */}
                  <div style={{ flex: '0 0 auto', width: 110 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: 12,
                      fontWeight: 600,
                      background: catConfig.bg,
                      color: catConfig.color,
                      border: `1px solid ${catConfig.border}`,
                    }}>
                      {catConfig.label}
                    </span>
                  </div>

                  {/* Main Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ font: 'var(--type-body)', fontWeight: 600, color: 'var(--text-strong)' }}>
                        {t.title}
                      </span>
                      <code style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'var(--surface-sunken)',
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-hairline)'
                      }}>
                        {t.key}
                      </code>
                      <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                        Thứ tự: {t.sortOrder}
                      </span>
                    </div>

                    <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', marginTop: 6, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {t.content}
                    </div>
                  </div>

                  {/* Controls */}
                  <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Switch
                        checked={t.active}
                        disabled={updateMut.isPending}
                        onChange={() => updateMut.mutate({ id: t.id, body: { active: !t.active } }, { onError: (e) => notify(e.message || 'Lỗi cập nhật.') })}
                      />
                      <span style={{ fontSize: 12, color: t.active ? 'var(--text-strong)' : 'var(--text-muted)' }}>
                        {t.active ? 'Bật' : 'Tắt'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        title="Chỉnh sửa mẫu"
                        style={{
                          width: 34,
                          height: 34,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--radius-field)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: 'var(--text-body)',
                          transition: 'background 120ms ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; e.currentTarget.style.color = 'var(--text-strong)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-body)'; }}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDelete(t)}
                        title="Xóa mẫu"
                        style={{
                          width: 34,
                          height: 34,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--radius-field)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: 'var(--status-danger)',
                          transition: 'background 120ms ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing != null && (
        <TemplateModal
          form={form}
          editId={editing === 'new' ? 'new' : editing.id}
          formErr={formErr}
          saving={createMut.isPending || updateMut.isPending}
          onSet={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}

      {!!confirmDelete && (
        <ConfirmModal
          open
          title="Xác nhận xóa mẫu quy tắc"
          danger
          confirmLabel="Xóa mẫu"
          message={`Xóa mẫu "${confirmDelete.title}" (${confirmDelete.key})? Các ý nghĩa đã sinh vào biển số trước đây vẫn sẽ được giữ nguyên.`}
          onClose={() => setConfirmDelete(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}

function TemplateModal({ form, editId, formErr, saving, onSet, onSave, onClose }) {
  return (
    <Drawer open onClose={onClose} title={editId === 'new' ? 'Thêm mẫu ý nghĩa mới' : 'Chỉnh sửa mẫu ý nghĩa'} width="min(52%, 720px)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2) 0' }}>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Mẫu quy tắc chung phục vụ thuật toán phân tích ý nghĩa số tự động. Sửa tại đây KHÔNG làm thay đổi nội dung các biển đã gán trước đó.
        </p>

        <Select
          label="Loại quy tắc"
          value={form.category}
          options={CATEGORIES}
          onChange={(v) => onSet('category', v)}
          style={{ flex: 1 }}
        />

        <label style={fieldWrap}>
          <span style={fieldLbl}>
            Key nhận diện <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— Thuật toán tự khớp theo key này</span>
          </span>
          <input
            type="text"
            placeholder="VD: plate_type:tu_quy_8888 hoặc digit:8 hoặc series:nut_9"
            value={form.key}
            onChange={(e) => onSet('key', e.target.value)}
            style={{ ...fieldInput, height: 40, padding: '0 14px' }}
          />
          {formErr.key && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{formErr.key}</span>}
        </label>

        <label style={fieldWrap}>
          <span style={fieldLbl}>Tiêu đề ý nghĩa</span>
          <input
            type="text"
            placeholder="VD: Tứ quý 8888 - Toàn phát đại lộc"
            value={form.title}
            onChange={(e) => onSet('title', e.target.value)}
            style={{ ...fieldInput, height: 40, padding: '0 14px' }}
          />
          {formErr.title && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{formErr.title}</span>}
        </label>

        <label style={fieldWrap}>
          <span style={fieldLbl}>Nội dung giải nghĩa phong thủy chi tiết</span>
          <textarea
            rows={5}
            placeholder="Giải thích cặn kẽ ý nghĩa số, biểu tượng phong thủy, tài lộc vượng khí…"
            value={form.content}
            onChange={(e) => onSet('content', e.target.value)}
            style={fieldInput}
          />
          {formErr.content && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{formErr.content}</span>}
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)', paddingTop: 4 }}>
          <label style={{ ...fieldWrap, width: 140 }}>
            <span style={{ ...fieldLbl, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Thứ tự <InfoTip size={12} text="Thứ tự hiển thị trong khối phong thủy. Số nhỏ hơn sẽ hiển thị trước." />
            </span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => onSet('sortOrder', e.target.value)}
              style={{ ...fieldInput, height: 40, padding: '0 14px' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 22 }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => onSet('active', e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }}
            />
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 500, color: 'var(--text-strong)' }}>
              Kích hoạt mẫu (sẵn sàng để tự động seed cho biển)
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-hairline)', paddingTop: 16 }}>
          <Button variant="ghost" size="md" onClick={onClose}>Hủy bỏ</Button>
          <Button variant="primary" size="md" onClick={onSave} disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu mẫu quy tắc'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

/* ============ Tab 2: Theo từng biển (PlateMeaning CRUD + reseed) ============ */

function PlatesTab({ notify }) {
  const [plateKeyword, setPlateKeyword] = useState('');
  const [plate, setPlate] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_MEANING);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReseed, setConfirmReseed] = useState(false);
  const [reseedPreview, setReseedPreview] = useState(null);
  const [reseedPreviewErr, setReseedPreviewErr] = useState('');
  const [reseedDoneErr, setReseedDoneErr] = useState('');

  const { data: plateData, isLoading: plateLoading, refetch: refetchPlates } = useAdminPlates({
    keyword: plateKeyword,
    status: 'all',
    page: 1,
    perPage: 25,
  });
  const plates = (plateData?.items || []).filter((p) => p.id);

  const { data: meaningsData, isLoading: meaningsLoading, refetch: refetchMeanings } = usePlateMeanings(plate?.id);
  const meanings = meaningsData?.items || [];

  const createMut = useCreatePlateMeaning(plate?.id);
  const updateMut = useUpdatePlateMeaning(plate?.id);
  const deleteMut = useDeletePlateMeaning(plate?.id);
  const reseedMut = useReseedPlateMeanings(plate?.id);

  useEffect(() => {
    if (!plate) return;
    if (!plates.length || !plates.some((p) => p.id === plate.id)) {
      if (plateKeyword.trim() && !plateLoading) {
        setPlate(null);
        notify?.('Biển đang chọn không còn khớp tìm kiếm, đã bỏ chọn.');
      }
    }
  }, [plates, plateKeyword, plateLoading, plate]);

  const openAdd = () => { setEditing('new'); setForm(EMPTY_MEANING); };
  const openEdit = (m) => {
    setEditing(m);
    setForm({ category: m.category, title: m.title || '', content: m.content, sortOrder: m.sortOrder });
  };

  const save = () => {
    if (!form.content.trim()) { notify('Nội dung không được để trống.'); return; }
    const body = {
      category: form.category,
      title: form.title?.trim() || null,
      content: form.content.trim(),
      sortOrder: Number(form.sortOrder) || 0
    };
    const done = () => { setEditing(null); notify(editing === 'new' ? 'Đã thêm ý nghĩa thành công' : 'Đã cập nhật ý nghĩa'); };
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

  const openReseedPreview = async () => {
    if (!plate) return;
    setConfirmReseed(true);
    setReseedPreview(null);
    setReseedPreviewErr('');
    setReseedDoneErr('');
    try {
      const items = await previewSeedPlateMeanings(plate.id, plate.plateNumber);
      setReseedPreview(items);
    } catch (e) {
      setReseedPreviewErr(e.message || 'Không thể xem trước ý nghĩa.');
    }
  };

  const doReseed = () => {
    if (!plate) return;
    setReseedDoneErr('');
    reseedMut.mutate({ plateNumber: plate.plateNumber }, {
      onSuccess: () => {
        setConfirmReseed(false);
        notify('Đã sinh lại ý nghĩa phong thủy từ các mẫu đang kích hoạt');
      },
      onError: (e) => setReseedDoneErr(e.message || 'Sinh lại thất bại, vui lòng thử lại.'),
    });
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        {/* Left Column: Plate Picker */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-inset-hairline)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 200px)'
        }}>
          {/* Header & Search */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-hairline)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ font: 'var(--type-label)', fontWeight: 700, color: 'var(--text-strong)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Chọn biển số xe
              </span>
              <button
                type="button"
                onClick={() => refetchPlates()}
                title="Làm mới danh sách biển"
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <RotateCw size={14} />
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Tìm biển (VD: 30K-999.99)…"
                value={plateKeyword}
                onChange={(e) => setPlateKeyword(e.target.value)}
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 30px 0 32px',
                  borderRadius: 'var(--radius-field)',
                  border: 'none',
                  background: 'var(--surface-sunken)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  font: 'var(--type-body-sm)',
                  color: 'var(--text-strong)',
                  outline: 'none',
                }}
              />
              {plateKeyword && (
                <button
                  type="button"
                  onClick={() => setPlateKeyword('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Plate List Items */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {plateLoading && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>
                Đang tìm biển số…
              </div>
            )}

            {!plateLoading && plates.length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>
                {plateKeyword ? 'Không có biển nào khớp.' : 'Nhập biển số để tìm nhanh.'}
              </div>
            )}

            {!plateLoading && plates.map((p) => {
              const isSelected = plate?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlate({ id: p.id, plateNumber: p.plateNumber })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border-hairline)',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                    borderLeft: isSelected ? '3px solid var(--action-primary)' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Visual Plate Tag */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: '#ffffff',
                      border: '1.5px solid #1e293b',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: 13,
                      letterSpacing: '.04em',
                      color: '#0f172a',
                    }}>
                      {p.plateNumber}
                    </div>

                    {p.province && (
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        {p.province}
                      </span>
                    )}
                  </div>

                  <ChevronRight size={14} style={{ color: isSelected ? 'var(--action-primary)' : 'var(--text-faint)' }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Plate Meaning Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {!plate ? (
            <div style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-inset-hairline)',
              padding: '64px 32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Car size={28} />
              </div>
              <div style={{ font: 'var(--type-title-3)', fontWeight: 700, color: 'var(--text-strong)' }}>
                Chưa chọn biển số
              </div>
              <p style={{ margin: 0, maxWidth: 420, font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Vui lòng chọn hoặc tìm một biển số xe từ danh sách bên trái để cấu hình ý nghĩa phong thủy hoặc đồng bộ từ mẫu tự động.
              </p>
            </div>
          ) : (
            <>
              {/* Selected Plate Header Banner */}
              <div style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-inset-hairline)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px 14px',
                    borderRadius: 6,
                    background: '#ffffff',
                    border: '2px solid #0f172a',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: 18,
                    letterSpacing: '.06em',
                    color: '#0f172a',
                  }}>
                    {plate.plateNumber}
                  </div>
                  <div>
                    <div style={{ font: 'var(--type-body-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>
                      Cấu hình ý nghĩa phong thủy
                    </div>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      {meanings.length} mục ý nghĩa đang được kích hoạt cho biển này
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openReseedPreview}
                    disabled={reseedMut.isPending}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={14} className={reseedMut.isPending ? 'animate-spin' : ''} />
                    {reseedMut.isPending ? 'Đang sinh…' : 'Sinh lại từ mẫu'}
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openAdd}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} /> Thêm ý nghĩa riêng
                  </Button>
                </div>
              </div>

              {/* Meanings Content List */}
              {meaningsLoading && (
                <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RotateCw size={20} className="animate-spin" style={{ color: 'var(--action-primary)', margin: '0 auto 8px' }} />
                  Đang tải ý nghĩa của biển…
                </div>
              )}

              {!meaningsLoading && meanings.length === 0 && (
                <div style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  padding: '48px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <Sparkles size={32} style={{ color: 'var(--text-faint)' }} />
                  <div style={{ font: 'var(--type-body-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>
                    Biển này chưa có khối ý nghĩa phong thủy nào
                  </div>
                  <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)', maxWidth: 400 }}>
                    Bạn có thể bấm <strong>"Sinh lại từ mẫu"</strong> để hệ thống tự động nhận diện đuôi số/kiểu biển, hoặc bấm <strong>"Thêm ý nghĩa riêng"</strong> để viết tay.
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button variant="primary" size="sm" onClick={openReseedPreview}>Sinh từ mẫu ngay</Button>
                    <Button variant="ghost" size="sm" onClick={openAdd}>Nhập tay</Button>
                  </div>
                </div>
              )}

              {!meaningsLoading && meanings.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {meanings.map((m) => {
                    const catConfig = CATEGORY_STYLE[m.category] || CATEGORY_STYLE.general;
                    return (
                      <div
                        key={m.id}
                        style={{
                          background: 'var(--white)',
                          borderRadius: 'var(--radius-card)',
                          boxShadow: 'var(--shadow-inset-hairline)',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 'var(--space-3)',
                          transition: 'background 120ms ease',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: 11,
                              fontWeight: 600,
                              background: catConfig.bg,
                              color: catConfig.color,
                              border: `1px solid ${catConfig.border}`,
                            }}>
                              {catConfig.label}
                            </span>

                            {m.title && (
                              <span style={{ font: 'var(--type-body)', fontWeight: 700, color: 'var(--text-strong)' }}>
                                {m.title}
                              </span>
                            )}

                            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                              Thứ tự: {m.sortOrder}
                            </span>
                          </div>

                          <div style={{
                            font: 'var(--type-body-sm)',
                            color: 'var(--text-body)',
                            marginTop: 8,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-line'
                          }}>
                            {m.content}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '0 0 auto' }}>
                          <button
                            type="button"
                            onClick={() => openEdit(m)}
                            title="Sửa ý nghĩa này"
                            style={{
                              width: 32,
                              height: 32,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 'var(--radius-field)',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--text-body)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDelete(m)}
                            title="Xóa ý nghĩa"
                            style={{
                              width: 32,
                              height: 32,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 'var(--radius-field)',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'var(--status-danger)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Drawer: Add / Edit Single Plate Meaning */}
      {editing != null && (
        <MeaningModal
          form={form}
          editId={editing === 'new' ? 'new' : editing.id}
          saving={createMut.isPending || updateMut.isPending}
          onSet={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Confirm Delete Single Meaning */}
      {!!confirmDelete && (
        <ConfirmModal
          open
          title="Xác nhận xóa ý nghĩa?"
          danger
          confirmLabel="Xóa"
          onClose={() => setConfirmDelete(null)}
          onConfirm={remove}
          message={`Xác nhận xóa mục ý nghĩa "${confirmDelete.title || catLabel(confirmDelete.category)}" của biển ${plate?.plateNumber}? Thao tác này chỉ áp dụng riêng cho biển này.`}
        />
      )}

      {/* Modal: Reseed From Templates with Preview */}
      {confirmReseed && (
        <Modal open onClose={() => setConfirmReseed(false)} title="Sinh lại ý nghĩa từ mẫu chung" maxWidth="520px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Hệ thống sẽ quét các mẫu đang kích hoạt khớp với biển <strong>{plate?.plateNumber}</strong>. Các mục đã tồn tại trước đó sẽ được giữ nguyên (không ghi đè), chỉ bổ sung các phần mới.
            </p>

            {reseedPreview === null && !reseedPreviewErr && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>
                <RotateCw size={18} className="animate-spin" style={{ color: 'var(--action-primary)', margin: '0 auto 8px' }} />
                Đang quét các mẫu phù hợp…
              </div>
            )}

            {reseedPreviewErr && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-start', padding: 12, background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{reseedPreviewErr}</span>
                <Button variant="ghost" size="sm" onClick={openReseedPreview}>Thử lại</Button>
              </div>
            )}

            {reseedPreview !== null && reseedPreview.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)' }}>
                Không tìm thấy mẫu quy tắc nào khớp với số biển này. Hãy tạo thêm mẫu ở tab "Mẫu quy tắc chung".
              </div>
            )}

            {reseedPreview !== null && reseedPreview.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)' }}>
                  Tìm thấy {reseedPreview.length} mục phù hợp:
                </div>
                {reseedPreview.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--surface-sunken)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      opacity: p.alreadyExists ? 0.6 : 1,
                      border: p.alreadyExists ? '1px dashed var(--border-hairline)' : '1px solid var(--border-hairline)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ font: 'var(--type-body-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>
                        {p.title || catLabel(p.category)}
                      </span>
                      {p.alreadyExists ? (
                        <span style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic' }}>
                          (đã tồn tại — sẽ giữ nguyên)
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--status-mint)', fontWeight: 600 }}>
                          (thêm mới)
                        </span>
                      )}
                    </div>
                    <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', marginTop: 4, whiteSpace: 'pre-line' }}>
                      {p.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reseedDoneErr && (
              <div style={{ padding: 10, background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-md)' }}>
                <span role="alert" style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{reseedDoneErr}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 12, borderTop: '1px solid var(--border-hairline)', paddingTop: 12 }}>
              <Button variant="ghost" size="md" onClick={() => setConfirmReseed(false)}>Hủy</Button>
              <Button
                variant="primary"
                size="md"
                onClick={doReseed}
                disabled={reseedPreview === null || reseedMut.isPending}
              >
                {reseedMut.isPending ? 'Đang sinh…' : reseedDoneErr ? 'Thử lại' : 'Tiến hành sinh'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function MeaningModal({ form, editId, saving, onSet, onSave, onClose }) {
  return (
    <Drawer open onClose={onClose} title={editId === 'new' ? 'Thêm ý nghĩa riêng cho biển' : 'Sửa ý nghĩa biển số'} width="min(52%, 720px)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2) 0' }}>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Ý nghĩa tùy biến này được gắn độc lập vào biển số đang chọn — hoàn toàn không ảnh hưởng đến các biển số khác.
        </p>

        <Select
          label="Loại ý nghĩa"
          value={form.category}
          options={PLATE_CATEGORIES}
          onChange={(v) => onSet('category', v)}
          style={{ flex: 1 }}
        />

        <label style={fieldWrap}>
          <span style={fieldLbl}>
            Tiêu đề <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(tùy chọn)</span>
          </span>
          <input
            type="text"
            placeholder="VD: Cặp số tiến, Ngũ quý, Thần tài lớn…"
            value={form.title}
            onChange={(e) => onSet('title', e.target.value)}
            style={{ ...fieldInput, height: 40, padding: '0 14px' }}
          />
        </label>

        <label style={fieldWrap}>
          <span style={fieldLbl}>Nội dung giải nghĩa phong thủy</span>
          <textarea
            rows={5}
            placeholder="Mô tả chi tiết ý nghĩa số học, biểu trưng phong thủy…"
            value={form.content}
            onChange={(e) => onSet('content', e.target.value)}
            style={fieldInput}
          />
        </label>

        <label style={{ ...fieldWrap, width: 140 }}>
          <span style={{ ...fieldLbl, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Thứ tự hiển thị <InfoTip size={12} text="Vị trí hiển thị trong khối phong thủy của biển. Số nhỏ hơn hiện trước." />
          </span>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => onSet('sortOrder', e.target.value)}
            style={{ ...fieldInput, height: 40, padding: '0 14px' }}
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-hairline)', paddingTop: 16 }}>
          <Button variant="ghost" size="md" onClick={onClose}>Hủy bỏ</Button>
          <Button variant="primary" size="md" onClick={onSave} disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu ý nghĩa'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
