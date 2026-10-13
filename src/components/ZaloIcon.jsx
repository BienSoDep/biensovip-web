export default function ZaloIcon({
  width,
  height,
  size,
  style,
  fontSize,
  ...props
}) {
  const h = height || size;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        fontWeight: 700,
        fontSize: fontSize || (h ? Math.max(13, Math.round(h * 0.75)) : 16),
        lineHeight: 1,
        letterSpacing: "-0.2px",
        color: "currentColor",
        userSelect: "none",
        ...style,
      }}
      {...props}
    >
      Zalo
    </span>
  );
}
