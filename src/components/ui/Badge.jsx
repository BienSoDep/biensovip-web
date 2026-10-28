const BADGE_TONES = {
  dark: { background: 'var(--action-dark)', color: 'var(--white)' },
  rose: { background: 'var(--rose-100)', color: 'var(--rose-500)' },
  hot: { background: 'var(--amber-500)', color: 'var(--white)' },
  amber: { background: 'var(--amber-100)', color: 'var(--status-warning-ink)' },
  orange: { background: 'var(--orange-100)', color: 'var(--accent-orange-ink)' },
  mint: { background: 'var(--mint-100)', color: 'var(--status-success-ink)' },
  blue: { background: 'var(--blue-100)', color: 'var(--blue-700)' },
  neutral: { background: 'var(--grey-100)', color: 'var(--text-muted)' },
};

export function Badge({ tone = 'neutral', children, title, style: customStyle, className }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.neutral;
  return (
    <span
      className={className}
      title={title}
      style={{
        height: 24,
        maxWidth: '100%',
        padding: '0 8px',
        borderRadius: 'var(--radius-xs)',
        display: 'inline-flex',
        alignItems: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        font: 'var(--type-caption)',
        fontSize: 'var(--fs-micro)',
        fontWeight: 'var(--fw-semibold)',
        whiteSpace: 'nowrap',
        ...t,
        ...customStyle,
      }}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ tone = 'brand', children, className }) {
  const color = tone === 'inverse' ? 'rgba(255,255,255,.7)' : tone === 'blue' ? 'var(--brand-600)' : 'var(--brand-600, #a3610a)';
  return (
    <span
      className={className}
      style={{
        font: 'var(--type-caption)',
        fontSize: 'var(--fs-micro)',
        letterSpacing: 'var(--ls-eyebrow)',
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </span>
  );
}

export default Badge;
