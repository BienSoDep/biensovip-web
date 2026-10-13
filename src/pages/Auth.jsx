import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Bell,
  MessageCircle,
  Star,
  Flame,
  Check,
  ShieldCheck,
  Sparkles,
  Award,
  ChevronRight,
  Shield,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
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

const CONTENT_FADE = { duration: 0.35, ease: [0.16, 1, 0.3, 1] };
const LAST_EMAIL_KEY = 'bsd_last_email';

const PROJECT_HIGHLIGHTS = [
  {
    id: 'vpa',
    badge: 'Kho Đấu Giá VPA',
    badgeColor: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: 'rgba(245, 158, 11, 0.3)',
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
    badgeColor: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeBorder: 'rgba(16, 185, 129, 0.3)',
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
    badgeColor: '#A855F7',
    badgeBg: 'rgba(168, 85, 247, 0.12)',
    badgeBorder: 'rgba(168, 85, 247, 0.3)',
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
    badgeColor: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.12)',
    badgeBorder: 'rgba(56, 189, 248, 0.3)',
    icon: Award,
    title: 'Hơn 10 năm kinh nghiệm – 5.000+ biển số trao tay',
    desc: 'Hỗ trợ giao dịch và hoàn tất thủ tục định danh trọn gói toàn quốc. Giá cả niêm yết công khai, không chi phí ẩn, đồng hành cùng khách hàng suốt quá trình sử dụng.',
    metrics: [
      { label: 'Biển đã trao tay', value: '5.000+' },
      { label: 'Đánh giá hài lòng', value: '4.9 / 5 Sao' },
      { label: 'Phạm vi hỗ trợ', value: 'Toàn quốc' },
    ],
  },
];

const REGISTER_BENEFIT_SLIDES = [
  {
    id: 'favs',
    badge: 'Lưu & So Sánh Giá',
    badgeColor: '#FB7185',
    badgeBg: 'rgba(251, 113, 133, 0.12)',
    badgeBorder: 'rgba(251, 113, 133, 0.3)',
    icon: Heart,
    title: 'Lưu biển số yêu thích & Theo dõi biến động giá',
    desc: 'Lưu trữ không giới hạn các tấm biển bạn đang quan tâm, so sánh giá trực quan và xem lại lịch sử đấu giá bất cứ lúc nào.',
    metrics: [
      { label: 'Kho lưu yêu thích', value: 'Không giới hạn' },
      { label: 'Cập nhật giá', value: 'Thời gian thực' },
      { label: 'Lịch sử giá', value: 'Minh bạch' },
    ],
  },
  {
    id: 'notify',
    badge: 'Báo Biển Hợp Mệnh',
    badgeColor: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: 'rgba(245, 158, 11, 0.3)',
    icon: Bell,
    title: 'Nhận thông báo ngay khi có biển mới hợp tuổi',
    desc: 'Hệ thống tự động thông báo qua Zalo/Email ngay khi kho có biển số mới thuộc cung mệnh tương sinh hoặc đầu số VIP bạn tìm kiếm.',
    metrics: [
      { label: 'Báo biển mới', value: 'Tức thì' },
      { label: 'Gợi ý cá nhân', value: 'Theo can chi' },
      { label: 'Kênh nhận tin', value: 'Zalo & Email' },
    ],
  },
  {
    id: 'ctv',
    badge: 'Mạng Lưới CTV VIP',
    badgeColor: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeBorder: 'rgba(16, 185, 129, 0.3)',
    icon: Star,
    title: 'Tham gia mạng lưới CTV – Hoa hồng hấp dẫn',
    desc: 'Nhận mã giới thiệu riêng, tiếp cận kho biển đẹp toàn quốc và nhận hoa hồng giao dịch minh bạch, chi trả nhanh gọn trong 24 giờ.',
    metrics: [
      { label: 'Hoa hồng chiết khấu', value: 'Hấp dẫn & Minh bạch' },
      { label: 'Thời gian chi trả', value: 'Trong 24h' },
      { label: 'Hỗ trợ nghiệp vụ', value: '1-kèm-1' },
    ],
  },
];

