import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Bell, MessageCircle, Star } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Input, Checkbox, Eyebrow } from '../components/index.jsx';

const SWAP_TRANSITION = { type: 'spring', stiffness: 90, damping: 20, mass: 1 };
const CONTENT_FADE = { duration: 0.3, ease: [0.22, 1, 0.36, 1] };

const LAST_EMAIL_KEY = 'bsd_last_email';

const REGISTER_BENEFITS = [
  { icon: Heart, text: 'Lưu biển số yêu thích, xem lại bất cứ lúc nào' },
  { icon: Bell, text: 'Nhận thông báo ngay khi có biển mới hợp mệnh' },
  { icon: MessageCircle, text: 'Theo dõi lịch sử yêu cầu tư vấn của bạn' },
  { icon: Star, text: 'Đánh giá và chia sẻ trải nghiệm sau khi mua' },
];

export default function Auth({ st, s, patch, go, setField, authMeta, authSubmit, adminSignIn, adminDemo, admin, otpLoginRequest, otpLoginVerify }) {
  const [localAdmin, setLocalAdmin] = useState(!!admin);
  const [otpMode, setOtpMode] = useState(false);
  const [remember, setRemember] = useState(true);
  const [lastEmail, setLastEmail] = useState('');
  const isAdmin = admin || localAdmin;

  useEffect(() => {
    try { setLastEmail(localStorage.getItem(LAST_EMAIL_KEY) || ''); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (s === 'login' && !isAdmin && lastEmail && !st.aEmail) patch({ aEmail: lastEmail });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, isAdmin, lastEmail]);

  const goHome = (e) => { e.preventDefault(); go('home')(); };

  // Register swaps the two blocks (info panel goes right, form goes left) — order is animated by
  // framer-motion's layout prop so the swap reads as a slide rather than an instant jump.
  const infoOrder = s === 'register' ? 2 : 1;
  const formOrder = s === 'register' ? 1 : 2;
  // The curved edge always faces the form panel, so it has to flip sides along with the swap.
  const infoRadius = s === 'register' ? '48px 0 0 48px' : '0 48px 48px 0';

  return (
    <section style={{ minHeight: '100vh', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap' }}>
        <motion.div layout transition={SWAP_TRANSITION} style={{ order: infoOrder, zIndex: 1, position: 'relative', flex: '1 1 420px', background: 'var(--surface-hero)', borderRadius: infoRadius, padding: 'clamp(28px,4vw,64px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-8)', minHeight: '100vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <img src="/assets/logo-mark.png" alt="Duy Đinh" style={{ width: 38, height: 38, objectFit: 'contain' }} />
              <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>Duy Đinh</span>
            </div>
            <a href="#" onClick={goHome} className="pressable" style={{ display: 'flex', alignItems: 'center', gap: 4, font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>
              <ArrowLeft size={14} /> Trang chủ
            </a>
          </div>

          <AnimatePresence mode="wait">
            <motion.p key={s === 'register' ? 'register-headline' : 'login-headline'}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={CONTENT_FADE}
              style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)', maxWidth: 420 }}>
              {s === 'register' ? 'Tạo tài khoản để lưu lại những biển số ưng ý.' : lastEmail && !isAdmin ? `Chào mừng quay lại, ${lastEmail}` : 'Chào mừng quay lại — 3.240 biển số đang chờ bạn.'}
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {s === 'register' ? (
              <motion.div key="benefits" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={CONTENT_FADE}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Lợi ích khi có tài khoản</span>
                {REGISTER_BENEFITS.map(({ icon: Icon, text }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...CONTENT_FADE, delay: 0.08 + i * 0.06 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-inset-hairline)' }}>
                      <Icon size={14} style={{ color: 'var(--action-primary)' }} />
                    </span>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{text}</span>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.span key="stats" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={CONTENT_FADE}
                style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>3.240 biển số · Cập nhật mỗi ngày · Đà Nẵng</motion.span>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.div layout transition={SWAP_TRANSITION} style={{ order: formOrder, flex: '1 1 420px', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(28px,4vw,64px)', minHeight: '100vh' }}>
          <AnimatePresence mode="wait">
          <motion.div key={`${s}-${otpMode ? 'otp' : 'std'}-${isAdmin ? 'admin' : 'user'}`}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={CONTENT_FADE}
            style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {s === 'forgot' && <Eyebrow tone="blue">{`Bước ${st.step}/3`}</Eyebrow>}
            {otpMode && <Eyebrow tone="blue">{`Đăng nhập bằng OTP · Bước ${st.step}/2`}</Eyebrow>}
            <div>
              <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>
                {isAdmin ? 'Đăng nhập quản trị' : otpMode ? (st.step === 1 ? 'Đăng nhập bằng OTP' : 'Nhập mã xác thực') : authMeta[0]}
              </h1>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                {isAdmin ? 'Chỉ dành cho chủ shop Duy Đinh.' : otpMode ? (st.step === 1 ? 'Không cần nhớ mật khẩu — nhận mã qua email.' : 'Mã 6 số đã được gửi tới email của bạn.') : authMeta[1]}
              </p>
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
            {s === 'login' && !otpMode && (
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <Checkbox label="Ghi nhớ đăng nhập" checked={remember} onChange={setRemember} />
                      <a href="#" onClick={(e) => { e.preventDefault(); patch({ aErr: {} }); setOtpMode(true); }} style={{ font: 'var(--type-caption)' }}>Đăng nhập bằng OTP</a>
                    </div>
                    <a href="#" onClick={(e) => { e.preventDefault(); go('forgot')(); }} style={{ alignSelf: 'flex-end', font: 'var(--type-caption)' }}>Quên mật khẩu?</a>
                  </>
                )}
              </div>
            )}
            {s === 'login' && otpMode && st.step === 1 && (
              <Input label="Email đã đăng ký" placeholder="email@example.com" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} />
            )}
            {s === 'login' && otpMode && st.step === 2 && (
              <Input label="Mã xác thực 6 số" placeholder="123456" value={st.aOtp} error={st.aErr.otp} onChange={setField('aOtp')} hint="Mã đã gửi tới email của bạn." />
            )}
            {s === 'forgot' && st.step === 1 && <Input label="Email đã đăng ký" placeholder="email@example.com" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} />}
            {s === 'forgot' && st.step === 2 && <Input label="Mã xác thực 6 số" placeholder="123456" value={st.aOtp} error={st.aErr.otp} onChange={setField('aOtp')} hint="Mã đã gửi tới email của bạn." />}
            {s === 'forgot' && st.step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Input label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" value={st.aPw} error={st.aErr.pw} onChange={setField('aPw')} />
                <Input label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu" value={st.aPw2} error={st.aErr.pw2} onChange={setField('aPw2')} />
              </div>
            )}

            {otpMode ? (
              <Button variant="primary" size="lg" fullWidth onClick={() => (st.step === 1 ? otpLoginRequest() : otpLoginVerify(remember))}>
                {st.step === 1 ? 'Gửi mã OTP' : 'Xác nhận & đăng nhập'}
              </Button>
            ) : (
              <Button variant="primary" size="lg" fullWidth onClick={isAdmin ? adminSignIn : () => authSubmit(remember)}>{isAdmin ? 'Đăng nhập quản trị' : authMeta[2]}</Button>
            )}

            {s === 'login' && isAdmin && (
              <Button variant="outline" size="md" fullWidth onClick={adminDemo}>Dùng tài khoản mẫu (demo)</Button>
            )}
            {s === 'login' && !admin && !otpMode && (
              <Button variant="ghost" size="sm" fullWidth onClick={() => setLocalAdmin(!isAdmin)}>{isAdmin ? '← Đăng nhập khách hàng' : 'Đăng nhập quản trị →'}</Button>
            )}

            {otpMode && (
              <Button variant="ghost" size="md" fullWidth onClick={() => {
                if (st.step > 1) patch({ step: 1, aErr: {}, aOtp: '' });
                else { setOtpMode(false); patch({ aErr: {}, step: 1 }); }
              }}>
                {st.step > 1 ? '← Nhập email khác' : '← Đăng nhập bằng mật khẩu'}
              </Button>
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
          </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
