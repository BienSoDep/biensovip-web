import { useState } from 'react';
import { Phone, X, MessageCircle } from 'lucide-react';
import { content } from '../lib/content/index.js';
import { logZaloClick } from '../services/zaloClicks.js';
import { toZaloUrl } from '../lib/zaloMessage.js';
import ZaloIcon from './ZaloIcon.jsx';
import FacebookIcon from './FacebookIcon.jsx';
import { useHideOnScroll } from '../hooks/useHideOnScroll.js';

// Nút liên hệ nổi gộp — bấm mở ra 3 kênh (Zalo/Gọi điện/Facebook) thay vì rải 2-3 nút nổi cùng lúc
// (trước đây chỉ có 1 nút Zalo nổi, icon vẽ tay không giống logo Zalo thật).
export default function ContactFab({ zalo, phone }) {
  const [open, setOpen] = useState(false);
  // Ẩn tạm lúc cuộn — 2 FAB (nút này + AiChatbot) cộng lại chiếm khá nhiều diện tích góc phải trên
  // màn hình hẹp, che nội dung bên dưới suốt lúc cuộn vì fixed không nhường chỗ được.
  const scrolling = useHideOnScroll();
  const zaloNumber = (zalo || content.info.zalo || '').replace(/[^0-9]/g, '');
  const phoneNumber = (phone || content.info.phone || '').replace(/[^0-9]/g, '');
  const fbUrl = content.info.facebook_url;

  const items = [
    zaloNumber && { key: 'zalo', label: 'Zalo', bg: '#0068FF', Icon: ZaloIcon, href: toZaloUrl(zaloNumber), onClick: () => logZaloClick(null, 'contact_fab') },
    phoneNumber && { key: 'phone', label: 'Gọi điện', bg: 'var(--status-success-ink)', Icon: Phone, href: `tel:${phoneNumber}` },
    fbUrl && { key: 'facebook', label: 'Facebook', bg: '#1877F2', Icon: FacebookIcon, href: fbUrl, external: true },
  ].filter(Boolean);

  return (
    <div
      className="contact-fab-wrap"
      style={{
        position: 'fixed', bottom: 88, right: 20, zIndex: 80, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12,
        opacity: scrolling ? 0 : 1, transform: scrolling ? 'translateX(72px)' : 'translateX(0)', pointerEvents: scrolling ? 'none' : 'auto',
        transition: 'opacity 160ms var(--ease-standard), transform 160ms var(--ease-standard)',
      }}
    >
      {open && !scrolling && items.map((it, i) => (
        <a
          key={it.key}
          href={it.href}
          target={it.external ? '_blank' : undefined}
          rel={it.external ? 'noopener noreferrer' : undefined}
          onClick={it.onClick}
          aria-label={it.label}
          title={it.label}
          style={{
            width: 44, height: 44, borderRadius: '50%', background: it.bg, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-3)',
            textDecoration: 'none', animation: `contactFabIn 180ms var(--ease-out) ${i * 40}ms both`,
          }}
        >
          <it.Icon />
        </a>
      ))}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Đóng liên hệ nhanh' : 'Mở liên hệ nhanh'}
        aria-expanded={open}
        className={`contact-fab${open ? '' : ' contact-fab-bounce'}`}
        style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', background: '#0068FF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-3)', cursor: 'pointer', transition: 'transform 160ms var(--ease-out)' }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
