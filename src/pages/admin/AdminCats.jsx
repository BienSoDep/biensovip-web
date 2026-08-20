import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { Input, IconButton } from '../../components/index.jsx';
import { CATEGORY_GROUPS, useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useHardDeleteCategory } from '../../services/categories.js';

export default function AdminCats({ notify }) {
  const [group, setGroup] = useState('plate_type');
  const [form, setForm] = useState({ name: '', displayOrder: 0, minPrice: '', maxPrice: '' });
  const [formErr, setFormErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [editId, setEditId] = useState(null);

  const { data, isLoading, isError } = useAdminCategories(group);
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const hardDeleteCat = useHardDeleteCategory();

  const items = data?.items || [];
  const isPriceRange = group === 'price_range';

  const resetForm = () => { setForm({ name: '', displayOrder: 0, minPrice: '', maxPrice: '' }); setEditId(null); setFormErr(''); };

  const startEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name, displayOrder: c.displayOrder ?? 0, minPrice: c.minPrice != null ? String(c.minPrice) : '', maxPrice: c.maxPrice != null ? String(c.maxPrice) : '' });
    setFormErr('');
  };

  const addCat = () => {
    const name = form.name.trim();
    if (!name) { setFormErr('Nhập tên danh mục.'); return; }
    setFormErr('');
    const body = {
      group,
      name,
      displayOrder: Number(form.displayOrder) || 0,
      minPrice: isPriceRange && form.minPrice !== '' ? Number(form.minPrice) : null,
      maxPrice: isPriceRange && form.maxPrice !== '' ? Number(form.maxPrice) : null,
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

  const doDelete = (hard) => {
    const id = confirmDel.id;
    (hard ? hardDeleteCat : deleteCat).mutate(id, {
      onSuccess: () => { notify(hard ? 'Đã xóa vĩnh viễn danh mục' : 'Đã xóa danh mục'); setConfirmDel(null); },
      onError: (err) => {
        if (err.code === 'CATEGORY_IN_USE') notify(`Không thể xóa — đang có ${err.usageCount ?? ''} biển số dùng danh mục này.`);
        else notify(err.message || 'Xóa thất bại.');
      },
    });
  };

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
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{CATEGORY_GROUPS.find((g) => g.value === group)?.label}</span>
          </div>
          {isLoading && <div style={{ padding: 'var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>}
          {isError && <div style={{ padding: 'var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Không tải được danh sách.</div>}
          {!isLoading && !isError && items.length === 0 && (
            <div style={{ padding: 'var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có danh mục nào.</div>
          )}
          {items.map((c) => (
            <div key={c.id} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <span style={{ flex: 1, font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{c.name}</span>
              {isPriceRange && (
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  {c.minPrice != null ? c.minPrice.toLocaleString('vi-VN') : '0'} - {c.maxPrice != null ? c.maxPrice.toLocaleString('vi-VN') : '∞'}
                </span>
              )}
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{c.plateCount} biển</span>
              <IconButton name="pencil" label="Sửa danh mục" size="sm" onClick={() => startEdit(c)} />
              <IconButton name="trash-2" label="Xóa danh mục" size="sm" onClick={() => setConfirmDel(c)} />
            </div>
          ))}
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{editId ? 'Sửa danh mục' : 'Thêm danh mục mới'}</span>
          <Input label="Tên danh mục" placeholder="VD: Biển tiến" value={form.name} error={formErr}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Thứ tự hiển thị" type="number" value={form.displayOrder}
            onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))} />
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

      {confirmDel && (
        <div role="alertdialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div style={{ width: '100%', maxWidth: 380, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Xác nhận xóa</h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Danh mục <b>{confirmDel.name}</b> sẽ được xóa. <b>Xóa vĩnh viễn</b> không thể hoàn tác.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button variant="ghost" size="md" onClick={() => setConfirmDel(null)}>Hủy</Button>
              <Button variant="primary" size="md" onClick={() => doDelete(true)} style={{ background: 'var(--status-danger)', boxShadow: '0 8px 20px rgba(229,72,77,.26)' }}>Xóa vĩnh viễn</Button>
              <Button variant="primary" size="md" onClick={() => doDelete(false)}>Xóa</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
