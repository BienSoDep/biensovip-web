import { TONES } from '../../common/constants.js';
import { Badge, IconButton } from '../../components/index.jsx';

export default function AdminPosts({ admPosts, openEditPost, askDelete }) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        <span style={{ flex: '2 1 180px' }}>Tiêu đề</span><span style={{ flex: '1 1 96px' }}>Chuyên mục</span><span style={{ flex: '1 1 96px' }}>Trạng thái</span><span style={{ flex: '1 1 70px' }}>Cập nhật</span><span style={{ flex: '0 0 72px' }}>Thao tác</span>
      </div>
      {admPosts.map((a) => (
        <div key={a.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
          <span style={{ flex: '2 1 180px', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{a.title}</span>
          <span style={{ flex: '1 1 96px', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{a.cat}</span>
          <span style={{ flex: '1 1 96px' }}><Badge tone={TONES[a.status] || 'neutral'}>{a.status}</Badge></span>
          <span style={{ flex: '1 1 70px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{a.date}</span>
          <span style={{ flex: '0 0 72px', display: 'flex', gap: 'var(--space-2)' }}>
            <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEditPost(a)} />
            <IconButton name="trash-2" label="Xóa" size="sm" onClick={() => askDelete('post', a.id, `Xóa bài "${a.title}"?`)} />
          </span>
        </div>
      ))}
      {admPosts.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có bài viết nào khớp tìm kiếm.</div>}
    </div>
  );
}
