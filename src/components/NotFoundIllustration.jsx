// Minh họa 404 — hiệu ứng "wifi đang bắt sóng lại", theo đúng mẫu reconnecting quen thuộc
// (Chrome offline dinosaur wifi icon, macOS/Android reconnecting indicator): dấu chấm trung tâm
// + 3 vòng cung đồng tâm sáng tuần tự từ trong ra ngoài, lặp lại — dễ nhận ra ngay là "đang tìm
// lại kết nối" thay vì node-dây tự chế (feedback 14/09/2026, thay bản v2 chưa đẹp).
export default function NotFoundIllustration() {
  return (
    <svg
      viewBox="0 0 360 220"
      width="100%"
      style={{ maxWidth: 380, height: 'auto', overflow: 'visible' }}
      role="img"
      aria-label="Minh họa đang kết nối lại, khắc phục lỗi"
    >
      <defs>
        <radialGradient id="nf-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--amber-400)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--amber-400)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="180" cy="120" r="150" fill="url(#nf-glow)" />

      <g opacity="0.8">
        <circle cx="40" cy="40" r="5" fill="var(--amber-500)" />
        <circle cx="320" cy="45" r="4" fill="var(--action-primary)" />
        <circle cx="45" cy="195" r="4" fill="var(--action-primary)" />
        <circle cx="325" cy="185" r="6" fill="var(--amber-500)" />
      </g>

      {/* 3 vòng cung tín hiệu, sáng tuần tự trong → ngoài, dạng quạt hướng lên như icon wifi chuẩn */}
      <g transform="translate(180 130)">
        <path d="M -30 0 A 30 30 0 0 1 30 0" fill="none" stroke="var(--border-subtle)" strokeWidth="8" strokeLinecap="round" />
        <path d="M -30 0 A 30 30 0 0 1 30 0" fill="none" stroke="var(--action-primary)" strokeWidth="8" strokeLinecap="round" className="nf-arc nf-arc-1" />

        <path d="M -55 -22 A 62 62 0 0 1 55 -22" fill="none" stroke="var(--border-subtle)" strokeWidth="8" strokeLinecap="round" />
        <path d="M -55 -22 A 62 62 0 0 1 55 -22" fill="none" stroke="var(--action-primary)" strokeWidth="8" strokeLinecap="round" className="nf-arc nf-arc-2" />

        <path d="M -80 -46 A 94 94 0 0 1 80 -46" fill="none" stroke="var(--border-subtle)" strokeWidth="8" strokeLinecap="round" />
        <path d="M -80 -46 A 94 94 0 0 1 80 -46" fill="none" stroke="var(--action-primary)" strokeWidth="8" strokeLinecap="round" className="nf-arc nf-arc-3" />

        <circle r="12" fill="var(--action-primary)" className="nf-dot" />
      </g>

      <text x="180" y="200" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="16" fill="var(--text-muted)" className="nf-status-text">Đang kết nối lại…</text>

      <style>{`
        @keyframes nf-arc-fade {
          0%, 100% { opacity: 0; }
          40%, 70% { opacity: 1; }
        }
        @keyframes nf-dot-pulse {
          0%, 30% { transform: scale(0.85); filter: drop-shadow(0 0 0 transparent); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 8px var(--action-primary)); }
          100% { transform: scale(0.85); filter: drop-shadow(0 0 0 transparent); }
        }
        @keyframes nf-status-fade {
          0%, 100% { opacity: .55; }
          55% { opacity: 1; }
        }
        .nf-arc { opacity: 0; animation: nf-arc-fade 1.8s ease-in-out infinite; }
        .nf-arc-1 { animation-delay: 0s; }
        .nf-arc-2 { animation-delay: .18s; }
        .nf-arc-3 { animation-delay: .36s; }
        .nf-dot { transform-origin: center; transform-box: fill-box; animation: nf-dot-pulse 1.8s ease-in-out infinite; }
        .nf-status-text { animation: nf-status-fade 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .nf-arc, .nf-dot, .nf-status-text { animation: none; opacity: 1; }
        }
      `}</style>
    </svg>
  );
}
