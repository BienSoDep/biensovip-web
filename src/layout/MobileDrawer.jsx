import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from '../components/Button.jsx';
import { pill } from '../components/NavBtn.jsx';

export default function MobileDrawer({ open, onClose, s, go, user, patch, notify }) {
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
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Menu điều hướng" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(320px, 85vw)', background: 'var(--white)', boxShadow: 'var(--shadow-4)', display: 'flex', flexDirection: 'column', animation: 'modalIn 180ms var(--ease-out)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-5)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Menu</span>
          <button type="button" aria-label="Đóng menu" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', padding: 4 }}><X size={22} /></button>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: 'var(--space-3)' }}>
          {[['list', 'Biển số'], ['lucky', 'Hợp mệnh'], ['fav', 'Yêu thích'], ['blog', 'Tin phong thủy'], ['about', 'Về chúng tôi']].map((n) => (
            <button key={n[0]} onClick={() => { go(n[0])(); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'left', padding: '12px 16px', border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', ...pill(s === n[0]) }}>{n[1]}</button>
          ))}
        </nav>
        <div style={{ padding: 'var(--space-4) var(--space-5)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => { go('profile')(); onClose(); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{typeof user === 'string' ? user : (user.fullName || user.identifier || user.email || 'User')}</button>
              <button onClick={() => { patch({ user: null, isAdmin: false }); notify('Đã đăng xuất'); onClose(); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Thoát</button>
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
