import { useState } from 'react';
import { useSubscribe } from '../services/subscribers.js';
import Button from './Button.jsx';

// Ô đăng ký email nhận thông báo — dùng chung ở footer và banner trang chủ. Mọi nơi ghi cùng 1 bảng
// subscriber (POST /api/subscribe) → "đồng bộ" 1 nguồn admin gửi broadcast được.
export default function EmailCapture({ source = 'newsletter', style }) {
  const subscribe = useSubscribe();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr('Nhập email hợp lệ.'); return; }
    setErr('');
    try {
      await subscribe.mutateAsync({ email: email.trim(), source });
      setEmail('');
      setDone(true);
    } catch (ex) {
      setErr(ex.message || 'Không đăng ký được. Thử lại sau.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {done ? (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--status-success)', fontWeight: 'var(--fw-semibold)' }}>
          ✓ Cảm ơn bạn đã đăng ký nhận thông báo.
        </span>
      ) : (
        <>
          <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email của bạn"
              aria-label="Email nhận thông báo"
              style={{
                flex: '1 1 180px', height: 44, border: 'none', borderRadius: 'var(--radius-pill)',
                background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)',
                padding: '0 16px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none',
              }}
            />
            <Button type="submit" variant="dark" size="md" disabled={subscribe.isPending}>
              {subscribe.isPending ? 'Đang gửi…' : 'Đăng ký'}
            </Button>
          </form>
          {err && <span role="alert" style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err}</span>}
        </>
      )}
    </div>
  );
}
