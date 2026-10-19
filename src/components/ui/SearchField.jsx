import { Search } from 'lucide-react';

export function SearchField({ placeholder, value, onChange, onKeyDown, onSubmit, width, ariaLabel }) {
  const handleKeyDown = (e) => {
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented) return;
    if (e.key === 'Enter') {
      if (onSubmit) {
        e.preventDefault();
        onSubmit(e.target.value);
      } else {
        const form = e.currentTarget.form || e.currentTarget.closest('form');
        if (form && typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        }
      }
    }
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex', width, minWidth: 0 }}>
      <Search
        size={16}
        style={{
          position: 'absolute',
          top: '50%',
          left: 14,
          transform: 'translateY(-50%)',
          color: 'var(--text-faint)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        value={value ?? ''}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        style={{
          height: 44,
          width: '100%',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-field)',
          background: 'var(--white)',
          padding: '0 16px 0 40px',
          font: 'var(--type-body-sm)',
          color: 'var(--text-strong)',
          outline: 'none',
          minWidth: 0,
        }}
      />
    </span>
  );
}

export default SearchField;
