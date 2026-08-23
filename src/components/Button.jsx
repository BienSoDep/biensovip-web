import { Loader2 } from 'lucide-react';

const SIZES = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' };

export default function Button({ variant = 'primary', size = 'md', fullWidth, uppercase, disabled, loading, onClick, children, style, className, type = 'button', ...rest }) {
  const cls = [
    'btn',
    `btn-${variant}`,
    SIZES[size] || 'btn-md',
    fullWidth && 'btn-block',
    uppercase && 'btn-uppercase',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} onClick={onClick} style={style} {...rest}>
      {loading && <Loader2 size={16} aria-hidden style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  );
}
