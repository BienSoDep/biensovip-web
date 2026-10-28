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
const CLONE_SETS = 7; // Nhân bản 7 tập hợp để tạo vòng xoay vô hạn mượt mà

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

  // Tính toán chỉ số khởi tạo ở vị trí giữa danh sách để hai bên trái / phải luôn đầy đủ thẻ, không bị khoảng trống
  const initialIndex = useMemo(() => {
    if (total === 0) return 0;
    const midSet = Math.floor(CLONE_SETS / 2); // set 3 trong 7 sets
    const midItem = Math.floor(total / 2);     // thẻ ở giữa của set
    return midSet * total + midItem;
  }, [total]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isJumping, setIsJumping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1000);
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

  // Tự động chạy mượt mà vô hạn chu kỳ 4.5s (tự tạm dừng khi người dùng hover/drag)
  useEffect(() => {
    if (!isPlaying || isHovered || total <= 1) return;
    const timer = setInterval(goNext, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, isHovered, total, goNext]);

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
    if (activeIndex >= 5 * total) {
      setIsJumping(true);
      setActiveIndex((prev) => prev - 2 * total);
    } else if (activeIndex < 2 * total) {
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
  const slideWidth = isMobile ? 285 : 350;
  const gap = isMobile ? 14 : 20;
  const stride = slideWidth + gap;

  // Tính tọa độ x để thẻ active luôn luôn nằm ở tâm giữa khung nhìn
  const targetX = total > 0
    ? (containerWidth / 2) - (slideWidth / 2) - (activeIndex * stride)
    : 0;

  const handleDragEnd = (_e, info) => {
    const { offset, velocity } = info;
    const threshold = 35;
    if (offset.x < -threshold || velocity.x < -280) {
      goNext();
    } else if (offset.x > threshold || velocity.x > 280) {
      goPrev();
    }
  };

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={handleDragEnd}
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
