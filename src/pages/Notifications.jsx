import { useState } from 'react';
import Button from '../components/Button.jsx';
import { useNotifications, useMarkNotificationRead, useMarkNotificationClicked } from '../services/notificationService.js';
import { timeAgo } from '../lib/date.js';

const PER_PAGE = 20;

// Broadcast content có thể là HTML (soạn bằng rich text editor) — hiện dạng tóm tắt thuần text ở đây.
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function Notifications({ go, notify }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useNotifications({ page, limit: PER_PAGE });
  const markRead = useMarkNotificationRead();
  const markClicked = useMarkNotificationClicked();

  const handleClick = (n) => {
    if (!n.read) markRead.mutate(n.id);
    markClicked.mutate(n.id); // T10: đo CTR theo loại thông báo
    if (n.plateId && go) go('detail', n.plateId)?.();
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const unreadCount = data?.unreadCount || 0;

  return (
    <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Thông báo</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{unreadCount ? `${unreadCount} thông báo chưa đọc.` : 'Bạn đã đọc hết thông báo.'}</p>
      </div>

      {isLoading ? (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '72px var(--space-6)', textAlign: 'center' }}>
          <span style={{ font: 'var(--type-body)', color: 'var(--text-muted)' }}>Đang tải thông báo...</span>
        </div>
      ) : isError ? (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '72px var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--status-danger)' }}>Không tải được thông báo</span>
          <Button variant="outline" size="md" onClick={() => refetch()}>Thử lại</Button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '72px var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có thông báo nào</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 380 }}>Tin về biển số mới, giá và khuyến mãi sẽ xuất hiện ở đây.</span>
          <Button variant="primary" size="md" onClick={go('list')}>Khám phá kho biển số</Button>
        </div>
      ) : (
        <>
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
            {items.map((n) => (
              <div key={n.id} onClick={() => handleClick(n)} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(n); } }}
                style={{ padding: 'var(--space-4) var(--gutter-card)', display: 'flex', gap: 'var(--space-3)', cursor: 'pointer', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: n.read ? 'var(--white)' : 'var(--surface-tint-blue)', transition: 'background 120ms' }}>
                <span style={{ width: 8, height: 8, marginTop: 6, borderRadius: '50%', flexShrink: 0, background: n.read ? 'var(--grey-300)' : 'var(--action-primary)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: n.read ? 'var(--fw-regular)' : 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                    {n.title || (n.type === 'plate_match' ? `Biển ${n.plateNumber || 'mới'} phù hợp tiêu chí của bạn` : 'Thông báo')}
                  </span>
                  {n.content && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{stripHtml(n.content)}</span>}
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{timeAgo(n.createdAt, { capDays: 30 })}</span>
                </div>
              </div>
            ))}
          </div>
          {total > PER_PAGE && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</Button>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Trang {page} / {Math.ceil(total / PER_PAGE)}</span>
              <Button variant="outline" size="sm" disabled={page * PER_PAGE >= total} onClick={() => setPage((p) => p + 1)}>Sau</Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
