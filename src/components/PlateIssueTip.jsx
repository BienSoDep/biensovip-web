import { useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';

/**
 * PlateIssueTip - Tooltip nổi bật hiển thị nguyên nhân cảnh báo dữ liệu biển số khi hover/focus
 * @param {Array<string|object>} issues - Danh sách lỗi hoặc cảnh báo
 * @param {string} text - Thông điệp cảnh báo đơn lẻ nếu không dùng mảng issues
 * @param {'danger'|'warning'} tone - Màu cảnh báo ('danger': đỏ, 'warning': vàng cam)
 * @param {number} size - Kích thước icon (mặc định 14)
 * @param {function} onClick - Callback khi bấm vào icon (ví dụ mở form sửa)
 * @param {object} style - Inline style tùy biến thêm
 */
export default function PlateIssueTip({
  issues = [],
  text = '',
  tone = 'danger',
  size = 14,
  onClick,
  style = {},
}) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.top, left: r.left + r.width / 2 });
  };
  const hide = () => setPos(null);

  const isWarn = tone === 'warning';
  const color = isWarn ? 'var(--status-warning-ink, #b45309)' : 'var(--status-danger, #ef4444)';
  const borderColor = isWarn ? 'var(--amber-500, #f59e0b)' : 'var(--status-danger, #ef4444)';

  const list = issues.length > 0 ? issues : (text ? [text] : []);
  if (list.length === 0) return null;

  const titleFallback = list
    .map((item) => (typeof item === 'string' ? item : item.label || item.code))
    .join(', ');

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <span
      ref={ref}
      role={onClick ? 'button' : 'note'}
      tabIndex={0}
      title={titleFallback}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'help',
        flexShrink: 0,
        outline: 'none',
        padding: '2px',
        borderRadius: 'var(--radius-sm, 4px)',
        background: 'transparent',
        transition: 'transform 120ms ease, background-color 120ms ease',
        ...style,
      }}
    >
      <TriangleAlert size={size} color={color} style={{ flexShrink: 0 }} />
      {pos && (
        <span
          role="tooltip"
          style={{
            position: 'fixed',
            top: pos.top - 8,
            left: Math.max(160, Math.min(window.innerWidth - 160, pos.left)),
            transform: 'translate(-50%, -100%)',
            background: 'var(--action-dark, #1e293b)',
            color: 'var(--white, #ffffff)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md, 8px)',
            width: 'max-content',
            maxWidth: 320,
            font: 'var(--type-caption)',
            fontSize: '12px',
            lineHeight: 1.5,
            textAlign: 'left',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)',
            zIndex: 'var(--z-popover, 9999)',
            pointerEvents: 'none',
            border: `1px solid ${borderColor}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 'var(--fw-bold, 700)',
              marginBottom: 4,
              color: isWarn ? 'var(--amber-400, #fbbf24)' : '#fca5a5',
            }}
          >
            <TriangleAlert size={13} />
            <span>{isWarn ? 'Cảnh báo biển số:' : 'Dữ liệu thiếu / cần xử lý:'}</span>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {list.map((it, idx) => (
              <li key={idx} style={{ color: 'rgba(255,255,255,0.95)' }}>
                {typeof it === 'string' ? it : it.label || it.code}
              </li>
            ))}
          </ul>
          {onClick && (
            <div
              style={{
                marginTop: 6,
                fontSize: '11px',
                color: 'rgba(255,255,255,0.65)',
                borderTop: '1px solid rgba(255,255,255,0.15)',
                paddingTop: 4,
              }}
            >
              👉 Bấm vào để chỉnh sửa ngay
            </div>
          )}
        </span>
      )}
    </span>
  );
}
