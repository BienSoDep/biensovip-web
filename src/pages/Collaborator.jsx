import { useState } from 'react';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { Input, Badge } from '../components/index.jsx';
import { validatePhone } from '../lib/phone.js';
import { useRegisterCollaborator, useCollaboratorDashboard, useCollaboratorCustomers } from '../services/collaborators.js';
import { useCollaboratorLogin, useCollaboratorLogout, useCollaboratorForgotPasswordRequestOtp, useCollaboratorForgotPasswordReset, useCollaboratorGoogleLogin, useCollaboratorGoogleConfirmLink } from '../services/collaboratorAuth.js';
import { loadAuth } from '../lib/authStore.js';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { useGmailStatus, useGmailOAuthUrl, useUnlinkGmail } from '../services/gmailLink.js';
import { SkeletonCard } from '../components/Skeleton.jsx';

const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

// Fallback copy cho trình duyệt cũ / context không có Clipboard API (vd HTTP không phải HTTPS).
function fallbackCopy(text, onOk) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) onOk();
  } catch { /* trình duyệt không hỗ trợ — bỏ qua, không crash */ }
}

// P1.1 auto-active: sau khi đăng ký xong, tự đăng nhập luôn (tài khoản active tức thì, không chờ admin).
// Email trở thành định danh đăng nhập — bắt buộc để auto-login vào dashboard ngay.
function RegisterForm({ onLoggedIn }) {
  const [f, setF] = useState({});
  const [err, setErr] = useState({});
  const register = useRegisterCollaborator();
  const login = useCollaboratorLogin();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    const e2 = {};
    if (!(f.fullName || '').trim()) e2.fullName = 'Vui lòng nhập họ tên.';
    if (!(f.email || '').trim()) e2.email = 'Vui lòng nhập email để đăng nhập.';
    else if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e2.email = 'Email không đúng định dạng.';
    if (!validatePhone(f.phone || '')) e2.phone = 'Số điện thoại chưa đúng định dạng.';
    if (!(f.bankAccount || '').trim()) e2.bankAccount = 'Vui lòng nhập số tài khoản nhận hoa hồng.';
    if (!(f.password || '').trim() || f.password.length < 8) e2.password = 'Mật khẩu cần ít nhất 8 ký tự.';
    if (f.password !== f.confirmPassword) e2.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    if (Object.keys(e2).length) { setErr(e2); return; }
    setErr({});
    const body = { fullName: f.fullName.trim(), phone: f.phone.trim(), email: f.email.trim(), bankAccount: f.bankAccount.trim(), password: f.password };
    register.mutate(body, {
      // Auto-active → đăng ký xong là active, tự đăng nhập vào dashboard ngay.
      onSuccess: () => login.mutate({ email: body.email, password: body.password }, {
        onSuccess: () => onLoggedIn(),
        onError: () => onLoggedIn(), // đăng ký đã thành công; nếu auto-login trục trặc vẫn thả user về xem hồ sơ
      }),
      onError: (e) => {
        if (e?.code === 'DUPLICATE_PHONE') setErr({ phone: 'Số điện thoại đã đăng ký CTV.' });
        else if (e?.code === 'DUPLICATE_EMAIL') setErr({ email: 'Email đã đăng ký CTV.' });
        else if (e?.code === 'PASSWORD_TOO_SHORT') setErr({ password: 'Mật khẩu cần ít nhất 8 ký tự.' });
        else setErr({ form: e?.message || 'Đăng ký thất bại, thử lại.' });
      },
    });
  };

  return (
    <section style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-7) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Đăng ký làm CTV</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Giới thiệu khách mua biển số, nhận hoa hồng trên mỗi giao dịch thành công.</span>
        </div>
        <Input label="Họ tên" placeholder="Nguyễn Văn A" value={f.fullName || ''} onChange={set('fullName')} error={err.fullName} />
        <Input label="Số điện thoại" placeholder="0905 221 334" value={f.phone || ''} onChange={set('phone')} error={err.phone} />
        <Input label="Email" placeholder="ban@gmail.com" value={f.email || ''} onChange={set('email')} error={err.email} />
        <Input label="Số tài khoản nhận hoa hồng" placeholder="Ngân hàng · số tài khoản" value={f.bankAccount || ''} onChange={set('bankAccount')} error={err.bankAccount} />
        <Input label="Mật khẩu" type="password" placeholder="Ít nhất 8 ký tự" value={f.password || ''} onChange={set('password')} error={err.password} />
        <Input label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu" value={f.confirmPassword || ''} onChange={set('confirmPassword')} error={err.confirmPassword} />
        {err.form && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err.form}</span>}
        <Button variant="primary" size="lg" fullWidth onClick={submit} loading={register.isPending || login.isPending}>Đăng ký ngay</Button>
      </div>
    </section>
  );
}

