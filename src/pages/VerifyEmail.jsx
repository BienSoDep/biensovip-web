import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import Button from '../components/Button.jsx';
import { verifyEmail } from '../services/authService.js';

export default function VerifyEmail({ go }) {
  // Capture token once at mount (before router normalizes away the query string).
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [status, setStatus] = useState('loading'); // loading | ok | fail
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('fail'); setMsg('Thiếu mã xác thực trong liên kết.'); return; }
    verifyEmail(token)
      .then(() => setStatus('ok'))
      .catch((e) => { setStatus('fail'); setMsg(e.message || 'Xác thực thất bại, liên kết có thể đã hết hạn.'); });
  }, [token]);

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--pad-page)', background: 'var(--surface-page)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', maxWidth: 420, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
        {status === 'loading' && (
          <>
            <p style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Đang xác thực email…</p>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Vui lòng chờ trong giây lát.</p>
          </>
        )}
        {status === 'ok' && (
          <>
            <CheckCircle2 size={48} style={{ color: 'var(--status-success)' }} />
            <p style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Xác thực thành công</p>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Email của bạn đã được xác nhận. Hãy đăng nhập để bắt đầu.</p>
            <Button variant="primary" size="lg" fullWidth onClick={go('login')}>Đăng nhập</Button>
          </>
        )}
        {status === 'fail' && (
          <>
            <XCircle size={48} style={{ color: 'var(--status-danger)' }} />
            <p style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Xác thực thất bại</p>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{msg}</p>
            <Button variant="outline" size="lg" fullWidth onClick={go('home')}>Về trang chủ</Button>
          </>
        )}
      </div>
    </section>
  );
}
