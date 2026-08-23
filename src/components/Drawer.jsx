import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

let uid = 0;

// Drawer nửa phải màn hình — dùng cho form thêm/sửa ở admin (thay modal giữa). Same a11y contract
// với Modal.jsx: focus-trap / Esc / scroll-lock / focus-restore / aria-labelledby. Trượt từ phải, rộng ~50%.
// Props: open, onClose, title, labelledBy, width (default 'min(52%, 720px)'), children.
export default function Drawer({ open, onClose, title, labelledBy, width = 'min(52%, 720px)', children }) {
  const panelRef = useRef(null);
  const labelId = useRef(labelledBy || `drawer-${++uid}`);
  const triggerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const trigger = document.activeElement;
    triggerRef.current = trigger;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(
        panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.disabled && el.offsetParent !== null);

    const first = focusables()[0];
    (first || panel).focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (!els.length) return;
      const f = els[0];
      const l = els[els.length - 1];
      if (e.shiftKey && document.activeElement === f) {
        e.preventDefault();
        l.focus();
      } else if (!e.shiftKey && document.activeElement === l) {
        e.preventDefault();
        f.focus();
      }
    };
    panel.addEventListener('keydown', onKeyDown);

    return () => {
      panel.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') triggerRef.current.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? labelId.current : undefined}
      aria-label={title ? undefined : 'Bảng điều khiển'}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', background: 'var(--overlay)',
        display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 140ms var(--ease-out)',
      }}
    >
      <div
        ref={panelRef}
        style={{
          width, maxWidth: '100%', height: '100%', overflowY: 'auto',
          background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-4)',
          padding: 'var(--space-5)', animation: 'slideInRight 220ms var(--ease-out)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
        }}
      >
        {title && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', paddingBottom: 'var(--space-3)' }}>
            <h2 id={labelId.current} style={{ margin: 0, flex: 1, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{title}</h2>
            <button type="button" aria-label="Đóng" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', padding: 4, display: 'flex' }}><X size={20} /></button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
