import { useEffect, useState } from 'react';
import { Play, SearchX, BadgeCheck, GalleryThumbnails, LayoutGrid, ShieldCheck, Clock, HandCoins, Sparkles, ArrowRight, FileCheck2 } from 'lucide-react';
import Button from '../components/Button.jsx';
import { SearchField, Eyebrow } from '../components/index.jsx';
import PlateCard from '../components/PlateCard.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import SpotlightCard from '../components/SpotlightCard.jsx';
import MotionPlateGallery from '../components/MotionPlateGallery.jsx';
import ContactChannelList from '../components/ContactChannelList.jsx';
import NavBtn, { pill } from '../components/NavBtn.jsx';
import { useStaggeredReveal } from '../hooks/useStaggeredReveal.js';
import { useHomeHeroMotion } from '../hooks/useHomeHeroMotion.js';
import { contentGet } from '../lib/content/index.js';
import { optimizeImageUrl } from '../lib/cloudinary.js';
import { useCategories } from '../services/categories.js';
import { useFeaturedPlates, usePlates } from '../services/plates.js';
import { useCompareIds } from '../services/compareService.js';
import { useFeaturedPromoVideos } from '../services/promoVideoService.js';
import TikTokEmbed from '../components/TikTokEmbed.jsx';
import EmailCapture from '../components/EmailCapture.jsx';
import { trackViewItemList, trackSelectItem } from '../services/tracking/events.js';
import { routeFor } from '../config/routes.js';
import ContactRequestForm from '../components/ContactRequestForm.jsx';
import { useSiteRating } from '../services/siteRating.js';
import { useActivityFeed } from '../services/activityFeed.js';
import { toZaloUrl } from '../lib/zaloMessage.js';

import { THEMATIC_PLATE_TYPES } from '../data/homePlateTypes.js';
import { useDebounce } from '../hooks/useDebounce.js';


