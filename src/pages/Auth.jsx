import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Bell, MessageCircle, Star, Flame } from 'lucide-react';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { Input, Checkbox, Eyebrow } from '../components/index.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { useGoogleLogin, useGoogleConfirmLink } from '../services/googleAuth.js';
import { routeFor } from '../config/routes.js';

const SWAP_TRANSITION = { type: 'spring', stiffness: 90, damping: 20, mass: 1 };
const CONTENT_FADE = { duration: 0.3, ease: [0.22, 1, 0.36, 1] };

const LAST_EMAIL_KEY = 'bsd_last_email';

const REGISTER_BENEFITS = [
  { icon: Heart, text: 'Lưu biển số yêu thích, xem lại bất cứ lúc nào' },
  { icon: Bell, text: 'Nhận thông báo ngay khi có biển mới hợp mệnh' },
  { icon: MessageCircle, text: 'Theo dõi lịch sử yêu cầu tư vấn của bạn' },
  { icon: Star, text: 'Đánh giá và chia sẻ trải nghiệm sau khi mua' },
];

// Vài biển "đẹp" tiêu biểu — xoay vòng làm điểm nhấn hình ảnh cho panel, không phụ thuộc API.
// Kèm ý nghĩa + giá + trạng thái để không chỉ là hình biển trơ trọi.
const SHOWCASE_PLATES = [
  { prov: '43', seri: 'A1', num: '888.88', shape: 'short', name: 'Tứ Quý Phát', price: '1.850.000.000đ', hot: true },
  { prov: '43', seri: 'B2', num: '999.99', shape: 'short', name: 'Tứ Quý Cửu', price: '2.100.000.000đ', hot: true },
  { prov: '43', seri: 'C1', num: '686.86', shape: 'short', name: 'Lộc Phát Kép', price: '420.000.000đ', hot: false },
  { prov: '43', seri: 'A2', num: '567.89', shape: 'short', name: 'Sảnh Tiến', price: '365.000.000đ', hot: false },
];

function OtpBoxes({ value, onChange, error, disabled }) {
  const refs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => (value || '')[i] || '');
  const focus = (i) => refs.current[i]?.focus();
  const handle = (i, raw) => {
    const ch = raw.replace(/\D/g, '').slice(-1);
    const arr = Array.from({ length: 6 }, (_, k) => (value || '')[k] || '');
    arr[i] = ch;
    onChange(arr.join(''));
    if (ch && i < 5) focus(i + 1);
  };
  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !((value || '')[i]) && i > 0) focus(i - 1);
  };
  const onPaste = (e) => {
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    focus(Math.min(pasted.length, 5));
  };
  return (
    <div style={{ display: 'flex', gap: 8 }} onPaste={onPaste}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} value={d} inputMode="numeric" autoComplete="one-time-code" maxLength={1} aria-label={`Chữ số ${i + 1}`} disabled={disabled}
          aria-invalid={!!error}
          onChange={(e) => handle(i, e.target.value)} onKeyDown={(e) => onKeyDown(i, e)}
          style={{ width: '100%', maxWidth: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 'var(--fw-bold)', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', boxShadow: error ? 'inset 0 0 0 2px var(--status-danger)' : 'var(--shadow-inset-hairline)', color: 'var(--text-strong)', outline: 'none', opacity: disabled ? 0.5 : 1 }} />
      ))}
    </div>
  );
}

