import { useState, useMemo } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebouncedValue } from '@mantine/hooks';
import Button from '../../components/Button.jsx';
import { Select, TableColumnMenu, TableSortHeader, useTableColumns, sortTableItems } from '../../components/index.jsx';
import { useAdminReviews, useUpdateReviewStatus, useReplyReview } from '../../services/adminReviewService.js';
import { formatDate, formatDateTime } from '../../lib/date.js';

const REVIEW_COLUMNS = [
  { key: 'reviewer', label: 'Khách hàng', default: true },
  { key: 'plate', label: 'Biển số & Trạng thái', default: true },
  { key: 'rating', label: 'Đánh giá sao', default: true },
  { key: 'comment', label: 'Nội dung nhận xét', default: true },
  { key: 'status', label: 'Trạng thái duyệt', default: true },
  { key: 'createdAt', label: 'Thời gian gửi', default: true },
  { key: 'actions', label: 'Thao tác', default: true, lock: true },
];

const STAR_FILTER_OPTS = [
  { value: 'all', label: 'Mọi mức sao' },
  { value: '5', label: '5 sao (★★★★★)' },
  { value: '4', label: '4 sao (★★★★)' },
  { value: '3', label: '3 sao (★★★)' },
  { value: '2', label: '2 sao (★★)' },
  { value: '1', label: '1 sao (★)' },
];

const STATUS_OPTS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Đã từ chối' },
  { value: '', label: 'Tất cả trạng thái' },
];

