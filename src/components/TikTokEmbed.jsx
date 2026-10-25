import { useState } from 'react';
import { Play } from 'lucide-react';

export function extractVideoId(videoUrl) {
  if (!videoUrl) return null;
  const str = String(videoUrl).trim();
  if (/^\d{15,22}$/.test(str)) return str;
  const m = str.match(/\/(?:video|v)\/(\d+)/) || str.match(/\/(\d{15,22})/);
  return m ? m[1] : null;
}

export default function TikTokEmbed({ videoUrl, title, compact = false }) {
  const id = extractVideoId(videoUrl);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  if (!id) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '16px',
          gap: 8,
          textAlign: 'center',
          font: 'var(--type-caption)',
          color: 'var(--text-strong)',
          textDecoration: 'none',
          background: 'var(--surface-sunken)',
        }}
      >
        <Play size={24} fill="currentColor" style={{ color: 'var(--text-body)' }} />
        <span>{title || 'Xem trên TikTok'}</span>
      </a>
    );
  }

  // Chế độ compact dành cho thanh rail hẹp (PromoRails)
  if (compact) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Xem video TikTok: ${title || ''}`}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '12px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
          textDecoration: 'none',
          boxSizing: 'border-box',
        }}
      >
        {/* TikTok Branding Top */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="14" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.883 2.896 2.896 2.896 0 0 1-2.896-2.896 2.896 2.896 0 0 1 2.896-2.896c.328 0 .641.054.935.153V9.458a6.353 6.353 0 0 0-.935-.07 6.34 6.34 0 0 0-6.341 6.341 6.34 6.34 0 0 0 6.341 6.341 6.34 6.34 0 0 0 6.341-6.341V8.528a8.212 8.212 0 0 0 4.757 1.503V6.586a4.77 4.77 0 0 1-1.001-.1V6.686z"
              fill="#fff"
            />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>TIKTOK</span>
        </div>

        {/* Center Play Button */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
          </div>
        </div>

        {/* Bottom Title */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#ffffff',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {title || 'Xem video trên TikTok'}
          </span>
        </div>
      </a>
    );
  }

  // Chế độ Player chuẩn cho Home, PlateDetail, About, Admin
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        aspectRatio: '9 / 14',
        minHeight: 380,
        background: '#010101',
        borderRadius: 'inherit',
        overflow: 'hidden',
      }}
    >
      {/* Skeleton / Loading Placeholder */}
      {!loaded && !loadError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#09090b',
            color: '#a1a1aa',
            gap: 12,
            padding: 20,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Play size={22} fill="currentColor" style={{ marginLeft: 2, opacity: 0.6 }} />
          </div>
          <span style={{ fontSize: 12, textAlign: 'center', color: '#71717a' }}>
            {title ? (title.slice(0, 50) + (title.length > 50 ? '…' : '')) : 'Đang tải video TikTok…'}
          </span>
        </div>
      )}

      {/* Official TikTok Player iframe */}
      {!loadError ? (
        <iframe
          src={`https://www.tiktok.com/player/v1/${id}?description=1`}
          title={title || 'Video TikTok'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setLoadError(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0,
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.25s ease',
          }}
        />
      ) : (
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '20px',
            gap: 8,
            textAlign: 'center',
            font: 'var(--type-caption)',
            color: '#ffffff',
            textDecoration: 'none',
          }}
        >
          <Play size={28} fill="currentColor" />
          <span>{title || 'Xem trên TikTok'}</span>
        </a>
      )}
    </div>
  );
}
