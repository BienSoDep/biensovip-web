export default function ShinyText({
  text,
  disabled = false,
  speed = 3,
  className = '',
  style = {},
  color = 'inherit',
  shimmerColor = '#FFFFFF',
}) {
  const animationDuration = `${speed}s`;

  return (
    <>
      <style>{`
        @keyframes reactBitsShine {
          0% { background-position: 100%; }
          100% { background-position: -100%; }
        }
      `}</style>
      <span
        className={className}
        style={{
          color,
          backgroundImage: disabled
            ? 'none'
            : `linear-gradient(120deg, transparent 40%, ${shimmerColor} 50%, transparent 60%)`,
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: disabled ? 'unset' : 'text',
          backgroundClip: disabled ? 'unset' : 'text',
          display: 'inline-block',
          animation: disabled ? 'none' : `reactBitsShine ${animationDuration} linear infinite`,
          ...style,
        }}
      >
        {text}
      </span>
    </>
  );
}

