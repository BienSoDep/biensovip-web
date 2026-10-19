import { useRef, useState } from 'react';
import { Info } from 'lucide-react';

// Icon thông tin — hover để xem giải thích ngắn về khái niệm/label bên cạnh.
// Bubble dùng position:fixed + tọa độ tính bằng JS khi hover, để thoát khỏi mọi ancestor có
// overflow:hidden/auto (bảng, card cuộn ngang…) — dùng position:absolute thuần CSS sẽ bị cắt mất.
export function InfoTip({ text, size = 14, style }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const isNearTop = r.top < 90;
    setPos({
      top: isNearTop ? r.bottom + 8 : r.top - 8,
      left: Math.max(140, Math.min(window.innerWidth - 140, r.left + r.width / 2)),
      flipped: isNearTop,
    });
  };
  const hide = () => setPos(null);

  if (!text) return null;

  return (
    <span
      ref={ref}
      role="note"
      aria-label={text}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'help',
        color: 'var(--text-faint)',
        verticalAlign: 'middle',
        flexShrink: 0,
        outline: 'none',
        transition: 'color 120ms ease',
        ...style,
      }}
    >
      <Info size={size} aria-hidden="true" style={{ opacity: 0.8 }} />
      {pos && (
        <span
          role="tooltip"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            transform: pos.flipped ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            background: 'var(--action-dark, #0f172a)',
            color: 'var(--white, #fff)',
            padding: '7px 11px',
            borderRadius: 'var(--radius-control)',
            width: 'max-content',
            maxWidth: 280,
            font: 'var(--type-caption)',
            fontSize: 12,
            lineHeight: 1.5,
            textAlign: 'left',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.25)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default InfoTip;
