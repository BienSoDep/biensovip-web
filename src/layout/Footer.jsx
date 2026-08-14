import { contentGet } from '../lib/content/index.js';

export default function Footer() {
  const T = contentGet;
  const exploreLinks = [
    ['#/danh-sach', T('common.footer.list')],
    ['#/tu-van', T('common.footer.lucky')],
    ['#/lien-he', T('common.footer.chat')],
    ['#/so-sanh', T('common.footer.compare')],
    ['#/cong-tac-vien', T('common.footer.collab')],
    ['#/yeu-thich', T('common.footer.fav')],
    ['#/tin', T('common.footer.blog')],
    ['#/gioi-thieu', T('common.footer.about')],
  ];
  const policyLinks = [['#/dieu-khoan', T('common.footer.terms')], ['#/bao-mat', T('common.footer.privacy')], ['#/sang-ten', T('common.footer.transfer')], ['#/hoi-dap', T('common.footer.faq')]];
  return (
    <footer style={{ background: 'var(--white)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
      <div className="footer-inner" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'clamp(28px,4vw,52px) var(--pad-page)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
        <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img src="/assets/logo-mark.png" alt={T('common.brand.name')} style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>{T('common.brand.name')}</span>
          </div>
          <p className="footer-desc" style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 340 }}>{T('common.footer.desc')}</p>
        </div>

        <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-faint)' }}>{T('common.footer.explore_title')}</span>
          {exploreLinks.map(([href, label]) => (
            <a key={href} href={href} style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>

        <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-faint)' }}>{T('common.footer.policy_title')}</span>
          {policyLinks.map(([href, label]) => (
            <a key={href} href={href} style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>

        <div style={{ flex: '1 1 240px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 'var(--space-5)', alignContent: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-faint)' }}>{T('common.footer.hotline')}</span><a href="tel:0905000000" style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>0905 000 000</a></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-faint)' }}>{T('common.footer.zalo_oa')}</span><a href="https://zalo.me/duydinh" target="_blank" rel="noopener noreferrer" style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>zalo.me/duydinh</a></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-faint)' }}>{T('common.footer.address')}</span><span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{T('common.footer.address_value')}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-faint)' }}>{T('common.footer.hours')}</span><span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{T('common.footer.hours_value')}</span></div>
        </div>

        <div style={{ flex: '1 1 100%', paddingTop: 'var(--space-5)', boxShadow: 'inset 0 1px 0 var(--border-hairline)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{T('common.footer.copyright')}</span>
          </div>
      </div>
    </footer>
  );
}
