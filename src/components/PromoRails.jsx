import { usePromoVideos } from '../services/promoVideoService.js';

export default function PromoRails() {
  const { data } = usePromoVideos();
  const items = data?.items || [];
  if (!items.length) return null;

  // Mock quảng cáo: khi chưa có clip TikTok/Facebook thật, ThumbnailUrl trỏ ảnh Unsplash — hiện ảnh thay vì nhúng iframe video giả sẽ lỗi.
  const renderItem = (v) => (
    <div key={v.id} className={`promo-rail__item${v.platform === 'tiktok' ? ' promo-rail__item--tiktok' : ''}`}>
      {v.thumbnailUrl ? (
        <img src={v.thumbnailUrl} alt={v.title || 'Quảng cáo'} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <iframe src={v.videoUrl} title={v.title || 'Video'} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
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
