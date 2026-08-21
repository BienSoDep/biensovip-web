const SIZES = { sm: 32, md: 40, lg: 48 };
const VARIANTS = {
  primary: { background: 'var(--action-primary)', color: 'var(--white)', boxShadow: 'var(--shadow-blue)' },
  dark: { background: 'var(--action-dark)', color: 'var(--white)' },
  outline: { background: 'transparent', color: 'var(--text-strong)', boxShadow: 'inset 0 0 0 1.5px var(--border-strong)' },
  ghost: { background: 'transparent', color: 'var(--text-body)' },
};

export default function Button({ variant = 'primary', size = 'md', fullWidth, uppercase, disabled, onClick, children, style, className, type = 'button' }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <button
      type={type}
      className={`btn-${variant}${className ? ' ' + className : ''}`}
      disabled={disabled}
      onClick={onClick}
      style={{
        height: SIZES[size] || 40,
        padding: '0 20px',
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        font: 'var(--type-body-sm)',
        fontWeight: 'var(--fw-semibold)',
        letterSpacing: uppercase ? '.04em' : undefined,
        textTransform: uppercase ? 'uppercase' : undefined,
        width: fullWidth ? '100%' : undefined,
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1,
        transition: 'var(--transition-control)',
        ...v,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
