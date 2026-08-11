import { useEffect } from 'react';
import Button from '../components/Button.jsx';
import { contentGet } from '../lib/content/index.js';
import { useBlogPost } from '../services/blog.js';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function Post({ postId, go, notify }) {
  const { data: post, isLoading, isError } = useBlogPost(postId);

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

  return (
    <article style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }} itemScope itemType="https://schema.org/BlogPosting">
      <nav aria-label="Breadcrumb" style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
        {contentGet('posts.ui.home')} <span aria-hidden>›</span> <button type="button" onClick={go('blog')} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>{contentGet('posts.ui.blog')}</button>
      </nav>

      <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
          <time dateTime={post.publishedAt} itemProp="datePublished">{formatDate(post.publishedAt)}</time>
        </span>
        <h1 itemProp="headline" style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{post.title}</h1>
      </header>

      {post.coverImageUrl && (
        <figure style={{ margin: 0, borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <img src={post.coverImageUrl} alt={post.title} loading="eager" itemProp="image" style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }} />
        </figure>
      )}

      <div itemProp="articleBody" style={{ font: 'var(--type-body)', fontSize: 17, color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: post.contentHtml }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', paddingTop: 'var(--space-2)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
        <Button variant="primary" size="md" onClick={go('list')}>{contentGet('posts.ui.cta_match')}</Button>
        <Button variant="outline" size="md" onClick={() => { try { navigator.clipboard.writeText(window.location.href); notify(contentGet('posts.ui.copied')); } catch { notify(contentGet('posts.ui.copy_failed')); } }}>{contentGet('posts.ui.cta_share')}</Button>
      </div>
    </article>
  );
}
