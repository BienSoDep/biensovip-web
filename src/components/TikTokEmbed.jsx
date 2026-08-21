import { useEffect, useRef } from 'react';

// TikTok không công bố API "reload" ổn định cho SPA — cách chắc ăn nhất là chèn lại thẻ
// <script src="embed.js"> (browser luôn thực thi script mới chèn vào DOM dù cùng src), buộc
// TikTok chạy lại toàn bộ quá trình quét DOM + gắn player thật vào mọi blockquote hiện có —
// nếu không blockquote chỉ dừng ở ảnh preview tĩnh, bấm không phát được. Debounce theo tick
// render để nhiều TikTokEmbed cùng mount trong 1 lần chỉ chèn script 1 lần.
let pending = null;
function scheduleReinject() {
  if (pending) return;
  pending = setTimeout(() => {
    pending = null;
    document.querySelectorAll('script[data-tiktok-embed]').forEach((el) => el.remove());
    const s = document.createElement('script');
    s.src = 'https://www.tiktok.com/embed.js';
    s.async = true;
    s.dataset.tiktokEmbed = '1';
    document.body.appendChild(s);
  }, 0);
}

export default function TikTokEmbed({ videoUrl, title }) {
  const ref = useRef(null);

  useEffect(() => {
    scheduleReinject();
  }, [videoUrl]);

  const idMatch = videoUrl.match(/\/video\/(\d+)/);
  const videoId = idMatch ? idMatch[1] : null;

  return (
    <blockquote
      ref={ref}
      className="tiktok-embed"
      cite={videoUrl}
      data-video-id={videoId}
      style={{ maxWidth: '100%', minWidth: '100%', margin: 0 }}
    >
      <section>
        <a href={videoUrl} target="_blank" rel="noopener noreferrer">{title || 'Xem trên TikTok'}</a>
      </section>
    </blockquote>
  );
}
