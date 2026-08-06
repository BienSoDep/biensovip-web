import Button from '../components/Button.jsx';
import { Input, Eyebrow } from '../components/index.jsx';

export default function AdminLogin({ st, setField, patch, go, notify }) {
  const signIn = () => {
    const err = {};
    if (!/^\S+@\S+\.\S+$/.test(st.admEmail)) err.email = 'Email chưa đúng định dạng.';
    if (st.admPw.length < 6) err.pw = 'Mật khẩu tối thiểu 6 ký tự.';
    if (Object.keys(err).length) { patch({ admErr: err }); return; }
    patch({ admErr: {}, screen: 'dash' });
    notify('Đăng nhập quản trị thành công');
  };

  return (
    <section style={{ minHeight: 'calc(100vh - 42px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8) var(--pad-page)', background: 'var(--surface-sunken)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-3)', padding: 'var(--space-7)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Eyebrow tone="blue">Khu vực quản trị</Eyebrow>
        <div>
          <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-title-1)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Đăng nhập quản trị</h1>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chỉ dành cho chủ shop Duy Đinh.</p>
        </div>
        <Input label="Tài khoản" placeholder="admin@biensovip.com" value={st.admEmail} error={st.admErr.email} onChange={setField('admEmail')} />
        <Input label="Mật khẩu" type="password" placeholder="••••••••" value={st.admPw} error={st.admErr.pw} onChange={setField('admPw')} />
        <Button variant="primary" size="lg" fullWidth onClick={signIn}>Đăng nhập</Button>
        <Button
          variant="outline" size="md" fullWidth
          onClick={() => {
            patch({ admEmail: 'admin@biensovip.com', admPw: 'admin123', admErr: {}, screen: 'dash' });
            notify('Đăng nhập quản trị bằng tài khoản mẫu');
          }}
        >
          Dùng tài khoản mẫu (demo)
        </Button>
        <Button variant="ghost" size="sm" fullWidth onClick={go('home')}>← Về trang khách hàng</Button>
      </div>
    </section>
  );
}
