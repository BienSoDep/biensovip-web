import { Bell, Trash2, Eye } from 'lucide-react';
import Button from '../components/Button.jsx';

// ponytail: UC17 saved search criteria + notification. localStorage-backed.
export default function SavedSearches({ st, patch, go, notify }) {
  const searches = st.savedSearches || [];

  const saveCurrent = () => {
    const c = { id: 'ss' + Date.now(), cat: st.cat, q: st.q, vehicle: st.vehicle, cities: { ...st.cities }, catFilters: { ...st.catFilters }, created: 'Vừa xong' };
    if (searches.some((s) => s.cat === c.cat && s.q === c.q && s.vehicle === c.vehicle)) { notify('Tiêu chí này đã được lưu.'); return; }
    patch({ savedSearches: [c, ...searches] });
    notify('Đã lưu tiêu chí tìm kiếm');
  };

  const removeSearch = (id) => { patch({ savedSearches: searches.filter((s) => s.id !== id) }); notify('Đã xóa'); };
  const apply = (s) => patch({ screen: 'list', cat: s.cat, q: s.q, vehicle: s.vehicle, cities: s.cities, catFilters: s.catFilters });

  const summary = (s) => {
    const p = [];
    if (s.cat !== 'Tất cả') p.push(s.cat);
    if (s.vehicle !== 'Tất cả') p.push(s.vehicle);
    if (s.q) p.push('Đuôi: ' + s.q);
    return p.join(' · ') || 'Tất cả biển số';
  };

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Thông báo biển mới</h1>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Lưu tiêu chí để nhận thông báo khi có biển phù hợp.</p>
        </div>
        <Button variant="primary" size="md" onClick={saveCurrent}>Lưu tiêu chí hiện tại</Button>
      </div>

      {!searches.length ? (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-pill)', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bell size={28} style={{ color: 'var(--text-muted)' }} /></div>
          <div><h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có tiêu chí nào</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Lọc biển số theo ý muốn rồi nhấn "Lưu tiêu chí".</p></div>
          <Button variant="primary" size="md" onClick={go('list')}>Vào danh sách biển</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {searches.map((s) => (
            <div key={s.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{summary(s)}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Đã lưu {s.created}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button onClick={() => apply(s)} style={{ border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', padding: '8px 16px', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={14} /> Xem</button>
                <button onClick={() => removeSearch(s.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 8 }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