export default function Home({ settings, go, notify, _heroAnim, openPlate, openBuy, favs, onFav, contact, user }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tất cả');
  const [viewMode, setViewMode] = useState('gallery');
  const stagger = useStaggeredReveal();
  const T = contentGet;
  const { data: plateTypes } = useCategories('plate_type');
  const { data: featured, isLoading: featuredLoading } = useFeaturedPlates(8);
  const featuredItems = featured || [];
  const { data: siteRating } = useSiteRating();
  const { data: plateCountData } = usePlates({ perPage: 1 });
  const { data: activityFeed } = useActivityFeed(6);
  const feedItems = activityFeed?.items || [];
  const { add: addCompare, remove: removeCompare, isInList } = useCompareIds();
  const { data: featuredVideos } = useFeaturedPromoVideos(3);
  const featuredVideoItems = featuredVideos?.items || [];
  const { data: soldData } = usePlates({ status: 'sold', perPage: 14 });
  const soldItems = soldData?.items || [];

  // Home search: catId/qDebounced empty = show featured plates as before.
  // Any non-empty selection replaces that section with live search results (usePlates is React
  // Query, so identical filters within the session are served from cache instead of refetching).
  const debouncedQ = useDebounce(q, 300);
  const selectedCatId = cat !== 'Tất cả' ? (plateTypes?.items || []).find((c) => c.name === cat)?.id : null;
  const isSearching = !!debouncedQ.trim() || !!selectedCatId;
  const searchFilters = { q: debouncedQ.trim() || undefined, cat: selectedCatId ? [selectedCatId] : undefined, perPage: 12 };
  const { data: searchResult, isLoading: searchLoading } = usePlates(searchFilters, { enabled: isSearching });
  const searchItems = isSearching ? (searchResult?.items || []) : [];

  const displayItems = isSearching ? searchItems : featuredItems;
  const displayLoading = isSearching ? searchLoading : featuredLoading;

  const { containerRef, heroRef, visualCardRef, searchBarRef, statCountRef } = useHomeHeroMotion({
    totalPlates: plateCountData?.total,
    dataDeps: [displayItems.length, soldItems.length, featuredVideoItems.length],
  });

  useEffect(() => {
    if (!displayLoading && displayItems.length > 0) trackViewItemList('home_featured', displayItems);
  }, [displayLoading, displayItems]);

  const zalo = (settings?.zalo || '').replace(/[^0-9]/g, '');

  return (
    <div ref={containerRef} className="home-page-container" style={{ animation: 'pageIn 180ms var(--ease-out)', position: 'relative' }}>
      <div className="home-scroll-progress" aria-hidden="true" />
      <section ref={heroRef} style={{ padding: '0 var(--pad-page)', margin: '15px 0' }}>
        <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', background: 'var(--surface-hero)', borderRadius: 'var(--radius-surface)', padding: 'clamp(24px,8vw,64px)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)', alignItems: 'center' }}>
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <Eyebrow tone="blue" className="hero-eyebrow">{plateCountData && plateCountData.total >= 395 ? `${plateCountData.total.toLocaleString('vi-VN')} biển số đang chờ chủ mới` : '395 biển số đang chờ chủ mới'}</Eyebrow>
            <h1 className="hero-title" style={{ margin: 0, font: 'var(--type-display-1)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>
              <span className="hero-title-line" style={{ display: 'block' }}>{T('home.hero.title_line1')}</span>
              <span className="hero-title-line" style={{ display: 'block' }}>{T('home.hero.title_line2')}</span>
            </h1>
            <p className="hero-desc" style={{ margin: 0, maxWidth: 'var(--width-prose)', font: 'var(--type-body)', color: 'var(--text-body)' }}>{T('home.hero.desc')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }} className="hero-cta-row">
              <Button className="hero-cta-btn" variant="primary" size="lg" uppercase shimmer rollingText onClick={go('list')}>{T('home.hero.cta_list')}</Button>
              <Button className="hero-cta-btn" variant="outline" size="lg" magnetic onClick={() => { window.open(toZaloUrl(zalo), '_blank'); notify(T('home.hero.zalo_notify')); }}>{T('home.hero.cta_zalo')}</Button>
            </div>
            {feedItems.length > 0 && (
              <div className="hero-feed-pill" style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                <span className="live-dot" aria-hidden="true" />
                <span>{feedItems[0].fakeName} {feedItems[0].action} <strong style={{ color: 'var(--text-strong)' }}>{feedItems[0].plateNumber}</strong> · {feedItems[0].minutesAgo} phút trước</span>
              </div>
            )}
            <div className="hero-stats-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)', paddingTop: 'var(--space-6)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
              <div className="hero-stat-item" style={{ display: 'flex', flexDirection: 'column' }}>
                <span ref={statCountRef} className="hero-stat-count" style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>
                  {plateCountData && plateCountData.total >= 395 ? plateCountData.total.toLocaleString('vi-VN') : '395'}
                </span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{T('home.hero.stat_1_l')}</span>
              </div>
              <div className="hero-stat-item" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>{siteRating ? `${siteRating.avgRating.toFixed(1)}/5` : T('home.hero.stat_2_n')}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{T('home.hero.stat_2_l')}</span>
              </div>
              <div className="hero-stat-item" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>{T('home.hero.stat_3_n')}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{T('home.hero.stat_3_l')}</span>
              </div>
            </div>
          </div>
          <div style={{ flex: '1 1 340px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div className="hero-ambient-glow" aria-hidden="true" />
            <div ref={visualCardRef} className="hero-visual-card">
              <img
                className="hero-visual-img"
                src={optimizeImageUrl('https://res.cloudinary.com/dvwt6npcl/image/upload/v1789878145/biensovip/branding/home.png')}
                alt="Biển số đẹp Biensovip"
                loading="eager"
                fetchPriority="high"
              />
              <span className="hero-badge-floating">
                <BadgeCheck size={16} />
                <span>Bảo chứng chuẩn BCA</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Banner đăng ký email nhận thông báo — cùng bảng subscriber với ô footer */}
      <section className="home-email-banner" style={{ padding: '0 var(--pad-page)', margin: 'clamp(8px,2vw,20px) 0' }}>
        <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-surface)', padding: 'clamp(20px,4vw,40px)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Nhận thông báo biển số mới</span>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 420 }}>Đăng ký email để được báo khi có biển đẹp mới, giá và khuyến mãi — không bỏ lỡ biển hợp ý.</span>
          </div>
          <EmailCapture source="banner" style={{ flex: '1 1 300px', maxWidth: 460 }} />
        </div>
      </section>

      <section style={{ maxWidth: 'var(--width-content)', margin: '-26px auto 0', padding: '0 var(--pad-page)', position: 'relative', zIndex: 5 }}>
        <div ref={searchBarRef} className="home-search-bar" style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-3)', padding: '10px 14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="home-search-field" style={{ flex: '1 1 180px', minWidth: 140, maxWidth: 360 }}><SearchField placeholder={T('home.search.placeholder')} value={q} onChange={(e) => setQ(e.target.value)} width="100%" /></div>
          <div className="home-search-cats" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', flex: 1 }}>
            <NavBtn onClick={() => setCat('Tất cả')} {...pill(cat === 'Tất cả')}>{T('home.search.all')}</NavBtn>
            {(plateTypes?.items || []).map((c) => (
              <NavBtn key={c.id} onClick={() => setCat(c.name)} {...pill(cat === c.name)}>{c.name}</NavBtn>
            ))}
          </div>
          <Button variant="primary" size="md" onClick={go('list')} className="home-search-btn">{T('home.search.button')}</Button>
        </div>
      </section>

      <section className="home-featured-head" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page) 0', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Eyebrow tone="blue" className="section-eyebrow">{isSearching ? 'Kết quả tìm kiếm' : T('home.featured.eyebrow')}</Eyebrow>
          <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>
            {isSearching ? `${searchItems.length} biển số phù hợp` : T('home.featured.title')}
          </h2>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            {isSearching ? [debouncedQ.trim() && `đuôi "${debouncedQ.trim()}"`, selectedCatId && cat].filter(Boolean).join(' · ') : T('home.featured.desc')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {!isSearching && (
            <div className="home-featured-view-toggle" role="group" aria-label="Chế độ hiển thị">
              <button
                type="button"
                className={`home-featured-toggle-btn ${viewMode === 'gallery' ? 'home-featured-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('gallery')}
                aria-pressed={viewMode === 'gallery'}
                title="Hiển thị chuỗi lướt Gallery"
              >
                <GalleryThumbnails size={14} />
                <span>Lướt Gallery</span>
              </button>
              <button
                type="button"
                className={`home-featured-toggle-btn ${viewMode === 'grid' ? 'home-featured-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                title="Hiển thị dạng lưới danh sách"
              >
                <LayoutGrid size={14} />
                <span>Lưới</span>
              </button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={go('list')}>{isSearching ? 'Xem tất cả →' : T('home.featured.all')}</Button>
        </div>
      </section>
      <section className="home-featured-grid-wrap" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-6) var(--pad-page) var(--pad-section-y)', animation: 'fadeIn 180ms var(--ease-out)' }}>
        {displayLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(276px,100%),1fr))', gap: 'var(--gutter-section)' }}>
            {Array.from({ length: 6 }, (_, i) => <div key={i} style={{ height: 320, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)' }} />)}
          </div>
        ) : displayItems.length === 0 && isSearching ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '32px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
              <SearchX size={28} style={{ color: 'var(--text-faint)' }} />
              <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>Không tìm thấy biển số phù hợp. Thử đuôi số khác hoặc xem các biển nổi bật bên dưới.</p>
            </div>
            <div className="home-featured-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(276px,100%),1fr))', gap: 'var(--gutter-section)' }}>
              {featuredItems.map((p, i) => (
                <div key={p.id} className="home-featured-card">
                  <PlateCard {...p}
                    fav={!!favs?.[p.id]}
                    onFav={onFav ? () => onFav(p.id) : undefined}
                    onCompare={() => isInList(p.id) ? removeCompare(p.id) : addCompare(p.id)}
                    inCompare={isInList(p.id)}
                    onOpen={() => { trackSelectItem(p, 'home_featured'); openPlate(p.id); }}
                    href={routeFor('detail', p.slug || p.id)}
                    onBuy={() => openBuy?.(p.id)}
                    contact={contact}
                    style={stagger(i)} />
                </div>
              ))}
            </div>
          </div>
        ) : displayItems.length === 0 ? (
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '48px var(--space-6)', textAlign: 'center' }}>
            <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>{T('home.featured.empty')} <button type="button" onClick={go('list')} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--action-primary)', textDecoration: 'underline' }}>{T('home.featured.empty_link')}</button></p>
          </div>
        ) : viewMode === 'gallery' && !isSearching ? (
          <MotionPlateGallery
            items={displayItems}
            favs={favs}
            onFav={onFav}
            isInList={isInList}
            addCompare={addCompare}
            removeCompare={removeCompare}
            openPlate={openPlate}
            openBuy={openBuy}
            contact={contact}
          />
        ) : (
          <div className="home-featured-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(276px,100%),1fr))', gap: 'var(--gutter-section)' }}>
            {displayItems.map((p, i) => (
              <div key={p.id} className="home-featured-card">
                <PlateCard {...p}
                  fav={!!favs?.[p.id]}
                  onFav={onFav ? () => onFav(p.id) : undefined}
                  onCompare={() => isInList(p.id) ? removeCompare(p.id) : addCompare(p.id)}
                  inCompare={isInList(p.id)}
                  onOpen={() => { trackSelectItem(p, 'home_featured'); openPlate(p.id); }}
                  href={routeFor('detail', p.slug || p.id)}
                  onBuy={() => openBuy?.(p.id)}
                  contact={contact}
                  style={stagger(i)} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bộ sưu tập thế số đẹp phong thủy */}
      <section className="home-thematic-section" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="home-thematic-head" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Eyebrow tone="blue" className="section-eyebrow">{T('home.plate_types.eyebrow')}</Eyebrow>
            <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>
              {T('home.plate_types.title')}
            </h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>
              {T('home.plate_types.desc')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={go('list')}>{T('home.plate_types.all')}</Button>
        </div>

        <div className="home-thematic-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(280px,100%),1fr))', gap: 'var(--gutter-section)' }}>
          {THEMATIC_PLATE_TYPES.map((pt, i) => (
            <SpotlightCard
              key={pt.slug}
              as="a"
              href={`/${pt.slug}`}
              onClick={(e) => {
                e.preventDefault();
                history.pushState(null, '', `/${pt.slug}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="home-thematic-card pressable"
              spotlightColor={pt.spotlightColor}
              borderColor={pt.spotlightBorder}
              tilt={true}
              maxTilt={4}
              style={{
                textDecoration: 'none',
                background: pt.accent,
                border: `1px solid ${pt.borderColor}`,
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                boxShadow: 'var(--shadow-inset-hairline)',
                ...stagger(i),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)', padding: '2px 8px', borderRadius: 'var(--radius-xs)', background: 'var(--white)', color: 'var(--text-strong)', boxShadow: 'var(--shadow-1)' }}>
                  {pt.tag}
                </span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>Xem kho →</span>
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{pt.name}</h3>
                <span style={{ font: 'var(--type-code, monospace)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)', letterSpacing: '.05em' }}>{pt.examples}</span>
              </div>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.4 }}>{pt.desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {soldItems.length > 0 && (
        <section className="sold-marquee-section" style={{ margin: '48px 0', padding: '0 0 var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="sold-marquee-head" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page)', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Eyebrow tone="blue" className="section-eyebrow">Đã giao dịch thành công</Eyebrow>
            <h2 style={{ margin: '16px 0', font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-primary)' }}>Những biển số đã về chủ mới</h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Giao dịch thật, khách hàng thật — minh bạch giá bán.</p>
          </div>
          {(() => {
            let soldSeq = [...soldItems];
            while (soldSeq.length < 10) soldSeq = soldSeq.concat(soldItems);
            const duration = Math.max(35, Math.round((soldSeq.length * 324) / 48));
            return (
              <div className="plate-marquee sold-marquee">
                <div className="plate-marquee__track sold-marquee__track plate-marquee__track--grouped" style={{ animationDuration: `${duration}s` }}>
                  <div className="plate-marquee__group">
                    {soldSeq.map((p, i) => (
                      <div key={`sold-g1-${p.id}-${i}`} className="sold-marquee__item">
                        <PlateCard {...p}
                          onOpen={() => { trackSelectItem(p, 'home_sold'); openPlate(p.id); }}
                          href={routeFor('detail', p.slug || p.id)} />
                      </div>
                    ))}
                  </div>
                  <div className="plate-marquee__group" aria-hidden="true">
                    {soldSeq.map((p, i) => (
                      <div key={`sold-g2-${p.id}-${i}`} className="sold-marquee__item" tabIndex={-1}>
                        <PlateCard {...p}
                          onOpen={() => { trackSelectItem(p, 'home_sold'); openPlate(p.id); }}
                          href={routeFor('detail', p.slug || p.id)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {featuredVideoItems.length > 0 && (
        <section className="home-video-section" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="home-video-head" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Eyebrow tone="blue" className="section-eyebrow">{T('home.video.eyebrow')}</Eyebrow>
            <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{T('home.video.featured_title')}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: 'var(--gutter-section)' }}>
            {featuredVideoItems.map((v) => {
              // Tự động lấy YouTube thumbnail nếu không có thumbnailUrl trong DB
              let thumbSrc = v.thumbnailUrl || null;
              if (!thumbSrc && v.platform === 'youtube') {
                const ytMatch = v.videoUrl?.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([\w-]{11})/);
                if (ytMatch) thumbSrc = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
              }
              return (
                <SpotlightCard
                  key={v.id}
                  className={`home-video-item${v.platform === 'tiktok' ? ' home-video-item--tiktok' : ''}`}
                  spotlightColor="rgba(241, 151, 32, 0.15)"
                  borderColor="rgba(241, 151, 32, 0.35)"
                  tilt={true}
                  maxTilt={3.5}
                  style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}
                >
                  {v.platform === 'tiktok' ? (
                    <TikTokEmbed videoUrl={v.videoUrl} title={v.title} />
                  ) : (
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ position: 'relative', display: 'block', width: '100%', minHeight: 220, background: 'var(--surface-card)', textDecoration: 'none' }}
                    >
                      {thumbSrc ? (
                        <img
                          src={thumbSrc}
                          alt={v.title || 'Video'}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', minHeight: 220, objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220, color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>Xem video</div>
                      )}
                      {/* Play button overlay */}
                      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(14,15,18,0.72)', backdropFilter: 'blur(6px)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.45)', border: '1.5px solid rgba(255,255,255,0.25)' }}>
                          <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />
                        </span>
                      </span>
                      {/* Title overlay at bottom */}
                      {v.title && (
                        <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 14px 12px', background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)', font: 'var(--type-caption)', fontWeight: 600, color: '#fff', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                          {v.title}
                        </span>
                      )}
                    </a>
                  )}
                </SpotlightCard>
              );
            })}
          </div>
        </section>
      )}

      <section className="home-contact-section" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="home-contact-head" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Eyebrow tone="blue">{T('home.contact.eyebrow')}</Eyebrow>
          <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{T('home.contact.title')}</h2>
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{T('home.contact.desc')}</p>
        </div>
        <div className="home-contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 'var(--gutter-section)' }}>
          <ContactChannelList notify={notify} zaloSource="home_page" />
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <h3 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{T('home.contact.form_title')}</h3>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{T('home.contact.form_sub')}</p>
            </div>
            <ContactRequestForm user={user} source="home-page" compact />
          </div>
        </div>
      </section>

      <section className="home-guide-section" style={{ padding: '0 var(--pad-page) var(--pad-section-y)' }}>
        <SpotlightCard
          className="home-guide-card"
          spotlightColor="rgba(241, 151, 32, 0.20)"
          borderColor="rgba(241, 151, 32, 0.45)"
          tilt={false}
          style={{
            maxWidth: 'var(--width-content)',
            margin: '0 auto',
            background: 'var(--surface-inverse)',
            borderRadius: 'var(--radius-surface)',
            padding: 'clamp(32px, 5vw, 56px)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-8)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient lighting decor */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-60px',
              right: '15%',
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(241, 151, 32, 0.16) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Left Column: Heading, Description, 3 Trust Value Bullets, Dual CTAs */}
          <div style={{ flex: '1 1 420px', maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Eyebrow tone="inverse">{T('home.guide.eyebrow')}</Eyebrow>
              <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--white)' }}>
                {T('home.guide.title')}
              </h2>
              <p style={{ margin: 0, font: 'var(--type-body)', color: 'rgba(255, 255, 255, 0.78)', lineHeight: 1.6 }}>
                {T('home.guide.desc')}
              </p>
            </div>

            {/* 3 Trust Value Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(241, 151, 32, 0.14)', border: '1px solid rgba(241, 151, 32, 0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={18} style={{ color: 'var(--brand-500)' }} />
                </div>
                <div>
                  <strong style={{ color: 'var(--white)', fontSize: 14 }}>Pháp lý chuẩn Thông tư 24:</strong>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, marginLeft: 6 }}>Hồ sơ Cục CSGT sạch 100%, bảo hành trọn đời.</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(241, 151, 32, 0.14)', border: '1px solid rgba(241, 151, 32, 0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={18} style={{ color: 'var(--brand-500)' }} />
                </div>
                <div>
                  <strong style={{ color: 'var(--white)', fontSize: 14 }}>Bàn giao siêu tốc 24–48h:</strong>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, marginLeft: 6 }}>Hoàn tất thu hồi và cấp biển định danh nhanh gọn.</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(241, 151, 32, 0.14)', border: '1px solid rgba(241, 151, 32, 0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HandCoins size={18} style={{ color: 'var(--brand-500)' }} />
                </div>
                <div>
                  <strong style={{ color: 'var(--white)', fontSize: 14 }}>Minh bạch & Trọn gói:</strong>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, marginLeft: 6 }}>Báo giá thật niêm yết, không phát sinh chi phí ẩn.</span>
                </div>
              </div>
            </div>

            {/* Dual CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
              <Button variant="primary" size="lg" shimmer rollingText onClick={go('blog')}>
                {T('home.guide.cta_blog')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={go('transfer')}
                style={{
                  borderColor: 'rgba(241, 151, 32, 0.45)',
                  color: 'var(--white)',
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              >
                <span>Thủ tục sang tên</span>
                <ArrowRight size={16} style={{ marginLeft: 6 }} />
              </Button>
            </div>
          </div>

          {/* Right Column: Visual Stage with Embossed VIP Plate & Key Guarantee Metrics */}
          <div
            style={{
              flex: '1 1 360px',
              maxWidth: 460,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(241, 151, 32, 0.28)',
              borderRadius: 'var(--radius-card, 16px)',
              padding: 'clamp(20px, 3vw, 28px)',
              boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 9999,
                  background: 'rgba(241, 151, 32, 0.16)',
                  border: '1px solid rgba(241, 151, 32, 0.4)',
                  color: 'var(--brand-500, #F19720)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                <BadgeCheck size={15} /> Bảo chứng chuẩn BCA
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.65)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={13} style={{ color: 'var(--brand-500)' }} /> Thông tư 24/2023
              </span>
            </div>

            {/* Embossed Plate Visual Box */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: 'var(--radius-sm, 10px)',
                padding: '18px 12px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid rgba(255, 255, 255, 0.07)',
              }}
            >
              <div style={{ maxWidth: 220, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <PlateVisual prov="51K" seri="" num="999.99" shape="short" size="md" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: 'rgba(255, 255, 255, 0.72)' }}>
                <span>Định danh chính chủ</span> · <span style={{ color: 'var(--brand-500, #F19720)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}><FileCheck2 size={13} /> Sẵn sàng bàn giao</span>
              </div>
            </div>

            {/* 2x2 Grid of Key Guarantee Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ font: 'var(--type-title-3)', color: 'var(--brand-500)', fontWeight: 800 }}>100%</div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)', marginTop: 2 }}>Pháp lý sạch CSGT</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ font: 'var(--type-title-3)', color: 'var(--brand-500)', fontWeight: 800 }}>1–2 Ngày</div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)', marginTop: 2 }}>Bàn giao hoàn tất</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ font: 'var(--type-title-3)', color: 'var(--brand-500)', fontWeight: 800 }}>63 Tỉnh</div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)', marginTop: 2 }}>Giao tận nơi toàn quốc</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ font: 'var(--type-title-3)', color: 'var(--brand-500)', fontWeight: 800 }}>Trọn Đời</div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)', marginTop: 2 }}>Bảo hành hồ sơ xe</div>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </section>
    </div>
  );
}
