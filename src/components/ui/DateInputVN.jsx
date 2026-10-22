import { useRef, useState } from 'react';

// Ngày sinh kiểu Việt Nam: dd/mm/yyyy hiển thị, giá trị ra/vào vẫn ISO yyyy-mm-dd
// (native <input type="date"> hiển thị theo locale trình duyệt, không ép được dd/mm/yyyy mọi máy).
export function DateInputVN({ id, label, value, error, onChange, hint }) {
  const [yv, mv, dv] = (value || '').split('-');
  const [d, setD] = useState(dv || '');
  const [m, setM] = useState(mv || '');
  const [y, setY] = useState(yv || '');
  const [focused, setFocused] = useState(false);
  const dRef = useRef(null), mRef = useRef(null), yRef = useRef(null);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errId = error && inputId ? inputId + '-err' : undefined;

  const digits = (s) => s.replace(/\D/g, '');
  const emit = (dd, mm, yyyy) => {
    // Zero-pad ngày/tháng — backend nhận JSON DateTime chuẩn ISO (yyyy-MM-dd), "1990-5-15" (thiếu
    // pad) làm System.Text.Json từ chối parse → 500. Cho phép gõ dở 1 chữ số, chỉ emit khi đủ 2 số.
    if (dd?.length === 2 && mm?.length === 2 && yyyy?.length === 4) onChange({ target: { value: `${yyyy}-${mm}-${dd}` } });
    else onChange({ target: { value: '' } });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const form = e.currentTarget.form || e.currentTarget.closest('form');
      if (form) {
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (!submitBtn) {
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
        const container =
          e.currentTarget.closest('[role="dialog"], [data-form-container]') ||
          e.currentTarget.closest('section, article, div[style*="boxShadow"], div[style*="box-shadow"]');
        const btns = Array.from(container?.querySelectorAll('button.btn-primary:not([disabled]), button[type="submit"]:not([disabled])') || []);
        const primaryBtn = btns.reverse().find((b) => b.offsetHeight > 0);
        if (primaryBtn) {
          e.preventDefault();
          primaryBtn.click();
        }
      }
    }
  };

  const onDay = (e) => {
    const v = digits(e.target.value).slice(0, 2);
    setD(v);
    emit(v, m, y);
    if (v.length === 2) mRef.current?.focus();
  };
  const onMonth = (e) => {
    const v = digits(e.target.value).slice(0, 2);
    setM(v);
    emit(d, v, y);
    if (v.length === 2) yRef.current?.focus();
  };
  const onYear = (e) => {
    const v = digits(e.target.value).slice(0, 4);
    setY(v);
    emit(d, m, v);
  };

  const boxStyle = {
    height: 40,
    border: 'none',
    textAlign: 'center',
    background: 'transparent',
    font: 'var(--type-body)',
    color: 'var(--text-strong)',
    outline: 'none',
    boxShadow: 'none',
    minWidth: 0,
    WebkitAppearance: 'none',
    appearance: 'none',
  };
  const boxFocus = { onFocus: () => setFocused(true), onBlur: () => setFocused(false) };

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: '1 1 auto' }}>
      {label && <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>}
      <span
        id={inputId}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 40,
          width: '100%',
          minWidth: 0,
          borderRadius: 'var(--radius-field)',
          background: 'var(--surface-sunken)',
          boxShadow: error ? 'inset 0 0 0 1.5px var(--status-danger)' : focused ? 'inset 0 0 0 1.5px var(--action-primary)' : 'var(--shadow-inset-hairline)',
          padding: '0 14px',
        }}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errId}
      >
        <input
          ref={dRef}
          className="date-vn-input"
          inputMode="numeric"
          placeholder="ngày"
          value={d || ''}
          onChange={onDay}
          onKeyDown={handleKeyDown}
          {...boxFocus}
          style={{ ...boxStyle, flex: '1 1 0', minWidth: 0 }}
        />
        <span style={{ color: 'var(--text-faint)' }}>/</span>
        <input
          ref={mRef}
          className="date-vn-input"
          inputMode="numeric"
          placeholder="tháng"
          value={m || ''}
          onChange={onMonth}
          onKeyDown={handleKeyDown}
          {...boxFocus}
          style={{ ...boxStyle, flex: '1.3 1 0', minWidth: 0 }}
        />
        <span style={{ color: 'var(--text-faint)' }}>/</span>
        <input
          ref={yRef}
          className="date-vn-input"
          inputMode="numeric"
          placeholder="năm"
          value={y || ''}
          onChange={onYear}
          onKeyDown={handleKeyDown}
          {...boxFocus}
          style={{ ...boxStyle, flex: '1.3 1 0', minWidth: 0 }}
        />
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

export default DateInputVN;
