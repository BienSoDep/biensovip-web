import { useState } from 'react';
import { opts } from '../../lib/mockData.js';
import Button from '../../components/Button.jsx';
import { Input, Select, Switch, Avatar, IconButton } from '../../components/index.jsx';

const ROLE_FG = { Admin: 'var(--action-primary)', Editor: 'var(--blue-600)' };

// ponytail: STAFF seeded from mockData (placeholder admins). Swap for real admin list when backend lands.
export default function AdminStaff({ st, patch, setSt, notify }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'Editor', active: true });
  const [err, setErr] = useState({});

  const admQ = (st.adminQ || '').trim().toLowerCase();
  const rows = st.staff.filter((x) => !admQ || (x.name + ' ' + x.email).toLowerCase().indexOf(admQ) >= 0);

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e && e.target ? e.target.value : e }));

  const openAdd = () => {
    setForm({ name: '', email: '', role: 'Editor', active: true });
    setErr({}); setEditId(null); setOpen(true);
  };

  const openEdit = (x) => {
    setForm({ name: x.name, email: x.email, role: x.role, active: x.active });
    setErr({}); setEditId(x.id); setOpen(true);
  };

  const save = () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const ne = {};
    if (!name) ne.name = 'Nhập họ tên.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) ne.email = 'Email chưa hợp lệ.';
    if (st.staff.some((x) => x.email === email && x.id !== editId)) ne.email = 'Email đã tồn tại.';
    if (Object.keys(ne).length) { setErr(ne); return; }
    setSt((s) => ({
      ...s,
      staff: editId
        ? s.staff.map((x) => (x.id === editId ? { ...x, name, email, role: form.role, active: form.active } : x))
        : [...s.staff, { id: 's' + (s.staff.length + 1), name, email, role: form.role, active: form.active, added: 'Hôm nay' }],
    }));
    setOpen(false);
    notify(editId ? 'Đã cập nhật nhân viên' : 'Đã thêm nhân viên');
  };

  const setRole = (x) => (v) => {
    setSt((s) => ({ ...s, staff: s.staff.map((y) => (y.id === x.id ? { ...y, role: v } : y)) }));
    notify('Đã cập nhật vai trò');
  };

  const toggle = (x) => {
    setSt((s) => ({ ...s, staff: s.staff.map((y) => (y.id === x.id ? { ...y, active: !y.active } : y)) }));
    notify(x.active ? 'Đã khóa tài khoản' : 'Đã kích hoạt tài khoản');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="md" onClick={openAdd}>Thêm nhân viên</Button>
      </div>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '1 1 180px' }}>Nhân viên</span><span style={{ flex: '1 1 110px' }}>Vai trò</span><span style={{ flex: '1 1 80px' }}>Trạng thái</span><span style={{ flex: '0 0 72px' }}>Thao tác</span>
        </div>
        {rows.map((x) => (
          <div key={x.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
            <span style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Avatar name={x.name} size="sm" />
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{x.name}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{x.email}</span>
              </span>
            </span>
            <span style={{ flex: '1 1 110px', whiteSpace: 'nowrap' }}>
              <Select value={x.role} options={opts(['Admin', 'Editor'])} onChange={setRole(x)} variant="pill" style={{ whiteSpace: 'nowrap', color: ROLE_FG[x.role] || 'var(--text-strong)' }} />
            </span>
            <span style={{ flex: '1 1 80px' }}><Switch checked={x.active} onChange={() => toggle(x)} /></span>
            <span style={{ flex: '0 0 72px', display: 'flex', gap: 'var(--space-2)' }}>
              <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEdit(x)} />
            </span>
          </div>
        ))}
        {rows.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có nhân viên nào khớp tìm kiếm.</div>}
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 18px', overflow: 'auto', animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div style={{ width: '100%', maxWidth: 460, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div style={{ flex: 1 }}><h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{editId ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{editId ? 'Cập nhật thông tin và quyền truy cập.' : 'Nhân viên sẽ có quyền đăng nhập trang quản trị.'}</p></div>
              <IconButton name="x" label="Đóng" onClick={() => setOpen(false)} />
            </div>
            <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.name} error={err.name} onChange={field('name')} />
            <Input label="Email" type="email" placeholder="a@biensovip.com" value={form.email} error={err.email} onChange={field('email')} />
            <Select label="Vai trò" value={form.role} options={opts(['Admin', 'Editor'])} onChange={field('role')} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: 1 }}>Hoạt động</span>
              <Switch checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="md" onClick={() => setOpen(false)}>Hủy</Button>
              <Button variant="primary" size="md" onClick={save}>{editId ? 'Lưu thay đổi' : 'Thêm nhân viên'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
