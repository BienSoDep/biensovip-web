import { useRef, useState } from 'react';
import { Heart, X, Pencil, Trash2, Check, PlusCircle, CheckCircle2, ChevronDown,
  Flame, Droplets, Mountain, Wind, Zap, Sparkles, Copy, Download, Share2, History, Info, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Select as BaseSelect } from '@base-ui/react/select';
import Button from './Button.jsx';
import { apiClient } from '../services/apiClient.js';

// Icon thông tin — hover để xem giải thích ngắn về khái niệm/label bên cạnh.
// Bubble dùng position:fixed + tọa độ tính bằng JS khi hover, để thoát khỏi mọi ancestor có
// overflow:hidden/auto (bảng, card cuộn ngang…) — dùng position:absolute thuần CSS sẽ bị cắt mất.
export function InfoTip({ text, size = 14, style }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.top, left: r.left + r.width / 2 });
  };
  const hide = () => setPos(null);

  return (
    <span ref={ref} role="note" aria-label={text}
      onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} tabIndex={0}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help',
        color: 'var(--text-faint)', verticalAlign: 'middle', flexShrink: 0, outline: 'none', ...style }}>
      <Info size={size} aria-hidden="true" />
      {pos && (
        <span role="tooltip"
          style={{
            position: 'fixed', top: pos.top - 8, left: pos.left, transform: 'translate(-50%, -100%)',
            background: 'var(--action-dark)', color: 'var(--white)', padding: '8px 12px', borderRadius: 'var(--radius-md)',
            width: 'max-content', maxWidth: 280, font: 'var(--type-caption)', lineHeight: 1.55, textAlign: 'left',
            boxShadow: 'var(--shadow-3)', zIndex: 'var(--z-popover, 70)', pointerEvents: 'none',
          }}>
          {text}
        </span>
      )}
    </span>
  );
}

// Trường nhập URL ảnh — 2 cách: dán link trực tiếp HOẶC tải ảnh lên (tự đưa qua Cloudinary → điền link).
// Dùng chung cho mọi chỗ admin gán link ảnh (thumbnail, ảnh đại diện, ảnh trong nội dung…).
export function ImageUrlInput({ label, value, onChange, placeholder, hint }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const onFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.upload('/api/admin/plates/upload', fd);
      onChange(res.url);
    } catch (e) {
      // eslint-disable-next-line no-alert
      window.alert(e.message || 'Lỗi tải ảnh lên');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>}
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <div style={{ flex: 1 }}><Input value={value} onChange={onChange} placeholder={placeholder} /></div>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()} style={{ whiteSpace: 'nowrap' }}>{busy ? 'Đang tải…' : 'Tải ảnh lên'}</Button>
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFile(e.target.files[0])} style={{ display: 'none' }} />
      {hint && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
}

export function Input({ id, label, placeholder, value, error, onChange, onBlur, type = 'text', hint, disabled, required, min, max }) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errId = error && inputId ? inputId + '-err' : undefined;
  const isPassword = type === 'password';
  const [reveal, setReveal] = useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>}
      <span style={{ position: 'relative', display: 'flex' }}>
        <input
          id={inputId}
          type={isPassword && reveal ? 'text' : type}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errId}
          style={{
            height: 40, width: '100%', border: 'none', borderRadius: 'var(--radius-field)',
            background: 'var(--surface-sunken)', boxShadow: error ? 'inset 0 0 0 1.5px var(--status-danger)' : 'var(--shadow-inset-hairline)',
            padding: isPassword ? '0 40px 0 14px' : '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none',
            opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
        {isPassword && (
          <button type="button" onClick={(e) => { e.preventDefault(); setReveal((r) => !r); }} aria-label={reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} tabIndex={-1}
            style={{ position: 'absolute', right: 10, top: 0, height: 40, display: 'flex', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
            {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </span>
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
  const selected = options.find((o) => o.value === value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>}
      <BaseSelect.Root value={value ?? ''} onValueChange={(v) => onChange(v)} items={options}>
        <BaseSelect.Trigger
          style={{
            height: 40, border: 'none', borderRadius: variant === 'pill' ? 'var(--radius-pill)' : 'var(--radius-field)',
            background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)',
            padding: '0 12px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer', width: '100%',
          }}
        >
          <BaseSelect.Value>{selected?.label ?? ''}</BaseSelect.Value>
          <BaseSelect.Icon style={{ display: 'flex', color: 'var(--text-muted)' }}><ChevronDown size={16} /></BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={6} style={{ zIndex: 'var(--z-popover, 60)' }}>
            <BaseSelect.Popup
              style={{
                background: 'var(--white)', borderRadius: 'var(--radius-field)', boxShadow: 'var(--shadow-3)',
                padding: 4, minWidth: 'var(--anchor-width)', maxHeight: 280, overflowY: 'auto',
              }}
            >
              {options.map((o) => (
                <BaseSelect.Item
                  key={o.value}
                  value={o.value}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    padding: '9px 12px', borderRadius: 'var(--radius-sm, 8px)', cursor: 'pointer',
                    font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none',
                  }}
                  className="select-item"
                >
                  <BaseSelect.ItemText>{o.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator style={{ display: 'flex', color: 'var(--action-primary)' }}><Check size={14} /></BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
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

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label || 'Công tắc'} disabled={disabled} onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 24, borderRadius: 'var(--radius-pill)', border: 'none', position: 'relative',
        background: checked ? 'var(--action-primary)' : 'var(--grey-300)', transition: 'var(--transition-control)',
        opacity: disabled ? 0.6 : 1, cursor: disabled ? 'default' : 'pointer',
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
  amber: { background: 'var(--amber-100)', color: 'var(--status-warning-ink)' },
  mint: { background: 'var(--mint-100)', color: 'var(--status-success-ink)' },
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

const ICONS = { heart: Heart, x: X, pencil: Pencil, 'trash-2': Trash2, check: Check, 'plus-circle': PlusCircle, 'check-circle': CheckCircle2,
  flame: Flame, droplets: Droplets, mountain: Mountain, wind: Wind, zap: Zap,
  sparkles: Sparkles, copy: Copy, download: Download, share: Share2, history: History, key: KeyRound };

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
