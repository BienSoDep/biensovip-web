import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { Share2, Link2, MessageCircle, Minus, Plus } from 'lucide-react';
import Button from '../components/Button.jsx';
import LazyImage from '../components/LazyImage.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import { contentGet } from '../lib/content/index.js';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import { useBlogPost, useRelatedPosts, useRelatedPlates } from '../services/blog.js';
import { routeFor, PROVINCE_LANDINGS } from '../config/routes.js';
import Breadcrumb from '../components/Breadcrumb.jsx';

const CATEGORY_LABEL = {
  'phong-thuy': 'Phong thủy', 'phap-ly': 'Pháp lý', 'kien-thuc': 'Kiến thức',
  'cau-chuyen': 'Câu chuyện khách hàng', 'tinh-thanh': 'Tỉnh thành', general: 'Tin tức',
};

// Cùng pool ảnh Unsplash dùng làm cover ở backend seed — chọn ảnh khác cover để minh họa giữa bài, tránh lặp.
const ILLUSTRATION_POOL = [
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&q=80',
  'https://images.unsplash.com/photo-1610375461369-d613b564f4c4?w=1200&q=80',
  'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1200&q=80',
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80',
  'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=1200&q=80',
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
  'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1200&q=80',
];

function pickIllustration(slug, excludeUrl) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  const pool = ILLUSTRATION_POOL.filter((u) => u !== excludeUrl);
  return pool[hash % pool.length];
}

const FONT_SIZES = [15, 17, 19, 21];
const FONT_FAMILIES = [
  { id: 'sans', label: 'Mặc định', value: 'var(--font-text)' },
  { id: 'serif', label: 'Chữ chân', value: '"Noto Serif","Times New Roman",serif' },
];
const READER_PREFS_KEY = 'biensovip.readerPrefs';

function useReaderPrefs() {
  const [sizeIdx, setSizeIdx] = useState(1);
  const [fontId, setFontId] = useState('sans');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(READER_PREFS_KEY) || '{}');
      if (Number.isInteger(saved.sizeIdx) && FONT_SIZES[saved.sizeIdx]) setSizeIdx(saved.sizeIdx);
      if (FONT_FAMILIES.some((f) => f.id === saved.fontId)) setFontId(saved.fontId);
    } catch { /* ignore malformed prefs */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(READER_PREFS_KEY, JSON.stringify({ sizeIdx, fontId }));
  }, [sizeIdx, fontId]);

  const fontFamily = FONT_FAMILIES.find((f) => f.id === fontId)?.value || FONT_FAMILIES[0].value;
  return { sizeIdx, setSizeIdx, fontId, setFontId, fontSize: FONT_SIZES[sizeIdx], fontFamily };
}

function formatDate(iso) {
  if (!iso) return '';
  return format(new Date(iso), 'dd/MM/yyyy');
}

function slugifyHeading(text, seen) {
  const base = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  let slug = base || 'muc';
  let n = 2;
  while (seen.has(slug)) { slug = `${base}-${n}`; n++; }
  seen.add(slug);
  return slug;
}

function rangeHtml(doc, startBefore, endBefore) {
  const r = doc.createRange();
  if (startBefore) r.setStartBefore(startBefore); else r.setStartBefore(doc.body.firstChild);
  if (endBefore) r.setEndBefore(endBefore); else r.setEndAfter(doc.body.lastChild);
  return new XMLSerializer().serializeToString(r.cloneContents()).replace(/ xmlns="[^"]*"/g, '');
}

function useTableOfContents(html) {
  return useMemo(() => {
    if (!html) return { html, items: [], parts: null };
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h2');
    const seen = new Set();
    const items = [];
    headings.forEach((h) => {
      const id = slugifyHeading(h.textContent || '', seen);
      h.id = id;
      items.push({ id, text: h.textContent || '' });
    });

    // Chèn ảnh minh họa sau H2 đầu và biển minh họa ở giữa bài — phá thế đơn điệu toàn chữ.
    // >=4 H2: 3 khúc (ảnh sau đoạn 1, biển ở giữa). 2-3 H2: 2 khúc (chỉ biển ở giữa, không đủ chỗ cho cả 2).
    let parts = null;
    if (headings.length >= 4) {
      const imgAt = headings[1];
      const midAt = headings[Math.floor(headings.length / 2)];
      parts = [
        rangeHtml(doc, null, imgAt),
        rangeHtml(doc, imgAt, midAt),
        rangeHtml(doc, midAt, null),
      ];
    } else if (headings.length >= 2) {
      const midAt = headings[Math.floor(headings.length / 2)];
      parts = [rangeHtml(doc, null, midAt), rangeHtml(doc, midAt, null)];
    }

    return { html: doc.body.innerHTML, items, parts };
  }, [html]);
}

