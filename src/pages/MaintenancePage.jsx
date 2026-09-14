import { Wrench } from 'lucide-react';
import Button from '../components/Button.jsx';
import ContactChannelList from '../components/ContactChannelList.jsx';
import { formatDateTime } from '../lib/date.js';

// Trang thay thế toàn màn hình khi 1 screen public đang bật bảo trì (xem App.jsx — check qua
// usePublicMaintenance, bypass cho admin đang đăng nhập). info = 1 item từ GET /api/maintenance.
// Trước chỉ có 1 nút Zalo (nếu contact.zalo có) — nay dùng đủ 4 kênh (Zalo/Gọi/Facebook/TikTok)
// giống các trang lỗi khác, vì contact.zalo có thể trống trong khi content.info.* luôn có sẵn.
export default function MaintenancePage({ info, go, notify }) {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-8)', padding: 'var(--pad-page)' }}>
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
        <Button variant="primary" onClick={go('home')} style={{ marginTop: 'var(--space-2)' }}>Về trang chủ</Button>
      </div>

      <div style={{ width: '100%', maxWidth: 560 }}>
        <p style={{ margin: '0 0 var(--space-3)', font: 'var(--type-body-sm)', color: 'var(--text-muted)', textAlign: 'center' }}>Cần hỗ trợ ngay? Liên hệ shop qua các kênh sau:</p>
        <ContactChannelList notify={notify} zaloSource="maintenance_page" />
      </div>
    </div>
  );
}
