import { motion } from 'motion/react';
import '../styles/motion-loaders.css';

/**
 * MotionLoader - Hiệu ứng tải dữ liệu chuẩn Motion UI (motion.dev/ui/loaders)
 * 
 * Variants:
 * - 'bars': 5 thanh sóng nhảy so le với spring physics (Signature Motion look)
 * - 'orbit': 2 vòng xoay quỹ đạo đồng tâm ngược chiều nhau
 * - 'pulse': Vòng sóng radar lan tỏa dịu mắt
 * - 'dots': 3 điểm tròn nảy so le
 * - 'line': Thanh tiến độ gradient trượt ngang liên tục
 */
export default function MotionLoader({
  variant = 'bars',
  size = 'md',
  color = 'var(--action-primary, #F19720)',
  label,
  center = false,
  style,
  className = '',
}) {
  const sizeMap = {
    xs: { outer: 18, inner: 10, dot: 4, height: 16 },
    sm: { outer: 24, inner: 14, dot: 5, height: 20 },
    md: { outer: 34, inner: 20, dot: 7, height: 28 },
    lg: { outer: 48, inner: 30, dot: 10, height: 38 },
  };

  const dim = sizeMap[size] || sizeMap.md;

  let loaderGraphic = null;

  switch (variant) {
    case 'bars': {
      const bars = [0, 1, 2, 3, 4];
      loaderGraphic = (
        <div className="motion-loader-bars" aria-hidden="true">
          {bars.map((i) => (
            <motion.span
              key={i}
              className="motion-loader-bar"
              style={{ background: color.includes('gradient') ? color : undefined }}
              animate={{
                scaleY: [0.3, 1, 0.3],
                opacity: [0.45, 1, 0.45],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.85,
                ease: 'easeInOut',
                delay: i * 0.12,
              }}
            />
          ))}
        </div>
      );
      break;
    }

    case 'orbit': {
      loaderGraphic = (
        <div
          className="motion-loader-orbit"
          style={{ width: dim.outer, height: dim.outer }}
          aria-hidden="true"
        >
          <motion.div
            className="motion-loader-orbit-outer"
            style={{
              width: dim.outer,
              height: dim.outer,
              borderTopColor: color,
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
          />
          <motion.div
            className="motion-loader-orbit-inner"
            style={{ width: dim.inner, height: dim.inner }}
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
          <motion.div
            className="motion-loader-orbit-core"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
            animate={{ scale: [0.75, 1.25, 0.75], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          />
        </div>
      );
      break;
    }

    case 'pulse': {
      loaderGraphic = (
        <div
          className="motion-loader-pulse"
          style={{ width: dim.outer, height: dim.outer }}
          aria-hidden="true"
        >
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="motion-loader-pulse-ring"
              style={{
                width: dim.outer,
                height: dim.outer,
                borderColor: color,
              }}
              animate={{
                scale: [0.4, 1.4],
                opacity: [0.8, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.4,
                ease: [0.16, 1, 0.3, 1],
                delay: i * 0.5,
              }}
            />
          ))}
          <div
            className="motion-loader-pulse-dot"
            style={{ width: dim.dot, height: dim.dot, background: color }}
          />
        </div>
      );
      break;
    }

    case 'dots': {
      loaderGraphic = (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              style={{
                width: dim.dot,
                height: dim.dot,
                borderRadius: '50%',
                background: color,
                display: 'inline-block',
              }}
              animate={{
                y: ['0%', '-80%', '0%'],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.7,
                ease: 'easeInOut',
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      );
      break;
    }

    case 'line': {
      return (
        <div className={`motion-loader-line-track ${className}`} style={style} role="progressbar" aria-label={label || 'Đang xử lý...'}>
          <motion.div
            className="motion-loader-line-beam"
            animate={{
              left: ['-45%', '100%'],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        </div>
      );
    }

    default:
      break;
  }

  return (
    <div
      className={`motion-loader-wrap motion-loader--${size} ${center ? 'motion-loader-wrap--center' : ''} ${className}`}
      style={style}
      role="status"
      aria-live="polite"
    >
      {loaderGraphic}
      {label && <span className="motion-loader-label">{label}</span>}
    </div>
  );
}

/**
 * MotionTableLoader - Bảng khung xương cao cấp dành riêng cho trang Admin & dữ liệu lớn
 * Mô phỏng hàng cột thực tế, có thanh trượt tiến độ trên đầu và hiệu ứng wave shimmer.
 */
export function MotionTableLoader({
  rows = 6,
  message = 'Đang đồng bộ dữ liệu...',
  hasTopProgress = true,
  style,
}) {
  return (
    <div className="motion-table-skeleton-wrap" style={style}>
      {/* 1. Thanh trượt tiến độ Motion mượt mà trên cùng */}
      {hasTopProgress && (
        <MotionLoader variant="line" style={{ height: 3 }} />
      )}

      {/* 2. Top bar thông tin trạng thái */}
      {message && (
        <div className="motion-table-skeleton-topbar">
          <MotionLoader variant="bars" size="xs" label={message} />
          <div className="motion-shimmer-base" style={{ width: 84, height: 22, borderRadius: 6 }} />
        </div>
      )}

      {/* 3. Header cột của bảng */}
      <div className="motion-table-skeleton-header">
        <div className="motion-shimmer-base" style={{ width: 22, height: 18, borderRadius: 4 }} />
        <div className="motion-shimmer-base" style={{ width: 140, height: 18 }} />
        <div className="motion-shimmer-base" style={{ width: 90, height: 18 }} />
        <div className="motion-shimmer-base" style={{ width: 110, height: 18 }} />
        <div className="motion-shimmer-base" style={{ width: 100, height: 18 }} />
        <div className="motion-shimmer-base" style={{ flex: 1, height: 18, maxWidth: 160, marginLeft: 'auto' }} />
      </div>

      {/* 4. Các hàng dữ liệu xuất hiện so le với spring physics */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Array.from({ length: rows }, (_, index) => (
          <motion.div
            key={index}
            className="motion-table-skeleton-row"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {/* Checkbox */}
            <div className="motion-shimmer-base" style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0 }} />

            {/* Mô phỏng biển số có khung viền */}
            <div
              className="motion-shimmer-base"
              style={{
                width: 130,
                height: 38,
                borderRadius: 7,
                border: '1px solid rgba(0,0,0,0.06)',
                flexShrink: 0,
              }}
            />

            {/* Thông tin tỉnh thành / loại xe */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 120 }}>
              <div className="motion-shimmer-base" style={{ width: '85%', height: 14 }} />
              <div className="motion-shimmer-base" style={{ width: '55%', height: 11 }} />
            </div>

            {/* Giá niêm yết */}
            <div className="motion-shimmer-base" style={{ width: 110, height: 16 }} />

            {/* Badge trạng thái */}
            <div
              className="motion-shimmer-base"
              style={{ width: 88, height: 24, borderRadius: 999 }}
            />

            {/* Nút tác vụ bên phải */}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
              <div className="motion-shimmer-base" style={{ width: 32, height: 32, borderRadius: 6 }} />
              <div className="motion-shimmer-base" style={{ width: 32, height: 32, borderRadius: 6 }} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * MotionGridLoader - Khung xương lưới cho trang biển số người dùng
 */
export function MotionGridLoader({ count = 8, columns = 'repeat(auto-fill, minmax(280px, 1fr))' }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        gap: 'var(--gutter-section, 20px)',
        width: '100%',
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, delay: i * 0.035 }}
          style={{
            background: 'var(--white, #ffffff)',
            borderRadius: 'var(--radius-card, 16px)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="motion-shimmer-base" style={{ width: 70, height: 22, borderRadius: 6 }} />
            <div className="motion-shimmer-base" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          </div>
          <div
            className="motion-shimmer-base"
            style={{ width: '100%', height: 80, borderRadius: 8 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="motion-shimmer-base" style={{ width: '70%', height: 16 }} />
            <div className="motion-shimmer-base" style={{ width: '45%', height: 12 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <div className="motion-shimmer-base" style={{ width: 100, height: 20 }} />
            <div className="motion-shimmer-base" style={{ width: 85, height: 34, borderRadius: 8 }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
