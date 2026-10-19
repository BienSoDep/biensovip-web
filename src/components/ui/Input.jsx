import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { InfoTip } from './InfoTip.jsx';

export function Input({
  id,
  label,
  info,
  placeholder,
  value,
  error,
  onChange,
  onBlur,
  onKeyDown,
  type = 'text',
  hint,
  disabled,
  required,
  min,
  max,
  step,
  title,
  ...rest
}) {
  const inputId = id || (label && typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errId = error && inputId ? inputId + '-err' : undefined;
  const isPassword = type === 'password';
  const [reveal, setReveal] = useState(false);
  const tooltip = info || title;

  const handleKeyDown = (e) => {
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented) return;

    if (e.key === 'Enter') {
      const form = e.currentTarget.form || e.currentTarget.closest('form');
      if (form) {
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (!submitBtn) {
          const primaryBtn = form.querySelector('button.btn-primary:not([disabled]), button.btn-danger:not([disabled])');
          if (primaryBtn) {
            e.preventDefault();
            primaryBtn.click();
          } else if (typeof form.requestSubmit === 'function') {
            e.preventDefault();
            form.requestSubmit();
          }
        }
      } else {
        const container =
          e.currentTarget.closest('[role="dialog"], [data-form-container], .modal, .drawer, [class*="modal"], [class*="drawer"]') ||
          e.currentTarget.closest('section, article, div[style*="boxShadow"], div[style*="box-shadow"], div[style*="border-radius"]');
        if (container) {
          const btns = Array.from(
            container.querySelectorAll(
              'button.btn-primary:not([disabled]), button.btn-danger:not([disabled]), button[type="submit"]:not([disabled])'
            )
          );
          const primaryBtn = btns.reverse().find((b) => b.offsetHeight > 0);
          if (primaryBtn && primaryBtn !== e.currentTarget) {
            e.preventDefault();
            primaryBtn.click();
          }
        }
      }
    }
  };

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }} title={tooltip}>
      {label && (
        <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {label}
          {required && <span style={{ color: 'var(--status-danger)' }}> *</span>}
          {info && <InfoTip text={info} />}
        </span>
      )}
      <span style={{ position: 'relative', display: 'flex' }}>
        <input
          id={inputId}
          type={isPassword && reveal ? 'text' : type}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          title={tooltip}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errId}
          style={{
            height: 40,
            width: '100%',
            border: 'none',
            borderRadius: 'var(--radius-field)',
            background: 'var(--surface-sunken)',
            boxShadow: error ? 'inset 0 0 0 1.5px var(--status-danger)' : 'var(--shadow-inset-hairline)',
            padding: isPassword ? '0 40px 0 14px' : '0 14px',
            font: 'var(--type-body)',
            color: 'var(--text-strong)',
            outline: 'none',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setReveal((r) => !r);
            }}
            aria-label={reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            tabIndex={-1}
            style={{
              position: 'absolute',
              right: 10,
              top: 0,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 0,
            }}
          >
            {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </span>
      {error ? (
        <span id={errId} role="alert" style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>
          {error}
        </span>
      ) : hint ? (
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{hint}</span>
      ) : null}
    </label>
  );
}

export default Input;
