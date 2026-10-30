import { useEffect, useState } from 'react';
import { X, Sparkles, ShieldCheck, PhoneCall, Smartphone, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TiltedCard from '../reactbits/TiltedCard.jsx';
import ShinyText from '../reactbits/ShinyText.jsx';
import MagnetButton from '../reactbits/MagnetButton.jsx';

export default function PlateShowcaseModal({ plate, onClose, defaultVertical = true }) {
  const [isVertical, setIsVertical] = useState(defaultVertical);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {plate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#050811',
            backgroundImage: `
              radial-gradient(circle at 50% 25%, rgba(245, 158, 11, 0.22) 0%, transparent 55%),
              radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 45%),
              linear-gradient(180deg, #070B14 0%, #0F172A 100%)
            `,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            color: '#FFFFFF',
            userSelect: 'none',
            overflow: 'hidden',
          }}
        >
          {/* Top Action Bar */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              left: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsVertical((v) => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  color: '#FDE047',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isVertical ? <Smartphone size={16} /> : <Monitor size={16} />}
                {isVertical ? 'Khung Dọc 9:16 (TikTok)' : 'Khung Ngang 16:9'}
              </button>
            </div>

            <MagnetButton
              onClick={onClose}
              magnetStrength={0.35}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#F8FAFC',
                padding: '10px 20px',
                borderRadius: '999px',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 700,
                backdropFilter: 'blur(12px)',
              }}
            >
              <X size={18} />
              Đóng toàn màn hình (ESC)
            </MagnetButton>
          </div>

          {/* Center Container */}
          <motion.div
            initial={{ scale: 0.88, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            style={{
              maxWidth: isVertical ? '520px' : '900px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isVertical ? '22px' : '28px',
              textAlign: 'center',
              zIndex: 5,
              padding: isVertical ? '28px 22px' : '16px',
              borderRadius: isVertical ? '32px' : '0px',
              border: isVertical ? '2px solid rgba(245, 158, 11, 0.35)' : 'none',
              backgroundColor: isVertical ? 'rgba(15, 23, 42, 0.55)' : 'transparent',
            }}
          >
            {/* Top Tag */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 22px',
                borderRadius: '999px',
                background: 'rgba(245, 158, 11, 0.14)',
                border: '1.5px solid #F59E0B',
                color: '#FBBF24',
                fontWeight: 800,
                fontSize: isVertical ? '13px' : '15px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                boxShadow: '0 0 30px rgba(245, 158, 11, 0.25)',
              }}
            >
              <Sparkles size={18} />
              <ShinyText
                text={`SIÊU PHẨM ĐẤU GIÁ • ${plate.cat || 'VIP'} • ${plate.city || 'TOÀN QUỐC'}`}
                shimmerColor="#FFFBEB"
                speed={2.5}
              />
            </div>

            {/* 3D Interactive Embossed License Plate */}
            <TiltedCard maxTilt={15} scale={1.03} style={{ width: '100%', maxWidth: '760px' }}>
              <div
                style={{
                  position: 'relative',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  border: '6px solid #0F172A',
                  boxShadow: `
                    0 0 0 4px #F59E0B,
                    0 30px 80px rgba(0, 0, 0, 0.85),
                    inset 0 0 0 4px #FFFFFF,
                    inset 0 0 0 9px #0F172A,
                    inset 0 4px 20px rgba(0,0,0,0.18)
                  `,
                  padding: isVertical ? '28px 24px' : '38px 48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'grab',
                }}
              >
                {/* Metallic Reflection */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '-20%',
                    width: '55%',
                    height: '100%',
                    background:
                      'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.75) 50%, transparent 80%)',
                    transform: 'skewX(-20deg)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Vietnamese Flag */}
                <div
                  style={{
                    position: 'absolute',
                    left: isVertical ? '18px' : '32px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      width: isVertical ? '38px' : '48px',
                      height: isVertical ? '25px' : '32px',
                      backgroundColor: '#DA251D',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    }}
                  >
                    <svg width={isVertical ? '16' : '20'} height={isVertical ? '16' : '20'} viewBox="0 0 24 24" fill="#FFFF00">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#0F172A', letterSpacing: '1px' }}>
                    VN
                  </span>
                </div>

                {/* Stamped License Number */}
                <div
                  style={{
                    fontFamily: '"DIN Alternate", "DIN 1451", "Impact", "Arial Black", sans-serif',
                    fontSize: isVertical ? 'clamp(36px, 9vw, 64px)' : 'clamp(48px, 8.5vw, 96px)',
                    fontWeight: 900,
                    letterSpacing: isVertical ? '3px' : '6px',
                    color: '#0F172A',
                    textShadow: '2px 3px 0px #CBD5E1, -1px -1px 0px #FFFFFF, 0 8px 20px rgba(0,0,0,0.18)',
                    paddingLeft: isVertical ? '32px' : '40px',
                    lineHeight: 1,
                  }}
                >
                  {plate.plateNumber || `${plate.prov}${plate.seri}-${plate.num}`}
                </div>
              </div>
            </TiltedCard>

            {/* Fengshui Description */}
            <div
              style={{
                fontSize: isVertical ? '16px' : '20px',
                color: '#E2E8F0',
                fontWeight: 600,
                maxWidth: '680px',
                lineHeight: 1.5,
              }}
            >
              ✨ {plate.fengshui || 'Thế số đại cát đại lợi — Vượng khí tài lộc bền vững cho chủ sở hữu'}
            </div>

            {/* Price & Shortcode Cards (Never shows floorPrice per BR-LIVE-01) */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '16px',
                width: '100%',
              }}
            >
              <div
                style={{
                  flex: '1 1 220px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '2px solid #10B981',
                  borderRadius: '20px',
                  padding: '16px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#A7F3D0', fontWeight: 800, letterSpacing: '1px' }}>
                  GIÁ CHỐT TRÊN SÓNG LIVE
                </span>
                <span
                  style={{
                    fontSize: isVertical ? '28px' : '36px',
                    fontWeight: 900,
                    color: '#10B981',
                    textShadow: '0 0 25px rgba(16, 185, 129, 0.45)',
                  }}
                >
                  <ShinyText text={plate.price} shimmerColor="#D1FAE5" speed={3} />
                </span>
              </div>

              <div
                style={{
                  flex: '1 1 220px',
                  backgroundColor: 'rgba(99, 102, 241, 0.14)',
                  border: '2px solid #818CF8',
                  borderRadius: '20px',
                  padding: '16px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#C7D2FE', fontWeight: 800, letterSpacing: '1px' }}>
                  MÃ TRA CỨU TẠI BIENSOVIP.COM
                </span>
                <span
                  style={{
                    fontSize: isVertical ? '28px' : '36px',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                  }}
                >
                  {plate.shortCode || '#B101'}
                </span>
              </div>
            </div>

            {/* Footer Guarantees */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '18px',
                marginTop: '4px',
                color: '#94A3B8',
                fontSize: '13.5px',
                fontWeight: 600,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={17} color="#F59E0B" />
                Pháp lý minh bạch 100%
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PhoneCall size={17} color="#10B981" />
                Hotline Chốt Đơn: <b style={{ color: '#F8FAFC' }}>0815.792.699</b>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

