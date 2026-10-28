import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1000);
  const stageRef = useRef(null);

  // Measure stage width dynamically for accurate card centering
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

  const total = items.length;

  const goNext = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Subtle auto-advance every 5.5s when playing and not hovered
  useEffect(() => {
    if (!isPlaying || isHovered || total <= 1) return;
    const timer = setInterval(goNext, 5500);
    return () => clearInterval(timer);
  }, [isPlaying, isHovered, total, goNext]);

  // Keyboard navigation when stage is focused
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

  // Center the active card in the viewport
  const targetX = total > 0
    ? (containerWidth / 2) - (slideWidth / 2) - (activeIndex * stride)
    : 0;

  const handleDragEnd = (_e, info) => {
    const { offset, velocity } = info;
    const threshold = 45;
    if (offset.x < -threshold || velocity.x < -350) {
      goNext();
    } else if (offset.x > threshold || velocity.x > 350) {
      goPrev();
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div
      className="motion-plate-gallery"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Chuỗi biển số nổi bật"
    >
      {/* Top bar with active counter, auto-play toggle, and prev/next controls */}
      <div className="motion-plate-gallery__topbar">
        <div className="motion-plate-gallery__badge-info">
          <span className="live-dot" aria-hidden="true" />
          <span>Biển số chọn lọc:</span>
          <span className="motion-plate-gallery__badge-num">
            {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </div>

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
          dragElastic={0.22}
          onDragEnd={handleDragEnd}
          animate={{ x: targetX }}
          transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.8 }}
        >
          {items.map((p, i) => {
            const { prov, seri, num } = splitPlateNumber(p.plateNumber);
            const isActive = i === activeIndex;
            const dist = Math.abs(i - activeIndex);
            const meta = [p.vehicleType, p.province].filter(Boolean).join(' · ');
            const isZeroOrNoPrice = p.priceOnRequest || !p.price || Number(p.price) <= 0;
            const onSale = !isZeroOrNoPrice && p.salePrice != null && p.salePrice < p.price;
            const sold = p.status === 'sold';
            const inCompare = isInList?.(p.id);

            return (
              <motion.div
                key={p.id}
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
                      {p.fengShui && (
                        <Badge tone="mint">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Sparkles size={11} /> {p.fengShui.element || 'Hợp mệnh'}
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
          const isSelected = idx === activeIndex;
          const { prov, seri, num } = splitPlateNumber(p.plateNumber);
          return (
            <motion.button
              key={p.id}
              type="button"
              className={`motion-plate-gallery__thumb-pill ${isSelected ? 'motion-plate-gallery__thumb-pill--active' : ''}`}
              onClick={() => setActiveIndex(idx)}
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
