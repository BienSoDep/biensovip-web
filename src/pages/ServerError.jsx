import { WifiOff } from 'lucide-react';
import Button from '../components/Button.jsx';

export default function ServerError({ go }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-5)', padding: 'var(--pad-page)', textAlign: 'center', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <WifiOff size={32} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', color: 'var(--text-strong)' }}>500 — Lỗi hệ thống</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>Đã có lỗi xảy ra. Vui lòng thử lại sau ít phút.</p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button variant="primary" size="md" onClick={() => window.location.reload()}>Thử lại</Button>
        <Button variant="outline" size="md" onClick={go('home')}>Về trang chủ</Button>
      </div>
    </div>
  );
}
