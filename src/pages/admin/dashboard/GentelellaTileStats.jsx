import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCountUp, Sparkline } from './DashboardKpiCard.jsx';
import { InfoTip } from '../../../components/index.jsx';

/**
 * GentelellaTileStats — Thanh chỉ số KPI hàng đầu lấy cảm hứng từ widget 'tile_count' của Gentelella Admin.
 * Đặc trưng:
 * - Dải thẻ liền mạch với đường phân cách dọc mỏng tinh tế (vertical dividers)
 * - Icon bo tròn nền pastel mềm mại
 * - Con số kích thước lớn, hiệu ứng nhảy số mượt mà (CountUp)
 * - Badge phần trăm tăng/giảm hình viên thuốc (pill) kèm mũi tên xu hướng
 * - Biểu đồ mini sparkline ở chân thẻ hiển thị xung nhịp tương tác
 */
export default function GentelellaTileStats({ cards = [], animate = true }) {
  if (!cards.length) return null;

  return (
    <div
      style={{
        background: 'var(--white, #ffffff)',
        border: '1px solid var(--border-hairline, rgba(0, 0, 0, 0.08))',
        boxShadow: 'var(--shadow-inset-hairline, inset 0 0 0 1px rgba(0,0,0,0.04))',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {cards.map((c, i) => {
        const Icon = c.icon;
        const color = c.color || '#C75B00';
        const isPositive = c.deltaNumeric != null ? c.deltaNumeric > 0 : (c.delta && String(c.delta).startsWith('+'));
        const isNegative = c.deltaNumeric != null ? c.deltaNumeric < 0 : (c.delta && String(c.delta).startsWith('-'));

        return (
          <TileItem
            key={c.key || i}
            icon={Icon}
            color={color}
            label={c.label}
            info={c.info}
            value={c.value}
            delta={c.delta}
            isPositive={isPositive}
            isNegative={isNegative}
            spark={c.spark}
            animate={animate}
            isLast={i === cards.length - 1}
          />
        );
      })}
    </div>
  );
}

function TileItem({
  icon: Icon,
  color,
  label,
  info,
  value,
  delta,
  isPositive,
  isNegative,
  spark,
  animate,
  isLast,
}) {
  const shown = useCountUp(value, animate);

  return (
    <div
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        borderRight: isLast ? 'none' : '1px solid var(--border-hairline, rgba(0, 0, 0, 0.08))',
        borderBottom: 'none',
        position: 'relative',
        minWidth: 0,
        transition: 'background-color 140ms ease',
      }}
      className="gentelella-tile"
    >
      {/* Hàng 1: Icon + Tên chỉ số */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {Icon && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                borderRadius: '6px',
                background: `${color}18`,
                color: color,
                flexShrink: 0,
              }}
            >
              <Icon size={16} />
            </span>
          )}
          <span
            style={{
              font: 'var(--type-caption)',
              fontSize: '12px',
              fontWeight: 'var(--fw-semibold, 600)',
              color: 'var(--text-muted, #6b7280)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </span>
        </div>
        {info && <InfoTip text={info} size={13} />}
      </div>

      {/* Hàng 2: Con số lớn */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            font: 'var(--type-display-3)',
            fontSize: '28px',
            fontWeight: 'var(--fw-bold, 700)',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: 'var(--text-strong, #111827)',
          }}
        >
          {shown.toLocaleString('vi-VN')}
        </span>
      </div>

      {/* Hàng 3: Badge tỷ lệ tăng giảm so với kỳ trước */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', fontSize: '11.5px' }}>
        {delta != null ? (
          <>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                padding: '2px 7px',
                borderRadius: 'var(--radius-pill, 9999px)',
                fontWeight: 'var(--fw-bold, 700)',
                background: isPositive
                  ? 'rgba(63, 191, 143, 0.15)'
                  : isNegative
                  ? 'rgba(229, 72, 77, 0.14)'
                  : 'var(--surface-muted, #f3f4f6)',
                color: isPositive
                  ? 'var(--status-success, #3FBF8F)'
                  : isNegative
                  ? 'var(--status-danger, #E5484D)'
                  : 'var(--text-muted, #6b7280)',
              }}
            >
              {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
              <span>{delta}</span>
            </span>
            <span style={{ color: 'var(--text-muted, #6b7280)' }}>so kỳ trước</span>
          </>
        ) : (
          <span style={{ color: 'var(--text-faint, #9ca3af)' }}>Ổn định trong kỳ</span>
        )}
      </div>

      {/* Hàng 4: Sparkline đường biểu diễn */}
      <div style={{ marginTop: 'auto', paddingTop: 4 }}>
        <Sparkline data={spark} color={color} animate={animate} />
      </div>
    </div>
  );
}
