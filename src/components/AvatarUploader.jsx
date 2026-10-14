import { useRef, useState } from 'react';
import Button from './Button.jsx';
import { apiClient } from '../services/apiClient.js';
import { loadAuth, saveAuth } from '../lib/authStore.js';

function initialOf(user) {
  const src = user?.fullName?.trim() || user?.identifier?.trim() || '';
  return src ? src[0].toUpperCase() : '?';
}

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp';

// Avatar tròn + nút đổi ảnh — validate size/type trước khi gửi, upload qua /api/auth/me/avatar
// (Cloudinary folder "avatars" ở backend), merge user mới trả về vào authStore để Header/Profile
// cập nhật ngay không cần F5.
export default function AvatarUploader({ user, onUserUpdate, notify }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      notify?.('Chỉ nhận ảnh .jpg, .png hoặc .webp');
      return;
    }
    if (file.size > MAX_SIZE) {
      notify?.('Ảnh tối đa 2 MB');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const updated = await apiClient.upload('/api/auth/me/avatar', fd);
      const auth = loadAuth();
      if (auth) saveAuth({ ...auth, user: updated });
      onUserUpdate?.(updated);
      notify?.('Đã cập nhật ảnh đại diện.');
    } catch (e) {
      notify?.(e.message || 'Tải ảnh lên thất bại, thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
        background: 'var(--action-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--border-hairline)',
      }}>
        {user?.avatarUrl
          ? <img src={user.avatarUrl} alt="Ảnh đại diện" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ font: 'var(--type-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-inverse)' }}>{initialOf(user)}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? 'Đang tải…' : 'Đổi ảnh đại diện'}
        </Button>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>JPG, PNG hoặc WebP, tối đa 2MB.</span>
      </div>
      <input ref={fileRef} type="file" accept={ACCEPT} onChange={(e) => onFile(e.target.files[0])} style={{ display: 'none' }} />
    </div>
  );
}