export default function Post({ postId, go, patch, notify, openPlate }) {
  const { data: post, isLoading, isError } = useBlogPost(postId);
  const { data: relatedData } = useRelatedPosts(postId, 3);
  const { data: relatedPlatesData } = useRelatedPlates(postId, 4);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  const contentHtml = useMemo(() => DOMPurify.sanitize(post?.contentHtml || '', { USE_PROFILES: { html: true } }), [post?.contentHtml]);
  const { html: contentWithIds, items: tocItems, parts } = useTableOfContents(contentHtml);
  const related = relatedData?.items || [];
  const relatedPlates = relatedPlatesData?.items || [];
  const midPlate = relatedPlates[0];
  const illustrationUrl = post ? pickIllustration(post.slug, post.coverImageUrl) : null;
  const { sizeIdx, setSizeIdx, fontId, setFontId, fontSize, fontFamily } = useReaderPrefs();
  const articleBodyVars = { '--article-font-size': `${fontSize}px`, '--article-font-family': fontFamily };

  useEffect(() => {
    if (!post) return;
    document.title = post.metaTitle || post.title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = post.metaDescription || post.excerpt || '';
    const og = [
      ['og:title', post.metaTitle || post.title],
      ['og:description', post.metaDescription || post.excerpt || ''],
      ['og:type', 'article'],
      ['og:image', post.coverImageUrl || ''],
      ['og:url', typeof window !== 'undefined' ? window.location.href : ''],
    ].filter(([, v]) => v);
    og.forEach(([prop, content]) => {
      let m = document.querySelector(`meta[property="${prop}"]`);
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('property', prop);
        document.head.appendChild(m);
      }
      m.setAttribute('content', content);
    });
  }, [post]);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.min(100, Math.round((el.scrollTop / total) * 100)) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isLoading) {
    return (
      <div style={{ animation: 'pageIn 180ms var(--ease-out)', maxWidth: 760, margin: '0 auto', padding: 'var(--space-10) var(--pad-page)' }}>
        <div style={{ height: 32, width: '60%', background: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)' }} />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div style={{ animation: 'pageIn 180ms var(--ease-out)', maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-10) var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
        <h1 style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{contentGet('posts.ui.not_found_title')}</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{contentGet('posts.ui.not_found_desc')}</p>
        <Button variant="primary" size="md" onClick={() => go('blog')()}>{contentGet('posts.ui.cta_back_blog')}</Button>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const copyLink = () => {
    try {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      notify(contentGet('posts.ui.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify(contentGet('posts.ui.copy_failed'));
    }
  };
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,width=600,height=500');
  const shareZalo = () => window.open(`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,width=600,height=500');

  const openRelated = (slug) => {
    if (patch) patch({ screen: 'post', postId: slug });
    else go('post')?.();
    window.scrollTo(0, 0);
  };

  // Bài "Tỉnh thành" không có field tỉnh riêng — khớp tag/title với PROVINCE_LANDINGS để biết đúng
  // tỉnh và link sang trang landing tỉnh thật. Không khớp được thì chỉ dừng ở cấp Category.
  const postProvinceLanding = (post.tags || [])
    .map((t) => PROVINCE_LANDINGS.find((p) => p.name.toLowerCase() === t.toLowerCase()))
    .find(Boolean)
    || PROVINCE_LANDINGS.find((p) => post.title.includes(p.name));

  return (
    <>
      <div aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, width: `${progress}%`, height: 3, background: 'var(--action-primary)', zIndex: 'var(--z-header)', transition: 'width 80ms linear' }} />
      <Breadcrumb keepOnMobile items={[
        { label: 'Trang chủ', onClick: go('home') },
        { label: 'Tin phong thủy', onClick: go('blog') },
        { label: CATEGORY_LABEL[post.category] || post.category, onClick: () => { history.replaceState(null, '', `${routeFor('blog')}?category=${encodeURIComponent(post.category)}`); go('blog')(); } },
        ...(postProvinceLanding ? [{ label: postProvinceLanding.name, onClick: () => { window.location.href = routeFor('provinceLanding', postProvinceLanding.code); } }] : []),
        { label: post.title },
      ]} />
      <article style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }} itemScope itemType="https://schema.org/BlogPosting">
      <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ padding: '3px 12px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>{CATEGORY_LABEL[post.category] || post.category}</span>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
            <time dateTime={post.publishedAt} itemProp="datePublished">{formatDate(post.publishedAt)}</time>
          </span>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>· ~{post.readingTimeMinutes} phút đọc</span>
          {post.authorName && <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>· <span itemProp="author">{post.authorName}</span></span>}
        </div>
        <h1 itemProp="headline" style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{post.title}</h1>
      </header>

      {post.coverImageUrl && (
        <figure style={{ margin: 0, borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <img src={post.coverImageUrl} alt={post.title} loading="eager" itemProp="image" style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }} />
        </figure>
      )}

      {tocItems.length >= 2 && (
        <nav aria-label="Mục lục" style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mục lục</span>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tocItems.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => { const el = document.getElementById(item.id); if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 84; window.scrollTo({ top: y, behavior: 'smooth' }); } }} style={{ border: 'none', background: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', font: 'var(--type-body-sm)', color: 'var(--action-primary)' }}>{item.text}</button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="reader-prefs">
        <div className="reader-prefs__group">
          <span className="reader-prefs__label">Cỡ chữ</span>
          <button type="button" className="reader-prefs__btn" onClick={() => setSizeIdx((i) => Math.max(0, i - 1))} disabled={sizeIdx === 0} aria-label="Giảm cỡ chữ"><Minus size={14} /></button>
          <span className="reader-prefs__size">{fontSize}px</span>
          <button type="button" className="reader-prefs__btn" onClick={() => setSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))} disabled={sizeIdx === FONT_SIZES.length - 1} aria-label="Tăng cỡ chữ"><Plus size={14} /></button>
        </div>
        <div className="reader-prefs__group">
          <span className="reader-prefs__label">Font chữ</span>
          <select id="reader-font-select" name="reader-font" className="reader-prefs__font" value={fontId} onChange={(e) => setFontId(e.target.value)} aria-label="Chọn kiểu chữ">
            {FONT_FAMILIES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {parts ? (
        <div itemProp="articleBody">
          <div className="article-body" style={{ ...articleBodyVars, color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: parts[0] }} />

          {parts.length === 3 && illustrationUrl && (
            <>
              <figure style={{ margin: 'var(--space-6) 0 0', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                <img src={illustrationUrl} alt={post.title} loading="lazy" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
              </figure>
              <div className="article-body" style={{ ...articleBodyVars, color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: parts[1] }} />
            </>
          )}

          {midPlate && (
            <div onClick={() => openPlate?.(midPlate.slug || midPlate.id)} className="pressable" style={{ cursor: 'pointer', margin: 'var(--space-6) 0', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 180, flexShrink: 0 }}>
                <PlateVisual size="md" prov={splitPlateNumber(midPlate.plateNumber).prov} seri={splitPlateNumber(midPlate.plateNumber).seri} num={splitPlateNumber(midPlate.plateNumber).num} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Biển đang giao dịch cùng chủ đề bài viết</span>
                <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{midPlate.plateNumber} · {midPlate.province}</span>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>{formatPrice(midPlate.price, midPlate.priceOnRequest)}</span>
              </div>
            </div>
          )}

          <div className="article-body" style={{ ...articleBodyVars, color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: parts[parts.length - 1] }} />
        </div>
      ) : (
        <div className="article-body" itemProp="articleBody" style={{ ...articleBodyVars, color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: contentWithIds }} />
      )}

      {post.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {post.tags.map((t) => (
            <button key={t} type="button" onClick={() => { history.replaceState(null, '', `${routeFor('blog')}?tag=${encodeURIComponent(t)}`); go('blog')(); }}
              style={{ border: 'none', cursor: 'pointer', padding: '3px 12px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>#{t}</button>
          ))}
        </div>
      )}

      {post.videos?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {post.videos.map((v) => (
            <div key={v.id} style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', aspectRatio: v.platform === 'tiktok' ? '9/14' : '16/9', maxWidth: v.platform === 'tiktok' ? 360 : '100%', overflow: 'hidden' }}>
              <iframe src={v.videoUrl} title={v.title || 'Video'} style={{ width: '100%', height: '100%', border: 0 }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', paddingTop: 'var(--space-2)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
        <Button variant="primary" size="md" onClick={go('list')}>{contentGet('posts.ui.cta_match')}</Button>
        <Button variant="outline" size="md" onClick={shareFacebook}><Share2 size={16} style={{ marginRight: 6 }} />Facebook</Button>
        <Button variant="outline" size="md" onClick={shareZalo}><MessageCircle size={16} style={{ marginRight: 6 }} />Zalo</Button>
        <Button variant="outline" size="md" onClick={copyLink}><Link2 size={16} style={{ marginRight: 6 }} />{copied ? contentGet('posts.ui.copied') : contentGet('posts.ui.cta_share')}</Button>
      </div>

      {relatedPlates.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingTop: 'var(--space-4)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
          <h2 style={{ margin: 0, font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>Biển số liên quan đến bài viết</h2>
          <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Những biển số cùng dãy ý nghĩa phong thủy với bài viết này, còn hàng trong hệ thống:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(200px,100%),1fr))', gap: 'var(--gutter-section)' }}>
            {relatedPlates.map((p) => {
              const sp = splitPlateNumber(p.plateNumber);
              return (
                <div key={p.id} onClick={() => openPlate?.(p.slug || p.id)} className="pressable" style={{ cursor: 'pointer', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', transition: 'var(--transition-card)' }}>
                  <PlateVisual size="md" prov={sp.prov} seri={sp.seri} num={sp.num} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-strong)' }}>{p.plateNumber} · {p.province}</span>
                    <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>{formatPrice(p.price, p.priceOnRequest)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingTop: 'var(--space-4)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
          <h2 style={{ margin: 0, font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>Bài viết liên quan</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(220px,100%),1fr))', gap: 'var(--gutter-section)' }}>
            {related.map((p) => (
              <a key={p.id} href={routeFor('post', p.slug)} onClick={(e) => { e.preventDefault(); openRelated(p.slug); }} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                <LazyImage src={p.coverImageUrl || ''} alt={p.title} style={{ height: 120, background: 'var(--surface-muted)' }} imgStyle={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} skeletonHeight={120} />
                <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{p.title}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>~{p.readingTimeMinutes} phút đọc</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
      </article>
    </>
  );
}
