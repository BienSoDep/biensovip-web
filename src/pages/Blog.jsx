import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import LazyImage from '../components/LazyImage.jsx';
import Button from '../components/Button.jsx';
import SpotlightCard from '../components/SpotlightCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { PageHeader } from '../components/index.jsx';
import PostCardSkeleton from '../components/skeletons/PostCardSkeleton.jsx';
import { useStaggeredReveal } from '../hooks/useStaggeredReveal.js';
import { useBlogPosts } from '../services/blog.js';
import { routeFor } from '../config/routes.js';
import { restoreScrollPosition, getScrollPosition } from '../lib/scrollRestoration.js';

const CATEGORY_LABEL = {
  'phong-thuy': 'Phong thủy', 'phap-ly': 'Pháp lý', 'kien-thuc': 'Kiến thức',
  'cau-chuyen': 'Câu chuyện khách hàng', 'tinh-thanh': 'Tỉnh thành', 'loai-bien': 'Loại biển', general: 'Tin tức',
};

const PILLAR_BLOG_LINKS = [
  { slug: 'bien-ngu-quy', label: 'Biển số Ngũ Quý (111.11 – 999.99)' },
  { slug: 'bien-tu-quy', label: 'Biển số Tứ Quý (1111 – 9999)' },
  { slug: 'bien-tam-hoa', label: 'Biển số Tam Hoa (555, 666, 888, 999)' },
  { slug: 'bien-loc-phat', label: 'Biển số Lộc Phát (68, 86)' },
  { slug: 'bien-than-tai', label: 'Biển số Thần Tài (39, 79)' },
  { slug: 'bien-sanh-tien', label: 'Biển số Sảnh Tiến (12345, 56789)' },
  { slug: 'bien-so-kep', label: 'Biển số Kép & Cặp số lặp đôi' },
  { slug: 'bien-so-doi-so-kep-y-nghia', label: 'Ý nghĩa biển số đôi, số kép' },
  { slug: 'bien-so-ganh-y-nghia', label: 'Biển số Gánh đảo đối xứng' },
  { slug: 'bien-so-dep-khac', label: 'Các dòng biển số đẹp đặc biệt khác' },
  { slug: 'bien-so-hop-menh-kim', label: 'Biển số hợp mệnh Kim' },
  { slug: 'bien-so-hop-menh-moc', label: 'Biển số hợp mệnh Mộc' },
  { slug: 'bien-so-hop-menh-thuy', label: 'Biển số hợp mệnh Thủy' },
  { slug: 'bien-so-hop-menh-hoa', label: 'Biển số hợp mệnh Hỏa' },
  { slug: 'bien-so-hop-menh-tho', label: 'Biển số hợp mệnh Thổ' },
  { slug: 'so-nut-bien-so-cach-tinh-y-nghia', label: 'Cách tính số nút biển số xe' },
  { slug: 'thu-tuc-sang-ten-bien-so-2026', label: 'Thủ tục sang tên biển số định danh 2026' },
];

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

function readInitialQueryParams() {
  if (typeof window === 'undefined' || !window.location.search) return null;
  const params = new URLSearchParams(window.location.search);
  const pNum = parseInt(params.get('page') || '1', 10);
  return {
    tag: params.get('tag') || '',
    category: params.get('category') || '',
    query: params.get('q') || '',
    page: Number.isFinite(pNum) && pNum > 0 ? pNum : 1,
  };
}

