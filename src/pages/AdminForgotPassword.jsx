import { useState } from 'react';
import Button from '../components/Button.jsx';
import { Input } from '../components/index.jsx';
import { requestAdminPasswordReset } from '../services/authService.js';

// Quên mật khẩu quản trị — link reset LUÔN gửi về hộp mail khôi phục cố định (duymc64@gmail.com),
// không phải email admin nhập vào, nên không cần báo "email không tồn tại" (tránh lộ thông tin).
export default function AdminForgotPassword({ go }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setErr('Vui lòng nhập email tài khoản quản trị'); return; }
    setSending(true);
    try {
      await requestAdminPasswordReset(email.trim());
      setSent(true);
    } catch {
      setSent(true); // vẫn báo đã gửi — tránh lộ email nào có tài khoản
    } finally {
      setSending(false);
    }
  };

  return (
    <section style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--space-5)' }}>
      <h1 style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)', margin: 0 }}>Quên mật khẩu quản trị</h1>
      {sent ? (
        <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Nếu email khớp một tài khoản quản trị, link đặt lại mật khẩu đã được gửi tới hộp mail khôi phục. Kiểm tra hộp mail và làm theo hướng dẫn (link có hiệu lực 5 phút).
        </p>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Email tài khoản quản trị" type="email" placeholder="admin@biensovip.com" value={email} error={err} onChange={(e) => { setEmail(e.target.value); setErr(''); }} />
          <Button type="submit" variant="primary" size="md" disabled={sending}>{sending ? 'Đang gửi…' : 'Gửi link đặt lại mật khẩu'}</Button>
        </form>
      )}
      <a href="#" onClick={(e) => { e.preventDefault(); go('login')(); }} style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', textDecoration: 'none' }}>← Quay lại đăng nhập</a>
    </section>
  );
}
