import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAdminNotificationFeed } from '../services/systemHealth.js';
import { timeAgo } from '../lib/date.js';

// Chuông admin — không có bảng thông báo riêng: feed dựng trực tiếp từ dữ liệu nghiệp vụ (server đã
// lọc theo quyền), "đã xem" = mốc lastSeenAt trong localStorage. Dùng CHUNG key với badge sidebar
// (AdminShell BADGE_NAV) nên xem chuông xong badge sidebar cũng sạch theo — 1 mốc duy nhất.
const LAST_SEEN_KEY = 'bsd_admin_last_seen';

export default function AdminNotificationBell({ go }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const panelRef = useRef(null);
  const bellRef = useRef(null);
  const { data } = useAdminNotificationFeed(20);
  const [lastSeenAt, setLastSeenAt] = useState(() => {
    try { return localStorage.getItem(LAST_SEEN_KEY) || new Date(Date.now() - 86400000).toISOString(); }
    catch { return new Date(Date.now() - 86400000).toISOString(); }
  });

  const items = data?.items || [];
  const unreadCount = items.filter((n) => n.createdAt > lastSeenAt).length;

  const close = () => { setOpen(false); bellRef.current?.focus(); };

  // Panel dùng position:fixed neo theo toạ độ nút chuông — sidebar/drawer admin có overflow:hidden nên
  // panel absolute bị cắt cụt. Toạ độ tính lại mỗi lần mở + khi resize/scroll.
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = bellRef.current?.getBoundingClientRect();
      if (!r) return;
      const width = Math.min(340, window.innerWidth - 32);
      const left = Math.max(16, Math.min(r.right - width, window.innerWidth - width - 16));
      setPos({ top: r.bottom + 8, left, width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      close();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      const root = panelRef.current || ref.current;
      if (!root) return;
      const els = Array.from(root.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!els.length) return;
      const f = els[0];
      const l = els[els.length - 1];
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Click 1 mục = đánh dấu đã xem tới thời điểm hiện tại + nhảy tới trang đối tượng.
  const handleClick = (n) => {
    const now = new Date().toISOString();
    try { localStorage.setItem(LAST_SEEN_KEY, now); } catch { /* Safari private mode — bỏ qua */ }
    setLastSeenAt(now);
    close();
    go(n.target?.screen)();
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex' }}>
      <button ref={bellRef} type="button" aria-label="Thông báo quản trị" aria-haspopup="menu" aria-expanded={open} aria-controls="admin-notif-panel" onClick={() => setOpen((v) => !v)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-body)', cursor: 'pointer', flexShrink: 0 }}>
        <Bell size={17} />
      </button>
      {unreadCount > 0 && (
        <span style={{ position: 'absolute', top: -3, right: -4, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 'var(--radius-pill)', background: 'var(--status-danger)', color: '#fff', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
      {open && pos && (
        <div ref={panelRef} id="admin-notif-panel" role="menu" aria-label="Danh sách thông báo quản trị" style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, maxHeight: 420, overflowY: 'auto', background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-4)', zIndex: 95, animation: 'modalIn 150ms var(--ease-out)' }}>
          <div style={{ padding: 'var(--space-3) var(--space-4)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Thông báo</div>
          {items.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có thông báo nào.</div>
          ) : (
            items.map((n) => {
              const read = n.createdAt <= lastSeenAt;
              return (
                <button key={`${n.kind}-${n.id}`} type="button" role="menuitem" onClick={() => handleClick(n)} style={{ width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-2)', cursor: 'pointer', border: 'none', font: 'inherit', background: read ? 'transparent' : 'var(--surface-tint-blue)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
                  <span style={{ width: 7, height: 7, marginTop: 6, borderRadius: '50%', flexShrink: 0, background: read ? 'var(--grey-300)' : 'var(--action-primary)' }} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                    <span style={{ font: 'var(--type-body-sm)', fontWeight: read ? 'var(--fw-regular)' : 'var(--fw-semibold)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</span>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.subtitle}</span>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
