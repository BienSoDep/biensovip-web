import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Bell, MessageCircle, Star, Flame, Check, ShieldCheck, Sparkles, Award, ChevronRight } from 'lucide-react';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { Input, Checkbox, Eyebrow } from '../components/index.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import OtpBoxes from '../components/OtpBoxes.jsx';
import { useGoogleLogin, useGoogleConfirmLink } from '../services/googleAuth.js';
import { routeFor } from '../config/routes.js';
import { useFeaturedPlates } from '../services/plates.js';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import { toZaloUrl } from '../lib/zaloMessage.js';
import { trackFormAbandon } from '../services/tracking/events.js';

const CONTENT_FADE = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

const LAST_EMAIL_KEY = 'bsd_last_email';

const PROJECT_HIGHLIGHTS = [
  {
    id: 'vpa',
    badge: 'Kho Đấu Giá VPA',
    badgeColor: '#D97706',
    badgeBg: 'rgba(217, 119, 6, 0.1)',
    badgeBorder: 'rgba(217, 119, 6, 0.25)',
    icon: Flame,
    title: 'Kho 3.240+ biển số định danh & VPA đấu giá toàn quốc',
    desc: 'Cập nhật trực tiếp mỗi ngày từ cổng đấu giá VPA và nguồn chính chủ uy tín. Đầy đủ ngũ quý, tứ quý, sảnh tiến, lộc phát từ Hà Nội, Đà Nẵng đến TP.HCM.',
    metrics: [
      { label: 'Biển niêm yết', value: '3.240+' },
      { label: 'Nguồn cấp', value: 'VPA Toàn quốc' },
      { label: 'Dòng xe', value: 'Ô tô & Xe máy' },
    ],
  },
  {
    id: 'phap-ly',
    badge: 'Pháp Lý Chuẩn 100%',
    badgeColor: '#059669',
    badgeBg: 'rgba(5, 150, 105, 0.1)',
    badgeBorder: 'rgba(5, 150, 105, 0.25)',
    icon: ShieldCheck,
    title: 'Bảo chứng pháp lý 100% – Sang tên chính chủ chỉ 1–2 ngày',
    desc: 'Duy Đinh hỗ trợ trọn gói thủ tục sang tên, thu hồi & cấp biển định danh theo Thông tư BCA. Hồ sơ gốc rõ ràng, cam kết pháp lý trọn đời.',
    metrics: [
      { label: 'Thời gian sang tên', value: '1–2 ngày' },
      { label: 'Pháp lý bảo đảm', value: 'Chính chủ 100%' },
      { label: 'Hỗ trợ lắp biển', value: 'Tận nơi' },
    ],
  },
  {
    id: 'phong-thuy',
    badge: 'Phong Thủy Trợ Mệnh',
    badgeColor: '#7C3AED',
    badgeBg: 'rgba(124, 58, 237, 0.1)',
    badgeBorder: 'rgba(124, 58, 237, 0.25)',
    icon: Sparkles,
    title: 'Tra cứu phong thủy AI – Rước vượng khí tài lộc về xe',
    desc: 'Công cụ tính nút, quẻ Kinh Dịch và Ngũ hành bản mệnh tương sinh độc quyền giúp quý khách chọn đúng tấm biển trợ vận hanh thông, vạn dặm bình an.',
    metrics: [
      { label: 'Thế số tài lộc', value: '68 · 79 · 88' },
      { label: 'Tư vấn bản mệnh', value: 'Miễn phí' },
      { label: 'Độ chuẩn', value: '100% chuyên gia' },
    ],
  },
  {
    id: 'uy-tin',
    badge: 'Thương Hiệu Từ 2016',
    badgeColor: '#2563EB',
    badgeBg: 'rgba(37, 99, 235, 0.1)',
    badgeBorder: 'rgba(37, 99, 235, 0.25)',
    icon: Award,
    title: 'Hơn 10 năm kinh nghiệm – 5.000+ biển số trao tay',
    desc: 'Hỗ trợ giao dịch và hoàn tất thủ tục định danh trọn gói toàn quốc. Giá cả niêm yết công khai, không chi phí ẩn, đồng hành cùng khách hàng suốt quá trình sử dụng.',
    metrics: [
      { label: 'Biển đã trao tay', value: '5.000+' },
      { label: 'Đánh giá hài lòng', value: '4.9 / 5 ⭐' },
      { label: 'Phạm vi hỗ trợ', value: 'Toàn quốc' },
    ],
  },
];

