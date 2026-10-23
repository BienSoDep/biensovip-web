import { useState } from 'react';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  ArrowUp,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { contentGet } from '../lib/content/index.js';
import { routeFor, parseRoute, PROVINCE_LANDINGS, PLATE_TYPE_LANDINGS } from '../config/routes.js';
import EmailCapture from '../components/EmailCapture.jsx';
import ZaloIcon from '../components/ZaloIcon.jsx';
import FacebookIcon from '../components/FacebookIcon.jsx';
import { DEFAULT_CONTACT } from '../common/constants.js';
import { toZaloUrl } from '../lib/zaloMessage.js';

// UC06 — Zalo/contact đọc từ GET /api/settings (không hardcode tay). Fallback: thông tin doanh nghiệp thật.
// Footer link href sinh từ routeFor() để không lệch slug (vd lucky: alias cũ tu-van → hop-menh).
export default function Footer({ settings, patch }) {
  const T = contentGet;
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Href thật giữ nguyên (SEO — crawler/mở tab mới/right-click vẫn dùng URL chuẩn).
  // Click chuột trái thường thì điều hướng qua router SPA thay vì full-page reload (UX — tránh giật/trắng trang khi đổi route).
  const navClick = (e) => {
    if (!patch || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const r = parseRoute(new URL(e.currentTarget.href).pathname);
    patch((x) => ({
      ...x,
      screen: r.screen,
      curId: r.detailId || x.curId,
      postId: r.postId || x.postId,
      provinceCode: r.provinceCode || x.provinceCode,
      typeSlug: r.typeSlug || x.typeSlug,
    }));
  };

  const phone = (settings?.phone || DEFAULT_CONTACT.phone).replace(/[^0-9]/g, '');
  const phoneDisplay = (settings?.phone || DEFAULT_CONTACT.phone)
    .replace(/[^0-9]/g, '')
    .replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  const zalo = settings?.zalo || DEFAULT_CONTACT.zalo;
  const email = settings?.email || 'duymc64@gmail.com';
  const address = settings?.address || T('common.footer.address_value') || 'Số 06 An Thượng 30, Ngũ Hành Sơn, Đà Nẵng';
  const facebookUrl = settings?.facebook_url || 'https://www.facebook.com/duydinhbiensodepdanang';
  const facebookName = settings?.facebook_name || T('common.footer.facebook_value') || 'Duy Đinh - Biển Số Đẹp Đà Nẵng';
  const hours = settings?.hours || T('common.footer.hours_value') || '8:00 – 21:00';

  const handleCopyEmail = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(email);
    setCopiedEmail(true);
    toast.success('Đã sao chép email: ' + email);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exploreLinks = [
    [routeFor('list'), T('common.footer.list') || 'Kho biển số'],
    [routeFor('lucky'), T('common.footer.lucky') || 'Hợp mệnh'],
    [routeFor('chat'), 'Trợ lý AI & Tư vấn'],
    [routeFor('compare'), T('common.footer.compare') || 'So sánh biển số'],
    [routeFor('collab'), T('common.footer.collab') || 'Cộng tác viên'],
    [routeFor('fav'), T('common.footer.fav') || 'Biển số yêu thích'],
    [routeFor('blog'), T('common.footer.blog') || 'Tin phong thủy'],
  ];

  const policyLinks = [
    [routeFor('terms'), T('common.footer.terms') || 'Điều khoản dịch vụ'],
    [routeFor('privacy'), T('common.footer.privacy') || 'Chính sách bảo mật'],
    [routeFor('transfer'), T('common.footer.transfer') || 'Hướng dẫn sang tên'],
    [routeFor('faq'), T('common.footer.faq') || 'Câu hỏi thường gặp'],
  ];

  return (
    <footer className="vip-footer" role="contentinfo" aria-label="Chân trang Biensovip">
      <div className="vip-footer-inner">
        {/* ================================================================
            1. KHỐI THẺ KÊNH LIÊN HỆ TƯƠNG TÁC CAO (QUICK CONTACT CARDS BAR)
            ================================================================ */}
        <div className="vip-contact-bar">
          <div className="vip-contact-grid">
            {/* THẺ 1: HOTLINE 24/7 */}
            <a
              href={`tel:${phone}`}
              className="vip-contact-card"
              title="Gọi hotline tư vấn trực tiếp 24/7"
              style={{
                '--card-glow': 'rgba(241, 151, 32, 0.28)',
                '--card-border': 'rgba(241, 151, 32, 0.55)',
                '--icon-bg': 'rgba(241, 151, 32, 0.16)',
                '--icon-color': '#F19720',
                '--label-color': '#F59E0B',
              }}
            >
              <div className="vip-contact-icon-box">
                <PhoneCall size={20} />
              </div>
              <div className="vip-contact-info">
                <span className="vip-contact-label">Hotline Tư Vấn</span>
                <span className="vip-contact-value">{phoneDisplay}</span>
                <span className="vip-contact-sub">Bấm gọi ngay · Phục vụ 24/7</span>
              </div>
            </a>

            {/* THẺ 2: ZALO OFFICIAL */}
            <a
              href={toZaloUrl(zalo)}
              target="_blank"
              rel="noopener noreferrer"
              className="vip-contact-card"
              title="Chat Zalo với chuyên viên tư vấn Duy Đinh"
              style={{
                '--card-glow': 'rgba(0, 104, 255, 0.28)',
                '--card-border': 'rgba(0, 104, 255, 0.55)',
                '--icon-bg': 'rgba(0, 104, 255, 0.16)',
                '--icon-color': '#0068FF',
                '--label-color': '#38BDF8',
              }}
            >
              <div className="vip-contact-icon-box">
                <ZaloIcon style={{ width: 22, height: 22 }} />
              </div>
              <div className="vip-contact-info">
                <span className="vip-contact-label">Zalo Duy Đinh</span>
                <span className="vip-contact-value">{phoneDisplay}</span>
                <span className="vip-contact-sub">Nhắn tin Zalo · Phản hồi &lt; 5p</span>
              </div>
            </a>

            {/* THẺ 3: SHOWROOM / ĐỊA CHỈ */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="vip-contact-card"
              title="Xem vị trí showroom trên Google Maps"
              style={{
                '--card-glow': 'rgba(239, 68, 68, 0.25)',
                '--card-border': 'rgba(239, 68, 68, 0.5)',
                '--icon-bg': 'rgba(239, 68, 68, 0.15)',
                '--icon-color': '#EF4444',
                '--label-color': '#F87171',
              }}
            >
              <div className="vip-contact-icon-box">
                <MapPin size={20} />
              </div>
              <div className="vip-contact-info">
                <span className="vip-contact-label">Showroom Trực Tiếp</span>
                <span className="vip-contact-value">Số 06 An Thượng 30</span>
                <span className="vip-contact-sub">Ngũ Hành Sơn, Đà Nẵng · Chỉ đường →</span>
              </div>
            </a>

            {/* THẺ 4: FANPAGE FACEBOOK */}
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vip-contact-card"
              title="Ghé thăm Fanpage Duy Đinh - Biển Số Đẹp Đà Nẵng"
              style={{
                '--card-glow': 'rgba(24, 119, 242, 0.25)',
                '--card-border': 'rgba(24, 119, 242, 0.5)',
                '--icon-bg': 'rgba(24, 119, 242, 0.15)',
                '--icon-color': '#1877F2',
                '--label-color': '#60A5FA',
              }}
            >
              <div className="vip-contact-icon-box">
                <FacebookIcon style={{ width: 20, height: 20, color: '#1877F2' }} />
              </div>
              <div className="vip-contact-info">
                <span className="vip-contact-label">Fanpage Facebook</span>
                <span className="vip-contact-value">Duy Đinh - Biển Số Đẹp</span>
                <span className="vip-contact-sub">Cập nhật biển mới mỗi ngày</span>
              </div>
            </a>

            {/* THẺ 5: EMAIL LIÊN HỆ & SAO CHÉP */}
            <a
              href={`mailto:${email}`}
              className="vip-contact-card"
              title="Bấm để gửi email hoặc sao chép địa chỉ"
              onClick={(e) => {
                // Nếu click vào nút copy thì không mở app mail
                if (e.target.closest('.copy-trigger')) {
                  handleCopyEmail(e);
                }
              }}
              style={{
                '--card-glow': 'rgba(139, 92, 246, 0.25)',
                '--card-border': 'rgba(139, 92, 246, 0.5)',
                '--icon-bg': 'rgba(139, 92, 246, 0.15)',
                '--icon-color': '#A78BFA',
                '--label-color': '#C4B5FD',
              }}
            >
              <div className="vip-contact-icon-box">
                <Mail size={20} />
              </div>
              <div className="vip-contact-info">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="vip-contact-label">Email Hỗ Trợ</span>
                  <button
                    type="button"
                    className="copy-trigger"
                    onClick={handleCopyEmail}
                    title="Sao chép email"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copiedEmail ? '#10B981' : '#94A3B8',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {copiedEmail ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <span className="vip-contact-value">{email}</span>
                <span className="vip-contact-sub">{copiedEmail ? 'Đã sao chép vào bộ nhớ tạm' : 'Bấm để gửi thư hoặc sao chép'}</span>
              </div>
            </a>

            {/* THẺ 6: GIỜ LÀM VIỆC & TRẠNG THÁI */}
            <div
              className="vip-contact-card"
              style={{
                '--card-glow': 'rgba(16, 185, 129, 0.25)',
                '--card-border': 'rgba(16, 185, 129, 0.5)',
                '--icon-bg': 'rgba(16, 185, 129, 0.15)',
                '--icon-color': '#10B981',
                '--label-color': '#34D399',
                cursor: 'default',
              }}
            >
              <div className="vip-contact-icon-box">
                <Clock size={20} />
              </div>
              <div className="vip-contact-info">
                <span className="vip-contact-label">Giờ Hoạt Động</span>
                <span className="vip-contact-value">{hours}</span>
                <span className="vip-contact-sub">
                  <span className="vip-live-dot" /> Đang mở cửa (Cả T7 & CN)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            2. KHỐI THÂN CHÂN TRANG: BRAND & SITEMAP COLUMNS
            ================================================================ */}
        <div className="vip-footer-main">
          {/* CỘT THƯƠNG HIỆU & BẢO CHỨNG */}
          <div className="vip-footer-brand-col">
            <div className="vip-footer-brand-header">
              <img
                src="/assets/logo-mark.png"
                alt={T('common.brand.name') || 'Duy Đinh'}
                className="vip-footer-logo"
              />
              <span className="vip-footer-brand-name">
                {T('common.brand.name') || 'Duy Đinh'} · Biển Số Đẹp
              </span>
            </div>

            <p className="vip-footer-brand-desc">
              {T('common.footer.desc') ||
                'Duy Đinh - Biển Số Đẹp Đà Nẵng: Nền tảng giao dịch biển số xe định danh uy tín hàng đầu toàn quốc. Hỗ trợ tư vấn phong thủy, thẩm định giá và thủ tục pháp lý trọn gói.'}
            </p>

            {/* BẢO CHỨNG UY TÍN E-E-A-T */}
            <div className="vip-footer-badges">
              <div className="vip-footer-badge-item">
                <ShieldCheck size={16} />
                <span>Cam kết 100% biển số định danh hợp pháp</span>
              </div>
              <div className="vip-footer-badge-item">
                <Sparkles size={16} />
                <span>Hỗ trợ thủ tục sang tên, rút hồ sơ trọn gói</span>
              </div>
            </div>

            {/* ĐĂNG KÝ NHẬN TIN BIỂN MỚI */}
            <div className="vip-footer-newsletter">
              <span className="vip-footer-newsletter-title">Nhận thông báo biển số mới</span>
              <EmailCapture source="newsletter" />
            </div>
          </div>

          {/* CÁC CỘT LIÊN KẾT ĐIỀU HƯỚNG */}
          <div className="vip-footer-columns">
            {/* CỘT 1: KHÁM PHÁ */}
            <div className="vip-footer-section">
              <span className="vip-footer-section-title">
                {T('common.footer.explore_title') || 'Khám Phá'}
              </span>
              <ul className="vip-footer-link-list">
                {exploreLinks.map(([href, label]) => (
                  <li key={href}>
                    <a
                      href={href}
                      onClick={navClick}
                      rel={href === '/yeu-thich' ? 'nofollow' : undefined}
                      className="vip-footer-link"
                    >
                      <ChevronRight size={13} style={{ opacity: 0.5 }} />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* CỘT 2: KHO BIỂN THEO LOẠI */}
            <div className="vip-footer-section">
              <span className="vip-footer-section-title">Kho Biển Theo Loại</span>
              <ul className="vip-footer-link-list">
                {PLATE_TYPE_LANDINGS.map((p) => (
                  <li key={p.slug}>
                    <a
                      href={routeFor('post', p.slug)}
                      onClick={navClick}
                      className="vip-footer-link"
                    >
                      <ChevronRight size={13} style={{ opacity: 0.5 }} />
                      Biển {p.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* CỘT 3: KHO BIỂN THEO TỈNH THÀNH */}
            <div className="vip-footer-section">
              <span className="vip-footer-section-title">Kho Biển Theo Tỉnh</span>
              <ul className="vip-footer-link-list">
                {PROVINCE_LANDINGS.slice(0, 8).map((p) => (
                  <li key={p.slug}>
                    <a
                      href={routeFor('post', p.slug)}
                      onClick={navClick}
                      className="vip-footer-link"
                    >
                      <ChevronRight size={13} style={{ opacity: 0.5 }} />
                      Biển {p.name || p.code}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href={routeFor('list')}
                    onClick={navClick}
                    className="vip-footer-link highlight"
                  >
                    Xem tất cả tỉnh thành →
                  </a>
                </li>
              </ul>
            </div>

            {/* CỘT 4: CHÍNH SÁCH & PHÁP LÝ */}
            <div className="vip-footer-section">
              <span className="vip-footer-section-title">
                {T('common.footer.policy_title') || 'Chính Sách & Hỗ Trợ'}
              </span>
              <ul className="vip-footer-link-list">
                {policyLinks.map(([href, label]) => (
                  <li key={href}>
                    <a
                      href={href}
                      onClick={navClick}
                      className="vip-footer-link"
                    >
                      <ChevronRight size={13} style={{ opacity: 0.5 }} />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ================================================================
            3. CHÂN ĐÁY (BOTTOM BAR: COPYRIGHT, PHÁP LÝ & BACK TO TOP)
            ================================================================ */}
        <div className="vip-footer-bottom">
          <div className="vip-footer-copyright">
            <span>© 2026 <strong>Duy Đinh - Biển Số Đẹp Đà Nẵng</strong>. Nền tảng giao dịch biển số số 1 Miền Trung.</span>
          </div>

          <div className="vip-footer-trust-tags">
            <span className="vip-footer-tag">Định danh chính chủ</span>
            <span className="vip-footer-tag">Giao dịch an toàn</span>
            <span className="vip-footer-tag">Hỗ trợ toàn quốc</span>
          </div>

          <button
            type="button"
            className="vip-back-to-top"
            onClick={scrollToTop}
            title="Cuộn về đầu trang"
            aria-label="Cuộn về đầu trang"
          >
            <ArrowUp size={14} />
            <span>Lên đầu trang</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
