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
  Send,
  Loader2,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { contentGet } from '../lib/content/index.js';
import { routeFor, parseRoute, PROVINCE_LANDINGS, PLATE_TYPE_LANDINGS } from '../config/routes.js';
import { useSubscribe } from '../services/subscribers.js';
import ZaloIcon from '../components/ZaloIcon.jsx';
import FacebookIcon from '../components/FacebookIcon.jsx';
import { DEFAULT_CONTACT } from '../common/constants.js';
import { toZaloUrl } from '../lib/zaloMessage.js';

/**
 * MotionFooterNewsletter - Animated newsletter form inspired by Motion UI (motion.dev/ui/footers)
 * Multi-state feedback (idle -> loading -> success / error) with spring physics and accessible ARIA.
 */
function MotionFooterNewsletter() {
  const subscribe = useSubscribe();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      await subscribe.mutateAsync({ email: cleanEmail, source: 'footer_newsletter' });
      setStatus('success');
      setEmail('');
      toast.success('Đăng ký nhận thông báo biển số thành công!');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Không thể đăng ký lúc này. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="motion-footer-newsletter-box">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success-banner"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="motion-footer-newsletter-success"
          >
            <div className="motion-footer-newsletter-success-icon">
              <Check size={18} />
            </div>
            <div className="motion-footer-newsletter-success-text">
              <strong>Đăng ký thành công!</strong>
              <span>Bạn sẽ nhận được thông báo ngay khi có biển số đẹp mới về kho.</span>
            </div>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="motion-footer-newsletter-reset-btn"
              title="Đăng ký thêm email khác"
            >
              Đăng ký thêm
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="input-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="motion-footer-newsletter-form"
          >
            <div className="motion-footer-newsletter-input-wrap">
              <Mail size={18} className="motion-footer-newsletter-input-icon" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                disabled={status === 'loading'}
                placeholder="Nhập email của bạn (vd: duy@gmail.com)"
                aria-label="Email nhận bản tin biển số VIP"
                className="motion-footer-newsletter-input"
              />
            </div>

            <motion.button
              type="submit"
              disabled={status === 'loading'}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="motion-footer-newsletter-submit-btn"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={16} className="motion-footer-spin" />
                  <span>Đang gửi…</span>
                </>
              ) : (
                <>
                  <span>Nhận tin biển mới</span>
                  <Send size={15} />
                </>
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {status === 'error' && errorMessage && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="motion-footer-newsletter-error"
        >
          {errorMessage}
        </motion.span>
      )}
    </div>
  );
}

/**
 * Footer - Motion UI Inspired Modern Footer (motion.dev/ui/footers)
 * Features:
 * - Top Newsletter Hero Card with interactive multi-state feedback
 * - Quick Contact Rail with high-affordance spring hover physics and preserved brand colors
 * - Staggered In-View Sitemap Columns with sliding hover indicators
 * - Elegant bottom bar with live status indicator and Motion spring Back-To-Top button
 */
