import { Home } from 'lucide-react';
import { contentGet } from '../lib/content/index.js';

export default function Breadcrumb({ items, keepOnMobile, inset }) {
  if (!items || !items.length) return null;
  // inset: dùng trong shell đã tự căn layout (vd AdminShell) — bỏ max-width/margin-auto/padding page
  // để breadcrumb bám sát container cha thay vì tự căn giữa trong khung đã hẹp sẵn (gây thụt lề).
  const wrapStyle = inset
    ? { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0, font: 'var(--type-caption)' }
    : { maxWidth: 'var(--width-content)', margin: '0 auto', padding: '12px var(--pad-page)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0, font: 'var(--type-caption)' };
  return (
    <nav aria-label={contentGet('common.breadcrumb.aria')} className={'page-breadcrumb' + (keepOnMobile ? ' keep-mobile' : '')} style={inset ? undefined : { boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
      <div style={wrapStyle}>
        {items.map((it, i) => {
          const last = i === items.length - 1;
          const first = i === 0;
          const Tag = !last && it.onClick ? 'button' : 'span';
          return (
            <Tag
              key={i}
              type={Tag === 'button' ? 'button' : undefined}
              onClick={Tag === 'button' ? it.onClick : undefined}
              aria-current={last ? 'page' : undefined}
              className={'breadcrumb-step' + (last ? ' is-current' : '') + (Tag === 'button' ? ' pressable' : '')}
            >
              {first && <Home aria-hidden size={13} />}
              {it.label}
            </Tag>
          );
        })}
      </div>
    </nav>
  );
}
