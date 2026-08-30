import { useEffect, useRef, useState } from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { ADMIN_NAV } from '../common/constants.js';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { SearchField } from '../components/index.jsx';
import { pill } from '../components/NavBtn.jsx';
import * as authApi from '../services/authService.js';
import { apiClient } from '../services/apiClient.js';
import Dashboard from '../pages/admin/Dashboard.jsx';
import AdminPlates from '../pages/admin/AdminPlates.jsx';
import AdminCats from '../pages/admin/AdminCats.jsx';
import AdminContacts from '../pages/admin/AdminContacts.jsx';
import AdminStaff from '../pages/admin/AdminStaff.jsx';
import AdminPosts from '../pages/admin/AdminPosts.jsx';
import AdminCustomers from '../pages/admin/AdminCustomers.jsx';
import AdminVideos from '../pages/admin/AdminVideos.jsx';
import AdminNotifications from '../pages/admin/AdminNotifications.jsx';
import EmailBuilder from '../pages/admin/EmailBuilder.jsx';
import AdminCollaborators from '../pages/admin/AdminCollaborators.jsx';
import AdminReviews from '../pages/admin/AdminReviews.jsx';
import AdminChatbot from '../pages/admin/AdminChatbot.jsx';
import AdminMeanings from '../pages/admin/AdminMeanings.jsx';
import Compose from '../pages/admin/Compose.jsx';
import AdminAuditLog from '../pages/admin/AdminAuditLog.jsx';
import AdminRiskLog from '../pages/admin/AdminRiskLog.jsx';
import GlobalSearch from '../components/GlobalSearch.jsx';
import TwoFactorSettingsModal from '../components/TwoFactorSettingsModal.jsx';
import { useNotificationCounts } from '../services/systemHealth.js';

// Ánh xạ màn hình admin → quyền "resource:view" tối thiểu để hiện nav/render.
// dash & astaff không map (dash luôn hiện; astaff chỉ super-admin).
const NAV_PERM = {
  aplates: 'plates:view', acats: 'categories:view', acontacts: 'contacts:view',
  aposts: 'posts:view', compose: 'posts:view', ameanings: 'meanings:view',
  acustomers: 'customers:view', avideos: 'videos:view', anotifications: 'notifications:view',
  areviews: 'reviews:view', acollabs: 'collaborators:view', aemailtpl: 'email_templates:view',
  achatbot: 'chatbot:view',
};
export const canPerm = (st, perm) => st.user?.role === 'super-admin' || st.user?.permissions?.includes('*') || st.user?.permissions?.includes(perm);

// UC35 — badge "mới" cạnh Yêu cầu liên hệ/Đánh giá/Cộng tác viên, dựa lastSeenAt lưu localStorage (per-nav-item).
const BADGE_NAV = { acontacts: 'newContacts', areviews: 'newReviews', acollabs: 'newCollaborators' };
const LAST_SEEN_KEY = 'bsd_admin_last_seen';

