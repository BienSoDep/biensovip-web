import { useState } from 'react';
import {
  Bell, Check, CheckCheck, Sparkles, Flame, TrendingDown,
  Compass, Car, FileText, Tag, Star, Megaphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/Button.jsx';
import { PageHeader } from '../components/index.jsx';
import { useNotifications, useMarkNotificationRead, useMarkNotificationClicked } from '../services/notificationService.js';
import { timeAgo } from '../lib/date.js';

const PER_PAGE = 20;

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getNotificationMeta(type) {
  switch (type) {
    case 'ai_pick':
      return { Icon: Sparkles, color: '#D97706', bg: '#FEF3C7', label: 'Gợi ý AI' };
    case 'plate_match':
      return { Icon: Car, color: '#EA580C', bg: '#FFF7ED', label: 'Khớp biển số' };
    case 'price_drop':
      return { Icon: TrendingDown, color: '#D97706', bg: '#FEF3C7', label: 'Giảm giá' };
    case 'hot_alert':
      return { Icon: Flame, color: '#EA580C', bg: '#FFF7ED', label: 'Biển số Hot' };
    case 'fengshui_match':
      return { Icon: Compass, color: '#D97706', bg: '#FFF7ED', label: 'Hợp mệnh' };
    case 'contact_status':
      return { Icon: FileText, color: '#D97706', bg: '#FEF3C7', label: 'Yêu cầu liên hệ' };
    case 'plate_sold':
      return { Icon: Tag, color: '#64748B', bg: '#F1F5F9', label: 'Đã bán' };
    case 'new_review':
    case 'review_approved':
      return { Icon: Star, color: '#D97706', bg: '#FEF3C7', label: 'Đánh giá' };
    case 'broadcast':
      return { Icon: Megaphone, color: '#EA580C', bg: '#FFEDD5', label: 'Thông báo chung' };
    default:
      return { Icon: Bell, color: '#D97706', bg: '#FEF3C7', label: 'Thông báo' };
  }
}

export default function Notifications({ go, notify, openPost }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useNotifications({ page, limit: PER_PAGE });
  const markRead = useMarkNotificationRead();
  const markClicked = useMarkNotificationClicked();

  const handleClick = (n) => {
    if (!n.read) markRead.mutate(n.id);
    markClicked.mutate(n.id);
    if (n.plateId && go) go('detail', n.plateId)?.();
    else if (n.targetScreen === 'post' && n.targetAnchor) openPost?.(n.targetAnchor);
    else if (n.targetScreen && go) go(n.targetScreen)?.();
  };

  const handleMarkAllRead = () => {
    const unreadItems = (data?.items || []).filter((x) => !x.read);
    if (!unreadItems.length) return;
    unreadItems.forEach((x) => markRead.mutate(x.id));
    toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const unreadCount = data?.unreadCount || 0;

  return (
    <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <PageHeader
          eyebrow="Hộp thư hệ thống"
          title="Thông báo"
          subtitle={unreadCount ? `${unreadCount} thông báo chưa đọc.` : 'Bạn đã đọc hết tất cả thông báo.'}
        />
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <CheckCheck size={16} /> Đánh dấu tất cả đã đọc
          </Button>
        )}
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
            {items.map((n) => {
              const meta = getNotificationMeta(n.type);
              const IconComponent = meta.Icon;
              const isUnread = !n.read;
              const cleanContent = stripHtml(n.content);

              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClick(n);
                    }
                  }}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-3)',
                    cursor: 'pointer',
                    boxShadow: 'inset 0 -1px 0 var(--grey-100)',
                    background: isUnread ? '#FFFBF5' : 'var(--white)',
                    transition: 'background 120ms',
                    position: 'relative',
                  }}
                >
                  {/* Unread indicator */}
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      marginTop: 14,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: isUnread ? '#F19720' : 'transparent',
                    }}
                  />

                  {/* Icon badge */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: meta.bg,
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <IconComponent size={20} />
                  </div>

                  {/* Body */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 14.5,
                          fontWeight: isUnread ? 700 : 600,
                          color: 'var(--ink-900)',
                          lineHeight: 1.4,
                        }}
                      >
                        {n.title || (n.type === 'plate_match' ? `Biển ${n.plateNumber || 'mới'} phù hợp tiêu chí của bạn` : 'Thông báo')}
                      </span>

                      {n.plateNumber && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            letterSpacing: 0.5,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            color: '#0F172A',
                            flexShrink: 0,
                          }}
                        >
                          {n.plateNumber}
                        </span>
                      )}
                    </div>

                    {cleanContent && (
                      <span
                        style={{
                          fontSize: 13.5,
                          color: isUnread ? '#334155' : 'var(--text-muted)',
                          lineHeight: 1.5,
                        }}
                      >
                        {cleanContent}
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
                        {timeAgo(n.createdAt, { capDays: 30 })}
                      </span>

                      {isUnread && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#B45309',
                            background: '#FEF3C7',
                            padding: '2px 8px',
                            borderRadius: 999,
                          }}
                        >
                          Mới
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
