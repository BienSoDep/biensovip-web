import { useState } from 'react';
import { Badge, IconButton } from '../../components/index.jsx';
import { useAdminBlogPosts, useDeleteBlogPost } from '../../services/blog.js';

const STATUS_TONE = { draft: 'amber', published: 'mint' };
const STATUS_LABEL = { draft: 'Bản nháp', published: 'Đã xuất bản' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function AdminPosts({ st, patch, notify }) {
  const [status, setStatus] = useState('');
  const adminQ = (st?.adminQ || '').trim();
  const { data, isLoading, isError } = useAdminBlogPosts(status || undefined, adminQ || undefined);
  const deletePost = useDeleteBlogPost();
  const items = data?.items || [];

  const openEditPost = (post) => patch({ screen: 'compose', editPostId: post.id });

  const removePost = (post) => {
    if (!window.confirm(`Xóa bài "${post.title}"?`)) return;
    deletePost.mutate(post.id, {
      onSuccess: () => notify('Đã xóa bài viết'),
      onError: (err) => notify(err.message || 'Xóa thất bại.'),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {[{ v: '', l: 'Tất cả' }, { v: 'draft', l: 'Bản nháp' }, { v: 'published', l: 'Đã xuất bản' }].map((o) => (
          <button key={o.v} type="button" onClick={() => setStatus(o.v)}
            style={{ height: 32, padding: '0 14px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', background: status === o.v ? 'var(--action-dark)' : 'var(--surface-muted)', color: status === o.v ? 'var(--white)' : 'var(--text-body)', font: 'var(--type-body-sm)' }}>
            {o.l}
          </button>
        ))}
      </div>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 520 }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '2 1 180px' }}>Tiêu đề</span><span style={{ flex: '1 1 96px' }}>Trạng thái</span><span style={{ flex: '1 1 96px' }}>Ngày đăng</span><span style={{ flex: '0 0 72px' }}>Thao tác</span>
        </div>
        {isLoading && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>}
        {isError && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Không tải được danh sách.</div>}
        {!isLoading && !isError && items.map((a) => (
          <div key={a.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
            <span style={{ flex: '2 1 180px', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{a.title}</span>
            <span style={{ flex: '1 1 96px' }}><Badge tone={STATUS_TONE[a.status] || 'neutral'}>{STATUS_LABEL[a.status] || a.status}</Badge></span>
            <span style={{ flex: '1 1 96px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{formatDate(a.publishedAt)}</span>
            <span style={{ flex: '0 0 72px', display: 'flex', gap: 'var(--space-2)' }}>
              <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEditPost(a)} />
              <IconButton name="trash-2" label="Xóa" size="sm" onClick={() => removePost(a)} />
            </span>
          </div>
        ))}
        </div>
        </div>
        {!isLoading && !isError && items.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có bài viết nào.</div>}
      </div>
    </div>
  );
}
