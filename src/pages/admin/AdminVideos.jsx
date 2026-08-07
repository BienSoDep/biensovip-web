import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Input, Select, IconButton, Badge } from '../../components/index.jsx';

const PLATFORMS = { tiktok: { label: 'TikTok', ratio: '9 / 14' }, facebook: { label: 'Facebook', ratio: '16 / 9' } };

export default function AdminVideos({ st, patch, setSt, notify }) {
  const videos = (st.videos || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ platform: 'tiktok', url: '', title: '' });
  const [urlErr, setUrlErr] = useState('');
  const [delId, setDelId] = useState(null);

  const openAdd = () => { setForm({ platform: 'tiktok', url: '', title: '' }); setUrlErr(''); setAddOpen(true); };
  const saveAdd = () => {
    const url = form.url.trim();
    if (!url) { setUrlErr('Nhập link hoặc mã nhúng video.'); return; }
    setSt((s) => ({ ...s, videos: [...(s.videos || []), { id: 'v' + Date.now(), platform: form.platform, url, title: form.title.trim() || 'Video', order: (s.videos || []).length }] }));
    setAddOpen(false);
    notify('Đã thêm video');
  };
  const doDelete = () => {
    setSt((s) => ({ ...s, videos: (s.videos || []).filter((v) => v.id !== delId).map((v, i) => ({ ...v, order: i })) }));
    setDelId(null);
    notify('Đã xóa video');
  };

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      {videos.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(276px,1fr))', gap: 'var(--gutter-section)' }}>
          {videos.map((v) => {
            const pf = PLATFORMS[v.platform] || PLATFORMS.tiktok;
            return (
              <div key={v.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
                <div style={{ position: 'relative', aspectRatio: pf.ratio, background: 'var(--surface-sunken)' }}>
                  {v.url ? <iframe src={v.url} title={v.title} style={{ width: '100%', height: '100%', border: 0 }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : null}
                </div>
                <div style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
                  <span title="Kéo để sắp xếp (chưa khả dụng)" style={{ color: 'var(--text-faint)', display: 'flex', cursor: 'grab' }}><GripVertical size={18} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                    <Badge tone={v.platform === 'tiktok' ? 'dark' : 'blue'}>{pf.label}</Badge>
                  </div>
                  <IconButton name="trash-2" label="Xóa video" size="sm" onClick={() => setDelId(v.id)} />
                </div>
              </div>
            );
          })}
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
              <div style={{ flex: 1 }}><h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Thêm video</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Dán link hoặc mã nhúng video từ TikTok / Facebook.</p></div>
              <IconButton name="x" label="Đóng" onClick={() => setAddOpen(false)} />
            </div>
            <Select label="Nền tảng" value={form.platform} options={Object.entries(PLATFORMS).map(([value, p]) => ({ value, label: p.label }))} onChange={(v) => setForm((f) => ({ ...f, platform: v }))} />
            <Input label="URL video" placeholder="https://www.tiktok.com/@…/video/… hoặc mã nhúng" value={form.url} error={urlErr} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
            <Input label="Tiêu đề" placeholder="VD: Lăn số ngũ quý 999.99" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="md" onClick={() => setAddOpen(false)}>Hủy</Button>
              <Button variant="primary" size="md" onClick={saveAdd}>Thêm video</Button>
            </div>
          </div>
        </div>
      )}

      {delId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div style={{ width: '100%', maxWidth: 380, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <h2 style={{ margin: 0, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Xác nhận xóa</h2>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Xóa video này khỏi trang chủ?</p>
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
