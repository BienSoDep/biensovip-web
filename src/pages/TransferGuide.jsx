import { CheckCircle, Clock, FileText, Car, PhoneCall } from 'lucide-react';
import Button from '../components/Button.jsx';
import { contentGet, contentItems } from '../lib/content/index.js';

const STEP_ICONS = [FileText, CheckCircle, Car, Clock];

export default function TransferGuide({ go }) {
  const steps = contentItems('transfer.steps').map((s, i) => ({ ...s, icon: STEP_ICONS[i] || Clock }));
  const notes = contentItems('transfer.notes');
  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{contentGet('transfer.title')}</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{contentGet('transfer.subtitle')}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {steps.map((s) => (
          <div key={s.key} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-pill)', background: 'var(--surface-tint-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={22} style={{ color: 'var(--action-primary)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{s.title}</h3>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-6)' }}>
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <PhoneCall size={18} style={{ color: 'var(--action-primary)' }} />
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{contentGet('transfer.need_help_title')}</span>
          </div>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{contentGet('transfer.need_help_desc')}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="primary" size="md" onClick={() => window.open('https://zalo.me/0905221334', '_blank')}>{contentGet('transfer.cta_zalo')}</Button>
          <Button variant="outline" size="md" onClick={go('list')}>{contentGet('transfer.cta_list')}</Button>
        </div>
      </div>

      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{contentGet('transfer.notes_title')}</h3>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
          {notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </div>
    </div>
  );
}
