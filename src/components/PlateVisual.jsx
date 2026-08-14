// Tỉ lệ khung đúng kích thước thật: biển ngắn 330x165mm (2:1, 2 dòng), biển dài 520x110mm (~4.73:1, 1 dòng)
// Xe máy chỉ dùng biển ngắn; ô tô có thể dùng cả 2 kiểu (biển ngắn cũ hoặc biển dài phổ biến hiện nay)
const ASPECT = { short: '330/165', long: '520/110' };

const SCREW_POS = [
  ['left', 'top'], ['right', 'top'], ['left', 'bottom'], ['right', 'bottom'],
];

// 4 đinh (rivi) 4 góc khung biển — màu tối kim loại, có lõi sáng giả lập phần bắt sáng của đầu đinh
function screwStyle(s, [x, y]) {
  return {
    position: 'absolute', [x]: `${s.screwOff}px`, [y]: `${s.screwOff}px`,
    width: s.screwSize, height: s.screwSize, borderRadius: '50%', zIndex: 3,
    background: 'radial-gradient(circle at 35% 30%, #9a9a9a, #4a4a4a 55%, #222)',
    boxShadow: '0 1px 2px rgba(0,0,0,.55), inset 0 1px 1px rgba(255,255,255,.5), inset 0 -1px 1px rgba(0,0,0,.5)',
  };
}

const SIZES = {
  sm: {
    long: { pad: '0 2px', gap: 3, radius: 3, provFs: 16, seriFs: 12, numFs: 24, ls: 0.3, border: 2, screwSize: 2, screwOff: 1 },
    short: { pad: '0 2px', gap: 0, radius: 3, topFs: 16, numFs: 24, ls: 0.3, border: 2, screwSize: 2, screwOff: 1 },
  },
  md: {
    long: { pad: '0 3px', gap: 6, radius: 5, provFs: 32, seriFs: 24, numFs: 44, ls: 1, border: 3, screwSize: 3, screwOff: 2 },
    short: { pad: '0 3px', gap: 0, radius: 5, topFs: 34, numFs: 40, ls: 1, border: 3, screwSize: 3, screwOff: 2 },
  },
  listLg: {
    long: { pad: '1px 8px', gap: 10, radius: 6, provFs: 52, seriFs: 38, numFs: 88, ls: 1.2, border: 4, screwSize: 4, screwOff: 3 },
    short: { pad: '1px 6px', gap: 0, radius: 6, topFs: 50, numFs: 108, ls: 1.2, border: 4, screwSize: 4, screwOff: 3 },
  },
  lg: {
    long: { pad: '1px 8px', gap: 12, radius: 7, provFs: 'clamp(36px,6.5vw,60px)', seriFs: 'clamp(26px,4.8vw,42px)', numFs: 'clamp(60px,12vw,104px)', ls: 1.5, border: 5, screwSize: 5, screwOff: 3 },
    short: { pad: '1px 5px', gap: 0, radius: 7, topFs: 'clamp(34px,6.5vw,58px)', numFs: 'clamp(72px,14vw,126px)', ls: 1.5, border: 5, screwSize: 5, screwOff: 3 },
  },
};

// Số chữ số "chuẩn" mỗi khung được thiết kế fs cho — số dài hơn (VD suffix tứ quý dài) tự co lại theo tỉ lệ
const BASELINE_NUM_LEN = { short: 6, long: 6 };

function scaleFontSize(fs, ratio) {
  if (ratio >= 1) return fs;
  if (typeof fs === 'number') return fs * ratio;
  const m = String(fs).match(/^clamp\((.+),(.+),(.+)\)$/);
  if (!m) return fs;
  const scaleTerm = (t) => t.trim().replace(/(-?[\d.]+)(px|vw)/g, (_, n, u) => `${(parseFloat(n) * ratio).toFixed(2)}${u}`);
  return `clamp(${scaleTerm(m[1])},${scaleTerm(m[2])},${scaleTerm(m[3])})`;
}

export default function PlateVisual({ size = 'md', prov, seri, num, shape = 'short' }) {
  const isMoto = shape === 'short';
  const kind = shape;
  const s = (SIZES[size] || SIZES.md)[kind];
  const numLen = String(num || '').replace(/[.\s]/g, '').length;
  const numScale = Math.min(1, BASELINE_NUM_LEN[kind] / Math.max(numLen, 1));
  const numFs = scaleFontSize(s.numFs, numScale);
  // Hiệu ứng chữ dập nổi (embossed) — đậm hơn: bóng tối đổ dày xuống dưới-phải (thành lõm khuất sáng)
  // + viền sáng trắng rõ hắt lên trên-trái (rìa lõm bắt sáng mạnh), giả lập ánh sáng chiếu chéo từ trên-trái.
  const textColor = '#191919';
  const textShadow = [
    '0 1.5px 0 rgba(255,255,255,1)',
    '-1px 0 0 rgba(255,255,255,.5)',
    '0 -1.5px 0 rgba(0,0,0,.7)',
    '1px 0 0 rgba(0,0,0,.4)',
    '1.5px 2.5px 1px rgba(0,0,0,.45)',
    '2px 3.5px 3px rgba(0,0,0,.25)',
    '0 4px 5px rgba(0,0,0,.15)',
  ].join(', ');
  const fontFamily = 'Oswald,sans-serif';

  const plateStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: isMoto ? 'center' : 'flex-start',
    flexDirection: isMoto ? 'column' : 'row',
    gap: s.gap,
    width: '100%',
    aspectRatio: ASPECT[kind],
    padding: s.pad,
    borderRadius: s.radius,
    overflow: 'hidden',
    boxSizing: 'border-box',
    background: 'linear-gradient(180deg, #ffffff 0%, #f7f7f5 60%, #f0f0ee 100%)',
    boxShadow: `
      0 0 0 ${s.border}px #101012 inset,
      inset 0 1px 2px rgba(255,255,255,.8),
      inset 0 -2px 3px rgba(0,0,0,.08)
    `,
  };

  const screws = SCREW_POS.map((pos, i) => (
    <span key={i} style={screwStyle(s, pos)} />
  ));

  if (isMoto) {
    return (
      <div style={plateStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, fontFamily, fontWeight: 700, color: textColor, textShadow, lineHeight: 1 }}>
          <span style={{ fontSize: s.topFs }}>{prov}</span>
          <span style={{ fontSize: s.topFs, opacity: 0.92 }}>{seri}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily, fontWeight: 700, fontSize: numFs, letterSpacing: s.ls, color: textColor, textShadow, lineHeight: 1, whiteSpace: 'nowrap' }}>
          {num}
        </div>
        {screws}
      </div>
    );
  }

  return (
    <div style={plateStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.02, fontFamily, fontWeight: 700, color: textColor, textShadow }}>
        <span style={{ fontSize: s.provFs }}>{prov}</span>
        <span style={{ fontSize: s.seriFs, opacity: 0.92 }}>{seri}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily, fontWeight: 700, fontSize: numFs, letterSpacing: s.ls, color: textColor, textShadow, whiteSpace: 'nowrap' }}>
        {num}
      </div>
      {screws}
    </div>
  );
}
