import { useState } from 'react';
import { Star } from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Select } from '../../components/index.jsx';
import { useAdminReviews, useUpdateReviewStatus } from '../../services/adminReviewService.js';
import { formatDate } from '../../lib/date.js';

const STATUS_OPTS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Đã từ chối' },
];

export default function AdminReviews({ notify }) {
  const [status, setStatus] = useState('pending');
  const [pendingId, setPendingId] = useState(null);
  const { data, isLoading, isError, refetch } = useAdminReviews(status);
  const updateStatus = useUpdateReviewStatus();

  const items = data?.items || [];

  const act = async (id, next) => {
    setPendingId(id);
    try {
      await updateStatus.mutateAsync({ id, status: next });
      notify(next === 'approved' ? 'Đã duyệt đánh giá' : 'Đã từ chối đánh giá');
    } catch (e) {
      notify(e.message || 'Lỗi khi cập nhật');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Select value={status} options={STATUS_OPTS} onChange={setStatus} />
      </div>

      {isLoading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
      ) : isError ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span>Lỗi tải dữ liệu</span>
          <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có đánh giá nào ở trạng thái này.</div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          {items.map((r) => (
            <div key={r.id} style={{ padding: 'var(--space-4) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{r.reviewerName}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{r.plateNumber || '—'}</span>
                <div role="img" aria-label={`${r.rating}/5 sao`} style={{ display: 'flex', gap: 2 }}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill={n <= r.rating ? 'var(--action-primary)' : 'none'} style={{ color: n <= r.rating ? 'var(--action-primary)' : 'var(--grey-300)' }} aria-hidden />)}</div>
                <div style={{ flex: 1 }} />
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <ReviewComment text={r.comment} />}
              {status === 'pending' && (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button variant="primary" size="sm" disabled={pendingId === r.id} onClick={() => act(r.id, 'approved')}>{pendingId === r.id ? 'Đang…' : 'Duyệt'}</Button>
                  <Button variant="ghost" size="sm" disabled={pendingId === r.id} onClick={() => act(r.id, 'rejected')}>Từ chối</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewComment({ text }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 160;
  return (
    <div>
      <p style={{
        margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap',
        ...(long && !expanded ? { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
      }}>{text}</p>
      {long && (
        <button type="button" onClick={() => setExpanded((v) => !v)} style={{ border: 'none', background: 'none', padding: 0, marginTop: 4, cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}
