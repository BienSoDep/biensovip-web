import { useEffect, useState } from 'react';
import { usePromoVideos } from '../services/promoVideoService.js';
import TikTokEmbed from './TikTokEmbed.jsx';

export default function PromoRails() {
  // Rail chỉ hiện ở màn ≥1600px (CSS) — chặn fetch/render (kể cả TikTok oEmbed bên trong)
  // trên các màn phổ biến hơn thay vì chỉ ẩn bằng CSS sau khi đã tải.
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1600px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1600px)');
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const { data } = usePromoVideos({ enabled: wide });
  const items = data?.items || [];
  if (!wide || !items.length) return null;

  // TikTok: thumbnailUrl lưu tĩnh trong DB là link CDN có x-expires ngắn hạn (hết hạn → 403) —
  // luôn fetch oEmbed runtime qua TikTokEmbed thay vì dùng field DB (giống Home.jsx "Video nổi bật").
  // Nền tảng khác (chưa hỗ trợ oEmbed công khai, vd Facebook): dùng thumbnailUrl tĩnh nếu có.
  const renderItem = (v) => (
    <div key={v.id} className={`promo-rail__item${v.platform === 'tiktok' ? ' promo-rail__item--tiktok' : ''}`}>
      {v.platform === 'tiktok' ? (
        <TikTokEmbed videoUrl={v.videoUrl} title={v.title} />
      ) : v.thumbnailUrl ? (
        <img src={v.thumbnailUrl} alt={v.title || 'Video quảng cáo'} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Xem video</a>
      )}
    </div>
  );

  return (
    <>
      <aside className="promo-rail promo-rail--left">{items.map(renderItem)}</aside>
      <aside className="promo-rail promo-rail--right">{items.map(renderItem)}</aside>
    </>
  );
}
