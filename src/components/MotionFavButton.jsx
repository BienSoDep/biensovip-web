import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

/**
 * MotionFavButton - Animated Favorite/Heart button inspired by Motion UI Add-to-Basket
 * Features spring pop, particle burst ripple, and active glow.
 */
export default function MotionFavButton({
  fav = false,
  onClick,
  size = 28,
  iconSize = 16,
  label = 'Lưu yêu thích',
  style = {},
  className = '',
}) {
  const [burst, setBurst] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!fav) {
      setBurst(true);
    }
    onClick?.(e);
  };

  useEffect(() => {
    if (burst) {
      const t = setTimeout(() => setBurst(false), 550);
      return () => clearTimeout(t);
    }
  }, [burst]);

  return (
    <motion.button
      type="button"
      aria-label={fav ? 'Bỏ lưu yêu thích' : label}
      title={fav ? 'Bỏ lưu yêu thích' : label}
      onClick={handleClick}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.86 }}
      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      className={`motion-fav-btn ${className}`.trim()}
      style={{
        position: 'relative',
        width: size,
        height: size,
        border: 'none',
        background: fav ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        color: fav ? 'var(--status-danger, #ef4444)' : 'var(--text-muted)',
        outline: 'none',
        transition: 'background-color 160ms ease, color 160ms ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!fav) e.currentTarget.style.background = 'var(--surface-sunken)';
      }}
      onMouseLeave={(e) => {
        if (!fav) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Burst Ripple on Add */}
      <AnimatePresence>
        {burst && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid rgba(239, 68, 68, 0.65)',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Heart Icon with spring pop */}
      <motion.span
        animate={fav ? { scale: [1, 1.45, 0.88, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Heart
          size={iconSize}
          fill={fav ? 'currentColor' : 'none'}
          strokeWidth={fav ? 2.2 : 2}
        />
      </motion.span>
    </motion.button>
  );
}

