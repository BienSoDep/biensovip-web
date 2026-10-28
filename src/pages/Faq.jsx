import { useEffect } from 'react';
import Button from '../components/Button.jsx';
import MotionAccordion from '../components/MotionAccordion.jsx';
import { PageHeader } from '../components/index.jsx';
import { contentGet, contentItems } from '../lib/content/index.js';
import { usePolicyPage } from '../services/policyPages.js';
import { useFaqSets } from '../services/faqHowTo.js';
import { toZaloUrl } from '../lib/zaloMessage.js';

export default function Faq({ go, zalo }) {
  const { data: db } = usePolicyPage('faq');
  const dbContent = db ? (() => { try { return JSON.parse(db.contentJson); } catch { return null; } })() : null;
  const policyQA = dbContent?.items || contentItems('faq.items');
  // Kho FAQ chung (gắn theo bài blog) nối tiếp bên dưới nội dung chính sách cũ — 2 nguồn tách biệt,
  // không thay thế nhau. field q/a (policy) khác question/answer (kho) — chuẩn hóa về 1 shape khi gộp.
  const { data: faqSetsData } = useFaqSets();
  const poolQA = (faqSetsData?.items || []).flatMap((s) => s.items).map((it) => ({ q: it.question, a: it.answer }));
  const QA = [...policyQA, ...poolQA];
  const title = db?.title || contentGet('faq.title');
  const subtitle = db?.subtitle || contentGet('faq.subtitle');

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
      <PageHeader
        eyebrow="Hỗ trợ & Giải đáp"
        title={title}
        subtitle={subtitle}
      />

      <MotionAccordion items={QA} />

      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{contentGet('faq.not_found_title')}</h3>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 480 }}>{contentGet('faq.not_found_desc')}</p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="primary" size="md" onClick={go('chat')}>{contentGet('faq.cta_request')}</Button>
          <Button variant="outline" size="md" onClick={() => window.open(toZaloUrl(zalo || '0815792699'), '_blank')}>{contentGet('faq.cta_zalo')}</Button>
        </div>
      </div>
    </div>
  );
}
