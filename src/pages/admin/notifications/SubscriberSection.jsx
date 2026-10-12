import { useState } from 'react';
import { Input } from '../../../components/index.jsx';
import ConfirmModal from '../../../components/ConfirmModal.jsx';
import { useAdminSubscribers, useSubscriberActiveCount, useRemoveSubscriber, useAdminBlasts } from '../../../services/subscribers.js';
import { formatDate } from '../../../lib/date.js';

export default function SubscriberSection({ notify }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const PER = 15;
  const { data, isLoading, isError, refetch } = useAdminSubscribers({ q, page, perPage: PER });
  const count = useSubscriberActiveCount();
  const remove = useRemoveSubscriber();
  const blasts = useAdminBlasts({ page: 1, perPage: 10 });

  const items = data?.items || [];
  const total = data?.total || 0;
  const doRemove = async () => {
    if (!confirmTarget) return;
    try { await remove.mutateAsync(confirmTarget.id); notify('Đã hủy đăng ký'); }
    catch (e) { notify(e.message || 'Lỗi'); }
    finally { setConfirmTarget(null); }
  };

  return (
    <div style={{ flex: '1 1 100%', minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 420px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ flex: 1, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Email đăng ký nhận tin</span>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{count.data?.count ?? '–'} đang hoạt động</span>
          <Input label="" placeholder="Tìm email / tên" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        {isLoading ? (
          <div style={{ padding: '40px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
        ) : isError ? (
          <div style={{ padding: '40px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>
            Lỗi tải danh sách email.{' '}
            <button type="button" onClick={() => refetch()} style={{ color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Thử lại</button>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '40px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có email nào đăng ký.</div>
        ) : (
          items.map((s) => (
            <div key={s.id} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                  {s.source} · {formatDate(s.createdAt)}{s.unsubscribedAt ? ' · đã hủy' : ''}
                </div>
              </div>
              <button type="button" onClick={() => setConfirmTarget({ id: s.id, email: s.email })} disabled={remove.isPending}
                style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Hủy</button>
            </div>
          ))
        )}
        {total > PER && (
          <div style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Trước</button>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{page} / {Math.ceil(total / PER)}</span>
            <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page * PER >= total} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Sau</button>
          </div>
        )}
      </div>

      <div style={{ flex: '1 1 360px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Đợt gửi tới subscriber</span>
        </div>
        {blasts.isLoading ? (
          <div style={{ padding: '40px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
        ) : (blasts.data?.items || []).length === 0 ? (
          <div style={{ padding: '40px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa gửi đợt nào tới subscriber.</div>
        ) : (
          (blasts.data?.items || []).map((b) => (
            <div key={b.id} style={{ padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{b.title}</div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{b.sentCount}/{b.totalCount} đã gửi · {formatDate(b.createdAt)}</div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title="Hủy đăng ký"
        message={`Hủy đăng ký nhận tin của ${confirmTarget?.email}?`}
        confirmLabel="Hủy đăng ký"
        danger
        loading={remove.isPending}
        onConfirm={doRemove}
      />
    </div>
  );
}
