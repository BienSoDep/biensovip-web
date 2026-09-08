import { useEffect, useRef } from 'react';
import { X, Car, Compass, Scale, BookOpen, MessageCircle, Handshake, Heart, Bell } from 'lucide-react';
import Button from '../components/Button.jsx';
import { pill } from '../components/NavBtn.jsx';

const MAIN_NAV = [
  ['list', 'Biển số', Car],
  ['lucky', 'Hợp mệnh', Compass],
  ['compare', 'So sánh', Scale],
  ['blog', 'Tin phong thủy', BookOpen],
  ['chat', 'Liên hệ', MessageCircle],
  ['collab', 'Cộng tác viên', Handshake],
];

export default function MobileDrawer({ open, onClose, s, go, user, onLogout, favCount = 0, compareCount = 0 }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    const focusable = panel?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab' || !panel) return;
      const els = Array.from(panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!els.length) return;
      const f = els[0];
      const l = els[els.length - 1];
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80 }}>
      <div aria-hidden="true" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--overlay)', animation: 'fadeIn 140ms var(--ease-out)' }} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Menu điều hướng" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 'min(320px, 85vw)', background: 'var(--white)', boxShadow: 'var(--shadow-4)', display: 'flex', flexDirection: 'column', animation: 'slideInLeft 220ms var(--ease-out)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-5)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Menu</span>
          <button type="button" aria-label="Đóng menu" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', padding: 4 }}><X size={22} /></button>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, padding: 'var(--space-3)' }}>
          {MAIN_NAV.map(([key, label, Icon]) => (
            <button key={key} onClick={() => { go(key)(); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'left', padding: '12px 16px', border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', ...pill(s === key) }}>
              <Icon size={18} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {key === 'compare' && compareCount > 0 && (
                <span style={{ padding: '0 6px', height: 18, minWidth: 18, borderRadius: 'var(--radius-pill)', background: s === key ? 'var(--white)' : 'var(--action-primary)', color: s === key ? 'var(--action-primary)' : 'var(--white)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{compareCount}</span>
              )}
            </button>
          ))}
          <div style={{ height: 1, background: 'var(--border-hairline)', margin: '8px 4px' }} />
          <button onClick={() => { go('fav')(); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'left', padding: '12px 16px', border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', ...pill(s === 'fav') }}>
            <Heart size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>Yêu thích</span>
            {favCount > 0 && (
              <span style={{ padding: '0 6px', height: 18, minWidth: 18, borderRadius: 'var(--radius-pill)', background: s === 'fav' ? 'var(--white)' : 'var(--action-primary)', color: s === 'fav' ? 'var(--action-primary)' : 'var(--white)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{favCount}</span>
            )}
          </button>
          {user && (
            <button onClick={() => { go('notifications')(); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'left', padding: '12px 16px', border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', ...pill(s === 'notifications') }}>
              <Bell size={18} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>Thông báo</span>
            </button>
          )}
        </nav>
        <div style={{ padding: 'var(--space-4) var(--space-5)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => { go('profile')(); onClose(); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{typeof user === 'string' ? user : (user.fullName || user.identifier || user.email || 'User')}</button>
              <button onClick={() => { onLogout(); onClose(); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Thoát</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="sm" onClick={() => { go('login')(); onClose(); }} style={{ flex: 1 }}>Đăng nhập</Button>
              <Button variant="dark" size="sm" onClick={() => { go('register')(); onClose(); }} style={{ flex: 1 }}>Đăng ký</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
