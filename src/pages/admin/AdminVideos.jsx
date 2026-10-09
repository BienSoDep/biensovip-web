import { useMemo, useState } from 'react';
import { Reorder } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  Star,
  Search,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Plus,
  Pencil,
  Trash2,
  RotateCw,
  Video,
  PlaySquare,
  Sparkles,
  X,
  ExternalLink
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Input, ImageUrlInput, Badge } from '../../components/index.jsx';
import { useAdminPromoVideos, useCreatePromoVideo, useDeletePromoVideo, useReorderPromoVideos, useUpdatePromoVideo } from '../../services/promoVideoService.js';
import TikTokEmbed from '../../components/TikTokEmbed.jsx';
import Modal from '../../components/Modal.jsx';
import Drawer from '../../components/Drawer.jsx';
import { useDebouncedValue } from '@mantine/hooks';
import { SkeletonCard } from '../../components/Skeleton.jsx';

const PLATFORM_LABEL = { tiktok: 'TikTok', facebook: 'Facebook' };
const PLATFORM_TONE = { tiktok: 'dark', facebook: 'blue' };
const RATIO = { tiktok: '9 / 14', facebook: '16 / 9' };
const STATUS_LABEL = { published: 'Đã xuất bản', draft: 'Bản nháp' };
const STATUS_TONE = { published: 'green', draft: 'neutral' };

