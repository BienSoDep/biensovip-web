import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Input, IconButton, Badge } from '../../components/index.jsx';
import { useAdminPromoVideos, useCreatePromoVideo, useDeletePromoVideo, useReorderPromoVideos } from '../../services/promoVideoService.js';

const PLATFORM_LABEL = { tiktok: 'TikTok', facebook: 'Facebook' };
const PLATFORM_TONE = { tiktok: 'dark', facebook: 'blue' };
const RATIO = { tiktok: '9 / 14', facebook: '16 / 9' };

export default function AdminVideos({ notify }) {
  const { data, isLoading, isError, refetch } = useAdminPromoVideos();
  const createVideo = useCreatePromoVideo();
  const deleteVideo = useDeletePromoVideo();
  const reorderVideos = useReorderPromoVideos();

  const videos = (data?.items || []).slice().sort((a, b) => a.displayOrder - b.displayOrder);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ videoUrl: '', title: '' });
  const [urlErr, setUrlErr] = useState('');
  const [delId, setDelId] = useState(null);

  const openAdd = () => { setForm({ videoUrl: '', title: '' }); setUrlErr(''); setAddOpen(true); };

  const saveAdd = async () => {
    const url = form.videoUrl.trim();
    if (!url) { setUrlErr('Nhập link video.'); return; }
    try {
      await createVideo.mutateAsync({ videoUrl: url, title: form.title.trim() || null, description: null, thumbnailUrl: null });
      setAddOpen(false);
      notify('Đã thêm video');
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

  if (isLoading) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>;
  if (isError) return (
    <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span>Lỗi tải dữ liệu</span>
      <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
    </div>
  );

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      {videos.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(276px,100%),1fr))', gap: 'var(--gutter-section)' }}>
          {videos.map((v, idx) => (
            <div key={v.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
              <div style={{ position: 'relative', aspectRatio: RATIO[v.platform] || '16 / 9', background: 'var(--surface-sunken)' }}>
                <iframe src={v.videoUrl} title={v.title || 'Video'} style={{ width: '100%', height: '100%', border: 0 }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              </div>
              <div style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button type="button" aria-label="Lên" onClick={() => move(idx, -1)} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, padding: 2, color: 'var(--text-muted)' }}><ChevronUp size={16} /></button>
                  <button type="button" aria-label="Xuống" onClick={() => move(idx, 1)} disabled={idx === videos.length - 1} style={{ border: 'none', background: 'transparent', cursor: idx === videos.length - 1 ? 'default' : 'pointer', opacity: idx === videos.length - 1 ? 0.3 : 1, padding: 2, color: 'var(--text-muted)' }}><ChevronDown size={16} /></button>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title || 'Video'}</div>
                  <Badge tone={PLATFORM_TONE[v.platform] || 'neutral'}>{PLATFORM_LABEL[v.platform] || v.platform}</Badge>
                </div>
                <IconButton name="trash-2" label="Xóa video" size="sm" onClick={() => setDelId(v.id)} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-surface)', border: '2px dashed var(--border-strong)', padding: 'var(--space-9) var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có video nào</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Thêm video TikTok / Facebook để hiển thị ở trang chủ.</span>
          <Button variant="primary" size="md" onClick={openAdd}>Thêm video đầu tiên</Button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-5)' }}>
        <Button variant="primary" size="md" onClick={openAdd}>Thêm video</Button>
      </div>

      {addOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 18px', overflow: 'auto', animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div style={{ width: '100%', maxWidth: 480, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div style={{ flex: 1 }}><h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Thêm video</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Dán link video từ TikTok / Facebook — hệ thống tự nhận diện nền tảng.</p></div>
              <IconButton name="x" label="Đóng" onClick={() => setAddOpen(false)} />
            </div>
            <Input label="URL video" placeholder="https://www.tiktok.com/@…/video/… hoặc https://www.facebook.com/…/videos/…" value={form.videoUrl} error={urlErr} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} />
            <Input label="Tiêu đề" placeholder="VD: Lăn số ngũ quý 999.99" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="md" onClick={() => setAddOpen(false)}>Hủy</Button>
              <Button variant="primary" size="md" onClick={saveAdd} disabled={createVideo.isPending}>{createVideo.isPending ? 'Đang thêm…' : 'Thêm video'}</Button>
            </div>
          </div>
        </div>
      )}

      {delId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div style={{ width: '100%', maxWidth: 380, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <h2 style={{ margin: 0, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Xác nhận xóa</h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Xóa video này khỏi trang chủ và mọi bài viết đã gắn?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="md" onClick={() => setDelId(null)}>Hủy</Button>
              <Button variant="primary" size="md" onClick={doDelete} style={{ background: 'var(--status-danger)', boxShadow: '0 8px 20px rgba(229,72,77,.26)' }}>Xóa</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
