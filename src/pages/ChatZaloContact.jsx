import { Send, MessageSquare, ClipboardCheck, HandCoins, FileSignature, KeyRound } from 'lucide-react';
import ContactRequestForm from '../components/ContactRequestForm.jsx';
import ContactChannelList from '../components/ContactChannelList.jsx';
import { content } from '../lib/content/index.js';
import { usePolicyPage } from '../services/policyPages.js';

const PROCESS_ICONS = [MessageSquare, ClipboardCheck, HandCoins, FileSignature, KeyRound];

export default function ChatZaloContact({ notify, user }) {
  const { data: processDb } = usePolicyPage('process');
  const processContent = processDb ? (() => { try { return JSON.parse(processDb.contentJson); } catch { return null; } })() : null;
  const processDetail = processContent?.detail || content.process.detail;
  const processSteps = processContent?.steps || content.process.steps;

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h1 style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Liên hệ tư vấn</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>Chọn kênh phù hợp — phản hồi trong 15 phút, kể cả cuối tuần.</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 'var(--gutter-section)' }}>
        <ContactChannelList notify={notify} zaloSource="contact_page" />

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-pill)', background: 'var(--surface-tint-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={22} style={{ color: 'var(--action-primary)' }} /></div>
            <div><h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Gửi yêu cầu</h3><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Gọi lại trong 15 phút.</span></div>
          </div>
          <ContactRequestForm user={user} source="contact-page" />
        </div>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div>
          <h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{processDetail.title}</h2>
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{processDetail.desc}</p>
        </div>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {processSteps.map((s, i) => {
            const Icon = PROCESS_ICONS[i] || MessageSquare;
            const isLast = i === processSteps.length - 1;
            return (
              <div key={s.title} style={{ position: 'relative', display: 'flex', gap: 'var(--space-4)', paddingBottom: isLast ? 0 : 'var(--space-6)' }}>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', boxShadow: 'var(--shadow-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    <Icon size={20} style={{ color: 'var(--white)' }} />
                  </div>
                  {!isLast && <div style={{ position: 'absolute', top: 44, bottom: 0, width: 2, background: 'var(--border-hairline)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8 }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>Bước {i + 1}</span>
                  <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{s.title}</span>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{s.detail}</span>
                  {s.imageUrl && (
                    <img src={s.imageUrl} alt={s.title} style={{ marginTop: 8, maxWidth: 420, width: '100%', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-inset-hairline)' }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
        {[['Địa chỉ', content.info.address], ['Giờ làm việc', content.info.hours], ['Email', content.info.email]].map(([label, value]) => (
          <div key={label} style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
