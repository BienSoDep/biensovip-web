import { motion } from 'motion/react';

export const pill = (on) => ({
  on,
  dark: false,
  background: on ? 'var(--action-primary)' : 'var(--surface-muted)',
  color: on ? 'var(--action-primary-text, var(--ink-900))' : 'var(--text-body)',
});
export const darkPill = (on) => ({
  on,
  dark: true,
  background: on ? 'var(--action-primary)' : 'rgba(255,255,255,.10)',
  color: on ? 'var(--action-primary-text, var(--ink-900))' : 'var(--grey-300)',
});

export default function NavBtn({ background, color, on, dark, onClick, children, style, ...rest }) {
  return (
    <motion.button
      type="button"
      className="pill-btn"
      data-on={String(!!on)}
      data-dark={String(!!dark)}
      onClick={onClick}
      whileHover={{ scale: 1.025, y: -0.5 }}
      whileTap={{ scale: 0.975, y: 0.5 }}
      transition={{ type: 'spring', stiffness: 480, damping: 28 }}
      style={{
        height: 40,
        padding: '0 14px',
        border: 'none',
        outline: 'none',
        borderRadius: 'var(--radius-sm)',
        font: 'var(--type-caption)',
        fontWeight: 'var(--fw-semibold)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        background,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        ...style,
      }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