function LoginForm({ onLoggedIn, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState({});
  const login = useCollaboratorLogin();

  // UC29 — Đăng nhập Google cho CTV đã đăng ký (UC28). Không tự tạo CTV mới (404 nếu email chưa đăng ký).
  const googleLogin = useCollaboratorGoogleLogin();
  const googleConfirmLink = useCollaboratorGoogleConfirmLink();
  const [googleLinkPending, setGoogleLinkPending] = useState(null);
  const [linkOtp, setLinkOtp] = useState('');
  const [googleErr, setGoogleErr] = useState('');

  const handleGoogleCredential = (idToken) => {
    setGoogleErr('');
    googleLogin.mutate(idToken, {
      onSuccess: () => onLoggedIn(),
      onError: (e) => {
        if (e?.code === 'LINK_CONFIRMATION_REQUIRED') {
          try {
            const payload = JSON.parse(atob(idToken.split('.')[1]));
            setGoogleLinkPending({ email: payload.email, idToken });
          } catch { setGoogleLinkPending({ email: '', idToken }); }
        } else if (e?.code === 'GOOGLE_EMAIL_NOT_VERIFIED') {
          setGoogleErr('Email Google chưa được xác thực.');
        } else {
          setGoogleErr(e?.message || 'Đăng nhập Google thất bại.');
        }
      },
    });
  };

  const confirmGoogleLink = () => {
    if (!linkOtp.trim()) { setGoogleErr('Nhập mã OTP đã gửi tới email.'); return; }
    googleConfirmLink.mutate(
      { email: googleLinkPending.email, otpCode: linkOtp.trim(), idToken: googleLinkPending.idToken },
      {
        onSuccess: () => { setGoogleLinkPending(null); onLoggedIn(); },
        onError: (e) => setGoogleErr(e?.message || 'Xác nhận thất bại.'),
      },
    );
  };

  const submit = () => {
    const e2 = {};
    if (!email.trim()) e2.email = 'Vui lòng nhập email.';
    if (!password) e2.password = 'Vui lòng nhập mật khẩu.';
    if (Object.keys(e2).length) { setErr(e2); return; }
    setErr({});
    login.mutate({ email: email.trim(), password }, {
      onSuccess: () => onLoggedIn(),
      onError: (e) => {
        if (e?.code === 'ACCOUNT_LOCKED') setErr({ form: 'Tài khoản đã bị khóa.' });
        else if (e?.code === 'INVALID_CREDENTIALS') setErr({ form: 'Email hoặc mật khẩu không đúng.' });
        else setErr({ form: e?.message || 'Đăng nhập thất bại.' });
      },
    });
  };

  return (
    <section style={{ maxWidth: 560, margin: '0 auto', padding: '0 var(--pad-page) var(--space-9)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Đăng nhập tài khoản CTV</span>
        <Input label="Email" placeholder="ban@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} error={err.email} />
        <Input label="Mật khẩu" type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} error={err.password} />
        {err.form && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err.form}</span>}
        <Button variant="primary" size="md" onClick={submit} loading={login.isPending}>Đăng nhập</Button>
        <Button variant="ghost" size="sm" onClick={onForgotPassword}>Quên mật khẩu?</Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: '4px 0' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Hoặc</span>
          <span style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
        </div>
        <GoogleSignInButton onCredential={handleGoogleCredential} />
        {googleErr && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)', textAlign: 'center' }}>{googleErr}</span>}
      </div>

      <Modal open={!!googleLinkPending} onClose={() => setGoogleLinkPending(null)} title="Xác nhận liên kết Google" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Email <b>{googleLinkPending?.email}</b> đã có tài khoản CTV. Nhập mã OTP vừa gửi tới email để xác nhận liên kết với Google.
          </p>
          <Input label="Mã OTP" value={linkOtp} onChange={(e) => setLinkOtp(e.target.value)} error={googleErr} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setGoogleLinkPending(null)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={confirmGoogleLink} loading={googleConfirmLink.isPending}>Xác nhận</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

function ForgotPasswordForm({ onDone }) {
  const [step, setStep] = useState('request'); // request | reset
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const requestOtp = useCollaboratorForgotPasswordRequestOtp();
  const reset = useCollaboratorForgotPasswordReset();

  const sendOtp = () => {
    if (!email.trim()) { setMsg('Vui lòng nhập email.'); return; }
    requestOtp.mutate(email.trim(), {
      onSuccess: () => { setStep('reset'); setMsg('Đã gửi mã OTP tới email nếu tài khoản tồn tại.'); },
    });
  };

  const doReset = () => {
    if (!otpCode.trim() || newPassword.length < 8) { setMsg('Nhập đủ mã OTP và mật khẩu mới (≥8 ký tự).'); return; }
    reset.mutate({ email: email.trim(), otpCode: otpCode.trim(), newPassword }, {
      onSuccess: () => onDone(),
      onError: (e) => setMsg(e?.message || 'Đặt lại mật khẩu thất bại.'),
    });
  };

  return (
    <section style={{ maxWidth: 560, margin: '0 auto', padding: '0 var(--pad-page) var(--space-9)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Quên mật khẩu</span>
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {step === 'request' ? (
          <Button variant="primary" size="md" onClick={sendOtp} loading={requestOtp.isPending}>Gửi mã OTP</Button>
        ) : (
          <>
            <Input label="Mã OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
            <Input label="Mật khẩu mới" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Button variant="primary" size="md" onClick={doReset} loading={reset.isPending}>Đặt lại mật khẩu</Button>
          </>
        )}
        {msg && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{msg}</span>}
        <Button variant="ghost" size="sm" onClick={onDone}>Quay lại</Button>
      </div>
    </section>
  );
}


// UC30 — khu "Cài đặt tài khoản": liên kết/hủy liên kết Gmail cá nhân để gửi email cho khách.
// Chỉ hiện khi CTV đăng nhập bằng JWT (loadAuth có token) — chế độ tra-cứu-bằng-mã cũ
// không đủ tin cậy để liên kết OAuth nhạy cảm này.
function GmailLinkSection() {
  const isLoggedIn = Boolean(loadAuth()?.accessToken);
  const { data: status, isLoading } = useGmailStatus();
  const oauthUrl = useGmailOAuthUrl();
  const unlink = useUnlinkGmail();

  if (!isLoggedIn) {
    return (
      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-5) var(--gutter-card)' }}>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Đăng nhập bằng tài khoản CTV (email/mật khẩu hoặc Google) để liên kết Gmail gửi email cho khách.
        </span>
      </div>
    );
  }

  const startLink = () => {
    oauthUrl.mutate(undefined, { onSuccess: (data) => { window.location.href = data.url; } });
  };

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Liên kết Gmail để gửi email</span>
      {isLoading ? (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</span>
      ) : status?.linked ? (
        <>
          {status.needsRelink && (
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-field)', background: 'var(--status-warning-bg, #FFF7ED)', border: '1px solid var(--status-warning, #F59E0B)' }}>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--status-warning-ink, #B45309)' }}>
                Liên kết Gmail đã hết hạn hoặc bị thu hồi. Vui lòng liên kết lại để tiếp tục gửi email từ địa chỉ cá nhân.
              </span>
            </div>
          )}
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Đã liên kết: <b style={{ color: 'var(--text-strong)' }}>{status.email}</b>
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {status.needsRelink && <Button variant="primary" size="sm" onClick={startLink} loading={oauthUrl.isPending}>Liên kết lại</Button>}
            <Button variant="ghost" size="sm" onClick={() => unlink.mutate()} loading={unlink.isPending}>Hủy liên kết</Button>
          </div>
        </>
      ) : (
        <>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa liên kết Gmail — soạn email cho khách sẽ dùng địa chỉ mặc định của hệ thống.</span>
          <Button variant="primary" size="sm" onClick={startLink} loading={oauthUrl.isPending}>Liên kết Google để gửi email</Button>
        </>
      )}
    </div>
  );
}

function DashboardBody({ data, onReset }) {
  const [copied, setCopied] = useState(false);
  const customers = useCollaboratorCustomers(data.status === 'active');
  const copyLink = () => {
    const onOk = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(data.referralUrl).then(onOk).catch(() => fallbackCopy(data.referralUrl, onOk));
    } else {
      fallbackCopy(data.referralUrl, onOk);
    }
  };

  if (data.status === 'locked') {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Badge tone="rose">Bị khóa</Badge>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Tài khoản CTV đã bị khóa. Liên hệ admin để biết thêm.
        </span>
        <Button variant="ghost" size="sm" onClick={onReset}>Đăng xuất</Button>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ background: 'var(--surface-inverse)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--white)' }}>Xin chào, {data.fullName}</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'rgba(255,255,255,.66)' }}>Mã giới thiệu của bạn</span>
        </div>
        <Badge tone="mint">{data.referralCode}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--gutter-section)' }}>
        {[
          ['Lượt click', String(data.clicks), 'var(--text-strong)'],
          ['Khách đã giới thiệu', String(data.referredUserCount ?? 0), 'var(--status-success)'],
          ['Giao dịch thành công', String(data.successfulDeals), 'var(--status-success)'],
          ['Chờ duyệt', money(data.pending), 'var(--status-warning)'],
          ['Đã duyệt / đã chi trả', money(data.approved + data.paid), 'var(--status-success)'],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', minWidth: 0 }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Link giới thiệu của bạn</span>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{data.referralUrl}</span>
        </div>
        <Button variant="primary" size="md" onClick={copyLink}>{copied ? 'Đã sao chép' : 'Sao chép link'}</Button>
      </div>

      {data.recent?.length > 0 && (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Giao dịch gần đây</span>
          {data.recent.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', padding: '8px 0', borderTop: '1px solid var(--grey-100)' }}>
              <span style={{ font: 'var(--type-body-sm)' }}>{r.plateNumber || '—'}</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{money(r.amount)}</span>
              <Badge tone={r.status === 'paid' ? 'mint' : r.status === 'approved' ? 'blue' : 'amber'}>{r.status}</Badge>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Khách hàng đã giới thiệu</span>
        {customers.isLoading && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</span>}
        {!customers.isLoading && customers.isError && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không tải được danh sách khách.</span>}
        {!customers.isLoading && !customers.isError && customers.data?.users?.length === 0 && (
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có khách nào đăng ký bằng mã giới thiệu của bạn.</span>
        )}
        {customers.data?.users?.map((u) => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', padding: '8px 0', borderTop: '1px solid var(--grey-100)' }}>
            <span style={{ font: 'var(--type-body-sm)' }}>{u.fullName || '—'}</span>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{u.phone || '—'}</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        ))}
      </div>

      <GmailLinkSection />

      <Button variant="ghost" size="sm" onClick={onReset}>Đăng xuất</Button>
    </section>
  );
}

function Dashboard({ onReset }) {
  const { data, isLoading, isError } = useCollaboratorDashboard(true);

  if (isLoading) {
    return (
      <section style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <SkeletonCard height={120} /><SkeletonCard height={200} />
      </section>
    );
  }
  if (isError || !data) {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-9) var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không tải được hồ sơ CTV. Vui lòng đăng nhập lại.</span>
        <Button variant="ghost" size="sm" onClick={onReset}>Đăng nhập lại</Button>
      </section>
    );
  }
  return <DashboardBody data={data} onReset={onReset} />;
}

