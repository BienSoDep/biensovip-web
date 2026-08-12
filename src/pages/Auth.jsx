import { useState } from 'react';
import Button from '../components/Button.jsx';
import { Input, Checkbox, Eyebrow } from '../components/index.jsx';

export default function Auth({ st, s, patch, go, setField, authMeta, authSubmit, adminSignIn, adminDemo, admin }) {
  const [localAdmin, setLocalAdmin] = useState(!!admin);
  const isAdmin = admin || localAdmin;
  return (
    <section style={{ padding: 'var(--space-7) var(--pad-page) var(--pad-section-y)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', display: 'flex', flexWrap: 'wrap', borderRadius: 'var(--radius-surface)', overflow: 'hidden', background: 'var(--surface-sunken)' }}>
        <div style={{ flex: '1 1 360px', background: 'var(--surface-hero)', padding: 'clamp(28px,4vw,52px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-8)', minHeight: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img src="/assets/logo-mark.png" alt="Duy Đinh" style={{ width: 38, height: 38, objectFit: 'contain' }} />
            <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>Duy Đinh</span>
          </div>
          <p style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)', maxWidth: 420 }}>{s === 'register' ? 'Tạo tài khoản để lưu lại những biển số ưng ý.' : 'Chào mừng quay lại — 3.240 biển số đang chờ bạn.'}</p>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>3.240 biển số · Cập nhật mỗi ngày · Đà Nẵng</span>
        </div>
        <div style={{ flex: '1 1 420px', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(28px,4vw,52px)' }}>
          <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {s === 'forgot' && <Eyebrow tone="blue">{`Bước ${st.step}/3`}</Eyebrow>}
            <div>
              <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{isAdmin ? 'Đăng nhập quản trị' : authMeta[0]}</h1>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{isAdmin ? 'Chỉ dành cho chủ shop Duy Đinh.' : authMeta[1]}</p>
            </div>

            {s === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={st.aName} error={st.aErr.name} onChange={setField('aName')} />
                <Input label="Email" placeholder="email@example.com" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} />
                <Input label="Mật khẩu" type="password" placeholder="Tối thiểu 8 ký tự, có chữ và số" value={st.aPw} error={st.aErr.pw} onChange={setField('aPw')} />
                <Checkbox label="Tôi đồng ý với điều khoản sử dụng" checked={st.aAgree} onChange={(v) => patch({ aAgree: v })} />
                {st.aErr.agree && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Bạn cần đồng ý với điều khoản để tiếp tục.</span>}
              </div>
            )}
            {s === 'login' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {isAdmin ? (
                  <>
                    <Input label="Tài khoản" placeholder="admin@biensovip.com" value={st.admEmail} error={st.admErr.email} onChange={setField('admEmail')} />
                    <Input label="Mật khẩu" type="password" placeholder="••••••••" value={st.admPw} error={st.admErr.pw} onChange={setField('admPw')} />
                  </>
                ) : (
                  <>
                    <Input label="Email hoặc số điện thoại" placeholder="email@example.com hoặc 09xx xxx xxx" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} />
                    <Input label="Mật khẩu" type="password" placeholder="••••••••" value={st.aPw} error={st.aErr.pw} onChange={setField('aPw')} />
                    <a href="#" onClick={(e) => { e.preventDefault(); go('forgot')(); }} style={{ alignSelf: 'flex-end', font: 'var(--type-caption)' }}>Quên mật khẩu?</a>
                  </>
                )}
              </div>
            )}
            {s === 'forgot' && st.step === 1 && <Input label="Email đã đăng ký" placeholder="email@example.com" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} />}
            {s === 'forgot' && st.step === 2 && <Input label="Mã xác thực 6 số" placeholder="123456" value={st.aOtp} error={st.aErr.otp} onChange={setField('aOtp')} hint="Mã đã gửi tới email của bạn." />}
            {s === 'forgot' && st.step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Input label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" value={st.aPw} error={st.aErr.pw} onChange={setField('aPw')} />
                <Input label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu" value={st.aPw2} error={st.aErr.pw2} onChange={setField('aPw2')} />
              </div>
            )}

            <Button variant="primary" size="lg" fullWidth onClick={isAdmin ? adminSignIn : authSubmit}>{isAdmin ? 'Đăng nhập quản trị' : authMeta[2]}</Button>

            {s === 'login' && isAdmin && (
              <Button variant="outline" size="md" fullWidth onClick={adminDemo}>Dùng tài khoản mẫu (demo)</Button>
            )}
            {s === 'login' && !admin && (
              <Button variant="ghost" size="sm" fullWidth onClick={() => setLocalAdmin(!isAdmin)}>{isAdmin ? '← Đăng nhập khách hàng' : 'Đăng nhập quản trị →'}</Button>
            )}

            {s === 'forgot' && (
              <Button variant="ghost" size="md" fullWidth onClick={() => (st.step > 1 ? patch({ step: st.step - 1, aErr: {} }) : patch({ screen: 'login', aErr: {} }))}>
                {st.step > 1 ? '← Quay lại bước trước' : '← Quay lại đăng nhập'}
              </Button>
            )}
            {(s === 'register' || s === 'login') && (
              <p style={{ margin: 0, textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                {s === 'register' ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); go(s === 'register' ? 'login' : 'register')(); }}>{s === 'register' ? 'Đăng nhập' : 'Đăng ký ngay'}</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
