import { useEffect, useRef, useState } from 'react';
import SkeletonBase from './skeletons/SkeletonBase.jsx';

export default function LazyImage({ src, alt, style, imgStyle, skeletonHeight }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { setInView(true); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {!loaded && <SkeletonBase width="100%" height={skeletonHeight || '100%'} radius={0} style={{ position: 'absolute', inset: 0 }} />}
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 320ms var(--ease-out)', ...imgStyle }}
        />
      )}
    </div>
  );
}
