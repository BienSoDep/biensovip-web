import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

const FlyEffectContext = createContext({
  triggerFly: () => {},
});

export function useFlyEffect() {
  return useContext(FlyEffectContext);
}

const FLY_WIDTH = 136;
const FLY_HEIGHT = 68;

function FlyingPlateItem({ item, onDone }) {
  const { id, startRect, targetRect, plate } = item;

  const startX = startRect.left + startRect.width / 2 - FLY_WIDTH / 2;
  const startY = startRect.top + startRect.height / 2 - FLY_HEIGHT / 2;

  const targetX = targetRect.left + targetRect.width / 2 - FLY_WIDTH / 2;
  const targetY = targetRect.top + targetRect.height / 2 - FLY_HEIGHT / 2;

  // Parabolic arc midpoint
  const midX = (startX + targetX) / 2;
  // If moving upward, arc above the highest point; if downward, pop up slightly first
  const midY = targetY < startY
    ? Math.min(startY, targetY) - 60
    : startY - 35;

  return (
    <motion.div
      key={id}
      initial={{
        x: startX,
        y: startY,
        scale: 1,
        opacity: 0.95,
        rotate: 0,
      }}
      animate={{
        x: [startX, midX, targetX],
        y: [startY, midY, targetY],
        scale: [1, 0.65, 0.16],
        opacity: [0.95, 1, 0.9, 0],
        rotate: [0, -9, 7, -2],
      }}
      transition={{
        duration: 0.72,
        times: [0, 0.45, 1],
        ease: [0.16, 1, 0.3, 1],
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
          background: 'linear-gradient(180deg, #ffffff 0%, #f6f6f4 60%, #ececec 100%)',
          borderRadius: 7,
          border: '2.5px solid #101012',
          boxShadow: '0 16px 36px rgba(0,0,0,0.35), 0 0 18px rgba(241,151,32,0.35)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '3px 4px',
          overflow: 'hidden',
        }}
      >
        {/* 4 Corner Rivets */}
        <span style={{ position: 'absolute', top: 3, left: 3, width: 4, height: 4, borderRadius: '50%', background: '#333' }} />
        <span style={{ position: 'absolute', top: 3, right: 3, width: 4, height: 4, borderRadius: '50%', background: '#333' }} />
        <span style={{ position: 'absolute', bottom: 3, left: 3, width: 4, height: 4, borderRadius: '50%', background: '#333' }} />
        <span style={{ position: 'absolute', bottom: 3, right: 3, width: 4, height: 4, borderRadius: '50%', background: '#333' }} />

        {/* Embossed Text */}
        <div
          style={{
            fontFamily: 'Oswald, sans-serif',
            fontWeight: 700,
            color: '#191919',
            fontSize: 14,
            lineHeight: 1,
            letterSpacing: 0.5,
            textShadow: '0 1px 0 #fff, 0 -1px 0 rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          {plate?.prov ? `${plate.prov}${plate.seri ? ` · ${plate.seri}` : ''}` : (plate?.plateNumber || 'BIỂN SỐ')}
        </div>
        <div
          style={{
            fontFamily: 'Oswald, sans-serif',
            fontWeight: 700,
            color: '#191919',
            fontSize: 22,
            lineHeight: 1.1,
            letterSpacing: 1.2,
            textShadow: '0 1px 0 #fff, 0 -1px 0 rgba(0,0,0,0.6)',
            whiteSpace: 'nowrap',
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
