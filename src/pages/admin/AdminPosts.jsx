import { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import {
  ChevronLeft, ChevronRight, Search, X, Plus, Pencil, Trash2,
  ExternalLink, AlertTriangle, CheckCircle2, Image, FileText, Tag,
  HelpCircle, Sparkles, Filter, Info, Layers
} from 'lucide-react';
import { Badge, IconButton, Select, InfoTip } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import ConfirmBulkModal from '../../components/ConfirmBulkModal.jsx';
import { useAdminBlogPosts, useDeleteBlogPost } from '../../services/blog.js';
import { BulkAddPostsModal, BulkSeedPostInfoModal } from './BlogBulkModals.jsx';

const STATUS_TONE = { draft: 'amber', published: 'mint' };
const STATUS_LABEL = { draft: 'Bản nháp', published: 'Đã xuất bản' };
const PAGE_SIZE = 20;

export const BLOG_CATEGORIES = [
  { value: 'all', label: 'Tất cả chuyên mục' },
  { value: 'kien-thuc', label: 'Kiến thức biển số' },
  { value: 'phong-thuy', label: 'Phong thủy & Hợp mệnh' },
  { value: 'thi-truong', label: 'Thị trường & Đấu giá' },
  { value: 'huong-dan', label: 'Hướng dẫn & Thủ tục' },
  { value: 'tin-tuc', label: 'Tin tức Biensovip' },
  { value: 'hanh-trinh', label: 'Hành trình giao biển' },
];

export const CATEGORY_LABEL = {
  'kien-thuc': 'Kiến thức',
  'phong-thuy': 'Phong thủy',
  'thi-truong': 'Thị trường',
  'huong-dan': 'Hướng dẫn',
  'tin-tuc': 'Tin tức',
  'hanh-trinh': 'Giao biển',
  'general': 'Chung',
};

export const CATEGORY_TONE = {
  'kien-thuc': 'blue',
  'phong-thuy': 'purple',
  'thi-truong': 'amber',
  'huong-dan': 'mint',
  'tin-tuc': 'neutral',
  'hanh-trinh': 'cyan',
  'general': 'neutral',
};

const SORT_OPTS = [
  { value: 'createdAt:desc', label: 'Mới tạo trước' },
  { value: 'createdAt:asc', label: 'Cũ tạo trước' },
  { value: 'publishedAt:desc', label: 'Mới đăng trước' },
  { value: 'publishedAt:asc', label: 'Cũ đăng trước' },
  { value: 'updatedAt:desc', label: 'Mới cập nhật gần nhất' },
  { value: 'title:asc', label: 'Tiêu đề A→Z' },
  { value: 'title:desc', label: 'Tiêu đề Z→A' },
];

function formatDate(iso) {
  if (!iso) return '—';
  return format(new Date(iso), 'dd/MM/yyyy');
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return format(new Date(iso), 'dd/MM/yyyy HH:mm');
}

// Đánh giá chất lượng và độ hoàn thiện dữ liệu bài viết (tương tự quản lý biển số)
export function evaluatePostQuality(post) {
  const issues = [];
  const checks = [];

  // 1. Ảnh bìa đại diện
  const hasCover = !!(post.coverImageUrl && post.coverImageUrl.trim());
  checks.push({ id: 'cover', label: 'Ảnh đại diện', ok: hasCover });
  if (!hasCover) issues.push('Thiếu ảnh đại diện');

  // 2. Mô tả SEO (Meta Description)
  const metaDescLen = (post.metaDescription || '').trim().length;
  const hasMetaDesc = metaDescLen >= 50 && metaDescLen <= 260;
  checks.push({ id: 'metaDesc', label: 'Mô tả SEO Meta', ok: hasMetaDesc });
  if (metaDescLen === 0) issues.push('Thiếu mô tả SEO (Meta Description)');
  else if (metaDescLen < 50) issues.push('Mô tả SEO quá ngắn (<50 ký tự)');
  else if (metaDescLen > 260) issues.push('Mô tả SEO dài (>260 ký tự)');

  // 3. Tiêu đề SEO (Meta Title)
  const metaTitleLen = (post.metaTitle || post.title || '').trim().length;
  const hasMetaTitle = metaTitleLen >= 15 && metaTitleLen <= 70;
  checks.push({ id: 'metaTitle', label: 'Tiêu đề SEO', ok: hasMetaTitle });
  if (metaTitleLen < 15) issues.push('Tiêu đề SEO quá ngắn');

  // 4. Độ dài nội dung
  const length = post.contentLength || 0;
  const readingTime = post.readingTimeMinutes || 0;
  const hasGoodLength = length >= 600 || readingTime >= 2;
  checks.push({ id: 'length', label: 'Độ dài nội dung (tối thiểu 300 từ)', ok: hasGoodLength });
  if (!hasGoodLength) issues.push('Nội dung mỏng (<300 từ)');

  // 5. Chuyên mục
  const hasCategory = !!(post.category && post.category !== 'general');
  checks.push({ id: 'category', label: 'Chuyên mục bài viết', ok: hasCategory });
  if (!hasCategory) issues.push('Chưa phân chuyên mục cụ thể');

  // 6. Thẻ Tags
  const hasTags = (post.tagsCount || 0) > 0;
  checks.push({ id: 'tags', label: 'Thẻ Tags liên kết', ok: hasTags });
  if (!hasTags) issues.push('Chưa gắn thẻ Tags');

  // 7. Câu hỏi FAQ
  const hasFaqs = !!post.hasFaqs;
  checks.push({ id: 'faqs', label: 'Bộ câu hỏi FAQ', ok: hasFaqs });

  const passed = checks.filter(c => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);

  return {
    score,
    passed,
    totalChecks: checks.length,
    checks,
    issues,
    hasCover,
    hasMetaDesc,
    hasGoodLength,
    hasCategory,
    hasTags,
    hasFaqs,
    statusTone: score >= 80 ? 'mint' : score >= 50 ? 'amber' : 'danger',
    statusLabel: score >= 80 ? 'Chuẩn SEO' : score >= 50 ? 'Cần bổ sung' : 'Thiếu nhiều thông tin',
  };
}

const STATUS_KEY = 'bsd_admin_posts_status';
const CAT_KEY = 'bsd_admin_posts_category';

export default function AdminPosts({ st, patch, notify }) {
  const [status, setStatus] = useState(() => { try { return sessionStorage.getItem(STATUS_KEY) || ''; } catch { return ''; } });
  const [category, setCategory] = useState(() => { try { return sessionStorage.getItem(CAT_KEY) || 'all'; } catch { return 'all'; } });
  const [searchTerm, setSearchTerm] = useState(st?.adminQ || '');
  const [qualityFilter, setQualityFilter] = useState('all'); // all | issues | missing_cover | missing_seo | short_content
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('createdAt:desc');
  const [confirmPost, setConfirmPost] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkSeedOpen, setBulkSeedOpen] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [sortBy, sortDir] = sort.split(':');
  const { data, isLoading, isError, refetch } = useAdminBlogPosts(
    status || undefined,
    debouncedSearch || undefined,
    page,
    PAGE_SIZE,
    sortBy,
    sortDir,
    category !== 'all' ? category : undefined
  );
  const deletePost = useDeleteBlogPost();
  const rawItems = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Thêm đánh giá chất lượng cho từng bài
  const itemsWithQuality = useMemo(() => {
    return rawItems.map((p) => ({
      ...p,
      quality: evaluatePostQuality(p),
    }));
  }, [rawItems]);

  // Lọc theo bộ lọc chất lượng bài viết (Client-side sub-filter)
  const items = useMemo(() => {
    if (qualityFilter === 'all') return itemsWithQuality;
    if (qualityFilter === 'issues') return itemsWithQuality.filter((p) => p.quality.issues.length > 0);
    if (qualityFilter === 'missing_cover') return itemsWithQuality.filter((p) => !p.quality.hasCover);
    if (qualityFilter === 'missing_seo') return itemsWithQuality.filter((p) => !p.quality.hasMetaDesc);
    if (qualityFilter === 'short_content') return itemsWithQuality.filter((p) => !p.quality.hasGoodLength);
    if (qualityFilter === 'missing_tags') return itemsWithQuality.filter((p) => !p.quality.hasTags);
    return itemsWithQuality;
  }, [itemsWithQuality, qualityFilter]);

  // Thống kê chất lượng của trang hiện tại
  const qualityStats = useMemo(() => {
    const list = itemsWithQuality;
    const perfectCount = list.filter((p) => p.quality.score >= 80).length;
    const needWorkCount = list.filter((p) => p.quality.score < 80).length;
    const missingCoverCount = list.filter((p) => !p.quality.hasCover).length;
    const missingSeoCount = list.filter((p) => !p.quality.hasMetaDesc).length;
    const shortContentCount = list.filter((p) => !p.quality.hasGoodLength).length;
    return { perfectCount, needWorkCount, missingCoverCount, missingSeoCount, shortContentCount };
  }, [itemsWithQuality]);

  const changeStatus = (v) => {
    setStatus(v); setPage(1);
    try { sessionStorage.setItem(STATUS_KEY, v); } catch { /* ignore */ }
  };

  const changeCategory = (c) => {
    setCategory(c); setPage(1);
    try { sessionStorage.setItem(CAT_KEY, c); } catch { /* ignore */ }
  };

  const openNewPost = () => patch({ screen: 'compose', editPostId: null });
  const openEditPost = (post) => patch({ screen: 'compose', editPostId: post.id });
  const confirmRemove = (post) => setConfirmPost(post);

  const removePost = () => {
    if (!confirmPost || deletingId) return;
    setDeletingId(confirmPost.id);
    deletePost.mutate(confirmPost.id, {
      onSuccess: () => { notify('Đã xóa bài viết'); setDeletingId(null); setConfirmPost(null); },
      onError: (err) => { notify(err.message || 'Xóa thất bại.'); setDeletingId(null); },
    });
  };

  const toggleSelect = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected((s) => (s.size === items.length ? new Set() : new Set(items.map((a) => a.id))));

  const bulkDelete = async () => {
    setBulkDeleting(true);
    const ids = [...selected];
    const results = await Promise.allSettled(ids.map((id) => deletePost.mutateAsync(id)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ok;
    setSelected(new Set());
    setConfirmBulkDelete(false);
    setBulkDeleting(false);
    notify(failed > 0 ? `Đã xóa ${ok} bài viết — ${failed} bài xóa thất bại` : `Đã xóa ${ok} bài viết`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Thanh tác vụ hàng trên cùng: Nút tạo bài + Tổng quan */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Quản lý bài viết</h2>
          <p style={{ margin: '4px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Quản lý, phân loại chuyên mục và kiểm soát độ hoàn thiện thông tin & chuẩn SEO cho từng bài viết.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="md" onClick={() => setBulkSeedOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title="Tự động sinh thông tin SEO, ảnh bìa và tags cho các bài đang thiếu">
            <Sparkles size={16} /> Sinh thông tin hàng loạt
          </Button>
          <Button variant="outline" size="md" onClick={() => setBulkAddOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title="Dán nhiều dòng bài viết cùng lúc">
            <Layers size={16} /> Thêm hàng loạt
          </Button>
          <Button variant="primary" size="md" onClick={openNewPost} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Viết bài mới
          </Button>
        </div>
      </div>

      {/* 1. Lọc Chuyên Mục (Category Tabs) */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} style={{ color: 'var(--action-primary)' }} /> Chuyên mục bài viết:
          </span>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{total} bài viết tìm thấy</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => changeCategory(cat.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                cursor: 'pointer',
                font: 'var(--type-body-sm)',
                fontSize: 13,
                fontWeight: category === cat.value ? 'var(--fw-semibold)' : 'var(--fw-normal)',
                background: category === cat.value ? 'var(--action-dark)' : 'var(--surface-muted)',
                color: category === cat.value ? 'var(--white)' : 'var(--text-body)',
                boxShadow: category === cat.value ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Thanh lọc trạng thái, tìm kiếm và sắp xếp */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Trạng thái xuất bản */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { v: '', l: 'Tất cả' },
              { v: 'published', l: 'Đã xuất bản' },
              { v: 'draft', l: 'Bản nháp' },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => changeStatus(o.v)}
                style={{
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  cursor: 'pointer',
                  background: status === o.v ? 'var(--action-primary)' : 'var(--surface-muted)',
                  color: status === o.v ? 'var(--white)' : 'var(--text-body)',
                  font: 'var(--type-body-sm)',
                  fontWeight: status === o.v ? 'var(--fw-semibold)' : 'var(--fw-normal)',
                  transition: 'all 0.15s ease',
                }}
              >
                {o.l}
              </button>
            ))}
          </div>

          {/* Ô tìm kiếm từ khóa bài viết */}
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: 34,
                padding: '0 28px 0 32px',
                borderRadius: 'var(--radius-field)',
                border: 'none',
                background: 'var(--white)',
                boxShadow: 'var(--shadow-inset-hairline)',
                font: 'var(--type-body-sm)',
                color: 'var(--text-strong)',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown sắp xếp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Sắp xếp:</span>
          <Select value={sort} options={SORT_OPTS} onChange={(v) => { setSort(v); setPage(1); }} style={{ width: 190 }} />
        </div>
      </div>

      {/* 3. Khối kiểm tra chất lượng & Cảnh báo thiếu thông tin (Data Completeness / Issue Toolbar) */}
      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '12px var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', boxShadow: 'var(--shadow-inset-hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} style={{ color: '#d97706' }} /> Kiểm tra chất lượng:
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `Tất cả (${itemsWithQuality.length})` },
              { id: 'issues', label: `Cần tối ưu (${qualityStats.needWorkCount})`, highlight: qualityStats.needWorkCount > 0 },
              { id: 'missing_cover', label: `Thiếu ảnh bìa (${qualityStats.missingCoverCount})`, warn: qualityStats.missingCoverCount > 0 },
              { id: 'missing_seo', label: `Thiếu SEO Meta (${qualityStats.missingSeoCount})`, warn: qualityStats.missingSeoCount > 0 },
              { id: 'short_content', label: `Nội dung ngắn (${qualityStats.shortContentCount})`, warn: qualityStats.shortContentCount > 0 },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setQualityFilter(f.id)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  cursor: 'pointer',
                  font: 'var(--type-caption)',
                  fontSize: 12,
                  fontWeight: qualityFilter === f.id ? 'var(--fw-semibold)' : 'var(--fw-normal)',
                  background: qualityFilter === f.id
                    ? (f.warn ? '#ef4444' : f.highlight ? '#d97706' : 'var(--action-dark)')
                    : (f.warn && f.id !== 'all' ? '#fee2e2' : 'var(--white)'),
                  color: qualityFilter === f.id
                    ? 'var(--white)'
                    : (f.warn && f.id !== 'all' ? '#991b1b' : 'var(--text-body)'),
                  boxShadow: qualityFilter === f.id ? 'var(--shadow-sm)' : 'var(--shadow-inset-hairline)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          {qualityStats.perfectCount}/{itemsWithQuality.length} bài đạt chuẩn SEO 100%
        </span>
      </div>

      {/* 4. Bảng danh sách bài viết */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 840 }}>
            {/* Table Header */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)', alignItems: 'center' }}>
              <span style={{ flex: '0 0 24px' }}>
                {items.length > 0 && <input type="checkbox" checked={selected.size === items.length} onChange={toggleSelectAll} />}
              </span>
              <span style={{ flex: '0 0 64px' }}>Ảnh bìa</span>
              <span style={{ flex: '3 1 240px' }}>Tiêu đề & Chuyên mục</span>
              <span style={{ flex: '1 1 110px' }}>Trạng thái</span>
              <span style={{ flex: '2 1 180px' }}>Độ hoàn thiện & SEO</span>
              <span style={{ flex: '1 1 100px' }}>Ngày cập nhật</span>
              <span style={{ flex: '0 0 88px', textAlign: 'right' }}>Thao tác</span>
            </div>

            {isLoading && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải danh sách bài viết…</div>}
            {isError && (
              <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <span>Không tải được danh sách bài viết.</span>
                <Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>
              </div>
            )}

            {!isLoading && !isError && items.map((a) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  alignItems: 'center',
                  padding: '12px var(--gutter-card)',
                  boxShadow: 'inset 0 -1px 0 var(--grey-100)',
                  transition: 'background 0.15s ease',
                }}
              >
                {/* Checkbox */}
                <span style={{ flex: '0 0 24px' }}>
                  <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} />
                </span>

                {/* Thumbnail Preview */}
                <div style={{ flex: '0 0 64px' }}>
                  {a.coverImageUrl ? (
                    <img
                      src={a.coverImageUrl}
                      alt={a.title}
                      style={{
                        width: 58,
                        height: 38,
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: 'var(--shadow-inset-hairline)',
                        background: 'var(--surface-muted)',
                      }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      title="Chưa có ảnh đại diện"
                      style={{
                        width: 58,
                        height: 38,
                        borderRadius: 'var(--radius-sm)',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        font: 'var(--type-caption)',
                        fontSize: 10,
                        fontWeight: 'var(--fw-semibold)',
                      }}
                    >
                      <Image size={16} />
                    </div>
                  )}
                </div>

                {/* Tiêu đề + Chuyên mục + Slug */}
                <div style={{ flex: '3 1 240px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                      {a.title}
                    </span>
                    <Badge tone={CATEGORY_TONE[a.category] || 'neutral'}>
                      {CATEGORY_LABEL[a.category] || a.category}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    <span>/{a.slug}</span>
                    {a.status === 'published' && (
                      <a
                        href={`#/bai-viet/${a.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Xem bài viết trên website"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--link)', textDecoration: 'none' }}
                      >
                        <ExternalLink size={12} /> Xem web
                      </a>
                    )}
                  </div>
                </div>

                {/* Trạng thái bài viết */}
                <div style={{ flex: '1 1 110px' }}>
                  {a.status === 'draft' && a.scheduledPublishAt ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Badge tone="blue">Hẹn giờ</Badge>
                      <span style={{ font: 'var(--type-caption)', fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatDateTime(a.scheduledPublishAt)}
                      </span>
                    </div>
                  ) : (
                    <Badge tone={STATUS_TONE[a.status] || 'neutral'}>
                      {STATUS_LABEL[a.status] || a.status}
                    </Badge>
                  )}
                </div>

                {/* Điểm chất lượng & Cảnh báo thiếu thông tin */}
                <div style={{ flex: '2 1 180px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: 11,
                        fontWeight: 'var(--fw-semibold)',
                        background: a.quality.score >= 80 ? '#dcfce7' : a.quality.score >= 50 ? '#fef3c7' : '#fee2e2',
                        color: a.quality.score >= 80 ? '#166534' : a.quality.score >= 50 ? '#92400e' : '#991b1b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {a.quality.score >= 80 ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      {a.quality.score}% · {a.quality.statusLabel}
                    </span>
                  </div>

                  {/* Danh sách cảnh báo ngắn */}
                  {a.quality.issues.length > 0 ? (
                    <span style={{ font: 'var(--type-caption)', fontSize: 11, color: '#dc2626' }}>
                      ⚠ {a.quality.issues.slice(0, 2).join(' · ')}{a.quality.issues.length > 2 ? ` (+${a.quality.issues.length - 2})` : ''}
                    </span>
                  ) : (
                    <span style={{ font: 'var(--type-caption)', fontSize: 11, color: '#16a34a' }}>
                      ✓ Đủ ảnh, meta SEO & nội dung
                    </span>
                  )}
                </div>

                {/* Ngày đăng / Ngày cập nhật */}
                <div style={{ flex: '1 1 100px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-strong)' }}>
                    {formatDate(a.publishedAt || a.createdAt)}
                  </span>
                  <span style={{ font: 'var(--type-caption)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {a.readingTimeMinutes ? `${a.readingTimeMinutes} phút đọc` : ''}
                  </span>
                </div>

                {/* Thao tác */}
                <div style={{ flex: '0 0 88px', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <IconButton name="pencil" label="Sửa bài viết" size="sm" onClick={() => openEditPost(a)} />
                  <IconButton name="trash-2" label="Xóa" size="sm" disabled={deletingId === a.id} onClick={() => confirmRemove(a)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isLoading && !isError && items.length === 0 && (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Không có bài viết nào phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {!isLoading && !isError && total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Hiển thị {items.length} trên tổng số {total} bài viết — Trang {page}/{totalPages}
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Delete Bar */}
      {selected.size > 0 && (
        <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 'var(--z-bulk)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-4)', background: 'var(--text-strong)', color: 'var(--white)', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-4)' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--white)' }}>Đã chọn {selected.size} bài viết</span>
          <button type="button" onClick={() => setConfirmBulkDelete(true)} style={{ border: 'none', background: 'var(--status-danger)', color: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '4px 12px', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', cursor: 'pointer' }}>
            Xóa {selected.size} bài
          </button>
        </div>
      )}

      {/* Modal xác nhận xóa 1 bài */}
      <ConfirmModal
        open={!!confirmPost}
        onClose={() => setConfirmPost(null)}
        title="Xóa bài viết"
        message={`Xóa bài viết "${confirmPost?.title}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa bài viết"
        danger
        loading={!!deletingId}
        onConfirm={removePost}
      />

      {/* Modal xác nhận xóa hàng loạt */}
      <ConfirmBulkModal
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={bulkDelete}
        count={selected.size}
        actionLabel="xóa"
        itemLabel="bài viết"
        danger
        loading={bulkDeleting}
      />

      {/* Modal Thêm bài viết hàng loạt */}
      <BulkAddPostsModal
        open={bulkAddOpen}
        onClose={() => setBulkAddOpen(false)}
        notify={notify}
        onCompleted={() => {
          setBulkAddOpen(false);
          refetch();
        }}
      />

      {/* Modal Sinh thông tin SEO hàng loạt */}
      <BulkSeedPostInfoModal
        open={bulkSeedOpen}
        onClose={() => setBulkSeedOpen(false)}
        posts={itemsWithQuality}
        notify={notify}
        onCompleted={() => {
          setBulkSeedOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
