import { useEffect, useRef, useState } from 'react';
import SkeletonBase from './skeletons/SkeletonBase.jsx';
import { optimizeImageUrl } from '../lib/cloudinary.js';

export default function LazyImage({ src, alt, style, imgStyle, skeletonHeight }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { setInView(true); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Hình treo (không load cũng không lỗi) → fallback sau 8s thay vì skeleton vô hạn.
  useEffect(() => {
    if (loaded || failed || !src) return;
    const t = setTimeout(() => setFailed(true), 8000);
    return () => clearTimeout(t);
  }, [src, loaded, failed]);

  return (
    <div ref={ref} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {!loaded && <SkeletonBase width="100%" height={skeletonHeight || '100%'} radius={0} style={{ position: 'absolute', inset: 0 }} />}
      {failed ? (
        <div role="img" aria-label={alt || 'Hình ảnh'} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-muted)', color: 'var(--text-muted)', font: 'var(--type-caption)', ...imgStyle }}>
          {alt || 'Không tải được hình'}
        </div>
      ) : (
        inView && (
          <img
            src={optimizeImageUrl(src)}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => { setFailed(true); setLoaded(true); }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 320ms var(--ease-out)', ...imgStyle }}
          />
        )
      )}
    </div>
  );
}
