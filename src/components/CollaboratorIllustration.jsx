import { motion } from 'framer-motion';

// Minh họa hero trang CTV — người cầm điện thoại chia sẻ link, tiền/coin bay ra, tone cam/kem
// đồng bộ design token của site. Vẽ tay bằng SVG, không phụ thuộc asset ngoài.
export default function CollaboratorIllustration({ style }) {
  return (
    <motion.svg
      viewBox="0 0 320 280" width="100%" height="100%" style={style}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <defs>
        <linearGradient id="ctv-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--surface-tint-cream)" />
          <stop offset="1" stopColor="var(--white)" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="140" r="130" fill="url(#ctv-bg)" />

      {/* Người */}
      <g>
        <circle cx="130" cy="96" r="26" fill="var(--action-primary)" opacity="0.15" />
        <circle cx="130" cy="90" r="18" fill="var(--action-primary)" />
        <path d="M92 190c4-30 20-46 38-46s34 16 38 46" fill="var(--action-primary)" opacity="0.85" />
      </g>

      {/* Điện thoại + link */}
      <g>
        <rect x="150" y="118" width="52" height="90" rx="10" fill="var(--white)" stroke="var(--border-hairline)" strokeWidth="2" />
        <rect x="158" y="130" width="36" height="54" rx="4" fill="var(--surface-sunken)" />
        <circle cx="176" cy="196" r="4" fill="var(--action-primary)" />
        <path d="M176 145l6 8-6 8-6-8z" fill="var(--action-primary)" />
      </g>

      {/* Coin bay ra — stagger animation */}
      {[
        { cx: 232, cy: 96, r: 13, delay: 0.15 },
        { cx: 258, cy: 132, r: 10, delay: 0.3 },
        { cx: 220, cy: 150, r: 8, delay: 0.45 },
      ].map((c, i) => (
        <motion.g key={i}
          initial={{ opacity: 0, y: 10, scale: 0.6 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: c.delay, ease: [0.16, 1, 0.3, 1] }}
        >
          <circle cx={c.cx} cy={c.cy} r={c.r} fill="var(--status-warning, #F59E0B)" />
          <text x={c.cx} y={c.cy + 4} fontSize={c.r} fontWeight="700" fill="var(--white)" textAnchor="middle">đ</text>
        </motion.g>
      ))}

      {/* Đường link nối — vẽ dần */}
      <motion.path
        d="M202 150c14 -4 24 -10 30 -18"
        fill="none" stroke="var(--action-primary)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
      />
    </motion.svg>
  );
}
