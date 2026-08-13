import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ADMIN_NAV } from '../common/constants.js';
import Button from '../components/Button.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { SearchField } from '../components/index.jsx';
import { pill } from '../components/NavBtn.jsx';
import * as authApi from '../services/authService.js';
import Dashboard from '../pages/admin/Dashboard.jsx';
import AdminPlates from '../pages/admin/AdminPlates.jsx';
import AdminCats from '../pages/admin/AdminCats.jsx';
import AdminContacts from '../pages/admin/AdminContacts.jsx';
import AdminStaff from '../pages/admin/AdminStaff.jsx';
import AdminPosts from '../pages/admin/AdminPosts.jsx';
import AdminCustomers from '../pages/admin/AdminCustomers.jsx';
import AdminVideos from '../pages/admin/AdminVideos.jsx';
import AdminNotifications from '../pages/admin/AdminNotifications.jsx';
import AdminCollaborators from '../pages/admin/AdminCollaborators.jsx';
import AdminReviews from '../pages/admin/AdminReviews.jsx';
import AdminMeanings from '../pages/admin/AdminMeanings.jsx';
import Compose from '../pages/admin/Compose.jsx';

function AdminSidebarNav({ s, st, go, onNavigate }) {
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 var(--space-3)' }}>
      {ADMIN_NAV.filter((n) => n[0] !== 'astaff' || st.user?.role === 'super-admin').map((n) => {
        const on = s === n[0] || (n[0] === 'aposts' && s === 'compose');
        return (
          <button key={n[0]} type="button" className="pill-btn" data-on={String(on)} data-dark="false" onClick={() => { go(n[0])(); onNavigate?.(); }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'left', padding: '12px 14px', border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', transition: 'var(--transition-control)', background: pill(on).background, color: pill(on).color }}>{n[1]}</button>
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
  const logout = async () => { await authApi.adminLogout(); patch({ user: null, isAdmin: false, screen: 'adminLogin' }); };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', minHeight: 'calc(100vh - 42px)', background: 'var(--surface-sunken)' }}>
      <button type="button" className="admin-mobile-topbar-btn" onClick={() => setDrawerOpen(true)} aria-label="Mở menu quản trị" style={{ display: 'none', position: 'fixed', top: 10, left: 12, zIndex: 70, width: 44, height: 44, border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--white)', boxShadow: 'var(--shadow-2)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <Menu size={20} />
      </button>

      {drawerOpen && (
        <div className="admin-drawer-overlay" style={{ position: 'fixed', inset: 0, zIndex: 85 }}>
          <div aria-hidden="true" onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'var(--overlay-scrim)', animation: 'fadeIn 140ms var(--ease-out)' }} />
          <div role="dialog" aria-modal="true" aria-label="Menu quản trị" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 'min(280px, 85vw)', background: 'var(--white)', boxShadow: 'var(--shadow-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', padding: 'var(--space-5) 0', animation: 'modalIn 180ms var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <img src="/assets/logo-mark.png" alt="Duy Đinh" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>Quản trị</span>
              </div>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Đóng menu" style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={22} /></button>
            </div>
            <AdminSidebarNav s={s} st={st} go={go} onNavigate={() => setDrawerOpen(false)} />
            <div style={{ flex: 1 }} />
            <div style={{ padding: '0 var(--space-5)' }}>
              <Button variant="ghost" size="sm" fullWidth onClick={() => { logout(); setDrawerOpen(false); }}>Đăng xuất</Button>
            </div>
          </div>
        </div>
      )}

      <aside className="admin-sidebar" style={{ flex: '0 0 248px', minWidth: 230, background: 'var(--white)', boxShadow: 'inset -1px 0 0 var(--border-hairline)', padding: 'var(--space-5) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '0 var(--space-5)' }}>
          <img src="/assets/logo-mark.png" alt="Duy Đinh" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}><span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>Duy Đinh</span><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Quản trị</span></div>
        </div>
        <AdminSidebarNav s={s} st={st} go={go} />
        <div style={{ flex: 1 }} />
        <div style={{ padding: '0 var(--space-5)' }}>
          <Button variant="ghost" size="sm" fullWidth onClick={logout}>Đăng xuất</Button>
        </div>
      </aside>
      <main className="admin-main" style={{ flex: '1 1 560px', minWidth: 0, padding: 'var(--space-6) clamp(16px,3vw,32px) var(--space-9)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Breadcrumb items={[{ label: 'Quản trị', onClick: go('dash') }, { label: adminMeta[0] }]} />
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
        {s === 'aplates' && <AdminPlates go={go} notify={notify} />}
        {s === 'acats' && <AdminCats st={st} setField={setField} patch={patch} setSt={setSt} notify={notify} askDelete={askDelete} />}
        {s === 'acontacts' && <AdminContacts notify={notify} />}
        {s === 'astaff' && <AdminStaff notify={notify} />}
        {s === 'acustomers' && <AdminCustomers st={st} setSt={setSt} notify={notify} />}
        {s === 'avideos' && <AdminVideos notify={notify} />}
        {s === 'anotifications' && <AdminNotifications notify={notify} />}
        {s === 'acollabs' && <AdminCollaborators st={st} patch={patch} setSt={setSt} notify={notify} />}
        {s === 'areviews' && <AdminReviews notify={notify} />}
        {s === 'ameanings' && <AdminMeanings notify={notify} />}
        {s === 'aposts' && <AdminPosts patch={patch} notify={notify} />}
        {s === 'compose' && <Compose st={st} patch={patch} notify={notify} />}
      </main>
    </div>
  );
}
