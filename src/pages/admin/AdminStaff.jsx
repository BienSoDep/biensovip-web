import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/Button.jsx';
import { Input, Select, Switch, Avatar, IconButton, SearchField } from '../../components/index.jsx';
import { useAdminStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from '../../services/adminStaff.js';

const ROLE_OPTS = [
  { value: 'staff', label: 'Nhân viên' },
  { value: 'super-admin', label: 'Quản trị viên' },
];
const ROLE_LABEL = { 'super-admin': 'Quản trị viên', staff: 'Nhân viên' };
const ROLE_FG = { 'super-admin': 'var(--action-primary)', staff: 'var(--blue-600)' };

export default function AdminStaff({ notify }) {
  const { data, isLoading, isError, refetch } = useAdminStaff();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [delId, setDelId] = useState(null);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'staff', active: true });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);

  const items = data?.items || [];
  const query = q.trim().toLowerCase();
  const rows = query ? items.filter((x) => (x.fullName + ' ' + x.email).toLowerCase().includes(query)) : items;

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e && e.target ? e.target.value : e }));

  const resetForm = () => {
    setForm({ fullName: '', email: '', password: '', role: 'staff', active: true });
    setErr({}); setEditId(null);
  };

  const openAdd = () => { resetForm(); setOpen(true); };
  const openEdit = (x) => {
    setForm({ fullName: x.fullName || '', email: x.email, password: '', role: x.role, active: x.active });
    setErr({}); setEditId(x.id); setOpen(true);
  };

  const save = async () => {
    const ne = {};
    const email = form.email.trim();
    if (!email) ne.email = 'Nhập email.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) ne.email = 'Email chưa hợp lệ.';
    if (!editId && !form.password) ne.password = 'Nhập mật khẩu.';
    else if (!editId && form.password.length < 6) ne.password = 'Mật khẩu tối thiểu 6 ký tự.';
    if (!form.fullName.trim()) ne.fullName = 'Nhập họ tên.';
    if (Object.keys(ne).length) { setErr(ne); return; }

    setSaving(true);
    try {
      if (editId) {
        await updateStaff.mutateAsync({ id: editId, role: form.role, active: form.active });
        notify('Đã cập nhật nhân viên');
      } else {
        await createStaff.mutateAsync({ email, password: form.password, fullName: form.fullName.trim(), role: form.role });
        notify('Đã thêm nhân viên');
      }
      setOpen(false);
    } catch (e) {
      if (e.status === 409) setErr({ email: 'Email đã được sử dụng.' });
      else setErr({ email: e.message || 'Lỗi khi lưu.' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!delId) return;
    try {
      await deleteStaff.mutateAsync(delId);
      notify('Đã xóa nhân viên');
    } catch (e) {
      if (e.status === 409) toast.error('Phải còn ít nhất một tài khoản super-admin');
      else toast.error(e.message || 'Lỗi khi xóa');
    }
    setDelId(null);
  };

  const toggleActive = async (x) => {
    try {
      await updateStaff.mutateAsync({ id: x.id, active: !x.active });
      notify(x.active ? 'Đã khóa tài khoản' : 'Đã kích hoạt tài khoản');
    } catch (e) {
      if (e.status === 409) toast.error('Phải còn ít nhất một tài khoản super-admin');
      else toast.error(e.message || 'Lỗi khi cập nhật');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        <SearchField placeholder="Tìm theo tên hoặc email…" value={q} onChange={(e) => setQ(e.target.value)} width={260} />
        <Button variant="primary" size="md" onClick={openAdd}>Thêm nhân viên</Button>
      </div>

      {isLoading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
      ) : isError ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span>Lỗi tải dữ liệu</span>
          <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
        </div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 520 }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            <span style={{ flex: '1 1 180px' }}>Nhân viên</span><span style={{ flex: '1 1 110px' }}>Vai trò</span><span style={{ flex: '1 1 80px' }}>Trạng thái</span><span style={{ flex: '0 0 72px' }}>Thao tác</span>
          </div>
          {rows.map((x) => (
            <div key={x.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <span style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Avatar name={x.fullName || x.email} size="sm" />
                <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{x.fullName || '—'}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{x.email}</span>
                </span>
              </span>
              <span style={{ flex: '1 1 110px', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: ROLE_FG[x.role] || 'var(--text-strong)' }}>{ROLE_LABEL[x.role] || x.role}</span>
              <span style={{ flex: '1 1 80px' }}><Switch checked={x.active} onChange={() => toggleActive(x)} /></span>
              <span style={{ flex: '0 0 72px', display: 'flex', gap: 'var(--space-2)' }}>
                <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEdit(x)} />
                <IconButton name="trash-2" label="Xóa" size="sm" onClick={() => setDelId(x.id)} />
              </span>
            </div>
          ))}
          </div>
          </div>
          {rows.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{query ? 'Không có nhân viên nào khớp tìm kiếm.' : 'Chưa có nhân viên nào.'}</div>}
        </div>
      )}

      {/* Create/Edit modal */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 18px', overflow: 'auto', animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div style={{ width: '100%', maxWidth: 460, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div style={{ flex: 1 }}><h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{editId ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{editId ? 'Cập nhật thông tin và quyền truy cập.' : 'Nhân viên sẽ có quyền đăng nhập trang quản trị.'}</p></div>
              <IconButton name="x" label="Đóng" onClick={() => setOpen(false)} />
            </div>
            <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.fullName} error={err.fullName} onChange={field('fullName')} />
            <Input label="Email" type="email" placeholder="a@biensovip.com" value={form.email} error={err.email} onChange={field('email')} disabled={!!editId} />
            {!editId && <Input label="Mật khẩu" type="password" placeholder="Tối thiểu 6 ký tự" value={form.password} error={err.password} onChange={field('password')} />}
            <Select label="Vai trò" value={form.role} options={ROLE_OPTS} onChange={field('role')} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: 1 }}>Hoạt động</span>
              <Switch checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="md" onClick={() => setOpen(false)}>Hủy</Button>
              <Button variant="primary" size="md" onClick={save} disabled={saving}>{saving ? 'Đang lưu…' : editId ? 'Lưu thay đổi' : 'Thêm nhân viên'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {delId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 91, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 18px', animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div style={{ width: '100%', maxWidth: 380, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <h2 style={{ margin: 0, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Xác nhận xóa</h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Tài khoản này sẽ bị vô hiệu hóa và đăng xuất khỏi tất cả phiên. Bạn có chắc chắn?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="md" onClick={() => setDelId(null)}>Hủy</Button>
              <Button variant="danger" size="md" onClick={confirmDelete}>Xóa</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
