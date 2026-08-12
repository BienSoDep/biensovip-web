import { Heart, X, Pencil, Trash2, Check } from 'lucide-react';

export function Input({ id, label, placeholder, value, error, onChange, type = 'text', hint }) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errId = error && inputId ? inputId + '-err' : undefined;
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errId}
        style={{
          height: 40, border: 'none', borderRadius: 'var(--radius-field)',
          background: 'var(--surface-sunken)', boxShadow: error ? 'inset 0 0 0 1.5px var(--status-danger)' : 'var(--shadow-inset-hairline)',
          padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none',
        }}
      />
      {error ? <span id={errId} role="alert" style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{error}</span>
        : hint ? <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{hint}</span> : null}
    </label>
  );
}

export function SearchField({ placeholder, value, onChange, width, ariaLabel }) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      aria-label={ariaLabel || placeholder}
      value={value ?? ''}
      onChange={onChange}
      style={{
        height: 40, width, border: 'none', borderRadius: 'var(--radius-pill)',
        background: 'var(--surface-sunken)', padding: '0 16px', font: 'var(--type-body-sm)',
        color: 'var(--text-strong)', outline: 'none', minWidth: 0,
      }}
    />
  );
}

export function Select({ label, value, options = [], onChange, variant, style }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 40, border: 'none', borderRadius: variant === 'pill' ? 'var(--radius-pill)' : 'var(--radius-field)',
          background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)',
          padding: '0 12px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none',
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Checkbox({ label, checked, onChange, style }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', ...style }}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
      <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{label}</span>
    </label>
  );
}

export function Radio({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <input type="radio" checked={!!checked} onChange={onChange} style={{ width: 18, height: 18, accentColor: 'var(--action-primary)' }} />
      <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{label}</span>
    </label>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label || 'Công tắc'} onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 24, borderRadius: 'var(--radius-pill)', border: 'none', position: 'relative',
        background: checked ? 'var(--action-primary)' : 'var(--grey-300)', transition: 'var(--transition-control)',
      }}>
      <span style={{
        position: 'absolute', top: 3, left: checked ? 19 : 3, width: 18, height: 18, borderRadius: '50%',
        background: 'var(--white)', transition: 'var(--transition-control)',
      }} />
    </button>
  );
}

const BADGE_TONES = {
  dark: { background: 'var(--action-dark)', color: 'var(--white)' },
  rose: { background: 'var(--rose-100)', color: 'var(--rose-500)' },
  amber: { background: 'var(--amber-100)', color: '#8A6100' },
  mint: { background: 'var(--mint-100)', color: '#1B7A5A' },
  blue: { background: 'var(--blue-100)', color: 'var(--blue-700)' },
  neutral: { background: 'var(--grey-100)', color: 'var(--text-muted)' },
};

export function Badge({ tone = 'neutral', children }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.neutral;
  return (
    <span style={{
      height: 24, maxWidth: '100%', padding: '0 10px', borderRadius: 'var(--radius-pill)', display: 'inline-flex', alignItems: 'center',
      overflow: 'hidden', textOverflow: 'ellipsis',
      font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)', whiteSpace: 'nowrap', ...t,
    }}>{children}</span>
  );
}

export function Eyebrow({ tone = 'blue', children, className }) {
  const color = tone === 'inverse' ? 'rgba(255,255,255,.7)' : 'var(--blue-600)';
  return (
    <span className={className} style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color }}>{children}</span>
  );
}

const ICONS = { heart: Heart, x: X, pencil: Pencil, 'trash-2': Trash2, check: Check };

export function Icon({ name, size = 18 }) {
  const I = ICONS[name];
  return I ? <I size={size} /> : null;
}

export function IconButton({ name, label, onClick, size = 'md', style, disabled }) {
  const px = size === 'lg' ? 48 : size === 'sm' ? 36 : 44;
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled}
      style={{
        width: px, height: px, borderRadius: '50%', border: 'none', background: 'var(--surface-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-body)',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style,
      }}>
      <Icon name={name} size={Math.round(px * 0.5)} />
    </button>
  );
}

export function Card({ children, tone, pad, style }) {
  return (
    <div style={{ background: tone === 'sunken' ? 'var(--surface-sunken)' : 'var(--white)', borderRadius: 'var(--radius-card)', padding: pad, boxShadow: tone === 'sunken' ? undefined : 'var(--shadow-inset-hairline)', transition: 'var(--transition-card)', ...style }}>
      {children}
    </div>
  );
}

export function Avatar({ name, size = 'sm' }) {
  const px = size === 'sm' ? 28 : 40;
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <span style={{
      width: px, height: px, borderRadius: '50%', background: 'var(--action-primary)', color: 'var(--white)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)',
    }}>{initial}</span>
  );
}

export function Toast({ message, tone = 'dark' }) {
  return (
    <div style={{
      background: tone === 'dark' ? 'var(--action-dark)' : 'var(--white)', color: 'var(--white)',
      padding: '12px 18px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-4)', font: 'var(--type-body-sm)',
    }}>{message}</div>
  );
}
