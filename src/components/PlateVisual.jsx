export default function PlateVisual({ size = 'md', prov, seri, num }) {
  if (size === 'sm') {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: 6, background: '#F6F4EC', boxShadow: '0 0 0 3px #d8d3c4 inset', borderRadius: 3, padding: '4px 6px', minHeight: 34, width: 'fit-content' }}>
        <div style={{ background: '#1B4F91', color: '#fff', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2px 5px', fontFamily: 'Oswald,sans-serif', fontWeight: 600, lineHeight: 1.05 }}>
          <span style={{ fontSize: 11 }}>{prov}</span>
          <span style={{ fontSize: 8, opacity: 0.9 }}>{seri}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Oswald,sans-serif', fontWeight: 700, fontSize: 15, color: '#111', letterSpacing: 1, paddingRight: 2 }}>{num}</div>
      </div>
    );
  }
  if (size === 'lg') {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: 24, background: '#F6F4EC', boxShadow: '0 0 0 7px #d8d3c4 inset,0 40px 70px -20px rgba(0,0,0,.85)', borderRadius: 5, padding: '24px 30px', minHeight: 190 }}>
        <div style={{ position: 'absolute', top: 12, left: '28%', width: 9, height: 9, borderRadius: '50%', background: '#9c9686' }} />
        <div style={{ position: 'absolute', top: 12, left: '72%', width: 9, height: 9, borderRadius: '50%', background: '#9c9686' }} />
        <div style={{ background: '#1B4F91', color: '#fff', borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 20px', fontFamily: 'Oswald,sans-serif', fontWeight: 600, lineHeight: 1.05 }}>
          <span style={{ fontSize: 'clamp(30px,6vw,52px)' }}>{prov}</span>
          <span style={{ fontSize: 'clamp(20px,4vw,34px)', opacity: 0.9 }}>{seri}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Oswald,sans-serif', fontWeight: 700, fontSize: 'clamp(42px,9vw,84px)', color: '#111', letterSpacing: 3 }}>{num}</div>
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: 12, background: '#F6F4EC', boxShadow: '0 0 0 4px #d8d3c4 inset', borderRadius: 4, padding: '12px 16px', minHeight: 96 }}>
      <div style={{ position: 'absolute', top: 6, left: '28%', width: 5, height: 5, borderRadius: '50%', background: '#9c9686' }} />
      <div style={{ position: 'absolute', top: 6, left: '72%', width: 5, height: 5, borderRadius: '50%', background: '#9c9686' }} />
      <div style={{ background: '#1B4F91', color: '#fff', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 12px', fontFamily: 'Oswald,sans-serif', fontWeight: 600, lineHeight: 1.05 }}>
        <span style={{ fontSize: 24 }}>{prov}</span>
        <span style={{ fontSize: 15, opacity: 0.9 }}>{seri}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Oswald,sans-serif', fontWeight: 700, fontSize: 36, color: '#111', letterSpacing: 2 }}>{num}</div>
    </div>
  );
}
