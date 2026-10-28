import { useRef, useState } from 'react';
import { motion, useReducedMotion, useSpring } from 'motion/react';
import { Loader2 } from 'lucide-react';
import '../styles/motionButtons.css';

const SIZES = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' };

/**
 * Staggered Rolling Text component inspired by motion.dev/ui/buttons
 * Splits text into individual characters and animates them with staggered spring physics on hover.
 */
function RollingText({ text, active, shouldReduceMotion }) {
  if (shouldReduceMotion) return text;

  const characters = Array.from(text);

  return (
    <span className="btn-rolling-wrap" aria-hidden="true">
      <span className="btn-rolling-row">
        {characters.map((char, index) => (
          <motion.span
            key={`char-1-${index}`}
            initial={false}
            animate={{ y: active ? '-115%' : '0%' }}
            transition={{
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1],
              delay: index * 0.018,
            }}
            className="btn-rolling-char"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </span>
      <span className="btn-rolling-row btn-rolling-row--secondary">
        {characters.map((char, index) => (
          <motion.span
            key={`char-2-${index}`}
            initial={false}
            animate={{ y: active ? '0%' : '115%' }}
            transition={{
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1],
              delay: index * 0.018,
            }}
            className="btn-rolling-char"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </span>
    </span>
  );
}

/**
 * Button - Core interactive button component powered by Motion UI (motion.dev/ui/buttons)
 * Supports physics-based hover/tap springs, staggered rolling text, shimmer beam sweep, and magnetic tracking.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  uppercase,
  disabled,
  loading,
  onClick,
  children,
  style,
  className = '',
  type = 'button',
  shimmer = false,
  rollingText = false,
  magnetic = false,
  whileHover: customWhileHover,
  whileTap: customWhileTap,
  transition: customTransition,
  ...rest
}) {
  const btnRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Magnetic cursor tracking using motion spring
  const magX = useSpring(0, { stiffness: 350, damping: 22 });
  const magY = useSpring(0, { stiffness: 350, damping: 22 });

  const handlePointerMove = (e) => {
    if (rest.onPointerMove) rest.onPointerMove(e);
    if (!magnetic || shouldReduceMotion || e.pointerType === 'touch') return;
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const relX = (e.clientX - (rect.left + rect.width / 2)) * 0.22;
    const relY = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
    magX.set(relX);
    magY.set(relY);
  };

  const handlePointerLeave = (e) => {
    if (rest.onPointerLeave) rest.onPointerLeave(e);
    setIsHovered(false);
    if (magnetic) {
      magX.set(0);
      magY.set(0);
    }
  };

  const handlePointerEnter = (e) => {
    if (rest.onPointerEnter) rest.onPointerEnter(e);
    setIsHovered(true);
  };

  const cls = [
    'btn',
    `btn-${variant}`,
    SIZES[size] || 'btn-md',
    fullWidth && 'btn-block',
    uppercase && 'btn-uppercase',
    shimmer && 'btn-shimmer-wrap',
    className,
  ].filter(Boolean).join(' ');

  const defaultSpring = {
    type: 'spring',
    stiffness: 450,
    damping: 24,
    mass: 0.8,
  };

  const defaultHover = shouldReduceMotion || disabled || loading
    ? {}
    : (customWhileHover || { scale: 1.025, y: -1.5 });

  const defaultTap = shouldReduceMotion || disabled || loading
    ? {}
    : (customWhileTap || { scale: 0.97, y: 1 });

  const canRoll = rollingText && typeof children === 'string' && !loading;

  return (
    <motion.button
      ref={btnRef}
      type={type}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={canRoll ? children : undefined}
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      whileHover={defaultHover}
      whileTap={defaultTap}
      transition={customTransition || defaultSpring}
      style={{
        x: magnetic ? magX : undefined,
        y: magnetic ? magY : undefined,
        ...style,
      }}
      {...rest}
    >
      {/* Shimmer light sweep (Motion Shimmer Button) */}
      {shimmer && !disabled && !shouldReduceMotion && (
        <span className="btn-shimmer-track" aria-hidden="true">
          <motion.span
            className="btn-shimmer-beam"
            initial={{ x: '-150%' }}
            animate={{ x: '250%' }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'easeInOut',
              repeatDelay: 2,
            }}
          />
        </span>
      )}

      {/* Button content */}
      <span className="btn-content-wrap">
        {loading && <Loader2 size={16} aria-hidden style={{ animation: 'spin 1s linear infinite' }} />}
        {canRoll ? (
          <RollingText text={children} active={isHovered} shouldReduceMotion={shouldReduceMotion} />
        ) : (
          children
        )}
      </span>
    </motion.button>
  );
}
