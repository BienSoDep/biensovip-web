import { useState, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Users, ShieldCheck, UserCheck, UserX, Search,
  X, RotateCw, Plus, Pencil, KeyRound, Trash2,
  Lock, Unlock, Shield, AlertTriangle, Check
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Input, Select, Switch, Avatar, InfoTip } from '../../components/index.jsx';
import {
  useAdminStaff, useCreateStaff, useUpdateStaff,
  useDeleteStaff, useResetStaffPassword
} from '../../services/adminStaff.js';
import { loadAuth, clearAuth } from '../../lib/authStore.js';
import Modal from '../../components/Modal.jsx';
import Drawer from '../../components/Drawer.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { formatDate } from '../../lib/date.js';

const ROLE_OPTS = [
  { value: 'staff', label: 'Nhân viên vận hành' },
  { value: 'super-admin', label: 'Quản trị viên (Super Admin)' },
];
const ROLE_LABEL = { 'super-admin': 'Quản trị viên', staff: 'Nhân viên' };

// Nhóm theo loại nghiệp vụ — cho phép chọn nhanh cả nhóm
const PERM_GROUPS = [
  ['Kinh doanh & Bán hàng', [
    ['plates', 'Biển số'], ['categories', 'Danh mục'], ['transactions', 'Giao dịch'],
    ['contacts', 'Yêu cầu liên hệ'], ['customers', 'Khách hàng'], ['collaborators', 'Cộng tác viên'],
    ['ctv_message_templates', 'Mẫu tin nhắn CTV'], ['reviews', 'Đánh giá'],
  ]],
  ['Nội dung & Marketing', [
    ['posts', 'Bài viết'], ['videos', 'Video'], ['meanings', 'Ý nghĩa phong thủy'],
    ['notifications', 'Thông báo'], ['email_templates', 'Mẫu email'], ['subscribers', 'Người đăng ký nhận tin'],
    ['policy_pages', 'Trang chính sách'], ['chatbot', 'Trợ lý AI'],
  ]],
  ['Kỹ thuật & Hệ thống', [
    ['maintenance', 'Bảo trì hệ thống'], ['vanity_metrics', 'Số liệu hiển thị'],
    ['audit_logs', 'Nhật ký audit'], ['error_logs', 'Nhật ký lỗi hệ thống'],
    ['db_console', 'DB console (chỉ xem)'], ['feature_flags', 'Feature flags'],
  ]],
];
const PERM_RESOURCES = PERM_GROUPS.flatMap(([, items]) => items);
const PERM_ACTIONS = [['view', 'Xem'], ['create', 'Thêm'], ['update', 'Sửa'], ['delete', 'Xóa']];
const RECOMMENDED = PERM_RESOURCES.flatMap(([r]) => ['view', 'create', 'update'].map((a) => `${r}:${a}`));
const DEV_PRESET = [
  ...PERM_RESOURCES.filter(([r]) => r !== 'feature_flags').map(([r]) => `${r}:view`),
  'feature_flags:view', 'feature_flags:update',
];

const slugify = (s) => (s || '').toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

