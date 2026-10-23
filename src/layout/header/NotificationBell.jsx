import { useState, useRef, useEffect } from 'react';
import {
  Bell, Check, CheckCheck, Sparkles, Flame, TrendingDown,
  Compass, Car, FileText, Tag, Star, Megaphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotifications, useMarkNotificationRead, usePublicBroadcasts } from '../../services/notificationService.js';
import { timeAgo } from '../../lib/date.js';

const LAST_SEEN_BROADCAST_KEY = 'biensovip_last_seen_broadcast';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getNotificationMeta(type) {
  switch (type) {
    case 'ai_pick':
      return { Icon: Sparkles, color: '#D97706', bg: '#FEF3C7', label: 'Gợi ý AI' };
    case 'plate_match':
      return { Icon: Car, color: '#2563EB', bg: '#DBEAFE', label: 'Khớp biển số' };
    case 'price_drop':
      return { Icon: TrendingDown, color: '#059669', bg: '#D1FAE5', label: 'Giảm giá' };
    case 'hot_alert':
      return { Icon: Flame, color: '#DC2626', bg: '#FEE2E2', label: 'Biển số Hot' };
    case 'fengshui_match':
      return { Icon: Compass, color: '#7C3AED', bg: '#EDE9FE', label: 'Hợp mệnh' };
    case 'contact_status':
      return { Icon: FileText, color: '#0284C7', bg: '#E0F2FE', label: 'Yêu cầu liên hệ' };
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

export function NotificationBell({ go, openPlate, openPost, user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const bellRef = useRef(null);
  const { data } = useNotifications({ limit: 10, enabled: !!user, refetchInterval: 60000 });
  const { data: publicData } = usePublicBroadcasts(10);
  const markRead = useMarkNotificationRead();
  const [lastSeen, setLastSeen] = useState(() => {
    try {
      return localStorage.getItem(LAST_SEEN_BROADCAST_KEY);
    } catch {
      return null;
    }
  });

  const close = () => {
    setOpen(false);
    bellRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const els = Array.from(
        ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!els.length) return;
      const f = els[0];
      const l = els[els.length - 1];
      if (e.shiftKey && document.activeElement === f) {
        e.preventDefault();
        l.focus();
      } else if (!e.shiftKey && document.activeElement === l) {
        e.preventDefault();
        f.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const broadcastItems = (publicData?.items || []).map((b) => ({
    id: b.id,
    title: b.title,
    content: b.content,
    createdAt: b.createdAt,
    read: lastSeen === b.id,
    type: 'broadcast',
  }));

  const items = user ? data?.items || [] : broadcastItems;
  const unreadCount = user ? data?.unreadCount || 0 : broadcastItems.filter((b) => !b.read).length;

  const handleToggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next && !user && broadcastItems.length > 0) {
        const newestId = broadcastItems[0].id;
        try {
          localStorage.setItem(LAST_SEEN_BROADCAST_KEY, newestId);
        } catch {
          /* ignore */
        }
        setLastSeen(newestId);
      }
      return next;
    });
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    if (!user) return;
    const unreadItems = items.filter((x) => !x.read);
    if (!unreadItems.length) return;

    unreadItems.forEach((x) => markRead.mutate(x.id));
    toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
  };

  const handleMarkSingleRead = (e, notifId) => {
    e.stopPropagation();
    if (!user) return;
    markRead.mutate(notifId);
  };

  const handleClick = (n) => {
    if (!user) {
      setOpen(false);
      return;
    }
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    if (n.plateId) openPlate(n.plateId);
    else if (n.targetScreen === 'post' && n.targetAnchor) openPost(n.targetAnchor);
    else if (n.targetScreen) go(n.targetScreen)();
    else go('notifications')();
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
      <button
        ref={bellRef}
        type="button"
        aria-label="Thông báo"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="notif-panel"
        onClick={handleToggle}
        style={{
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-hairline)',
          background: open ? 'var(--brand-50)' : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: open ? 'var(--brand-700)' : 'var(--text-body)',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 120ms ease',
        }}
      >
        <Bell size={18} />
      </button>

      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 19,
            height: 19,
            padding: '0 5px',
            borderRadius: 'var(--radius-pill)',
            background: 'linear-gradient(135deg, #F19720 0%, #D97706 100%)',
            color: '#FFFFFF',
            font: 'var(--type-caption)',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(241, 151, 32, 0.4)',
            border: '2px solid #FFFFFF',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {open && (
        <div
          id="notif-panel"
          role="menu"
          aria-label="Danh sách thông báo"
          style={{
            position: 'absolute',
            top: 46,
            right: 0,
            width: 380,
            maxWidth: 'calc(100vw - 24px)',
            maxHeight: 520,
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 16px 40px rgba(14, 15, 18, 0.14), 0 2px 8px rgba(14, 15, 18, 0.06)',
            border: '1px solid rgba(228, 230, 236, 0.9)',
            zIndex: 'var(--z-popover)',
            animation: 'modalIn 150ms var(--ease-out)',
            overflow: 'hidden',
          }}
        >
          {/* Header Panel */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#FEF3C7',
                    color: '#B45309',
                  }}
                >
                  {unreadCount} mới
                </span>
              )}
            </div>

            {user && unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--brand-700)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 6px',
                  borderRadius: 6,
                  transition: 'background 120ms',
                }}
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck size={14} /> Đã đọc tất cả
              </button>
            )}
          </div>

          {/* Body items list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '6px 0',
              scrollbarWidth: 'thin',
            }}
          >
            {items.length === 0 ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  <Bell size={20} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)' }}>
                  Chưa có thông báo nào
                </span>
                <span style={{ fontSize: 12, color: 'var(--grey-500)', maxWidth: 260 }}>
                  Thông báo về gợi ý biển số, ưu đãi và tiến trình giao dịch sẽ xuất hiện ở đây.
                </span>
              </div>
            ) : (
              items.map((n) => {
                const meta = getNotificationMeta(n.type);
                const IconComponent = meta.Icon;
                const isUnread = !n.read;
                const cleanContent = stripHtml(n.content);

                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleClick(n)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick(n);
                      }
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      cursor: 'pointer',
                      border: 'none',
                      background: isUnread ? '#FFFBF5' : '#FFFFFF',
                      borderBottom: '1px solid #F8FAFC',
                      transition: 'background 120ms ease',
                      position: 'relative',
                    }}
                  >
                    {/* Unread dot indicator */}
                    <span
                      style={{
                        position: 'absolute',
                        left: 6,
                        top: 22,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: isUnread ? '#F19720' : 'transparent',
                      }}
                    />

                    {/* Icon đại diện cho loại thông báo */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: meta.bg,
                        color: meta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <IconComponent size={18} />
                    </div>

                    {/* Khung nội dung đầy đủ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 13.5,
                            fontWeight: isUnread ? 700 : 600,
                            color: 'var(--ink-900)',
                            lineHeight: 1.4,
                          }}
                        >
                          {n.title || (n.type === 'plate_match' ? `Biển ${n.plateNumber || 'mới'} phù hợp tiêu chí` : 'Thông báo')}
                        </span>

                        {n.plateNumber && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              letterSpacing: 0.5,
                              padding: '2px 6px',
                              borderRadius: 4,
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

                      {/* NỘI DUNG CHI TIẾT - Hiển thị đầy đủ thông tin */}
                      {cleanContent && (
                        <div
                          style={{
                            fontSize: 12.5,
                            color: isUnread ? '#334155' : '#64748B',
                            lineHeight: 1.48,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {cleanContent}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>
                          {timeAgo(n.createdAt)}
                        </span>

                        {user && isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkSingleRead(e, n.id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#059669',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              padding: '2px 4px',
                            }}
                            title="Đánh dấu đã đọc"
                          >
                            <Check size={12} /> Đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Panel */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid #F1F5F9',
              background: '#FAF9F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  go('notifications')();
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(241, 151, 32, 0.3)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--brand-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 120ms',
                }}
              >
                Xem tất cả thông báo
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  go('login')();
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(241, 151, 32, 0.3)',
                  background: 'var(--brand-50)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--brand-700)',
                  textAlign: 'center',
                }}
              >
                Đăng nhập để nhận thông báo riêng
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
