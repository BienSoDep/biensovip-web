import { InfoTip } from './InfoTip.jsx';

export function Checkbox({ label, info, checked, onChange, style }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', ...style }} title={info}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }}
      />
      <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {info && <InfoTip text={info} />}
      </span>
    </label>
  );
}

export function Radio({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <input
        type="radio"
        checked={!!checked}
        onChange={onChange}
        style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }}
      />
      <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{label}</span>
    </label>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label || 'Công tắc'}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 24,
        borderRadius: 'var(--radius-pill)',
        border: 'none',
        position: 'relative',
        background: checked ? 'var(--action-primary)' : 'var(--grey-300)',
        transition: 'var(--transition-control)',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 19 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'var(--white)',
          transition: 'var(--transition-control)',
        }}
      />
    </button>
  );
}

export default Checkbox;
