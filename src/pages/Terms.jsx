import { contentGet, contentItems } from '../lib/content/index.js';

// tiny HTML-in-string renderer: only <strong>…</strong> is supported.
function Rich({ html }) {
  const parts = String(html).split(/(<strong>.*?<\/strong>)/g);
  return parts.map((p, i) => (p.startsWith('<strong>') ? <strong key={i}>{p.replace(/<\/?strong>/g, '')}</strong> : p));
}

export default function Terms() {
  const sections = contentItems('terms.sections');
  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{contentGet('terms.title')}</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{contentGet('terms.updated')}</p>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-7) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {sections.map((s) => (
          <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{s.title}</h2>
            <div style={{ font: 'var(--type-body)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>
              <Rich html={s.body} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
