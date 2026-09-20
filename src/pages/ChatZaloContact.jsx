import { Send, MessageSquare, ClipboardCheck, HandCoins, FileSignature, KeyRound, Clock, ShieldCheck, BadgeCheck } from 'lucide-react';
import ContactRequestForm from '../components/ContactRequestForm.jsx';
import ContactChannelList from '../components/ContactChannelList.jsx';
import { content } from '../lib/content/index.js';
import { optimizeImageUrl } from '../lib/cloudinary.js';
import { usePolicyPage } from '../services/policyPages.js';

const PROCESS_ICONS = [MessageSquare, ClipboardCheck, HandCoins, FileSignature, KeyRound];

export default function ChatZaloContact({ notify, user }) {
  const { data: processDb } = usePolicyPage('process');
  const processContent = processDb ? (() => { try { return JSON.parse(processDb.contentJson); } catch { return null; } })() : null;
  const processDetail = processContent?.detail || content.process.detail;
  const processSteps = processContent?.steps || content.process.steps;

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <section className="contact-hero">
        <div className="contact-hero__glow" aria-hidden="true" />
        <svg className="contact-hero__decor" aria-hidden="true" width="180" height="150" viewBox="0 0 180 150" fill="none">
          <path d="M24 32c8-9 24-9 32 0" stroke="var(--action-primary)" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 48c4-5 12-5 16 0" stroke="var(--brand-400)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="34" cy="78" r="4" fill="var(--action-primary)" />
          <circle cx="54" cy="98" r="3" fill="var(--brand-400)" />
          <path d="M78 88l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="var(--status-warning)" />
          <path d="M120 26l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="var(--action-primary)" opacity="0.7" />
          <path d="M128 104c-10 0-16 6-16 16h32c0-10-6-16-16-16z" fill="var(--action-primary)" opacity="0.35" />
          <rect x="108" y="120" width="40" height="22" rx="11" fill="var(--white)" stroke="var(--border-hairline)" strokeWidth="1.5" />
          <circle cx="118" cy="131" r="2" fill="var(--action-primary)" />
          <circle cx="126" cy="131" r="2" fill="var(--action-primary)" />
          <circle cx="134" cy="131" r="2" fill="var(--action-primary)" />
        </svg>
        <div className="contact-hero__text">
          <h1 style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Liên hệ tư vấn</h1>
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>Chọn kênh phù hợp — phản hồi trong 15 phút, kể cả cuối tuần.</p>
          <div className="contact-hero__chips">
            <span className="contact-hero__chip"><Clock size={14} />Phản hồi &lt; 15 phút</span>
            <span className="contact-hero__chip"><ShieldCheck size={14} />Bảo mật thông tin</span>
            <span className="contact-hero__chip"><BadgeCheck size={14} />Tư vấn miễn phí</span>
          </div>
        </div>
        <div className="contact-hero__media">
          <img
            className="contact-hero__img"
            src={optimizeImageUrl('https://res.cloudinary.com/dvwt6npcl/image/upload/v1789878152/biensovip/branding/contact.png')}
            alt="Biensovip — đội ngũ tư vấn biển số"
          />
          <span className="contact-hero__badge"><span className="contact-hero__badge-dot" aria-hidden="true" />Tư vấn tận tâm 24/7</span>
        </div>
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
