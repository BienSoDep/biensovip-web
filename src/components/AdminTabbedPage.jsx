import { useState, useEffect } from 'react';

// Trang admin gộp nhiều trang con thành tab ngang — dùng cho các nhóm chức năng liên quan chặt
// (VD Blog+Bình luận, Nhật ký hệ thống/lỗi/rủi ro CTV, Báo cáo & Phân tích VPA).
// Style pill-tab copy từ AdminContacts.jsx.
// `tabs`: [{ key, label, render: () => ReactNode }] — ẩn tab nào không truyền (VD thiếu quyền).
// `initialTab`: key tab mặc định khi vào trang lần đầu hoặc key đó không còn trong danh sách hiện tại.
export default function AdminTabbedPage({ tabs, initialTab, onTabChange }) {
  const getInitialActive = () => {
    if (typeof window !== 'undefined') {
      const qTab = new URLSearchParams(window.location.search).get('tab');
      if (qTab && tabs.some((t) => t.key === qTab)) return qTab;
    }
    return initialTab || tabs[0]?.key;
  };

  const [active, setActive] = useState(getInitialActive);

  // Sync if tabs or initialTab change dynamically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const qTab = new URLSearchParams(window.location.search).get('tab');
      if (qTab && tabs.some((t) => t.key === qTab)) {
        setActive(qTab);
        return;
      }
    }
    if (!tabs.some((t) => t.key === active)) {
      setActive(initialTab || tabs[0]?.key);
    }
  }, [tabs, initialTab]);

  const handleSelect = (key) => {
    setActive(key);
    onTabChange?.(key);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', key);
        window.history.replaceState(null, '', url.toString());
      } catch { /* ignore */ }
    }
  };

  const current = tabs.find((t) => t.key === active) || tabs[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {tabs.length > 1 && (
        <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {tabs.map((t) => {
            const isActive = t.key === current?.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelect(t.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 36,
                  padding: '0 16px',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  font: 'var(--type-body-sm)',
                  fontWeight: isActive ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  background: isActive ? 'var(--action-primary)' : 'var(--white)',
                  color: isActive ? 'var(--action-primary-text, #ffffff)' : 'var(--text-body)',
                  boxShadow: isActive ? '0 2px 6px rgba(199,91,0,0.2)' : 'var(--shadow-inset-hairline)',
                  transition: 'all 140ms ease',
                }}
              >
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
