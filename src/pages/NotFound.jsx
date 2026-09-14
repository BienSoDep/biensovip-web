import { useEffect } from 'react';
import Button from '../components/Button.jsx';
import ContactChannelList from '../components/ContactChannelList.jsx';
import NotFoundIllustration from '../components/NotFoundIllustration.jsx';
import { contentGet } from '../lib/content/index.js';

// Trang lỗi (404/500/bảo trì/crash) là nơi user dễ bỏ cuộc nhất — thêm đủ kênh liên hệ (không chỉ
// 1 nút Zalo) để họ còn cách khác báo lỗi/hỏi hàng thay vì rời site (audit UI/UX 14/09/2026).
// Nền trắng (không còn --surface-inverse tối) + minh họa SVG tự vẽ thay set-piece vòng tròn cam cũ.
export default function NotFound({ go, notify }) {
  useEffect(() => { document.title = 'Trang không tìm thấy · Biensovip'; }, []);
  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: '70vh', background: 'var(--surface-page)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-6)', padding: 'var(--space-9) 0', animation: 'pageIn 180ms var(--ease-out)' }}>
      <NotFoundIllustration />

      <div style={{ position: 'relative', width: '100%', maxWidth: 'var(--width-content)', padding: '0 var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)' }}>
        <span style={{ font: 'var(--fw-extrabold) clamp(48px,10vw,84px)/1 var(--font-display)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{contentGet('common.notfound.code')}</span>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 560 }}>{contentGet('common.notfound.desc')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-3)' }}>
          <Button variant="primary" size="lg" onClick={go('home')}>{contentGet('common.notfound.cta_home')}</Button>
          <Button variant="outline" size="lg" onClick={go('list')}>Xem kho biển số</Button>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 860, padding: '0 var(--pad-page)' }}>
        <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-muted)', textAlign: 'center' }}>Không tìm thấy trang cần đến? Liên hệ shop qua các kênh sau:</p>
        <div className="notfound-channels">
          <ContactChannelList notify={notify} zaloSource="404_page" />
        </div>
      </div>
    </section>
  );
}
