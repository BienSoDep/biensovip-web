import { useState } from 'react';
import { Phone, X, MessageCircle, Sparkles, Headphones } from 'lucide-react';
import { content } from '../lib/content/index.js';
import { logZaloClick } from '../services/zaloClicks.js';
import { toZaloUrl } from '../lib/zaloMessage.js';
import ZaloIcon from './ZaloIcon.jsx';
import FacebookIcon from './FacebookIcon.jsx';
import { useHideOnScroll } from '../hooks/useHideOnScroll.js';

// Nút liên hệ nổi gộp đa kênh: Hỗ trợ Nhắn tin với AI, Chat với Nhân viên, Zalo, Gọi điện thoại & Facebook.
export default function ContactFab({ zalo, phone }) {
  const [open, setOpen] = useState(false);
  const scrolling = useHideOnScroll();
  const zaloNumber = (zalo || content.info.zalo || '').replace(/[^0-9]/g, '');
  const phoneNumber = (phone || content.info.phone || '').replace(/[^0-9]/g, '');
  const phoneDisplay = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  const fbUrl = content.info.facebook_url;

  const handleOpenChatWidget = (mode) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('open-chat-widget', { detail: { mode } }));
  };

  const items = [
    {
      key: 'ai-chat',
      label: 'Nhắn tin với AI',
      badge: '24/7',
      bg: 'linear-gradient(135deg, #F19720 0%, #D97706 100%)',
      boxShadow: '0 4px 14px rgba(241, 151, 32, 0.45)',
      Icon: Sparkles,
      onClick: (e) => {
        e.preventDefault();
        handleOpenChatWidget('bot');
      },
    },
    {
      key: 'staff-chat',
      label: 'Chat với nhân viên',
      badge: 'Trực tiếp',
      bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
      Icon: Headphones,
      onClick: (e) => {
        e.preventDefault();
        handleOpenChatWidget('human');
      },
    },
    zaloNumber && {
      key: 'zalo',
      label: 'Chat Zalo Duy Đinh',
      bg: 'var(--action-primary, #F19720)',
      boxShadow: '0 4px 14px rgba(241, 151, 32, 0.4)',
      Icon: ZaloIcon,
      href: toZaloUrl(zaloNumber),
      onClick: () => logZaloClick(null, 'contact_fab'),
      external: true,
    },
    phoneNumber && {
      key: 'phone',
      label: `Gọi hotline ${phoneDisplay || phoneNumber}`,
      bg: 'var(--brand-600, #D97706)',
      boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)',
      Icon: Phone,
      href: `tel:${phoneNumber}`,
    },
    fbUrl && {
      key: 'facebook',
      label: 'Fanpage Facebook',
      bg: '#1E293B',
      boxShadow: '0 4px 14px rgba(30, 41, 59, 0.4)',
      Icon: FacebookIcon,
      href: fbUrl,
      external: true,
    },
  ].filter(Boolean);

  return (
    <div
      className="contact-fab-wrap"
      style={{
        position: 'fixed',
        bottom: 72,
        right: 16,
        zIndex: 85,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 10,
        opacity: scrolling ? 0 : 1,
        transform: scrolling ? 'translateX(72px)' : 'translateX(0)',
        pointerEvents: scrolling ? 'none' : 'auto',
        transition: 'opacity 160ms var(--ease-standard), transform 160ms var(--ease-standard)',
      }}
    >
      {/* Danh sách các công cụ khi mở rộng */}
      {open &&
        !scrolling &&
        items.map((it, i) => {
          const contentTag = (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
                cursor: 'pointer',
                animation: `contactFabIn 180ms var(--ease-out) ${i * 35}ms both`,
              }}
            >
              {/* Nhãn tag hiển thị rõ ràng */}
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'rgba(15, 23, 42, 0.94)',
                  color: '#FFFFFF',
                  fontSize: 12.5,
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.28)',
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  letterSpacing: '0.01em',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {it.label}
                {it.badge && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      textTransform: 'uppercase',
                    }}
                  >
                    {it.badge}
                  </span>
                )}
              </span>

              {/* Icon tròn nổi bật */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: it.bg,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: it.boxShadow || 'var(--shadow-3)',
                  flexShrink: 0,
                  transition: 'transform 180ms ease',
                }}
              >
                <it.Icon size={19} />
              </div>
            </div>
          );

          if (it.href) {
            return (
              <a
                key={it.key}
                href={it.href}
                target={it.external ? '_blank' : undefined}
                rel={it.external ? 'noopener noreferrer' : undefined}
                onClick={it.onClick}
                aria-label={it.label}
                title={it.label}
                style={{ textDecoration: 'none' }}
              >
                {contentTag}
              </a>
            );
          }

          return (
            <button
              key={it.key}
              type="button"
              onClick={it.onClick}
              aria-label={it.label}
              title={it.label}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'right',
              }}
            >
              {contentTag}
            </button>
          );
        })}

      {/* Nút FAB chính */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Đóng liên hệ nhanh' : 'Mở liên hệ nhanh và nhắn tin'}
        aria-expanded={open}
        className={`contact-fab${open ? '' : ' contact-fab-bounce'}`}
        style={{
          width: 46,
          height: 46,
          borderRadius: '50%',
          border: 'none',
          background: open ? '#1E293B' : 'var(--action-primary, #F19720)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(241, 151, 32, 0.4)',
          cursor: 'pointer',
          transition: 'all 200ms var(--ease-out)',
        }}
      >
        {open ? <X size={21} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
