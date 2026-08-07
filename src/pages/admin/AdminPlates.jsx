import { opts } from '../../lib/mockData.js';
import { TONES } from '../../common/constants.js';
import { Select, Badge, IconButton } from '../../components/index.jsx';
import PlateVisual from '../../components/PlateVisual.jsx';

export default function AdminPlates({ st, patch, admPlates, openEdit, askDelete, catNames }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <Select label="Danh mục" value={st.admCat} options={opts(['Tất cả', ...catNames])} onChange={(v) => patch({ admCat: v })} />
        <Select label="Trạng thái" value={st.admStatus} options={opts(['Tất cả', 'Còn hàng', 'Đã bán', 'Ẩn'])} onChange={(v) => patch({ admStatus: v })} />
      </div>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '1 1 128px' }}>Biển số</span><span style={{ flex: '1 1 70px' }}>Danh mục</span><span style={{ flex: '1 1 92px' }}>Giá</span><span style={{ flex: '1 1 78px' }}>Trạng thái</span><span style={{ flex: '1 1 62px' }}>Cập nhật</span><span style={{ flex: '0 0 72px' }}>Thao tác</span>
        </div>
        {admPlates.map((p) => (
          <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
            <span style={{ flex: '1 1 128px' }}><PlateVisual size="sm" prov={p.prov} seri={p.seri} num={p.num} /></span>
            <span style={{ flex: '1 1 70px', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{p.cat}</span>
            <span style={{ flex: '1 1 92px', font: 'var(--type-caption)', color: 'var(--text-strong)' }}>{p.price}</span>
            <span style={{ flex: '1 1 78px' }}><Badge tone={TONES[p.status] || 'neutral'}>{p.status}</Badge></span>
            <span style={{ flex: '1 1 62px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{p.updated}</span>
            <span style={{ flex: '0 0 72px', display: 'flex', gap: 'var(--space-2)' }}>
              <IconButton name="pencil" label="Sửa" size="sm" onClick={() => openEdit(p)} />
              <IconButton name="trash-2" label="Xóa" size="sm" onClick={() => askDelete('plate', p.id, `Xóa biển ${p.prov}${p.seri} ${p.num} khỏi hệ thống? Hành động này không thể hoàn tác.`)} />
            </span>
          </div>
        ))}
        {admPlates.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có biển số nào khớp tìm kiếm.</div>}
      </div>
    </div>
  );
}
