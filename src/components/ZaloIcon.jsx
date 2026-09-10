// Logo Zalo (chữ "Zalo" vẽ bằng text SVG) — dùng chung cho ContactFab + PlateCard, tránh copy-paste.
export default function ZaloIcon(props) {
  return (
    <svg viewBox="0 0 48 48" width={22} height={22} {...props}>
      <text x="24" y="30" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="15" fill="currentColor">Zalo</text>
    </svg>
  );
}
