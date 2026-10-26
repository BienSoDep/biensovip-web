import { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { InfoTip } from '../../../components/index.jsx';

/**
 * DashboardPanel — Khung Card chuẩn hóa lấy cảm hứng từ cấu trúc 'x_panel' của Gentelella Admin v4.
 * Cung cấp:
 * - Tiêu đề in hoa nhẹ (x_title) kèm icon và InfoTip giải thích nghiệp vụ
 * - Thanh công cụ góc phải (nút thu gọn / mở rộng, nút tải lại dữ liệu, action tùy biến)
 * - Đường kẻ phân cách hairline thanh lịch
 * - Vùng nội dung (x_content) có đệm chuẩn mực theo Design Tokens
 */
export default function DashboardPanel({
  title,
  icon: Icon,
  badge,
  badgeTone = 'neutral',
  info,
  actions,
  collapsible = true,
  defaultExpanded = true,
  children,
  style = {},
  bodyStyle = {},
  headerStyle = {},
  onRefresh,
  loading = false,
  className = '',
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const getBadgeStyle = () => {
    switch (badgeTone) {
      case 'success':
        return { background: 'rgba(63, 191, 143, 0.12)', color: 'var(--status-success, #3FBF8F)' };
      case 'warning':
        return { background: 'rgba(245, 197, 66, 0.15)', color: 'var(--status-warning, #C75B00)' };
      case 'danger':
        return { background: 'rgba(229, 72, 77, 0.12)', color: 'var(--status-danger, #E5484D)' };
      case 'brand':
        return { background: 'rgba(199, 91, 0, 0.12)', color: 'var(--action-primary, #C75B00)' };
      default:
        return { background: 'var(--surface-muted, #f3f4f6)', color: 'var(--text-muted, #6b7280)' };
    }
  };

  return (
    <div
      className={`dash-panel ${className}`}
      style={{
        background: 'var(--white, #ffffff)',
        border: '1px solid var(--border-hairline, rgba(0, 0, 0, 0.08))',
        boxShadow: 'var(--shadow-inset-hairline, inset 0 0 0 1px rgba(0,0,0,0.04))',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        transition: 'box-shadow 160ms ease, border-color 160ms ease',
        ...style,
      }}
    >
      {/* Header phong cách Gentelella x_title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: expanded ? '1px solid var(--border-hairline, rgba(0, 0, 0, 0.08))' : 'none',
          background: 'var(--surface-card, #ffffff)',
          userSelect: 'none',
          gap: 12,
          flexWrap: 'wrap',
          ...headerStyle,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
          {Icon && (
            <span style={{ display: 'inline-flex', color: 'var(--action-primary, #C75B00)', flexShrink: 0 }}>
              <Icon size={16} />
            </span>
          )}
          <h3
            style={{
              margin: 0,
              font: 'var(--type-title-3)',
              fontSize: '13.5px',
              fontWeight: 'var(--fw-bold, 700)',
              color: 'var(--text-strong, #111827)',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {title}
          </h3>
          {info && <InfoTip text={info} size={13} />}
          {badge && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 'var(--fw-semibold, 600)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill, 9999px)',
                ...getBadgeStyle(),
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Thanh công cụ góc phải */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {actions}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Làm mới dữ liệu"
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: loading ? 'default' : 'pointer',
                color: 'var(--text-muted, #6b7280)',
                padding: 4,
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 4,
                transition: 'color 120ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-strong)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <RefreshCw size={13} style={{ animation: loading ? 'vpaSpin 1s linear infinite' : 'none' }} />
            </button>
          )}
          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? 'Thu gọn' : 'Mở rộng'}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted, #6b7280)',
                padding: 4,
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 4,
                transition: 'color 120ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-strong)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
        </div>
      </div>

      {/* Body phong cách Gentelella x_content */}
      {expanded && (
        <div
          style={{
            padding: 'var(--gutter-card, 18px)',
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            ...bodyStyle,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
