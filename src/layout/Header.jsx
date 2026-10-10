import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, GitCompareArrows, ChevronDown, Compass, Sparkles } from 'lucide-react';
import Button from '../components/Button.jsx';
import { IconButton, Avatar } from '../components/index.jsx';
import NavBtn, { pill } from '../components/NavBtn.jsx';
import { contentGet } from '../lib/content/index.js';
import { useNotifications, useMarkNotificationRead, usePublicBroadcasts } from '../services/notificationService.js';
import { useCompareIds } from '../services/compareService.js';
import { useVpaCounts } from '../services/vpa.js';
import { usePlates } from '../services/plates.js';
import { timeAgo } from '../lib/date.js';

const LAST_SEEN_BROADCAST_KEY = 'biensovip_last_seen_broadcast';

function NotificationBell({ go, openPlate, user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const bellRef = useRef(null);
  const { data } = useNotifications({ limit: 5, enabled: !!user, refetchInterval: 60000 });
  const { data: publicData } = usePublicBroadcasts(5);
  const markRead = useMarkNotificationRead();
  const [lastSeen, setLastSeen] = useState(() => { try { return localStorage.getItem(LAST_SEEN_BROADCAST_KEY); } catch { return null; } });

  const close = () => { setOpen(false); bellRef.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

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

  const broadcastItems = (publicData?.items || []).map((b) => ({ id: b.id, title: b.title, content: b.content, createdAt: b.createdAt, read: lastSeen === b.id, type: 'broadcast' }));
  const items = user ? (data?.items || []) : broadcastItems;
  const unreadCount = user ? (data?.unreadCount || 0) : broadcastItems.filter((b) => !b.read).length;

  const handleToggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next && !user && broadcastItems.length > 0) {
        const newestId = broadcastItems[0].id;
        try { localStorage.setItem(LAST_SEEN_BROADCAST_KEY, newestId); } catch { /* Safari private mode — bỏ qua */ }
        setLastSeen(newestId);
      }
      return next;
    });
  };

  const handleClick = (n) => {
    // Guest không có trang /thong-bao-moi (cần login) — nội dung broadcast đã đủ ngay trong panel này.
    if (!user) { setOpen(false); return; }
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    if (n.plateId) openPlate(n.plateId);
    else go('notifications')();
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
      <button ref={bellRef} type="button" aria-label="Thông báo" aria-haspopup="menu" aria-expanded={open} aria-controls="notif-panel" onClick={handleToggle} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-body)', cursor: 'pointer', flexShrink: 0 }}>
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
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: n.read ? 'var(--fw-regular)' : 'var(--fw-semibold)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title || (n.type === 'plate_match' ? `Biển ${n.plateNumber || 'mới'} phù hợp tiêu chí` : n.type === 'broadcast' ? 'Thông báo mới' : 'Thông báo')}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            ))
          )}
          {user ? (
            <button type="button" onClick={() => { setOpen(false); go('notifications')(); }} style={{ width: '100%', padding: 'var(--space-3)', border: 'none', background: 'var(--surface-sunken)', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>Xem tất cả</button>
          ) : (
            <button type="button" onClick={() => { setOpen(false); go('login')(); }} style={{ width: '100%', padding: 'var(--space-3)', border: 'none', background: 'var(--surface-sunken)', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>Đăng nhập để nhận thông báo riêng</button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Header({ s, go, favCount, user, patch, notify, onMenu, openPlate }) {
  const T = contentGet;
  const { ids: compareIds } = useCompareIds();
  const compareCount = compareIds.length;
  const { data: vpaCounts } = useVpaCounts('');
  const { data: stockData } = usePlates({ perPage: 1 });
  const stockTotal = stockData?.total;
  const tuanCount = vpaCounts?.tuan;
  const thangCount = vpaCounts?.thang;
  const nav = [['list', T('common.nav.plates')], ['lucky', T('common.nav.lucky')], ['compare', T('common.nav.compare'), GitCompareArrows], ['blog', T('common.nav.blog')], ['chat', T('common.nav.contact')], ['collab', T('common.nav.collab')]];
  const navRef = useRef(null);
  const [luckyOpen, setLuckyOpen] = useState(false);
  const [platesOpen, setPlatesOpen] = useState(false);
  const closeTimer = useRef(null);
  const platesCloseTimer = useRef(null);

  const handleMouseEnterLucky = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setLuckyOpen(true);
  };

  const handleMouseLeaveLucky = () => {
    closeTimer.current = setTimeout(() => {
      setLuckyOpen(false);
    }, 180);
  };

  const handleMouseEnterPlates = () => {
    if (platesCloseTimer.current) clearTimeout(platesCloseTimer.current);
    setPlatesOpen(true);
  };

  const handleMouseLeavePlates = () => {
    platesCloseTimer.current = setTimeout(() => {
      setPlatesOpen(false);
    }, 180);
  };

  const navigateToPlatesTab = (tabParam) => {
    setPlatesOpen(false);
    const targetUrl = tabParam ? `/danh-sach?tab=${tabParam}` : '/danh-sach';
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', targetUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
      if (s !== 'list') {
        go('list')();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (platesCloseTimer.current) clearTimeout(platesCloseTimer.current);
    };
  }, []);

  useEffect(() => {
    const container = navRef.current;
    const active = container?.querySelector('[aria-current="page"]');
    if (container && active) {
      const cRect = container.getBoundingClientRect();
      const aRect = active.getBoundingClientRect();
      if (aRect.left < cRect.left) {
        container.scrollLeft -= (cRect.left - aRect.left) + 8;
      } else if (aRect.right > cRect.right) {
        container.scrollLeft += (aRect.right - cRect.right) + 8;
      }
    }
  }, [s]);
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 'var(--z-header)', background: 'var(--glass-fill)', backdropFilter: 'var(--glass-blur)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
      <div className="header-row" style={{ maxWidth: 'min(100%, 1280px)', margin: '0 auto', padding: '12px var(--pad-page)', display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button onClick={onMenu} style={{ display: 'none', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', padding: 4 }} className="mobile-menu-btn"><Menu size={24} /></button>
        <a href="/" onClick={(e) => { e.preventDefault(); go('home')(); }} className="pressable" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', flexShrink: 0 }}>
          <img src="/assets/logo-mark.png" alt="" className="header-logo-mark" style={{ width: 38, height: 38, objectFit: 'contain', display: 'block' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>{T('common.brand.name')}</span>
            <span className="header-logo-tagline" style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{T('common.brand.tagline_header')}</span>
          </div>
        </a>
        <nav ref={navRef} className="header-nav-pills" style={{ display: 'flex', flex: '1 1 auto', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'flex-start', gap: 6, marginLeft: 'var(--space-2)', overflowX: 'auto', overflowY: 'visible', padding: '4px', scrollbarWidth: 'none', minWidth: 0 }}>
          {nav.map(([key, label, Icon]) => {
            if (key === 'list') {
              const isListActive = s === 'list';
              return (
                <div
                  key={key}
                  onMouseEnter={handleMouseEnterPlates}
                  onMouseLeave={handleMouseLeavePlates}
                  style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                >
                  <NavBtn
                    onClick={() => navigateToPlatesTab('')}
                    aria-current={isListActive ? 'page' : undefined}
                    aria-haspopup="true"
                    aria-expanded={platesOpen}
                    {...pill(isListActive)}
                    style={{ gap: 5, paddingRight: 10 }}
                  >
                    {label}
                    <ChevronDown
                      size={13}
                      style={{
                        transform: platesOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 180ms var(--ease-out)',
                        opacity: isListActive ? 0.9 : 0.6,
                      }}
                    />
                  </NavBtn>

                  {/* Sub-menu mở nhỏ cho Biển số: Bỏ icon, chuyển sang màu vàng, hiển thị số lượng biển */}
                  {platesOpen && (
                    <div
                      role="menu"
                      aria-label="Tùy chọn danh mục biển số"
                      onMouseEnter={handleMouseEnterPlates}
                      onMouseLeave={handleMouseLeavePlates}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        width: 300,
                        background: 'var(--white)',
                        borderRadius: 'var(--radius-card, 12px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.12), 0 0 0 1px rgba(217, 119, 6, 0.18)',
                        padding: 6,
                        zIndex: 'var(--z-popover, 70)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        animation: 'modalIn 140ms var(--ease-out)',
                      }}
                    >
                      {[
                        {
                          key: 'tuan',
                          title: 'Biển đẹp VPA tuần',
                          desc: 'Đấu giá trong 7 ngày tới',
                          count: tuanCount,
                        },
                        {
                          key: 'thang',
                          title: 'Biển đẹp VPA tháng',
                          desc: 'Kho biển đấu giá cả tháng',
                          count: thangCount,
                        },
                        {
                          key: '',
                          title: 'Biển có sẵn',
                          desc: 'Giao dịch ngay, sẵn sàng sang tên',
                          count: stockTotal,
                        },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          role="menuitem"
                          onClick={() => navigateToPlatesTab(item.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            padding: '10px 14px',
                            border: '1px solid transparent',
                            borderRadius: 'var(--radius-sm, 8px)',
                            background: 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 140ms ease',
                            width: '100%',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(217, 119, 6, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.25)';
                            const titleEl = e.currentTarget.querySelector('.sub-menu-title');
                            if (titleEl) titleEl.style.color = 'var(--action-primary, #D97706)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'transparent';
                            const titleEl = e.currentTarget.querySelector('.sub-menu-title');
                            if (titleEl) titleEl.style.color = 'var(--text-strong)';
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
                            <span
                              className="sub-menu-title"
                              style={{
                                font: 'var(--type-label)',
                                fontWeight: 'var(--fw-bold, 700)',
                                color: 'var(--text-strong)',
                                lineHeight: 1.25,
                                transition: 'color 140ms ease',
                              }}
                            >
                              {item.title}
                            </span>
                            <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                              {item.desc}
                            </span>
                          </div>

                          <span
                            style={{
                              flexShrink: 0,
                              background: '#FEF3C7',
                              color: '#B45309',
                              border: '1px solid #FDE68A',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-pill, 999px)',
                              font: 'var(--type-caption)',
                              fontSize: '11px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              boxShadow: '0 1px 2px rgba(217, 119, 6, 0.08)',
                            }}
                          >
                            {item.count != null ? `${new Intl.NumberFormat('vi-VN').format(item.count)} biển` : '—'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (key === 'lucky') {
              const isLuckyActive = s === 'lucky' || s === 'luanBien';
              return (
                <div
                  key={key}
                  onMouseEnter={handleMouseEnterLucky}
                  onMouseLeave={handleMouseLeaveLucky}
                  style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                >
                  <NavBtn
                    onClick={go('lucky')}
                    aria-current={isLuckyActive ? 'page' : undefined}
                    aria-haspopup="true"
                    aria-expanded={luckyOpen}
                    {...pill(isLuckyActive)}
                    style={{ gap: 5, paddingRight: 10 }}
                  >
                    {label}
                    <ChevronDown
                      size={13}
                      style={{
                        transform: luckyOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 180ms var(--ease-out)',
                        opacity: isLuckyActive ? 0.9 : 0.6,
                      }}
                    />
                  </NavBtn>

                  {/* Sub-menu mở nhỏ phong thủy */}
                  {luckyOpen && (
                    <div
                      role="menu"
                      aria-label="Tùy chọn phong thủy hợp mệnh"
                      onMouseEnter={handleMouseEnterLucky}
                      onMouseLeave={handleMouseLeaveLucky}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        width: 270,
                        background: 'var(--white)',
                        borderRadius: 'var(--radius-card, 12px)',
                        boxShadow: 'var(--shadow-4, 0 12px 28px rgba(0,0,0,0.12))',
                        border: '1px solid var(--border-hairline)',
                        padding: 6,
                        zIndex: 'var(--z-popover, 70)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        animation: 'modalIn 140ms var(--ease-out)',
                      }}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setLuckyOpen(false); go('lucky')(); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          border: 'none',
                          borderRadius: 'var(--radius-sm, 8px)',
                          background: s === 'lucky' ? 'var(--surface-sunken)' : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 120ms ease',
                          width: '100%',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = s === 'lucky' ? 'var(--surface-sunken)' : 'transparent'; }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-pill)', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--action-primary)', flexShrink: 0 }}>
                          <Compass size={17} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                          <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', lineHeight: 1.2 }}>
                            Tìm biển số hợp mệnh
                          </span>
                          <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                            Tra cứu theo ngày sinh &amp; ngũ hành
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setLuckyOpen(false); go('luanBien')(); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          border: 'none',
                          borderRadius: 'var(--radius-sm, 8px)',
                          background: s === 'luanBien' ? 'var(--surface-sunken)' : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 120ms ease',
                          width: '100%',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = s === 'luanBien' ? 'var(--surface-sunken)' : 'transparent'; }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-pill)', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                          <Sparkles size={17} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', lineHeight: 1.2 }}>
                              Luận giải biển số xe
                            </span>
                            <span style={{ padding: '1px 5px', borderRadius: 'var(--radius-pill)', background: 'var(--status-danger)', color: 'var(--white)', fontSize: '10px', fontWeight: 'var(--fw-bold)', lineHeight: '13px' }}>Mới</span>
                          </div>
                          <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                            Chấm điểm 5 chiều &amp; Gợi ý cải vận
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavBtn key={key} onClick={go(String(key))} aria-current={s === key ? 'page' : undefined} {...pill(s === key)}>
                {Icon && <Icon size={15} style={{ flexShrink: 0 }} />}
                {label}
                {key === 'compare' && compareCount > 0 && (
                  <span aria-label={`${compareCount} biển đang so sánh`} style={{ padding: '0 5px', height: 18, minWidth: 18, borderRadius: 'var(--radius-pill)', background: s === key ? 'var(--white)' : 'var(--status-danger)', color: s === key ? 'var(--status-danger)' : 'var(--white)', font: 'var(--type-caption)', fontSize: '11px', fontWeight: 'var(--fw-bold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 2 }}>{compareCount}</span>
                )}
              </NavBtn>
            );
          })}
        </nav>
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0, marginLeft: 'auto' }}>
          <NotificationBell go={go} openPlate={openPlate} user={user} />
          <div style={{ position: 'relative', display: 'flex' }}>
            <IconButton name="heart" label={T('common.fav.label')} onClick={go('fav')} />
            {favCount > 0 && (<span style={{ position: 'absolute', top: -5, right: -6, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{favCount}</span>)}
          </div>
          {user ? (
            <button type="button" onClick={go('profile')} aria-label={typeof user === 'string' ? user : (user.fullName || user.identifier || user.email || 'User')} title={typeof user === 'string' ? user : (user.fullName || user.identifier || user.email || 'User')} style={{ display: 'flex', alignItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              <Avatar name={typeof user === 'string' ? user : (user.identifier || user.email || 'U')} size="sm" />
            </button>
          ) : (
            <Button variant="dark" size="sm" onClick={go('register')}>Tham gia</Button>
          )}
        </div>
        {/* Mobile-only: đăng nhập/đăng ký luôn hiện cạnh hamburger, không cần mở drawer mới thấy — .desktop-nav bị ẩn hoàn toàn ở mobile (app.css) */}
        {!user && (
          <div className="mobile-auth-nav" style={{ display: 'none', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 'auto' }}>
            <button type="button" onClick={go('login')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 8px', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-body)' }}>{T('common.auth.login')}</button>
            <button type="button" onClick={go('register')} style={{ border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', cursor: 'pointer', padding: '6px 12px', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)' }}>{T('common.auth.register')}</button>
          </div>
        )}
      </div>
    </header>
  );
}
