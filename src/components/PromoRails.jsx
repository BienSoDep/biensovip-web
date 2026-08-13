import { usePromoVideos } from '../services/promoVideoService.js';

export default function PromoRails() {
  const { data } = usePromoVideos();
  const items = data?.items || [];
  if (!items.length) return null;

  const renderItem = (v) => (
    <div key={v.id} className={`promo-rail__item${v.platform === 'tiktok' ? ' promo-rail__item--tiktok' : ''}`}>
      <iframe src={v.videoUrl} title={v.title || 'Video'} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
    </div>
  );

  return (
    <>
      <aside className="promo-rail promo-rail--left" aria-hidden="true">{items.map(renderItem)}</aside>
      <aside className="promo-rail promo-rail--right" aria-hidden="true">{items.map(renderItem)}</aside>
    </>
  );
}