export default function AdminStaff({ notify }) {
  const { data, isLoading, isError, refetch } = useAdminStaff();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();
  const resetStaffPassword = useResetStaffPassword();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [delId, setDelId] = useState(null);
  const [selfAction, setSelfAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pwId, setPwId] = useState(null);
  const [pwValue, setPwValue] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [lockTarget, setLockTarget] = useState(null);
  const [lockReason, setLockReason] = useState('');
  const [sendLockEmail, setSendLockEmail] = useState(false);

  // Bộ lọc
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all | super-admin | staff | active | inactive

  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'staff', active: true, permissions: RECOMMENDED });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);

  const items = data?.items || [];

  // Lọc theo từ khóa và vai trò/trạng thái
  const rows = useMemo(() => {
    let result = items;
    if (roleFilter === 'super-admin') result = result.filter((x) => x.role === 'super-admin');
    else if (roleFilter === 'staff') result = result.filter((x) => x.role === 'staff');
    else if (roleFilter === 'active') result = result.filter((x) => x.active);
    else if (roleFilter === 'inactive') result = result.filter((x) => !x.active);

    const query = q.trim().toLowerCase();
    if (query) {
      result = result.filter((x) =>
        (x.fullName || '').toLowerCase().includes(query) ||
        (x.email || '').toLowerCase().includes(query) ||
        (x.phone || '').toLowerCase().includes(query)
      );
    }
    return result;
  }, [items, roleFilter, q]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = items.length;
    const superAdminCount = items.filter((x) => x.role === 'super-admin').length;
    const staffCount = items.filter((x) => x.role === 'staff').length;
    const activeCount = items.filter((x) => x.active).length;
    const lockedCount = items.filter((x) => !x.active).length;
    return { total, superAdminCount, staffCount, activeCount, lockedCount };
  }, [items]);

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e && e.target ? e.target.value : e }));

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

  const toggleGroup = (resources) => (v) => setForm((f) => {
    const next = new Set(f.permissions);
    for (const [r] of resources) {
      for (const a of ['view', 'create', 'update']) {
        const perm = `${r}:${a}`;
        if (v) next.add(perm); else next.delete(perm);
      }
    }
    return { ...f, permissions: [...next] };
  });

  const isGroupChecked = (resources) => resources.every(([r]) => ['view', 'create', 'update'].every((a) => form.permissions.includes(`${r}:${a}`)));

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
        notify('Đã thêm nhân viên mới');
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
    if (!delId || busy) return;
    setBusy(true);
    try {
      await deleteStaff.mutateAsync(delId);
      notify('Đã vô hiệu hóa tài khoản');
    } catch (e) {
      if (e.status === 409) toast.error('Phải còn ít nhất một tài khoản super-admin');
      else toast.error(e.message || 'Lỗi khi xóa');
    } finally {
      setBusy(false);
    }
    setDelId(null);
  };

  const openResetPassword = (x) => { setPwId(x.id); setPwValue(''); setPwErr(''); };
  const confirmResetPassword = async () => {
    if (!pwValue || pwValue.length < 6) { setPwErr('Mật khẩu tối thiểu 6 ký tự.'); return; }
    setPwSaving(true);
    try {
      await resetStaffPassword.mutateAsync({ id: pwId, newPassword: pwValue });
      notify('Đã đổi mật khẩu thành công');
      setPwId(null);
    } catch (e) {
      setPwErr(e.message || 'Lỗi khi đổi mật khẩu.');
    } finally {
      setPwSaving(false);
    }
  };
  const pwTarget = items.find((x) => x.id === pwId);

  const toggleActive = async (x, reason, sendEmail) => {
    if (busy) return;
    setBusy(true);
    try {
      await updateStaff.mutateAsync({ id: x.id, active: !x.active, suspendReason: x.active ? reason : undefined, sendEmail: x.active ? sendEmail : undefined });
      notify(x.active ? 'Đã vô hiệu hóa tài khoản' : 'Đã kích hoạt tài khoản');
    } catch (e) {
      if (e.status === 409) toast.error('Phải còn ít nhất một tài khoản super-admin');
      else toast.error(e.message || 'Lỗi khi cập nhật');
    } finally {
      setBusy(false);
    }
  };

  const me = loadAuth()?.user;
  const isSelf = (x) => me && (x.id === me.id || (me.email && x.email === me.email));
  const delTarget = items.find((x) => x.id === delId);

  const handleToggleActive = (x) => {
    if (isSelf(x) && x.active) { setSelfAction({ type: 'deactivate', id: x.id }); return; }
    if (x.active) { setLockReason(''); setSendLockEmail(false); setLockTarget({ id: x.id, hasEmail: !!x.email }); return; }
    toggleActive(x);
  };

  const confirmLockStaff = () => {
    const x = items.find((i) => i.id === lockTarget?.id);
    if (!x) { setLockTarget(null); return; }
    toggleActive(x, lockReason.trim() || undefined, sendLockEmail);
    setLockTarget(null);
  };

  const handleDelete = (x) => {
    if (isSelf(x)) { setSelfAction({ type: 'delete', id: x.id }); return; }
    setDelId(x.id);
  };

  const confirmSelf = async () => {
    if (!selfAction || busy) return;
    setBusy(true);
    try {
      if (selfAction.type === 'delete') await deleteStaff.mutateAsync(selfAction.id);
      else await updateStaff.mutateAsync({ id: selfAction.id, active: false });
    } catch (e) {
      toast.error(e.message || 'Lỗi khi cập nhật');
      setBusy(false);
      return;
    }
    setSelfAction(null);
    clearAuth();
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 4 Thẻ KPI Thống kê nhân sự */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        <div
          onClick={() => setRoleFilter('all')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: roleFilter === 'all' ? '2px solid var(--action-primary)' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng nhân viên</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)' }}>{stats.total}</div>
          </div>
        </div>

        <div
          onClick={() => setRoleFilter('super-admin')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: roleFilter === 'super-admin' ? '2px solid #7c3aed' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Quản trị viên (Super Admin)</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#7c3aed' }}>{stats.superAdminCount}</div>
          </div>
        </div>

        <div
          onClick={() => setRoleFilter('staff')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: roleFilter === 'staff' ? '2px solid #2563eb' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Nhân viên vận hành</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#2563eb' }}>{stats.staffCount}</div>
          </div>
        </div>

        <div
          onClick={() => setRoleFilter('active')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: roleFilter === 'active' ? '2px solid #059669' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang hoạt động</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#059669' }}>
              {stats.activeCount} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-faint)' }}>({stats.lockedCount} khóa)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar & Action */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-card)',
        padding: '14px 18px',
        boxShadow: 'var(--shadow-inset-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
      }}>
        {/* Tab Pills theo vai trò */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Tất cả', count: stats.total },
            { id: 'super-admin', label: 'Quản trị viên', count: stats.superAdminCount },
            { id: 'staff', label: 'Nhân viên', count: stats.staffCount },
            { id: 'active', label: 'Hoạt động', count: stats.activeCount },
            { id: 'inactive', label: 'Bị khóa', count: stats.lockedCount, alert: stats.lockedCount > 0 },
          ].map((t) => {
            const active = roleFilter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setRoleFilter(t.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'var(--action-dark)' : 'var(--surface-sunken)',
                  color: active ? 'var(--white)' : 'var(--text-body)',
                  font: 'var(--type-body-sm)',
                  fontWeight: active ? 600 : 500,
                  transition: 'all 120ms ease',
                }}
              >
                <span>{t.label}</span>
                <span style={{
                  padding: '1px 7px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  background: active ? 'rgba(255, 255, 255, 0.22)' : t.alert ? '#fee2e2' : 'var(--border-hairline)',
                  color: active ? 'var(--white)' : t.alert ? '#b91c1c' : 'var(--text-muted)',
                }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tìm kiếm & Nút thêm nhân viên */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
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
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            title="Làm mới"
            style={{
              height: 36,
              width: 36,
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
            <RotateCw size={14} />
          </button>

          <Button
            variant="primary"
            size="md"
            onClick={openAdd}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36 }}
          >
            <Plus size={16} />
            <span>Thêm nhân viên</span>
          </Button>
        </div>
      </div>

      {/* Main Staff Table */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--gutter-card)' }}><SkeletonTable rows={5} cols={6} /></div>
        ) : isError ? (
          <div style={{ padding: 48, textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <span>Lỗi tải danh sách nhân viên.</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Users size={36} style={{ color: 'var(--text-faint)' }} />
            <div style={{ font: 'var(--type-body)', fontWeight: 600, color: 'var(--text-strong)' }}>
              Không tìm thấy nhân viên
            </div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              {q ? 'Không có nhân sự nào khớp với từ khóa tìm kiếm.' : 'Chưa có nhân sự nào trong danh mục này.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ minWidth: 840 }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(240px, 2.2fr) minmax(130px, 1.2fr) minmax(130px, 1.2fr) minmax(110px, 1fr) minmax(140px, 1.2fr) 90px 140px',
                padding: '12px 20px',
                background: 'var(--surface-sunken)',
                font: 'var(--type-caption)',
                fontSize: 11,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontWeight: 700,
                alignItems: 'center',
              }}>
                <span>Nhân sự</span>
                <span>Số điện thoại</span>
                <span>Vai trò</span>
                <span>Quyền hạn</span>
                <span>Đăng nhập cuối</span>
                <span>Trạng thái</span>
                <span style={{ textAlign: 'right' }}>Thao tác</span>
              </div>

              {/* Rows */}
              {rows.map((x, idx) => {
                const self = isSelf(x);
                const isSuper = x.role === 'super-admin';

                return (
                  <div
                    key={x.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(240px, 2.2fr) minmax(130px, 1.2fr) minmax(130px, 1.2fr) minmax(110px, 1fr) minmax(140px, 1.2fr) 90px 140px',
                      padding: '14px 20px',
                      alignItems: 'center',
                      borderBottom: idx < rows.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                      transition: 'background 120ms ease',
                      background: !x.active ? 'rgba(239, 68, 68, 0.02)' : 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-sunken)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = !x.active ? 'rgba(239, 68, 68, 0.02)' : 'transparent'}
                  >
                    {/* Name & Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={x.fullName || x.email} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ font: 'var(--type-body)', fontWeight: 600, color: 'var(--text-strong)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {x.fullName || '—'}
                          </span>
                          {self && (
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-pill)',
                              background: 'var(--action-primary)',
                              color: '#fff',
                              fontSize: 10,
                              fontWeight: 700,
                            }}>
                              Bạn
                            </span>
                          )}
                        </div>
                        <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {x.email}
                        </div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
                      {x.phone || '—'}
                    </div>

                    {/* Role Badge */}
                    <div>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: 12,
                        fontWeight: 600,
                        background: isSuper ? 'rgba(124, 58, 237, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: isSuper ? '#7c3aed' : '#2563eb',
                        border: isSuper ? '1px solid rgba(124, 58, 237, 0.25)' : '1px solid rgba(59, 130, 246, 0.25)',
                      }}>
                        {isSuper ? <ShieldCheck size={12} /> : <Users size={12} />}
                        {ROLE_LABEL[x.role] || x.role}
                      </span>
                    </div>

                    {/* Permission count */}
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      {isSuper ? (
                        <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>Toàn quyền</span>
                      ) : (
                        <span>{x.permissions?.length || 0} quyền hạn</span>
                      )}
                    </div>

                    {/* Last login */}
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      {x.lastLoginAt ? formatDate(x.lastLoginAt) : 'Chưa đăng nhập'}
                    </div>

                    {/* Active Switch */}
                    <div>
                      <Switch
                        checked={x.active}
                        disabled={busy}
                        onChange={() => handleToggleActive(x)}
                      />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => openEdit(x)}
                        title="Chỉnh sửa thông tin & phân quyền"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--radius-field)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-body)',
                          transition: 'background 120ms ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openResetPassword(x)}
                        title="Cấp lại mật khẩu"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--radius-field)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#d97706',
                          transition: 'background 120ms ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <KeyRound size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(x)}
                        disabled={busy}
                        title="Vô hiệu hóa tài khoản"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--radius-field)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#dc2626',
                          transition: 'background 120ms ease',
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
          </div>
        )}
      </div>

      {/* Drawer: Thêm / Sửa nhân viên */}
      <Drawer open={open} onClose={() => setOpen(false)} title={editId ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'} width="min(52%, 720px)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2) 0' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            {editId ? 'Cập nhật thông tin tài khoản và ma trận quyền hạn truy cập các chức năng.' : 'Tài khoản nhân viên sau khi thêm sẽ có quyền đăng nhập vào trang quản trị.'}
          </p>

          <Input
            label="Họ và tên"
            placeholder="VD: Nguyễn Văn An"
            value={form.fullName}
            error={err.fullName}
            onChange={onNameChange}
            required
          />

          <Input
            label="Email tài khoản"
            type="email"
            placeholder="an@biensovip.com"
            value={form.email}
            error={err.email}
            onChange={onEmailChange}
            disabled={!!editId}
            hint={editId ? 'Email là định danh tài khoản, không thể đổi sau khi tạo' : undefined}
            required
          />

          {!editId && (
            <Input
              label="Mật khẩu khởi tạo"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={form.password}
              error={err.password}
              onChange={field('password')}
              required
            />
          )}

          <Select
            label="Vai trò nhân sự"
            value={form.role}
            options={ROLE_OPTS}
            onChange={field('role')}
          />

          {form.role === 'super-admin' ? (
            <div style={{ padding: '12px 16px', background: 'rgba(124, 58, 237, 0.08)', borderRadius: 'var(--radius-field)', border: '1px solid rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={20} color="#7c3aed" />
              <span style={{ fontSize: 13, color: '#6d28d9', fontWeight: 500 }}>
                Quản trị viên (Super Admin) có toàn quyền xem, thêm, sửa, xóa trên mọi phân hệ hệ thống.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: 'var(--type-label)', fontWeight: 700, color: 'var(--text-strong)' }}>
                  Ma trận phân quyền chức năng
                </span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, permissions: RECOMMENDED }))} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>
                    Mặc định (Xem + Sửa)
                  </button>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, permissions: DEV_PRESET }))} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>
                    Chỉ xem (Dev)
                  </button>
                </div>
              </div>

              <div style={{ border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 52px)', background: 'var(--surface-sunken)', padding: '10px 14px', font: 'var(--type-caption)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  <span>Phân hệ</span>
                  {PERM_ACTIONS.map(([, l]) => <span key={l} style={{ textAlign: 'center' }}>{l}</span>)}
                </div>

                {PERM_GROUPS.map(([groupLabel, resources]) => (
                  <div key={groupLabel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-hairline)' }}>
                      <span style={{ font: 'var(--type-caption)', fontWeight: 700, color: 'var(--text-strong)' }}>{groupLabel}</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>
                        <input
                          type="checkbox"
                          checked={isGroupChecked(resources)}
                          onChange={(e) => toggleGroup(resources)(e.target.checked)}
                          style={{ width: 15, height: 15, accentColor: 'var(--action-primary)' }}
                        />
                        Chọn cả nhóm
                      </label>
                    </div>

                    {resources.map(([r, label]) => (
                      <div key={r} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 52px)', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid var(--border-hairline)' }}>
                        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{label}</span>
                        {PERM_ACTIONS.map(([a]) => {
                          const perm = `${r}:${a}`;
                          return (
                            <label key={a} style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={form.permissions.includes(perm)}
                                onChange={(e) => togglePerm(perm)(e.target.checked)}
                                style={{ width: 17, height: 17, accentColor: 'var(--action-primary)' }}
                              />
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={form.permissions.includes('plates_cost:view')}
                  onChange={(e) => togglePerm('plates_cost:view')(e.target.checked)}
                  style={{ width: 17, height: 17, accentColor: 'var(--action-primary)' }}
                />
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
                  Xem giá vốn nội bộ biển số <InfoTip size={12} text="Cho phép nhân viên này xem/nhập giá vốn nhập biển số." />
                </span>
              </label>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 600, color: 'var(--text-strong)', flex: 1 }}>
              Kích hoạt tài khoản
            </span>
            <Switch checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 8, borderTop: '1px solid var(--border-hairline)', paddingTop: 16 }}>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)}>Hủy bỏ</Button>
            <Button variant="primary" size="md" onClick={save} disabled={saving}>
              {saving ? 'Đang lưu…' : editId ? 'Lưu thay đổi' : 'Thêm nhân viên'}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal Cấp lại mật khẩu */}
      {pwId && (
        <Modal open onClose={() => setPwId(null)} title="Cấp lại mật khẩu nhân viên" maxWidth="420px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              Đổi mật khẩu cho nhân viên <strong>{pwTarget?.fullName || pwTarget?.email}</strong>:
            </p>
            <Input
              label="Mật khẩu mới"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={pwValue}
              error={pwErr}
              onChange={(e) => setPwValue(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 8 }}>
              <Button variant="ghost" size="md" onClick={() => setPwId(null)}>Hủy bỏ</Button>
              <Button variant="primary" size="md" onClick={confirmResetPassword} loading={pwSaving}>
                Cập nhật mật khẩu
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Xác nhận vô hiệu hóa (khóa) */}
      <Modal open={!!delId} onClose={() => setDelId(null)} title="Xác nhận vô hiệu hóa tài khoản" maxWidth="400px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
            Tài khoản <strong>{delTarget ? (delTarget.fullName || delTarget.email) : ''}</strong> sẽ bị vô hiệu hóa và đăng xuất ngay lập tức khỏi mọi phiên đăng nhập.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setDelId(null)}>Hủy bỏ</Button>
            <Button variant="danger" size="md" onClick={confirmDelete} disabled={busy} loading={busy}>
              Xác nhận vô hiệu hóa
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Lý do vô hiệu hóa khi gạt công tắc Switch */}
      <Modal open={!!lockTarget} onClose={() => setLockTarget(null)} title="Vô hiệu hóa tài khoản nhân sự" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Ghi rõ lý do tạm ngưng hoạt động tài khoản này để lưu vết nhật ký:
          </p>
          <input
            type="text"
            placeholder="Lý do vô hiệu hóa (tùy chọn)…"
            value={lockReason}
            onChange={(e) => setLockReason(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-field)',
              border: '1px solid var(--border-hairline)',
              font: 'var(--type-body-sm)'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setLockTarget(null)}>Hủy bỏ</Button>
            <Button variant="primary" size="md" onClick={confirmLockStaff} style={{ background: '#dc2626', borderColor: '#dc2626' }}>
              Khóa tài khoản
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tự khóa tài khoản của chính mình */}
      <Modal open={!!selfAction} onClose={() => setSelfAction(null)} title="Cảnh báo: Thao tác trên chính tài khoản của bạn" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#dc2626' }}>
            <AlertTriangle size={24} />
            <span style={{ fontWeight: 700 }}>Bạn đang tự thao tác trên chính tài khoản của mình!</span>
          </div>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
            Nếu tiếp tục, bạn sẽ bị đăng xuất khỏi hệ thống quản trị ngay lập tức.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setSelfAction(null)}>Hủy bỏ</Button>
            <Button variant="danger" size="md" onClick={confirmSelf} disabled={busy} loading={busy}>
              Tiếp tục thao tác
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
