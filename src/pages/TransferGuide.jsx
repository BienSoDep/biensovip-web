import { PhoneCall, HelpCircle, ShieldCheck } from 'lucide-react';
import Button from '../components/Button.jsx';
import SpotlightCard from '../components/SpotlightCard.jsx';
import MotionAccordion from '../components/MotionAccordion.jsx';
import { PageHeader } from '../components/index.jsx';
import AuthorBox from '../components/AuthorBox.jsx';
import { contentGet, contentItems } from '../lib/content/index.js';
import { usePolicyPage } from '../services/policyPages.js';
import { toZaloUrl } from '../lib/zaloMessage.js';

export default function TransferGuide({ go, zalo }) {
  const { data: db } = usePolicyPage('transfer');
  const dbContent = db ? (() => { try { return JSON.parse(db.contentJson); } catch { return null; } })() : null;
  const steps = dbContent?.steps || contentItems('transfer.steps');
  const notes = dbContent?.notes || contentItems('transfer.notes');
  const faqs = dbContent?.faqs || contentItems('transfer.faqs');
  const title = db?.title || contentGet('transfer.title');
  const subtitle = db?.subtitle || contentGet('transfer.subtitle');
  const updated = db?.updatedLabel || contentGet('transfer.updated');
  const faqsTitle = dbContent?.faqs_title || contentGet('transfer.faqs_title');

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <PageHeader
        eyebrow="Thủ tục pháp lý"
        title={title}
        subtitle={subtitle}
      >
        {updated && <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-medium)' }}>{updated}</p>}
      </PageHeader>

      {/* 4 Bước quy trình chuẩn */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {steps.map((s, i) => (
          <SpotlightCard
            key={s.key || s.title || i}
            size={400}
            spotlightColor="rgba(241, 151, 32, 0.12)"
            borderColor="rgba(241, 151, 32, 0.28)"
            tilt={true}
            maxTilt={2.5}
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-inset-hairline)',
              padding: 'var(--gutter-card)',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--action-primary-text, var(--ink-900))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, font: 'var(--type-title-3)', fontWeight: 800 }}>{i + 1}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{s.title}</h3>
                <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>{s.desc}</p>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>

      {/* Lưu ý pháp lý quan trọng */}
      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ShieldCheck size={20} style={{ color: 'var(--action-primary)' }} />
          <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{contentGet('transfer.notes_title')}</h3>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>
          {notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </div>

      {/* FAQ Accordion về Sang tên */}
      {faqs && faqs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <HelpCircle size={22} style={{ color: 'var(--action-primary)' }} />
            <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{faqsTitle || 'Hỏi đáp thủ tục sang tên (Thông tư 24)'}</h2>
          </div>
          <MotionAccordion items={faqs} />
        </div>
      )}

      {/* Banner tư vấn hỗ trợ */}
      <SpotlightCard
        size={500}
        spotlightColor="rgba(241, 151, 32, 0.14)"
        borderColor="rgba(241, 151, 32, 0.28)"
        tilt={true}
        maxTilt={2}
        style={{
          background: 'var(--surface-tint-cream)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--space-6) var(--gutter-card)',
          boxShadow: 'var(--shadow-1)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-6)', width: '100%' }}>
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <PhoneCall size={18} style={{ color: 'var(--action-primary)' }} />
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{contentGet('transfer.need_help_title')}</span>
            </div>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{contentGet('transfer.need_help_desc')}</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button
              variant="primary"
              size="md"
              shimmer
              rollingText
              onClick={() => window.open(toZaloUrl(zalo || '0815792699'), '_blank')}
            >
              {contentGet('transfer.cta_zalo')}
            </Button>
            <Button variant="outline" size="md" onClick={go('list')}>{contentGet('transfer.cta_list')}</Button>
          </div>
        </div>
      </SpotlightCard>

      {/* Tác giả E-E-A-T Chuyên gia Duy Đinh */}
      <AuthorBox style={{ margin: 0 }} />
    </div>
  );
}
