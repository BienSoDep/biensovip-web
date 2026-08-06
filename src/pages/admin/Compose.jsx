import { POST_CATS, opts } from '../../lib/mockData.js';
import Button from '../../components/Button.jsx';
import { Input, Select } from '../../components/index.jsx';
import PlateVisual from '../../components/PlateVisual.jsx';

export default function Compose({ st, setField, patch, setSt, notify, publish, insertPlates }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ flex: '1 1 420px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input label="Tiêu đề" placeholder="VD: Ngũ quý 99999 — vì sao đắt nhất?" value={st.cTitle} error={st.cErr} onChange={setField('cTitle')} />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Nội dung</span>
          <textarea rows={9} placeholder="## Độ hiếm quyết định giá" value={st.cBody} onChange={setField('cBody')} style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
        </label>
        <Button variant="outline" size="sm" style={{ alignSelf: 'flex-start' }} onClick={() => patch({ picker: !st.picker })}>Chèn biển số liên quan</Button>
        {st.picker && (
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', animation: 'fadeIn 140ms var(--ease-out)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Chọn biển để chèn</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {insertPlates.map((p) => (
                <div key={p.id} onClick={() => { setSt((x) => ({ ...x, cBody: x.cBody + `\n[biển ${p.prov}${p.seri} ${p.num}]`, picker: false })); notify('Đã chèn biển số vào bài'); }} className="pressable" style={{ cursor: 'pointer', background: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', boxShadow: 'var(--shadow-inset-hairline)' }}>
                  <PlateVisual size="sm" prov={p.prov} seri={p.seri} num={p.num} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Select label="Chuyên mục" value={st.cCat} options={opts(POST_CATS.slice(1))} onChange={(v) => patch({ cCat: v })} />
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 22, textAlign: 'center', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Ảnh đại diện — kéo &amp; thả vào đây</div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="md" onClick={() => publish('Bản nháp')} style={{ flex: 1 }}>Lưu nháp</Button>
          <Button variant="primary" size="md" onClick={() => publish('Đã xuất bản')} style={{ flex: 1 }}>{st.editPostId ? 'Cập nhật' : 'Xuất bản'}</Button>
        </div>
      </div>
    </div>
  );
}
