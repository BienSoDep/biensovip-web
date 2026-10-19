import { useRef, useState } from 'react';
import Button from '../Button.jsx';
import { Input } from '../ui/Input.jsx';
import { apiClient } from '../../services/apiClient.js';

// Trường nhập URL ảnh — 2 cách: dán link trực tiếp HOẶC tải ảnh lên (tự đưa qua Cloudinary → điền link).
// Dùng chung cho mọi chỗ admin gán link ảnh (thumbnail, ảnh đại diện, ảnh trong nội dung…).
export function ImageUrlInput({ label, value, onChange, placeholder, hint }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.upload('/api/admin/plates/upload', fd);
      onChange(res.url);
    } catch (e) {
      // eslint-disable-next-line no-alert
      window.alert(e.message || 'Lỗi tải ảnh lên');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>}
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Input value={value} onChange={onChange} placeholder={placeholder} />
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          style={{ whiteSpace: 'nowrap' }}
        >
          {busy ? 'Đang tải…' : 'Tải ảnh lên'}
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onFile(e.target.files[0])}
        style={{ display: 'none' }}
      />
      {hint && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
}

export default ImageUrlInput;
