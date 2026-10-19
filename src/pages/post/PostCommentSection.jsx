import { useState } from 'react';
import { format } from 'date-fns';
import Button from '../../components/Button.jsx';
import { Input } from '../../components/index.jsx';

function formatDate(iso) {
  if (!iso) return '';
  return format(new Date(iso), 'dd/MM/yyyy');
}

export function PostCommentSection({ user, commentsData, submitComment, notify, go }) {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitComment.isPending) return;
    submitComment.mutate(commentText.trim(), {
      onSuccess: () => {
        setCommentText('');
        notify?.('Bình luận đang chờ duyệt');
      },
      onError: (err) => notify?.(err.message || 'Gửi bình luận thất bại'),
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        paddingTop: 'var(--space-4)',
        boxShadow: 'inset 0 1px 0 var(--border-hairline)',
      }}
    >
      <h2 style={{ margin: 0, font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>Bình luận</h2>
      {user ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Input
            placeholder="Viết bình luận của bạn… (nhấn Enter để gửi)"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <Button
            variant="primary"
            type="submit"
            size="sm"
            disabled={!commentText.trim() || submitComment.isPending}
            style={{ alignSelf: 'flex-start' }}
          >
            {submitComment.isPending ? 'Đang gửi…' : 'Gửi bình luận'}
          </Button>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={go('login')} style={{ alignSelf: 'flex-start' }}>
          Đăng nhập để bình luận
        </Button>
      )}
      {(commentsData?.items || []).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {commentsData.items.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'var(--surface-sunken)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                  {c.userName || 'Người dùng'}
                </span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                  {formatDate(c.createdAt)}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PostCommentSection;
