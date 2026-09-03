import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import LazyImage from '../components/LazyImage.jsx';
import Button from '../components/Button.jsx';
import PostCardSkeleton from '../components/skeletons/PostCardSkeleton.jsx';
import { useStaggeredReveal } from '../hooks/useStaggeredReveal.js';
import { useBlogPosts } from '../services/blog.js';
import { routeFor } from '../config/routes.js';

const CATEGORY_LABEL = {
  'phong-thuy': 'Phong thủy', 'phap-ly': 'Pháp lý', 'kien-thuc': 'Kiến thức',
  'cau-chuyen': 'Câu chuyện khách hàng', 'tinh-thanh': 'Tỉnh thành', general: 'Tin tức',
};

function formatDate(iso) {
  if (!iso) return '';
  return format(new Date(iso), 'dd/MM/yyyy');
}

const PAGE_SIZE = 12;
const STATE_KEY = 'bsd_blog_list_state';

// Đọc state đã lưu 1 lần lúc mount (không dùng useState lazy-init trong component vì còn phải
// so với query string — query string mới (từ hashtag/breadcrumb) phải thắng state cũ đã lưu).
function readSavedState() {
  try { return JSON.parse(sessionStorage.getItem(STATE_KEY) || 'null'); } catch { return null; }
}

export default function Blog({ patch }) {
  const stagger = useStaggeredReveal();
  const hasQueryParams = typeof window !== 'undefined' && !!window.location.search;
  const saved = !hasQueryParams ? readSavedState() : null;
  const [query, setQuery] = useState(saved?.query || '');
  const [category, setCategory] = useState(saved?.category || '');
  const [tag, setTag] = useState(saved?.tag || '');
  const [page, setPage] = useState(saved?.page || 1);
  const isFiltering = !!(query || category || tag);
  // Backend /blog/posts chỉ hỗ trợ page+limit (không q/category/tag) → khi đang lọc, load cap 100 rồi
  // lọc client-side; khi không lọc, phân trang thật (limit nhỏ) để tránh tải dữ liệu lớn mỗi lần vào trang.
  const { data, isLoading, isError, refetch, isFetching } = useBlogPosts(isFiltering ? 1 : page, isFiltering ? 100 : PAGE_SIZE);

  // Deep-link `/tin?tag=xxx` (hashtag bài viết) hoặc `?category=xxx` (breadcrumb bài viết) → tự lọc
  // khi mở trang, tránh người dùng phải lọc lại từ đầu. Query string mới → không phục hồi state cũ
  // (đã xử lý ở saved phía trên), chỉ set filter theo query.
  useEffect(() => {
    if (!hasQueryParams) return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tag');
    const c = params.get('category');
    if (t) setTag(t);
    if (c) setCategory(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Khôi phục vị trí cuộn đã lưu (nếu quay lại từ bài viết) — chạy sau khi data đã load xong.
  useEffect(() => {
    if (hasQueryParams || !saved?.scrollY || isLoading) return;
    window.scrollTo(0, saved.scrollY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Lưu state (filter/trang/vị trí cuộn) trước khi rời trang — dùng để phục hồi khi back từ bài viết,
  // tránh người dùng phải lướt tìm lại từ đầu ở trang tổng.
  const saveStateBeforeLeave = () => {
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify({ query, category, tag, page, scrollY: window.scrollY })); } catch { /* storage blocked */ }
  };

  const all = data?.items || [];
  const items = isFiltering ? all.filter((p) => {
    if (category && p.category !== category) return false;
    if (tag && !(p.tags || []).includes(tag)) return false;
    if (query) {
      const q = query.trim().toLowerCase();
      if (!(p.title || '').toLowerCase().includes(q) && !(p.excerpt || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }) : all;
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
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
            <input type="search" placeholder="Tìm bài viết…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} aria-label="Tìm bài viết"
              style={{ width: '100%', height: 44, padding: '0 14px 0 40px', border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }} />
          </div>
          <div className="blog-category-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {categories.map((c) => (
              <button key={c || 'all'} type="button" onClick={() => { setCategory(c); setPage(1); }}
                style={{ height: 36, padding: '0 14px', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', flexShrink: 0,
                  background: category === c ? 'var(--action-primary)' : 'var(--white)', color: category === c ? 'var(--white)' : 'var(--text-muted)', boxShadow: 'var(--shadow-inset-hairline)' }}>
                {c ? CATEGORY_LABEL[c] : 'Tất cả'}
              </button>
            ))}
          </div>
        </div>

        {tag && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang lọc theo:</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', font: 'var(--type-caption)' }}>
              #{tag}
              <button type="button" onClick={() => { setTag(''); history.replaceState(null, '', location.pathname); }} aria-label="Bỏ lọc" style={{ border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
            </span>
          </div>
        )}

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
                  <a href={routeFor('post', p.slug)} onClick={(e) => { e.preventDefault(); saveStateBeforeLeave(); patch({ screen: 'post', postId: p.slug }); }} style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: 'inherit' }}>
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
            {!isFiltering && totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)', paddingTop: 'var(--space-4)' }}>
                <Button variant="outline" size="md" disabled={page <= 1 || isFetching} onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>← Trước</Button>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Trang {page}/{totalPages}</span>
                <Button variant="outline" size="md" disabled={page >= totalPages || isFetching} onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Sau →</Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
