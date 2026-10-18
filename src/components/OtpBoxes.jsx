import { useRef } from 'react';

// Ô nhập OTP 6 chữ số — dùng chung cho login OTP, quên mật khẩu, và xác nhận xóa user của admin.
export default function OtpBoxes({ value, onChange, error, disabled }) {
  const refs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => (value || '')[i] || '');
  const focus = (i) => refs.current[i]?.focus();
  const handle = (i, raw) => {
    const ch = raw.replace(/\D/g, '').slice(-1);
    const arr = Array.from({ length: 6 }, (_, k) => (value || '')[k] || '');
    arr[i] = ch;
    onChange(arr.join(''));
    if (ch && i < 5) focus(i + 1);
  };
  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !((value || '')[i]) && i > 0) focus(i - 1);
    if (e.key === 'Enter') {
      const form = e.currentTarget.form || e.currentTarget.closest('form');
      if (form) {
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) {
          e.preventDefault();
          submitBtn.click();
        } else {
          const primaryBtn = form.querySelector('button.btn-primary:not([disabled])');
          if (primaryBtn) {
            e.preventDefault();
            primaryBtn.click();
          } else if (typeof form.requestSubmit === 'function') {
            e.preventDefault();
            form.requestSubmit();
          }
        }
      } else {
        const container = e.currentTarget.closest('[role="dialog"], [data-form-container]')
          || e.currentTarget.closest('section, article, div[style*="boxShadow"], div[style*="box-shadow"]');
        const btns = Array.from(container?.querySelectorAll('button.btn-primary:not([disabled]), button[type="submit"]:not([disabled])') || []);
        const primaryBtn = btns.reverse().find((b) => b.offsetHeight > 0);
        if (primaryBtn) {
          e.preventDefault();
          primaryBtn.click();
        }
      }
    }
  };
  const onPaste = (e) => {
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    focus(Math.min(pasted.length, 5));
  };
  return (
    <div style={{ display: 'flex', gap: 8 }} onPaste={onPaste}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} value={d} inputMode="numeric" autoComplete="one-time-code" maxLength={1} aria-label={`Chữ số ${i + 1}`} disabled={disabled}
          aria-invalid={!!error}
          onChange={(e) => handle(i, e.target.value)} onKeyDown={(e) => onKeyDown(i, e)}
          style={{ width: '100%', maxWidth: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 'var(--fw-bold)', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', boxShadow: error ? 'inset 0 0 0 2px var(--status-danger)' : 'var(--shadow-inset-hairline)', color: 'var(--text-strong)', outline: 'none', opacity: disabled ? 0.5 : 1 }} />
      ))}
    </div>
  );
}
