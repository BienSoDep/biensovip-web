import Button from '../../components/Button.jsx';
import { Input, IconButton } from '../../components/index.jsx';

export default function AdminCats({ st, setField, patch, setSt, notify, askDelete }) {
  const addCat = () => {
    const v = st.newCat.trim();
    if (!v) { patch({ catErr: 'Nhập tên danh mục.' }); return; }
    if (st.cats.some((c) => c.name === v)) { patch({ catErr: 'Danh mục đã tồn tại.' }); return; }
    setSt((x) => ({ ...x, cats: [...x.cats, { name: v }], newCat: '', catErr: '' }));
    notify('Đã thêm danh mục');
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ flex: '1 1 340px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Danh mục loại biển</span></div>
        {st.cats.map((c) => (
          <div key={c.name} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
            <span style={{ flex: 1, font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{c.name}</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{st.plates.filter((p) => p.cat === c.name).length} biển</span>
            <IconButton name="trash-2" label="Xóa danh mục" size="sm" onClick={() => askDelete('cat', c.name, `Xóa danh mục "${c.name}" khỏi bộ lọc?`)} />
          </div>
        ))}
      </div>
      <div style={{ flex: '1 1 300px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Thêm danh mục mới</span>
        <Input label="Tên danh mục" placeholder="VD: Biển tiến" value={st.newCat} error={st.catErr} onChange={setField('newCat')} />
        <Button variant="dark" size="md" style={{ alignSelf: 'flex-start' }} onClick={addCat}>Thêm danh mục</Button>
      </div>
    </div>
  );
}
