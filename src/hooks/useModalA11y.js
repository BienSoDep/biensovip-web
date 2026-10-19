import { useEffect } from 'react';

/**
 * useModalA11y - Manages accessibility behaviors for modals and dialogs:
 * - Escape key to close
 * - Focus trap (Tab / Shift+Tab cycling inside container)
 * - Auto-focus first focusable element on open
 * - Scroll locking on body while open
 * - Restoring focus to previous trigger element on close
 *
 * @param {Object} options
 * @param {boolean} options.isOpen Whether the modal is currently open.
 * @param {Function} options.onClose Callback invoked when Escape key is pressed.
 * @param {React.RefObject} options.containerRef Ref of the modal dialog DOM container.
 * @param {boolean} [options.trapFocus=true] Whether to enforce tab trap.
 * @param {boolean} [options.lockScroll=true] Whether to prevent body background scrolling.
 */
export function useModalA11y({
  isOpen,
  onClose,
  containerRef,
  trapFocus = true,
  lockScroll = true,
}) {
  // 1. Escape key handler
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 2. Focus trap + Scroll lock + Focus restore
  useEffect(() => {
    if (!isOpen || !containerRef?.current) return;

    const dialog = containerRef.current;
    const trigger = document.activeElement;
    const prevOverflow = document.body.style.overflow;

    if (lockScroll) {
      document.body.style.overflow = 'hidden';
    }

    // Auto-focus first focusable element
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = dialog.querySelector(focusableSelector);
    if (focusable && typeof focusable.focus === 'function') {
      focusable.focus();
    }

    const handleTabKey = (e) => {
      if (!trapFocus || e.key !== 'Tab') return;

      const els = Array.from(dialog.querySelectorAll(focusableSelector)).filter(
        (el) => !el.disabled && el.offsetParent !== null
      );
      if (!els.length) return;

      const firstEl = els[0];
      const lastEl = els[els.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    dialog.addEventListener('keydown', handleTabKey);

    return () => {
      dialog.removeEventListener('keydown', handleTabKey);
      if (lockScroll) {
        document.body.style.overflow = prevOverflow;
      }
      if (trigger && typeof trigger.focus === 'function') {
        trigger.focus();
      }
    };
  }, [isOpen, containerRef, trapFocus, lockScroll]);
}

export default useModalA11y;