const PW_RULES = [
  { label: 'Tối thiểu 8 ký tự', test: (v) => v.length >= 8 },
  { label: 'Có chữ hoa', test: (v) => /[A-Z]/.test(v) },
  { label: 'Có chữ thường', test: (v) => /[a-z]/.test(v) },
  { label: 'Có số', test: (v) => /\d/.test(v) },
  { label: 'Có ký tự đặc biệt', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: -4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 'var(--radius-pill)',
              background: i <= level ? meta.color : 'var(--border-hairline)',
              transition: 'background 200ms ease',
            }}
          />
        ))}
        <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: meta.color, marginLeft: 6 }}>
          {meta.text}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
        {PW_RULES.map((r) => {
          const ok = r.test(value);
          return (
            <span
              key={r.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                font: 'var(--type-caption)',
                fontSize: 'var(--fs-micro)',
                color: ok ? 'var(--status-success)' : 'var(--text-faint)',
              }}
            >
              {ok ? <Check size={11} strokeWidth={2.5} /> : <span style={{ width: 11, textAlign: 'center' }}>·</span>}
              {r.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function Auth({
  st,
  s,
  patch,
  onNavigate,
  go,
  openPlate,
  setField,
  authMeta,
  authSubmit,
  otpLoginRequest,
  otpLoginVerify,
  resendOtp,
  submitAdmin2fa,
  blurValidateRegisterField,
  zalo,
}) {
  const [otpMode, setOtpMode] = useState(false);
  const [remember, setRemember] = useState(true);
  const [lastEmail, setLastEmail] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const isOtpStep = (s === 'login' && otpMode && st.step === 2) || (s === 'forgot' && st.step === 2);

  useEffect(() => {
    if (s !== 'login') {
      setOtpMode(false);
    }
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
    try {
      setLastEmail(localStorage.getItem(LAST_EMAIL_KEY) || '');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (s === 'login' && lastEmail && !st.aEmail) patch({ aEmail: lastEmail });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, lastEmail]);

  const abandonRef = useRef({ s, hasInput: false, loggedIn: false });
  useEffect(() => {
    abandonRef.current.s = s;
    abandonRef.current.hasInput = Boolean(st.aName || st.aEmail || st.aPhone || st.aPw);
    abandonRef.current.loggedIn = Boolean(st.user);
  });
  useEffect(
    () => () => {
      const { s: lastS, hasInput, loggedIn } = abandonRef.current;
      if (hasInput && !loggedIn) trackFormAbandon(lastS === 'register' ? 'auth_register' : 'auth_login');
    },
    [],
  );

  const goHome = (e) => {
    e.preventDefault();
    go('home')();
  };

  const googleLogin = useGoogleLogin();
  const googleConfirmLink = useGoogleConfirmLink();
  const [googleLinkPending, setGoogleLinkPending] = useState(null);
  const [linkOtp, setLinkOtp] = useState('');
  const [linkErr, setLinkErr] = useState('');

  const handleGoogleCredential = (idToken) => {
    setLinkErr('');
    googleLogin.mutate(idToken, {
      onSuccess: () => go('home')(),
      onError: (e) => {
        if (e?.code === 'LINK_CONFIRMATION_REQUIRED') {
          try {
            const payload = JSON.parse(atob(idToken.split('.')[1]));
            setGoogleLinkPending({ email: payload.email, idToken });
          } catch {
            setGoogleLinkPending({ email: '', idToken });
          }
        } else {
          setLinkErr(e?.message || 'Đăng nhập Google thất bại.');
        }
      },
    });
  };

  const confirmGoogleLink = () => {
    if (!linkOtp.trim()) {
      setLinkErr('Nhập mã OTP đã gửi tới email.');
      return;
    }
    googleConfirmLink.mutate(
      { email: googleLinkPending.email, otpCode: linkOtp.trim(), idToken: googleLinkPending.idToken },
      {
        onSuccess: () => {
          setGoogleLinkPending(null);
          go('home')();
        },
        onError: (e) => setLinkErr(e?.message || 'Xác nhận thất bại.'),
      },
    );
  };

  const submitAuth = (rememberParam) => {
    if (s === 'register' && st.aPw !== st.aPw2) {
      patch({ aErr: { ...st.aErr, pw2: 'Hai mật khẩu chưa khớp.' } });
      return;
    }
    authSubmit(rememberParam);
  };

const FALLBACK_PLATES = [
  { id: 'sample-1', plateNumber: '43B-739.99', vehicleType: 'Ô tô', province: 'Đà Nẵng', price: 155000000, isHot: true },
  { id: 'sample-2', plateNumber: '51K-888.88', vehicleType: 'Ô tô', province: 'TP.HCM', price: 850000000, isHot: true },
  { id: 'sample-3', plateNumber: '30L-999.99', vehicleType: 'Ô tô', province: 'Hà Nội', price: 1200000000, isHot: true },
  { id: 'sample-4', plateNumber: '43C-688.68', vehicleType: 'Xe máy', province: 'Đà Nẵng', price: 68000000, isHot: false },
];

  // Xoay biển thực tế nổi bật mỗi 3.8s
  const { data: featuredPlates } = useFeaturedPlates(6);
  const plates = featuredPlates?.length ? featuredPlates : FALLBACK_PLATES;
  const [plateIdx, setPlateIdx] = useState(0);
  useEffect(() => {
    if (plates.length < 2) return;
    const t = setInterval(() => setPlateIdx((i) => (i + 1) % plates.length), 3800);
    return () => clearInterval(t);
  }, [plates.length]);
  const plate = plates[plateIdx % (plates.length || 1)];
  const goPlateDetail = plate
    ? (e) => {
        e.preventDefault();
        openPlate?.(plate.id);
        go('detail')();
      }
    : undefined;

  const activeSlides = s === 'register' ? REGISTER_BENEFIT_SLIDES : PROJECT_HIGHLIGHTS;
  const [highlightIdx, setHighlightIdx] = useState(0);

  useEffect(() => {
    setHighlightIdx(0);
  }, [s]);

  useEffect(() => {
    const t = setInterval(() => {
      setHighlightIdx((i) => (i + 1) % activeSlides.length);
    }, 5200);
    return () => clearInterval(t);
  }, [activeSlides.length]);

  const currentHighlight = activeSlides[highlightIdx % activeSlides.length] || activeSlides[0];
  const HighlightIcon = currentHighlight.icon;

  return (
    <section style={{ minHeight: '100vh', animation: 'pageIn 200ms var(--ease-out)', background: 'var(--white)' }}>
      <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap' }}>
        {/* PANEL TRÁI: SHOWCASE ĐẲNG CẤP (CHAMPAGNE PORCELAIN & WARM GOLD - LIGHT TONE) */}
        <div
          className="auth-info"
          style={{
            zIndex: 1,
            position: 'relative',
            overflow: 'hidden',
            flex: '1.15 1 480px',
            background: 'radial-gradient(130% 120% at 20% 15%, #FFFFFF 0%, #FDFBF7 48%, #F6F1E3 100%)',
            padding: 'clamp(32px, 4.5vw, 64px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 'var(--space-6)',
            minHeight: '100vh',
            boxShadow: 'inset -1px 0 0 rgba(217, 119, 6, 0.14)',
          }}
        >
          {/* Lớp ánh sáng nghệ thuật & họa tiết vân giấy chứng nhận xe sang */}
          <svg
            aria-hidden="true"
            viewBox="0 0 600 1000"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            <defs>
              <radialGradient id="authHeroGlowTop" cx="25%" cy="15%" r="65%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.14" />
                <stop offset="50%" stopColor="#D97706" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#F6F1E3" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="authHeroGlowBottom" cx="85%" cy="85%" r="60%">
                <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.16" />
                <stop offset="60%" stopColor="#D97706" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#F6F1E3" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="goldCurveStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D97706" stopOpacity="0.32" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.04" />
              </linearGradient>
            </defs>

            <rect width="100%" height="100%" fill="url(#authHeroGlowTop)" />
            <rect width="100%" height="100%" fill="url(#authHeroGlowBottom)" />

            {/* Guilloché waves (vân bảo mật giấy tờ định danh xe) */}
            <path
              d="M-50,220 C160,160 280,340 500,240 C580,200 640,220 700,260"
              stroke="url(#goldCurveStroke)"
              strokeWidth="1.4"
              strokeDasharray="4 6"
            />
            <path
              d="M-70,260 C130,200 250,380 520,280 C600,240 660,260 720,300"
              stroke="#D97706"
              strokeOpacity="0.1"
              strokeWidth="2"
            />
            <path
              d="M-30,760 C180,680 300,840 520,740 C580,710 640,730 700,770"
              stroke="url(#goldCurveStroke)"
              strokeWidth="1.4"
              strokeDasharray="6 8"
            />

            {/* Delicate luxury stars */}
            <g transform="translate(100, 160)" opacity="0.35">
              <path d="M0,-8 L2,-2 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,-2 Z" fill="#D97706" />
            </g>
            <g transform="translate(480, 220)" opacity="0.25">
              <path d="M0,-6 L1.5,-1.5 L6,0 L1.5,1.5 L0,6 L-1.5,1.5 L-6,0 L-1.5,-1.5 Z" fill="#F59E0B" />
            </g>
            <g transform="translate(520, 680)" opacity="0.3">
              <path d="M0,-10 L2.5,-2.5 L10,0 L2.5,2.5 L0,10 L-2.5,2.5 L-10,0 L-2.5,-2.5 Z" fill="#D97706" />
            </g>
          </svg>

          {/* Header Panel Trái: Logo & Nút về Trang chủ */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
            }}
          >
            <a
              href={routeFor('home')}
              onClick={goHome}
              className="pressable"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
                cursor: 'pointer',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 8px 4px 0',
                transition: 'opacity 180ms ease, transform 180ms ease',
              }}
              title="Nhấn để quay về trang chủ Duy Đinh"
            >
              <div
                style={{
                  position: 'relative',
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(245, 158, 11, 0.12) 100%)',
                  border: '1px solid rgba(217, 119, 6, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.1)',
                }}
              >
                <img src="/assets/logo-mark.png" alt="Duy Đinh" style={{ width: 30, height: 30, objectFit: 'contain' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    font: 'var(--type-title-3)',
                    fontWeight: '800',
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    color: 'var(--text-strong, #0F172A)',
                    lineHeight: 1.1,
                  }}
                >
                  Duy Đinh
                </span>
                <span
                  style={{
                    font: '10px var(--font-sans)',
                    fontWeight: '700',
                    color: 'var(--action-primary, #C75B00)',
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    marginTop: 2,
                  }}
                >
                  Biển Số Đẹp · VIP
                </span>
              </div>
            </a>

            <a
              href={routeFor('home')}
              onClick={goHome}
              className="pressable"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(217, 119, 6, 0.22)',
                font: 'var(--type-caption)',
                fontWeight: '600',
                color: 'var(--text-strong, #0F172A)',
                textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                transition: 'all 200ms var(--ease-out)',
              }}
            >
              <ArrowLeft size={14} style={{ color: '#C75B00' }} /> Trang chủ
            </a>
          </div>

          {/* PLINTH SHOWCASE BIỂN SỐ THỰC TẾ (CENTER PIECE) */}
          {!!plate && (
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                minHeight: 0,
                margin: 'var(--space-2) 0',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.a
                  href={routeFor('detail', plate.slug || plate.id)}
                  onClick={goPlateDetail}
                  key={plate.id}
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.95 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: 420,
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.76) 100%)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(217, 119, 6, 0.24)',
                    borderRadius: 24,
                    padding: '24px 20px 18px',
                    boxShadow:
                      '0 24px 48px -12px rgba(217, 119, 6, 0.16), 0 8px 24px -4px rgba(0, 0, 0, 0.04), inset 0 1px 0 #FFFFFF',
                    transition: 'border-color 220ms ease, transform 220ms ease, box-shadow 220ms ease',
                  }}
                >
                  {/* Status chip: VPA Auction / Ready */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#10B981',
                        boxShadow: '0 0 6px #10B981',
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        font: '11px var(--font-sans)',
                        fontWeight: '700',
                        color: '#059669',
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Kho Biển Đấu Giá VPA · Chính Thức
                    </span>
                  </div>

                  {/* Physical Plate Visual */}
                  <div
                    style={{
                      width: 'clamp(260px, 28vw, 340px)',
                      filter: 'drop-shadow(0 16px 28px rgba(0, 0, 0, 0.14))',
                    }}
                  >
                    <PlateVisual size="lg" {...splitPlateNumber(plate.plateNumber)} />
                  </div>

                  {/* Info and Pricing */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <span style={{ font: 'var(--type-title-3)', fontWeight: '700', color: 'var(--text-strong, #0F172A)' }}>
                        {[plate.vehicleType, plate.province].filter(Boolean).join(' · ')}
                      </span>
                      {plate.isHot && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            background: '#EF4444',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: '700',
                            letterSpacing: '.04em',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                          }}
                        >
                          <Flame size={11} fill="currentColor" /> HOT
                        </span>
                      )}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'rgba(217, 119, 6, 0.12)',
                          color: '#B45309',
                          border: '1px solid rgba(217, 119, 6, 0.25)',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '.04em',
                        }}
                      >
                        VIP
                      </span>
                    </div>

                    <span
                      style={{
                        font: '1.45rem var(--font-display)',
                        fontWeight: '800',
                        color: '#B45309',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {formatPrice(plate.price, plate.priceOnRequest)}
                    </span>

                    <span
                      style={{
                        font: 'var(--type-caption)',
                        color: '#C75B00',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 2,
                        transition: 'color 160ms ease',
                      }}
                    >
                      Khám phá chi tiết tấm biển <ArrowUpRight size={14} style={{ color: '#C75B00' }} />
                    </span>
                  </div>

                  {/* Plate Carousel Step Pills */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {plates.map((_, i) => (
                      <span
                        key={i}
                        style={{
                          width: i === plateIdx ? 22 : 6,
                          height: 5,
                          borderRadius: 'var(--radius-pill)',
                          background: i === plateIdx ? 'var(--action-primary, #C75B00)' : 'rgba(0, 0, 0, 0.14)',
                          boxShadow: i === plateIdx ? '0 0 6px rgba(217, 119, 6, 0.3)' : 'none',
                          transition: 'all 280ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    ))}
                  </div>
                </motion.a>
              </AnimatePresence>
            </div>
          )}

          {/* EDITORIAL BENEFIT / HIGHLIGHT CAROUSEL */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${s}-${currentHighlight.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={CONTENT_FADE}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {/* Badge danh mục */}
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
                      fontSize: '11px',
                      fontWeight: '700',
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <HighlightIcon size={12} />
                    {currentHighlight.badge}
                  </span>
                  {lastEmail && s === 'login' && (
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted, #64748B)' }}>
                      Chào mừng quay lại, <strong style={{ color: 'var(--text-strong, #0F172A)' }}>{lastEmail}</strong>
                    </span>
                  )}
                </div>

                {/* Tiêu đề giá trị */}
                <h2
                  style={{
                    margin: 0,
                    color: 'var(--text-strong, #0F172A)',
                    lineHeight: 1.3,
                    fontFamily: 'var(--font-display)',
                    fontWeight: '800',
                    fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {currentHighlight.title}
                </h2>

                {/* Mô tả chi tiết */}
                <p
                  style={{
                    margin: 0,
                    font: 'var(--type-body-sm)',
                    color: 'var(--text-body, #334155)',
                    lineHeight: 1.6,
                    maxWidth: 480,
                  }}
                >
                  {currentHighlight.desc}
                </p>

                {/* 3 Thẻ chỉ số thực tế */}
                {currentHighlight.metrics && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {currentHighlight.metrics.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 10,
                          background: 'rgba(255, 255, 255, 0.85)',
                          border: '1px solid rgba(217, 119, 6, 0.15)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '500' }}>
                          {m.label}:
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-strong, #0F172A)' }}>
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
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
                          width: isActive ? 28 : 6,
                          borderRadius: 'var(--radius-pill)',
                          background: isActive ? 'var(--action-primary, #C75B00)' : 'rgba(0, 0, 0, 0.16)',
                          boxShadow: isActive ? '0 0 8px rgba(217, 119, 6, 0.35)' : 'none',
                          transition: 'all 280ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
              <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                {(highlightIdx % activeSlides.length) + 1} / {activeSlides.length}
              </span>
            </div>
          </div>
        </div>

        {/* PANEL PHẢI: FORM ĐĂNG NHẬP / ĐĂNG KÝ (ELEGANT MINIMAL CANVAS) */}
        <div
          style={{
            flex: '1 1 420px',
            background: 'var(--white)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            position: 'relative',
          }}
        >
          {/* Header Mobile: Chỉ hiện trên màn hình nhỏ */}
          <div
            className="auth-mobile-back"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-hairline)',
            }}
          >
            <a
              href={routeFor('home')}
              onClick={goHome}
              className="pressable"
              style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
            >
              <ArrowLeft size={18} style={{ color: 'var(--text-strong)' }} />
              <img src="/assets/logo-mark.png" alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
              <span style={{ font: 'var(--type-body-sm)', fontWeight: '700', color: 'var(--text-strong)' }}>
                Duy Đinh
              </span>
            </a>
            {plate && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--grey-100)',
                  font: 'var(--type-caption)',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--text-strong)',
                }}
              >
                {plate.plateNumber} · VIP
              </span>
            )}
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(28px, 4vw, 56px)',
              paddingBottom: 'calc(clamp(28px, 4vw, 56px) + env(safe-area-inset-bottom, 0px) + 20px)',
            }}
          >
            <div style={{ width: '100%', maxWidth: 410, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Quick Tab Switcher giữa Đăng nhập & Đăng ký */}
              {(s === 'login' || s === 'register') && !otpMode && !st.a2faToken && (
                <div
                  style={{
                    display: 'flex',
                    background: 'var(--grey-100)',
                    padding: 4,
                    borderRadius: 14,
                    border: '1px solid var(--border-hairline)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="pressable"
                    style={{
                      flex: 1,
                      padding: '9px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: s === 'login' ? 'var(--white)' : 'transparent',
                      font: 'var(--type-body-sm)',
                      fontWeight: s === 'login' ? '700' : '500',
                      color: s === 'login' ? 'var(--text-strong)' : 'var(--text-muted)',
                      boxShadow: s === 'login' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 160ms var(--ease-out)',
                    }}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('register')}
                    className="pressable"
                    style={{
                      flex: 1,
                      padding: '9px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: s === 'register' ? 'var(--white)' : 'transparent',
                      font: 'var(--type-body-sm)',
                      fontWeight: s === 'register' ? '700' : '500',
                      color: s === 'register' ? 'var(--text-strong)' : 'var(--text-muted)',
                      boxShadow: s === 'register' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 160ms var(--ease-out)',
                    }}
                  >
                    Đăng ký tài khoản
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${s}-${otpMode ? 'otp' : 'std'}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={CONTENT_FADE}
                  style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
                >
                  {s === 'forgot' && <Eyebrow tone="blue">{`Bước ${st.step}/3 · Khôi phục quyền truy cập`}</Eyebrow>}
                  {otpMode && <Eyebrow tone="blue">{`Đăng nhập bằng OTP · Bước ${st.step}/2`}</Eyebrow>}

                  <div>
                    <h1
                      style={{
                        margin: '0 0 var(--space-2)',
                        font: 'var(--type-display-3)',
                        letterSpacing: 'var(--ls-title)',
                        color: 'var(--text-strong)',
                        fontSize: 'clamp(1.4rem, 2.2vw, 1.75rem)',
                      }}
                    >
                      {otpMode ? (st.step === 1 ? 'Đăng nhập bằng OTP' : 'Nhập mã xác thực') : authMeta[0]}
                    </h1>
                    <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {otpMode
                        ? st.step === 1
                          ? 'Không cần nhớ mật khẩu — chúng tôi sẽ gửi mã OTP bảo mật qua email của bạn.'
                          : 'Mã xác thực 6 số đã được gửi tới email của bạn.'
                        : authMeta[1]}
                    </p>
                  </div>

                  {/* FORM ĐĂNG KÝ */}
                  {s === 'register' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <Input
                        label="Họ và tên"
                        placeholder="Nguyễn Văn A"
                        value={st.aName}
                        error={st.aErr.name}
                        onChange={setField('aName')}
                        onBlur={blurValidateRegisterField('name')}
                        required
                      />
                      <Input
                        label="Mã giới thiệu (không bắt buộc)"
                        info="Nhập mã của cộng tác viên đã giới thiệu bạn (nếu có) để họ được ghi nhận."
                        placeholder="Mã CTV giới thiệu bạn"
                        value={st.aReferral}
                        error={st.aErr.referral}
                        onChange={setField('aReferral')}
                      />
                      <Input
                        label="Email"
                        placeholder="email@example.com"
                        value={st.aEmail}
                        error={st.aErr.email}
                        onChange={setField('aEmail')}
                        onBlur={blurValidateRegisterField('email')}
                        required
                      />
                      <div>
                        <Input
                          label="Số điện thoại (không bắt buộc)"
                          placeholder="09xx xxx xxx"
                          value={st.aPhone}
                          error={st.aErr.phone}
                          onChange={setField('aPhone')}
                          onBlur={blurValidateRegisterField('phone')}
                        />
                        <span
                          style={{
                            display: 'block',
                            marginTop: 4,
                            font: 'var(--type-caption)',
                            fontSize: 'var(--fs-micro)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Khuyến khích cung cấp để đội ngũ liên hệ Zalo nhanh khi có biển số ưng ý.
                        </span>
                      </div>
                      <Input
                        label="Mật khẩu"
                        type="password"
                        placeholder="Tối thiểu 8 ký tự, có chữ và số"
                        value={st.aPw}
                        error={st.aErr.pw}
                        onChange={(e) => patch({ aPw: e.target.value, aErr: { ...st.aErr, pw: '', pw2: '' } })}
                        onBlur={blurValidateRegisterField('pw')}
                        required
                      />
                      <PasswordStrength value={st.aPw} />
                      <Input
                        label="Xác nhận mật khẩu"
                        type="password"
                        placeholder="Nhập lại mật khẩu"
                        value={st.aPw2}
                        error={st.aErr.pw2}
                        onChange={(e) => patch({ aPw2: e.target.value, aErr: { ...st.aErr, pw2: '' } })}
                        onBlur={blurValidateRegisterField('pw2')}
                        required
                      />
                      <Checkbox
                        label="Tôi đồng ý với điều khoản sử dụng & chính sách bảo mật"
                        checked={st.aAgree}
                        onChange={(v) => patch({ aAgree: v })}
                      />
                      {st.aErr.agree && (
                        <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>
                          Bạn cần đồng ý với điều khoản để tiếp tục.
                        </span>
                      )}
                    </div>
                  )}

                  {/* 2FA ADMIN/STAFF */}
                  {s === 'login' && !!st.a2faToken && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Nhập mã xác thực 2 lớp</span>
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        Mở app xác thực (Google Authenticator/Authy) và nhập mã 6 số, hoặc dùng 1 mã khôi phục.
                      </span>
                      <Input
                        label="Mã xác thực"
                        placeholder="123456"
                        value={st.a2faCode || ''}
                        error={st.aErr.otp}
                        onChange={setField('a2faCode')}
                      />
                    </div>
                  )}

                  {/* FORM ĐĂNG NHẬP TIÊU CHUẨN */}
                  {s === 'login' && !otpMode && !st.a2faToken && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {st.aErr.lockedReason && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            padding: 'var(--space-4)',
                            borderRadius: 'var(--radius-card)',
                            background: 'var(--status-danger-bg)',
                            border: '1px solid var(--status-danger)',
                          }}
                        >
                          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--status-danger-ink)' }}>
                            Tài khoản của bạn đã bị khóa
                          </span>
                          <span style={{ font: 'var(--type-body-sm)', color: 'var(--status-danger-ink)' }}>
                            {st.aErr.lockedReason}
                          </span>
                          {zalo && (
                            <a
                              href={toZaloUrl(zalo)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                alignSelf: 'flex-start',
                                font: 'var(--type-caption)',
                                fontWeight: 'var(--fw-semibold)',
                                color: 'var(--action-primary)',
                                textDecoration: 'none',
                              }}
                            >
                              Liên hệ bộ phận hỗ trợ qua Zalo →
                            </a>
                          )}
                        </div>
                      )}
                      <Input
                        label="Email hoặc số điện thoại"
                        placeholder="email@example.com hoặc 09xx xxx xxx"
                        value={st.aEmail}
                        error={st.aErr.email}
                        onChange={setField('aEmail')}
                        required
                      />
                      <Input
                        label="Mật khẩu"
                        type="password"
                        placeholder="••••••••"
                        value={st.aPw}
                        error={st.aErr.pw}
                        onChange={setField('aPw')}
                        required
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <Checkbox label="Ghi nhớ đăng nhập" checked={remember} onChange={setRemember} />
                        <button
                          type="button"
                          onClick={() => {
                            patch({ aErr: {}, aPw: '' });
                            setOtpMode(true);
                          }}
                          style={{
                            border: 'none',
                            background: 'none',
                            padding: 0,
                            font: 'var(--type-caption)',
                            color: 'var(--action-primary)',
                            cursor: 'pointer',
                            fontWeight: '600',
                          }}
                        >
                          Đăng nhập bằng OTP
                        </button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                        <a
                          href={routeFor('adminForgot')}
                          onClick={(e) => {
                            e.preventDefault();
                            go('adminForgot')();
                          }}
                          style={{
                            font: 'var(--type-caption)',
                            fontSize: 'var(--fs-micro)',
                            color: 'var(--text-faint)',
                            textDecoration: 'none',
                          }}
                        >
                          Quản trị viên?
                        </a>
                        <a
                          href={routeFor('forgot')}
                          onClick={(e) => {
                            e.preventDefault();
                            go('forgot')();
                          }}
                          style={{
                            font: 'var(--type-caption)',
                            color: 'var(--action-primary)',
                            textDecoration: 'none',
                            fontWeight: '600',
                          }}
                        >
                          Quên mật khẩu?
                        </a>
                      </div>
                    </div>
                  )}

                  {/* OTP LOGIN STEPS */}
                  {s === 'login' && otpMode && st.step === 1 && (
                    <Input
                      label="Email đã đăng ký"
                      placeholder="email@example.com"
                      value={st.aEmail}
                      error={st.aErr.email}
                      onChange={setField('aEmail')}
                      required
                    />
                  )}
                  {s === 'login' && otpMode && st.step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mã xác thực 6 số</span>
                      <OtpBoxes
                        value={st.aOtp}
                        onChange={(v) => patch({ aOtp: v, aErr: { ...st.aErr, otp: '' } })}
                        error={st.aErr.otp}
                        disabled={/sai quá|khóa/.test(st.aErr.otp || '')}
                      />
                      {st.aErr.otp && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{st.aErr.otp}</span>}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', font: 'var(--type-caption)' }}>
                        {resendIn > 0 ? (
                          <span style={{ color: 'var(--text-muted)' }}>Gửi lại mã sau {resendIn}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResend}
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: 0,
                              font: 'var(--type-caption)',
                              color: 'var(--action-primary)',
                              cursor: 'pointer',
                              fontWeight: '600',
                            }}
                          >
                            Gửi lại mã
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FORGOT PASSWORD STEPS */}
                  {s === 'forgot' && st.step === 1 && (
                    <Input
                      label="Email đã đăng ký"
                      placeholder="email@example.com"
                      value={st.aEmail}
                      error={st.aErr.email}
                      onChange={setField('aEmail')}
                      required
                    />
                  )}
                  {s === 'forgot' && st.step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mã xác thực 6 số</span>
                      <OtpBoxes
                        value={st.aOtp}
                        onChange={(v) => patch({ aOtp: v, aErr: { ...st.aErr, otp: '' } })}
                        error={st.aErr.otp}
                        disabled={/sai quá|khóa/.test(st.aErr.otp || '')}
                      />
                      {st.aErr.otp && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{st.aErr.otp}</span>}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', font: 'var(--type-caption)' }}>
                        {resendIn > 0 ? (
                          <span style={{ color: 'var(--text-muted)' }}>Gửi lại mã sau {resendIn}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResend}
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: 0,
                              font: 'var(--type-caption)',
                              color: 'var(--action-primary)',
                              cursor: 'pointer',
                              fontWeight: '600',
                            }}
                          >
                            Gửi lại mã
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {s === 'forgot' && st.step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <Input
                        label="Mật khẩu mới"
                        type="password"
                        placeholder="Tối thiểu 8 ký tự"
                        value={st.aPw}
                        error={st.aErr.pw}
                        onChange={setField('aPw')}
                        required
                      />
                      <PasswordStrength value={st.aPw} />
                      <Input
                        label="Xác nhận mật khẩu"
                        type="password"
                        placeholder="Nhập lại mật khẩu"
                        value={st.aPw2}
                        error={st.aErr.pw2}
                        onChange={setField('aPw2')}
                        required
                      />
                    </div>
                  )}

                  {/* NÚT SUBMIT CHÍNH */}
                  <div style={{ marginTop: 4 }}>
                    {s === 'login' && !!st.a2faToken ? (
                      <Button variant="primary" size="lg" fullWidth onClick={submitAdmin2fa}>
                        Xác nhận 2FA
                      </Button>
                    ) : otpMode ? (
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={() => (st.step === 1 ? otpLoginRequest() : otpLoginVerify(remember))}
                      >
                        {st.step === 1 ? 'Gửi mã OTP qua email' : 'Xác nhận & đăng nhập'}
                      </Button>
                    ) : (
                      <Button variant="primary" size="lg" fullWidth onClick={() => submitAuth(remember)}>
                        {authMeta[2]}
                      </Button>
                    )}
                  </div>

                  {/* NÚT QUAY LẠI TRONG OTP HOẶC FORGOT */}
                  {otpMode && (
                    <Button
                      variant="ghost"
                      size="md"
                      fullWidth
                      onClick={() => {
                        if (st.step > 1) patch({ step: 1, aErr: {}, aOtp: '' });
                        else {
                          setOtpMode(false);
                          patch({ aErr: {}, step: 1 });
                        }
                      }}
                    >
                      {st.step > 1 ? '← Nhập email khác' : '← Đăng nhập bằng mật khẩu'}
                    </Button>
                  )}
                  {s === 'forgot' && (
                    <Button
                      variant="ghost"
                      size="md"
                      fullWidth
                      onClick={() => {
                        if (st.step > 1) patch({ step: st.step - 1, aErr: {} });
                        else {
                          patch({ aErr: {} });
                          onNavigate('login');
                        }
                      }}
                    >
                      {st.step > 1 ? '← Quay lại bước trước' : '← Quay lại đăng nhập'}
                    </Button>
                  )}
                  {s === 'login' && !!st.a2faToken && (
                    <Button variant="ghost" size="md" fullWidth onClick={() => patch({ a2faToken: null, a2faCode: '', aErr: {} })}>
                      ← Quay lại đăng nhập
                    </Button>
                  )}

                  {/* TIẾP TỤC VỚI GOOGLE */}
                  {(s === 'register' || s === 'login') && !otpMode && !st.a2faToken && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: '4px 0' }}>
                        <span style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '.05em' }}>
                          Hoặc
                        </span>
                        <span style={{ flex: 1, height: 1, background: 'var(--border-hairline)' }} />
                      </div>
                      <GoogleSignInButton onCredential={handleGoogleCredential} />
                      {linkErr && (
                        <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)', textAlign: 'center' }}>
                          {linkErr}
                        </span>
                      )}
                    </>
                  )}

                  {/* FOOTER SWITCH GIỮA ĐĂNG NHẬP / ĐĂNG KÝ (DÀNH CHO KHÁCH CUỘN XUỐNG) */}
                  {(s === 'register' || s === 'login') && !st.a2faToken && (
                    <p style={{ margin: '8px 0 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                      {s === 'register' ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
                      <a
                        href={routeFor(s === 'register' ? 'login' : 'register')}
                        onClick={(e) => {
                          e.preventDefault();
                          go(s === 'register' ? 'login' : 'register')();
                        }}
                        style={{ color: 'var(--action-primary)', textDecoration: 'none', fontWeight: '700' }}
                      >
                        {s === 'register' ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
                      </a>
                    </p>
                  )}

                  {/* MICRO TRUST BAR: CAM KẾT BẢO MẬT & PHÁP LÝ */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 16,
                      paddingTop: 16,
                      marginTop: 12,
                      borderTop: '1px solid var(--border-hairline)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-faint)', fontSize: '11px' }}>
                      <Shield size={13} style={{ color: '#10B981' }} />
                      <span>Pháp lý 100%</span>
                    </div>
                    <span style={{ color: 'var(--border-hairline)' }}>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-faint)', fontSize: '11px' }}>
                      <Lock size={13} style={{ color: '#F59E0B' }} />
                      <span>Mã hóa SSL 256-bit</span>
                    </div>
                    <span style={{ color: 'var(--border-hairline)' }}>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-faint)', fontSize: '11px' }}>
                      <Sparkles size={13} style={{ color: '#3B82F6' }} />
                      <span>Hỗ trợ 24/7</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL XÁC NHẬN LIÊN KẾT GOOGLE */}
      <Modal open={!!googleLinkPending} onClose={() => setGoogleLinkPending(null)} title="Xác nhận liên kết Google" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Email <b>{googleLinkPending?.email}</b> đã có tài khoản. Nhập mã OTP vừa gửi tới email để xác nhận liên kết với Google.
          </p>
          <Input label="Mã OTP" value={linkOtp} onChange={(e) => setLinkOtp(e.target.value)} error={linkErr} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setGoogleLinkPending(null)}>
              Hủy
            </Button>
            <Button variant="primary" size="md" onClick={confirmGoogleLink} loading={googleConfirmLink.isPending}>
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
