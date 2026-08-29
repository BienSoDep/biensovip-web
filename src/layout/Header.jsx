import { useState, useRef, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import Button from '../components/Button.jsx';
import { IconButton, Avatar } from '../components/index.jsx';
import NavBtn, { pill } from '../components/NavBtn.jsx';
import { contentGet } from '../lib/content/index.js';
import { useNotifications, useMarkNotificationRead } from '../services/notificationService.js';
import { useCompareIds } from '../services/compareService.js';
import { timeAgo } from '../lib/date.js';

function NotificationBell({ go, openPlate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const bellRef = useRef(null);
  const { data } = useNotifications({ limit: 5, enabled: true });
  const markRead = useMarkNotificationRead();

  const close = () => { setOpen(false); bellRef.current?.focus(); };

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab' || !ref.current) return;
      const els = Array.from(ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!els.length) return;
      const f = els[0];
      const l = els[els.length - 1];
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

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
      <button ref={bellRef} type="button" aria-label="Thông báo" aria-haspopup="menu" aria-expanded={open} aria-controls="notif-panel" onClick={() => setOpen((v) => !v)} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-body)', cursor: 'pointer' }}>
        <Bell size={18} />
      </button>
      {unreadCount > 0 && (
        <span style={{ position: 'absolute', top: -3, right: -4, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>
      )}
      {open && (
        <div id="notif-panel" role="menu" aria-label="Danh sách thông báo" style={{ position: 'absolute', top: 50, right: 0, width: 320, maxWidth: 'calc(100vw - 32px)', maxHeight: 400, overflowY: 'auto', background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-4)', zIndex: 'var(--z-popover)', animation: 'modalIn 150ms var(--ease-out)' }}>
          <div style={{ padding: 'var(--space-3) var(--space-4)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Thông báo</div>
          {items.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có thông báo nào.</div>
          ) : (
            items.map((n) => (
              <button key={n.id} type="button" role="menuitem" onClick={() => handleClick(n)} style={{ width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-2)', cursor: 'pointer', border: 'none', font: 'inherit', background: n.read ? 'transparent' : 'var(--surface-tint-blue)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
                <span style={{ width: 7, height: 7, marginTop: 6, borderRadius: '50%', flexShrink: 0, background: n.read ? 'var(--grey-300)' : 'var(--action-primary)' }} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: n.read ? 'var(--fw-regular)' : 'var(--fw-semibold)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title || (n.type === 'plate_match' ? `Biển ${n.plateNumber || 'mới'} phù hợp tiêu chí` : 'Thông báo')}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{timeAgo(n.createdAt)}</span>
                </span>
              </button>
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
  const { ids: compareIds } = useCompareIds();
  const compareCount = compareIds.length;
  const nav = [['list', T('common.nav.plates')], ['lucky', T('common.nav.lucky')], ['compare', T('common.nav.compare')], ['blog', T('common.nav.blog')], ['about', T('common.nav.about')], ['chat', T('common.nav.contact')], ['collab', T('common.nav.collab')]];
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 'var(--z-header)', background: 'var(--glass-fill)', backdropFilter: 'var(--glass-blur)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
      <div className="header-row" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '14px var(--pad-page)', display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button onClick={onMenu} style={{ display: 'none', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', padding: 4 }} className="mobile-menu-btn"><Menu size={24} /></button>
        <a href="/" onClick={(e) => { e.preventDefault(); go('home')(); }} className="pressable" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', flexShrink: 0 }}>
          <img src="/assets/logo-mark.png" alt="" style={{ width: 38, height: 38, objectFit: 'contain', display: 'block' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>{T('common.brand.name')}</span>
            <span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{T('common.brand.tagline_header')}</span>
          </div>
        </a>
        <nav className="header-nav-pills" style={{ display: 'flex', flex: '1 1 auto', flexWrap: 'nowrap', alignItems: 'center', gap: 'var(--space-2)', overflowX: 'auto', scrollbarWidth: 'none', minWidth: 0 }}>
          {nav.map(([key, label], i) => (
            <NavBtn key={key} onClick={go(String(key))} aria-current={s === key ? 'page' : undefined} {...pill(s === key)}>
              {label}
              {key === 'compare' && compareCount > 0 && (
                <span style={{ padding: '0 6px', height: 18, minWidth: 18, borderRadius: 'var(--radius-pill)', background: s === key ? 'var(--white)' : 'var(--action-primary)', color: s === key ? 'var(--action-primary)' : 'var(--white)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{compareCount}</span>
              )}
            </NavBtn>
          ))}
        </nav>
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
          {user && <NotificationBell go={go} openPlate={openPlate} />}
          <div style={{ position: 'relative', display: 'flex' }}>
            <IconButton name="heart" label={T('common.fav.label')} onClick={go('fav')} />
            {favCount > 0 && (<span style={{ position: 'absolute', top: -5, right: -6, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{favCount}</span>)}
          </div>
          {user ? (
            <button type="button" onClick={go('profile')} aria-label={typeof user === 'string' ? user : (user.fullName || user.identifier || user.email || 'User')} title={typeof user === 'string' ? user : (user.fullName || user.identifier || user.email || 'User')} style={{ display: 'flex', alignItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              <Avatar name={typeof user === 'string' ? user : (user.identifier || user.email || 'U')} size="sm" />
            </button>
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
