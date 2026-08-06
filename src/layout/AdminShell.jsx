import { ADMIN_NAV } from '../common/constants.js';
import Button from '../components/Button.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { SearchField } from '../components/index.jsx';
import { pill } from '../components/NavBtn.jsx';
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
import Compose from '../pages/admin/Compose.jsx';

export default function AdminShell({
  s, st, setSt, patch, go, notify, setField,
  adminMeta, admPlates, admContacts, admPosts,
  openAdd, openEdit, openEditPost, askDelete, publish, insertPlates, catNames,
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', minHeight: 'calc(100vh - 42px)', background: 'var(--surface-sunken)' }}>
      <aside style={{ flex: '0 0 248px', minWidth: 230, background: 'var(--white)', boxShadow: 'inset -1px 0 0 var(--border-hairline)', padding: 'var(--space-5) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '0 var(--space-5)' }}>
          <img src="/assets/logo-mark.png" alt="Duy Đinh" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}><span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>Duy Đinh</span><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Quản trị</span></div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 var(--space-3)' }}>
          {ADMIN_NAV.map((n) => {
            const on = s === n[0] || (n[0] === 'aposts' && s === 'compose');
            return (
              <button key={n[0]} type="button" className="pill-btn" data-on={String(on)} data-dark="false" onClick={go(n[0])} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'left', padding: '10px 14px', border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', transition: 'var(--transition-control)', background: pill(on).background, color: pill(on).color }}>{n[1]}</button>
            );
          })}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ padding: '0 var(--space-5)' }}>
          <Button variant="ghost" size="sm" fullWidth onClick={go('adminLogin')}>Đăng xuất</Button>
        </div>
      </aside>
      <main style={{ flex: '1 1 560px', minWidth: 0, padding: 'var(--space-6) clamp(16px,3vw,32px) var(--space-9)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Breadcrumb items={[{ label: 'Quản trị', onClick: go('dash') }, { label: adminMeta[0] }]} />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
          <div style={{ flex: '1 1 280px' }}>
            <h1 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{adminMeta[0]}</h1>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{adminMeta[1]}</p>
          </div>
          {['aplates', 'acontacts', 'aposts', 'astaff', 'acustomers', 'acollabs'].indexOf(s) >= 0 && (
            <SearchField placeholder="Tìm trong bảng…" value={st.adminQ} onChange={(e) => patch({ adminQ: e.target.value })} width={240} />
          )}
          {(s === 'aplates' || s === 'aposts') && (
            <Button variant="primary" size="md" onClick={s === 'aplates' ? openAdd : go('compose')}>{s === 'aplates' ? 'Thêm biển số' : 'Đăng bài mới'}</Button>
          )}
        </div>

        {s === 'dash' && <Dashboard st={st} go={go} />}
        {s === 'aplates' && <AdminPlates st={st} patch={patch} admPlates={admPlates} openEdit={openEdit} askDelete={askDelete} catNames={catNames} />}
        {s === 'acats' && <AdminCats st={st} setField={setField} patch={patch} setSt={setSt} notify={notify} askDelete={askDelete} />}
        {s === 'acontacts' && <AdminContacts st={st} setSt={setSt} patch={patch} admContacts={admContacts} notify={notify} />}
        {s === 'astaff' && <AdminStaff st={st} patch={patch} setSt={setSt} notify={notify} />}
        {s === 'acustomers' && <AdminCustomers st={st} setSt={setSt} notify={notify} />}
        {s === 'avideos' && <AdminVideos st={st} patch={patch} setSt={setSt} notify={notify} />}
        {s === 'anotifications' && <AdminNotifications st={st} patch={patch} notify={notify} />}
        {s === 'acollabs' && <AdminCollaborators st={st} patch={patch} setSt={setSt} notify={notify} />}
        {s === 'aposts' && <AdminPosts admPosts={admPosts} openEditPost={openEditPost} askDelete={askDelete} />}
        {s === 'compose' && <Compose st={st} setField={setField} patch={patch} setSt={setSt} notify={notify} publish={publish} insertPlates={insertPlates} />}
      </main>
    </div>
  );
}
