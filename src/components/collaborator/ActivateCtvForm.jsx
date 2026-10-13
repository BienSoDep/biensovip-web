import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../Button.jsx';
import { Input } from '../index.jsx';
import { useBecomeCollaborator } from '../../services/collaborators.js';
import { refreshToken, requestEmailVerifyOtp, confirmEmailVerifyOtp } from '../../services/authService.js';

export default function ActivateCtvForm({ onActivated }) {
  const become = useBecomeCollaborator();
  const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);

  const sendOtp = async () => {
    setOtpBusy(true);
    try {
      await requestEmailVerifyOtp();
      setOtpSent(true);
      toast.success('Đã gửi mã xác thực tới email của bạn.');
    } catch (e) {
      toast.error(e?.message || 'Gửi mã thất bại, thử lại sau.');
    } finally {
      setOtpBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (otpCode.trim().length !== 6) { toast.error('Nhập đủ 6 số của mã xác thực.'); return; }
    setOtpBusy(true);
    try {
      await confirmEmailVerifyOtp(otpCode.trim());
      const data = await refreshToken();
      setOtpSent(false);
      setOtpCode('');
      // Backend tự kích hoạt CTV ngay khi email verified — bỏ qua bước bấm "Kích hoạt CTV" thủ công.
      if (data?.user?.isCollaborator) {
        toast.success('Xác thực email thành công. Bạn đã trở thành Cộng tác viên!');
      } else {
        toast.success('Xác thực email thành công.');
      }
      onActivated();
    } catch (e) {
      toast.error(e?.message || 'Mã xác thực không đúng hoặc đã hết hạn.');
    } finally {
      setOtpBusy(false);
    }
  };

  const activate = async () => {
    setBusy(true);
    try {
      await become.mutateAsync({});
      await refreshToken();
      toast.success('Bạn đã trở thành Cộng tác viên');
      onActivated();
    } catch (e) {
      const code = e?.code;
      // Chưa verify email → backend chặn. Tự gửi mã luôn rồi mở ô nhập mã, để user
      // không phải đoán bấm nút nào tiếp theo (trước đây form bị khoá cứng ở đây).
      if (code === 'EMAIL_NOT_VERIFIED') {
        try {
          await requestEmailVerifyOtp();
          setOtpSent(true);
          toast.success('Đã gửi mã xác thực tới email của bạn. Nhập mã để hoàn tất.');
        } catch (err) {
          toast.error(err?.message || 'Gửi mã thất bại, thử lại sau.');
        }
      } else {
        toast.error(e?.message || 'Kích hoạt thất bại, thử lại sau.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Trở thành Cộng tác viên</h3>
      <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
        Bấm Kích hoạt CTV để bắt đầu. Thông tin ngân hàng nhận hoa hồng điền sau tại trang CTV.
      </p>

      {otpSent ? (
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Input label="Mã xác thực (6 số)" placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          <Button variant="primary" size="md" onClick={confirmOtp} disabled={otpBusy}>{otpBusy ? 'Đang xác nhận...' : 'Xác nhận'}</Button>
          <Button variant="ghost" size="md" onClick={sendOtp} disabled={otpBusy}>Gửi lại mã</Button>
        </div>
      ) : (
        <Button variant="primary" size="lg" onClick={activate} disabled={busy} style={{ alignSelf: 'flex-start', minWidth: 220, font: 'var(--type-title-3)', padding: '16px 32px' }}>
          {busy ? 'Đang kích hoạt...' : 'Kích hoạt CTV'}
        </Button>
      )}
    </div>
  );
}
