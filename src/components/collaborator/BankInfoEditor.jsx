import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../Button.jsx';
import { Input, Select } from '../index.jsx';
import { useUpdateBankInfo, useUpdateMessagingProfile } from '../../services/collaborators.js';
import { refreshToken } from '../../services/authService.js';
import { fetchVietQrBanks, vietQrImageUrl } from '../../lib/vietqr.js';

export function BankInfoEditor({ onDone }) {
  const updateBank = useUpdateBankInfo();
  const [bankAccount, setBankAccount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [banks, setBanks] = useState([]);

  useEffect(() => { fetchVietQrBanks().then(setBanks); }, []);

  const save = async () => {
    if (!bankAccount.trim()) { toast.error('Nhập số tài khoản.'); return; }
    if (!bankCode) { toast.error('Chọn ngân hàng.'); return; }
    try {
      await updateBank.mutateAsync({ bankAccount: bankAccount.trim(), bankCode, bankAccountHolder: bankAccountHolder.trim() || undefined });
      await refreshToken();
      toast.success('Đã cập nhật thông tin ngân hàng.');
      onDone();
    } catch (e) {
      toast.error(e?.message || 'Cập nhật thất bại, thử lại sau.');
    }
  };

  const qrPreviewUrl = vietQrImageUrl(bankCode, bankAccount.trim());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Select label="Ngân hàng" value={bankCode} options={banks} onChange={setBankCode} />
      <Input label="Số tài khoản" placeholder="Số tài khoản ngân hàng" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
      <Input label="Tên chủ tài khoản (không bắt buộc)" placeholder="NGUYEN VAN A" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} />
      {qrPreviewUrl && (
        <img src={qrPreviewUrl} alt="QR chuyển khoản" style={{ width: 140, height: 140, borderRadius: 'var(--radius-field)', alignSelf: 'flex-start' }} />
      )}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="primary" size="md" onClick={save} disabled={updateBank.isPending}>{updateBank.isPending ? 'Đang lưu...' : 'Lưu'}</Button>
        <Button variant="ghost" size="md" onClick={onDone} disabled={updateBank.isPending}>Hủy</Button>
      </div>
    </div>
  );
}

export function MessagingProfileEditor({ initialTitle, initialZaloLink, onDone }) {
  const updateProfile = useUpdateMessagingProfile();
  const [ctvTitle, setCtvTitle] = useState(initialTitle || '');
  const [ctvZaloLink, setCtvZaloLink] = useState(initialZaloLink || '');

  const save = async () => {
    try {
      await updateProfile.mutateAsync({ ctvTitle: ctvTitle.trim() || undefined, ctvZaloLink: ctvZaloLink.trim() || undefined });
      toast.success('Đã cập nhật hồ sơ nhắn tin.');
      onDone();
    } catch (e) {
      toast.error(e?.message || 'Cập nhật thất bại, thử lại sau.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Input label="Chức danh tự đặt (không bắt buộc)" placeholder="VD: Tư vấn viên biển số phong thủy" value={ctvTitle} onChange={(e) => setCtvTitle(e.target.value)} />
      <Input label="Link Zalo cá nhân (không bắt buộc)" placeholder="VD: zalo.me/0912xxxxxx" value={ctvZaloLink} onChange={(e) => setCtvZaloLink(e.target.value)} />
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="primary" size="md" onClick={save} disabled={updateProfile.isPending}>{updateProfile.isPending ? 'Đang lưu...' : 'Lưu'}</Button>
        <Button variant="ghost" size="md" onClick={onDone} disabled={updateProfile.isPending}>Hủy</Button>
      </div>
    </div>
  );
}
