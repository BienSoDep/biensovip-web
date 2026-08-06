import { useState } from 'react';
import Button from '../components/Button.jsx';
import { Badge, IconButton } from '../components/index.jsx';
import PlateVisual from '../components/PlateVisual.jsx';

const GALLERY_BG = ['var(--surface-sunken)', 'var(--surface-tint-cream)', 'var(--white)'];

export default function PlateDetail({ st, cur, go, openPlate, openBuy, toggleFav, notify }) {
  const [shot, setShot] = useState(0);

  if (!cur) {
    return (
      <div style={{ animation: 'pageIn 180ms var(--ease-out)', maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-10) var(--pad-page)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
        <h1 style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Biển số không tồn tại</h1>
        <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>Biển số này có thể đã được bán hoặc đường dẫn không chính xác.</p>
        <Button variant="primary" size="md" onClick={() => go('list')()}>Về kho biển số</Button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-4) var(--pad-page) var(--pad-section-y)', display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 500px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,4vw,52px)', display: 'flex', justifyContent: 'center', transition: 'background 180ms var(--ease-out)' }}>
            <div style={{ width: '100%', maxWidth: 560, background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: 24 }}>
              <PlateVisual size="lg" prov={cur.prov} seri={cur.seri} num={cur.num} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {GALLERY_BG.map((bg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setShot(i)}
                className="pressable"
                aria-label={'Ảnh ' + (i + 1)}
                style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', border: '2px solid ' + (shot === i ? 'var(--action-primary)' : 'var(--border-hairline)'), background: bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
              >
                <div style={{ width: 44, transform: 'scale(.5)', transformOrigin: 'center' }}><PlateVisual size="lg" prov={cur.prov} seri={cur.seri} num={cur.num} /></div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Biển số tương tự</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {st.plates.filter((p) => p.id !== cur.id).slice(0, 4).map((p) => (
                <div key={p.id} onClick={() => openPlate(p.id)} className="pressable" style={{ cursor: 'pointer', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', transition: 'var(--transition-card)' }}>
                  <PlateVisual size="sm" prov={p.prov} seri={p.seri} num={p.num} />
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{p.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Badge tone="dark">{cur.cat}</Badge>
            <Badge tone="mint">Còn hàng</Badge>
          </div>
          <div>
            <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>{cur.title}</h1>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{cur.sub}</p>
          </div>
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Giá bán</span>
            <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{cur.price}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <Button variant="primary" size="lg" onClick={() => openBuy(cur.id)} style={{ flex: '1 1 120px' }}>Gọi ngay</Button>
            <Button variant="outline" size="lg" onClick={() => openBuy(cur.id)} style={{ flex: '1 1 120px' }}>Nhắn Zalo</Button>
            <IconButton name="heart" label="Lưu yêu thích" size="lg" onClick={() => { toggleFav(cur.id); notify(st.favs[cur.id] ? 'Đã bỏ khỏi yêu thích' : 'Đã lưu vào yêu thích'); }} style={st.favs[cur.id] ? { color: 'var(--status-danger)' } : undefined} />
          </div>
          <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Ý nghĩa phong thủy</span>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{cur.fengshui}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 'var(--space-3)' }}>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Loại xe</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{cur.vehicle}</div></div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tỉnh / thành</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{cur.city}</div></div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Hồ sơ</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Sang tên ngay</div></div>
            <div style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}><div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Bảo đảm</div><div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Hồ sơ gốc</div></div>
          </div>
        </div>
      </section>
    </div>
  );
}
