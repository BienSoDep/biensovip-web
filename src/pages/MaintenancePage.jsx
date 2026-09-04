import { Wrench } from 'lucide-react';
import Button from '../components/Button.jsx';
import { formatDateTime } from '../lib/date.js';

// Trang thay thế toàn màn hình khi 1 screen public đang bật bảo trì (xem App.jsx — check qua
// usePublicMaintenance, bypass cho admin đang đăng nhập). info = 1 item từ GET /api/maintenance.
export default function MaintenancePage({ info, go, contact }) {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--pad-page)' }}>
      <div style={{ maxWidth: 520, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-tint-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wrench size={28} color="var(--action-primary)" />
        </div>
        <h1 style={{ margin: 0, font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>{info?.title || 'Trang đang bảo trì'}</h1>
        {info?.message && (
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-body)', whiteSpace: 'pre-line' }}>{info.message}</p>
        )}
        {info?.expectedBackAt && (
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Dự kiến hoạt động lại: {formatDateTime(info.expectedBackAt)}
          </p>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
          <Button variant="primary" onClick={go('home')}>Về trang chủ</Button>
          {contact?.zalo && (
            <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noreferrer">
              <Button variant="outline">Nhắn Zalo hỗ trợ</Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
