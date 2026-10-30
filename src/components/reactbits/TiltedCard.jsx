import { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

const springValues = {
  damping: 25,
  stiffness: 120,
  mass: 1.5,
};

export default function TiltedCard({
  children,
  className = '',
  maxTilt = 12,
  scale = 1.025,
  style = {},
}) {
  const ref = useRef(null);

  const rotateX = useSpring(0, springValues);
  const rotateY = useSpring(0, springValues);
  const cardScale = useSpring(1, springValues);

  function handleMouseMove(e) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = (e.clientX - rect.left) * maxTilt * 2;
    const mouseY = (e.clientY - rect.top) * maxTilt * 2;
    const rX = (mouseY / height - maxTilt) * -1;
    const rY = mouseX / width - maxTilt;

    rotateX.set(rX);
    rotateY.set(rY);
  }

  function handleMouseEnter() {
    cardScale.set(scale);
  }

  function handleMouseLeave() {
    cardScale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        rotateX,
        rotateY,
        scale: cardScale,
        ...style,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

