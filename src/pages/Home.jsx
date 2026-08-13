import { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, Phone } from 'lucide-react';
import Button from '../components/Button.jsx';
import { SearchField, Badge, Eyebrow, Input } from '../components/index.jsx';
import PlateCard from '../components/PlateCard.jsx';
import NavBtn, { pill } from '../components/NavBtn.jsx';
import { useStaggeredReveal } from '../hooks/useStaggeredReveal.js';
import { contentGet } from '../lib/content/index.js';
import { useCategories } from '../services/categories.js';
import { useFeaturedPlates } from '../services/plates.js';
import { useCompareIds } from '../services/compareService.js';
import { useFeaturedPromoVideos } from '../services/promoVideoService.js';
import { useSubmitContact } from '../services/contactService.js';

export default function Home({ st, patch, go, notify, heroAnim, openPlate, openBuy, favs, onFav }) {
  const stagger = useStaggeredReveal();
  const T = contentGet;
  const { data: plateTypes } = useCategories('plate_type');
  const { data: featured, isLoading: featuredLoading } = useFeaturedPlates(6);
  const featuredItems = featured || [];
  const { add: addCompare, remove: removeCompare, isInList } = useCompareIds();
  const { data: featuredVideos } = useFeaturedPromoVideos(3);
  const featuredVideoItems = featuredVideos?.items || [];

  const submitContact = useSubmitContact();
  const [cForm, setCForm] = useState({ fullName: '', phone: '', note: '' });
  const zalo = (st.settings?.zalo || '').replace(/[^0-9]/g, '');
  const hotline = st.settings?.phone || '';

  const handleContactSubmit = () => {
    if (!cForm.fullName.trim() || !cForm.phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại.');
      return;
    }
    if (!/^0\d{8,10}$/.test(cForm.phone.trim().replace(/[\s\-\.]/g, ''))) {
      toast.error('Số điện thoại chưa đúng định dạng.');
      return;
    }
    submitContact.mutate({
      fullName: cForm.fullName.trim(),
      phone: cForm.phone.trim(),
      plateId: null,
      note: cForm.note.trim() || null,
      source: 'home-page',
      intent: 'inquiry',
      depositAmount: null,
      honeypot: null,
    }, {
      onSuccess: () => {
        toast.success('Đã gửi yêu cầu, chúng tôi sẽ liên hệ trong thời gian sớm nhất!');
        setCForm({ fullName: '', phone: '', note: '' });
      },
      onError: (err) => toast.error(err?.message || 'Gửi thất bại, vui lòng thử lại.'),
    });
  };

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ padding: '0 var(--pad-page)', margin: '15px 0' }}>
        <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', background: 'var(--surface-hero)', borderRadius: 'var(--radius-surface)', padding: 'clamp(24px,8vw,64px)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)', alignItems: 'center' }}>
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <Eyebrow tone="blue" className="hero-eyebrow">{T('home.hero.eyebrow')}</Eyebrow>
            <h1 style={{ margin: 0, font: 'var(--type-display-1)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{T('home.hero.title_line1')}<br />{T('home.hero.title_line2')}</h1>
            <p className="hero-desc" style={{ margin: 0, maxWidth: 'var(--width-prose)', font: 'var(--type-body)', color: 'var(--text-body)' }}>{T('home.hero.desc')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }} className="hero-cta-row">
              <Button variant="primary" size="lg" uppercase onClick={go('list')}>{T('home.hero.cta_list')}</Button>
              <Button variant="outline" size="lg" onClick={() => notify(T('home.hero.zalo_notify'))}>{T('home.hero.cta_zalo')}</Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)', paddingTop: 'var(--space-6)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>{T('home.hero.stat_1_n')}</span><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{T('home.hero.stat_1_l')}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>{T('home.hero.stat_2_n')}</span><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{T('home.hero.stat_2_l')}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>{T('home.hero.stat_3_n')}</span><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{T('home.hero.stat_3_l')}</span></div>
            </div>
          </div>
          <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 520, aspectRatio: '1.42/1' }} className="hero-plate-container">
              <img src="/assets/hero-plate-left.png" alt="Biển số 43A 888.88" style={{ position: 'absolute', left: '-1%', top: '-1%', width: '71%', zIndex: 1, transform: 'rotate(-13deg)', animation: heroAnim('fanLeft', 100) }} />
              <img src="/assets/hero-plate-right.png" alt="Biển số 43K 556.68" style={{ position: 'absolute', left: '25%', top: '47%', width: '71%', zIndex: 2, transform: 'rotate(7deg)', animation: heroAnim('fanRight', 180) }} />
              <img src="/assets/hero-plate-main.png" alt="Biển số 43A1 999.99" style={{ position: 'absolute', left: '8%', top: '15%', width: '84%', zIndex: 3, transform: 'rotate(-5deg)', animation: heroAnim('fanMain', 0) }} />
            </div>
            <div style={{ width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '0 4px' }}>
              <Badge tone="rose">{T('home.hero.plate_badge')}</Badge>
              <div style={{ flex: 1 }} />
              <span style={{ font: 'var(--type-price)', color: 'var(--text-strong)' }}>{T('home.hero.plate_price')}</span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 'var(--width-content)', margin: '-26px auto 0', padding: '0 var(--pad-page)', position: 'relative', zIndex: 5 }}>
        <div className="home-search-bar" style={{ background: 'var(--white)', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-3)', padding: '10px 14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="home-search-field" style={{ flex: '1 1 180px', minWidth: 140, maxWidth: 360 }}><SearchField placeholder={T('home.search.placeholder')} value={st.q} onChange={(e) => patch({ q: e.target.value, page: 1 })} width="100%" /></div>
          <div className="home-search-cats" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', flex: 1 }}>
            <NavBtn onClick={() => patch({ cat: 'Tất cả', page: 1 })} {...pill(st.cat === 'Tất cả')}>{T('home.search.all')}</NavBtn>
            {(plateTypes?.items || []).map((c) => (
              <NavBtn key={c.id} onClick={() => patch({ cat: c.name, page: 1 })} {...pill(st.cat === c.name)}>{c.name}</NavBtn>
            ))}
          </div>
          <Button variant="primary" size="md" onClick={go('list')} className="home-search-btn">{T('home.search.button')}</Button>
        </div>
      </section>

      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page) 0', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Eyebrow tone="blue" className="section-eyebrow">{T('home.featured.eyebrow')}</Eyebrow>
          <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{T('home.featured.title')}</h2>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{T('home.featured.desc')}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={go('list')}>{T('home.featured.all')}</Button>
      </section>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-6) var(--pad-page) var(--pad-section-y)', animation: 'fadeIn 180ms var(--ease-out)' }}>
        {featuredLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(276px,100%),1fr))', gap: 'var(--gutter-section)' }}>
            {Array.from({ length: 6 }, (_, i) => <div key={i} style={{ height: 320, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)' }} />)}
          </div>
        ) : featuredItems.length === 0 ? (
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '48px var(--space-6)', textAlign: 'center' }}>
            <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>{T('home.featured.empty')} <button type="button" onClick={go('list')} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--action-primary)', textDecoration: 'underline' }}>{T('home.featured.empty_link')}</button></p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(276px,100%),1fr))', gap: 'var(--gutter-section)' }}>
            {featuredItems.map((p, i) => (
              <PlateCard key={p.id} {...p}
                fav={!!favs?.[p.id]}
                onFav={onFav ? () => onFav(p.id) : undefined}
                onCompare={() => isInList(p.id) ? removeCompare(p.id) : addCompare(p.id)}
                inCompare={isInList(p.id)}
                onOpen={() => openPlate(p.id)}
                onBuy={() => openBuy?.(p.id)}
                style={stagger(i)} />
            ))}
          </div>
        )}
      </section>

      {featuredVideoItems.length > 0 && (
        <section className="home-video-section" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Eyebrow tone="blue" className="section-eyebrow">{T('home.video.eyebrow')}</Eyebrow>
            <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{T('home.video.featured_title')}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: 'var(--gutter-section)' }}>
            {featuredVideoItems.map((v) => (
              <div key={v.id} style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', aspectRatio: v.platform === 'tiktok' ? '9/14' : '16/9', overflow: 'hidden' }}>
                <iframe src={v.videoUrl} title={v.title || 'Video'} style={{ width: '100%', height: '100%', border: 0 }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--pad-section-y)' }}>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-surface)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'clamp(28px,4vw,52px)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Eyebrow tone="blue">{T('home.contact.eyebrow')}</Eyebrow>
            <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{T('home.contact.title')}</h2>
            <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{T('home.contact.desc')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
              <Button variant="primary" size="lg" onClick={() => { window.open(`https://zalo.me/${zalo}`, '_blank'); notify(T('home.hero.zalo_notify')); }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><MessageCircle size={18} />{T('home.contact.zalo_cta')}</span>
              </Button>
              {hotline && (
                <a href={`tel:${hotline.replace(/[^0-9]/g, '')}`} style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="lg"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Phone size={18} />{hotline}</span></Button>
                </a>
              )}
            </div>
          </div>
          <div style={{ flex: '1 1 320px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <h3 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{T('home.contact.form_title')}</h3>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{T('home.contact.form_sub')}</p>
            </div>
            <Input label={T('home.contact.name')} placeholder="Nguyễn Văn A" value={cForm.fullName} onChange={(e) => setCForm((f) => ({ ...f, fullName: e.target.value }))} />
            <Input label={T('home.contact.phone')} placeholder="09xx xxx xxx" value={cForm.phone} onChange={(e) => setCForm((f) => ({ ...f, phone: e.target.value }))} />
            <textarea rows={3} placeholder={T('home.contact.note')} value={cForm.note} onChange={(e) => setCForm((f) => ({ ...f, note: e.target.value }))} style={{ background: 'var(--white)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
            <Button variant="primary" size="lg" fullWidth onClick={handleContactSubmit} disabled={submitContact.isPending}>{submitContact.isPending ? T('home.contact.sending') : T('home.contact.submit')}</Button>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 var(--pad-page) var(--pad-section-y)' }}>
        <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', background: 'var(--surface-inverse)', borderRadius: 'var(--radius-surface)', padding: 'clamp(28px,4vw,52px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-8)' }}>
          <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Eyebrow tone="inverse">{T('home.guide.eyebrow')}</Eyebrow>
            <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--white)' }}>{T('home.guide.title')}</h2>
            <p style={{ margin: 0, font: 'var(--type-body)', color: 'rgba(255,255,255,.72)', maxWidth: 'var(--width-prose)' }}>{T('home.guide.desc')}</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <Button variant="primary" size="lg" onClick={go('blog')}>{T('home.guide.cta_blog')}</Button>
            <Button variant="outline" size="lg" onClick={go('about')}>{T('home.guide.cta_about')}</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