const REGISTER_BENEFIT_SLIDES = [
  {
    id: 'favs',
    badge: 'Lưu & So Sánh Giá',
    badgeColor: '#E11D48',
    badgeBg: 'rgba(225, 29, 72, 0.1)',
    badgeBorder: 'rgba(225, 29, 72, 0.25)',
    icon: Heart,
    title: 'Lưu biển số yêu thích & Theo dõi biến động giá',
    desc: 'Lưu trữ không giới hạn các tấm biển bạn đang quan tâm, so sánh giá trực quan và xem lại lịch sử đấu giá bất cứ lúc nào.',
    metrics: [
      { label: 'Kho lưu yêu thích', value: 'Không giới hạn' },
      { label: 'Cập nhật giá', value: 'Thời gian thực' },
    ],
  },
  {
    id: 'notify',
    badge: 'Báo Biển Hợp Mệnh',
    badgeColor: '#D97706',
    badgeBg: 'rgba(217, 119, 6, 0.1)',
    badgeBorder: 'rgba(217, 119, 6, 0.25)',
    icon: Bell,
    title: 'Nhận thông báo ngay khi có biển mới hợp tuổi',
    desc: 'Hệ thống tự động thông báo qua Zalo/Email ngay khi kho có biển số mới thuộc cung mệnh tương sinh hoặc đầu số VIP bạn tìm kiếm.',
    metrics: [
      { label: 'Báo biển mới', value: 'Tức thì' },
      { label: 'Gợi ý cá nhân', value: 'Theo can chi' },
    ],
  },
  {
    id: 'ctv',
    badge: 'Mạng Lưới CTV VIP',
    badgeColor: '#059669',
    badgeBg: 'rgba(5, 150, 105, 0.1)',
    badgeBorder: 'rgba(5, 150, 105, 0.25)',
    icon: Star,
    title: 'Tham gia mạng lưới CTV – Hoa hồng hấp dẫn',
    desc: 'Nhận mã giới thiệu riêng, tiếp cận kho biển đẹp toàn quốc và nhận hoa hồng giao dịch minh bạch, chi trả nhanh gọn trong 24 giờ.',
    metrics: [
      { label: 'Hoa hồng chiết khấu', value: 'Hấp dẫn & Minh bạch' },
      { label: 'Thời gian chi trả', value: 'Trong 24h' },
    ],
  },
];

const REGISTER_BENEFITS = [
  { icon: Heart, text: 'Lưu biển số yêu thích, xem lại bất cứ lúc nào' },
  { icon: Bell, text: 'Nhận thông báo ngay khi có biển mới hợp mệnh' },
  { icon: MessageCircle, text: 'Theo dõi lịch sử yêu cầu tư vấn của bạn' },
  { icon: Star, text: 'Đánh giá và chia sẻ trải nghiệm sau khi mua' },
];


