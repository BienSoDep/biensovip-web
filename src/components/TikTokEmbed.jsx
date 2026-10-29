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

  // Chế độ compact dành cho thanh rail hẹp (PromoRails) — hiển thị card preview sang trọng, tránh lỗi iframe Access Denied
  if (compact) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={title || 'Xem trên TikTok'}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          minHeight: 130,
          background: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
          borderRadius: 'inherit',
          padding: '12px 10px',
          textAlign: 'center',
          textDecoration: 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
          border: '1px solid rgba(241, 151, 32, 0.2)',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F19720 0%, #D97706 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            boxShadow: '0 4px 12px rgba(241, 151, 32, 0.3)',
            flexShrink: 0,
          }}
        >
          <Play size={16} fill="#FFFFFF" style={{ marginLeft: 2 }} />
        </div>
        <span
          style={{
            font: 'var(--type-caption)',
            fontSize: 11,
            fontWeight: 600,
            color: '#F8FAFC',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
          }}
        >
          {title || 'Video Biển Số VIP'}
        </span>
        <span
          style={{
            marginTop: 6,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#F19720',
            textTransform: 'uppercase',
          }}
        >
          TikTok ↗
        </span>
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
