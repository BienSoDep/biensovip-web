import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Badge, Eyebrow } from '../components/index.jsx';
import LazyImage from '../components/LazyImage.jsx';
import { contentGet, contentItems } from '../lib/content/index.js';
import { useFeaturedPromoVideos } from '../services/promoVideoService.js';
import TikTokEmbed from '../components/TikTokEmbed.jsx';

export default function About({ go }) {
  const { data: videosData } = useFeaturedPromoVideos(6);
  const videos = videosData?.items || [];
  const [openFaq, setOpenFaq] = useState(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const STATS = contentItems('about.stats.items').map((s) => [s.n, s.l]);
  const TIMELINE = contentItems('about.timeline.items').map((t) => [t.key, t.title, t.desc]);
  const STEPS = contentItems('about.steps.items').map((s) => [s.title, s.desc]);
  const VALUES = contentItems('about.values.items').map((v) => [v.title, v.desc]);
  const TESTIMONIALS = contentItems('about.testimonials.items').map((t) => [t.who, t.quote]);
  const FAQ = contentItems('about.faq.items').map((f) => [f.q, f.a]);
  const T = contentGet;
  return (
    <section style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-9)', animation: 'pageIn 180ms var(--ease-out)' }}>

      {/* Intro + portrait */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'center' }}>
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Eyebrow tone="blue">{T('about.intro.eyebrow')}</Eyebrow>
          <h1 style={{ margin: 0, font: 'var(--type-display-1)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{T('about.intro.title')}</h1>
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-body)', maxWidth: 'var(--width-prose)' }}>{T('about.intro.p1')}</p>
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-body)', maxWidth: 'var(--width-prose)' }}>{T('about.intro.p2')}</p>
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-body)', maxWidth: 'var(--width-prose)' }}>{T('about.intro.p3')}</p>
        </div>
        <div style={{ flex: '1 1 240px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 'min(100%, 300px)', aspectRatio: '1/1.05', background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-surface)', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', boxShadow: 'var(--shadow-3)' }}>
            <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <Badge tone="dark">{T('about.intro.badge_founder')}</Badge>
              <Badge tone="mint">{T('about.intro.portrait_caption')}</Badge>
            </div>
            <LazyImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=70" alt={T('about.intro.portrait_alt')} style={{ position: 'absolute', inset: 0 }} imgStyle={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 18px', background: 'linear-gradient(180deg, rgba(255,255,255,0), var(--ink-900))', color: 'var(--white)', font: 'var(--type-title-3)' }}>{T('about.intro.portrait_caption')}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 'var(--space-5)' }}>
        {STATS.map(([n, l]) => (
          <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--action-primary)' }}>{n}</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Eyebrow tone="blue">{T('about.timeline.eyebrow')}</Eyebrow>
        <div className={'about-timeline' + (timelineOpen ? ' open' : '')} style={{ display: 'flex', flexDirection: 'column' }}>
          {TIMELINE.map(([y, t, d], i) => (
            <div key={y} className={i >= 3 ? 'about-timeline-item-extra' : ''} style={{ display: 'flex', gap: 'var(--space-5)', paddingBottom: i === TIMELINE.length - 1 ? 0 : 'var(--space-5)', position: 'relative' }}>
              <div style={{ flex: '0 0 64px', paddingTop: 2, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--action-primary)' }}>{y}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', borderLeft: '2px solid var(--border-hairline)', paddingLeft: 'var(--space-5)' }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{t}</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{d}</span>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="about-timeline-toggle pressable" aria-expanded={timelineOpen} onClick={() => setTimelineOpen((v) => !v)} style={{ display: 'none', border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', height: 36, padding: '0 16px', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', cursor: 'pointer', alignSelf: 'flex-start' }}>{timelineOpen ? T('about.timeline.toggle_close') : T('about.timeline.toggle_open')}</button>
      </div>

      {/* Values */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Eyebrow tone="blue">{T('about.values.eyebrow')}</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 'var(--gutter-section)' }}>
          {VALUES.map(([t, d]) => (
            <div key={t} style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{t}</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured videos */}
      {videos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <Eyebrow tone="blue">Video nổi bật</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--gutter-section)' }}>
            {videos.map((v) => (
              <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ width: '100%', borderRadius: 'var(--radius-card)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', justifyContent: 'center' }}>
                  {v.platform === 'tiktok' ? (
                    <TikTokEmbed videoUrl={v.videoUrl} title={v.title} />
                  ) : (
                    <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Xem video: ${v.title || ''}`} style={{ position: 'relative', display: 'block', width: '100%', minHeight: 300, borderRadius: 'var(--radius-card)', overflow: 'hidden', background: 'var(--surface-sunken)' }}>
                      {v.thumbnailUrl ? (
                        <LazyImage src={v.thumbnailUrl} alt={v.title || ''} style={{ minHeight: 300 }} imgStyle={{ width: '100%', height: '100%', minHeight: 300, objectFit: 'cover', display: 'block' }} skeletonHeight={300} />
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 300, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Xem video</span>
                      )}
                      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>▶</span>
                      </span>
                    </a>
                  )}
                </div>
                {v.title && <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{v.title}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Eyebrow tone="blue">{T('about.steps.eyebrow')}</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'var(--gutter-section)' }}>
          {STEPS.map(([t, d], i) => (
            <div key={t} style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ width: 30, height: 30, borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-title-3)' }}>{i + 1}</span>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{t}</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Eyebrow tone="blue">{T('about.testimonials.eyebrow')}</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 'var(--gutter-section)' }}>
          {TESTIMONIALS.map(([who, q]) => (
            <div key={who} style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <span aria-hidden style={{ font: 'var(--type-display-2)', color: 'var(--action-primary)', lineHeight: 1 }}>“</span>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', fontStyle: 'italic' }}>{q}</p>
              <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{who}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Eyebrow tone="blue">{T('about.faq.eyebrow')}</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {FAQ.map(([q, a], i) => {
            const open = openFaq === i;
            return (
              <div key={q} className={'about-faq-item' + (open ? ' open' : '')} style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <button type="button" className="about-faq-toggle pressable" onClick={() => setOpenFaq(open ? null : i)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                  <span>{q}</span>
                  <ChevronDown size={18} className="about-faq-chevron" style={{ flexShrink: 0, transition: 'transform 160ms var(--ease-out)', transform: open ? 'rotate(180deg)' : 'none' }} />
                </button>
                <span className="about-faq-answer" style={{ display: open ? 'block' : undefined, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{a}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'var(--surface-inverse)', borderRadius: 'var(--radius-card)', padding: 'clamp(24px,4vw,40px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-5)' }}>
        <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--white)' }}>{T('about.cta.title')}</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'rgba(255,255,255,.66)' }}>{T('about.cta.desc')}</span>
        </div>
        <Button variant="primary" size="lg" uppercase onClick={go('list')}>{T('about.cta.button')}</Button>
      </div>

      {/* Contact */}
      <div className="about-contact" style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{T('about.contact.shop_label')}</span><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{T('about.contact.shop_value')}</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{T('about.contact.phone_label')}</span><a href={`tel:${T('about.contact.phone_value').replace(/[^0-9]/g, '')}`} style={{ font: 'var(--type-title-3)' }}>{T('about.contact.phone_value')}</a></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{T('about.contact.zalo_label')}</span><a href={`https://${T('about.contact.zalo_value')}`} target="_blank" rel="noopener noreferrer" style={{ font: 'var(--type-title-3)' }}>{T('about.contact.zalo_value')}</a></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{T('about.contact.address_label')}</span><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{T('about.contact.address_value')}</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{T('about.contact.hours_label')}</span><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{T('about.contact.hours_value')}</span></div>
      </div>
    </section>
  );
}
