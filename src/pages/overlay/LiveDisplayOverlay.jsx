import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Flame,
  Radio,
  Eye,
  EyeOff,
  RefreshCw,
  Monitor,
  Smartphone,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Share2,
  Gift,
  Users,
  Award,
} from 'lucide-react';
import gsap from 'gsap';
import ShinyText from '../../components/reactbits/ShinyText.jsx';
import { playLiveSoundEffect, stopAllLiveSounds, LIVE_EFFECT_DECK } from '../../lib/liveSoundEffects.js';

const DEFAULT_DEMO_PLATE = {
  id: 'lp-1',
  prov: '30',
  seri: 'K',
  num: '888.88',
  plateNumber: '30K-888.88',
  city: 'Hà Nội',
  cat: 'Ngũ quý',
  price: '1.850.000.000đ',
  fengshui: 'Ngũ Quý 8 — Phát tài phát lộc đỉnh cao đại cát',
  shortCode: '#B101',
  status: 'Còn hàng',
};

const EFFECT_PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: `${6 + ((i * 17) % 88)}%`,
  delay: `${(i % 7) * 0.14}s`,
  duration: `${1.8 + (i % 5) * 0.35}s`,
  size: 18 + (i % 4) * 5,
}));

export default function LiveDisplayOverlay({
  embedded = false,
  forcedLayoutMode = null,
  forcedSafeZoneGuide = null,
}) {
  const isObsEnvironment = (() => {
    if (embedded) return true;
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return (
      params.get('obs') === '1' ||
      params.get('transparent') === '1' ||
      Boolean(window.obsstudio)
    );
  })();

  const [transparentMode, setTransparentMode] = useState(isObsEnvironment);

  const [layoutMode, setLayoutMode] = useState(() => {
    if (forcedLayoutMode) return forcedLayoutMode;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('layout') === '16:9') return '16:9';
      if (params.get('layout') === '9:16') return '9:16';
      const saved = localStorage.getItem('biensovip_live_layout_mode');
      if (saved === '16:9' || saved === '9:16') return saved;
    }
    return '9:16';
  });

  const [showSafeZoneGuide, setShowSafeZoneGuide] = useState(() => {
    if (typeof forcedSafeZoneGuide === 'boolean') return forcedSafeZoneGuide;
    if (isObsEnvironment && !embedded) return false;
    try {
      return localStorage.getItem('biensovip_live_safezone_guide') === 'true';
    } catch {
      return false;
    }
  });

  const [obsMuted, setObsMuted] = useState(() => {
    try {
      return localStorage.getItem('bsv_live_obs_muted') === 'true';
    } catch {
      return false;
    }
  });

  const [activePlate, setActivePlate] = useState(() => {
    try {
      const saved = localStorage.getItem('biensovip_live_active_plate');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.plateNumber || parsed.num)) return parsed;
      }
      return DEFAULT_DEMO_PLATE;
    } catch {
      return DEFAULT_DEMO_PLATE;
    }
  });

  const [tickerMessage, setTickerMessage] = useState(() => {
    try {
      return (
        localStorage.getItem('biensovip_live_ticker_message') ||
        '🔥 KHUYẾN MÃI LIVESTREAM: Giảm ngay 10 - 20 triệu khi chốt trên sóng • Tra cứu mã #Bxxx tại biensovip.com • Hotline/Zalo: 0815.792.699'
      );
    } catch {
      return '🔥 BIỂN SỐ VIP DUY ĐINH — ĐẤU GIÁ VÀ ĐỊNH DANH BIỂN SỐ TOÀN QUỐC • HOTLINE: 0815.792.699';
    }
  });

  const [activeEffect, setActiveEffect] = useState(null);

  const cardRef = useRef(null);
  const glintRef = useRef(null);
  const liveDotRef = useRef(null);
  const tickerTrackRef = useRef(null);
  const effectTimeoutRef = useRef(null);
  const obsMutedRef = useRef(obsMuted);

  useEffect(() => {
    obsMutedRef.current = obsMuted;
  }, [obsMuted]);

  const effectiveLayoutMode = forcedLayoutMode || layoutMode;
  const effectiveSafeZoneGuide =
    typeof forcedSafeZoneGuide === 'boolean' ? forcedSafeZoneGuide : showSafeZoneGuide;

  const triggerOverlayEffect = (payload) => {
    if (!payload || !payload.effectCode) return;
    if (effectTimeoutRef.current) clearTimeout(effectTimeoutRef.current);

    if (payload.effectCode === 'FX_STOP_ALL') {
      setActiveEffect(null);
      stopAllLiveSounds();
      return;
    }

    const deckItem = LIVE_EFFECT_DECK.find((d) => d.code === payload.effectCode);
    const duration = payload.durationMs || deckItem?.durationMs || 5500;

    setActiveEffect({
      ...payload,
      startedAt: Date.now(),
    });

    // If embedded inside AdminLiveAssist preview, AdminLiveAssist already plays admin audio,
    // so embedded preview doesn't double-play audio in the same window.
    if (!embedded) {
      playLiveSoundEffect(payload.effectCode, obsMutedRef.current);
    }

    effectTimeoutRef.current = setTimeout(() => {
      setActiveEffect(null);
    }, duration);
  };

  // 1. Lắng nghe Realtime BroadcastChannel & localStorage
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel('biensovip_livestream_channel');
      channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'PIN_PLATE' && data.plate) {
          setActivePlate(data.plate);
        } else if (data.type === 'UNPIN_PLATE') {
          setActivePlate(null);
        } else if (data.type === 'TICKER_NOTICE' && data.message) {
          setTickerMessage(data.message);
        } else if (data.type === 'TRIGGER_EFFECT') {
          triggerOverlayEffect(data);
        } else if (data.type === 'STOP_EFFECT') {
          triggerOverlayEffect({ effectCode: 'FX_STOP_ALL' });
        } else if (data.type === 'SET_LAYOUT_MODE' && data.layoutMode) {
          if (!forcedLayoutMode) setLayoutMode(data.layoutMode);
        } else if (data.type === 'SET_SAFEZONE_GUIDE' && typeof data.show === 'boolean') {
          if (typeof forcedSafeZoneGuide !== 'boolean') setShowSafeZoneGuide(data.show);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }

    const handleStorage = (e) => {
      if (e.key === 'biensovip_live_active_plate') {
        try {
          const val = e.newValue ? JSON.parse(e.newValue) : null;
          setActivePlate(val && (val.plateNumber || val.num) ? val : null);
        } catch {
          setActivePlate(null);
        }
      } else if (e.key === 'biensovip_live_ticker_message') {
        if (e.newValue) setTickerMessage(e.newValue);
      } else if (e.key === 'biensovip_live_layout_mode' && e.newValue && !forcedLayoutMode) {
        setLayoutMode(e.newValue);
      } else if (e.key === 'biensovip_live_active_effect' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed) triggerOverlayEffect(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      if (effectTimeoutRef.current) clearTimeout(effectTimeoutRef.current);
      window.removeEventListener('storage', handleStorage);
    };
  }, [forcedLayoutMode, forcedSafeZoneGuide, embedded]);

  // 2. GSAP Entrance & Metallic Shimmer Animation cho Active Plate Card
  useEffect(() => {
    if (!activePlate || !cardRef.current) return;

    const cardEl = cardRef.current;
    const glintEl = glintRef.current;
    const dotEl = liveDotRef.current;

    const ctx = gsap.context(() => {
      gsap.killTweensOf([cardEl, glintEl, dotEl]);

      gsap.fromTo(
        cardEl,
        { y: layoutMode === '9:16' ? -30 : 0, x: layoutMode === '9:16' ? 0 : 70, autoAlpha: 0, scale: 0.92 },
        {
          y: 0,
          x: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.45,
          ease: 'power3.out',
          overwrite: 'auto',
          clearProps: 'transform',
        }
      );

      if (glintEl) {
        gsap.fromTo(
          glintEl,
          { x: '-150%', opacity: 0 },
          {
            x: '380%',
            opacity: 0.85,
            duration: 1.15,
            ease: 'power2.inOut',
            repeat: -1,
            repeatDelay: 3.2,
          }
        );
      }

      if (dotEl) {
        gsap.to(dotEl, {
          scale: 1.35,
          opacity: 0.4,
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    });

    return () => {
      ctx.revert();
      gsap.set(cardEl, { clearProps: 'all' });
    };
  }, [activePlate?.id, activePlate?.plateNumber, layoutMode]);

  // 3. GSAP Ticker Loop
  useEffect(() => {
    if (!tickerTrackRef.current) return;

    const track = tickerTrackRef.current;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        track,
        { x: '100%' },
        {
          x: `-${(track.scrollWidth || 1200) + 180}px`,
          duration: layoutMode === '9:16' ? 19 : 24,
          ease: 'none',
          repeat: -1,
        }
      );
    });

    return () => ctx.revert();
  }, [tickerMessage, layoutMode]);

  const handleRestoreDemoPlate = () => {
    setActivePlate(DEFAULT_DEMO_PLATE);
    try {
      localStorage.setItem('biensovip_live_active_plate', JSON.stringify(DEFAULT_DEMO_PLATE));
    } catch {
      // ignore
    }
  };

  const handleToggleObsMute = () => {
    setObsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('bsv_live_obs_muted', String(next));
      } catch {
        // ignore
      }
      if (next) stopAllLiveSounds();
      return next;
    });
  };

  const handleToggleLayout = () => {
    const next = layoutMode === '9:16' ? '16:9' : '9:16';
    setLayoutMode(next);
    try {
      localStorage.setItem('biensovip_live_layout_mode', next);
    } catch {
      // ignore
    }
  };

  const isVertical = effectiveLayoutMode === '9:16';
  const isSuperVipFx = activeEffect?.effectCode === 'FX_SUPER_VIP';

  // Renders the active VFX banner and particles inside the Safe-Zone
  const renderVfxOverlay = () => {
    if (!activeEffect) return null;
    const code = activeEffect.effectCode;
    const plateNum =
      activeEffect.plate?.plateNumber ||
      activePlate?.plateNumber ||
      'BIỂN SỐ VIP';
    const buyerLabel = activeEffect.buyerName
      ? `Khách hàng: ${activeEffect.buyerName}`
      : 'Cảm ơn quý khách đã tín nhiệm Biển Số VIP!';

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1050,
          overflow: 'hidden',
        }}
      >
        {/* 1. FX_DEAL_CLOSED: Pháo hoa + Banner Chốt Đơn */}
        {code === 'FX_DEAL_CLOSED' && (
          <>
            {EFFECT_PARTICLES.map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: p.left,
                  top: isVertical ? '18%' : '25%',
                  fontSize: `${p.size}px`,
                  animation: `bsvFireworkBurst ${p.duration} ease-out ${p.delay} infinite`,
                }}
              >
                {p.id % 3 === 0 ? '🎆' : p.id % 3 === 1 ? '✨' : '🎉'}
              </div>
            ))}
            <div
              style={{
                position: 'absolute',
                top: isVertical ? '13.5%' : '18%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: isVertical ? '92%' : '520px',
                maxWidth: '520px',
                padding: '14px 18px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #B45309 100%)',
                border: '2.5px solid #FDE047',
                boxShadow: '0 20px 50px rgba(220, 38, 38, 0.75), 0 0 40px rgba(250, 204, 21, 0.8)',
                color: '#FFFFFF',
                textAlign: 'center',
                animation: 'bsvBannerPop 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#FDE047', letterSpacing: '1.2px' }}>
                🎉 CHÚC MỪNG CHỐT ĐƠN / ĐÃ NHẬN CỌC 🎉
              </div>
              <div
                style={{
                  fontSize: isVertical ? '24px' : '28px',
                  fontWeight: 900,
                  marginTop: '4px',
                  letterSpacing: '2px',
                  textShadow: '0 2px 10px rgba(0,0,0,0.45)',
                }}
              >
                {plateNum}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FEF08A', marginTop: '4px' }}>
                {activeEffect.customText || buyerLabel}
              </div>
            </div>
          </>
        )}

        {/* 2. FX_SUPER_VIP: Lửa rồng viền vàng + Huy hiệu Siêu Phẩm */}
        {code === 'FX_SUPER_VIP' && (
          <>
            {EFFECT_PARTICLES.slice(0, 14).map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: p.left,
                  top: isVertical ? '38%' : '45%',
                  fontSize: `${p.size + 4}px`,
                  animation: `bsvFloatUp ${p.duration} ease-out ${p.delay} infinite`,
                }}
              >
                {p.id % 2 === 0 ? '🔥' : '🐉'}
              </div>
            ))}
            <div
              style={{
                position: 'absolute',
                top: isVertical ? '13.2%' : '14%',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '9px 20px',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #7F1D1D, #DC2626, #D97706)',
                border: '2px solid #FDE047',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.9)',
                color: '#FEF08A',
                fontWeight: 900,
                fontSize: isVertical ? '13px' : '15px',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
                animation: 'bsvBannerPop 0.35s ease-out',
              }}
            >
              🔥 SIÊU PHẨM ĐẤU GIÁ ĐỘC BẢN LÊN SÓNG 🔥
            </div>
          </>
        )}

        {/* 3. FX_FLASH_DISCOUNT: Mưa xu vàng rơi + Banner giảm giá */}
        {code === 'FX_FLASH_DISCOUNT' && (
          <>
            {EFFECT_PARTICLES.map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: p.left,
                  top: '8%',
                  fontSize: `${p.size + 2}px`,
                  animation: `bsvCoinFall ${p.duration} linear ${p.delay} infinite`,
                }}
              >
                {p.id % 2 === 0 ? '🪙' : '💰'}
              </div>
            ))}
            <div
              style={{
                position: 'absolute',
                top: isVertical ? '13.5%' : '15%',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '10px 20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #065F46, #10B981)',
                border: '2px solid #FDE047',
                boxShadow: '0 15px 35px rgba(16, 185, 129, 0.65)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: isVertical ? '13px' : '15px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                animation: 'bsvBannerPop 0.35s ease-out',
              }}
            >
              💰 LỘC LÁ TRÊN LIVE — ƯU ĐÃI CHỐT NHANH TRONG 5 PHÚT! 💰
            </div>
          </>
        )}

        {/* 4. FX_APPLAUSE: Tim & Sao bay cảm ơn */}
        {code === 'FX_APPLAUSE' && (
          <>
            {EFFECT_PARTICLES.slice(0, 16).map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: p.left,
                  top: isVertical ? '42%' : '55%',
                  fontSize: `${p.size}px`,
                  animation: `bsvFloatUp ${p.duration} ease-out ${p.delay} infinite`,
                }}
              >
                {p.id % 3 === 0 ? '❤️' : p.id % 3 === 1 ? '👏' : '🌟'}
              </div>
            ))}
            <div
              style={{
                position: 'absolute',
                top: isVertical ? '13.5%' : '15%',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '9px 18px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #831843, #EC4899)',
                border: '2px solid #FBCFE8',
                boxShadow: '0 10px 25px rgba(236, 72, 153, 0.6)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                animation: 'bsvBannerPop 0.35s ease-out',
              }}
            >
              👏 CẢM ƠN ANH/CHỊ ĐÃ THẢ TIM & TƯƠNG TÁC CÙNG SHOP! ❤️
            </div>
          </>
        )}

        {/* 5. FX_VICTORY_HORN: Spotlight Hào Quang Chiến Thắng */}
        {code === 'FX_VICTORY_HORN' && (
          <>
            <div
              style={{
                position: 'absolute',
                top: '-10%',
                left: '20%',
                width: '60%',
                height: '75%',
                background: 'conic-gradient(from 180deg at 50% 0%, transparent 35%, rgba(250, 204, 21, 0.32) 50%, transparent 65%)',
                filter: 'blur(12px)',
                animation: 'bsvSpotlightSweep 2.4s ease-in-out infinite alternate',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: isVertical ? '13.5%' : '15%',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '10px 22px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #312E81, #4F46E5, #B45309)',
                border: '2px solid #FDE047',
                boxShadow: '0 12px 30px rgba(79, 70, 229, 0.7)',
                color: '#FEF08A',
                fontWeight: 900,
                fontSize: '13.5px',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'bsvBannerPop 0.35s ease-out',
              }}
            >
              <Award size={18} />
              🎺 ĐẲNG CẤP CHỦ TỊCH — VƯỢNG KHÍ TÀI LỘC ĐỈNH CAO 🎺
            </div>
          </>
        )}

        {/* 6. FX_FUNNY_INTERACT: Emoji nảy vui nhộn */}
        {code === 'FX_FUNNY_INTERACT' && (
          <>
            {EFFECT_PARTICLES.slice(0, 14).map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: p.left,
                  top: isVertical ? '36%' : '45%',
                  fontSize: `${p.size + 4}px`,
                  animation: `bsvFloatUp ${p.duration} ease-out ${p.delay} infinite`,
                }}
              >
                {p.id % 4 === 0 ? '🤩' : p.id % 4 === 1 ? '💎' : p.id % 4 === 2 ? '🚀' : '😄'}
              </div>
            ))}
            <div
              style={{
                position: 'absolute',
                top: isVertical ? '13.5%' : '15%',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '9px 18px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #0E7490, #06B6D4)',
                border: '2px solid #A5F3FC',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                animation: 'bsvBannerPop 0.35s ease-out',
              }}
            >
              😄 COMMENT NĂM SINH HOẶC ĐUÔI SỐ ĐỂ SHOP TRA NGAY NHÉ! 🚀
            </div>
          </>
        )}
      </div>
    );
  };

  // Renders simulated TikTok UI Safe-Zone Guide (Top header, bottom-left comments, bottom-right gift/heart bar)
  const renderTikTokSafeZoneGuide = () => {
    if (!effectiveSafeZoneGuide || !isVertical) return null;

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 800,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top 0-13%: TikTok Host Header Zone */}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            right: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: 0.72,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 12px',
              borderRadius: '999px',
              backgroundColor: 'rgba(0,0,0,0.55)',
              border: '1px dashed rgba(255,255,255,0.35)',
              color: '#F8FAFC',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: '#F59E0B',
                color: '#0F172A',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '10px',
              }}
            >
              VIP
            </span>
            <span>biensovip.official</span>
            <span
              style={{
                padding: '2px 7px',
                borderRadius: '999px',
                backgroundColor: '#FE2C55',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 800,
              }}
            >
              + Follow
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '999px',
              backgroundColor: 'rgba(0,0,0,0.55)',
              border: '1px dashed rgba(255,255,255,0.3)',
              color: '#E2E8F0',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <Users size={13} />
            <span>1.4K đang xem</span>
          </div>
        </div>

        {/* Golden Safe Zone Indicator Border (14% - 50%) */}
        <div
          style={{
            position: 'absolute',
            top: '13.5%',
            left: '10px',
            right: '10px',
            height: '37.5%',
            border: '1.5px dashed rgba(16, 185, 129, 0.55)',
            borderRadius: '18px',
            backgroundColor: 'rgba(16, 185, 129, 0.03)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              left: '14px',
              backgroundColor: '#065F46',
              color: '#A7F3D0',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              letterSpacing: '0.5px',
            }}
          >
            VÙNG AN TOÀN TIKTOK 9:16 (KHÔNG BỊ CHE)
          </span>
        </div>

        {/* Bottom-Left 52% - 94%: Simulated TikTok Scrolling Comments Zone */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '12px',
            width: '72%',
            height: '44%',
            borderRadius: '16px',
            border: '1.5px dashed rgba(244, 63, 94, 0.5)',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: '6px',
            color: 'rgba(255,255,255,0.75)',
            fontSize: '11px',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#FDA4AF', marginBottom: 'auto' }}>
            ⚠️ VÙNG BÌNH LUẬN TIKTOK (ĐÃ TRÁNH)
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.45)', padding: '5px 9px', borderRadius: '8px' }}>
            <b style={{ color: '#93C5FD' }}>@anh_tuan90:</b> Sinh năm 1990 hợp biển nào shop ơi?
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.45)', padding: '5px 9px', borderRadius: '8px' }}>
            <b style={{ color: '#FDE047' }}>@hung_bds_hn:</b> Có biển 30 đuôi 68 tầm 400tr không?
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.45)', padding: '5px 9px', borderRadius: '8px' }}>
            <b style={{ color: '#6EE7B7' }}>@minh_mercedes:</b> Lên thử mã #B101 đi ad!
          </div>
        </div>

        {/* Bottom-Right 52% - 94%: Simulated TikTok Action Buttons */}
        <div
          style={{
            position: 'absolute',
            bottom: '22px',
            right: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            opacity: 0.7,
          }}
        >
          {[
            { icon: Heart, label: '24.8K', color: '#FE2C55' },
            { icon: MessageCircle, label: '842', color: '#FFFFFF' },
            { icon: Gift, label: 'Quà', color: '#FBBF24' },
            { icon: Share2, label: 'Chia sẻ', color: '#FFFFFF' },
          ].map((btn, idx) => {
            const IconComp = btn.icon;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    border: '1px dashed rgba(255,255,255,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconComp size={17} color={btn.color} />
                </div>
                <span>{btn.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: embedded ? 'absolute' : 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        backgroundColor: transparentMode ? 'transparent' : '#050811',
        backgroundImage: transparentMode
          ? 'none'
          : 'radial-gradient(circle at 50% 25%, rgba(245, 158, 11, 0.14) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
        overflow: 'hidden',
        pointerEvents: 'none',
        display: 'flex',
         alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <style>{`
        @keyframes ledBorderGlow {
          0%, 100% { filter: drop-shadow(0 0 14px rgba(245, 158, 11, 0.65)) drop-shadow(0 0 30px rgba(234, 179, 8, 0.35)); }
          50% { filter: drop-shadow(0 0 26px rgba(245, 158, 11, 0.95)) drop-shadow(0 0 48px rgba(234, 179, 8, 0.6)); }
        }
        @keyframes superVipFireGlow {
          0%, 100% { filter: drop-shadow(0 0 22px rgba(239, 68, 68, 0.95)) drop-shadow(0 0 45px rgba(245, 158, 11, 0.8)); }
          50% { filter: drop-shadow(0 0 36px rgba(250, 204, 21, 1)) drop-shadow(0 0 65px rgba(220, 38, 38, 0.95)); }
        }
        @keyframes goldGradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes bsvBannerPop {
          0% { opacity: 0; transform: translateX(-50%) scale(0.75) translateY(15px); }
          100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
        @keyframes bsvFireworkBurst {
          0% { opacity: 0; transform: translateY(30px) scale(0.4); }
          35% { opacity: 1; transform: translateY(-25px) scale(1.25); }
          100% { opacity: 0; transform: translateY(-75px) scale(0.7); }
        }
        @keyframes bsvCoinFall {
          0% { opacity: 0; transform: translateY(-30px) rotate(0deg); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translateY(320px) rotate(360deg); }
        }
        @keyframes bsvFloatUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.6); }
          30% { opacity: 1; transform: translateY(-20px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-140px) scale(0.85); }
        }
        @keyframes bsvSpotlightSweep {
          0% { transform: rotate(-18deg); }
          100% { transform: rotate(18deg); }
        }
      `}</style>

      {/* Thanh điều khiển góc trái (Chỉ hiển thị khi mở trực tiếp trên trình duyệt web, ẩn khi trong OBS hoặc embedded) */}
      {!embedded && !isObsEnvironment && (
        <div
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 2000,
            pointerEvents: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '14px',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.55)',
            color: '#F8FAFC',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#FBBF24' }}>
            {isVertical ? <Smartphone size={15} /> : <Monitor size={15} />}
            <span>OBS OVERLAY ({layoutMode})</span>
          </div>

          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>

          <button
            type="button"
            onClick={handleToggleLayout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              backgroundColor: isVertical ? '#D97706' : 'rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isVertical ? <Smartphone size={13} /> : <Monitor size={13} />}
            {isVertical ? 'Khung Dọc 9:16 (TikTok)' : 'Khung Ngang 16:9 (FB/YT)'}
          </button>

          {isVertical && (
            <button
              type="button"
              onClick={() => setShowSafeZoneGuide((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                backgroundColor: showSafeZoneGuide ? '#059669' : 'rgba(255,255,255,0.08)',
                color: '#FFFFFF',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {showSafeZoneGuide ? 'Ẩn khung mẫu TikTok' : 'Hiện vùng an toàn TikTok'}
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleObsMute}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              backgroundColor: obsMuted ? '#DC2626' : '#059669',
              color: '#FFFFFF',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {obsMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            {obsMuted ? 'Âm thanh OBS: TẮT' : 'Âm thanh OBS: BẬT'}
          </button>

          <button
            type="button"
            onClick={() => setTransparentMode((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              backgroundColor: transparentMode ? '#2563EB' : 'rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {transparentMode ? <Eye size={13} /> : <EyeOff size={13} />}
            {transparentMode ? 'Nền Trong Suốt (OBS)' : 'Nền Phòng Thu'}
          </button>

          {!activePlate && (
            <button
              type="button"
              onClick={handleRestoreDemoPlate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid #F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#FDE047',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} />
              Hiện biển mẫu 30K-888.88
            </button>
          )}
        </div>
      )}

      {/* Stage Canvas: 9:16 Vertical Frame or 16:9 Full Viewport */}
      <div
        style={{
          position: 'relative',
          width: isVertical
            ? isObsEnvironment && !embedded
              ? '100%'
              : embedded
                ? '100%'
                : 'min(100vw, 480px)'
            : '100%',
          height: isVertical
            ? isObsEnvironment && !embedded
              ? '100%'
              : embedded
                ? '100%'
                : 'min(94vh, 854px)'
            : '100%',
          borderRadius: !transparentMode && isVertical && !embedded ? '28px' : '0px',
          border:
            !transparentMode && isVertical && !embedded
              ? '3px solid rgba(245, 158, 11, 0.35)'
              : 'none',
          boxShadow:
            !transparentMode && isVertical && !embedded
              ? '0 25px 70px rgba(0, 0, 0, 0.85)'
              : 'none',
          backgroundColor: transparentMode ? 'transparent' : '#070B14',
          backgroundImage: transparentMode
            ? 'none'
            : 'radial-gradient(circle at 50% 25%, rgba(245, 158, 11, 0.16) 0%, transparent 50%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: transparentMode ? 'auto' : '100% 100%, 32px 32px, 32px 32px',
          overflow: 'hidden',
        }}
      >
        {/* TikTok Safe-Zone Simulated UI Layer */}
        {renderTikTokSafeZoneGuide()}

        {/* VFX & Celebrations Layer */}
        {renderVfxOverlay()}

        {/* PINNED PLATE CARD (In 9:16 -> Centered at top 15.5% Golden Zone; In 16:9 -> Top-Right) */}
        {activePlate ? (
          <div
            ref={cardRef}
            style={{
              position: 'absolute',
              top: isVertical ? '15.5%' : embedded ? '20px' : '36px',
              left: isVertical ? '50%' : 'auto',
              right: isVertical ? 'auto' : embedded ? '20px' : '36px',
              transform: isVertical ? 'translateX(-50%)' : 'none',
              width: isVertical ? '92%' : embedded ? '370px' : '420px',
              maxWidth: isVertical ? '430px' : 'calc(100vw - 48px)',
              pointerEvents: 'auto',
              perspective: '1000px',
              animation: isSuperVipFx
                ? 'superVipFireGlow 1.2s ease-in-out infinite'
                : 'ledBorderGlow 3s ease-in-out infinite',
              zIndex: 1000,
            }}
          >
            {/* LED Gold Gradient Outer Border */}
            <div
              style={{
                padding: '3px',
                borderRadius: '22px',
                background: isSuperVipFx
                  ? 'linear-gradient(135deg, #EF4444, #FDE047, #DC2626, #FEF08A, #B91C1C)'
                  : 'linear-gradient(135deg, #F59E0B, #FFFBEB, #D97706, #FEF3C7, #B45309, #FDE68A)',
                backgroundSize: '300% 300%',
                animation: 'goldGradientFlow 4s ease infinite',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85)',
              }}
            >
              {/* Card Body */}
              <div
                style={{
                  position: 'relative',
                  backgroundColor: 'rgba(10, 15, 30, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '19px',
                  padding: isVertical ? '14px 16px' : embedded ? '16px 18px' : '20px 22px',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isVertical ? '10px' : '14px',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  overflow: 'hidden',
                }}
              >
                {/* Metallic Glint Sweep Overlay */}
                <div
                  ref={glintRef}
                  style={{
                    position: 'absolute',
                    top: '-50%',
                    left: 0,
                    width: '55px',
                    height: '200%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent)',
                    transform: 'rotate(25deg)',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />

                {/* Header: Live Badge & Category */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(239, 68, 68, 0.22)',
                      border: '1px solid rgba(239, 68, 68, 0.7)',
                      color: '#FCA5A5',
                      fontSize: '10.5px',
                      fontWeight: 900,
                      letterSpacing: '0.6px',
                    }}
                  >
                    <span
                      ref={liveDotRef}
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#EF4444',
                        boxShadow: '0 0 8px #EF4444',
                        display: 'inline-block',
                      }}
                    />
                    ĐANG LÊN SÓNG
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#FBBF24',
                      textShadow: '0 0 10px rgba(251, 191, 36, 0.4)',
                    }}
                  >
                    <Sparkles size={14} />
                    {activePlate.cat || 'Biển Số Đẹp'}
                    {activePlate.city ? ` • ${activePlate.city}` : ''}
                  </div>
                </div>

                {/* 3D Embossed Plate Display */}
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '3px solid #0F172A',
                    boxShadow:
                      '0 8px 20px rgba(0,0,0,0.55), inset 0 0 0 2px #FFFFFF, inset 0 0 0 4px #1E293B',
                    padding: isVertical ? '9px 12px' : '11px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {/* Vietnamese Flag */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '16px',
                        backgroundColor: '#DA251D',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="#FFFF00">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    </div>
                    <span style={{ fontSize: '7.5px', fontWeight: 900, color: '#0F172A' }}>VN</span>
                  </div>

                  {/* Plate Stamped Numbers */}
                  <div
                    style={{
                      fontFamily: '"DIN Alternate", "DIN 1451", "Arial Black", sans-serif',
                      fontSize: isVertical ? '28px' : embedded ? '30px' : '34px',
                      fontWeight: 900,
                      letterSpacing: '2.5px',
                      color: '#0F172A',
                      textShadow: '1px 1px 0px #CBD5E1, 2px 2px 4px rgba(0,0,0,0.2)',
                      userSelect: 'none',
                      paddingLeft: '18px',
                    }}
                  >
                    {activePlate.plateNumber || `${activePlate.prov}${activePlate.seri}-${activePlate.num}`}
                  </div>
                </div>

                {/* Price & Fengshui Summary (ZERO FLOOR PRICE PER BR-LIVE-01) */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.4px' }}>
                      GIÁ NIÊM YẾT
                    </div>
                    <div
                      style={{
                        fontSize: isVertical ? '22px' : '26px',
                        fontWeight: 900,
                        color: '#10B981',
                        textShadow: '0 0 18px rgba(16, 185, 129, 0.45)',
                        lineHeight: 1.1,
                      }}
                    >
                      <ShinyText text={activePlate.price} shimmerColor="#A7F3D0" speed={3.5} />
                    </div>
                  </div>

                  {activePlate.fengshui && (
                    <div
                      style={{
                        maxWidth: '175px',
                        textAlign: 'right',
                        fontSize: '11px',
                        color: '#FDE047',
                        fontWeight: 700,
                        lineHeight: 1.3,
                      }}
                    >
                      {activePlate.fengshui}
                    </div>
                  )}
                </div>

                {/* Anti-Ban TikTok Short Code Ribbon */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '7px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(79, 70, 229, 0.24)',
                    border: '1.5px solid rgba(129, 140, 248, 0.5)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '9.5px', color: '#C7D2FE', fontWeight: 800 }}>
                      MÃ TRA CỨU HỒ SƠ WEB
                    </span>
                    <span style={{ fontSize: '11px', color: '#E0E7FF' }}>
                      Nhập tại <b>biensovip.com</b>
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '19px',
                      fontWeight: 900,
                      color: '#FFFFFF',
                      backgroundColor: '#4338CA',
                      padding: '2px 10px',
                      borderRadius: '7px',
                      letterSpacing: '1px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {activePlate.shortCode || '#B101'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          !isObsEnvironment && (
            <div
              style={{
                position: 'absolute',
                top: isVertical ? '20%' : '40px',
                left: isVertical ? '50%' : 'auto',
                right: isVertical ? 'auto' : '40px',
                transform: isVertical ? 'translateX(-50%)' : 'none',
                width: isVertical ? '88%' : '360px',
                padding: '18px 20px',
                borderRadius: '18px',
                backgroundColor: 'rgba(15, 23, 42, 0.88)',
                border: '1.5px dashed rgba(245, 158, 11, 0.5)',
                color: '#E2E8F0',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24', fontWeight: 800, fontSize: '13px' }}>
                <Radio size={15} />
                <span>ĐANG CHỜ LỆNH GHIM BIỂN SỐ</span>
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.45 }}>
                Bấm nút <b>&ldquo;Ghim lên sóng&rdquo;</b> hoặc nhấn phím <b>Enter</b> ở Bảng Điều Khiển Live.
              </div>
            </div>
          )
        )}

        {/* MARQUEE TICKER BAR:
            - In 9:16 Vertical TikTok Mode -> Positioned at top: 46.5% (Safe Middle Belt above TikTok comments!)
            - In 16:9 Horizontal Mode -> Positioned at bottom: 0 */}
        <div
          style={{
            position: 'absolute',
            top: isVertical ? '46.5%' : 'auto',
            bottom: isVertical ? 'auto' : '0',
            left: isVertical ? '8px' : '0',
            right: isVertical ? '8px' : '0',
            height: isVertical ? '36px' : '44px',
            borderRadius: isVertical ? '999px' : '0px',
            backgroundColor: 'rgba(10, 15, 30, 0.94)',
            backdropFilter: 'blur(16px)',
            border: isVertical ? '1.5px solid #F59E0B' : 'none',
            borderTop: isVertical ? '1.5px solid #F59E0B' : '2px solid #F59E0B',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            zIndex: 950,
            pointerEvents: 'auto',
          }}
        >
          {/* Left Badge */}
          <div
            style={{
              height: '100%',
              backgroundColor: '#F59E0B',
              color: '#0F172A',
              padding: isVertical ? '0 12px' : '0 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 900,
              fontSize: isVertical ? '11px' : '12.5px',
              letterSpacing: '0.5px',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
          >
            <Flame size={isVertical ? 14 : 16} fill="#0F172A" />
            <ShinyText text="LIVE VIP" shimmerColor="#FFFBEB" speed={3} />
          </div>

          {/* Scrolling Marquee Content */}
          <div
            style={{
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              ref={tickerTrackRef}
              style={{
                display: 'inline-block',
                color: '#F8FAFC',
                fontSize: isVertical ? '12.5px' : '14px',
                fontWeight: 700,
                letterSpacing: '0.3px',
                willChange: 'transform',
              }}
            >
              {tickerMessage}
            </div>
          </div>

          {/* Right Badge (Only on 16:9 or wide enough) */}
          {!isVertical && (
            <div
              style={{
                height: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0 18px',
                display: 'flex',
                alignItems: 'center',
                color: '#10B981',
                fontWeight: 800,
                fontSize: '12.5px',
                zIndex: 10,
                whiteSpace: 'nowrap',
              }}
            >
              HOTLINE: 0815.792.699
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
