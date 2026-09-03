import { useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { Input } from './index.jsx';
import * as authApi from '../services/authService.js';

// Email dự phòng — mỗi admin/staff tự chọn + tự xác thực OTP. Đã xác thực thì dùng để tự
// "Quên mật khẩu" (không cần nhờ super-admin đổi hộ nữa).
export default function RecoveryEmailModal({ open, onClose, recoveryEmail, recoveryEmailVerified, notify, onChanged }) {
  const [step, setStep] = useState('idle'); // idle | otp
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => { setStep('idle'); setEmail(''); setCode(''); setErr(''); };
  const close = () => { reset(); onClose(); };

  const sendOtp = async () => {
    if (!email.trim()) { setErr('Nhập email dự phòng.'); return; }
    setBusy(true); setErr('');
    try {
      await authApi.requestRecoveryEmailOtp(email.trim());
      setStep('otp');
      notify?.('Đã gửi mã xác thực tới email');
    } catch (e) { setErr(e.message || 'Lỗi gửi mã xác thực.'); }
    setBusy(false);
  };

  const confirmVerify = async () => {
    if (!/^\d{6}$/.test(code.trim())) { setErr('Nhập mã 6 số vừa nhận qua email.'); return; }
    setBusy(true); setErr('');
    try {
      await authApi.verifyRecoveryEmail(email.trim(), code.trim());
      notify?.('Đã liên kết email dự phòng');
      onChanged?.();
      close();
    } catch (e) { setErr(e.message || 'Mã không đúng.'); }
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={close} title="Email dự phòng" maxWidth="420px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {recoveryEmailVerified && step === 'idle' && (
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Đã liên kết: <b>{recoveryEmail}</b>. Nhập email mới bên dưới để đổi.
          </p>
        )}
        {step === 'idle' && (
          <>
            <Input label="Email dự phòng" type="email" placeholder="you@example.com" value={email} error={err} onChange={(e) => { setEmail(e.target.value); setErr(''); }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="md" onClick={close}>Hủy</Button>
              <Button variant="primary" size="md" onClick={sendOtp} loading={busy}>Gửi mã xác thực</Button>
            </div>
          </>
        )}
        {step === 'otp' && (
          <>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Nhập mã 6 số vừa gửi tới <b>{email}</b>.</p>
            <Input label="Mã xác thực" placeholder="000000" value={code} error={err} onChange={(e) => { setCode(e.target.value); setErr(''); }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="md" onClick={() => setStep('idle')}>Quay lại</Button>
              <Button variant="primary" size="md" onClick={confirmVerify} loading={busy}>Xác nhận</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
