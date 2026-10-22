import { useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';

// Banner thông tin chung đầu mỗi trang quản lý admin/staff — đóng/mở được, nhớ trạng thái theo storageKey (localStorage).
export function AdminInfoBanner({ storageKey, title, children }) {
  const lsKey = `bsd_admin_info_${storageKey}`;
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(lsKey) !== 'closed';
    } catch {
      return true;
    }
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(lsKey, next ? 'open' : 'closed');
    } catch {
      /* ignore */
    }
  };

  return (
    <div style={{ background: 'var(--surface-tint-cream)', border: '1px solid var(--border-hairline)' }}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: '10px 14px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          font: 'var(--type-body-sm)',
          fontWeight: 'var(--fw-semibold)',
          color: 'var(--text-strong)',
        }}
      >
        <Info size={16} style={{ color: 'var(--action-primary)', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{title}</span>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 150ms var(--ease-out)',
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px 40px', font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default AdminInfoBanner;
