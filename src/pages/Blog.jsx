import { useState } from 'react';
import { Search } from 'lucide-react';
import LazyImage from '../components/LazyImage.jsx';
import Button from '../components/Button.jsx';
import PostCardSkeleton from '../components/skeletons/PostCardSkeleton.jsx';
import { useStaggeredReveal } from '../hooks/useStaggeredReveal.js';
import { useBlogPosts } from '../services/blog.js';

const CATEGORY_LABEL = {
  'phong-thuy': 'Phong thủy', 'phap-ly': 'Pháp lý', 'kien-thuc': 'Kiến thức',
  'cau-chuyen': 'Câu chuyện khách hàng', general: 'Tin tức',
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function Blog({ patch }) {
  const stagger = useStaggeredReveal();
  // Backend /blog/posts chỉ hỗ trợ page+limit (không q/category) → load hết (cap 100) rồi lọc client-side.
  const { data, isLoading, isError, refetch, isFetching } = useBlogPosts(1, 100);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const all = data?.items || [];
  const items = all.filter((p) => {
    if (category && p.category !== category) return false;
    if (query) {
      const q = query.trim().toLowerCase();
      if (!(p.title || '').toLowerCase().includes(q) && !(p.excerpt || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const categories = ['', ...Object.keys(CATEGORY_LABEL)];

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ background: 'var(--surface-tint-cream)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
        <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'clamp(28px,4vw,48px) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h1 style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Tin phong thủy</h1>
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>Ý nghĩa từng dãy số, cách chọn biển hợp mệnh và quy định mới nhất.</p>
        </div>
      </section>
      <section aria-label="Danh sách bài viết" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-6) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input type="search" placeholder="Tìm bài viết…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Tìm bài viết"
              style={{ width: '100%', height: 44, padding: '0 14px 0 40px', border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {categories.map((c) => (
              <button key={c || 'all'} type="button" onClick={() => setCategory(c)}
                style={{ height: 36, padding: '0 14px', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)',
                  background: category === c ? 'var(--action-primary)' : 'var(--white)', color: category === c ? 'var(--white)' : 'var(--text-muted)', boxShadow: 'var(--shadow-inset-hairline)' }}>
                {c ? CATEGORY_LABEL[c] : 'Tất cả'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap: 'var(--gutter-section)' }}>
            {Array.from({ length: 6 }, (_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Không tải được danh sách bài viết.</span>
            <Button variant="primary" size="md" onClick={() => refetch()} disabled={isFetching}>Thử lại</Button>
          </div>
        ) : items.length === 0 ? (
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '48px', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không tìm thấy bài viết nào.</div>
        ) : (
          <>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{items.length} bài viết</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap: 'var(--gutter-section)', animation: 'fadeIn 180ms var(--ease-out)' }}>
              {items.map((p, i) => (
                <article key={p.id} itemScope itemType="https://schema.org/Article" className="pressable" style={{ cursor: 'pointer', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'var(--transition-card)', ...stagger(i) }}>
                  <a href={'#/bai-viet/' + p.slug} onClick={(e) => { e.preventDefault(); patch({ screen: 'post', postId: p.slug }); }} style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: 'inherit' }}>
                    <LazyImage src={p.coverImageUrl || ''} alt={p.title} style={{ height: 170, background: 'var(--surface-muted)' }} imgStyle={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} skeletonHeight={170} />
                    <div style={{ padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>{CATEGORY_LABEL[p.category] || p.category}</span>
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}><time dateTime={p.publishedAt} itemProp="datePublished">{formatDate(p.publishedAt)}</time></span>
                      </div>
                      <h2 itemProp="headline" style={{ margin: 0, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{p.title}</h2>
                      <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }} itemProp="description">{p.excerpt}</p>
                    </div>
                  </a>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
