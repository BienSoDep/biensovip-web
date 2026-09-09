import { useState } from 'react';
import { Phone, X, MessageCircle } from 'lucide-react';
import { content } from '../lib/content/index.js';
import { logZaloClick } from '../services/zaloClicks.js';

function ZaloIcon(props) {
  return (
    <svg viewBox="0 0 48 48" width={22} height={22} {...props}>
      <text x="24" y="30" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="15" fill="currentColor">Zalo</text>
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

// Nút liên hệ nổi gộp — bấm mở ra 3 kênh (Zalo/Gọi điện/Facebook) thay vì rải 2-3 nút nổi cùng lúc
// (trước đây chỉ có 1 nút Zalo nổi, icon vẽ tay không giống logo Zalo thật).
export default function ContactFab({ zalo, phone }) {
  const [open, setOpen] = useState(false);
  const zaloNumber = (zalo || content.info.zalo || '').replace(/[^0-9]/g, '');
  const phoneNumber = (phone || content.info.phone || '').replace(/[^0-9]/g, '');
  const fbUrl = content.info.facebook_url;

  const items = [
    zaloNumber && { key: 'zalo', label: 'Zalo', bg: '#0068FF', Icon: ZaloIcon, href: `https://zalo.me/${zaloNumber}`, onClick: () => logZaloClick(null, 'contact_fab') },
    phoneNumber && { key: 'phone', label: 'Gọi điện', bg: 'var(--status-success-ink)', Icon: Phone, href: `tel:${phoneNumber}` },
    fbUrl && { key: 'facebook', label: 'Facebook', bg: '#1877F2', Icon: FacebookIcon, href: fbUrl, external: true },
  ].filter(Boolean);

  return (
    <div className="contact-fab-wrap" style={{ position: 'fixed', bottom: 88, right: 20, zIndex: 80, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
      {open && items.map((it, i) => (
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
