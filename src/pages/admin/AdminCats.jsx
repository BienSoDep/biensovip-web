import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import { Input, IconButton, InfoTip, Badge } from '../../components/index.jsx';
import { CATEGORY_GROUPS, useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useReorderCategories } from '../../services/categories.js';

// 1 hàng danh mục kéo-thả được — GripVertical làm tay cầm kéo (chỉ tay cầm nhận sự kiện kéo, tránh
// xung đột với click nút Sửa/Xóa trên cùng hàng).
function SortableCategoryRow({ c, idx, isBlogCategory, isPriceRange, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
    boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--white)',
  };
  return (
    <div ref={setNodeRef} style={style}>
      <button type="button" {...attributes} {...listeners} aria-label="Kéo để đổi thứ tự"
        style={{ border: 'none', background: 'transparent', cursor: 'grab', padding: 2, color: 'var(--text-faint)', display: 'flex', touchAction: 'none' }}>
        <GripVertical size={16} />
      </button>
      <span style={{ width: 22, textAlign: 'center', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', padding: '2px 0' }}>{idx + 1}</span>
      <span style={{ flex: 1, font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{c.name}</span>
      {isBlogCategory && c.code && (
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.code}</span>
      )}
      {isPriceRange && (
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          {c.minPrice != null ? c.minPrice.toLocaleString('vi-VN') : '0'} - {c.maxPrice != null ? c.maxPrice.toLocaleString('vi-VN') : '∞'}
        </span>
      )}
      {!isBlogCategory && (c.plateCount > 0
        ? <Badge tone="amber">{c.plateCount} biển</Badge>
        : <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>0 biển</span>)}
      {isBlogCategory && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{c.plateCount} bài viết</span>}
      <IconButton name="pencil" label="Sửa danh mục" size="sm" onClick={() => onEdit(c)} />
      <IconButton name="trash-2" label="Xóa danh mục" size="sm" onClick={() => onDelete(c)} />
    </div>
  );
}

export default function AdminCats({ notify }) {
  const [group, setGroup] = useState('plate_type');
  const [form, setForm] = useState({ name: '', displayOrder: 0, minPrice: '', maxPrice: '', code: '' });
  const [formErr, setFormErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleteErr, setDeleteErr] = useState(null);
  const [editId, setEditId] = useState(null);

  const { data, isLoading, isError } = useAdminCategories(group);
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const reorderCats = useReorderCategories();

  const items = data?.items || [];
  const isPriceRange = group === 'price_range';
  const isBlogCategory = group === 'blog_category';

  const resetForm = () => { setForm({ name: '', displayOrder: 0, minPrice: '', maxPrice: '', code: '' }); setEditId(null); setFormErr(''); };

  const startEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name, displayOrder: c.displayOrder ?? 0, minPrice: c.minPrice != null ? String(c.minPrice) : '', maxPrice: c.maxPrice != null ? String(c.maxPrice) : '', code: c.code || '' });
    setFormErr('');
  };

  const addCat = () => {
    const name = form.name.trim();
    if (!name) { setFormErr('Nhập tên danh mục.'); return; }
    if (isBlogCategory && !editId && !form.code.trim()) { setFormErr('Nhập mã danh mục (khớp với giá trị Category của bài viết).'); return; }
    if (isPriceRange) {
      const min = form.minPrice !== '' ? Number(form.minPrice) : null;
      const max = form.maxPrice !== '' ? Number(form.maxPrice) : null;
      if (min != null && min < 0) { setFormErr('Giá tối thiểu không được âm.'); return; }
      if (max != null && max < 0) { setFormErr('Giá tối đa không được âm.'); return; }
      if (min != null && max != null && min > max) { setFormErr('Giá tối thiểu không được lớn hơn giá tối đa.'); return; }
    }
    setFormErr('');
    const body = {
      group,
      name,
      // Item mới luôn thêm cuối danh sách — thứ tự sau đó chỉnh bằng nút mũi tên lên/xuống, không cần
      // admin tự nhập số tay (dễ nhầm, không biết số nào đang được dùng).
      displayOrder: editId ? Number(form.displayOrder) || 0 : items.length,
      minPrice: isPriceRange && form.minPrice !== '' ? Number(form.minPrice) : null,
      maxPrice: isPriceRange && form.maxPrice !== '' ? Number(form.maxPrice) : null,
      code: isBlogCategory ? form.code.trim() : null,
    };
    const opts = {
      onSuccess: () => { resetForm(); notify(editId ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục'); },
      onError: (err) => {
        if (err.code === 'DUPLICATE_CATEGORY') setFormErr('Tên danh mục đã tồn tại.');
        else setFormErr(err.message || 'Có lỗi xảy ra.');
      },
    };
    if (editId) updateCat.mutate({ id: editId, body }, opts);
    else createCat.mutate(body, opts);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((c) => c.id === active.id);
    const newIdx = items.findIndex((c) => c.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(items, oldIdx, newIdx);
    reorderCats.mutate(next.map((c) => c.id), {
      onSuccess: () => notify('Đã cập nhật thứ tự'),
      onError: () => notify('Lỗi cập nhật thứ tự — thử lại.'),
    });
  };

  const doDelete = () => {
    const id = confirmDel.id;
    setDeleteErr(null);
    deleteCat.mutate(id, {
      onSuccess: () => { notify('Đã xóa danh mục'); setConfirmDel(null); setDeleteErr(null); },
      onError: (err) => {
        if (err.code === 'CATEGORY_IN_USE') setDeleteErr({ usageCount: err.usageCount });
        else { notify(err.message || 'Xóa thất bại.'); setConfirmDel(null); }
      },
    });
  };

  const closeDelete = () => { setConfirmDel(null); setDeleteErr(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {CATEGORY_GROUPS.map((g) => (
          <button key={g.value} type="button" onClick={() => setGroup(g.value)}
            style={{
              height: 36, padding: '0 16px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
              background: group === g.value ? 'var(--action-dark)' : 'var(--surface-muted)',
              color: group === g.value ? 'var(--white)' : 'var(--text-body)', font: 'var(--type-body-sm)',
            }}>{g.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 340px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{CATEGORY_GROUPS.find((g) => g.value === group)?.label}</span>
            <InfoTip text="Thứ tự hiển thị: danh mục ở trên xuất hiện trước trên trang website. Kéo tay cầm ☰ cạnh số thứ tự (1, 2, 3…) để sắp xếp lại." />
          </div>
          {isLoading && <div style={{ padding: 'var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>}
          {isError && <div style={{ padding: 'var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Không tải được danh sách.</div>}
          {!isLoading && !isError && items.length === 0 && (
            <div style={{ padding: 'var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có danh mục nào.</div>
          )}
          <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {items.map((c, idx) => (
                <SortableCategoryRow key={c.id} c={c} idx={idx} isBlogCategory={isBlogCategory} isPriceRange={isPriceRange} onEdit={startEdit} onDelete={setConfirmDel} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{editId ? 'Sửa danh mục' : 'Thêm danh mục mới'}</span>
          <Input label="Tên danh mục" placeholder="VD: Biển tiến" value={form.name} error={formErr}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          {isBlogCategory && (
            <Input label="Mã danh mục (khớp Category của bài viết, VD: phong-thuy)" placeholder="phong-thuy" value={form.code}
              disabled={Boolean(editId)}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          )}
          {!editId && (
            <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Danh mục mới thêm vào cuối danh sách — kéo tay cầm ☰ để đổi thứ tự hiển thị trên website.</p>
          )}
          {isPriceRange && (
            <>
              <Input label="Giá tối thiểu (VND)" type="number" value={form.minPrice}
                onChange={(e) => setForm((f) => ({ ...f, minPrice: e.target.value }))} />
              <Input label="Giá tối đa (VND) — để trống nếu không giới hạn" type="number" value={form.maxPrice}
                onChange={(e) => setForm((f) => ({ ...f, maxPrice: e.target.value }))} />
            </>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignSelf: 'flex-start' }}>
            {editId && <Button variant="ghost" size="md" onClick={resetForm}>Hủy sửa</Button>}
            <Button variant="dark" size="md" onClick={addCat} disabled={createCat.isPending || updateCat.isPending}>
              {editId ? (updateCat.isPending ? 'Đang lưu…' : 'Lưu thay đổi') : (createCat.isPending ? 'Đang thêm…' : 'Thêm danh mục')}
            </Button>
          </div>
        </div>
      </div>

      <Modal open={!!confirmDel} onClose={closeDelete} title={deleteErr ? 'Không thể xóa' : 'Xác nhận xóa'} maxWidth="420px">
        {deleteErr ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              Danh mục <b>{confirmDel?.name}</b> đang được <b>{deleteErr.usageCount ?? ''} biển số</b> sử dụng nên không thể xóa. Hãy gỡ liên kết hoặc đổi danh mục cho các biển đó trước.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button variant="primary" size="md" onClick={closeDelete}>Đã hiểu</Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Danh mục <b>{confirmDel?.name}</b> sẽ được ẩn khỏi hệ thống. Bạn có thể khôi phục lại sau nếu cần.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button variant="ghost" size="md" onClick={closeDelete} disabled={deleteCat.isPending}>Hủy</Button>
              <Button variant="danger" size="md" onClick={doDelete} loading={deleteCat.isPending}>Xóa</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
