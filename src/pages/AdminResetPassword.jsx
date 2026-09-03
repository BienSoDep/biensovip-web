import { useState } from 'react';
import Button from '../components/Button.jsx';
import { Input } from '../components/index.jsx';
import { resetAdminPassword } from '../services/authService.js';

// Đích của link trong email "Quên mật khẩu quản trị" — đọc token từ query string (path router
// bỏ qua query, không phải bug: parseRoute() chỉ khớp path, trang tự đọc window.location.search
// giống pattern GmailCallback.jsx).
export default function AdminResetPassword({ go }) {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 6) { setErr('Mật khẩu tối thiểu 6 ký tự'); return; }
    if (pw !== pw2) { setErr('Mật khẩu nhập lại không khớp'); return; }
    setSaving(true);
    try {
      await resetAdminPassword(token, pw);
      setDone(true);
    } catch (e2) {
      setErr(e2?.message || 'Link đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới.');
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <section style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--space-4)' }}>
        <h1 style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)', margin: 0 }}>Link không hợp lệ</h1>
        <Button variant="primary" size="md" onClick={go('adminForgot')}>Yêu cầu link mới</Button>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--space-5)' }}>
      <h1 style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)', margin: 0 }}>Đặt lại mật khẩu quản trị</h1>
      {done ? (
        <>
          <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đổi mật khẩu thành công. Mọi phiên đăng nhập cũ đã bị đăng xuất.</p>
          <Button variant="primary" size="md" onClick={go('login')}>Đăng nhập lại</Button>
        </>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Mật khẩu mới" type="password" placeholder="Tối thiểu 6 ký tự" value={pw} onChange={(e) => { setPw(e.target.value); setErr(''); }} />
          <Input label="Nhập lại mật khẩu mới" type="password" value={pw2} error={err} onChange={(e) => { setPw2(e.target.value); setErr(''); }} />
          <Button type="submit" variant="primary" size="md" disabled={saving}>{saving ? 'Đang lưu…' : 'Đặt lại mật khẩu'}</Button>
        </form>
      )}
    </section>
  );
}
