import { useEffect, useState } from 'react';

// TikTok video tile — poster + link (no embed iframe).
// TikTok's /embed/v2 service returns 503 "overload-protect" from non-whitelisted origins
// (localhost/dev), even for a single embed, and the player renders smaller than the card.
// Reliable approach: show the oEmbed thumbnail filling the full card, and open the real
// video on TikTok when clicked.
function extractVideoId(videoUrl) {
  const m = String(videoUrl || '').match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}

export default function TikTokEmbed({ videoUrl, title }) {
  const id = extractVideoId(videoUrl);
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setThumb(d.thumbnail_url || null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [id, videoUrl]);

  if (!id) {
    return (
      <a href={videoUrl} target="_blank" rel="noopener noreferrer"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: 6, textAlign: 'center', font: 'var(--type-caption)', color: 'var(--text-strong)' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-body)' }}>▶</span>
        <span>{title || 'Xem trên TikTok'}</span>
      </a>
    );
  }

  return (
    <a href={videoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Xem video TikTok: ${title || ''}`}
      style={{ position: 'relative', width: '100%', height: '100%', display: 'block', overflow: 'hidden', background: 'var(--surface-sunken)' }}>
      {thumb ? (
        <img src={thumb} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', font: 'var(--type-caption)', color: 'var(--text-strong)' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-body)' }}>▶</span>
          <span>{title || 'Xem trên TikTok'}</span>
        </span>
      )}
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>▶</span>
      </span>
    </a>
  );
}
