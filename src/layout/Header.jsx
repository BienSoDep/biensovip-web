import { Menu } from 'lucide-react';
import Button from '../components/Button.jsx';
import { IconButton, Avatar } from '../components/index.jsx';
import NavBtn, { pill } from '../components/NavBtn.jsx';

export default function Header({ s, go, favCount, user, patch, notify, onMenu }) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--glass-fill)', backdropFilter: 'var(--glass-blur)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
      <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: '14px var(--pad-page)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-6)' }}>
        <button onClick={onMenu} style={{ display: 'none', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', padding: 4 }} className="mobile-menu-btn"><Menu size={24} /></button>
        <div role="button" tabIndex={0} onClick={go('home')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go('home')(); } }} className="pressable" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
          <img src="/assets/logo-mark.png" alt="Duy Đinh" style={{ width: 38, height: 38, objectFit: 'contain', display: 'block' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>Duy Đinh</span>
            <span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Biển số đẹp Đà Nẵng</span>
          </div>
        </div>
        <nav style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
          {[['list', 'Biển số'], ['lucky', 'Hợp mệnh'], ['fav', 'Yêu thích'], ['blog', 'Tin phong thủy'], ['about', 'Về chúng tôi']].map((n) => (
            <NavBtn key={n[0]} onClick={go(n[0])} {...pill(s === n[0])}>{n[1]}</NavBtn>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ position: 'relative', display: 'flex' }}>
            <IconButton name="heart" label="Biển số yêu thích" onClick={go('fav')} />
            <span style={{ position: 'absolute', top: -5, right: -6, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{favCount}</span>
          </div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '4px 12px 4px 4px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-muted)' }}>
              <Avatar name={user} size="sm" />
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{user}</span>
              <button type="button" onClick={() => { patch({ user: null, isAdmin: false }); notify('Đã đăng xuất'); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--text-muted)', padding: 0 }}>Thoát</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="sm" onClick={go('login')}>Đăng nhập</Button>
              <Button variant="dark" size="sm" onClick={go('register')}>Đăng ký</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
