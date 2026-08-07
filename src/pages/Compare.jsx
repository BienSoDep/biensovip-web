import { ArrowLeftRight, X, Plus } from 'lucide-react';
import Button from '../components/Button.jsx';
import PlateVisual from '../components/PlateVisual.jsx';

// ponytail: UC16 multi-plate comparison table, horizontal scroll mobile
export default function Compare({ st, patch, go, notify }) {
  const compareIds = st.compareIds || [];
  const plates = compareIds.map((id) => st.plates.find((p) => p.id === id)).filter(Boolean);

  const removePlate = (id) => patch({ compareIds: compareIds.filter((x) => x !== id) });
  const addRandom = () => {
    const avail = st.plates.filter((p) => p.status !== 'Ẩn' && !compareIds.includes(p.id));
    if (!avail.length) { notify('Không còn biển để so sánh.'); return; }
    patch({ compareIds: [...compareIds, avail[Math.floor(Math.random() * avail.length)].id] });
  };

  const rows = ['cat', 'vehicle', 'city', 'price', 'status'];

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>So sánh biển số</h1>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chọn tối đa 3 biển để so sánh.</p>
        </div>
        <Button variant="outline" size="md" onClick={addRandom} disabled={compareIds.length >= 3}><Plus size={16} style={{ marginRight: 4 }} /> Thêm biển</Button>
      </div>

      {!plates.length ? (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-pill)', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeftRight size={28} style={{ color: 'var(--text-muted)' }} /></div>
          <div><h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có biển để so sánh</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Thêm biển từ danh sách hoặc nhấn nút trên.</p></div>
          <Button variant="primary" size="md" onClick={go('list')}>Xem danh sách biển</Button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${plates.length},minmax(200px,1fr))`, minWidth: plates.length * 220 + 210 }}>
            <div style={{ padding: 'var(--space-3) var(--space-4)', font: 'var(--type-caption)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Thuộc tính</div>
            {plates.map((p) => (
              <div key={p.id} style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--white)', borderRadius: 'var(--radius-card) var(--radius-card) 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', position: 'relative' }}>
                <button onClick={() => removePlate(p.id)} style={{ position: 'absolute', top: 8, right: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}><X size={16} /></button>
                <PlateVisual size="sm" prov={p.prov} seri={p.seri} num={p.num} />
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{p.prov}{p.seri} {p.num}</span>
                <button onClick={() => { patch({ screen: 'detail', curId: p.id }); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>Xem chi tiết</button>
              </div>
            ))}
            {rows.map((row) => (
              <>
                <div key={row} style={{ padding: 'var(--space-3) var(--space-4)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--surface-sunken)' }}>{row === 'cat' ? 'Danh mục' : row === 'vehicle' ? 'Loại xe' : row === 'city' ? 'Tỉnh/TP' : row === 'price' ? 'Giá' : 'Trạng thái'}</div>
                {plates.map((p) => (
                  <div key={p.id} style={{ padding: 'var(--space-3) var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-body)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', textAlign: 'center' }}>
                    {row === 'price' ? <span style={{ font: 'var(--type-price)', color: 'var(--text-strong)' }}>{p.price}</span> : p[row]}
                  </div>
                ))}
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