export default function Blog({ patch }) {
  const stagger = useStaggeredReveal();
  const urlInit = readInitialQueryParams();
  const hasQueryParams = !!urlInit;
  const saved = !hasQueryParams ? readSavedState() : null;
  const [query, setQuery] = useState(urlInit?.query || saved?.query || '');
  const [category, setCategory] = useState(urlInit?.category || saved?.category || '');
  const [tag, setTag] = useState(urlInit?.tag || saved?.tag || '');
  const [page, setPage] = useState(urlInit?.page || saved?.page || 1);
  const isFiltering = !!(query || category || tag);
  // Backend /blog/posts chỉ hỗ trợ page+limit (không q/category/tag) → khi đang lọc, load cap 150 rồi
  // lọc client-side; khi không lọc, phân trang thật (limit nhỏ) để tránh tải dữ liệu lớn mỗi lần vào trang.
  const { data, isLoading, isError, refetch, isFetching } = useBlogPosts(isFiltering ? 1 : page, isFiltering ? 150 : PAGE_SIZE);

  // Khôi phục vị trí cuộn đã lưu (nếu quay lại từ bài viết) — chạy sau khi data đã load xong.
  useEffect(() => {
    if (hasQueryParams || !saved?.scrollY || isLoading) return;
    restoreScrollPosition(saved.scrollY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Lưu state (filter/trang/vị trí cuộn) trước khi rời trang — dùng để phục hồi khi back từ bài viết,
  // tránh người dùng phải lướt tìm lại từ đầu ở trang tổng.
  const saveStateBeforeLeave = () => {
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify({ query, category, tag, page, scrollY: getScrollPosition() })); } catch { /* storage blocked */ }
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

  const getPageHref = (n) => (n <= 1 ? '/tin' : `/tin?page=${n}`);

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--space-4)' }}>
        <PageHeader
          eyebrow="Cẩm nang & Kiến thức"
          title="Tin phong thủy"
          subtitle="Ý nghĩa từng dãy số, cách chọn biển hợp mệnh và quy định mới nhất."
        />
      </section>
      <section aria-label="Danh sách bài viết" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '0 var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input type="search" placeholder="Tìm bài viết…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} aria-label="Tìm bài viết"
              style={{ width: '100%', height: 44, padding: '0 14px 0 40px', border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }} />
          </div>
          <nav aria-label="Chuyên mục bài viết" className="blog-category-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {categories.map((c) => {
              const catHref = c ? `/tin?category=${encodeURIComponent(c)}` : '/tin';
              return (
                <a
                  key={c || 'all'}
                  href={catHref}
                  onClick={(e) => {
                    if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                      e.preventDefault();
                      setCategory(c);
                      setPage(1);
                      history.replaceState(null, '', catHref);
                    }
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 14px',
                    borderRadius: 'var(--radius-pill)', textDecoration: 'none', cursor: 'pointer',
                    font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', flexShrink: 0,
                    background: category === c ? 'var(--action-primary)' : 'var(--white)',
                    color: category === c ? 'var(--action-primary-text, var(--ink-900))' : 'var(--text-muted)',
                    boxShadow: 'var(--shadow-inset-hairline)',
                  }}
                >
                  {c ? CATEGORY_LABEL[c] : 'Tất cả'}
                </a>
              );
            })}
          </nav>
        </div>

        {tag && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang lọc theo:</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 'var(--radius-xs)', background: 'var(--action-primary)', color: 'var(--white)', font: 'var(--type-caption)' }}>
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
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{isFiltering ? `${items.length} bài viết phù hợp` : `${total} bài viết`}</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap: 'var(--gutter-section)', animation: 'fadeIn 180ms var(--ease-out)' }}>
              {items.map((p, i) => (
                <SpotlightCard
                  key={p.id}
                  as="article"
                  itemScope
                  itemType="https://schema.org/Article"
                  className="pressable"
                  size={360}
                  spotlightColor="rgba(241, 151, 32, 0.14)"
                  borderColor="rgba(241, 151, 32, 0.28)"
                  tilt={true}
                  maxTilt={3.5}
                  style={{
                    cursor: 'pointer',
                    background: 'var(--white)',
                    boxShadow: 'var(--shadow-inset-hairline)',
                    borderRadius: 'var(--radius-card)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'var(--transition-card)',
                    ...stagger(i),
                  }}
                >
                  <a href={routeFor('post', p.slug)} onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); saveStateBeforeLeave(); patch({ screen: 'post', postId: p.slug }); } }} style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: 'inherit' }}>
                    <LazyImage src={p.coverImageUrl || ''} alt={p.title} style={{ height: 170, background: 'var(--surface-muted)' }} imgStyle={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} skeletonHeight={170} />
                    <div style={{ padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-xs)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>{CATEGORY_LABEL[p.category] || p.category}</span>
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}><time dateTime={p.publishedAt} itemProp="datePublished">{formatDate(p.publishedAt)}</time></span>
                      </div>
                      <h2 itemProp="headline" style={{ margin: 0, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{p.title}</h2>
                      <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }} itemProp="description">{p.excerpt}</p>
                    </div>
                  </a>
                </SpotlightCard>
              ))}
            </div>
            {!isFiltering && totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                getHref={getPageHref}
                onChange={(n) => {
                  if (isFetching) return;
                  setPage(n);
                  history.pushState(null, '', getPageHref(n));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ paddingTop: 'var(--space-4)' }}
              />
            )}
          </>
        )}

        {/* Chuyên đề phong thủy & Thế số biển đẹp trọng điểm — Hub liên kết nội bộ giúp Googlebot WRS khám phá nhanh bài trụ cột */}
        <section aria-label="Chuyên đề phong thủy trọng điểm" style={{ marginTop: 'var(--space-6)', padding: 'var(--gutter-card)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chuyên đề biển số đẹp & Phong thủy ngũ hành trọng điểm</h2>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Tổng hợp các bài viết chuyên sâu phân tích ý nghĩa thế số, cách chọn biển hợp mệnh Kim - Mộc - Thủy - Hỏa - Thổ và quy định định danh biển số mới nhất:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PILLAR_BLOG_LINKS.map((item) => (
              <a
                key={item.slug}
                href={routeFor('post', item.slug)}
                onClick={(e) => {
                  if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    saveStateBeforeLeave();
                    patch({ screen: 'post', postId: item.slug });
                  }
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--white)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  font: 'var(--type-caption)',
                  fontWeight: 'var(--fw-semibold)',
                  color: 'var(--text-strong)',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