export default function AdminVideos({ notify }) {
  const { data, isLoading, isError, refetch, isFetching } = useAdminPromoVideos();
  const createVideo = useCreatePromoVideo();
  const deleteVideo = useDeletePromoVideo();
  const reorderVideos = useReorderPromoVideos();
  const updateVideo = useUpdatePromoVideo();

  const videos = (data?.items || []).slice().sort((a, b) => a.displayOrder - b.displayOrder);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ videoUrl: '', title: '', description: '', thumbnailUrl: '', postId: '', postUrl: '', shareCount: '', commentCount: '', viewCount: '', likeCount: '' });
  const [urlErr, setUrlErr] = useState('');
  const [debouncedUrl] = useDebouncedValue(form.videoUrl, 400);
  const [delId, setDelId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [q, setQ] = useState('');
  const [pf, setPf] = useState('all');
  const [sf, setSf] = useState('all');
  const [featOnly, setFeatOnly] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return videos.filter((v) =>
      (!term || (v.title || '').toLowerCase().includes(term)) &&
      (pf === 'all' || v.platform === pf) &&
      (sf === 'all' || v.status === sf) &&
      (!featOnly || v.isFeatured)
    );
  }, [videos, q, pf, sf, featOnly]);

  const totalViews = videos.reduce((s, v) => s + (v.viewCount ?? 0), 0);
  const totalLikes = videos.reduce((s, v) => s + (v.likeCount ?? 0), 0);
  const featuredCount = videos.filter((v) => v.isFeatured).length;

  const openAdd = () => { setEditId(null); setForm({ videoUrl: '', title: '', description: '', thumbnailUrl: '', postId: '', postUrl: '', shareCount: '', commentCount: '', viewCount: '', likeCount: '', status: 'published', isFeatured: false }); setUrlErr(''); setAddOpen(true); };
  const openEdit = (v) => { setEditId(v.id); setForm({ videoUrl: v.videoUrl, title: v.title || '', description: v.description || '', thumbnailUrl: v.thumbnailUrl || '', postId: v.postId || '', postUrl: v.postUrl || '', shareCount: v.shareCount ?? '', commentCount: v.commentCount ?? '', viewCount: v.viewCount ?? '', likeCount: v.likeCount ?? '', status: v.status || 'draft', isFeatured: v.isFeatured }); setUrlErr(''); setAddOpen(true); };

  const numOrNull = (s) => (s === '' || s == null ? null : Number(s));

  const saveAdd = async () => {
    const url = form.videoUrl.trim();
    if (!url) { setUrlErr('Nhập link video.'); return; }
    if (!/tiktok\.com|facebook\.com|fb\.watch/i.test(url)) { setUrlErr('Chỉ nhận link TikTok hoặc Facebook.'); return; }
    try {
      if (editId) {
        await updateVideo.mutateAsync({
          id: editId, videoUrl: url, title: form.title.trim() || null,
          description: form.description.trim() || null,
          thumbnailUrl: form.thumbnailUrl.trim() || null,
          status: form.status || undefined,
          isFeatured: form.isFeatured,
          postId: form.postId.trim() || null, postUrl: form.postUrl.trim() || null,
          shareCount: numOrNull(form.shareCount), commentCount: numOrNull(form.commentCount),
          viewCount: numOrNull(form.viewCount), likeCount: numOrNull(form.likeCount),
        });
        notify('Đã cập nhật video');
      } else {
        await createVideo.mutateAsync({ videoUrl: url, title: form.title.trim() || null, description: null, thumbnailUrl: null });
        notify('Đã thêm video');
      }
      setAddOpen(false);
      setEditId(null);
    } catch (e) {
      if (e.code === 'duplicate') setUrlErr('Video đã tồn tại.');
      else if (e.code === 'invalid_url') setUrlErr('Link không hợp lệ hoặc không nhận diện được nền tảng.');
      else setUrlErr(e.message || 'Lỗi khi thêm video.');
    }
  };

  const doDelete = async () => {
    try {
      await deleteVideo.mutateAsync(delId);
      notify('Đã xóa video');
    } catch (e) {
      notify(e.message || 'Lỗi khi xóa');
    }
    setDelId(null);
  };

  const move = (idx, dir) => {
    const to = idx + dir;
    if (to < 0 || to >= videos.length) return;
    const arr = videos.slice();
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    reorderVideos.mutate(arr.map((v, i) => ({ id: v.id, displayOrder: i })));
  };

  const handleReorder = (order) => reorderVideos.mutate(order.map((v, i) => ({ id: v.id, displayOrder: i })));

  const clearFilters = () => {
    setQ('');
    setPf('all');
    setSf('all');
    setFeatOnly(false);
  };

  const hasActiveFilters = !!q || pf !== 'all' || sf !== 'all' || featOnly;

  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(280px,100%),1fr))', gap: 'var(--gutter-section)' };

  const renderCard = (v, idx) => (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden', border: v.isFeatured ? '1.5px solid var(--action-primary)' : '1px solid var(--border-hairline)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--surface-sunken)', display: 'flex', justifyContent: 'center', position: 'relative' }}>
        {v.platform === 'tiktok' ? (
          <TikTokEmbed videoUrl={v.videoUrl} title={v.title} />
        ) : (
          <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Xem video Facebook: ${v.title || ''}`}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', aspectRatio: RATIO[v.platform] || '16 / 9', overflow: 'hidden', background: '#0f172a', textDecoration: 'none' }}>
            {v.thumbnailUrl ? (
              <img src={v.thumbnailUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                <PlaySquare size={40} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.8 }} />
                <span style={{ font: 'var(--type-caption)', color: '#cbd5e1' }}>{v.title || 'Video Facebook'}</span>
              </div>
            )}
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>▶</span>
            </span>
          </a>
        )}
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', borderTop: '1px solid var(--border-hairline)', flex: 1 }}>
        {/* Nút kéo thứ tự lên/xuống */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
          <button type="button" aria-label="Lên" onClick={() => move(idx, -1)} disabled={idx === 0} style={{ border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, padding: '3px', color: 'var(--text-muted)', display: 'flex' }}><ChevronUp size={14} /></button>
          <button type="button" aria-label="Xuống" onClick={() => move(idx, 1)} disabled={idx === videos.length - 1} style={{ border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', cursor: idx === videos.length - 1 ? 'default' : 'pointer', opacity: idx === videos.length - 1 ? 0.3 : 1, padding: '3px', color: 'var(--text-muted)', display: 'flex' }}><ChevronDown size={14} /></button>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: 'var(--type-body-strong)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title || 'Video giới thiệu'}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge tone={PLATFORM_TONE[v.platform] || 'neutral'}>{PLATFORM_LABEL[v.platform] || v.platform}</Badge>
            <Badge tone={STATUS_TONE[v.status] || 'neutral'}>{STATUS_LABEL[v.status] || v.status}</Badge>
            {v.isFeatured && <Badge tone="amber"><Star size={10} style={{ fill: '#d97706', marginRight: 2 }} /> Nổi bật</Badge>}
          </div>

          {(v.viewCount != null || v.likeCount != null || v.shareCount != null || v.commentCount != null) && (
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              {v.viewCount != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Eye size={12} /> {v.viewCount}</span>}
              {v.likeCount != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Heart size={12} /> {v.likeCount}</span>}
              {v.shareCount != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Share2 size={12} /> {v.shareCount}</span>}
              {v.commentCount != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MessageCircle size={12} /> {v.commentCount}</span>}
            </div>
          )}
        </div>

        {/* Nút hành động trực tiếp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            aria-label={v.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
            title={v.isFeatured ? 'Đang hiển thị ở trang chủ (Nhấp để bỏ)' : 'Đánh dấu hiển thị ở trang chủ'}
            onClick={() => updateVideo.mutate({ id: v.id, isFeatured: !v.isFeatured })}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: v.isFeatured ? '#d97706' : 'var(--text-faint)', display: 'flex', alignItems: 'center' }}
          >
            <Star size={17} fill={v.isFeatured ? '#d97706' : 'none'} />
          </button>
          <button
            type="button"
            title="Chỉnh sửa video"
            onClick={() => openEdit(v)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex' }}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            title="Xóa video"
            onClick={() => setDelId(v.id)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: 'var(--intent-danger)', display: 'flex' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 'var(--space-4)' }}>{Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} height={220} />)}</div>;
  if (isError) return (
    <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span>Lỗi tải danh sách video</span>
      <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <style>{`
        @keyframes bsd-spin { to { transform: rotate(360deg); } }
        .bsd-spin { animation: bsd-spin 0.8s linear infinite; }
      `}</style>

      {/* KPI Cards Thống kê trực quan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        <div
          onClick={() => { setPf('all'); setSf('all'); setFeatOnly(false); }}
          style={{
            background: 'var(--white)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            border: !hasActiveFilters ? '1.5px solid var(--action-primary)' : '1px solid var(--border-hairline)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={20} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng số Video</div>
            <div style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)', fontWeight: 700 }}>{videos.length}</div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--white)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            border: '1px solid var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--intent-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={20} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng lượt xem</div>
            <div style={{ font: 'var(--type-title-2)', color: 'var(--intent-success)', fontWeight: 700 }}>{totalViews.toLocaleString('vi-VN')}</div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--white)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            border: '1px solid var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={20} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng lượt thích</div>
            <div style={{ font: 'var(--type-title-2)', color: '#ef4444', fontWeight: 700 }}>{totalLikes.toLocaleString('vi-VN')}</div>
          </div>
        </div>

        <div
          onClick={() => setFeatOnly((f) => !f)}
          style={{
            background: 'var(--white)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            border: featOnly ? '1.5px solid #d97706' : '1px solid var(--border-hairline)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(217, 119, 6, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={20} fill="#d97706" />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Video nổi bật trang chủ</div>
            <div style={{ font: 'var(--type-title-2)', color: '#d97706', fontWeight: 700 }}>{featuredCount}</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Tìm kiếm, Bộ lọc và Thao tác thêm mới */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'var(--space-3)',
        background: 'var(--white)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)'
      }}>
        {/* Tìm kiếm */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 200px',
          maxWidth: 320,
          background: 'var(--surface-sunken)',
          borderRadius: 'var(--radius-field)',
          border: '1px solid var(--border-hairline)',
          padding: '0 10px',
          height: 36
        }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginRight: 6 }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tiêu đề video…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Nền tảng Tab Filter */}
        <div style={{ display: 'inline-flex', background: 'var(--surface-sunken)', padding: 3, borderRadius: 'var(--radius-pill)', gap: 2 }}>
          {[
            { val: 'all', label: 'Tất cả' },
            { val: 'tiktok', label: 'TikTok' },
            { val: 'facebook', label: 'Facebook' },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => setPf(item.val)}
              style={{
                border: 'none',
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                font: 'var(--type-caption)',
                cursor: 'pointer',
                background: pf === item.val ? 'var(--white)' : 'transparent',
                color: pf === item.val ? 'var(--text-strong)' : 'var(--text-muted)',
                boxShadow: pf === item.val ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                fontWeight: pf === item.val ? 600 : 400
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Trạng thái Tab Filter */}
        <div style={{ display: 'inline-flex', background: 'var(--surface-sunken)', padding: 3, borderRadius: 'var(--radius-pill)', gap: 2 }}>
          {[
            { val: 'all', label: 'Mọi trạng thái' },
            { val: 'published', label: 'Đã xuất bản' },
            { val: 'draft', label: 'Bản nháp' },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => setSf(item.val)}
              style={{
                border: 'none',
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                font: 'var(--type-caption)',
                cursor: 'pointer',
                background: sf === item.val ? 'var(--white)' : 'transparent',
                color: sf === item.val ? 'var(--text-strong)' : 'var(--text-muted)',
                boxShadow: sf === item.val ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                fontWeight: sf === item.val ? 600 : 400
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Nút Xóa lọc */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} style={{ color: 'var(--text-muted)' }}>
            <X size={14} style={{ marginRight: 4 }} /> Xóa lọc
          </Button>
        )}

        <div style={{ flex: 1 }} />

        {/* Nút Làm mới */}
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => refetch()}
          title="Tải lại danh sách video"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RotateCw size={14} className={isFetching ? 'bsd-spin' : ''} />
          Làm mới
        </Button>

        {/* Nút Thêm video */}
        <Button variant="primary" size="sm" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> Thêm video mới
        </Button>
      </div>

      {/* Grid Danh sách video */}
      {filtered.length ? (
        filtered.length === videos.length ? (
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} style={{ color: 'var(--action-primary)' }} />
              Kéo thả các thẻ video hoặc bấm nút mũi tên để đổi thứ tự hiển thị ngoài trang chủ.
            </div>
            <Reorder.Group axis="y" values={videos} onReorder={handleReorder} style={gridStyle}>
              {videos.map((v, idx) => (
                <Reorder.Item key={v.id} value={v} style={{ listStyle: 'none' }}>
                  {renderCard(v, idx)}
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        ) : (
          <div>
            <div style={{ font: 'var(--type-caption)', color: '#d97706', marginBottom: 'var(--space-3)', background: 'rgba(217, 119, 6, 0.08)', padding: '8px 12px', borderRadius: 'var(--radius-field)' }}>
              Đang áp dụng bộ lọc ({filtered.length}/{videos.length} video) — hãy bỏ lọc để kéo sắp xếp lại vị trí.
            </div>
            <div style={gridStyle}>
              {filtered.map((v) => renderCard(v, videos.findIndex((x) => x.id === v.id)))}
            </div>
          </div>
        )
      ) : (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', border: '2px dashed var(--border-hairline)', padding: 'var(--space-9) var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
          {videos.length ? (
            <>
              <Video size={36} style={{ color: 'var(--text-faint)' }} />
              <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Không tìm thấy video nào khớp bộ lọc</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Hãy thử đổi từ khóa hoặc bỏ bớt các tiêu chí lọc hiện tại.</span>
              <Button variant="outline" size="sm" onClick={clearFilters}>Xóa bộ lọc</Button>
            </>
          ) : (
            <>
              <Video size={40} style={{ color: 'var(--text-faint)' }} />
              <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có video quảng bá nào</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Dán link video TikTok / Facebook để hệ thống tự nhận diện và hiển thị nổi bật ở trang chủ.</span>
              <Button variant="primary" size="md" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> Thêm video đầu tiên
              </Button>
            </>
          )}
        </div>
      )}


      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title={editId ? 'Sửa video' : 'Thêm video'} width="min(52%, 720px)">
        <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Dán link video từ TikTok / Facebook — hệ thống tự nhận diện nền tảng.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <Input label="URL video" placeholder="https://www.tiktok.com/@…/video/… hoặc https://www.facebook.com/…/videos/…" value={form.videoUrl} error={urlErr} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} required />
            {debouncedUrl.trim() && (
              <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Xem trước:</span>
                <div style={{ width: 'min(220px, 60%)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <TikTokEmbed videoUrl={debouncedUrl.trim()} title="Xem trước video" />
                </div>
              </div>
            )}
          </div>
          <Input label="Tiêu đề" placeholder="VD: Lăn số ngũ quý 999.99" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="Mô tả" placeholder="Mô tả ngắn cho video / bài đăng" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <ImageUrlInput label="URL ảnh bìa (thumbnail)" placeholder="https://…/thumb.jpg hoặc tải ảnh lên" value={form.thumbnailUrl} onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))} hint="Dán link trực tiếp hoặc tải ảnh lên — hệ thống tự đưa qua Cloudinary thành link." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <select label="Trạng thái" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ height: 40, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--white)', font: 'var(--type-body-sm)', color: 'var(--text-strong)', padding: '0 10px' }}>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-strong)', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} />
              Nổi bật (hiển thị ở trang chủ)
            </label>
          </div>
          {editId && (
            <>
              <Input label="ID bài đăng page" placeholder="VD: 1789… (Facebook post_id / TikTok item id)" value={form.postId} onChange={(e) => setForm((f) => ({ ...f, postId: e.target.value }))} />
              <Input label="URL bài đăng page" placeholder="https://facebook.com/page/posts/… hoặc https://tiktok.com/@…/video/…" value={form.postUrl} onChange={(e) => setForm((f) => ({ ...f, postUrl: e.target.value }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Input label="Lượt xem" type="number" placeholder="0" value={form.viewCount} onChange={(e) => setForm((f) => ({ ...f, viewCount: e.target.value }))} />
                <Input label="Lượt thích" type="number" placeholder="0" value={form.likeCount} onChange={(e) => setForm((f) => ({ ...f, likeCount: e.target.value }))} />
                <Input label="Lượt chia sẻ" type="number" placeholder="0" value={form.shareCount} onChange={(e) => setForm((f) => ({ ...f, shareCount: e.target.value }))} />
                <Input label="Bình luận" type="number" placeholder="0" value={form.commentCount} onChange={(e) => setForm((f) => ({ ...f, commentCount: e.target.value }))} />
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setAddOpen(false)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={saveAdd} disabled={createVideo.isPending || updateVideo.isPending}>{editId ? (updateVideo.isPending ? 'Đang lưu…' : 'Lưu thay đổi') : (createVideo.isPending ? 'Đang thêm…' : 'Thêm video')}</Button>
          </div>
        </div>
      </Drawer>

      <Modal open={delId != null} onClose={() => setDelId(null)} title="Xác nhận xóa" maxWidth="380px">
        <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Video này sẽ được ẩn khỏi trang chủ và mọi bài viết. Bạn có thể khôi phục lại sau nếu cần.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="md" onClick={() => setDelId(null)}>Hủy</Button>
          <Button variant="danger" size="md" onClick={doDelete} loading={deleteVideo.isPending}>Xóa</Button>
        </div>
      </Modal>
    </div>
  );
}

function StatPill({ label, value, muted }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, background: 'var(--white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-inset-hairline)', padding: '8px 14px' }}>
      <span style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', color: muted ? 'var(--text-muted)' : 'var(--text-strong)' }}>{value}</span>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
