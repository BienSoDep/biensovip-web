import { useEffect, useState } from 'react';
import { usePromoVideos } from '../services/promoVideoService.js';
import { useFeaturedPlates } from '../services/plates.js';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import PlateVisual from './PlateVisual.jsx';
import TikTokEmbed from './TikTokEmbed.jsx';

function useIsWide() {
  // Rail chỉ hiện ở màn ≥1600px (CSS) — chặn fetch/render (kể cả TikTok oEmbed bên trong)
  // trên các màn phổ biến hơn thay vì chỉ ẩn bằng CSS sau khi đã tải.
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1600px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1600px)');
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return wide;
}

function PlateRailItem({ plate, openPlate }) {
  const { prov, seri, num } = splitPlateNumber(plate.plateNumber);
  const meta = [plate.type, plate.vehicleType, plate.province].filter(Boolean).join(' · ');
  return (
    <a href="#" onClick={(e) => { e.preventDefault(); openPlate(plate.id); }} className="promo-rail__item promo-rail__item--plate" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ padding: 8 }}>
        <PlateVisual size="sm" prov={prov} seri={seri} num={num} shape="short" />
      </div>
      <div style={{ padding: '0 10px 10px' }}>
        <div style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prov}{seri} · {num}</div>
        {meta && <div style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</div>}
        <div style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>{formatPrice(plate.price, plate.priceOnRequest)}</div>
      </div>
    </a>
  );
}

function PlateRail({ openPlate }) {
  const wide = useIsWide();
  const { data } = useFeaturedPlates(6);
  const items = data || [];
  if (!wide || !items.length || !openPlate) return null;
  return <aside className="promo-rail promo-rail--left">{items.map((p) => <PlateRailItem key={p.id} plate={p} openPlate={openPlate} />)}</aside>;
}

function TikTokRail() {
  const wide = useIsWide();
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

  return <aside className="promo-rail promo-rail--right">{items.map(renderItem)}</aside>;
}

// Rail trái: biển nổi bật thật (liên quan trực tiếp mục đích mua hàng) — trước đây trùng TikTok với
// rail phải, gây lặp nội dung 2 bên và phân tâm khỏi tác vụ chính (audit UI/UX 06/09/2026).
export default function PromoRails({ openPlate }) {
  return (
    <>
      <PlateRail openPlate={openPlate} />
      <TikTokRail />
    </>
  );
}
