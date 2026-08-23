import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Button from '../components/Button.jsx';
import { contentGet, contentItems } from '../lib/content/index.js';

export default function Faq({ go }) {
  const [open, setOpen] = useState(null);
  const QA = contentItems('faq.items');

  useEffect(() => {
    const old = document.head.querySelector('script[data-faq-ld]');
    if (old) old.remove();
    if (QA.length === 0) return;
    const sc = document.createElement('script');
    sc.type = 'application/ld+json';
    sc.dataset.faqLd = '1';
    sc.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: QA.map((item) => ({
        '@type': 'Question', name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
    document.head.appendChild(sc);
    return () => { sc.remove(); };
  }, [QA]);

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{contentGet('faq.title')}</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{contentGet('faq.subtitle')}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {QA.map((item, i) => (
          <div key={item.q} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
            <button
              type="button"
              id={`faq-q-${i}`}
              aria-expanded={open === i}
              aria-controls={`faq-a-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', border: 'none', background: 'transparent', padding: 'var(--space-4) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ flex: 1, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{item.q}</span>
              <ChevronDown size={18} style={{ color: 'var(--text-muted)', transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 180ms var(--ease-out)', flexShrink: 0 }} />
            </button>
            {open === i && (
              <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} style={{ padding: '0 var(--gutter-card) var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)', animation: 'fadeIn 140ms var(--ease-out)' }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{contentGet('faq.not_found_title')}</h3>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 480 }}>{contentGet('faq.not_found_desc')}</p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="primary" size="md" onClick={go('chat')}>{contentGet('faq.cta_request')}</Button>
          <Button variant="outline" size="md" onClick={() => window.open('https://zalo.me/0905221334', '_blank')}>{contentGet('faq.cta_zalo')}</Button>
        </div>
      </div>
    </div>
  );
}
