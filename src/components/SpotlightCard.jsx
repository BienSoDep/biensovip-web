import { useRef, useEffect, useCallback } from 'react';
import '../styles/spotlightCard.css';

/**
 * SpotlightCard - Interactive card hover effect inspired by React Bits (reactbits.dev)
 * Features cursor-tracking radial spotlight, dynamic border glow, subtle 3D tilt, and specular glare.
 * Uses CSS custom properties and RAF to eliminate React re-render overhead on pointer movements.
 */
export default function SpotlightCard({
  children,
  as: Component = 'div',
  className = '',
  spotlightColor = 'rgba(241, 151, 32, 0.15)',
  borderColor = 'rgba(241, 151, 32, 0.40)',
  size = 360,
  tilt = true,
  maxTilt = 4.5,
  glare = true,
  pad,
  tone,
  style,
  onPointerMove: userOnPointerMove,
  onPointerEnter: userOnPointerEnter,
  onPointerLeave: userOnPointerLeave,
  ...props
}) {
  const cardRef = useRef(null);
  const rafId = useRef(null);

  const handlePointerMove = useCallback((e) => {
    if (userOnPointerMove) userOnPointerMove(e);
    if (!cardRef.current) return;

    // Skip on touch/stylus or reduced-motion
    if (e.pointerType === 'touch') return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const el = cardRef.current;
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      el.style.setProperty('--mouse-x', `${x.toFixed(1)}px`);
      el.style.setProperty('--mouse-y', `${y.toFixed(1)}px`);

      if (tilt) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;
        el.style.setProperty('--rotate-x', `${rotateX.toFixed(2)}deg`);
        el.style.setProperty('--rotate-y', `${rotateY.toFixed(2)}deg`);
      }
    });
  }, [tilt, maxTilt, userOnPointerMove]);

  const handlePointerEnter = useCallback((e) => {
    if (userOnPointerEnter) userOnPointerEnter(e);
    if (!cardRef.current || e.pointerType === 'touch') return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const el = cardRef.current;
    el.setAttribute('data-hovered', 'true');
    el.style.setProperty('--spotlight-opacity', '1');
  }, [userOnPointerEnter]);

  const handlePointerLeave = useCallback((e) => {
    if (userOnPointerLeave) userOnPointerLeave(e);
    if (!cardRef.current) return;
    if (rafId.current) cancelAnimationFrame(rafId.current);

    const el = cardRef.current;
    el.removeAttribute('data-hovered');
    el.style.setProperty('--spotlight-opacity', '0');
    el.style.setProperty('--rotate-x', '0deg');
    el.style.setProperty('--rotate-y', '0deg');
  }, [userOnPointerLeave]);

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const computedBackground = tone === 'sunken'
    ? 'var(--surface-sunken)'
    : tone === 'muted'
    ? 'var(--surface-muted)'
    : undefined;

  return (
    <Component
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`rb-spotlight-card ${className}`.trim()}
      style={{
        '--spotlight-color': spotlightColor,
        '--border-spotlight-color': borderColor || 'transparent',
        '--spotlight-size': `${size}px`,
        background: computedBackground,
        padding: pad,
        ...style,
      }}
      {...props}
    >
      <div className="rb-spotlight-glow" aria-hidden="true" />
      {borderColor && <div className="rb-spotlight-border" aria-hidden="true" />}
      {glare && <div className="rb-spotlight-glare" aria-hidden="true" />}
      <div className="rb-spotlight-content">
        {children}
      </div>
    </Component>
  );
}

