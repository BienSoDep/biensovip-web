import { useState } from 'react';

// Trang admin gộp nhiều trang con thành tab ngang — dùng cho các nhóm chức năng liên quan chặt
// (VD Blog+Bình luận, Nhật ký hệ thống/lỗi/rủi ro CTV). Style pill-tab copy từ AdminContacts.jsx.
// `tabs`: [{ key, label, render: () => ReactNode }] — ẩn tab nào không truyền (VD thiếu quyền).
// `initialTab`: key tab mặc định khi vào trang lần đầu hoặc key đó không còn trong danh sách hiện tại.
export default function AdminTabbedPage({ tabs, initialTab }) {
  const [active, setActive] = useState(initialTab || tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) || tabs[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {tabs.length > 1 && (
        <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {tabs.map((t) => {
            const isActive = t.key === current?.key;
            return (
              <button key={t.key} type="button" role="tab" aria-selected={isActive} onClick={() => setActive(t.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 14px', border: 'none',
                  borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: isActive ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  background: isActive ? 'var(--action-primary)' : 'var(--white)', color: isActive ? 'var(--text-inverse)' : 'var(--text-body)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                }}>
                {t.label}
              </button>
            );
          })}
        </div>
      )}
      {current?.render?.()}
    </div>
  );
}
