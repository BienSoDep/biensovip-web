import Button from '../components/Button.jsx';
import { Badge } from '../components/index.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import { contentGet } from '../lib/content/index.js';

const words = (v) => String(v || '').split(/\s+/).filter(Boolean).length;
function readingMinutes(body) {
  let n = words(body.map((b) => b.v || '').join(' '));
  n += body.filter((b) => b.t === 'plate').length * 20;
  return Math.max(2, Math.round(n / 150));
}

export default function Post({ post, st, go, openPlate, openPost, notify }) {
  if (!post) {
    return (
      <div style={{ animation: 'pageIn 180ms var(--ease-out)', maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-10) var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
        <h1 style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{contentGet('posts.ui.not_found_title')}</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{contentGet('posts.ui.not_found_desc')}</p>
        <Button variant="primary" size="md" onClick={() => go('blog')()}>{contentGet('posts.ui.cta_back_blog')}</Button>
      </div>
    );
  }

  const body = post.body || [{ t: 'p', v: post.excerpt }];
  const heads = body.filter((b) => b.t === 'h2');
  const mins = readingMinutes(body);
  const plateOf = (id) => st.plates.find((p) => p.id === id) || st.plates[0];
  const related = st.posts.filter((p) => p.id !== post.id && p.status === 'Đã xuất bản' && p.cat === post.cat).slice(0, 3);

  return (
    <article style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }} itemScope itemType="https://schema.org/BlogPosting">
      <nav aria-label="Breadcrumb" style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
        {contentGet('posts.ui.home')} <span aria-hidden>›</span> <button type="button" onClick={go('blog')} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>{contentGet('posts.ui.blog')}</button>
      </nav>

      <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <Badge tone="neutral">{post.cat}</Badge>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
            <time dateTime={post.date} itemProp="datePublished">{post.date}</time> · {mins} {contentGet('posts.ui.min_read')} · <span itemProp="author">{contentGet('posts.ui.author')}</span>
          </span>
        </div>
        <h1 itemProp="headline" style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{post.title}</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>{post.desc}</p>
      </header>

      {post.img && (
        <figure style={{ margin: 0, borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <img src={post.img} alt={post.imgAlt || post.title} loading="eager" itemProp="image" style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }} />
        </figure>
      )}

      {heads.length > 1 && (
        <nav aria-label={contentGet('posts.ui.toc_title')} style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{contentGet('posts.ui.toc_title')}</span>
          {heads.map((h, i) => (
            <a key={i} href={'#sec-' + i} style={{ font: 'var(--type-body-sm)', color: 'var(--action-primary)', textDecoration: 'none' }}>{i + 1}. {h.v}</a>
          ))}
        </nav>
      )}

      {body.map((b, i) => {
        if (b.t === 'h2') return <h2 key={i} id={'sec-' + i} itemProp="headline" style={{ margin: 'var(--space-3) 0 0', font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)', scrollMarginTop: 90 }}>{b.v}</h2>;
        if (b.t === 'quote') return <blockquote key={i} style={{ margin: 0, borderLeft: '3px solid var(--action-primary)', background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4) var(--gutter-card)', font: 'var(--type-body)', fontStyle: 'italic', color: 'var(--text-body)' }}>{b.v}</blockquote>;
        if (b.t === 'plate') {
          const p = plateOf(b.plate);
          return (
            <div key={i} style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
              <PlateVisual size="sm" prov={p.prov} seri={p.seri} num={p.num} />
              <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{p.cat} · {p.city}</span>
                <span style={{ font: 'var(--type-price)', color: 'var(--text-strong)' }}>{p.price}</span>
              </div>
              <Button variant="dark" size="sm" onClick={() => openPlate(p.id)}>{contentGet('posts.ui.cta_view_plate')}</Button>
            </div>
          );
        }
        return <p key={i} itemProp="articleBody" style={{ margin: 0, font: 'var(--type-body)', fontSize: 17, color: 'var(--text-body)' }}>{b.v}</p>;
      })}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', paddingTop: 'var(--space-2)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
        <Button variant="primary" size="md" onClick={go('list')}>{contentGet('posts.ui.cta_match')}</Button>
        <Button variant="outline" size="md" onClick={() => { try { navigator.clipboard.writeText(window.location.href); notify(contentGet('posts.ui.copied')); } catch { notify(contentGet('posts.ui.copy_failed')); } }}>{contentGet('posts.ui.cta_share')}</Button>
      </div>

      {related.length > 0 && (
        <section aria-label={contentGet('posts.ui.related_title')} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h2 style={{ margin: 0, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{contentGet('posts.ui.related_title')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--gutter-section)' }}>
            {related.map((r) => (
              <div key={r.id} role="button" tabIndex={0} onClick={() => openPost(r.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPost(r.id); } }} className="pressable" style={{ cursor: 'pointer', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{r.cat} · {r.date}</span>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{r.title}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
