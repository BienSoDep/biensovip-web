import { SearchX } from 'lucide-react';

export default function NotFound({ go }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-5)', padding: 'var(--pad-page)', textAlign: 'center', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SearchX size={32} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', color: 'var(--text-strong)' }}>404 — Trang không tồn tại</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>Trang bạn tìm không có hoặc đã bị xóa.</p>
      </div>
      <button onClick={go('home')} style={{ border: '1px solid var(--border-heavy)', borderRadius: 'var(--radius-pill)', background: 'transparent', color: 'var(--text-strong)', padding: '10px 24px', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' }}>Về trang chủ</button>
    </div>
  );
}
