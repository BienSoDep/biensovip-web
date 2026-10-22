export function Card({ children, tone, pad, style, className }) {
  return (
    <div
      className={className}
      style={{
        background: tone === 'sunken' ? 'var(--surface-sunken)' : 'var(--white)',
        borderRadius: 'var(--radius-card)',
        padding: pad,
        boxShadow: tone === 'sunken' ? undefined : 'var(--shadow-inset-hairline)',
        transition: 'var(--transition-card)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Avatar({ name, size = 'sm' }) {
  const px = size === 'sm' ? 28 : 40;
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <span
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: 'var(--action-primary)',
        color: 'var(--white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: 'var(--type-caption)',
        fontWeight: 'var(--fw-semibold)',
      }}
    >
      {initial}
    </span>
  );
}

export default Card;
