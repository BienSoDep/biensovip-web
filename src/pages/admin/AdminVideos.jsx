import { useMemo, useState } from 'react';
import { Reorder } from 'framer-motion';
import { ChevronUp, ChevronDown, Star, Search } from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Input, ImageUrlInput, IconButton, Badge } from '../../components/index.jsx';
import { useAdminPromoVideos, useCreatePromoVideo, useDeletePromoVideo, useReorderPromoVideos, useUpdatePromoVideo } from '../../services/promoVideoService.js';
import TikTokEmbed from '../../components/TikTokEmbed.jsx';
import Modal from '../../components/Modal.jsx';
import { useDebouncedValue } from '@mantine/hooks';

const PLATFORM_LABEL = { tiktok: 'TikTok', facebook: 'Facebook' };
const PLATFORM_TONE = { tiktok: 'dark', facebook: 'blue' };
const RATIO = { tiktok: '9 / 14', facebook: '16 / 9' };
const STATUS_LABEL = { published: 'Đã xuất bản', draft: 'Bản nháp' };
const STATUS_TONE = { published: 'green', draft: 'neutral' };

export default function AdminVideos({ notify }) {
  const { data, isLoading, isError, refetch } = useAdminPromoVideos();
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

  const openAdd = () => { setEditId(null); setForm({ videoUrl: '', title: '', description: '', thumbnailUrl: '', postId: '', postUrl: '', shareCount: '', commentCount: '', viewCount: '', likeCount: '', status: 'published', isFeatured: false }); setUrlErr(''); setAddOpen(true); };
  const openEdit = (v) => { setEditId(v.id); setForm({ videoUrl: v.videoUrl, title: v.title || '', description: v.description || '', thumbnailUrl: v.thumbnailUrl || '', postId: v.postId || '', postUrl: v.postUrl || '', shareCount: v.shareCount ?? '', commentCount: v.commentCount ?? '', viewCount: v.viewCount ?? '', likeCount: v.likeCount ?? '', status: v.status || 'draft', isFeatured: v.isFeatured }); setUrlErr(''); setAddOpen(true); };

  const numOrNull = (s) => (s === '' || s == null ? null : Number(s));

  const saveAdd = async () => {
    const url = form.videoUrl.trim();
    if (!url) { setUrlErr('Nhập link video.'); return; }
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

  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(276px,100%),1fr))', gap: 'var(--gutter-section)' };

  const renderCard = (v, idx) => (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
      <div style={{ background: 'var(--surface-sunken)', display: 'flex', justifyContent: 'center' }}>
        {v.platform === 'tiktok' ? (
          <TikTokEmbed videoUrl={v.videoUrl} title={v.title} />
        ) : (
          <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', aspectRatio: RATIO[v.platform] || '16 / 9', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Xem video</a>
        )}
      </div>
      <div style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button type="button" aria-label="Lên" onClick={() => move(idx, -1)} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, padding: 2, color: 'var(--text-muted)' }}><ChevronUp size={16} /></button>
          <button type="button" aria-label="Xuống" onClick={() => move(idx, 1)} disabled={idx === videos.length - 1} style={{ border: 'none', background: 'transparent', cursor: idx === videos.length - 1 ? 'default' : 'pointer', opacity: idx === videos.length - 1 ? 0.3 : 1, padding: 2, color: 'var(--text-muted)' }}><ChevronDown size={16} /></button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title || 'Video'}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
            <Badge tone={PLATFORM_TONE[v.platform] || 'neutral'}>{PLATFORM_LABEL[v.platform] || v.platform}</Badge>
            <Badge tone={STATUS_TONE[v.status] || 'neutral'}>{STATUS_LABEL[v.status] || v.status}</Badge>
            {v.isFeatured && <Badge tone="amber">Nổi bật</Badge>}
          </div>
          {(v.viewCount != null || v.likeCount != null || v.shareCount != null || v.commentCount != null) && (
            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              {v.viewCount != null && <span>👁 {v.viewCount}</span>}
              {v.likeCount != null && <span>❤️ {v.likeCount}</span>}
              {v.shareCount != null && <span>↗ {v.shareCount}</span>}
              {v.commentCount != null && <span>💬 {v.commentCount}</span>}
            </div>
          )}
        </div>
        <button type="button" aria-label={v.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'} title={v.isFeatured ? 'Đang hiển thị ở trang chủ' : 'Đánh dấu hiển thị ở trang chủ'} onClick={() => updateVideo.mutate({ id: v.id, isFeatured: !v.isFeatured })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, color: v.isFeatured ? 'var(--status-warning)' : 'var(--grey-400)', display: 'flex', alignItems: 'center' }}>
          <Star size={18} fill={v.isFeatured ? 'var(--status-warning)' : 'none'} />
        </button>
        <IconButton name="pencil" label="Sửa video" size="sm" onClick={() => openEdit(v)} />
        <IconButton name="trash-2" label="Xóa video" size="sm" onClick={() => setDelId(v.id)} />
      </div>
    </div>
  );

  if (isLoading) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>;
  if (isError) return (
    <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span>Lỗi tải dữ liệu</span>
      <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
    </div>
  );

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>

      {/* Thống kê tổng */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <StatPill label="Video" value={videos.length} />
        <StatPill label="Tổng lượt xem" value={totalViews} />
        <StatPill label="Tổng lượt thích" value={totalLikes} />
        <StatPill label="Đang lọc" value={filtered.length} muted={filtered.length !== videos.length} />
      </div>

      {/* Toolbar lọc */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '0 12px', height: 38 }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tiêu đề…" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }} />
        </div>
        <select value={pf} onChange={(e) => setPf(e.target.value)} style={{ height: 38, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--white)', font: 'var(--type-caption)', color: 'var(--text-strong)', padding: '0 10px' }}>
          <option value="all">Tất cả nền tảng</option>
          <option value="facebook">Facebook</option>
          <option value="tiktok">TikTok</option>
        </select>
        <select value={sf} onChange={(e) => setSf(e.target.value)} style={{ height: 38, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--white)', font: 'var(--type-caption)', color: 'var(--text-strong)', padding: '0 10px' }}>
          <option value="all">Mọi trạng thái</option>
          <option value="published">Đã xuất bản</option>
          <option value="draft">Bản nháp</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-strong)', cursor: 'pointer' }}>
          <input type="checkbox" checked={featOnly} onChange={(e) => setFeatOnly(e.target.checked)} />
          Chỉ nổi bật
        </label>
      </div>

      {filtered.length ? (
        filtered.length === videos.length ? (
          <Reorder.Group axis="y" values={videos} onReorder={handleReorder} style={gridStyle}>
            {videos.map((v, idx) => (
              <Reorder.Item key={v.id} value={v} style={{ listStyle: 'none' }}>
                {renderCard(v, idx)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div style={gridStyle}>
            {filtered.map((v) => renderCard(v, videos.findIndex((x) => x.id === v.id)))}
          </div>
        )
      ) : (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-surface)', border: '2px dashed var(--border-strong)', padding: 'var(--space-9) var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
          {videos.length ? (
            <>
              <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Không tìm thấy video nào khớp</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Thử đổi từ khóa hoặc bỏ bộ lọc.</span>
              <Button variant="ghost" size="md" onClick={() => { setQ(''); setPf('all'); setSf('all'); setFeatOnly(false); }}>Xóa bộ lọc</Button>
            </>
          ) : (
            <>
              <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có video nào</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Thêm video TikTok / Facebook để hiển thị ở trang chủ.</span>
              <Button variant="primary" size="md" onClick={openAdd}>Thêm video đầu tiên</Button>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-5)' }}>
        <Button variant="primary" size="md" onClick={openAdd}>Thêm video</Button>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={editId ? 'Sửa video' : 'Thêm video'} maxWidth="480px">
        <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Dán link video từ TikTok / Facebook — hệ thống tự nhận diện nền tảng.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <Input label="URL video" placeholder="https://www.tiktok.com/@…/video/… hoặc https://www.facebook.com/…/videos/…" value={form.videoUrl} error={urlErr} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} />
            {debouncedUrl.trim() && (
              <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Xem trước:</span>
                <div style={{ width: 160, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
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
      </Modal>

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
