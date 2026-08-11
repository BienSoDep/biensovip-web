import LazyImage from '../components/LazyImage.jsx';
import PostCardSkeleton from '../components/skeletons/PostCardSkeleton.jsx';
import { useStaggeredReveal } from '../hooks/useStaggeredReveal.js';
import { useBlogPosts } from '../services/blog.js';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function Blog({ patch }) {
  const stagger = useStaggeredReveal();
  const { data, isLoading, isError } = useBlogPosts(1, 30);
  const items = data?.items || [];

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Tin phong thủy</h1>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Ý nghĩa từng dãy số, cách chọn biển hợp mệnh và quy định mới nhất.</p>
        </div>
      </section>
      <section aria-label="Danh sách bài viết" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--pad-section-y)' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 'var(--gutter-section)' }}>
            {Array.from({ length: 6 }, (_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '48px', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Không tải được danh sách bài viết.</div>
        ) : items.length === 0 ? (
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '48px', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có bài viết nào.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 'var(--gutter-section)', animation: 'fadeIn 180ms var(--ease-out)' }}>
            {items.map((p, i) => (
              <article key={p.id} itemScope itemType="https://schema.org/Article" className="pressable" style={{ cursor: 'pointer', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'var(--transition-card)', ...stagger(i) }}>
                <a href={'#/bai-viet/' + p.slug} onClick={(e) => { e.preventDefault(); patch({ screen: 'post', postId: p.slug }); }} style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: 'inherit' }}>
                  <LazyImage src={p.coverImageUrl || ''} alt={p.title} style={{ height: 170, background: 'var(--surface-muted)' }} imgStyle={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} skeletonHeight={170} />
                  <div style={{ padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}><time dateTime={p.publishedAt} itemProp="datePublished">{formatDate(p.publishedAt)}</time></span>
                    </div>
                    <h2 itemProp="headline" style={{ margin: 0, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{p.title}</h2>
                    <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }} itemProp="description">{p.excerpt}</p>
                  </div>
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
