import Button from '../components/Button.jsx';

export default function NotFound({ go }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: '70vh', background: 'var(--surface-inverse)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div aria-hidden style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'var(--action-primary)', opacity: 0.9 }} />
      <div aria-hidden style={{ position: 'absolute', top: 140, right: 40, width: 140, height: 140, borderRadius: '50%', background: 'var(--ink-700)' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: -70, left: -70, width: 220, height: 220, borderRadius: '50%', background: 'var(--action-primary)', opacity: 0.9 }} />
      <div aria-hidden style={{ position: 'absolute', bottom: 60, left: 160, width: 120, height: 120, borderRadius: '50%', background: 'var(--ink-700)' }} />

      <div style={{ position: 'relative', maxWidth: 560, padding: 'var(--space-9) var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span aria-hidden style={{ position: 'absolute', font: 'var(--fw-extrabold) clamp(48px,10vw,84px)/1 var(--font-display)', color: 'rgba(255,255,255,.08)', whiteSpace: 'nowrap' }}>Không tìm thấy</span>
          <span style={{ font: 'var(--fw-extrabold) clamp(64px,16vw,140px)/1 var(--font-display)', letterSpacing: 'var(--ls-display)', color: 'var(--white)' }}>404</span>
        </div>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'rgba(255,255,255,.66)', maxWidth: 420 }}>Biển số hoặc trang bạn tìm đã được bán, gỡ xuống hoặc không tồn tại.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-3)' }}>
          <Button variant="primary" size="lg" onClick={go('home')}>Về trang chủ</Button>
          <Button variant="outline" size="lg" onClick={go('chat')} style={{ color: 'var(--white)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}>Nhờ tư vấn</Button>
        </div>
      </div>
    </section>
  );
}
