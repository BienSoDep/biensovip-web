import { useState } from 'react';
import { Star } from 'lucide-react';
import { useDebouncedValue } from '@mantine/hooks';
import Button from '../../components/Button.jsx';
import { Select } from '../../components/index.jsx';
import { useAdminReviews, useUpdateReviewStatus, useReplyReview } from '../../services/adminReviewService.js';
import { formatDate, formatDateTime } from '../../lib/date.js';

const STATUS_OPTS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Đã từ chối' },
];

export default function AdminReviews({ notify }) {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [q] = useDebouncedValue(keyword, 300);
  const [pendingId, setPendingId] = useState(null);
  const { data, isLoading, isError, refetch } = useAdminReviews(status, page, 20, undefined, q || undefined);
  const updateStatus = useUpdateReviewStatus();
  const replyReview = useReplyReview();

  const items = data?.items || [];
  const total = data?.total || 0;
  const perPage = data?.limit || 20;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

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
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Select value={status} options={STATUS_OPTS} onChange={(v) => { setStatus(v); setPage(1); }} />
        <input
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          placeholder="Tìm theo tên khách / nội dung…"
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)', color: 'var(--text-body)', background: 'var(--white)', minWidth: 220 }}
        />
        <span style={{ flex: 1, font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'right' }}>{total} đánh giá</span>
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
              {status === 'approved' && <ReplyBlock review={r} replyReview={replyReview} notify={notify} />}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            style={{ minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page <= 1 ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page <= 1 ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }} aria-label="Trang trước">‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined} style={{
              minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)',
              background: p === page ? 'var(--action-primary)' : 'var(--white)',
              color: p === page ? 'var(--white)' : 'var(--text-body)',
              font: 'var(--type-body-sm)', fontWeight: p === page ? 'var(--fw-bold)' : 'var(--fw-medium)',
              cursor: 'pointer', boxShadow: 'var(--shadow-inset-hairline)',
            }}>{p}</button>
          ))}
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{ minWidth: 36, height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page >= totalPages ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page >= totalPages ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }} aria-label="Trang sau">›</button>
        </div>
      )}
    </div>
  );
}

function ReplyBlock({ review, replyReview, notify }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(review.adminReply || '');

  const save = async () => {
    try {
      await replyReview.mutateAsync({ id: review.id, reply: draft });
      notify(draft.trim() ? 'Đã lưu phản hồi' : 'Đã xóa phản hồi');
      setEditing(false);
    } catch (e) {
      notify(e.message || 'Lỗi khi lưu phản hồi');
    }
  };

  if (!editing && review.adminReply) {
    return (
      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>Phản hồi từ cửa hàng · {formatDateTime(review.adminReplyAt)}</span>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{review.adminReply}</span>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" onClick={() => { setDraft(review.adminReply); setEditing(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Sửa</button>
          <button type="button" onClick={() => { setDraft(''); replyReview.mutateAsync({ id: review.id, reply: '' }).then(() => notify('Đã xóa phản hồi')).catch((e) => notify(e.message)); }} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Xóa phản hồi</button>
        </div>
      </div>
    );
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} style={{ alignSelf: 'flex-start', border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>
        Phản hồi
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} maxLength={1000}
        placeholder="Phản hồi công khai cho khách hàng…"
        style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '8px 12px', font: 'var(--type-body-sm)' }} />
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="primary" size="sm" disabled={replyReview.isPending} onClick={save}>Lưu</Button>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Hủy</Button>
      </div>
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
