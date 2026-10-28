import { Eyebrow } from './ui/Badge.jsx';

/**
 * Standard Page Header component
 * Matches the reference design in LuckyPlate:
 * - Eyebrow uppercase tag (brand tone="blue" / amber)
 * - H1 title with var(--type-display-1)
 * - Subtitle / description with var(--type-body) and var(--text-muted)
 * - Optional right-side actions
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  style,
  className,
  fullWidth = false,
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        width: '100%',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          flex: '1 1 320px',
          width: '100%',
          maxWidth: fullWidth || !actions ? '100%' : 840,
        }}
      >
        {eyebrow && (
          <Eyebrow tone="brand">
            {eyebrow}
          </Eyebrow>
        )}
        <h1
          style={{
            margin: 0,
            font: 'var(--type-display-1)',
            letterSpacing: 'var(--ls-display)',
            color: 'var(--text-strong)',
            width: '100%',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: 0,
              font: 'var(--type-body)',
              color: 'var(--text-muted)',
              lineHeight: 'var(--lh-body)',
              width: '100%',
            }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
