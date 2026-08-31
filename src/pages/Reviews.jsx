import { useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Avatar } from '../components/index.jsx';
import { usePlates } from '../services/plates.js';
import { usePlateReviews, useCreateReview } from '../services/reviewService.js';
import { loadAuth } from '../lib/authStore.js';
import { formatDate } from '../lib/date.js';

function maskName(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Khách hàng';
  if (parts.length === 1) return parts[0][0] + '***';
  return `${parts[0]} *** ${parts[parts.length - 1]}`;
}

export default function Reviews({ notify, go }) {
  const { data: soldData } = usePlates({ status: 'Sold', perPage: 100 });
  const soldPlates = soldData?.items || [];

  const [plateId, setPlateId] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [page, setPage] = useState(1);

  const perPage = 12;
  const { data, isLoading } = usePlateReviews(plateId, { page, perPage });
  const createReview = useCreateReview();

  const reviews = data?.items || [];
  const avg = data?.averageRating ?? 0;
  const total = data?.totalReviews ?? 0;
  const totalPages = data ? Math.max(1, Math.ceil((data.total || 0) / perPage)) : 1;
  const loggedIn = !!loadAuth()?.accessToken;
  const breakdown = data?.ratingBreakdown || {};
  const dist = [5, 4, 3, 2, 1].map((n) => {
    const count = breakdown[n] ?? 0;
    return { stars: n, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });

  const submit = async () => {
    if (!plateId) { notify('Vui lòng chọn biển số đã mua.'); return; }
    if (!rating) { notify('Vui lòng chọn số sao.'); return; }
    try {
      await createReview.mutateAsync({ plateId, rating, comment: comment.trim() || null });
      setRating(0); setComment('');
      notify('Cảm ơn bạn! Đánh giá đang chờ duyệt.');
    } catch (e) {
      if (e.status === 409) notify('Bạn đã đánh giá biển số này rồi.');
      else if (e.status === 401) notify('Vui lòng đăng nhập để gửi đánh giá.');
      else notify(e.message || 'Lỗi khi gửi đánh giá.');
    }
  };

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Đánh giá từ khách hàng</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chọn biển số đã mua để xem hoặc gửi đánh giá.</p>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360 }}>
        <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Biển số đã mua</span>
        <select value={plateId} onChange={(e) => { setPlateId(e.target.value); setPage(1); }} style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 12px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }}>
          <option value="">Chọn biển số</option>
          {soldPlates.map((p) => <option key={p.id} value={p.id}>{p.plateNumber}</option>)}
        </select>
      </label>

      {plateId && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'center' }}>
            <div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-display-1)', color: 'var(--text-strong)', lineHeight: 1 }}>{avg.toFixed(1)}</span>
              <div style={{ display: 'flex', gap: 2 }}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={16} fill={n <= Math.round(avg) ? 'var(--action-primary)' : 'none'} style={{ color: n <= Math.round(avg) ? 'var(--action-primary)' : 'var(--grey-300)' }} />)}</div>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{total} đánh giá</span>
            </div>
            <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dist.map((d) => (
                <div key={d.stars} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', width: 28 }}>{d.stars}★</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 'var(--radius-xs)', background: 'var(--grey-100)', overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 'var(--radius-xs)', background: 'var(--action-primary)', width: d.pct + '%', transition: 'width 300ms var(--ease-out)' }} /></div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', width: 28, textAlign: 'right' }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {loggedIn ? (
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Gửi đánh giá của bạn</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Số sao:</span>
              <div role="radiogroup" aria-label="Chọn số sao" style={{ display: 'flex' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} onClick={() => setRating(n)} aria-label={`${n} sao`} style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={24} fill={rating >= n ? 'var(--action-primary)' : 'none'} style={{ color: rating >= n ? 'var(--action-primary)' : 'var(--grey-300)' }} /></button>
                ))}
              </div>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Nhận xét</span>
              <textarea rows={3} placeholder="Chia sẻ trải nghiệm của bạn..." value={comment} onChange={(e) => setComment(e.target.value)} style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
            </label>
            <Button variant="primary" size="md" onClick={submit} disabled={createReview.isPending} style={{ alignSelf: 'flex-start' }}>{createReview.isPending ? 'Đang gửi…' : 'Gửi đánh giá'}</Button>
          </div>
          ) : (
          <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', flex: '1 1 200px' }}>Đăng nhập để gửi đánh giá cho biển số bạn đã mua.</span>
            <Button variant="primary" size="md" onClick={() => go('login')()}>Đăng nhập</Button>
          </div>
          )}

          {isLoading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
          ) : !reviews.length ? (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '48px var(--space-6)', textAlign: 'center' }}>
              <ThumbsUp size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Avatar name={r.reviewerName} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{maskName(r.reviewerName)}</span><span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{formatDate(r.createdAt)}</span></div>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', gap: 2 }}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill={n <= r.rating ? 'var(--action-primary)' : 'none'} style={{ color: n <= r.rating ? 'var(--action-primary)' : 'var(--grey-300)' }} />)}</div>
                  </div>
                  {r.comment && <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{r.comment}</p>}
                  {r.adminReply && (
                    <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>Phản hồi từ cửa hàng</span>
                      <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{r.adminReply}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</Button>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Trang {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
