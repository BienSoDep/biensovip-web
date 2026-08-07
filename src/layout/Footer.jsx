import { contentGet } from '../lib/content/index.js';

export default function Footer() {
  const T = contentGet;
  const links = [['#/dieu-khoan', T('common.footer.terms')], ['#/bao-mat', T('common.footer.privacy')], ['#/sang-ten', T('common.footer.transfer')], ['#/hoi-dap', T('common.footer.faq')]];
  return (
    <footer style={{ padding: '0 var(--pad-page) var(--space-7)' }}>
      <div className="footer-inner" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', background: 'var(--surface-inverse)', borderRadius: 'var(--radius-surface)', padding: 'clamp(28px,4vw,52px)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img src="/assets/logo-mark.png" alt={T('common.brand.name')} style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--white)' }}>{T('common.brand.name')}</span>
          </div>
          <p className="footer-desc" style={{ margin: 0, font: 'var(--type-body-sm)', color: 'rgba(255,255,255,.66)', maxWidth: 340 }}>{T('common.footer.desc')}</p>
        </div>
        <div style={{ flex: '1 1 320px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>{T('common.footer.hotline')}</span><a href="tel:0905000000" style={{ font: 'var(--type-title-3)' }}>0905 000 000</a></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>{T('common.footer.zalo_oa')}</span><a href="https://zalo.me/duydinh" target="_blank" rel="noopener noreferrer" style={{ font: 'var(--type-title-3)' }}>zalo.me/duydinh</a></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>{T('common.footer.address')}</span><span style={{ font: 'var(--type-body-sm)', color: 'var(--white)' }}>{T('common.footer.address_value')}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>{T('common.footer.hours')}</span><span style={{ font: 'var(--type-body-sm)', color: 'var(--white)' }}>{T('common.footer.hours_value')}</span></div>
        </div>
        <div style={{ flex: '1 1 100%', paddingTop: 'var(--space-5)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'rgba(255,255,255,.5)' }}>{T('common.footer.copyright')}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              {links.map(([href, label]) => (
                <a key={href} href={href} style={{ font: 'var(--type-caption)', color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>{label}</a>
              ))}
            </div>
          </div>
      </div>
    </footer>
  );
}
