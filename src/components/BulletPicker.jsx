// CLEAN-CODE-ISSUES.md #1/#1b — bullet-select dùng chung, trước đây định nghĩa riêng lẻ giống hệt
// nhau ở LuckyPlate.jsx/Compare.jsx (InlinePicker)/Profile.jsx.
const SIZES = {
  md: {
    height: 40, padding: '0 16px', font: 'var(--type-body-sm)', gap: 'var(--space-2)',
    labelFont: 'var(--type-label)', labelColor: 'var(--text-strong)', shadow: true,
  },
  sm: {
    height: 32, padding: '0 12px', font: 'var(--type-caption)', gap: 6,
    labelFont: 'var(--type-caption)', labelColor: 'var(--text-muted)', shadow: false,
  },
};

export default function BulletPicker({ label, value, onChange, options, size = 'md', allowDeselect = false, labelSuffix = '' }) {
  const dim = SIZES[size];
  return (
    <div style={size === 'sm' ? { display: 'flex', flexDirection: 'column', gap: 4 } : undefined}>
      <span style={{ font: dim.labelFont, color: dim.labelColor }}>{label}{labelSuffix}</span>
      <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: dim.gap, marginTop: size === 'sm' ? 0 : 6, flexWrap: 'wrap' }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(allowDeselect && active ? '' : opt)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, height: dim.height, padding: dim.padding,
                border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                font: dim.font, fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                background: active ? 'var(--action-primary)' : 'var(--surface-sunken)',
                color: active ? 'var(--text-inverse)' : 'var(--text-body)',
                boxShadow: !active && dim.shadow ? 'var(--shadow-inset-hairline)' : 'none',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
