import { contentGet, contentItems } from '../lib/content/index.js';

// tiny HTML-in-string renderer: only <strong>…</strong> is supported.
function Rich({ html }) {
  const parts = String(html).split(/(<strong>.*?<\/strong>)/g);
  return parts.map((p, i) => (p.startsWith('<strong>') ? <strong key={i}>{p.replace(/<\/?strong>/g, '')}</strong> : p));
}

function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function Terms() {
  const sections = contentItems('terms.sections');
  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{contentGet('terms.title')}</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{contentGet('terms.updated')}</p>
      </div>

      <nav aria-label="Mục lục" style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mục lục</span>
        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sections.map((s) => (
            <li key={s.key}>
              <button type="button" onClick={() => document.getElementById(`sec-${slugify(s.title)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} style={{ border: 'none', background: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', font: 'var(--type-body-sm)', color: 'var(--action-primary)' }}>{s.title}</button>
            </li>
          ))}
        </ol>
      </nav>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-7) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {sections.map((s) => (
          <div key={s.key} id={`sec-${slugify(s.title)}`} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
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
