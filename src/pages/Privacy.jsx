import { Printer } from 'lucide-react';
import { contentGet, contentItems } from '../lib/content/index.js';

function Rich({ html }) {
  const parts = String(html).split(/(<strong>.*?<\/strong>)/g);
  return parts.map((p, i) => (p.startsWith('<strong>') ? <strong key={i}>{p.replace(/<\/?strong>/g, '')}</strong> : p));
}

function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function Body({ s }) {
  if (s.type === 'list' || s.type === 'mixed') {
    const items = String(s.body).split(/(<li>.*?<\/li>)/g).filter((x) => x.startsWith('<li>'));
    const lead = String(s.body).replace(/(<li>.*?<\/li>)/g, '').trim();
    return (
      <div style={{ font: 'var(--type-body)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {lead && <p style={{ margin: 0 }}><Rich html={lead} /></p>}
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {items.map((li, i) => <li key={i}><Rich html={li.replace(/<\/?li>/g, '')} /></li>)}
        </ul>
      </div>
    );
  }
  return <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}><Rich html={s.body} /></p>;
}

export default function Privacy() {
  const sections = contentItems('privacy.sections');
  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{contentGet('privacy.title')}</h1>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{contentGet('privacy.updated')}</p>
        </div>
        <button type="button" onClick={() => window.print()} className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, border: 'none', background: 'var(--surface-sunken)', color: 'var(--text-strong)', padding: '9px 14px', borderRadius: 'var(--radius-field)', cursor: 'pointer', font: 'var(--type-body-sm)', boxShadow: 'var(--shadow-inset-hairline)' }}><Printer size={16} /> In trang</button>
      </div>

      <nav aria-label="Mục lục" className="no-print" style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
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
            <Body s={s} />
          </div>
        ))}
      </div>
    </div>
  );
}
