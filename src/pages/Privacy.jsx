import { contentGet, contentItems } from '../lib/content/index.js';

function Rich({ html }) {
  const parts = String(html).split(/(<strong>.*?<\/strong>)/g);
  return parts.map((p, i) => (p.startsWith('<strong>') ? <strong key={i}>{p.replace(/<\/?strong>/g, '')}</strong> : p));
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
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{contentGet('privacy.title')}</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{contentGet('privacy.updated')}</p>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-7) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {sections.map((s) => (
          <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{s.title}</h2>
            <Body s={s} />
          </div>
        ))}
      </div>
    </div>
  );
}
