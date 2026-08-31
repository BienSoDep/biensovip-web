import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';

const MESSAGES = {
  access_denied: 'Bạn đã từ chối cấp quyền Google.',
  invalid_state: 'Phiên liên kết đã hết hạn, vui lòng thử lại.',
  no_refresh_token: 'Google không trả về quyền truy cập đầy đủ — thử liên kết lại và chọn "Cho phép".',
  exchange_failed: 'Không thể hoàn tất liên kết với Google. Vui lòng thử lại.',
};

// UC30 — trang đích sau khi Google redirect về từ oauth-callback (backend). Chỉ đọc query string,
// không gọi API nào — trạng thái liên kết thật đã được ghi ở backend trước khi redirect tới đây.
export default function GmailCallback({ go }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('linked') === '1') setResult({ ok: true });
    else setResult({ ok: false, message: MESSAGES[params.get('error')] || 'Có lỗi xảy ra khi liên kết Google.' });
  }, []);

  useEffect(() => {
    if (!result?.ok) return;
    const t = setTimeout(() => go('collab')(), 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return (
    <section style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minHeight: '60vh', justifyContent: 'center' }}>
      {result?.ok ? (
        <>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Đã liên kết Gmail thành công</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Bạn có thể quay lại trang cài đặt để bắt đầu gửi email cho khách.</span>
        </>
      ) : result ? (
        <>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--status-danger)' }}>Liên kết thất bại</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{result.message}</span>
        </>
      ) : (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang xử lý…</span>
      )}
      <Button variant="primary" size="md" onClick={go('collab')}>Quay lại trang CTV</Button>
    </section>
  );
}
