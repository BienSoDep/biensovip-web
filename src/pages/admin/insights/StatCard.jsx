export default function StatCard({ label, value, sub, icon: Icon, color = 'var(--action-primary)' }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      padding: '16px 18px',
      boxShadow: 'var(--shadow-inset-hairline)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 'var(--space-2)',
      transition: 'var(--transition-card)',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-medium)', color: 'var(--text-muted)' }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-pill)',
            background: `color-mix(in srgb, ${color} 10%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            flexShrink: 0,
          }}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div>
        <div style={{
          font: 'var(--type-title-1)',
          fontSize: '1.45rem',
          fontWeight: 'var(--fw-bold)',
          color: 'var(--text-strong)',
          letterSpacing: 'var(--ls-tight)',
          lineHeight: 1.2,
        }}>
          {value}
        </div>
        {sub && (
          <div style={{
            font: 'var(--type-caption)',
            color: 'var(--text-muted)',
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
