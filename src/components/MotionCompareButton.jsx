import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GitCompareArrows, CheckCircle2 } from 'lucide-react';

/**
 * MotionCompareButton - Add-to-Basket style Compare toggle button
 * Features state morphing (arrows -> checkmark), spring bounce, and brand highlight.
 */
export default function MotionCompareButton({
  inCompare = false,
  onClick,
  size = 28,
  iconSize = 16,
  label = 'Thêm vào so sánh',
  style = {},
  className = '',
}) {
  const [burst, setBurst] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCompare) {
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
      aria-label={inCompare ? 'Bỏ khỏi so sánh' : label}
      title={inCompare ? 'Bỏ khỏi so sánh' : label}
      onClick={handleClick}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.86 }}
      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      className={`motion-compare-btn ${className}`.trim()}
      style={{
        position: 'relative',
        width: size,
        height: size,
        border: 'none',
        background: inCompare ? 'rgba(241, 151, 32, 0.16)' : 'transparent',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        color: inCompare ? 'var(--brand-600, #a3610a)' : 'var(--text-muted)',
        outline: 'none',
        transition: 'background-color 160ms ease, color 160ms ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!inCompare) e.currentTarget.style.background = 'var(--surface-sunken)';
      }}
      onMouseLeave={(e) => {
        if (!inCompare) e.currentTarget.style.background = 'transparent';
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
              border: '2px solid rgba(241, 151, 32, 0.65)',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {inCompare ? (
          <motion.span
            key="check"
            initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: 45, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 24 }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CheckCircle2 size={iconSize} strokeWidth={2.4} />
          </motion.span>
        ) : (
          <motion.span
            key="arrows"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 24 }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <GitCompareArrows size={iconSize} strokeWidth={2} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