function AdminSidebarNav({ s, st, go, onNavigate }) {
  const lastSeenAt = (() => { try { return localStorage.getItem(LAST_SEEN_KEY) || new Date(Date.now() - 86400000).toISOString(); } catch { return new Date(Date.now() - 86400000).toISOString(); } })();
  const { data: counts } = useNotificationCounts(lastSeenAt);

  const markSeen = (navKey) => {
    if (BADGE_NAV[navKey]) { try { localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString()); } catch { /* ignore */ } }
  };

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 var(--space-3)' }}>
      {ADMIN_NAV.filter((n) => {
        if (n[0] === 'astaff' || n[0] === 'aauditlog' || n[0] === 'arisklog') return st.user?.role === 'super-admin';
        const perm = NAV_PERM[n[0]];
        return !perm || canPerm(st, perm);
      }).map((n) => {
        const on = s === n[0] || (n[0] === 'aposts' && s === 'compose');
        const badgeKey = BADGE_NAV[n[0]];
        const badgeCount = badgeKey && counts ? counts[badgeKey] : 0;
        return (
          <button key={n[0]} type="button" className="pill-btn" data-on={String(on)} data-dark="false" aria-current={on ? 'page' : undefined} onClick={() => { markSeen(n[0]); go(n[0])(); onNavigate?.(); }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'left', padding: '12px 14px', border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', transition: 'var(--transition-control)', background: pill(on).background, color: pill(on).color }}>
            <span style={{ flex: 1 }}>{n[1]}</span>
            {badgeCount > 0 && (
              <span aria-label={`${badgeCount} mới`} style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 'var(--radius-pill)', background: on ? 'rgba(255,255,255,.28)' : 'var(--status-danger)', color: on ? 'var(--text-inverse)' : '#fff', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badgeCount > 99 ? '99+' : badgeCount}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default function AdminShell({
  s, st, setSt, patch, go, notify, setField, askDelete,
  adminMeta,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);
  const drawerTriggerRef = useRef(null);
  // Mobile drawer: focus trap + Esc-to-close + trả focus về nút mở khi đóng.
  useEffect(() => {
    if (!drawerOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;
    const trigger = document.activeElement;
    drawerTriggerRef.current = trigger;
    const focusables = () =>
      Array.from(drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter((el) => !el.disabled && el.offsetParent !== null);
    const first = focusables()[0];
    (first || drawer).focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setDrawerOpen(false); return; }
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (!els.length) return;
      const f = els[0], l = els[els.length - 1];
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (drawerTriggerRef.current && typeof drawerTriggerRef.current.focus === 'function') drawerTriggerRef.current.focus();
    };
  }, [drawerOpen]);
  // Ẩn/hiện sidebar nav — nhớ lựa chọn qua localStorage để không phải bật lại mỗi lần load trang.
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('adminSidebarCollapsed') === '1'; } catch { return false; } });
  const toggleCollapsed = () => setCollapsed((c) => {
    const next = !c;
    try { localStorage.setItem('adminSidebarCollapsed', next ? '1' : '0'); } catch { /* ignore */ }
    return next;
  });
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const logout = async () => {
    setLoggingOut(true);
    try {
      await authApi.adminLogout();
      patch({ user: null, isAdmin: false, screen: 'home' });
    } catch {
      setLoggingOut(false);
      setLogoutConfirm(false);
      notify?.('Đăng xuất thất bại, thử lại');
    }
  };

  // Chặn màn không có quyền: astaff chỉ super-admin; các màn khác cần "resource:view".
  const isSuperAdmin = st.user?.role === 'super-admin';
  const denied = (s === 'astaff' && !isSuperAdmin) || (NAV_PERM[s] && !canPerm(st, NAV_PERM[s]));
  useEffect(() => {
    if (denied) go('dash')();
  }, [denied, go]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', minHeight: 'calc(100vh - 42px)', background: 'var(--surface-sunken)' }}>
      <button type="button" className="admin-mobile-topbar-btn" onClick={() => setDrawerOpen(true)} aria-label="Mở menu quản trị" aria-controls="admin-drawer" aria-expanded={drawerOpen} style={{ display: 'none', position: 'fixed', top: 10, left: 12, zIndex: 70, width: 44, height: 44, border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--white)', boxShadow: 'var(--shadow-2)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <Menu size={20} />
      </button>

      {drawerOpen && (
        <div className="admin-drawer-overlay" style={{ position: 'fixed', inset: 0, zIndex: 85 }}>
          <div aria-hidden="true" onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'var(--overlay-scrim)', animation: 'fadeIn 140ms var(--ease-out)' }} />
          <div ref={drawerRef} id="admin-drawer" role="dialog" aria-modal="true" aria-label="Menu quản trị" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 'min(280px, 85vw)', background: 'var(--white)', boxShadow: 'var(--shadow-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', padding: 'var(--space-5) 0', animation: 'modalIn 180ms var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <img src="/assets/logo-mark.png" alt="Duy Đinh" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>Quản trị</span>
              </div>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Đóng menu" style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={22} /></button>
            </div>
            <AdminSidebarNav s={s} st={st} go={go} onNavigate={() => setDrawerOpen(false)} />
            <div style={{ flex: 1 }} />
            <div style={{ padding: '0 var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="sm" fullWidth onClick={() => { setDrawerOpen(false); setTwoFaOpen(true); }}>Bảo mật</Button>
              <Button variant="ghost" size="sm" fullWidth onClick={() => { setDrawerOpen(false); setLogoutConfirm(true); }}>Đăng xuất</Button>
            </div>
          </div>
        </div>
      )}

      {!collapsed && (
        <aside className="admin-sidebar" style={{ flex: '0 0 248px', minWidth: 230, background: 'var(--white)', boxShadow: 'inset -1px 0 0 var(--border-hairline)', padding: 'var(--space-5) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', padding: '0 var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
              <img src="/assets/logo-mark.png" alt="Duy Đinh" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}><span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>Duy Đinh</span><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Quản trị</span></div>
            </div>
            <button type="button" onClick={toggleCollapsed} aria-label="Ẩn menu" title="Ẩn menu" style={{ flexShrink: 0, width: 32, height: 32, border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PanelLeftClose size={16} />
            </button>
          </div>
          <AdminSidebarNav s={s} st={st} go={go} />
          <div style={{ flex: 1 }} />
          <div style={{ padding: '0 var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="sm" fullWidth onClick={() => setTwoFaOpen(true)}>Bảo mật</Button>
            <Button variant="ghost" size="sm" fullWidth onClick={() => setLogoutConfirm(true)}>Đăng xuất</Button>
          </div>
        </aside>
      )}
      <main className="admin-main" aria-hidden={drawerOpen ? true : undefined} inert={drawerOpen ? '' : undefined} style={{ flex: '1 1 560px', minWidth: 0, padding: 'var(--space-6) clamp(16px,3vw,32px) var(--space-9)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {collapsed && (
          <button type="button" onClick={toggleCollapsed} aria-label="Hiện menu" title="Hiện menu" style={{ alignSelf: 'flex-start', width: 36, height: 36, border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PanelLeftOpen size={18} />
          </button>
        )}
        <Breadcrumb inset items={[{ label: 'Quản trị', onClick: go('dash') }, { label: adminMeta[0] }]} />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
          <div style={{ flex: '1 1 280px' }}>
            <h1 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{adminMeta[0]}</h1>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{adminMeta[1]}</p>
          </div>
          {['aposts', 'acustomers', 'acollabs'].indexOf(s) >= 0 && (
            <SearchField placeholder="Tìm trong bảng…" value={st.adminQ} onChange={(e) => patch({ adminQ: e.target.value })} width={240} />
          )}
          {(s === 'aposts') && (
            <Button variant="primary" size="md" onClick={go('compose')}>Đăng bài mới</Button>
          )}
        </div>

        {s === 'dash' && <Dashboard st={st} go={go} />}
        {s === 'aplates' && <AdminPlates go={go} notify={notify} st={st} />}
        {s === 'acats' && <AdminCats st={st} setField={setField} patch={patch} setSt={setSt} notify={notify} askDelete={askDelete} />}
        {s === 'acontacts' && <AdminContacts notify={notify} />}
        {s === 'astaff' && (isSuperAdmin ? <AdminStaff notify={notify} /> : null)}
        {s === 'acustomers' && <AdminCustomers st={st} setSt={setSt} notify={notify} />}
        {s === 'avideos' && <AdminVideos notify={notify} />}
        {s === 'anotifications' && <AdminNotifications notify={notify} st={st} />}
        {s === 'aemailtpl' && <EmailBuilder notify={notify} />}
        {s === 'acollabs' && <AdminCollaborators st={st} patch={patch} setSt={setSt} notify={notify} />}
        {s === 'areviews' && <AdminReviews notify={notify} />}
        {s === 'achatbot' && <AdminChatbot notify={notify} />}
        {s === 'aauditlog' && <AdminAuditLog />}
        {s === 'arisklog' && <AdminRiskLog />}
        {s === 'ameanings' && <AdminMeanings notify={notify} />}
        {s === 'aposts' && <AdminPosts st={st} patch={patch} notify={notify} />}
        {s === 'compose' && <Compose st={st} patch={patch} notify={notify} />}
      </main>

      <Modal open={logoutConfirm} onClose={() => setLogoutConfirm(false)} title="Đăng xuất" maxWidth="360px">
        <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Bạn có chắc muốn đăng xuất khỏi trang quản trị?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="md" onClick={() => setLogoutConfirm(false)}>Hủy</Button>
          <Button variant="primary" size="md" onClick={logout} loading={loggingOut}>Đăng xuất</Button>
        </div>
      </Modal>

      <TwoFactorSettingsModal
        open={twoFaOpen}
        onClose={() => setTwoFaOpen(false)}
        twoFactorEnabled={!!st.user?.twoFactorEnabled}
        notify={notify}
        onChanged={async () => {
          try {
            const admin = await apiClient.get('/api/admin/auth/me');
            if (admin) patch({ user: admin });
          } catch { /* ignore — modal already shows toast result */ }
        }}
      />

      <GlobalSearch go={go} patch={patch} />
    </div>
  );
}
