import { useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { Input } from './index.jsx';
import * as authApi from '../services/authService.js';

// Bảo mật — bật/tắt xác thực 2 lớp (TOTP) cho tài khoản admin/staff đang đăng nhập.
// Tùy chọn, không bắt buộc — mỗi người tự quản lý qua nút "Bảo mật" ở sidebar.
export default function TwoFactorSettingsModal({ open, onClose, twoFactorEnabled, notify, onChanged }) {
  const [step, setStep] = useState('idle'); // idle | setup | recovery
  const [secret, setSecret] = useState('');
  const [otpAuthUri, setOtpAuthUri] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => { setStep('idle'); setSecret(''); setOtpAuthUri(''); setCode(''); setPassword(''); setRecoveryCodes([]); setErr(''); };
  const close = () => { reset(); onClose(); };

  const startSetup = async () => {
    setBusy(true); setErr('');
    try {
      const data = await authApi.setup2fa();
      setSecret(data.secret);
      setOtpAuthUri(data.otpAuthUri);
      setStep('setup');
    } catch (e) { setErr(e.message || 'Lỗi khởi tạo 2FA.'); }
    setBusy(false);
  };

  const confirmEnable = async () => {
    if (!/^\d{6}$/.test(code.trim())) { setErr('Nhập mã 6 số từ app xác thực.'); return; }
    setBusy(true); setErr('');
    try {
      const data = await authApi.enable2fa(code.trim());
      setRecoveryCodes(data.recoveryCodes);
      setStep('recovery');
      notify?.('Đã bật xác thực 2 lớp');
      onChanged?.();
    } catch (e) { setErr(e.message || 'Mã không đúng.'); }
    setBusy(false);
  };

  const confirmDisable = async () => {
    if (!password.trim()) { setErr('Nhập mật khẩu để xác nhận.'); return; }
    setBusy(true); setErr('');
    try {
      await authApi.disable2fa(password.trim());
      notify?.('Đã tắt xác thực 2 lớp');
      onChanged?.();
      close();
    } catch (e) { setErr(e.message || 'Mật khẩu không đúng.'); }
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={close} title="Xác thực 2 lớp (2FA)" maxWidth="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {twoFactorEnabled && step === 'idle' && (
          <>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Xác thực 2 lớp đang <b>bật</b>. Nhập mật khẩu để tắt.</p>
            <Input label="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={err} />
            <Button variant="danger" size="md" onClick={confirmDisable} disabled={busy}>{busy ? 'Đang xử lý…' : 'Tắt xác thực 2 lớp'}</Button>
          </>
        )}

        {!twoFactorEnabled && step === 'idle' && (
          <>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Bật xác thực 2 lớp để tăng bảo mật tài khoản — cần app xác thực (Google Authenticator, Authy...).</p>
            {err && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err}</span>}
            <Button variant="primary" size="md" onClick={startSetup} disabled={busy}>{busy ? 'Đang khởi tạo…' : 'Bắt đầu thiết lập'}</Button>
          </>
        )}

        {step === 'setup' && (
          <>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Mở app xác thực, chọn "Nhập mã thủ công" và dán mã bên dưới:</p>
            <code style={{ display: 'block', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', font: 'var(--type-body-sm)', wordBreak: 'break-all', userSelect: 'all' }}>{secret}</code>
            <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Loại: Time-based (TOTP), 6 số, chu kỳ 30 giây. URI: <span style={{ wordBreak: 'break-all' }}>{otpAuthUri}</span></p>
            <Input label="Nhập mã 6 số app vừa hiện" value={code} onChange={(e) => setCode(e.target.value)} error={err} />
            <Button variant="primary" size="md" onClick={confirmEnable} disabled={busy}>{busy ? 'Đang xác nhận…' : 'Xác nhận & bật 2FA'}</Button>
          </>
        )}

        {step === 'recovery' && (
          <>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Lưu lại 10 mã khôi phục này — mỗi mã dùng được 1 lần khi mất điện thoại. Sẽ không hiện lại.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', fontFamily: 'monospace', font: 'var(--type-body-sm)' }}>
              {recoveryCodes.map((c) => <span key={c}>{c}</span>)}
            </div>
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard?.writeText(recoveryCodes.join('\n')).then(() => notify?.('Đã sao chép mã khôi phục')).catch(() => {}); }}>Sao chép tất cả</Button>
            <Button variant="primary" size="md" onClick={close}>Đã lưu, đóng</Button>
          </>
        )}
      </div>
    </Modal>
  );
}
