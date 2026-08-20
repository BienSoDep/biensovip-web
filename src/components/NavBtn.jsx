export const pill = (on) => ({ on, dark: false, background: on ? 'var(--action-primary)' : 'var(--surface-muted)', color: on ? 'var(--white)' : 'var(--text-body)' });
export const darkPill = (on) => ({ on, dark: true, background: on ? 'var(--action-primary)' : 'rgba(255,255,255,.10)', color: on ? 'var(--white)' : 'var(--grey-300)' });

export default function NavBtn({ background, color, on, dark, onClick, children, style }) {
  return (
    <button type="button" className="pill-btn" data-on={String(!!on)} data-dark={String(!!dark)} onClick={onClick} style={{ height: 34, padding: '0 14px', border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'var(--transition-control)', background, color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...style }}>
      {children}
    </button>
  );
}
