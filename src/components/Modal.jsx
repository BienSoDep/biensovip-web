import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

let uid = 0;

// Reusable accessible modal shell — the single fix point for the recurring
// focus-trap / Esc / scroll-lock / focus-restore / aria-labelledby audit points.
// Props: open, onClose, title (optional), labelledBy (optional), maxWidth (default 480px), children.
export default function Modal({ open, onClose, title, labelledBy, maxWidth = '480px', children }) {
  const dialogRef = useRef(null);
  const labelId = useRef(labelledBy || `modal-${++uid}`);
  const triggerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const trigger = document.activeElement;
    triggerRef.current = trigger;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    const focusables = () =>
      Array.from(
        dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.disabled && el.offsetParent !== null);

    const first = focusables()[0];
    (first || dialog).focus();

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
    dialog.addEventListener('keydown', onKeyDown);

    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') triggerRef.current.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? labelId.current : undefined}
      aria-label={title ? undefined : 'Hộp thoại'}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', background: 'var(--overlay)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        animation: 'fadeIn 140ms var(--ease-out)',
      }}
    >
      <div
        ref={dialogRef}
        style={{
          width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-4)', padding: 'var(--space-5)', animation: 'modalIn 180ms var(--ease-out)',
        }}
      >
        {title && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
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
