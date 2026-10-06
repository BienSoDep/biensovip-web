// Thanh chuyển nguồn ở đầu trang quản lý biển: "Biển của shop" ↔ "Biển VPA". Hai lối vào, cùng một giao diện quản lý.
// Chuyển bằng điều hướng (menu "Biển VPA" cũng mở thẳng tab VPA), nên mỗi nguồn giữ URL riêng.
const SOURCES = [
  { screen: 'aplates', label: 'Biển của shop' },
  { screen: 'avpa', label: 'Biển VPA (đấu giá)' },
];

export default function PlateSourceTabs({ active, go }) {
  return (
    <div role="tablist" aria-label="Nguồn biển số" style={{ display: 'inline-flex', alignSelf: 'flex-start', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-lg)', padding: 3, gap: 3, boxShadow: 'var(--shadow-inset-hairline)' }}>
      {SOURCES.map((s) => {
        const on = s.screen === active;
        return (
          <button key={s.screen} type="button" role="tab" aria-selected={on} onClick={() => { if (!on) go?.(s.screen)?.(); }}
            style={{
              height: 38, padding: '0 18px', border: 'none', borderRadius: 'var(--radius-md)', cursor: on ? 'default' : 'pointer',
              font: 'var(--type-body-sm)', fontWeight: on ? 'var(--fw-bold)' : 'var(--fw-medium)',
              background: on ? 'var(--action-primary)' : 'transparent', color: on ? 'var(--text-inverse)' : 'var(--text-body)',
              transition: 'background-color 160ms var(--ease-standard), color 160ms var(--ease-standard)',
            }}>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
