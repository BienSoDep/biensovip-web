import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Badge, Input, Checkbox } from '../../components/index.jsx';
import Modal from '../../components/Modal.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { useAdminCtvMessageTemplates, useCreateCtvMessageTemplate, useUpdateCtvMessageTemplate, useDeleteCtvMessageTemplate } from '../../services/adminCtvMessageTemplates.js';

const CHANNEL_OPTS = [
  { value: '', label: 'Không giới hạn kênh' },
  { value: 'zalo', label: 'Zalo' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'sms', label: 'SMS' },
];
const CHANNEL_LABEL = { zalo: 'Zalo', facebook: 'Facebook', sms: 'SMS' };

const EMPTY_FORM = { title: '', category: '', channel: '', description: '', bodyTemplate: '', sortOrder: 0, isActive: true };

function TemplateForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.title.trim()) { return; }
    if (!form.bodyTemplate.trim()) { return; }
    onSave({ ...form, sortOrder: Number(form.sortOrder) || 0, category: form.category || null, channel: form.channel || null, description: form.description || null });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Input label="Tiêu đề" placeholder="VD: Mời khách quan tâm biển" value={form.title} onChange={set('title')} />
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px' }}><Input label="Danh mục (tùy chọn)" placeholder="VD: Mời khách, Nhắc cọc, Chốt đơn" value={form.category} onChange={set('category')} /></div>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Kênh áp dụng</span>
            <select value={form.channel} onChange={set('channel')} style={{ height: 44, borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '0 12px', font: 'var(--type-body-sm)' }}>
              {CHANNEL_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <div style={{ flex: '0 0 120px' }}><Input label="Thứ tự" type="number" value={form.sortOrder} onChange={set('sortOrder')} /></div>
      </div>
      <Input label="Mô tả ngắn (tùy chọn — dùng khi nào)" placeholder="VD: Dùng khi khách mới xem biển, chưa để lại liên hệ" value={form.description} onChange={set('description')} />
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Nội dung mẫu — dùng {'{plateNumber}'} / {'{referralUrl}'} để tự điền khi CTV copy</span>
        <textarea rows={5} value={form.bodyTemplate} onChange={set('bodyTemplate')} placeholder="VD: Chào bạn! Mình đang có biển {plateNumber} khá đẹp, giới thiệu qua bạn xem thử: {referralUrl}"
          style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-body-sm)' }} />
      </label>
      <Checkbox label="Đang bật (CTV thấy được)" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: !!v }))} />
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="primary" size="md" loading={saving} onClick={submit}>Lưu</Button>
        <Button variant="ghost" size="md" onClick={onCancel}>Hủy</Button>
      </div>
    </div>
  );
}

export default function AdminCtvMessageTemplates({ notify }) {
  const { data, isLoading, isError } = useAdminCtvMessageTemplates();
  const create = useCreateCtvMessageTemplate();
  const update = useUpdateCtvMessageTemplate();
  const del = useDeleteCtvMessageTemplate();
  const [modal, setModal] = useState(null); // null | 'create' | template object (edit)
  const [confirmDelete, setConfirmDelete] = useState(null);

  const items = data || [];

  const save = async (form) => {
    try {
      if (modal === 'create') {
        await create.mutateAsync(form);
        notify('Đã thêm mẫu tin nhắn');
      } else {
        await update.mutateAsync({ id: modal.id, ...form });
        notify('Đã cập nhật mẫu tin nhắn');
      }
      setModal(null);
    } catch (e) {
      notify(e.message || 'Lỗi khi lưu mẫu tin nhắn');
    }
  };

  const doDelete = async () => {
    try {
      await del.mutateAsync(confirmDelete.id);
      notify('Đã xóa mẫu tin nhắn');
      setConfirmDelete(null);
    } catch (e) {
      notify(e.message || 'Lỗi khi xóa');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="md" onClick={() => setModal('create')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={16} /> Thêm mẫu tin nhắn</Button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={4} />
      ) : isError ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Lỗi tải danh sách mẫu tin nhắn</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có mẫu tin nhắn nào — bấm "Thêm mẫu tin nhắn" để tạo mẫu đầu tiên giúp CTV.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {items.map((t) => (
            <div key={t.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', opacity: t.isActive ? 1 : 0.55 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{t.title}</span>
                  {!t.isActive && <Badge tone="neutral">Đã ẩn</Badge>}
                  {t.category && <Badge tone="blue">{t.category}</Badge>}
                  {t.channel && <Badge tone="amber">{CHANNEL_LABEL[t.channel] || t.channel}</Badge>}
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Thứ tự: {t.sortOrder}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" aria-label="Sửa" onClick={() => setModal(t)} style={{ width: 32, height: 32, border: 'none', background: 'var(--surface-sunken)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Pencil size={14} /></button>
                  <button type="button" aria-label="Xóa" onClick={() => setConfirmDelete(t)} style={{ width: 32, height: 32, border: 'none', background: 'var(--surface-sunken)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-danger)' }}><Trash2 size={14} /></button>
                </div>
              </div>
              {t.description && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{t.description}</span>}
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{t.bodyTemplate}</p>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal open onClose={() => setModal(null)} title={modal === 'create' ? 'Thêm mẫu tin nhắn' : 'Sửa mẫu tin nhắn'} maxWidth="640px">
          <TemplateForm
            initial={modal === 'create' ? null : { title: modal.title, category: modal.category || '', channel: modal.channel || '', description: modal.description || '', bodyTemplate: modal.bodyTemplate, sortOrder: modal.sortOrder, isActive: modal.isActive }}
            onSave={save}
            onCancel={() => setModal(null)}
            saving={create.isPending || update.isPending}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal open onClose={() => setConfirmDelete(null)} title="Xóa mẫu tin nhắn?">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Xóa mẫu "{confirmDelete.title}"? CTV sẽ không còn thấy mẫu này nữa.</p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" size="md" loading={del.isPending} onClick={doDelete} style={{ background: 'var(--status-danger)' }}>Xóa</Button>
              <Button variant="ghost" size="md" onClick={() => setConfirmDelete(null)}>Hủy</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
