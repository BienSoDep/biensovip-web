import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Bộ lọc nhiều lựa chọn có số biển bên cạnh từng mục (counts = { [id]: số }, undefined khi chưa tải).
// value: mảng id đã chọn. Mục đã chọn luôn hiện kể cả khi số = 0.
export default function MultiFilter({ label, options, value, onChange, counts, searchable = false }) {
  const [open, setOpen] = useState(false);
  const [kw, setKw] = useState('');
  const sel = new Set(value);
  const shown = options.filter((o) => !kw || o.label.toLowerCase().includes(kw.toLowerCase()));
  const toggle = (id) => onChange(sel.has(id) ? value.filter((x) => x !== id) : [...value, id]);
  const summary = value.length === 0 ? 'Tất cả' : value.length === 1 ? (options.find((o) => o.value === value[0])?.label || '1 mục') : `${value.length} đã chọn`;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>{label}</span>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        style={{ height: 36, minWidth: 120, display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 12px', border: 'none', borderRadius: 'var(--radius-field)', cursor: 'pointer',
          background: value.length ? 'var(--brand-50)' : 'var(--surface-sunken)', boxShadow: 'var(--shadow-inset-hairline)', font: 'var(--type-body)', color: 'var(--text-strong)' }}>
        <span>{summary}</span><ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
          <div role="listbox" aria-multiselectable="true" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 10, background: 'var(--white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-2)', minWidth: 240, maxHeight: 340, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {searchable && (
              <input autoFocus value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Tìm…"
                style={{ height: 32, border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', padding: '0 10px', font: 'var(--type-body-sm)', outline: 'none', marginBottom: 4 }} />
            )}
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {shown.map((o) => {
                const n = counts?.[o.value];
                const on = sel.has(o.value);
                if (counts && !on && !n) return null; // không có biển nào khớp bộ lọc còn lại → ẩn cho gọn
                return (
                  <label key={o.value} role="option" aria-selected={on} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                    <input type="checkbox" checked={on} onChange={() => toggle(o.value)} style={{ width: 14, height: 14, accentColor: 'var(--action-primary)' }} />
                    <span style={{ flex: 1 }}>{o.label}</span>
                    {n != null && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{new Intl.NumberFormat('vi-VN').format(n)}</span>}
                  </label>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid var(--grey-100)' }}>
              <button type="button" onClick={() => onChange([])} disabled={!value.length} style={{ border: 'none', background: 'none', color: 'var(--link)', font: 'var(--type-caption)', cursor: 'pointer' }}>Bỏ chọn</button>
              <button type="button" onClick={() => setOpen(false)} style={{ border: 'none', background: 'none', color: 'var(--text-strong)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' }}>Xong</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
