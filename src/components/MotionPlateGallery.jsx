import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Play, Pause, Flame, Sparkles, ArrowRight } from 'lucide-react';
import { Badge } from './index.jsx';
import PlateVisual from './PlateVisual.jsx';
import MotionFavButton from './MotionFavButton.jsx';
import MotionCompareButton from './MotionCompareButton.jsx';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import { routeFor } from '../config/routes.js';
import { trackCtaClick } from '../services/tracking/events.js';
import '../styles/motion-gallery.css';

const BADGE_TONE = { 'Mới lên sàn': 'amber', 'Đã có khách cọc': 'rose' };
const CLONE_SETS = 5; // Nhân bản 5 tập hợp để tạo vòng xoay vô hạn mượt mà

/**
 * Kiểm tra xem biển số có mang thế số / yếu tố phong thủy cát lành hay không
 */
function checkIsFengShui(p) {
  if (p.fengShui || p.fengShuiMeaning) return true;
  const t = p.type || '';
  return ['Lộc phát', 'Thần tài', 'Ông địa', 'Ngũ quý', 'Tứ quý', 'Tam hoa', 'Sảnh tiến', 'Tiến lên'].some((k) => t.includes(k));
}

export default function MotionPlateGallery({
  items = [],
  favs = {},
  onFav,
  isInList,
  addCompare,
  removeCompare,
  openPlate,
  openBuy,
  _contact,
}) {
  const total = items.length;

  // Bắt đầu tại thẻ đầu tiên của tập giữa để luôn cân xứng 2 bên và nổi bật biển số #1
  const initialIndex = useMemo(() => {
    if (total === 0) return 0;
    const midSet = Math.floor(CLONE_SETS / 2); // set 2 trong 5 sets
    return midSet * total;
  }, [total]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isJumping, setIsJumping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [containerWidth, setContainerWidth] = useState(() =>
    typeof window !== 'undefined' ? Math.min(window.innerWidth, 1200) : 1000
  );
  const stageRef = useRef(null);

  // Tạo mảng ảo nhân bản đa tập hợp để cuộn vô hạn không giới hạn
  const virtualItems = useMemo(() => {
    if (total === 0) return [];
    return Array.from({ length: CLONE_SETS }, () => items).flat();
  }, [items, total]);

  // Đồng bộ lại activeIndex nếu độ dài danh sách items thay đổi
  const [prevTotal, setPrevTotal] = useState(total);
  if (prevTotal !== total) {
    setPrevTotal(total);
    setActiveIndex(initialIndex);
  }

  // Đo chiều rộng khung hiển thị phục vụ căn giữa chuẩn xác
  useEffect(() => {
    if (!stageRef.current) return;
    const updateWidth = () => {
      if (stageRef.current) {
        setContainerWidth(stageRef.current.offsetWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const goNext = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => prev + 1);
  }, [total]);

  const goPrev = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => prev - 1);
  }, [total]);

  // Tự động chạy mượt mà vô hạn chu kỳ 3s (tự tạm dừng chỉ khi người dùng đang giữ chuột / chạm vuốt)
  useEffect(() => {
    if (!isPlaying || isInteracting || total <= 1) return;
    const timer = setInterval(goNext, 3000);
    return () => clearInterval(timer);
  }, [isPlaying, isInteracting, total, goNext]);

  // Reset cờ isJumping sau khi đã dịch chuyển tọa độ tức thì
  useEffect(() => {
    if (isJumping) {
      const frame = requestAnimationFrame(() => setIsJumping(false));
      return () => cancelAnimationFrame(frame);
    }
  }, [isJumping]);

  // Chuẩn hóa vị trí âm thầm về dải an toàn (vô hạn không giật)
  const handleAnimationComplete = () => {
    if (isJumping) {
      setIsJumping(false);
      return;
    }
    if (activeIndex >= 4 * total) {
      setIsJumping(true);
      setActiveIndex((prev) => prev - 2 * total);
    } else if (activeIndex < 1 * total) {
      setIsJumping(true);
      setActiveIndex((prev) => prev + 2 * total);
    }
  };

  // Điều hướng bằng phím mũi tên khi focus
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  const isMobile = containerWidth < 640;
  const slideWidth = isMobile ? 280 : 350;
  const gap = isMobile ? 14 : 20;
  const stride = slideWidth + gap;

  // Tính tọa độ x để thẻ active luôn luôn nằm ở tâm giữa khung nhìn
  const targetX = total > 0
    ? (containerWidth / 2) - (slideWidth / 2) - (activeIndex * stride)
    : 0;

  // Nhảy nhanh đến biển khi bấm vào thẻ tròn nhỏ bên dưới
  const handlePillClick = (targetRealIdx) => {
    const currentRealIdx = ((activeIndex % total) + total) % total;
    let diff = targetRealIdx - currentRealIdx;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    setActiveIndex((prev) => prev + diff);
  };

  if (!items || items.length === 0) return null;

  const realActiveIndex = ((activeIndex % total) + total) % total;

  return (
    <div
      className="motion-plate-gallery"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Chuỗi biển số HOT và hợp phong thủy"
    >
      {/* Top bar: Đã xóa badge 'Biển số chọn lọc', hiển thị các nút điều khiển chạy tự động mượt mà */}
      <div className="motion-plate-gallery__topbar" style={{ justifyContent: 'flex-end' }}>
        <div className="motion-plate-gallery__controls">
          <motion.button
            type="button"
            className="motion-plate-gallery__btn"
            onClick={() => setIsPlaying((p) => !p)}
            title={isPlaying ? 'Tạm dừng tự động lướt' : 'Tiếp tục tự động lướt'}
            aria-label={isPlaying ? 'Tạm dừng tự động lướt' : 'Tiếp tục tự động lướt'}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: 2 }} />}
          </motion.button>

          <motion.button
            type="button"
            className="motion-plate-gallery__btn"
            onClick={goPrev}
            title="Biển số trước"
            aria-label="Biển số trước"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <ChevronLeft size={18} />
          </motion.button>

          <motion.button
            type="button"
            className="motion-plate-gallery__btn"
            onClick={goNext}
            title="Biển số kế tiếp"
            aria-label="Biển số kế tiếp"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* Main Drag-and-Swipe Interactive Stage */}
      <div ref={stageRef} className="motion-plate-gallery__stage">
        <motion.div
          className="motion-plate-gallery__track"
          onPanStart={() => setIsInteracting(true)}
          onPanEnd={(_e, info) => {
            setIsInteracting(false);
            const threshold = 30;
            if (info.offset.x < -threshold || info.velocity.x < -200) {
              goNext();
            } else if (info.offset.x > threshold || info.velocity.x > 200) {
              goPrev();
            }
          }}
          animate={{ x: targetX }}
          transition={
            isJumping
              ? { duration: 0 }
              : { type: 'spring', stiffness: 280, damping: 30, mass: 0.8 }
          }
          onAnimationComplete={handleAnimationComplete}
        >
          {virtualItems.map((p, i) => {
            const { prov, seri, num } = splitPlateNumber(p.plateNumber);
            const isActive = i === activeIndex;
            const dist = Math.abs(i - activeIndex);
            const meta = [p.vehicleType, p.province].filter(Boolean).join(' · ');
            const isZeroOrNoPrice = p.priceOnRequest || !p.price || Number(p.price) <= 0;
            const onSale = !isZeroOrNoPrice && p.salePrice != null && p.salePrice < p.price;
            const sold = p.status === 'sold';
            const inCompare = isInList?.(p.id);
            const isFengShui = checkIsFengShui(p);

            return (
              <motion.div
                key={`${p.id}-v${i}`}
                className={`motion-plate-gallery__slide ${isActive ? 'motion-plate-gallery__slide--active' : ''} home-featured-card`}
                style={{
                  width: `${slideWidth}px`,
                  marginRight: `${gap}px`,
                }}
                animate={{
                  scale: isActive ? 1 : 0.93,
                  opacity: isActive ? 1 : dist === 1 ? 0.74 : 0.42,
                  zIndex: isActive ? 10 : 5 - Math.min(dist, 4),
                  filter: isActive ? 'blur(0px)' : dist === 1 ? 'blur(0.4px)' : 'blur(1.2px)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                onClick={() => {
                  if (!isActive) setActiveIndex(i);
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`Biển số ${p.plateNumber}`}
                aria-current={isActive}
              >
                <div className="motion-plate-gallery__card">
                  {/* Subtle warm amber ambient glow on active card */}
                  {isActive && <div className="motion-plate-gallery__ambient-glow" aria-hidden="true" />}

                  {/* Header: Badges & Action Buttons */}
                  <div className="motion-plate-gallery__card-head">
                    <div className="motion-plate-gallery__card-badges">
                      {p.isHot && (
                        <Badge tone="hot">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Flame size={11} fill="currentColor" /> HOT
                          </span>
                        </Badge>
                      )}
                      {isFengShui && (
                        <Badge tone="mint">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Sparkles size={11} /> {p.fengShui?.element ? `Mệnh ${p.fengShui.element}` : 'Hợp phong thủy'}
                          </span>
                        </Badge>
                      )}
                      {p.type && <Badge tone="dark">{p.type}</Badge>}
                      {p.badge && <Badge tone={BADGE_TONE[p.badge] || 'neutral'}>{p.badge}</Badge>}
                    </div>

                    <div className="motion-plate-gallery__card-actions" onClick={(e) => e.stopPropagation()}>
                      {onFav && (
                        <MotionFavButton
                          fav={!!favs[p.id]}
                          onClick={() => {
                            if (!favs[p.id]) trackCtaClick('yeu_thich', p.plateNumber);
                            onFav(p.id);
                          }}
                        />
                      )}
                      {addCompare && removeCompare && (
                        <MotionCompareButton
                          inCompare={inCompare}
                          onClick={() => {
                            if (inCompare) removeCompare(p.id);
                            else addCompare(p.id);
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Visual Plate Stage */}
                  <a
                    href={routeFor('detail', p.slug || p.id)}
                    className="motion-plate-gallery__plate-stage"
                    onClick={(e) => {
                      e.preventDefault();
                      if (isActive) {
                        openPlate?.(p.id);
                      } else {
                        setActiveIndex(i);
                      }
                    }}
                  >
                    <div className="motion-plate-gallery__plate-visual-box">
                      <PlateVisual size={isMobile ? 'sm' : 'md'} prov={prov} seri={seri} num={num} shape="short" />
                    </div>
                    <div className="motion-plate-gallery__plate-text">
                      {prov}{seri} · {num}
                    </div>
                    {meta && <div className="motion-plate-gallery__plate-meta">{meta}</div>}
                  </a>

                  {/* Footer: Price + Quick Action CTA */}
                  <div className="motion-plate-gallery__card-foot">
                    <div className="motion-plate-gallery__price-box">
                      <span className="motion-plate-gallery__price-lbl">
                        {sold ? 'Trạng thái' : 'Giá niêm yết'}
                      </span>
                      {sold ? (
                        <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-muted)' }}>
                          ĐÃ GIAO DỊCH
                        </span>
                      ) : onSale ? (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span className="motion-plate-gallery__price-val" style={{ color: 'var(--status-danger)' }}>
                            {formatPrice(p.salePrice, false)}
                          </span>
                          <span className="motion-plate-gallery__price-strike">
                            {formatPrice(p.price, false)}
                          </span>
                        </div>
                      ) : (
                        <span className="motion-plate-gallery__price-val">
                          {formatPrice(p.price, p.priceOnRequest)}
                        </span>
                      )}
                    </div>

                    <motion.button
                      type="button"
                      className="motion-plate-gallery__cta-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (sold) {
                          openPlate?.(p.id);
                        } else if (openBuy) {
                          openBuy(p.id);
                        } else {
                          openPlate?.(p.id);
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>{sold ? 'Xem chi tiết' : 'Tư vấn ngay'}</span>
                      <ArrowRight size={14} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Bottom Thumbnail / Quick-jump pill strip */}
      <div className="motion-plate-gallery__strip-wrap">
        {items.map((p, idx) => {
          const isSelected = idx === realActiveIndex;
          const { prov, seri, num } = splitPlateNumber(p.plateNumber);
          return (
            <motion.button
              key={`pill-${p.id}`}
              type="button"
              className={`motion-plate-gallery__thumb-pill ${isSelected ? 'motion-plate-gallery__thumb-pill--active' : ''}`}
              onClick={() => handlePillClick(idx)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSelected && (
                <motion.div
                  className="motion-plate-gallery__thumb-indicator"
                  layoutId="motion-gallery-active-pill"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span>{prov}{seri}·{num}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
