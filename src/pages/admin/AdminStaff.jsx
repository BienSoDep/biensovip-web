import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/Button.jsx';
import { Input, Select, Switch, Avatar, IconButton, SearchField, InfoTip } from '../../components/index.jsx';
import { useAdminStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from '../../services/adminStaff.js';
import { loadAuth, clearAuth } from '../../lib/authStore.js';
import Modal from '../../components/Modal.jsx';
import Drawer from '../../components/Drawer.jsx';

const ROLE_OPTS = [
  { value: 'staff', label: 'Nhân viên' },
  { value: 'super-admin', label: 'Quản trị viên' },
];
const ROLE_LABEL = { 'super-admin': 'Quản trị viên', staff: 'Nhân viên' };
const ROLE_FG = { 'super-admin': 'var(--action-primary)', staff: 'var(--blue-600)' };

const PERM_RESOURCES = [
  ['plates', 'Biển số'], ['categories', 'Danh mục'], ['contacts', 'Yêu cầu liên hệ'],
  ['posts', 'Bài viết'], ['customers', 'Khách hàng'], ['videos', 'Video'],
  ['notifications', 'Thông báo'], ['collaborators', 'Cộng tác viên'],
  ['reviews', 'Đánh giá'], ['meanings', 'Ý nghĩa phong thủy'], ['chatbot', 'Trợ lý AI'],
];
const PERM_ACTIONS = [['view', 'Xem'], ['create', 'Thêm'], ['update', 'Sửa'], ['delete', 'Xóa']];
// Preset mặc định cho nhân viên: xem + thêm + sửa mọi mục, không quyền xóa.
const RECOMMENDED = PERM_RESOURCES.flatMap(([r]) => ['view', 'create', 'update'].map((a) => `${r}:${a}`));

const slugify = (s) => (s || '').toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

export default function AdminStaff({ notify }) {
  const { data, isLoading, isError, refetch } = useAdminStaff();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [delId, setDelId] = useState(null);
  const [selfAction, setSelfAction] = useState(null);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'staff', active: true, permissions: RECOMMENDED });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);

  const items = data?.items || [];
  const query = q.trim().toLowerCase();
  const rows = query ? items.filter((x) => (x.fullName + ' ' + x.email).toLowerCase().includes(query)) : items;

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e && e.target ? e.target.value : e }));

  // Email tự điền từ họ tên (chỉ khi chưa sửa tay). Người dùng vẫn sửa được.
  const emailTouched = useRef(false);
  const onNameChange = (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, fullName: v, email: emailTouched.current ? f.email : (slugify(v) ? `${slugify(v)}@biensovip.com` : '') }));
  };
  const onEmailChange = (e) => { emailTouched.current = true; setForm((f) => ({ ...f, email: e.target.value })); };
  const togglePerm = (perm) => (v) => setForm((f) => {
    const next = new Set(f.permissions);
    if (v) next.add(perm); else next.delete(perm);
    return { ...f, permissions: [...next] };
  });

  const resetForm = () => {
    setForm({ fullName: '', email: '', password: '', role: 'staff', active: true, permissions: RECOMMENDED });
    emailTouched.current = false;
    setErr({}); setEditId(null);
  };

  const openAdd = () => { resetForm(); setOpen(true); };
  const openEdit = (x) => {
    setForm({ fullName: x.fullName || '', email: x.email, password: '', role: x.role, active: x.active, permissions: x.permissions || [] });
    emailTouched.current = true;
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
        await updateStaff.mutateAsync({ id: editId, role: form.role, active: form.active, permissions: form.role === 'super-admin' ? null : form.permissions });
        notify('Đã cập nhật nhân viên');
      } else {
        await createStaff.mutateAsync({ email, password: form.password, fullName: form.fullName.trim(), role: form.role, permissions: form.role === 'super-admin' ? null : form.permissions });
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
      notify('Đã vô hiệu hóa tài khoản');
    } catch (e) {
      if (e.status === 409) toast.error('Phải còn ít nhất một tài khoản super-admin');
      else toast.error(e.message || 'Lỗi khi xóa');
    }
    setDelId(null);
  };

  const toggleActive = async (x) => {
    try {
      await updateStaff.mutateAsync({ id: x.id, active: !x.active });
      notify(x.active ? 'Đã vô hiệu hóa tài khoản' : 'Đã kích hoạt tài khoản');
    } catch (e) {
      if (e.status === 409) toast.error('Phải còn ít nhất một tài khoản super-admin');
      else toast.error(e.message || 'Lỗi khi cập nhật');
    }
  };

  const me = loadAuth()?.user;
  const isSelf = (x) => me && (x.id === me.id || (me.email && x.email === me.email));
  const delTarget = items.find((x) => x.id === delId);

  const handleToggleActive = (x) => {
    if (isSelf(x) && x.active) { setSelfAction({ type: 'deactivate', id: x.id }); return; }
    toggleActive(x);
  };

  const handleDelete = (x) => {
    if (isSelf(x)) { setSelfAction({ type: 'delete', id: x.id }); return; }
    setDelId(x.id);
  };

  const confirmSelf = async () => {
    if (!selfAction) return;
    try {
      if (selfAction.type === 'delete') await deleteStaff.mutateAsync(selfAction.id);
      else await updateStaff.mutateAsync({ id: selfAction.id, active: false });
    } catch (e) {
      toast.error(e.message || 'Lỗi khi cập nhật');
    }
    setSelfAction(null);
    clearAuth();
    window.location.reload();
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
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{x.fullName || '—'}{isSelf(x) && <span style={{ padding: '1px 7px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-tint-cream)', color: 'var(--action-primary)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)' }}>Bạn</span>}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{x.email}</span>
                </span>
              </span>
              <span style={{ flex: '1 1 110px', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: ROLE_FG[x.role] || 'var(--text-strong)' }}>{ROLE_LABEL[x.role] || x.role}</span>
              <span style={{ flex: '1 1 80px' }}><Switch checked={x.active} onChange={() => handleToggleActive(x)} /></span>
              <span style={{ flex: '0 0 72px', display: 'flex', gap: 'var(--space-2)' }}>
                <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEdit(x)} />
                <IconButton name="trash-2" label="Vô hiệu hóa" size="sm" onClick={() => handleDelete(x)} />
              </span>
            </div>
          ))}
          </div>
          </div>
          {rows.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{query ? 'Không có nhân viên nào khớp tìm kiếm.' : 'Chưa có nhân viên nào.'}</div>}
        </div>
      )}

      {/* Create/Edit modal */}
      <Drawer open={open} onClose={() => setOpen(false)} title={editId ? 'Sửa nhân viên' : 'Thêm nhân viên'} width="min(52%, 720px)">
        <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{editId ? 'Cập nhật thông tin và quyền truy cập.' : 'Nhân viên sẽ có quyền đăng nhập trang quản trị.'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.fullName} error={err.fullName} onChange={onNameChange} />
          <Input label="Email" type="email" placeholder="a@biensovip.com" value={form.email} error={err.email} onChange={onEmailChange} disabled={!!editId} />
          {!editId && <Input label="Mật khẩu" type="password" placeholder="Tối thiểu 6 ký tự" value={form.password} error={err.password} onChange={field('password')} />}
          <Select label="Vai trò" value={form.role} options={ROLE_OPTS} onChange={field('role')} />
          <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Quản trị viên có toàn quyền truy cập mọi mục. Nhân viên chỉ vào được các mục được cấp quyền bên dưới.
          </p>
          {form.role !== 'super-admin' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0 0 var(--space-2)' }}>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Quyền truy cập</span>
                <button type="button" onClick={() => setForm((f) => ({ ...f, permissions: RECOMMENDED }))} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Đặt mặc định</button>
              </div>
              <div style={{ border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 48px)', background: 'var(--surface-sunken)', padding: '8px 12px', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', color: 'var(--text-muted)' }}>
                  <span>Chức năng</span>
                  {PERM_ACTIONS.map(([, l]) => <span key={l} style={{ textAlign: 'center' }}>{l}</span>)}
                </div>
                {PERM_RESOURCES.map(([r, label]) => (
                  <div key={r} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 48px)', alignItems: 'center', padding: '6px 12px', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
                    <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{label}</span>
                    {PERM_ACTIONS.map(([a]) => {
                      const perm = `${r}:${a}`;
                      return (
                        <label key={a} style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" checked={form.permissions.includes(perm)} onChange={(e) => togglePerm(perm)(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} aria-label={`${label} ${a}`} />
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 'var(--space-2)' }}>
                <input type="checkbox" checked={form.permissions.includes('plates_cost:view')} onChange={(e) => togglePerm('plates_cost:view')(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Xem giá vốn biển số<InfoTip size={12} text="Cho phép nhân viên này xem/nhập giá vốn nội bộ của biển số — không liên quan giá bán công khai." /></span>
              </label>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', flex: 1 }}>Hoạt động</span>
            <Switch checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={save} disabled={saving}>{saving ? 'Đang lưu…' : editId ? 'Lưu thay đổi' : 'Thêm nhân viên'}</Button>
          </div>
        </div>
      </Drawer>

      {/* Deactivate confirmation modal */}
      <Modal open={!!delId} onClose={() => setDelId(null)} title="Xác nhận vô hiệu hóa" maxWidth="380px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Tài khoản <b>{delTarget ? (delTarget.fullName || delTarget.email) : ''}</b> sẽ bị vô hiệu hóa và đăng xuất khỏi tất cả phiên. Bạn có thể kích hoạt lại sau.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setDelId(null)}>Hủy</Button>
            <Button variant="danger" size="md" onClick={confirmDelete}>Vô hiệu hóa</Button>
          </div>
        </div>
      </Modal>

      {/* Self-lock guard: hành động trên chính tài khoản đang đăng nhập */}
      <Modal open={!!selfAction} onClose={() => setSelfAction(null)} title="Cảnh báo" maxWidth="400px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Bạn đang thực hiện thao tác trên chính tài khoản đang đăng nhập. Hành động này sẽ đăng xuất bạn ngay lập tức. Bạn có chắc chắn muốn tiếp tục?</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setSelfAction(null)}>Hủy</Button>
            <Button variant="danger" size="md" onClick={confirmSelf}>Tiếp tục</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