export default function Collaborator({ go }) {
  // P2 — CTV gộp vào User: "đã đăng nhập CTV" = có token User + user này là CTV (is_collaborator).
  const isCtv = () => Boolean(loadAuth()?.accessToken) && Boolean(loadAuth()?.user?.isCollaborator);
  const [loggedIn, setLoggedIn] = useState(() => isCtv());
  const [mode, setMode] = useState('register'); // register | login | forgot
  const collaboratorLogout = useCollaboratorLogout();

  const logout = () => { collaboratorLogout.mutate(undefined, { onSettled: () => setLoggedIn(false) }); };

  if (loggedIn) return <Dashboard onReset={logout} />;

  if (mode === 'login') {
    return (
      <>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) 0', display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="sm" onClick={() => setMode('register')}>← Đăng ký mới</Button>
        </div>
        <LoginForm
          onLoggedIn={() => setLoggedIn(true)}
          onForgotPassword={() => setMode('forgot')}
        />
      </>
    );
  }

  if (mode === 'forgot') {
    return <ForgotPasswordForm onDone={() => setMode('login')} />;
  }

  return (
    <>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) 0', textAlign: 'right' }}>
        <Button variant="ghost" size="sm" onClick={() => setMode('login')}>Đã có tài khoản? Đăng nhập</Button>
      </div>
      <RegisterForm onLoggedIn={() => setLoggedIn(true)} />
    </>
  );
}
