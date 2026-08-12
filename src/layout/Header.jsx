import { useState, useRef, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import Button from '../components/Button.jsx';
import { IconButton, Avatar } from '../components/index.jsx';
import NavBtn, { pill } from '../components/NavBtn.jsx';
import { contentGet } from '../lib/content/index.js';
import * as authApi from '../services/authService.js';
import { useNotifications, useMarkNotificationRead } from '../services/notificationService.js';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function NotificationBell({ go, openPlate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data } = useNotifications({ limit: 5, enabled: true });
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const items = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  const handleClick = (n) => {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    if (n.plateId) openPlate(n.plateId);
    else go('notifications')();
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex' }}>
      <button type="button" aria-label="Thông báo" onClick={() => setOpen((v) => !v)} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-body)', cursor: 'pointer' }}>
        <Bell size={18} />
      </button>
      {unreadCount > 0 && (
        <span style={{ position: 'absolute', top: -3, right: -4, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>
      )}
      {open && (
        <div style={{ position: 'absolute', top: 50, right: 0, width: 320, maxWidth: 'calc(100vw - 32px)', maxHeight: 400, overflowY: 'auto', background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-4)', zIndex: 60, animation: 'modalIn 150ms var(--ease-out)' }}>
          <div style={{ padding: 'var(--space-3) var(--space-4)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Thông báo</div>
          {items.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có thông báo nào.</div>
          ) : (
            items.map((n) => (
              <div key={n.id} onClick={() => handleClick(n)} style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-2)', cursor: 'pointer', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: n.read ? 'transparent' : 'var(--surface-tint-blue)' }}>
                <span style={{ width: 7, height: 7, marginTop: 6, borderRadius: '50%', flexShrink: 0, background: n.read ? 'var(--grey-300)' : 'var(--action-primary)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: n.read ? 'var(--fw-regular)' : 'var(--fw-semibold)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title || (n.type === 'plate_match' ? `Biển ${n.plateNumber || 'mới'} phù hợp tiêu chí` : 'Thông báo')}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{timeAgo(n.createdAt)}</span>
                </div>
              </div>
            ))
          )}
          <button type="button" onClick={() => { setOpen(false); go('notifications')(); }} style={{ width: '100%', padding: 'var(--space-3)', border: 'none', background: 'var(--surface-sunken)', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>Xem tất cả</button>
        </div>
      )}
    </div>
  );
}

export default function Header({ s, go, favCount, user, patch, notify, onMenu, openPlate }) {
  const T = contentGet;
  const nav = [['list', T('common.nav.plates')], ['lucky', T('common.nav.lucky')], ['fav', T('common.nav.fav')], ['blog', T('common.nav.blog')], ['about', T('common.nav.about')]];
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--glass-fill)', backdropFilter: 'var(--glass-blur)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
      <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '14px var(--pad-page)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-6)' }}>
        <button onClick={onMenu} style={{ display: 'none', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', padding: 4 }} className="mobile-menu-btn"><Menu size={24} /></button>
        <div role="button" tabIndex={0} onClick={go('home')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go('home')(); } }} className="pressable" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
          <img src="/assets/logo-mark.png" alt={T('common.brand.name')} style={{ width: 38, height: 38, objectFit: 'contain', display: 'block' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>{T('common.brand.name')}</span>
            <span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{T('common.brand.tagline_header')}</span>
          </div>
        </div>
        <nav className="header-nav-pills" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
          {nav.map(([key, label], i) => (
            <NavBtn key={key} onClick={go(String(key))} {...pill(s === key)}>{label}</NavBtn>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {user && <NotificationBell go={go} openPlate={openPlate} />}
          <div style={{ position: 'relative', display: 'flex' }}>
            <IconButton name="heart" label={T('common.fav.label')} onClick={go('fav')} />
            <span style={{ position: 'absolute', top: -5, right: -6, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{favCount}</span>
          </div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '4px 12px 4px 4px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-muted)' }}>
              <Avatar name={typeof user === 'string' ? user : (user.identifier || user.email || 'U')} size="sm" />
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{typeof user === 'string' ? user : (user.fullName || user.identifier || user.email || 'User')}</span>
              <button type="button" onClick={async () => { await authApi.logout(); patch({ user: null, isAdmin: false }); notify(T('common.auth.logout_done')); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--text-muted)', padding: 0 }}>{T('common.auth.logout')}</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="sm" onClick={go('login')}>{T('common.auth.login')}</Button>
              <Button variant="dark" size="sm" onClick={go('register')}>{T('common.auth.register')}</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
