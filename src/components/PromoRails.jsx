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
  // Dùng limit=8 đồng bộ với Home.jsx để React Query dùng chung cache, loại bỏ 1 request GET thừa
  const { data } = useFeaturedPlates(8);
  const items = (data || []).slice(0, 6);
  if (!wide || !items.length || !openPlate) return null;
  return (
    <aside className="promo-rail promo-rail--left">
      <div className="promo-rail__track">
        {items.map((p) => <PlateRailItem key={p.id} plate={p} openPlate={openPlate} />)}
        {items.map((p) => <PlateRailItem key={`dup-${p.id}`} plate={p} openPlate={openPlate} />)}
      </div>
    </aside>
  );
}

function TikTokRail() {
  const wide = useIsWide();
  const { data } = usePromoVideos({ enabled: wide });
  const items = data?.items || [];
  if (!wide || !items.length) return null;

  // TikTok: thumbnailUrl lưu tĩnh trong DB là link CDN có x-expires ngắn hạn (hết hạn → 403) —
  // luôn fetch oEmbed runtime qua TikTokEmbed thay vì dùng field DB (giống Home.jsx "Video nổi bật").
  // Nền tảng khác (chưa hỗ trợ oEmbed công khai, vd Facebook): dùng thumbnailUrl tĩnh nếu có.
  const renderItem = (v) => {
    let thumbSrc = v.thumbnailUrl || null;
    if (!thumbSrc && v.platform === 'youtube') {
      const ytMatch = v.videoUrl?.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([\w-]{11})/);
      if (ytMatch) thumbSrc = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }
    return (
      <div key={v.id} className={`promo-rail__item${v.platform === 'tiktok' ? ' promo-rail__item--tiktok' : ''}`}>
        {v.platform === 'tiktok' ? (
          <TikTokEmbed videoUrl={v.videoUrl} title={v.title} compact={true} />
        ) : thumbSrc ? (
          <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" style={{ position: 'relative', display: 'block', width: '100%', height: '100%', overflow: 'hidden' }}>
            <img src={thumbSrc} alt={v.title || 'Video quảng cáo'} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(14,15,18,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
              </span>
            </span>
          </a>
        ) : (
          <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Xem video</a>
        )}
      </div>
    );
  };

  return (
    <aside className="promo-rail promo-rail--right">
      <div className="promo-rail__track">
        {items.map(renderItem)}
        {items.map((v) => renderItem({ ...v, id: `dup-${v.id}` }))}
      </div>
    </aside>
  );
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
