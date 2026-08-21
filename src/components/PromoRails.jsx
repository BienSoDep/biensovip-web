import { usePromoVideos } from '../services/promoVideoService.js';
import TikTokEmbed from './TikTokEmbed.jsx';

export default function PromoRails() {
  const { data } = usePromoVideos();
  const items = data?.items || [];
  if (!items.length) return null;

  // ThumbnailUrl thật (lấy qua oEmbed khi thêm video) → hiện ảnh tĩnh cho gọn rail.
  // Thiếu thumbnail (vd Facebook chưa hỗ trợ oEmbed công khai) → nhúng bằng embed chính thức của nền tảng.
  const renderItem = (v) => (
    <div key={v.id} className={`promo-rail__item${v.platform === 'tiktok' ? ' promo-rail__item--tiktok' : ''}`}>
      {v.thumbnailUrl ? (
        <img src={v.thumbnailUrl} alt={v.title || 'Quảng cáo'} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : v.platform === 'tiktok' ? (
        <TikTokEmbed videoUrl={v.videoUrl} title={v.title} />
      ) : (
        <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Xem video</a>
      )}
    </div>
  );

  return (
    <>
      <aside className="promo-rail promo-rail--left" aria-hidden="true">{items.map(renderItem)}</aside>
      <aside className="promo-rail promo-rail--right" aria-hidden="true">{items.map(renderItem)}</aside>
    </>
  );
}
