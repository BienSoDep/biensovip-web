import { contentGet } from '../lib/content/index.js';

export default function Breadcrumb({ items, keepOnMobile }) {
  if (!items || !items.length) return null;
  return (
    <nav aria-label={contentGet('common.breadcrumb.aria')} className={'page-breadcrumb' + (keepOnMobile ? ' keep-mobile' : '')} style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '12px var(--pad-page)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span aria-hidden style={{ color: 'var(--text-faint)' }}>›</span>}
            {last ? (
              <span style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-semibold)' }}>{it.label}</span>
            ) : it.onClick ? (
              <button type="button" onClick={it.onClick} className="pressable" style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>{it.label}</button>
            ) : (
              <span>{it.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