export default function Footer({ settings, patch }) {
  const T = contentGet;
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Điều hướng SPA mượt mà, giữ URL chuẩn cho SEO & crawler
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
    { href: routeFor('list'), label: T('common.footer.list') || 'Kho biển số' },
    { href: routeFor('lucky'), label: T('common.footer.lucky') || 'Hợp mệnh phong thủy' },
    { href: routeFor('luanBien'), label: 'Luận giải biển số xe', badge: 'Mới' },
    { href: routeFor('aiChat'), label: 'Trợ lý AI Phong Thủy', badge: '24/7' },
    { href: routeFor('chat'), label: 'Nhắn tin tư vấn trực tiếp' },
    { href: routeFor('compare'), label: T('common.footer.compare') || 'So sánh biển số' },
    { href: routeFor('collab'), label: T('common.footer.collab') || 'Cộng tác viên', badge: 'Hoa hồng 10%' },
    { href: routeFor('blog'), label: T('common.footer.blog') || 'Tin phong thủy' },
  ];

  const policyLinks = [
    { href: routeFor('about'), label: T('common.footer.about') || 'Về Duy Đinh — Sáng lập Biensovip' },
    { href: routeFor('reviews'), label: 'Đánh giá từ khách hàng thực tế' },
    { href: routeFor('transfer'), label: T('common.footer.transfer') || 'Hướng dẫn sang tên Thông tư 24' },
    { href: routeFor('faq'), label: T('common.footer.faq') || 'Câu hỏi thường gặp (FAQ)' },
    { href: routeFor('terms'), label: T('common.footer.terms') || 'Điều khoản dịch vụ' },
    { href: routeFor('privacy'), label: T('common.footer.privacy') || 'Chính sách bảo mật & pháp lý' },
  ];

  return (
    <footer className="vip-footer motion-footer" role="contentinfo" aria-label="Chân trang Biensovip">
      {/* Glow highlight top line */}
      <div className="motion-footer-glow-line" />

      <div className="vip-footer-inner">
        {/* ================================================================
            1. MOTION HERO NEWSLETTER BANNER (motion.dev/ui/footers pattern)
            ================================================================ */}
        <motion.div
          className="motion-footer-hero-banner"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Watermark dập chìm biển số phong cách VIP Concierge */}
          <div className="motion-footer-hero-watermark" aria-hidden="true">
            <div className="watermark-plate-frame">
              <span className="watermark-prov">43A</span>
              <span className="watermark-num">999.99</span>
            </div>
          </div>

          <div className="motion-footer-hero-content">
            <div className="motion-footer-hero-badge">
              <Sparkles size={13} className="badge-sparkle-icon" />
              <span>VIP Dispatch · Bản Tin Định Kỳ</span>
            </div>
            <h2 className="motion-footer-hero-title">
              Đăng ký nhận danh sách <span className="hero-title-highlight">biển VIP</span> &amp; giá đấu mới nhất
            </h2>
            <p className="motion-footer-hero-sub">
              Cập nhật sớm các biển số ngũ quý, lộc phát vừa về kho và thông tin đấu giá VPA tuần này kèm phân tích ngũ hành phong thủy.
            </p>

            {/* 3 Value Pillars */}
            <div className="motion-footer-hero-perks">
              <span className="hero-perk-item">
                <span className="hero-perk-dot" />
                Nhận tin trước 24h
              </span>
              <span className="hero-perk-item">
                <span className="hero-perk-dot" />
                Luận ngũ hành phong thủy
              </span>
              <span className="hero-perk-item">
                <span className="hero-perk-dot" />
                Miễn phí &amp; bảo mật
              </span>
            </div>
          </div>

          <div className="motion-footer-hero-action">
            <MotionFooterNewsletter />
            <div className="motion-footer-social-proof">
              <div className="proof-avatars" aria-hidden="true">
                <span className="proof-avatar" style={{ background: '#F19720' }}>VIP</span>
                <span className="proof-avatar" style={{ background: '#0F172A' }}>43</span>
                <span className="proof-avatar" style={{ background: '#16A34A' }}>51</span>
              </div>
              <span className="proof-text">Hơn <strong>2.450+</strong> nhà sưu tầm đang theo dõi</span>
            </div>
          </div>
        </motion.div>

        {/* ================================================================
            2. QUICK CONTACT INTERACTION CARDS (Giữ trọn màu nhận diện kênh)
            ================================================================ */}
        <div className="vip-contact-bar">
          <div className="vip-contact-grid">
            {/* THẺ 1: HOTLINE 24/7 */}
            <motion.a
              href={`tel:${phone}`}
              className="vip-contact-card"
              title="Gọi hotline tư vấn trực tiếp 24/7"
              style={{
                '--card-glow': 'rgba(22, 163, 74, 0.16)',
                '--card-border': '#16A34A',
                '--icon-bg': '#F0FDF4',
                '--icon-color': '#16A34A',
                '--label-color': '#15803D',
              }}
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <div className="vip-contact-icon-box">
                <PhoneCall size={20} />
              </div>
              <div className="vip-contact-info">
                <span className="vip-contact-label">Hotline Tư Vấn</span>
                <span className="vip-contact-value">{phoneDisplay}</span>
                <span className="vip-contact-sub">Bấm gọi ngay · Phục vụ 24/7</span>
              </div>
            </motion.a>

            {/* THẺ 2: ZALO OFFICIAL */}
            <motion.a
              href={toZaloUrl(zalo)}
              target="_blank"
              rel="noopener noreferrer"
              className="vip-contact-card"
              title="Chat Zalo với chuyên viên tư vấn Duy Đinh"
              style={{
                '--card-glow': 'rgba(0, 104, 255, 0.16)',
                '--card-border': '#0068FF',
                '--icon-bg': '#EBF3FF',
                '--icon-color': '#0068FF',
                '--label-color': '#0068FF',
              }}
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <div className="vip-contact-icon-box">
                <ZaloIcon size={20} />
              </div>
              <div className="vip-contact-info">
                <span className="vip-contact-label">Zalo Duy Đinh</span>
                <span className="vip-contact-value">{phoneDisplay}</span>
                <span className="vip-contact-sub">Nhắn tin Zalo · Phản hồi &lt; 5p</span>
              </div>
            </motion.a>

            {/* THẺ 3: SHOWROOM / ĐỊA CHỈ */}
            <motion.a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="vip-contact-card"
              title="Xem vị trí showroom trên Google Maps"
              style={{
                '--card-glow': 'rgba(239, 68, 68, 0.16)',
                '--card-border': '#EF4444',
                '--icon-bg': '#FEF2F2',
                '--icon-color': '#EF4444',
                '--label-color': '#DC2626',
              }}
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <div className="vip-contact-icon-box">
                <MapPin size={20} />
              </div>
              <div className="vip-contact-info">
                <span className="vip-contact-label">Showroom Trực Tiếp</span>
                <span className="vip-contact-value">Số 06 An Thượng 30</span>
                <span className="vip-contact-sub">Ngũ Hành Sơn, Đà Nẵng · Chỉ đường →</span>
              </div>
            </motion.a>

            {/* THẺ 4: FANPAGE FACEBOOK */}
            <motion.a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vip-contact-card"
              title="Ghé thăm Fanpage Duy Đinh - Biển Số Đẹp Đà Nẵng"
              style={{
                '--card-glow': 'rgba(24, 119, 242, 0.16)',
                '--card-border': '#1877F2',
                '--icon-bg': '#EFF6FF',
                '--icon-color': '#1877F2',
                '--label-color': '#1877F2',
              }}
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <div className="vip-contact-icon-box">
                <FacebookIcon style={{ width: 20, height: 20, color: '#1877F2' }} />
              </div>
              <div className="vip-contact-info">
                <span className="vip-contact-label">Fanpage Facebook</span>
                <span className="vip-contact-value">{facebookName}</span>
                <span className="vip-contact-sub">Cập nhật biển mới mỗi ngày</span>
              </div>
            </motion.a>

            {/* THẺ 5: EMAIL LIÊN HỆ & SAO CHÉP */}
            <motion.a
              href={`mailto:${email}`}
              className="vip-contact-card"
              title="Bấm để gửi email hoặc sao chép địa chỉ"
              onClick={(e) => {
                if (e.target.closest('.copy-trigger')) {
                  handleCopyEmail(e);
                }
              }}
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
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
                      color: copiedEmail ? 'var(--action-primary, #F19720)' : '#64748B',
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
            </motion.a>

            {/* THẺ 6: GIỜ LÀM VIỆC & TRẠNG THÁI */}
            <div
              className="vip-contact-card"
              style={{
                '--card-glow': 'rgba(16, 185, 129, 0.16)',
                '--card-border': '#10B981',
                '--icon-bg': '#ECFDF5',
                '--icon-color': '#059669',
                '--label-color': '#047857',
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
                  <span className="vip-live-dot" /> Đang mở cửa (Cả T7 &amp; CN)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            3. MOTION SITEMAP COLUMNS WITH STAGGERED IN-VIEW ANIMATION
            ================================================================ */}
        <div className="vip-footer-main">
          {/* CỘT THƯƠNG HIỆU & BẢO CHỨNG */}
          <motion.div
            className="vip-footer-brand-col"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            <div className="vip-footer-brand-header">
              <img
                src="/assets/logo-mark.png"
                alt={T('common.brand.name') || 'Duy Đinh'}
                className="vip-footer-logo"
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="vip-footer-brand-name">
                  {T('common.brand.name') || 'Duy Đinh'} · Biển Số Đẹp
                </span>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, letterSpacing: '0.04em' }}>
                  UY TÍN TẠO NÊN ĐẲNG CẤP
                </span>
              </div>
            </div>

            <p className="vip-footer-brand-desc">
              {T('common.footer.desc') ||
                'Duy Đinh - Biển Số Đẹp Đà Nẵng: Nền tảng giao dịch biển số xe định danh uy tín hàng đầu toàn quốc. Hỗ trợ tư vấn phong thủy, thẩm định giá và thủ tục pháp lý trọn gói.'}
            </p>

            {/* BẢO CHỨNG UY TÍN E-E-A-T */}
            <div className="vip-footer-badges">
              <div className="vip-footer-badge-item">
                <ShieldCheck size={16} />
                <span>Cam kết 100% biển số định danh hợp pháp BCA</span>
              </div>
              <div className="vip-footer-badge-item">
                <Sparkles size={16} />
                <span>Hỗ trợ thủ tục sang tên, rút hồ sơ trọn gói 63 tỉnh</span>
              </div>
              <div className="vip-footer-badge-item">
                <Award size={16} />
                <span>Thẩm định phong thủy ngũ hành chuẩn xác</span>
              </div>
            </div>
          </motion.div>

          {/* CÁC CỘT LIÊN KẾT ĐIỀU HƯỚNG */}
          <div className="vip-footer-columns">
            {/* CỘT 1: KHÁM PHÁ */}
            <motion.div
              className="vip-footer-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.12 }}
            >
              <span className="vip-footer-section-title">
                {T('common.footer.explore_title') || 'Khám Phá'}
              </span>
              <ul className="vip-footer-link-list">
                {exploreLinks.map((item) => (
                  <li key={item.href}>
                    <motion.a
                      href={item.href}
                      onClick={navClick}
                      rel={item.href === '/yeu-thich' ? 'nofollow' : undefined}
                      className="vip-footer-link"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <ChevronRight size={13} className="vip-footer-link-chevron" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="vip-footer-link-badge">{item.badge}</span>
                      )}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* CỘT 2: KHO BIỂN THEO LOẠI */}
            <motion.div
              className="vip-footer-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.18 }}
            >
              <span className="vip-footer-section-title">Kho Biển Theo Loại</span>
              <ul className="vip-footer-link-list">
                {PLATE_TYPE_LANDINGS.map((p) => (
                  <li key={p.slug}>
                    <motion.a
                      href={routeFor('plateTypeLanding', p.slug)}
                      onClick={navClick}
                      className="vip-footer-link"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <ChevronRight size={13} className="vip-footer-link-chevron" />
                      <span>Biển {p.name}</span>
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* CỘT 3: KHO BIỂN THEO TỈNH THÀNH */}
            <motion.div
              className="vip-footer-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.24 }}
            >
              <span className="vip-footer-section-title">Kho Biển Theo Tỉnh</span>
              <ul className="vip-footer-link-list">
                {PROVINCE_LANDINGS.slice(0, 8).map((p) => (
                  <li key={p.slug}>
                    <motion.a
                      href={routeFor('provinceLanding', p.code)}
                      onClick={navClick}
                      className="vip-footer-link"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <ChevronRight size={13} className="vip-footer-link-chevron" />
                      <span>Biển {p.name || p.code}</span>
                    </motion.a>
                  </li>
                ))}
                <li>
                  <motion.a
                    href={routeFor('list')}
                    onClick={navClick}
                    className="vip-footer-link highlight"
                    whileHover={{ x: 5 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <span>Xem tất cả tỉnh thành →</span>
                  </motion.a>
                </li>
              </ul>
            </motion.div>

            {/* CỘT 4: CHÍNH SÁCH & PHÁP LÝ */}
            <motion.div
              className="vip-footer-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.3 }}
            >
              <span className="vip-footer-section-title">
                {T('common.footer.policy_title') || 'Chính Sách & Hỗ Trợ'}
              </span>
              <ul className="vip-footer-link-list">
                {policyLinks.map((item) => (
                  <li key={item.href}>
                    <motion.a
                      href={item.href}
                      onClick={navClick}
                      className="vip-footer-link"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <ChevronRight size={13} className="vip-footer-link-chevron" />
                      <span>{item.label}</span>
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* ================================================================
            4. CHÂN ĐÁY (BOTTOM BAR: COPYRIGHT, PHÁP LÝ & MOTION BACK TO TOP)
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

          <motion.button
            type="button"
            className="vip-back-to-top"
            onClick={scrollToTop}
            title="Cuộn về đầu trang"
            aria-label="Cuộn về đầu trang"
            whileHover={{ y: -3, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 22 }}
          >
            <ArrowUp size={14} />
            <span>Lên đầu trang</span>
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
