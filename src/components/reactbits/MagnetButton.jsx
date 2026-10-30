import { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function MagnetButton({
  children,
  onClick,
  style = {},
  className = '',
  magnetStrength = 0.3,
  ...props
}) {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 200, damping: 18, mass: 0.1 });
  const y = useSpring(0, { stiffness: 200, damping: 18, mass: 0.1 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    x.set(middleX * magnetStrength);
    y.set(middleY * magnetStrength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.94 }}
      style={{
        x,
        y,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

