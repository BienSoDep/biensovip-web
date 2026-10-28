import { useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Loader2 } from 'lucide-react';
import '../styles/motionButtons.css';

/**
 * HoldToConfirmButton - Press-and-hold confirmation button inspired by motion.dev/ui/buttons
 * Provides tactile hold progress feedback before triggering critical or commitment actions.
 */
export default function HoldToConfirmButton({
  onConfirm,
  holdDuration = 1200,
  children = 'Nhấn giữ để xác nhận',
  holdingText = 'Đang giữ để xác nhận...',
  successText = 'Đã xác nhận!',
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  className = '',
  style,
  ...props
}) {
  const [holding, setHolding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const timerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  const handlePointerDown = useCallback(() => {
    if (disabled || confirmed) return;
    setHolding(true);

    timerRef.current = setTimeout(() => {
      setHolding(false);
      setConfirmed(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      if (onConfirm) onConfirm();
    }, holdDuration);
  }, [disabled, confirmed, holdDuration, onConfirm]);

  const cancelHold = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
  }, []);

  return (
    <motion.button
      type="button"
      className={`btn btn-${variant} btn-${size} btn-hold ${fullWidth ? 'btn-block' : ''} ${className}`.trim()}
      disabled={disabled}
      data-holding={holding}
      onPointerDown={handlePointerDown}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      whileHover={shouldReduceMotion || disabled ? {} : { scale: 1.02 }}
      whileTap={shouldReduceMotion || disabled ? {} : { scale: 0.98 }}
      style={style}
      {...props}
    >
      {/* Hold progress layer */}
      <motion.div
        className="btn-hold-progress"
        initial={{ width: '0%' }}
        animate={{ width: holding ? '100%' : '0%' }}
        transition={{
          duration: holding ? holdDuration / 1000 : 0.2,
          ease: holding ? 'linear' : 'easeOut',
        }}
      />

      <span className="btn-content-wrap">
        {confirmed ? (
          <>
            <Check size={16} />
            <span>{successText}</span>
          </>
        ) : holding ? (
          <>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span>{holdingText}</span>
          </>
        ) : (
          children
        )}
      </span>
    </motion.button>
  );
}

