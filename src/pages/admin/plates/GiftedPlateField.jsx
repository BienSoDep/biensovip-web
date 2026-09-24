import { useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useAdminPlates } from '../../../services/adminPlates.js';

// Gõ biển tặng kèm → sổ xuống gợi ý biển có sẵn trong hệ thống để chọn thay vì gõ tay dễ sai chính
// tả (biển không khớp thì tính năng tặng kèm ở trang chi tiết không tìm ra biển tương ứng).
export default function GiftedPlateField({ value, onChange, excludeId }) {
  const [open, setOpen] = useState(false);
  const [debouncedValue] = useDebouncedValue(value, 300);
  const keyword = (debouncedValue || '').trim();
  const { data } = useAdminPlates({ keyword, page: 1, perPage: 8 });
  const suggestions = (data?.items || []).filter((p) => p.id !== excludeId);

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Tặng kèm biển số (VD ô tô tặng biển xe máy)</span>
      <input
        value={value || ''}
        placeholder="43AB-668.88 (để trống nếu không tặng)"
        onChange={(e) => { onChange(e); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{ height: 40, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 14px', font: 'var(--type-body)', color: 'var(--text-strong)', outline: 'none' }}
      />
      {open && keyword.length >= 2 && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--white)', borderRadius: 'var(--radius-field)', boxShadow: 'var(--shadow-4)', maxHeight: 220, overflow: 'auto' }}>
          {suggestions.map((p) => (
            <button key={p.id} type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange({ target: { value: p.plateNumber } }); setOpen(false); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}>
              {p.plateNumber}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}
