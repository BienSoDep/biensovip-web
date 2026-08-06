import { opts } from '../../lib/mockData.js';
import { STATUS_FG } from '../../common/constants.js';
import { Switch, Select } from '../../components/index.jsx';
import PlateVisual from '../../components/PlateVisual.jsx';

export default function AdminContacts({ st, setSt, patch, admContacts, notify }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-4) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ flex: 1, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>Đồng bộ yêu cầu về Google Sheet &amp; email</span>
        <Switch checked={st.sync} onChange={(v) => { patch({ sync: v }); notify(v ? 'Đã bật đồng bộ' : 'Đã tắt đồng bộ'); }} />
      </div>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '1 1 96px' }}>Khách hàng</span><span style={{ flex: '1 1 88px' }}>Điện thoại</span><span style={{ flex: '1 1 120px' }}>Biển quan tâm</span><span style={{ flex: '1 1 64px' }}>Thời gian</span><span style={{ flex: '1 1 180px' }}>Trạng thái</span>
        </div>
        {admContacts.map((c) => {
          const p = st.plates.find((x) => x.id === c.pid) || st.plates[0];
          return (
            <div key={c.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <span style={{ flex: '1 1 96px', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{c.name}</span>
              <span style={{ flex: '1 1 88px', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{c.phone}</span>
              <span style={{ flex: '1 1 120px' }}><PlateVisual size="sm" prov={p.prov} seri={p.seri} num={p.num} /></span>
              <span style={{ flex: '1 1 64px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{c.time}</span>
              <span style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                <Select value={c.status} options={opts(['Mới', 'Đang tư vấn', 'Đã chốt'])} onChange={(v) => { setSt((x) => ({ ...x, contacts: x.contacts.map((y) => (y.id === c.id ? { ...y, status: v } : y)) })); notify('Đã cập nhật trạng thái'); }} variant="pill" style={{ whiteSpace: 'nowrap', color: STATUS_FG[c.status] || 'var(--text-strong)' }} />
              </span>
            </div>
          );
        })}
        {admContacts.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có yêu cầu nào khớp tìm kiếm.</div>}
      </div>
    </div>
  );
}
