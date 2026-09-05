import { contentGet } from '../lib/content/index.js';
import { routeFor, parseRoute, PROVINCE_LANDINGS, PLATE_TYPE_LANDINGS } from '../config/routes.js';
import EmailCapture from '../components/EmailCapture.jsx';
import { DEFAULT_CONTACT } from '../common/constants.js';

// UC06 — Zalo/contact đọc từ GET /api/settings (không hardcode tay). Fallback: thông tin doanh nghiệp thật.
// Footer link href sinh từ routeFor() để không lệch slug (vd lucky: alias cũ tu-van → hop-menh).
export default function Footer({ settings, patch }) {
  const T = contentGet;
  // Href thật giữ nguyên (SEO — crawler/mở tab mới/right-click vẫn dùng URL chuẩn).
  // Click chuột trái thường thì điều hướng qua router SPA thay vì full-page reload (UX — tránh giật/trắng trang khi đổi route).
  const navClick = (e) => {
    if (!patch || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const r = parseRoute(new URL(e.currentTarget.href).pathname);
    patch((x) => ({ ...x, screen: r.screen, curId: r.detailId || x.curId, postId: r.postId || x.postId, provinceCode: r.provinceCode || x.provinceCode, typeSlug: r.typeSlug || x.typeSlug }));
  };
  const phone = (settings?.phone || DEFAULT_CONTACT.phone).replace(/[^0-9]/g, '');
  const phoneDisplay = (settings?.phone || DEFAULT_CONTACT.phone).replace(/[^0-9]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  const zalo = settings?.zalo || DEFAULT_CONTACT.zalo;
  const email = settings?.email || 'duymc64@gmail.com';
  const exploreLinks = [
    [routeFor('list'), T('common.footer.list')],
    [routeFor('lucky'), T('common.footer.lucky')],
    [routeFor('chat'), T('common.footer.chat')],
    [routeFor('compare'), T('common.footer.compare')],
    [routeFor('collab'), T('common.footer.collab')],
    [routeFor('fav'), T('common.footer.fav')],
    [routeFor('blog'), T('common.footer.blog')],
  ];
  const policyLinks = [[routeFor('terms'), T('common.footer.terms')], [routeFor('privacy'), T('common.footer.privacy')], [routeFor('transfer'), T('common.footer.transfer')], [routeFor('faq'), T('common.footer.faq')]];
  const navStyle = { font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--text-faint)' };
  const linkStyle = { font: 'var(--type-body-sm)', color: 'var(--text-body)', textDecoration: 'none' };
  return (
    <footer style={{ background: 'var(--white)', boxShadow: 'inset 0 1px 0 var(--border-hairline)' }}>
      <div className="footer-inner" style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'clamp(28px,4vw,52px) var(--pad-page)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
        <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img src="/assets/logo-mark.png" alt={T('common.brand.name')} style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-strong)' }}>{T('common.brand.name')}</span>
          </div>
          <p className="footer-desc" style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 340 }}>{T('common.footer.desc')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 340 }}>
            <span style={navStyle}>Nhận thông báo mới</span>
            <EmailCapture source="newsletter" />
          </div>
        </div>

        <nav aria-label={T('common.footer.explore_title')} style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={navStyle}>{T('common.footer.explore_title')}</span>
          {exploreLinks.map(([href, label]) => (
            <a key={href} href={href} onClick={navClick} style={linkStyle}>{label}</a>
          ))}
        </nav>

        <nav aria-label="Kho biển theo loại" style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={navStyle}>Kho biển theo loại</span>
          {PLATE_TYPE_LANDINGS.map((p) => (
            <a key={p.slug} href={routeFor('post', p.slug)} onClick={navClick} style={linkStyle}>Biển {p.name}</a>
          ))}
        </nav>

        <nav aria-label="Kho biển theo tỉnh" style={{ flex: '1 1 170px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={navStyle}>Kho biển theo tỉnh</span>
          {PROVINCE_LANDINGS.slice(0, 10).map((p) => (
            <a key={p.slug} href={routeFor('post', p.slug)} onClick={navClick} style={linkStyle}>Biển {p.name || p.code}</a>
          ))}
          <a href={routeFor('list')} onClick={navClick} style={{ ...linkStyle, fontWeight: 'var(--fw-semibold)' }}>Xem tất cả tỉnh →</a>
        </nav>

        <nav aria-label={T('common.footer.policy_title')} style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={navStyle}>{T('common.footer.policy_title')}</span>
          {policyLinks.map(([href, label]) => (
            <a key={href} href={href} onClick={navClick} style={linkStyle}>{label}</a>
          ))}
        </nav>

        <div style={{ flex: '1 1 240px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 'var(--space-5)', alignContent: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={navStyle}>{T('common.footer.hotline')}</span><a href={`tel:${phone}`} style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{phoneDisplay}</a></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={navStyle}>{T('common.footer.zalo_oa')}</span><a href={`https://zalo.me/${zalo}`} target="_blank" rel="noopener noreferrer" style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>zalo.me/{zalo}</a></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={navStyle}>{T('common.footer.address')}</span><span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{T('common.footer.address_value')}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={navStyle}>{T('common.footer.hours')}</span><span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{T('common.footer.hours_value')}</span></div>
        </div>

        <div style={{ flex: '1 1 100%', paddingTop: 'var(--space-5)', boxShadow: 'inset 0 1px 0 var(--border-hairline)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{T('common.footer.copyright')}</span>
          </div>
      </div>
    </footer>
  );
}
