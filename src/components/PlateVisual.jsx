const SIZES = {
  sm: { pad: '5px 8px', gap: 6, radius: 4, minH: 32, provFs: 11, seriFs: 8, numFs: 15, ls: 0.5, boltSize: 3, boltInset: 6, border: 2 },
  md: { pad: '10px 14px', gap: 12, radius: 6, minH: 92, provFs: 22, seriFs: 14, numFs: 34, ls: 1.5, boltSize: 5, boltInset: 8, border: 4 },
  lg: { pad: '22px 28px', gap: 22, radius: 8, minH: 180, provFs: 'clamp(28px,5.5vw,48px)', seriFs: 'clamp(18px,3.6vw,30px)', numFs: 'clamp(40px,8.5vw,78px)', ls: 3, boltSize: 9, boltInset: 14, border: 7 },
};

export default function PlateVisual({ size = 'md', prov, seri, num }) {
  const s = SIZES[size] || SIZES.md;
  const emboss = '0 1px 0 rgba(255,255,255,.9), 0 -1px 0 rgba(0,0,0,.15), 0 1.5px 1.5px rgba(0,0,0,.35)';

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        gap: s.gap,
        minHeight: s.minH,
        padding: s.pad,
        borderRadius: s.radius,
        overflow: 'hidden',
        /* Brushed-aluminum base + diagonal reflective sheen, like real reflective sheeting */
        background: `
          linear-gradient(115deg, transparent 30%, rgba(255,255,255,.85) 45%, rgba(255,255,255,.3) 52%, transparent 62%),
          repeating-linear-gradient(90deg, rgba(0,0,0,.02) 0px, rgba(0,0,0,.02) 1px, transparent 1px, transparent 3px),
          linear-gradient(180deg, #fdfdfd 0%, #f2f2f0 45%, #e8e8e5 100%)
        `,
        boxShadow: `
          0 0 0 ${s.border}px #cfcfc9 inset,
          0 0 0 ${s.border + 1}px #9a9a92 inset,
          inset 0 2px 3px rgba(255,255,255,.6),
          inset 0 -3px 5px rgba(0,0,0,.12)
        `,
      }}
    >
      {/* Bolt holes — top corners, sunk-metal look */}
      <span aria-hidden style={{ position: 'absolute', top: s.boltInset, left: s.boltInset, width: s.boltSize, height: s.boltSize, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff, #8a8a82 55%, #55554f 100%)', boxShadow: '0 1px 1px rgba(0,0,0,.4)' }} />
      <span aria-hidden style={{ position: 'absolute', top: s.boltInset, right: s.boltInset, width: s.boltSize, height: s.boltSize, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff, #8a8a82 55%, #55554f 100%)', boxShadow: '0 1px 1px rgba(0,0,0,.4)' }} />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1.02,
          fontFamily: 'Oswald,sans-serif',
          fontWeight: 700,
          color: '#0F2E6B',
          textShadow: emboss,
        }}
      >
        <span style={{ fontSize: s.provFs }}>{prov}</span>
        <span style={{ fontSize: s.seriFs, opacity: 0.94 }}>{seri}</span>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Oswald,sans-serif',
          fontWeight: 700,
          fontSize: s.numFs,
          letterSpacing: s.ls,
          color: '#0F2E6B',
          textShadow: emboss,
        }}
      >
        {num}
      </div>
    </div>
  );
}
