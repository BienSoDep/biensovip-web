export default function Footer() {
  return (
    <footer style={{ padding: '0 var(--pad-page) var(--space-7)' }}>
      <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', background: 'var(--surface-inverse)', borderRadius: 'var(--radius-surface)', padding: 'clamp(28px,4vw,52px)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img src="/assets/logo-mark.png" alt="Duy Đinh" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--white)' }}>Duy Đinh</span>
          </div>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'rgba(255,255,255,.66)', maxWidth: 340 }}>Biển số đẹp Đà Nẵng — hồ sơ rõ ràng, sang tên nhanh, tư vấn theo mệnh chủ xe.</p>
        </div>
        <div style={{ flex: '1 1 320px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Hotline</span><a href="tel:0905000000" style={{ font: 'var(--type-title-3)' }}>0905 000 000</a></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Zalo OA</span><a href="https://zalo.me/duydinh" target="_blank" rel="noopener noreferrer" style={{ font: 'var(--type-title-3)' }}>zalo.me/duydinh</a></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Địa chỉ</span><span style={{ font: 'var(--type-body-sm)', color: 'var(--white)' }}>123 Nguyễn Văn Linh, Đà Nẵng</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Giờ làm việc</span><span style={{ font: 'var(--type-body-sm)', color: 'var(--white)' }}>8:00 – 21:00</span></div>
        </div>
        <div style={{ flex: '1 1 100%', paddingTop: 'var(--space-5)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)', font: 'var(--type-caption)', color: 'rgba(255,255,255,.5)' }}>© 2026 Duy Đinh — Biensovip.com</div>
      </div>
    </footer>
  );
}
