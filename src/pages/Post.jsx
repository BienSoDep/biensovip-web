import { useEffect, useMemo, useState } from 'react';
import { Share2, Link2, MessageCircle } from 'lucide-react';
import Button from '../components/Button.jsx';
import LazyImage from '../components/LazyImage.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import { contentGet } from '../lib/content/index.js';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import { useBlogPost, useRelatedPosts, useRelatedPlates } from '../services/blog.js';

const CATEGORY_LABEL = {
  'phong-thuy': 'Phong thủy', 'phap-ly': 'Pháp lý', 'kien-thuc': 'Kiến thức',
  'cau-chuyen': 'Câu chuyện khách hàng', general: 'Tin tức',
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN');
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

function useTableOfContents(html) {
  return useMemo(() => {
    if (!html) return { html, items: [] };
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h2');
    const seen = new Set();
    const items = [];
    headings.forEach((h) => {
      const id = slugifyHeading(h.textContent || '', seen);
      h.id = id;
      items.push({ id, text: h.textContent || '' });
    });
    return { html: doc.body.innerHTML, items };
  }, [html]);
}

export default function Post({ postId, go, patch, notify, openPlate }) {
  const { data: post, isLoading, isError } = useBlogPost(postId);
  const { data: relatedData } = useRelatedPosts(postId, 3);
  const { data: relatedPlatesData } = useRelatedPlates(postId, 4);
  const [copied, setCopied] = useState(false);

  const { html: contentWithIds, items: tocItems } = useTableOfContents(post?.contentHtml);
  const related = relatedData?.items || [];
  const relatedPlates = relatedPlatesData?.items || [];

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
  }, [post]);

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

  return (
    <article style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }} itemScope itemType="https://schema.org/BlogPosting">
      <nav aria-label="Breadcrumb" style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
        {contentGet('posts.ui.home')} <span aria-hidden>›</span> <button type="button" onClick={go('blog')} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>{contentGet('posts.ui.blog')}</button>
      </nav>

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
                <a href={`#${item.id}`} style={{ font: 'var(--type-body-sm)', color: 'var(--action-primary)' }}>{item.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div itemProp="articleBody" style={{ font: 'var(--type-body)', fontSize: 17, color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: contentWithIds }} />

      {post.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {post.tags.map((t) => <span key={t} style={{ padding: '3px 12px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>#{t}</span>)}
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
              <a key={p.id} href={'#/bai-viet/' + p.slug} onClick={(e) => { e.preventDefault(); openRelated(p.slug); }} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
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
  );
}
