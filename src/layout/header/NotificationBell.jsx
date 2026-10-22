import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications, useMarkNotificationRead, usePublicBroadcasts } from '../../services/notificationService.js';
import { timeAgo } from '../../lib/date.js';

const LAST_SEEN_BROADCAST_KEY = 'biensovip_last_seen_broadcast';

export function NotificationBell({ go, openPlate, openPost, user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const bellRef = useRef(null);
  const { data } = useNotifications({ limit: 5, enabled: !!user, refetchInterval: 60000 });
  const { data: publicData } = usePublicBroadcasts(5);
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
          /* Safari private mode — bỏ qua */
        }
        setLastSeen(newestId);
      }
      return next;
    });
  };

  const handleClick = (n) => {
    // Guest không có trang /thong-bao-moi (cần login) — nội dung broadcast đã đủ ngay trong panel này.
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
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          background: 'var(--surface-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-body)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <Bell size={18} />
      </button>
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -3,
            right: -4,
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--action-primary)',
            color: 'var(--white)',
            font: 'var(--type-caption)',
            fontSize: 'var(--fs-micro)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {unreadCount}
        </span>
      )}
      {open && (
        <div
          id="notif-panel"
          role="menu"
          aria-label="Danh sách thông báo"
          style={{
            position: 'absolute',
            top: 50,
            right: 0,
            width: 320,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 400,
            overflowY: 'auto',
            background: 'var(--white)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-4)',
            zIndex: 'var(--z-popover)',
            animation: 'modalIn 150ms var(--ease-out)',
          }}
        >
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
              font: 'var(--type-title-3)',
              color: 'var(--text-strong)',
            }}
          >
            Thông báo
          </div>
          {items.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-6)',
                textAlign: 'center',
                font: 'var(--type-body-sm)',
                color: 'var(--text-muted)',
              }}
            >
              Chưa có thông báo nào.
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                role="menuitem"
                onClick={() => handleClick(n)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  gap: 'var(--space-2)',
                  cursor: 'pointer',
                  border: 'none',
                  font: 'inherit',
                  background: n.read ? 'transparent' : 'var(--surface-tint-blue)',
                  boxShadow: 'inset 0 -1px 0 var(--grey-100)',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    marginTop: 6,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: n.read ? 'var(--grey-300)' : 'var(--action-primary)',
                  }}
                />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      font: 'var(--type-body-sm)',
                      fontWeight: n.read ? 'var(--fw-regular)' : 'var(--fw-semibold)',
                      color: 'var(--text-strong)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {n.title ||
                      (n.type === 'plate_match'
                        ? `Biển ${n.plateNumber || 'mới'} phù hợp tiêu chí`
                        : n.type === 'broadcast'
                        ? 'Thông báo mới'
                        : 'Thông báo')}
                  </span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </span>
              </button>
            ))
          )}
          {user ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                go('notifications')();
              }}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: 'none',
                background: 'var(--surface-sunken)',
                cursor: 'pointer',
                font: 'var(--type-caption)',
                color: 'var(--action-primary)',
                fontWeight: 'var(--fw-semibold)',
              }}
            >
              Xem tất cả
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
                padding: 'var(--space-3)',
                border: 'none',
                background: 'var(--surface-sunken)',
                cursor: 'pointer',
                font: 'var(--type-caption)',
                color: 'var(--action-primary)',
                fontWeight: 'var(--fw-semibold)',
              }}
            >
              Đăng nhập để nhận thông báo riêng
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
