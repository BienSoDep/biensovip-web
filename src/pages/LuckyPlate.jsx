import Button from '../components/Button.jsx';
import { Input, Select, Eyebrow } from '../components/index.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import { priceNum } from '../lib/mockData.js';

// ponytail: mock scoring — real feng shui algorithm later. One visible knob: MH_DIGITS.
const MH = {
  Kim: [6, 7], Mộc: [3, 4], Thủy: [1, 6], Hỏa: [2, 7], Thổ: [0, 5, 8],
};
const YEAR_MH = { 0: 'Kim', 1: 'Kim', 2: 'Thủy', 3: 'Thủy', 4: 'Mộc', 5: 'Mộc', 6: 'Hỏa', 7: 'Hỏa', 8: 'Thổ', 9: 'Thổ' };
const BUDGETS = {
  'Dưới 100 triệu': 100e6, '100 – 500 triệu': 500e6, '500 triệu – 1 tỷ': 1e9, 'Trên 1 tỷ': 1e9, 'Mọi ngân sách': Infinity,
};
const PURPOSES = ['Kinh doanh', 'Đi lại cá nhân', 'Sang tên/sưu tầm'];

function digitsOf(plate) {
  return (String(plate.prov) + String(plate.seri) + String(plate.num)).replace(/[^0-9]/g, '').split('').map(Number);
}
function scorePlate(plate, mh, budget, vehicle) {
  const digs = digitsOf(plate);
  const lucky = MH[mh] || [];
  let score = 40;
  const hits = digs.filter((d) => lucky.indexOf(d) >= 0).length;
  score += hits * 8;
  if (hits >= digs.length * 0.6) score += 6;
  const price = priceNum(plate.price);
  const within = price === 0 || price <= budget;
  if (within) score += 12; else score -= 16;
  if (plate.vehicle === vehicle) score += 8;
  if (plate.cat === 'Ngũ quý' || plate.cat === 'Tứ quý') score += 4;
  return { score: Math.max(5, Math.min(100, score)), hits, lucky, within, price };
}

export default function LuckyPlate({ st, patch, go, openPlate, openBuy }) {
  const m = st.ms;
  const year = parseInt(m.year, 10);
  const mh = (Number.isFinite(year) ? YEAR_MH[year % 10] : '') || 'Thổ';
  const set = (k) => (e) => patch((x) => ({ ...x, ms: { ...x.ms, [k]: e && e.target ? e.target.value : e } }));

  const submit = () => {
    if (!/^(19|20)\d{2}$/.test(String(m.year).trim())) { patch({ msErr: 'Nhập năm sinh hợp lệ (VD: 1990).' }); return; }
    const budget = BUDGETS[m.budget] ?? Infinity;
    const ranked = st.plates
      .filter((p) => p.status !== 'Ẩn')
      .map((p) => ({ p, ...scorePlate(p, mh, budget, m.vehicle) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    patch({ msResult: { mh, budget, vehicle: m.vehicle, ranked } });
  };

  const reset = () => patch({ msResult: null, msErr: '' });

  return (
    <section style={{ maxWidth: 820, margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-7)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Eyebrow tone="blue">Tư vấn theo ngũ hành</Eyebrow>
        <h1 style={{ margin: 0, font: 'var(--type-display-1)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Tìm biển số hợp mệnh của bạn</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>Điền thông tin cá nhân, hệ thống gợi ý 3 biển số có ý nghĩa phong thủy phù hợp nhất với bản mệnh, mục đích và ngân sách của bạn.</p>
      </div>

      {!st.msResult ? (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={m.name} onChange={set('name')} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ flex: '1 1 180px' }}>
              <Input label="Năm sinh" placeholder="VD: 1990" value={m.year} error={st.msErr} onChange={set('year')} />
            </div>
            <div style={{ flex: '1 1 220px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Mệnh (tự động)</span>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--action-primary)' }}>{mh}</span>
            </div>
          </div>
          <Select label="Mục đích sử dụng" value={m.purpose} options={PURPOSES} onChange={set('purpose')} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ flex: '1 1 200px' }}><Select label="Loại xe" value={m.vehicle} options={['Ô tô', 'Xe máy']} onChange={set('vehicle')} /></div>
            <div style={{ flex: '1 1 240px' }}><Select label="Ngân sách" value={m.budget} options={Object.keys(BUDGETS)} onChange={set('budget')} /></div>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={submit}>Gợi ý biển số hợp mệnh</Button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', animation: 'fadeIn 180ms var(--ease-out)' }}>
          <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Dành cho <b style={{ color: 'var(--text-strong)' }}>{m.name || 'bạn'}</b></span>
              <span style={{ font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>Mệnh {st.msResult.mh}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Hợp số: {MH[st.msResult.mh].join(', ')} · {st.msResult.vehicle} · {m.budget}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>← Sửa thông tin</Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <span style={{ font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>3 biển số hợp mệnh nhất</span>
            {st.msResult.ranked.map((r, i) => (
              <div key={r.p.id} style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-pill)', background: i === 0 ? 'var(--action-primary)' : 'var(--surface-muted)', color: i === 0 ? 'var(--white)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-title-3)' }}>{i + 1}</span>
                <PlateVisual size="md" prov={r.p.prov} seri={r.p.seri} num={r.p.num} />
                <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{r.p.cat} · {r.p.city}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chứa {r.hits} số {r.lucky.join('/')} hợp mệnh {st.msResult.mh}</span>
                  <span style={{ font: 'var(--type-price)', color: 'var(--text-strong)' }}>{r.p.price}</span>
                </div>
                <div style={{ flex: '0 0 150px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--surface-muted)', overflow: 'hidden' }}><div style={{ height: '100%', width: r.score + '%', background: r.score >= 80 ? 'var(--status-success)' : 'var(--action-primary)', transition: 'width 300ms var(--ease-out)' }} /></div>
                  <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{r.score}% hợp mệnh</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button variant="dark" size="sm" onClick={() => openPlate(r.p.id)}>Xem biển</Button>
                  <Button variant="primary" size="sm" onClick={() => openBuy(r.p.id)}>Gọi ngay</Button>
                </div>
              </div>
            ))}
          </div>

          <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Gợi ý mang tính tham khảo phong thủy. Kết quả chính xác cần tư vấn trực tiếp — liên hệ Duy Đinh để được hỗ trợ chi tiết.</p>
        </div>
      )}
    </section>
  );
}
