export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = 'var(--action-primary)',
  onClick,
}) {
  const isClickable = typeof onClick === 'function';

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      style={{
        background: 'var(--surface-card, #ffffff)',
        border: '1px solid var(--border-hairline, rgba(0, 0, 0, 0.08))',
        boxShadow: 'var(--shadow-inset-hairline, inset 0 0 0 1px rgba(0, 0, 0, 0.04))',
        borderRadius: 'var(--radius-card, 8px)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--space-2)',
        transition: 'transform 140ms ease, box-shadow 140ms ease',
        minWidth: 0,
        cursor: isClickable ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      className="gentelella-tile"
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-2), var(--shadow-inset-hairline)';
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'var(--shadow-inset-hairline)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <span
          style={{
            font: 'var(--type-caption)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted, #6b7280)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            flexShrink: 0,
          }}>
            <Icon size={15} />
          </div>
        )}
      </div>

      <div>
        <div style={{
          font: 'var(--type-title-1)',
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--text-strong, #111827)',
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
        }}>
          {value}
        </div>
        {sub && (
          <div style={{
            font: 'var(--type-caption)',
            fontSize: '11.5px',
            color: 'var(--text-muted, #6b7280)',
            marginTop: 4,
            lineHeight: 1.35,
          }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
