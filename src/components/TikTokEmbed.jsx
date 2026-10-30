import { useState, useEffect } from 'react';
import { Play, ExternalLink, X, RotateCcw } from 'lucide-react';
import TikTokIcon from './TikTokIcon.jsx';
import { apiClient } from '../services/apiClient.js';

export function extractVideoId(videoUrl) {
  if (!videoUrl) return null;
  const str = String(videoUrl).trim();
  if (/^\d{15,22}$/.test(str)) return str;
  const m = str.match(/\/(?:video|v)\/(\d+)/) || str.match(/\/(\d{15,22})/);
  return m ? m[1] : null;
}

// Kiểm tra URL ảnh CDN của TikTok có chứa x-expires đã hết hạn hay chưa để chặn trước lỗi 403 trên Network
function isUsableThumbnailUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url, 'https://biensovip.com');
    const expires = parsed.searchParams.get('x-expires');
    if (expires) {
      const expSec = Number(expires);
      if (Number.isFinite(expSec) && expSec * 1000 < Date.now() + 60_000) {
        return false; // Đã hết hạn -> không gắn vào <img> để tránh lỗi 403 đỏ trên Network
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Bộ nhớ đệm in-memory & deduplication promise cho oEmbed/Poster resolver (tránh gọi trùng lặp cùng 1 video giữa Home và PromoRails)
const oembedMemCache = new Map();
const oembedPendingPromises = new Map();

async function resolveTiktokMeta(id, canonicalUrl) {
  if (oembedMemCache.has(id)) {
    return oembedMemCache.get(id);
  }
  if (oembedPendingPromises.has(id)) {
    return oembedPendingPromises.get(id);
  }

  const promise = (async () => {
    try {
      // 1. Ưu tiên gọi qua Backend Proxy (/api/promo-videos/oembed) — backend trích xuất trực tiếp poster/covers ký mới từ TikTok SSR embed/v2
      const backendData = await apiClient.get(`/api/promo-videos/oembed?url=${encodeURIComponent(canonicalUrl)}`);
      const thumb = backendData?.thumbnailUrl || backendData?.thumbnail_url;
      const resolvedTitle = backendData?.title;
      if (thumb || resolvedTitle) {
        const meta = { thumbnail_url: thumb || null, title: resolvedTitle || null };
        if (thumb) oembedMemCache.set(id, meta);
        return meta;
      }
    } catch {
      // Fallback bên dưới nếu backend chưa sẵn sàng
    }

    try {
      const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalUrl)}`);
      if (r.ok) {
        const data = await r.json();
        if (data) {
          oembedMemCache.set(id, data);
          return data;
        }
      }
    } catch {
      // Ignore
    }
    return null;
  })().finally(() => {
    oembedPendingPromises.delete(id);
  });

  oembedPendingPromises.set(id, promise);
  return promise;
}

/**
 * TikTokEmbed — High-Performance Zero-Spam Facade Component
 *
 * - Mặc định: 0 iframe, 0 script ngoài, 0 lỗi telemetry, tự động lọc bỏ link ảnh TikTok CDN hết hạn (x-expires)
 *   và tự động làm mới qua Backend SSR Poster Resolver (/api/promo-videos/oembed).
 * - Hiển thị đầy đủ ảnh bìa preview ở cả chế độ Card lớn (Trang chủ / Giới thiệu / Bài viết) và Compact (Thanh trượt dọc PromoRails).
 * - Khi người dùng bấm Play: kích hoạt trình phát iframe tại chỗ đã tắt gợi ý liên quan (rel=0) và bọc sandbox,
 *   hoặc mở trực tiếp trên ứng dụng TikTok.
 */
export default function TikTokEmbed({
  videoUrl,
  title,
  thumbnailUrl,
  compact = false,
  className = '',
  style = {},
}) {
  const id = extractVideoId(videoUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [retriedFresh, setRetriedFresh] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [resolvedThumb, setResolvedThumb] = useState(() =>
    isUsableThumbnailUrl(thumbnailUrl) ? thumbnailUrl : null
  );
  const [resolvedTitle, setResolvedTitle] = useState(title || '');

  const canonicalUrl =
    videoUrl && String(videoUrl).startsWith('http')
      ? videoUrl
      : id
        ? `https://www.tiktok.com/@duydinhbiensodepdanang/video/${id}`
        : '';

  useEffect(() => {
    setImgError(false);
    setRetriedFresh(false);
    if (title) setResolvedTitle(title);

    if (isUsableThumbnailUrl(thumbnailUrl)) {
      setResolvedThumb(thumbnailUrl);
      return;
    }

    setResolvedThumb(null);
    if (!id) return;

    let cancelled = false;
    resolveTiktokMeta(id, canonicalUrl).then((data) => {
      if (cancelled || !data) return;
      const nextThumb = data.thumbnail_url || data.thumbnailUrl;
      if (nextThumb && isUsableThumbnailUrl(nextThumb)) {
        setResolvedThumb(nextThumb);
      }
      if (!title && data.title) {
        setResolvedTitle(data.title);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id, canonicalUrl, thumbnailUrl, title]);

  const handleImageError = () => {
    if (!retriedFresh && id) {
      setRetriedFresh(true);
      oembedMemCache.delete(id);
      resolveTiktokMeta(id, canonicalUrl).then((data) => {
        const nextThumb = data?.thumbnail_url || data?.thumbnailUrl;
        if (nextThumb && nextThumb !== resolvedThumb) {
          setResolvedThumb(nextThumb);
          setImgError(false);
        } else {
          setImgError(true);
        }
      });
    } else {
      setImgError(true);
    }
  };

  // Link dự phòng nếu URL không hợp lệ
  if (!id) {
    return (
      <a
        href={videoUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          minHeight: 180,
          padding: '16px',
          gap: 8,
          textAlign: 'center',
          font: 'var(--type-caption)',
          color: 'var(--text-strong)',
          textDecoration: 'none',
          background: 'var(--surface-sunken)',
          ...style,
        }}
      >
        <Play size={24} fill="currentColor" style={{ color: 'var(--text-body)' }} />
        <span>{resolvedTitle || 'Xem trên TikTok'}</span>
      </a>
    );
  }

  const hasThumb = !!resolvedThumb && !imgError;

  // 1. Chế độ Compact dành cho thanh rail bên hẹp (PromoRails) — Có hiển thị ảnh bìa preview thực tế!
  if (compact) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={resolvedTitle || 'Xem trên TikTok'}
        className={className}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: '100%',
          height: '100%',
          minHeight: 130,
          background: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
          borderRadius: 'inherit',
          padding: '10px 8px',
          textAlign: 'center',
          textDecoration: 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
          border: '1px solid rgba(241, 151, 32, 0.25)',
          isolation: 'isolate',
          transition: 'all 0.2s ease',
          ...style,
        }}
      >
        {hasThumb && (
          <img
            src={resolvedThumb}
            alt={resolvedTitle || 'Video TikTok'}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={handleImageError}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              filter: 'brightness(0.88)',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: hasThumb
              ? 'linear-gradient(to bottom, rgba(9, 13, 22, 0.18) 0%, rgba(9, 13, 22, 0.45) 45%, rgba(9, 13, 22, 0.92) 100%)'
              : 'radial-gradient(circle at 50% 35%, rgba(241, 151, 32, 0.22) 0%, rgba(15, 23, 42, 0.95) 75%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F19720 0%, #D97706 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'auto',
            marginTop: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            flexShrink: 0,
          }}
        >
          <Play size={16} fill="#FFFFFF" style={{ marginLeft: 2 }} />
        </div>
        <span
          style={{
            position: 'relative',
            zIndex: 2,
            font: 'var(--type-caption)',
            fontSize: 10.5,
            fontWeight: 600,
            color: '#F8FAFC',
            lineHeight: 1.28,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
            textShadow: '0 1px 3px rgba(0,0,0,0.85)',
          }}
        >
          {resolvedTitle || 'Video Biển Số VIP'}
        </span>
        <span
          style={{
            position: 'relative',
            zIndex: 2,
            marginTop: 4,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#FDBA74',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          TikTok <ExternalLink size={9.5} />
        </span>
      </a>
    );
  }

  // 2. Chế độ phát Inline khi người dùng đã bấm Play (Active Player)
  if (isPlaying) {
    return (
      <div
        className={className}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          aspectRatio: '9 / 14',
          minHeight: 380,
          background: '#010101',
          borderRadius: 'inherit',
          overflow: 'hidden',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
          ...style,
        }}
      >
        {/* Nút đóng / quay lại poster */}
        <button
          type="button"
          onClick={() => setIsPlaying(false)}
          title="Đóng trình phát"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            borderRadius: 999,
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            color: '#F8FAFC',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <X size={13} />
          <span>Đóng</span>
        </button>

        {/* Trình phát iframe TikTok chính thức chỉ mount khi bấm Play */}
        {!loadError ? (
          <iframe
            src={`https://www.tiktok.com/player/v1/${id}?autoplay=1&rel=0&music_info=0&description=0`}
            title={resolvedTitle || 'Video TikTok'}
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            referrerPolicy="no-referrer-when-downgrade"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="eager"
            onError={() => setLoadError(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 0,
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              gap: 12,
              background: '#09090b',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#F19720', fontSize: 13, fontWeight: 600 }}>
              Trình phát TikTok bị giới hạn bởi trình duyệt
            </div>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: '#F19720',
                color: '#000000',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              Mở trực tiếp trên TikTok <ExternalLink size={14} />
            </a>
            <button
              type="button"
              onClick={() => {
                setLoadError(false);
                setIsPlaying(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <RotateCcw size={12} /> Quay lại
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. Facade Poster View (MẶC ĐỊNH — 0 iframe, 0 request rác, tải tức thì)
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        aspectRatio: '9 / 14',
        minHeight: 380,
        backgroundColor: '#090D16',
        borderRadius: 'inherit',
        overflow: 'hidden',
        boxSizing: 'border-box',
        isolation: 'isolate',
        ...style,
      }}
    >
      {/* Background Image / Ambient Glow */}
      {hasThumb ? (
        <img
          src={resolvedThumb}
          alt={resolvedTitle || 'Video TikTok'}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.92)',
            transform: 'scale(1.01)',
            transition: 'transform 0.4s ease',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 35%, rgba(241, 151, 32, 0.22) 0%, rgba(15, 23, 42, 0.95) 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ opacity: 0.12, transform: 'scale(3.5)' }}>
            <TikTokIcon style={{ color: '#F19720' }} />
          </div>
        </div>
      )}

      {/* Scrim Gradient Overlays for readable text and depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(10, 15, 30, 0.65) 0%, rgba(10, 15, 30, 0.12) 38%, rgba(10, 15, 30, 0.88) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* TOP HEADER: Platform Badge */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            fontSize: 11,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '0.4px',
          }}
        >
          <TikTokIcon style={{ width: 13, height: 13, color: '#FE2C55' }} />
          <span>TIKTOK</span>
        </span>

        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Mở trên ứng dụng TikTok"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 999,
            backgroundColor: 'rgba(241, 151, 32, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(241, 151, 32, 0.4)',
            fontSize: 11,
            fontWeight: 700,
            color: '#FDBA74',
            textDecoration: 'none',
            transition: 'background 0.2s ease',
          }}
        >
          <span>Mở App</span>
          <ExternalLink size={11} />
        </a>
      </div>

      {/* CENTER: Glowing Play Button */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setIsPlaying(true)}
          aria-label={`Phát video: ${resolvedTitle || 'Biển Số VIP'}`}
          style={{
            width: 62,
            height: 62,
            borderRadius: '50%',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(241, 151, 32, 0.8)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(241, 151, 32, 0.45)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.12)';
            e.currentTarget.style.boxShadow = '0 10px 35px rgba(241, 151, 32, 0.65)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(241, 151, 32, 0.45)';
          }}
        >
          <Play size={26} fill="#F19720" style={{ color: '#F19720', marginLeft: 3 }} />
        </button>
      </div>

      {/* BOTTOM FOOTER: Video Title & Dual Action Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '24px 16px 14px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Title */}
        <h3
          style={{
            margin: 0,
            fontSize: 13.5,
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
          }}
        >
          {resolvedTitle || 'Video thực tế Biển Số VIP'}
        </h3>

        {/* Action Row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            style={{
              flex: 1,
              minHeight: 36,
              padding: '6px 12px',
              borderRadius: 8,
              backgroundColor: '#F19720',
              color: '#0F172A',
              border: 'none',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              boxShadow: '0 2px 8px rgba(241, 151, 32, 0.4)',
            }}
          >
            <Play size={13} fill="#0F172A" />
            <span>Phát video</span>
          </button>

          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              minHeight: 36,
              padding: '6px 12px',
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#F8FAFC',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span>TikTok</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