export default function Auth({ st, s, patch, go, setField, authMeta, authSubmit, otpLoginRequest, otpLoginVerify, resendOtp, submitAdmin2fa }) {
  const [otpMode, setOtpMode] = useState(false);
  const [remember, setRemember] = useState(true);
  const [lastEmail, setLastEmail] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const isOtpStep = (s === 'login' && otpMode && st.step === 2) || (s === 'forgot' && st.step === 2);

  // Chuyển tab login↔register để dở dang otpMode/step từ tab trước — không reset thì quay lại login
  // vẫn còn kẹt ở màn OTP hoặc step 2 cũ.
  useEffect(() => {
    if (s !== 'login') { setOtpMode(false); }
  }, [s]);

  useEffect(() => {
    if (isOtpStep) setResendIn((n) => (n > 0 ? n : 60));
  }, [isOtpStep]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleResend = async () => {
    setResendIn(60);
    if (resendOtp) await resendOtp();
  };

  useEffect(() => {
    try { setLastEmail(localStorage.getItem(LAST_EMAIL_KEY) || ''); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (s === 'login' && lastEmail && !st.aEmail) patch({ aEmail: lastEmail });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, lastEmail]);

  const goHome = (e) => { e.preventDefault(); go('home')(); };

  // UC29 — Đăng nhập Google. 409 = email đã có tài khoản, cần xác nhận OTP trước khi liên kết.
  const googleLogin = useGoogleLogin();
  const googleConfirmLink = useGoogleConfirmLink();
  const [googleLinkPending, setGoogleLinkPending] = useState(null); // { email, idToken } | null
  const [linkOtp, setLinkOtp] = useState('');
  const [linkErr, setLinkErr] = useState('');

  const handleGoogleCredential = (idToken) => {
    setLinkErr('');
    googleLogin.mutate(idToken, {
      onSuccess: () => go('home')(),
      onError: (e) => {
        if (e?.code === 'LINK_CONFIRMATION_REQUIRED') {
          // Backend không trả email trong body lỗi (tránh lộ) — decode JWT payload phía FE để lấy email hiển thị.
          try {
            const payload = JSON.parse(atob(idToken.split('.')[1]));
            setGoogleLinkPending({ email: payload.email, idToken });
          } catch { setGoogleLinkPending({ email: '', idToken }); }
        } else {
          setLinkErr(e?.message || 'Đăng nhập Google thất bại.');
        }
      },
    });
  };

  const confirmGoogleLink = () => {
    if (!linkOtp.trim()) { setLinkErr('Nhập mã OTP đã gửi tới email.'); return; }
    googleConfirmLink.mutate(
      { email: googleLinkPending.email, otpCode: linkOtp.trim(), idToken: googleLinkPending.idToken },
      {
        onSuccess: () => { setGoogleLinkPending(null); go('home')(); },
        onError: (e) => setLinkErr(e?.message || 'Xác nhận thất bại.'),
      },
    );
  };

  // Register: xác nhận mật khẩu khớp TRƯỚC khi submit.
  const submitAuth = (remember) => {
    if (s === 'register' && st.aPw !== st.aPw2) { patch({ aErr: { ...st.aErr, pw2: 'Hai mật khẩu chưa khớp.' } }); return; }
    authSubmit(remember);
  };

  // Xoay biển mẫu mỗi 3.2s — điểm nhấn hình ảnh chính của panel, thay cho khối chữ tĩnh.
  const [plateIdx, setPlateIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPlateIdx((i) => (i + 1) % SHOWCASE_PLATES.length), 3200);
    return () => clearInterval(t);
  }, []);
  const plate = SHOWCASE_PLATES[plateIdx];

  // Register swaps the two blocks (info panel goes right, form goes left) — order is animated by
  // framer-motion's layout prop so the swap reads as a slide rather than an instant jump.
  const infoOrder = s === 'register' ? 2 : 1;
  const formOrder = s === 'register' ? 1 : 2;
  // The curved edge always faces the form panel, so it has to flip sides along with the swap.
  const infoRadius = s === 'register' ? '48px 0 0 48px' : '0 48px 48px 0';

  return (
    <section style={{ minHeight: '100vh', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap' }}>
        <motion.div className="auth-info" layout transition={SWAP_TRANSITION} style={{ order: infoOrder, zIndex: 1, position: 'relative', flex: '1 1 420px', background: 'var(--surface-hero)', borderRadius: infoRadius, padding: 'clamp(28px,4vw,64px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-8)', minHeight: '100vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <img src="/assets/logo-mark.png" alt="Duy Đinh" style={{ width: 38, height: 38, objectFit: 'contain' }} />
              <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>Duy Đinh</span>
            </div>
            <a href={routeFor('home')} onClick={goHome} className="pressable" style={{ display: 'flex', alignItems: 'center', gap: 4, font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)', textDecoration: 'none' }}>
              <ArrowLeft size={14} /> Trang chủ
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 0, gap: 'var(--space-4)' }}>
            <AnimatePresence mode="wait">
              <motion.div key={plateIdx}
                initial={{ opacity: 0, rotateY: -18, scale: 0.94 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: 18, scale: 0.94 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}
              >
                <div style={{ width: 'clamp(200px, 22vw, 260px)', filter: 'drop-shadow(0 18px 32px rgba(0,0,0,.18))' }}>
                  <PlateVisual size="lg" prov={plate.prov} seri={plate.seri} num={plate.num} shape={plate.shape} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>{plate.name}</span>
                    {plate.hot && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--status-danger)', color: 'var(--white)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)' }}><Flame size={11} fill="currentColor" /> HOT</span>
                    )}
                  </div>
                  <span style={{ font: 'var(--type-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>{plate.price}</span>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {SHOWCASE_PLATES.map((_, i) => (
                    <span key={i} style={{ width: i === plateIdx ? 16 : 5, height: 5, borderRadius: 'var(--radius-pill)', background: i === plateIdx ? 'var(--action-primary)' : 'var(--border-strong)', transition: 'all 250ms var(--ease-out)' }} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.p key={s === 'register' ? 'register-headline' : 'login-headline'}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={CONTENT_FADE}
              style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)', maxWidth: 420 }}>
              {s === 'register' ? 'Tạo tài khoản để lưu lại những biển số ưng ý.' : lastEmail ? `Chào mừng quay lại, ${lastEmail}` : 'Chào mừng quay lại — 3.240 biển số đang chờ bạn.'}
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
          <motion.div key={`${s}-${otpMode ? 'otp' : 'std'}`}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={CONTENT_FADE}
            style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {s === 'forgot' && <Eyebrow tone="blue">{`Bước ${st.step}/3`}</Eyebrow>}
            {otpMode && <Eyebrow tone="blue">{`Đăng nhập bằng OTP · Bước ${st.step}/2`}</Eyebrow>}
            <div>
              <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>
                {otpMode ? (st.step === 1 ? 'Đăng nhập bằng OTP' : 'Nhập mã xác thực') : authMeta[0]}
              </h1>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                {otpMode ? (st.step === 1 ? 'Không cần nhớ mật khẩu — nhận mã qua email.' : 'Mã 6 số đã được gửi tới email của bạn.') : authMeta[1]}
              </p>
            </div>

            {s === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={st.aName} error={st.aErr.name} onChange={setField('aName')} />
                <Input label="Mã giới thiệu (không bắt buộc)" placeholder="Mã CTV giới thiệu bạn" value={st.aReferral} error={st.aErr.referral} onChange={setField('aReferral')} />
                <div style={{ display: 'flex', gap: 8, background: 'var(--surface-sunken)', padding: 4, borderRadius: 'var(--radius-pill)' }}>
                  {['email', 'phone'].map((t) => (
                    <button key={t} type="button" onClick={() => patch({ aIdType: t, aErr: { ...st.aErr, email: '', phone: '' } })}
                      style={{ flex: 1, height: 34, border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)',
                        background: st.aIdType === t ? 'var(--action-primary)' : 'transparent', color: st.aIdType === t ? 'var(--white)' : 'var(--text-muted)' }}>
                      {t === 'email' ? 'Email' : 'Số điện thoại'}
                    </button>
                  ))}
                </div>
                {st.aIdType === 'phone' ? (
                  <Input label="Số điện thoại" placeholder="09xx xxx xxx" value={st.aPhone} error={st.aErr.phone} onChange={setField('aPhone')} />
                ) : (
                  <Input label="Email" placeholder="email@example.com" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} />
                )}
                <Input label="Mật khẩu" type="password" placeholder="Tối thiểu 8 ký tự, có chữ và số" value={st.aPw} error={st.aErr.pw} onChange={(e) => patch({ aPw: e.target.value, aErr: { ...st.aErr, pw: '', pw2: '' } })} />
                <Input label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu" value={st.aPw2} error={st.aErr.pw2} onChange={(e) => patch({ aPw2: e.target.value, aErr: { ...st.aErr, pw2: '' } })} />
                <Checkbox label="Tôi đồng ý với điều khoản sử dụng" checked={st.aAgree} onChange={(v) => patch({ aAgree: v })} />
                {st.aErr.agree && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Bạn cần đồng ý với điều khoản để tiếp tục.</span>}
              </div>
            )}
            {s === 'login' && !!st.a2faToken && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Nhập mã xác thực 2 lớp</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Mở app xác thực (Google Authenticator/Authy) và nhập mã 6 số, hoặc dùng 1 mã khôi phục.</span>
                <Input label="Mã xác thực" placeholder="123456" value={st.a2faCode || ''} error={st.aErr.otp} onChange={setField('a2faCode')} />
              </div>
            )}
            {s === 'login' && !otpMode && !st.a2faToken && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Input label="Email hoặc số điện thoại" placeholder="email@example.com hoặc 09xx xxx xxx" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} />
                <Input label="Mật khẩu" type="password" placeholder="••••••••" value={st.aPw} error={st.aErr.pw} onChange={setField('aPw')} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <Checkbox label="Ghi nhớ đăng nhập" checked={remember} onChange={setRemember} />
                  <button type="button" onClick={() => { patch({ aErr: {}, aPw: '' }); setOtpMode(true); }} style={{ border: 'none', background: 'none', padding: 0, font: 'var(--type-caption)', color: 'var(--action-primary)', cursor: 'pointer' }}>Đăng nhập bằng OTP</button>
                </div>
                <a href={routeFor('forgot')} onClick={(e) => { e.preventDefault(); go('forgot')(); }} style={{ alignSelf: 'flex-end', font: 'var(--type-caption)', color: 'var(--action-primary)', textDecoration: 'none' }}>Quên mật khẩu?</a>
              </div>
            )}
            {s === 'login' && otpMode && st.step === 1 && (
              <Input label="Email đã đăng ký" placeholder="email@example.com" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} />
            )}
            {s === 'login' && otpMode && st.step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mã xác thực 6 số</span>
                <OtpBoxes value={st.aOtp} onChange={(v) => patch({ aOtp: v, aErr: { ...st.aErr, otp: '' } })}
                  error={st.aErr.otp} disabled={/sai quá|khóa/.test(st.aErr.otp || '')} />
                {st.aErr.otp && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{st.aErr.otp}</span>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', font: 'var(--type-caption)' }}>
                  {resendIn > 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>Gửi lại mã sau {resendIn}s</span>
                  ) : (
                    <button type="button" onClick={handleResend} style={{ border: 'none', background: 'none', padding: 0, font: 'var(--type-caption)', color: 'var(--action-primary)', cursor: 'pointer' }}>Gửi lại mã</button>
                  )}
                </div>
              </div>
            )}
            {s === 'forgot' && st.step === 1 && <Input label="Email đã đăng ký" placeholder="email@example.com" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} />}
            {s === 'forgot' && st.step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mã xác thực 6 số</span>
                <OtpBoxes value={st.aOtp} onChange={(v) => patch({ aOtp: v, aErr: { ...st.aErr, otp: '' } })}
                  error={st.aErr.otp} disabled={/sai quá|khóa/.test(st.aErr.otp || '')} />
                {st.aErr.otp && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{st.aErr.otp}</span>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', font: 'var(--type-caption)' }}>
                  {resendIn > 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>Gửi lại mã sau {resendIn}s</span>
                  ) : (
                    <button type="button" onClick={handleResend} style={{ border: 'none', background: 'none', padding: 0, font: 'var(--type-caption)', color: 'var(--action-primary)', cursor: 'pointer' }}>Gửi lại mã</button>
                  )}
                </div>
              </div>
            )}
            {s === 'forgot' && st.step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Input label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" value={st.aPw} error={st.aErr.pw} onChange={setField('aPw')} />
                <Input label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu" value={st.aPw2} error={st.aErr.pw2} onChange={setField('aPw2')} />
              </div>
            )}

            {s === 'login' && !!st.a2faToken ? (
              <Button variant="primary" size="lg" fullWidth onClick={submitAdmin2fa}>Xác nhận</Button>
            ) : otpMode ? (
              <Button variant="primary" size="lg" fullWidth onClick={() => (st.step === 1 ? otpLoginRequest() : otpLoginVerify(remember))}>
                {st.step === 1 ? 'Gửi mã OTP' : 'Xác nhận & đăng nhập'}
              </Button>
            ) : (
              <Button variant="primary" size="lg" fullWidth onClick={() => submitAuth(remember)}>{authMeta[2]}</Button>
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
            {s === 'login' && !!st.a2faToken && (
              <Button variant="ghost" size="md" fullWidth onClick={() => patch({ a2faToken: null, a2faCode: '', aErr: {} })}>
                ← Quay lại đăng nhập
              </Button>
            )}

            {(s === 'register' || s === 'login') && !otpMode && !st.a2faToken && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: '4px 0' }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Hoặc</span>
                  <span style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
                </div>
                <GoogleSignInButton onCredential={handleGoogleCredential} />
                {linkErr && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)', textAlign: 'center' }}>{linkErr}</span>}
              </>
            )}

            {(s === 'register' || s === 'login') && !st.a2faToken && (
              <p style={{ margin: 0, textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                {s === 'register' ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
                <a href={routeFor(s === 'register' ? 'login' : 'register')} onClick={(e) => { e.preventDefault(); go(s === 'register' ? 'login' : 'register')(); }} style={{ color: 'var(--action-primary)', textDecoration: 'none' }}>{s === 'register' ? 'Đăng nhập' : 'Đăng ký ngay'}</a>
              </p>
            )}
          </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <Modal open={!!googleLinkPending} onClose={() => setGoogleLinkPending(null)} title="Xác nhận liên kết Google" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Email <b>{googleLinkPending?.email}</b> đã có tài khoản. Nhập mã OTP vừa gửi tới email để xác nhận liên kết với Google.
          </p>
          <Input label="Mã OTP" value={linkOtp} onChange={(e) => setLinkOtp(e.target.value)} error={linkErr} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setGoogleLinkPending(null)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={confirmGoogleLink} loading={googleConfirmLink.isPending}>Xác nhận</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
