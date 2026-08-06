import { CITIES } from '../lib/mockData.js';
import Button from '../components/Button.jsx';
import { Input, Select, Checkbox, Radio } from '../components/index.jsx';
import PlateCard from '../components/PlateCard.jsx';
import NavBtn, { pill } from '../components/NavBtn.jsx';

export default function PlateList({ st, setSt, patch, list, page, pageCount, pageItems, cards, catNames }) {
  const clearFilters = () => patch({ cat: 'Tất cả', q: '', cities: {}, catFilters: {}, vehicle: 'Tất cả', page: 1 });

  return (
    <div style={{ animation: 'pageIn 180ms var(--ease-out)' }}>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-7) var(--pad-page) var(--space-4)' }}>
        <h1 style={{ margin: 'var(--space-3) 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Kho biển số đẹp</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{list.length} biển số phù hợp bộ lọc hiện tại</p>
      </section>
      <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-5) var(--pad-page) var(--pad-section-y)', display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        <aside style={{ flex: '0 0 272px', minWidth: 250, position: 'sticky', top: 78, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Loại biển</span>
            {catNames.map((c) => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Checkbox label={c} checked={!!st.catFilters[c]} onChange={(v) => setSt((x) => ({ ...x, catFilters: { ...x.catFilters, [c]: v }, page: 1 }))} style={{ flex: 1 }} />
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{st.plates.filter((p) => p.cat === c).length}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--border-hairline)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Tỉnh / thành</span>
            {CITIES.map((c) => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Checkbox label={c} checked={!!st.cities[c]} onChange={(v) => setSt((x) => ({ ...x, cities: { ...x.cities, [c]: v }, page: 1 }))} style={{ flex: 1 }} />
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{st.plates.filter((p) => p.city === c).length}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--border-hairline)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Loại xe</span>
            {['Tất cả', 'Ô tô', 'Xe máy'].map((v) => (
              <Radio key={v} label={v} checked={st.vehicle === v} onChange={() => patch({ vehicle: v, page: 1 })} />
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--border-hairline)' }} />
          <Input label="Đuôi số" placeholder="VD: 79" value={st.q} onChange={(e) => patch({ q: e.target.value, page: 1 })} />
          <Button variant="outline" size="sm" fullWidth onClick={clearFilters}>Xóa bộ lọc</Button>
        </aside>
        <div style={{ flex: '1 1 540px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', flex: 1 }}>
              {['Tất cả', ...catNames].map((c) => (
                <NavBtn key={c} onClick={() => patch({ cat: c, page: 1 })} {...pill(st.cat === c)}>{c}</NavBtn>
              ))}
            </div>
            <Select label="Sắp xếp" value={st.sort} options={[{ value: 'new', label: 'Mới nhất' }, { value: 'asc', label: 'Giá thấp → cao' }, { value: 'desc', label: 'Giá cao → thấp' }]} onChange={(v) => patch({ sort: v, page: 1 })} variant="pill" />
          </div>
          {list.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(268px,1fr))', gap: 'var(--gutter-section)', animation: 'fadeIn 180ms var(--ease-out)' }}>
              {cards(pageItems).map((p) => <PlateCard key={p.id} {...p} />)}
            </div>
          ) : (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
              <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Không tìm thấy biển số phù hợp</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 380 }}>Thử bỏ một vài bộ lọc, hoặc nhập đuôi số khác.</span>
              <Button variant="dark" size="md" onClick={clearFilters}>Xóa bộ lọc</Button>
            </div>
          )}
          {pageCount > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-2)', paddingTop: 'var(--space-3)' }}>
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => patch({ page: Math.max(1, page - 1) })}>Trước</Button>
              {Array.from({ length: pageCount }, (_, i) => (
                <button key={i} type="button" className="pill-btn" data-on={String(page === i + 1)} data-dark="false" aria-current={page === i + 1 ? 'page' : undefined} onClick={() => patch({ page: i + 1 })} style={{ width: 34, height: 34, border: 'none', borderRadius: 'var(--radius-pill)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', transition: 'var(--transition-control)', background: pill(page === i + 1).background, color: pill(page === i + 1).color }}>{i + 1}</button>
              ))}
              <Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => patch({ page: Math.min(pageCount, page + 1) })}>Sau</Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