const PW_RULES = [
  { label: 'Tối thiểu 8 ký tự', test: (v) => v.length >= 8 },
  { label: 'Có chữ hoa', test: (v) => /[A-Z]/.test(v) },
  { label: 'Có chữ thường', test: (v) => /[a-z]/.test(v) },
  { label: 'Có số', test: (v) => /\d/.test(v) },
  { label: 'Có ký tự đặc biệt', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

// Real-time độ mạnh mật khẩu — không chặn submit nếu thiếu tiêu chí, chỉ hiện để tham khảo.
function PasswordStrength({ value }) {
  if (!value) return null;
  const passed = PW_RULES.filter((r) => r.test(value)).length;
  const level = passed <= 2 ? 0 : passed <= 4 ? 1 : 2;
  const meta = [
    { text: 'Yếu', color: 'var(--status-danger)' },
    { text: 'Trung bình', color: 'var(--status-warning)' },
    { text: 'Mạnh', color: 'var(--status-success)' },
  ][level];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: -8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ flex: 1, height: 4, borderRadius: 'var(--radius-pill)', background: i <= level ? meta.color : 'var(--border-hairline)', transition: 'background 150ms var(--ease-out)' }} />
        ))}
        <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: meta.color, marginLeft: 4 }}>{meta.text}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
        {PW_RULES.map((r) => {
          const ok = r.test(value);
          return (
            <span key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 3, font: 'var(--type-caption)', color: ok ? 'var(--status-success)' : 'var(--text-faint)' }}>
              {ok ? <Check size={11} /> : <span style={{ width: 11, textAlign: 'center' }}>·</span>} {r.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function Auth({ st, s, patch, onNavigate, go, openPlate, setField, authMeta, authSubmit, otpLoginRequest, otpLoginVerify, resendOtp, submitAdmin2fa, blurValidateRegisterField, zalo }) {
  const [otpMode, setOtpMode] = useState(false);
  const [remember, setRemember] = useState(true);
  const [lastEmail, setLastEmail] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const isOtpStep = (s === 'login' && otpMode && st.step === 2) || (s === 'forgot' && st.step === 2);

  // Chuyển tab login↔register để dở dang otpMode/step từ tab trước — không reset thì quay lại login
  // vẫn còn kẹt ở màn OTP hoặc step 2 cũ.
  useEffect(() => {
    if (s !== 'login') { setOtpMode(false); }
  }, [s]);

  useEffect(() => {
    if (isOtpStep) setResendIn((n) => (n > 0 ? n : 60));
  }, [isOtpStep]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleResend = async () => {
    setResendIn(60);
    if (resendOtp) await resendOtp();
  };

  useEffect(() => {
    try { setLastEmail(localStorage.getItem(LAST_EMAIL_KEY) || ''); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (s === 'login' && lastEmail && !st.aEmail) patch({ aEmail: lastEmail });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, lastEmail]);

  // Form-abandon: nếu khách đã gõ gì đó (đăng ký/đăng nhập) mà unmount trang chưa đăng nhập thành
  // công (st.user vẫn falsy) → coi là bỏ dở. Ref giữ giá trị mới nhất để cleanup đọc đúng lúc unmount.
  const abandonRef = useRef({ s, hasInput: false, loggedIn: false });
  useEffect(() => {
    abandonRef.current.s = s;
    abandonRef.current.hasInput = Boolean(st.aName || st.aEmail || st.aPhone || st.aPw);
    abandonRef.current.loggedIn = Boolean(st.user);
  });
  useEffect(() => () => {
    const { s: lastS, hasInput, loggedIn } = abandonRef.current;
    if (hasInput && !loggedIn) trackFormAbandon(lastS === 'register' ? 'auth_register' : 'auth_login');
  }, []);

  const goHome = (e) => { e.preventDefault(); go('home')(); };

  // UC29 — Đăng nhập Google. 409 = email đã có tài khoản, cần xác nhận OTP trước khi liên kết.
  const googleLogin = useGoogleLogin();
  const googleConfirmLink = useGoogleConfirmLink();
  const [googleLinkPending, setGoogleLinkPending] = useState(null); // { email, idToken } | null
  const [linkOtp, setLinkOtp] = useState('');
  const [linkErr, setLinkErr] = useState('');

  const handleGoogleCredential = (idToken) => {
    setLinkErr('');
    googleLogin.mutate(idToken, {
      onSuccess: () => go('home')(),
      onError: (e) => {
        if (e?.code === 'LINK_CONFIRMATION_REQUIRED') {
          // Backend không trả email trong body lỗi (tránh lộ) — decode JWT payload phía FE để lấy email hiển thị.
          try {
            const payload = JSON.parse(atob(idToken.split('.')[1]));
            setGoogleLinkPending({ email: payload.email, idToken });
          } catch { setGoogleLinkPending({ email: '', idToken }); }
        } else {
          setLinkErr(e?.message || 'Đăng nhập Google thất bại.');
        }
      },
    });
  };

  const confirmGoogleLink = () => {
    if (!linkOtp.trim()) { setLinkErr('Nhập mã OTP đã gửi tới email.'); return; }
    googleConfirmLink.mutate(
      { email: googleLinkPending.email, otpCode: linkOtp.trim(), idToken: googleLinkPending.idToken },
      {
        onSuccess: () => { setGoogleLinkPending(null); go('home')(); },
        onError: (e) => setLinkErr(e?.message || 'Xác nhận thất bại.'),
      },
    );
  };

  // Register: xác nhận mật khẩu khớp TRƯỚC khi submit.
  const submitAuth = (remember) => {
    if (s === 'register' && st.aPw !== st.aPw2) { patch({ aErr: { ...st.aErr, pw2: 'Hai mật khẩu chưa khớp.' } }); return; }
    authSubmit(remember);
  };

  // Xoay biển thật (nổi bật) mỗi 3.2s — điểm nhấn hình ảnh chính của panel, bấm vào chuyển thẳng
  // sang trang chi tiết biển đó thay vì chỉ trình diễn hình ảnh trơ trọi.
  const { data: featuredPlates } = useFeaturedPlates(6);
  const plates = featuredPlates?.length ? featuredPlates : [];
  const [plateIdx, setPlateIdx] = useState(0);
  useEffect(() => {
    if (plates.length < 2) return;
    const t = setInterval(() => setPlateIdx((i) => (i + 1) % plates.length), 3200);
    return () => clearInterval(t);
  }, [plates.length]);
  const plate = plates[plateIdx % (plates.length || 1)];
  const goPlateDetail = plate ? (e) => { e.preventDefault(); openPlate?.(plate.id); go('detail')(); } : undefined;

  const activeSlides = s === 'register' ? REGISTER_BENEFIT_SLIDES : PROJECT_HIGHLIGHTS;
  const [highlightIdx, setHighlightIdx] = useState(0);

  useEffect(() => {
    setHighlightIdx(0);
  }, [s]);

  useEffect(() => {
    const t = setInterval(() => {
      setHighlightIdx((i) => (i + 1) % activeSlides.length);
    }, 4600);
    return () => clearInterval(t);
  }, [activeSlides.length]);

  const currentHighlight = activeSlides[highlightIdx % activeSlides.length] || activeSlides[0];
  const HighlightIcon = currentHighlight.icon;

  // Trước đây login/register đổi chỗ 2 cột (order + bo góc lật theo framer-motion layout) — gây khó
  // theo dõi vì cả bố cục trang nhảy sang bên khác mỗi lần đổi form. Giờ info panel cố định bên trái,
  // form cố định bên phải; chỉ nội dung BÊN TRONG mỗi panel đổi (vẫn giữ animation fade/slide cũ).
  return (
    <section style={{ minHeight: '100vh', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap' }}>
        <div className="auth-info" style={{ zIndex: 1, position: 'relative', overflow: 'hidden', flex: '1 1 420px', background: 'var(--surface-hero)', borderRadius: '0 48px 48px 0', padding: 'clamp(28px,4vw,64px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-6)', minHeight: '100vh' }}>
          {/* Lớp trang trí SVG nghệ thuật cao cấp cho panel bên trái */}
          <svg
            aria-hidden="true"
            viewBox="0 0 520 900"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 0,
              overflow: 'hidden',
            }}
          >
            <defs>
              <linearGradient id="authGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D97706" stopOpacity="0.22" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="authStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#D97706" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="authTopGlow" cx="20%" cy="15%" r="65%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="authBottomGlow" cx="85%" cy="85%" r="55%">
                <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Ambient glowing radial lights */}
            <rect width="100%" height="100%" fill="url(#authTopGlow)" />
            <rect width="100%" height="100%" fill="url(#authBottomGlow)" />

            {/* Elegant flowing luxury wave lines */}
            <path
              d="M-40,240 C140,200 240,360 440,260 C520,220 560,240 600,280"
              stroke="url(#authStrokeGrad)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            <path
              d="M-60,280 C110,240 220,410 460,300 C540,260 580,280 620,320"
              stroke="url(#authGoldGrad)"
              strokeWidth="2.5"
            />
            <path
              d="M-20,720 C160,650 280,800 480,710 C540,680 580,700 620,740"
              stroke="url(#authStrokeGrad)"
              strokeWidth="1.5"
              strokeDasharray="6 8"
            />

            {/* Watermark Biển Số Dập Nổi Mờ (Luxury Embossed Plate Outline) */}
            <g transform="translate(260, 520) rotate(-14)" opacity="0.05">
              <rect x="0" y="0" width="300" height="160" rx="20" stroke="#1E293B" strokeWidth="6" fill="none" />
              <rect x="8" y="8" width="284" height="144" rx="14" stroke="#1E293B" strokeWidth="2" fill="none" />
              <circle cx="150" cy="20" r="4.5" fill="#1E293B" />
              <circle cx="30" cy="80" r="4.5" fill="#1E293B" />
              <circle cx="270" cy="80" r="4.5" fill="#1E293B" />
              <text x="150" y="70" textAnchor="middle" fontSize="34" fontFamily="monospace" fontWeight="900" fill="#1E293B" letterSpacing="4">43A - VIP</text>
              <text x="150" y="125" textAnchor="middle" fontSize="42" fontFamily="monospace" fontWeight="900" fill="#1E293B" letterSpacing="6">999.99</text>
            </g>

            {/* Sacred Fengshui Sun / Star Compass Motif */}
            <g transform="translate(440, 110)" opacity="0.055">
              <circle cx="0" cy="0" r="130" stroke="#D97706" strokeWidth="1.5" strokeDasharray="4 6" />
              <circle cx="0" cy="0" r="95" stroke="#D97706" strokeWidth="1" />
              <circle cx="0" cy="0" r="60" stroke="#D97706" strokeWidth="1.5" strokeDasharray="8 8" />
              <circle cx="0" cy="0" r="28" stroke="#D97706" strokeWidth="1" />
              <line x1="-140" y1="0" x2="140" y2="0" stroke="#D97706" strokeWidth="1" />
              <line x1="0" y1="-140" x2="0" y2="140" stroke="#D97706" strokeWidth="1" />
              <line x1="-100" y1="-100" x2="100" y2="100" stroke="#D97706" strokeWidth="0.8" />
              <line x1="-100" y1="100" x2="100" y2="-100" stroke="#D97706" strokeWidth="0.8" />
            </g>

            {/* Sparkle Stars */}
            <g transform="translate(90, 140)" opacity="0.12">
              <path d="M0,-8 L2,-2 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,-2 Z" fill="#F59E0B" />
            </g>
            <g transform="translate(380, 360)" opacity="0.1">
              <path d="M0,-10 L2.5,-2.5 L10,0 L2.5,2.5 L0,10 L-2.5,2.5 L-10,0 L-2.5,-2.5 Z" fill="#D97706" />
            </g>
            <g transform="translate(60, 580)" opacity="0.1">
              <path d="M0,-7 L2,-2 L7,0 L2,2 L0,7 L-2,2 L-7,0 L-2,-2 Z" fill="#F59E0B" />
            </g>
          </svg>

          {/* Header với Logo có thể nhấn để về trang chủ */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
            <a
              href={routeFor('home')}
              onClick={goHome}
              className="pressable"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                textDecoration: 'none',
                cursor: 'pointer',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 8px 4px 4px',
                marginLeft: -4,
                transition: 'opacity 180ms ease, transform 180ms ease',
              }}
              title="Nhấn để quay về trang chủ Duy Đinh"
            >
              <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/assets/logo-mark.png" alt="Duy Đinh" style={{ width: 38, height: 38, objectFit: 'contain' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-strong)', lineHeight: 1.1 }}>Duy Đinh</span>
                <span style={{ font: '10px var(--font-sans)', fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Biển Số Đẹp</span>
              </div>
            </a>

            <a
              href={routeFor('home')}
              onClick={goHome}
              className="pressable"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(217, 119, 6, 0.25)',
                font: 'var(--type-caption)',
                fontWeight: 'var(--fw-semibold)',
                color: 'var(--action-primary)',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 160ms var(--ease-out)',
              }}
            >
              <ArrowLeft size={14} /> Trang chủ
            </a>
          </div>

          {/* Biển số thực tế nổi bật dập nổi */}
          {!!plate && (
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 0, gap: 'var(--space-3)', margin: 'var(--space-2) 0' }}>
            <AnimatePresence mode="wait">
              <motion.a
                href={routeFor('detail', plate.slug || plate.id)}
                onClick={goPlateDetail}
                key={plate.id}
                initial={{ opacity: 0, rotateY: -18, scale: 0.94 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: 18, scale: 0.94 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: 380,
                  background: 'rgba(255, 255, 255, 0.55)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.85)',
                  borderRadius: 24,
                  padding: '18px 16px 14px',
                  boxShadow: '0 20px 40px -15px rgba(217, 119, 6, 0.14), 0 4px 12px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ width: 'clamp(250px, 28vw, 320px)', filter: 'drop-shadow(0 16px 28px rgba(0,0,0,.2))' }}>
                  <PlateVisual size="lg" {...splitPlateNumber(plate.plateNumber)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                      {[plate.vehicleType, plate.province].filter(Boolean).join(' · ')}
                    </span>
                    {plate.isHot && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--status-danger)', color: 'var(--white)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)', boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)' }}>
                        <Flame size={11} fill="currentColor" /> HOT
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(217, 119, 6, 0.12)', color: 'var(--action-primary)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)' }}>
                      VIP
                    </span>
                  </div>
                  <span style={{ font: 'var(--type-body)', fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)' }}>
                    {formatPrice(plate.price, plate.priceOnRequest)}
                  </span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    Xem chi tiết biển này <ChevronRight size={13} style={{ color: 'var(--action-primary)' }} />
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
                  {plates.map((_, i) => (
                    <span
                      key={i}
                      style={{
                        width: i === plateIdx ? 18 : 5,
                        height: 5,
                        borderRadius: 'var(--radius-pill)',
                        background: i === plateIdx ? 'var(--action-primary)' : 'rgba(0, 0, 0, 0.15)',
                        transition: 'all 250ms var(--ease-out)',
                      }}
                    />
                  ))}
                </div>
              </motion.a>
            </AnimatePresence>
          </div>
          )}

          {/* Khối nội dung động thực tế trong dự án (chuyển đổi thường xuyên) */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${s}-${currentHighlight.id}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={CONTENT_FADE}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
              >
                {/* Badge danh mục / đặc quyền */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      background: currentHighlight.badgeBg,
                      border: `1px solid ${currentHighlight.badgeBorder}`,
                      color: currentHighlight.badgeColor,
                      font: 'var(--type-caption)',
                      fontWeight: 'var(--fw-bold)',
                      fontSize: 'var(--fs-micro)',
                      letterSpacing: '.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <HighlightIcon size={12} />
                    {currentHighlight.badge}
                  </span>
                  {lastEmail && s === 'login' && (
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      Chào mừng quay lại, <strong>{lastEmail}</strong>
                    </span>
                  )}
                </div>

                {/* Tiêu đề giá trị thực tế */}
                <h2
                  style={{
                    margin: 0,
                    font: 'var(--type-title-1)',
                    letterSpacing: 'var(--ls-title)',
                    color: 'var(--text-strong)',
                    lineHeight: 1.3,
                    fontSize: 'clamp(1.15rem, 1.8vw, 1.45rem)',
                  }}
                >
                  {currentHighlight.title}
                </h2>

                {/* Mô tả chi tiết */}
                <p
                  style={{
                    margin: 0,
                    font: 'var(--type-body-sm)',
                    color: 'var(--text-body)',
                    lineHeight: 1.55,
                    maxWidth: 440,
                  }}
                >
                  {currentHighlight.desc}
                </p>

                {/* Thẻ chỉ số thực tế */}
                {currentHighlight.metrics && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {currentHighlight.metrics.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-control)',
                          background: 'rgba(255, 255, 255, 0.7)',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', color: 'var(--text-muted)' }}>
                          {m.label}:
                        </span>
                        <span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Thanh điều hướng chuyển đổi slide thường xuyên */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {activeSlides.map((item, idx) => {
                  const isActive = idx === (highlightIdx % activeSlides.length);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHighlightIdx(idx)}
                      aria-label={`Chuyển đến: ${item.badge}`}
                      style={{
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          height: 5,
                          width: isActive ? 24 : 6,
                          borderRadius: 'var(--radius-pill)',
                          background: isActive ? 'var(--action-primary)' : 'rgba(0, 0, 0, 0.16)',
                          transition: 'all 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
              <span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', color: 'var(--text-faint)' }}>
                {(highlightIdx % activeSlides.length) + 1} / {activeSlides.length}
              </span>
            </div>
          </div>
        </div>
        <div style={{ flex: '1 1 420px', background: 'var(--white)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* .auth-info (logo + "Trang chủ") ẩn hoàn toàn dưới 768px — không còn cách nào thoát về
              trang chủ ngoài nút back trình duyệt. Header rút gọn này chỉ hiện trên mobile để bù lại. */}
          <a href={routeFor('home')} onClick={goHome} className="auth-mobile-back pressable" style={{ display: 'none', alignItems: 'center', gap: 8, padding: '16px clamp(28px,4vw,64px) 0', textDecoration: 'none' }}>
            <ArrowLeft size={18} style={{ color: 'var(--text-strong)' }} />
            <img src="/assets/logo-mark.png" alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Duy Đinh</span>
          </a>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(28px,4vw,64px)', paddingBottom: 'calc(clamp(28px,4vw,64px) + env(safe-area-inset-bottom, 0px) + 24px)' }}>
          <AnimatePresence mode="wait">
          <motion.div key={`${s}-${otpMode ? 'otp' : 'std'}`}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={CONTENT_FADE}
            style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {s === 'forgot' && <Eyebrow tone="blue">{`Bước ${st.step}/3`}</Eyebrow>}
            {otpMode && <Eyebrow tone="blue">{`Đăng nhập bằng OTP · Bước ${st.step}/2`}</Eyebrow>}
            <div>
              <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>
                {otpMode ? (st.step === 1 ? 'Đăng nhập bằng OTP' : 'Nhập mã xác thực') : authMeta[0]}
              </h1>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                {otpMode ? (st.step === 1 ? 'Không cần nhớ mật khẩu — nhận mã qua email.' : 'Mã 6 số đã được gửi tới email của bạn.') : authMeta[1]}
              </p>
            </div>

            {s === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={st.aName} error={st.aErr.name} onChange={setField('aName')} onBlur={blurValidateRegisterField('name')} required />
                <Input label="Mã giới thiệu (không bắt buộc)" placeholder="Mã CTV giới thiệu bạn" value={st.aReferral} error={st.aErr.referral} onChange={setField('aReferral')} />
                <Input label="Email" placeholder="email@example.com" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} onBlur={blurValidateRegisterField('email')} required />
                <div>
                  <Input label="Số điện thoại (không bắt buộc)" placeholder="09xx xxx xxx" value={st.aPhone} error={st.aErr.phone} onChange={setField('aPhone')} onBlur={blurValidateRegisterField('phone')} />
                  <span style={{ display: 'block', marginTop: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Khuyến khích thêm để chúng tôi liên hệ Zalo nhanh hơn khi có biển phù hợp.</span>
                </div>
                <Input label="Mật khẩu" type="password" placeholder="Tối thiểu 8 ký tự, có chữ và số" value={st.aPw} error={st.aErr.pw} onChange={(e) => patch({ aPw: e.target.value, aErr: { ...st.aErr, pw: '', pw2: '' } })} onBlur={blurValidateRegisterField('pw')} required />
                <PasswordStrength value={st.aPw} />
                <Input label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu" value={st.aPw2} error={st.aErr.pw2} onChange={(e) => patch({ aPw2: e.target.value, aErr: { ...st.aErr, pw2: '' } })} onBlur={blurValidateRegisterField('pw2')} required />
                <Checkbox label="Tôi đồng ý với điều khoản sử dụng" checked={st.aAgree} onChange={(v) => patch({ aAgree: v })} />
                {st.aErr.agree && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Bạn cần đồng ý với điều khoản để tiếp tục.</span>}
              </div>
            )}
            {s === 'login' && !!st.a2faToken && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Nhập mã xác thực 2 lớp</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Mở app xác thực (Google Authenticator/Authy) và nhập mã 6 số, hoặc dùng 1 mã khôi phục.</span>
                <Input label="Mã xác thực" placeholder="123456" value={st.a2faCode || ''} error={st.aErr.otp} onChange={setField('a2faCode')} />
              </div>
            )}
            {s === 'login' && !otpMode && !st.a2faToken && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {st.aErr.lockedReason && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 'var(--space-4)', borderRadius: 'var(--radius-card)', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)' }}>
                    <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--status-danger-ink)' }}>Tài khoản của bạn đã bị khóa</span>
                    <span style={{ font: 'var(--type-body-sm)', color: 'var(--status-danger-ink)' }}>{st.aErr.lockedReason}</span>
                    {zalo && (
                      <a href={toZaloUrl(zalo)} target="_blank" rel="noopener noreferrer" style={{ alignSelf: 'flex-start', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)', textDecoration: 'none' }}>
                        Liên hệ bộ phận hỗ trợ qua Zalo →
                      </a>
                    )}
                  </div>
                )}
                <Input label="Email hoặc số điện thoại" placeholder="email@example.com hoặc 09xx xxx xxx" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} required />
                <Input label="Mật khẩu" type="password" placeholder="••••••••" value={st.aPw} error={st.aErr.pw} onChange={setField('aPw')} required />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <Checkbox label="Ghi nhớ đăng nhập" checked={remember} onChange={setRemember} />
                  <button type="button" onClick={() => { patch({ aErr: {}, aPw: '' }); setOtpMode(true); }} style={{ border: 'none', background: 'none', padding: 0, font: 'var(--type-caption)', color: 'var(--action-primary)', cursor: 'pointer' }}>Đăng nhập bằng OTP</button>
                </div>
                <a href={routeFor('forgot')} onClick={(e) => { e.preventDefault(); go('forgot')(); }} style={{ alignSelf: 'flex-end', font: 'var(--type-caption)', color: 'var(--action-primary)', textDecoration: 'none' }}>Quên mật khẩu?</a>
                <a href={routeFor('adminForgot')} onClick={(e) => { e.preventDefault(); go('adminForgot')(); }} style={{ alignSelf: 'flex-end', font: 'var(--type-caption)', color: 'var(--text-muted)', textDecoration: 'none' }}>Quên mật khẩu quản trị?</a>
              </div>
            )}
            {s === 'login' && otpMode && st.step === 1 && (
              <Input label="Email đã đăng ký" placeholder="email@example.com" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} required />
            )}
            {s === 'login' && otpMode && st.step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mã xác thực 6 số</span>
                <OtpBoxes value={st.aOtp} onChange={(v) => patch({ aOtp: v, aErr: { ...st.aErr, otp: '' } })}
                  error={st.aErr.otp} disabled={/sai quá|khóa/.test(st.aErr.otp || '')} />
                {st.aErr.otp && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{st.aErr.otp}</span>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', font: 'var(--type-caption)' }}>
                  {resendIn > 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>Gửi lại mã sau {resendIn}s</span>
                  ) : (
                    <button type="button" onClick={handleResend} style={{ border: 'none', background: 'none', padding: 0, font: 'var(--type-caption)', color: 'var(--action-primary)', cursor: 'pointer' }}>Gửi lại mã</button>
                  )}
                </div>
              </div>
            )}
            {s === 'forgot' && st.step === 1 && <Input label="Email đã đăng ký" placeholder="email@example.com" value={st.aEmail} error={st.aErr.email} onChange={setField('aEmail')} required />}
            {s === 'forgot' && st.step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mã xác thực 6 số</span>
                <OtpBoxes value={st.aOtp} onChange={(v) => patch({ aOtp: v, aErr: { ...st.aErr, otp: '' } })}
                  error={st.aErr.otp} disabled={/sai quá|khóa/.test(st.aErr.otp || '')} />
                {st.aErr.otp && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{st.aErr.otp}</span>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', font: 'var(--type-caption)' }}>
                  {resendIn > 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>Gửi lại mã sau {resendIn}s</span>
                  ) : (
                    <button type="button" onClick={handleResend} style={{ border: 'none', background: 'none', padding: 0, font: 'var(--type-caption)', color: 'var(--action-primary)', cursor: 'pointer' }}>Gửi lại mã</button>
                  )}
                </div>
              </div>
            )}
            {s === 'forgot' && st.step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Input label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" value={st.aPw} error={st.aErr.pw} onChange={setField('aPw')} required />
                <PasswordStrength value={st.aPw} />
                <Input label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu" value={st.aPw2} error={st.aErr.pw2} onChange={setField('aPw2')} required />
              </div>
            )}

            {s === 'login' && !!st.a2faToken ? (
              <Button variant="primary" size="lg" fullWidth onClick={submitAdmin2fa}>Xác nhận</Button>
            ) : otpMode ? (
              <Button variant="primary" size="lg" fullWidth onClick={() => (st.step === 1 ? otpLoginRequest() : otpLoginVerify(remember))}>
                {st.step === 1 ? 'Gửi mã OTP' : 'Xác nhận & đăng nhập'}
              </Button>
            ) : (
              <Button variant="primary" size="lg" fullWidth onClick={() => submitAuth(remember)}>{authMeta[2]}</Button>
            )}

            {otpMode && (
              <Button variant="ghost" size="md" fullWidth onClick={() => {
                if (st.step > 1) patch({ step: 1, aErr: {}, aOtp: '' });
                else { setOtpMode(false); patch({ aErr: {}, step: 1 }); }
              }}>
                {st.step > 1 ? '← Nhập email khác' : '← Đăng nhập bằng mật khẩu'}
              </Button>
            )}
            {s === 'forgot' && (
              <Button variant="ghost" size="md" fullWidth onClick={() => { if (st.step > 1) patch({ step: st.step - 1, aErr: {} }); else { patch({ aErr: {} }); onNavigate('login'); } }}>
                {st.step > 1 ? '← Quay lại bước trước' : '← Quay lại đăng nhập'}
              </Button>
            )}
            {s === 'login' && !!st.a2faToken && (
              <Button variant="ghost" size="md" fullWidth onClick={() => patch({ a2faToken: null, a2faCode: '', aErr: {} })}>
                ← Quay lại đăng nhập
              </Button>
            )}

            {(s === 'register' || s === 'login') && !otpMode && !st.a2faToken && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: '4px 0' }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Hoặc</span>
                  <span style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
                </div>
                <GoogleSignInButton onCredential={handleGoogleCredential} />
                {linkErr && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)', textAlign: 'center' }}>{linkErr}</span>}
              </>
            )}

            {(s === 'register' || s === 'login') && !st.a2faToken && (
              <p style={{ margin: 0, textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                {s === 'register' ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
                <a href={routeFor(s === 'register' ? 'login' : 'register')} onClick={(e) => { e.preventDefault(); go(s === 'register' ? 'login' : 'register')(); }} style={{ color: 'var(--action-primary)', textDecoration: 'none' }}>{s === 'register' ? 'Đăng nhập' : 'Đăng ký ngay'}</a>
              </p>
            )}
          </motion.div>
          </AnimatePresence>
          </div>
        </div>
      </div>

      <Modal open={!!googleLinkPending} onClose={() => setGoogleLinkPending(null)} title="Xác nhận liên kết Google" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Email <b>{googleLinkPending?.email}</b> đã có tài khoản. Nhập mã OTP vừa gửi tới email để xác nhận liên kết với Google.
          </p>
          <Input label="Mã OTP" value={linkOtp} onChange={(e) => setLinkOtp(e.target.value)} error={linkErr} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setGoogleLinkPending(null)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={confirmGoogleLink} loading={googleConfirmLink.isPending}>Xác nhận</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
