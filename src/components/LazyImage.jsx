import { useEffect, useRef, useState } from 'react';
import SkeletonBase from './skeletons/SkeletonBase.jsx';
import { optimizeImageUrl } from '../lib/cloudinary.js';

export default function LazyImage({ src, alt, style, imgStyle, skeletonHeight }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

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
  // Chỉ đếm khi ảnh đã vào viewport và bắt đầu tải (inView) — nếu đếm từ lúc mount,
  // ảnh cuối trang chưa kịp cuộn tới đã bị đánh dấu "failed" trước khi <img> tồn tại.
  useEffect(() => {
    if (!inView || loaded || failed || !src) return;
    const t = setTimeout(() => setFailed(true), 8000);
    return () => clearTimeout(t);
  }, [inView, src, loaded, failed, retryKey]);

  const retry = (e) => { e.preventDefault(); e.stopPropagation(); setFailed(false); setLoaded(false); setRetryKey((k) => k + 1); };

  return (
    <div ref={ref} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {!loaded && <SkeletonBase width="100%" height={skeletonHeight || '100%'} radius={0} style={{ position: 'absolute', inset: 0 }} />}
      {failed ? (
        <button type="button" onClick={retry} aria-label={`Tải lại ${alt || 'hình ảnh'}`} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'var(--surface-muted)', color: 'var(--text-muted)', font: 'var(--type-caption)', border: 'none', cursor: 'pointer', ...imgStyle }}>
          <span>{alt || 'Không tải được hình'}</span>
          <span style={{ color: 'var(--action-primary)', textDecoration: 'underline' }}>Tải lại</span>
        </button>
      ) : (
        inView && (
          <img
            key={retryKey}
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
