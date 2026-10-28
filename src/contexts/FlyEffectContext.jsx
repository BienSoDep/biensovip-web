import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

const FlyEffectContext = createContext({
  triggerFly: () => {},
});

export function useFlyEffect() {
  return useContext(FlyEffectContext);
}

const FLY_WIDTH = 210;
const FLY_HEIGHT = 105;

function FlyingPlateItem({ item, onDone }) {
  const { id, startRect, targetRect, plate } = item;

  const startX = startRect.left + startRect.width / 2 - FLY_WIDTH / 2;
  const startY = startRect.top + startRect.height / 2 - FLY_HEIGHT / 2;

  const targetX = targetRect.left + targetRect.width / 2 - FLY_WIDTH / 2;
  const targetY = targetRect.top + targetRect.height / 2 - FLY_HEIGHT / 2;

  // Quỹ đạo hình parabol 4 điểm mượt mà
  const dx = targetX - startX;
  const midX1 = startX + dx * 0.32;
  const midX2 = startX + dx * 0.72;

  // Vồng cung cao nổi bật để người dùng nhìn thấy rõ biển số phóng to khi bay
  const arcLift = Math.max(85, Math.min(160, Math.abs(dx) * 0.22));
  const peakY = Math.min(startY, targetY) - arcLift;
  const glideY = targetY + (peakY - targetY) * 0.38;

  return (
    <motion.div
      key={id}
      initial={{
        x: startX,
        y: startY,
        scale: 0.75,
        opacity: 0.35,
        rotate: 0,
      }}
      animate={{
        x: [startX, midX1, midX2, targetX],
        y: [startY, peakY, glideY, targetY],
        scale: [0.75, 1.25, 0.96, 0.18],
        opacity: [0.35, 1, 0.95, 0],
        rotate: [0, -8, 6, -2],
      }}
      transition={{
        duration: 0.88,
        times: [0, 0.24, 0.70, 1],
        ease: [0.18, 0.9, 0.32, 1],
      }}
      onAnimationComplete={onDone}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: FLY_WIDTH,
        height: FLY_HEIGHT,
        pointerEvents: 'none',
        zIndex: 999999,
        willChange: 'transform, opacity',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(145deg, #FFFFFF 0%, #FAFAFA 55%, #F1F5F9 100%)',
          borderRadius: 12,
          border: '3.5px solid #0F172A',
          boxShadow: '0 24px 48px -8px rgba(0,0,0,0.45), 0 0 24px rgba(241,151,32,0.55), inset 0 2px 0 rgba(255,255,255,1), inset 0 0 0 1.5px rgba(241,151,32,0.25)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '4px 8px',
          overflow: 'hidden',
          filter: 'drop-shadow(0 0 10px rgba(241,151,32,0.4))',
        }}
      >
        {/* Shimmer ánh sáng quét trên mặt biển số */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '45%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.05) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* 4 Đinh tán kim loại mạ crom 4 góc */}
        <span style={{ position: 'absolute', top: 5, left: 5, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle, #E2E8F0 30%, #475569 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }} />
        <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle, #E2E8F0 30%, #475569 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }} />
        <span style={{ position: 'absolute', bottom: 5, left: 5, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle, #E2E8F0 30%, #475569 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }} />
        <span style={{ position: 'absolute', bottom: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle, #E2E8F0 30%, #475569 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }} />

        {/* Chữ dập nổi sắc nét — Tỉnh thành & Seri */}
        <div
          style={{
            fontFamily: 'Oswald, sans-serif',
            fontWeight: 700,
            color: '#0F172A',
            fontSize: 20,
            lineHeight: 1,
            letterSpacing: 2,
            textShadow: '0 1px 0 #fff, 0 -1px 0 rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          {plate?.prov ? `${plate.prov}${plate.seri ? ` · ${plate.seri}` : ''}` : (plate?.plateNumber || 'BIỂN SỐ')}
        </div>

        {/* Chữ dập nổi sắc nét — Dãy số biển chính */}
        <div
          style={{
            fontFamily: 'Oswald, sans-serif',
            fontWeight: 800,
            color: '#0F172A',
            fontSize: 34,
            lineHeight: 1.1,
            letterSpacing: 3,
            textShadow: '0 1px 0 #fff, 0 -1px 0 rgba(0,0,0,0.6)',
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          {plate?.num || plate?.plateNumber || ''}
        </div>
      </div>
    </motion.div>
  );
}

export function FlyEffectProvider({ children }) {
  const [flyingItems, setFlyingItems] = useState([]);

  const triggerFly = useCallback(({ startRect, type = 'favorite', plate }) => {
    if (!startRect) return;

    let targetEl = null;
    let targetRect = null;
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    if (type === 'favorite') {
      targetEl = document.getElementById('header-nav-favorite');
      if (targetEl) {
        targetRect = targetEl.getBoundingClientRect();
      } else {
        targetRect = { left: window.innerWidth - 64, top: 18, width: 36, height: 36 };
      }
    } else if (type === 'compare') {
      if (isMobile) {
        // Mobile preference: floating compare bar
        targetEl = document.getElementById('floating-compare-bar');
        if (targetEl) {
          targetRect = targetEl.getBoundingClientRect();
        } else {
          // If not mounted yet (0 -> 1 item), target bottom center where it will appear
          targetRect = {
            left: window.innerWidth / 2 - 100,
            top: window.innerHeight - 60,
            width: 200,
            height: 44,
          };
        }
      } else {
        // Desktop preference: header compare nav
        targetEl = document.getElementById('header-nav-compare');
        if (targetEl) {
          targetRect = targetEl.getBoundingClientRect();
        } else {
          targetEl = document.getElementById('floating-compare-bar');
          if (targetEl) {
            targetRect = targetEl.getBoundingClientRect();
          } else {
            targetRect = { left: window.innerWidth * 0.45, top: 18, width: 80, height: 36 };
          }
        }
      }
    }

    if (!targetRect) return;

    const id = `fly_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setFlyingItems((prev) => [
      ...prev,
      {
        id,
        startRect,
        targetRect,
        targetEl,
        plate,
        type,
      },
    ]);
  }, []);

  const handleDone = useCallback((id, targetEl) => {
    setFlyingItems((prev) => prev.filter((item) => item.id !== id));
    if (targetEl) {
      targetEl.classList.remove('fly-target-bounce');
      // Trigger reflow to restart animation if multiple items hit in succession
      void targetEl.offsetWidth;
      targetEl.classList.add('fly-target-bounce');
      setTimeout(() => {
        targetEl.classList.remove('fly-target-bounce');
      }, 520);
    }
  }, []);

  return (
    <FlyEffectContext.Provider value={{ triggerFly }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            id="fly-effect-portal"
            style={{
              position: 'fixed',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 999999,
              overflow: 'hidden',
            }}
          >
            <AnimatePresence>
              {flyingItems.map((item) => (
                <FlyingPlateItem
                  key={item.id}
                  item={item}
                  onDone={() => handleDone(item.id, item.targetEl)}
                />
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </FlyEffectContext.Provider>
  );
}