export default function AdminReviews({ notify }) {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [starFilter, setStarFilter] = useState('all');
  const [plateFilter, setPlateFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
  const [q] = useDebouncedValue(keyword, 300);
  const [pendingId, setPendingId] = useState(null);

  const { isVisible, colMenuProps } = useTableColumns({
    storageKey: 'bsv.admin.reviewsCols',
    columns: REVIEW_COLUMNS,
  });

  const { data, isLoading, isError, refetch } = useAdminReviews(status, page, 20, undefined, q || undefined);
  const updateStatus = useUpdateReviewStatus();
  const replyReview = useReplyReview();

  const filteredAndSortedItems = useMemo(() => {
    let res = rawItems;
    if (plateFilter !== 'all') {
      res = res.filter((r) => r.plateStatus === plateFilter);
    }
    if (starFilter !== 'all') {
      const numStars = Number(starFilter);
      res = res.filter((r) => r.rating === numStars);
    }
    return sortTableItems(res, sort.key, sort.dir, {
      reviewer: (r) => r.reviewerName || '',
      plate: (r) => r.plateNumber || '',
      rating: (r) => r.rating || 0,
      status: (r) => r.status || '',
      createdAt: (r) => (r.createdAt ? new Date(r.createdAt).getTime() : 0),
    });
  }, [rawItems, plateFilter, starFilter, sort]);

  const items = filteredAndSortedItems;
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
      {/* Filter bar: Status pills, Plate type, Star filter, search, Column Toggle */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'pending', label: 'Chờ duyệt' },
            { key: 'approved', label: 'Đã duyệt' },
            { key: 'rejected', label: 'Đã từ chối' },
            { key: '', label: 'Tất cả trạng thái' },
          ].map((tab) => {
            const isActive = status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setStatus(tab.key); setPage(1); }}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                  border: isActive ? '1px solid var(--action-primary)' : '1px solid var(--border-hairline)',
                  background: isActive ? 'var(--action-primary)' : 'var(--white)',
                  color: isActive ? 'var(--white)' : 'var(--text-body)',
                  font: 'var(--type-body-sm)', fontWeight: isActive ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  cursor: 'pointer', transition: 'all 120ms ease-out',
                  boxShadow: isActive ? '0 1px 4px rgba(217,119,6,.25)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}

          <span style={{ width: 1, height: 20, background: 'var(--border-hairline)', margin: '0 4px' }} />

          {/* Lọc theo loại biển */}
          {[
            { key: 'all', label: 'Mọi biển' },
            { key: 'available', label: 'Đang bán' },
            { key: 'sold', label: 'Đã bán' },
          ].map((pf) => {
            const isPfActive = plateFilter === pf.key;
            return (
              <button
                key={pf.key}
                type="button"
                onClick={() => setPlateFilter(pf.key)}
                style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                  border: isPfActive ? '1px solid var(--text-strong)' : '1px solid var(--border-hairline)',
                  background: isPfActive ? 'var(--surface-sunken)' : 'transparent',
                  color: isPfActive ? 'var(--text-strong)' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: isPfActive ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  cursor: 'pointer', transition: 'all 100ms ease-out',
                }}
              >
                {pf.label}
              </button>
            );
          })}

          <span style={{ width: 1, height: 20, background: 'var(--border-hairline)', margin: '0 4px' }} />

          {/* Lọc theo số sao */}
          <div style={{ width: 150 }}>
            <Select
              size="sm"
              value={starFilter}
              onChange={(val) => setStarFilter(val || 'all')}
              options={STAR_FILTER_OPTS}
              placeholder="Lọc số sao"
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="Tìm theo biển số / tên khách / nội dung…"
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', font: 'var(--type-body-sm)', color: 'var(--text-body)', background: 'var(--white)', minWidth: 240 }}
          />
          <TableColumnMenu {...colMenuProps} />
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{total} đánh giá/bình luận</span>
        </div>
      </div>

      {/* Header Sort Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        background: 'var(--surface-sunken)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border-hairline)',
        font: 'var(--type-caption)',
        fontWeight: 'var(--fw-bold)',
        letterSpacing: '.05em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        gap: 'var(--space-3)',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'none', fontWeight: 600 }}>Sắp xếp theo:</span>
        {isVisible('createdAt') && (
          <TableSortHeader label="Thời gian" sortKey="createdAt" currentSort={sort} onSort={(key, dir) => setSort({ key, dir })} />
        )}
        {isVisible('rating') && (
          <TableSortHeader label="Số sao" sortKey="rating" currentSort={sort} onSort={(key, dir) => setSort({ key, dir })} />
        )}
        {isVisible('reviewer') && (
          <TableSortHeader label="Khách hàng" sortKey="reviewer" currentSort={sort} onSort={(key, dir) => setSort({ key, dir })} />
        )}
        {isVisible('plate') && (
          <TableSortHeader label="Biển số" sortKey="plate" currentSort={sort} onSort={(key, dir) => setSort({ key, dir })} />
        )}
        {isVisible('status') && (
          <TableSortHeader label="Trạng thái" sortKey="status" currentSort={sort} onSort={(key, dir) => setSort({ key, dir })} />
        )}
      </div>

      {isLoading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
      ) : isError ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span>Lỗi tải dữ liệu</span>
          <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <span>{status === 'pending' ? 'Hiện không có đánh giá/bình luận nào đang chờ duyệt.' : 'Không có bản ghi nào ở bộ lọc này.'}</span>
          {(status !== '' || plateFilter !== 'all' || starFilter !== 'all') && (
            <Button variant="outline" size="sm" onClick={() => { setStatus(''); setPlateFilter('all'); setStarFilter('all'); setPage(1); }}>
              Xem tất cả
            </Button>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          {items.map((r) => (
            <div key={r.id} style={{ padding: 'var(--space-4) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
                {isVisible('reviewer') && (
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{r.reviewerName}</span>
                )}
                {isVisible('plate') && (
                  <>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)',
                      background: 'rgba(217,119,6,.1)', color: 'var(--action-primary)'
                    }}>{r.plateNumber || '—'}</span>

                    {/* Badge trạng thái biển số: Đang bán hay Đã bán */}
                    {r.plateStatus && (
                      <span style={{
                        fontSize: 11, fontWeight: 'var(--fw-bold)', padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                        background: r.plateStatus === 'available' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                        color: r.plateStatus === 'available' ? '#059669' : '#4B5563',
                      }}>
                        {r.plateStatus === 'available' ? 'Đang bán' : 'Đã bán'}
                      </span>
                    )}
                  </>
                )}

                {isVisible('rating') && (
                  <div role="img" aria-label={`${r.rating}/5 sao`} style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        fill={n <= r.rating ? 'var(--action-primary)' : 'none'}
                        style={{ color: n <= r.rating ? 'var(--action-primary)' : 'var(--grey-300)' }}
                        aria-hidden
                      />
                    ))}
                  </div>
                )}
                
                {/* Badge trạng thái duyệt */}
                {isVisible('status') && (
                  <span style={{
                    fontSize: 11, fontWeight: 'var(--fw-bold)', padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                    background: r.status === 'pending' ? 'var(--amber-100)' : r.status === 'approved' ? 'var(--green-100)' : 'var(--grey-100)',
                    color: r.status === 'pending' ? 'var(--status-warning-ink)' : r.status === 'approved' ? 'var(--status-success-ink)' : 'var(--text-muted)',
                  }}>
                    {r.status === 'pending' ? 'Chờ duyệt' : r.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                  </span>
                )}

                <div style={{ flex: 1 }} />
                {isVisible('createdAt') && (
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{formatDate(r.createdAt)}</span>
                )}
              </div>

              {isVisible('comment') && r.comment && <ReviewComment text={r.comment} />}

              {/* Action buttons theo trạng thái của từng bản ghi */}
              {isVisible('actions') && (
                <>
                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
                      <Button variant="primary" size="sm" disabled={pendingId === r.id} onClick={() => act(r.id, 'approved')} title="Duyệt và hiển thị đánh giá này">{pendingId === r.id ? 'Đang…' : 'Duyệt'}</Button>
                      <Button variant="ghost" size="sm" disabled={pendingId === r.id} onClick={() => act(r.id, 'rejected')} title="Từ chối đánh giá này">Từ chối</Button>
                    </div>
                  )}
                  {r.status === 'approved' && <ReplyBlock review={r} replyReview={replyReview} notify={notify} />}
                  {r.status === 'rejected' && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
                      <Button variant="outline" size="sm" disabled={pendingId === r.id} onClick={() => act(r.id, 'approved')} title="Duyệt lại đánh giá đã từ chối">Duyệt lại</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            style={{ minWidth: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page <= 1 ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page <= 1 ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }} aria-label="Trang trước"><ChevronLeft size={16} /></button>
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
            style={{ minWidth: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page >= totalPages ? 'var(--text-faint)' : 'var(--text-body)', font: 'var(--type-body-sm)', cursor: page >= totalPages ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }} aria-label="Trang sau"><ChevronRight size={16} /></button>
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
