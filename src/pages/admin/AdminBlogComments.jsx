import { useState } from 'react';
import { useAdminBlogComments, useModerateBlogComment } from '../../services/adminBlogComments.js';
import { Select } from '../../components/index.jsx';
import Button from '../../components/Button.jsx';

const STATUS_OPTS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Đang chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Đã từ chối' },
];

export default function AdminBlogComments({ notify }) {
  const [status, setStatus] = useState('pending');
  const { data, isLoading, isError, refetch } = useAdminBlogComments(status);
  const moderate = useModerateBlogComment();

  const items = data?.items || [];

  const act = (id, next) => {
    moderate.mutate({ id, status: next }, {
      onSuccess: () => notify(next === 'approved' ? 'Đã duyệt bình luận' : 'Đã từ chối bình luận'),
      onError: (e) => notify(e.message || 'Lỗi xử lý bình luận'),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Select label="Trạng thái" value={status} options={STATUS_OPTS} onChange={setStatus} />
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải…</div>
        ) : isError ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--status-danger)' }}>
            Lỗi tải bình luận.{' '}
            <button type="button" onClick={() => refetch()} style={{ color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Thử lại</button>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Không có bình luận nào.</div>
        ) : items.map((c) => (
          <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: '12px 16px', borderBottom: '1px solid var(--border-hairline)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{c.userName || 'Người dùng'}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
            </div>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{c.content}</p>
            {c.status === 'pending' && (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="primary" size="sm" onClick={() => act(c.id, 'approved')}>Duyệt</Button>
                <Button variant="ghost" size="sm" onClick={() => act(c.id, 'rejected')}>Từ chối</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
