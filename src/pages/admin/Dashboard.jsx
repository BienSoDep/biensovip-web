import { Badge } from '../../components/index.jsx';
import PlateVisual from '../../components/PlateVisual.jsx';
import { TONES } from '../../common/constants.js';

export default function Dashboard({ st, go }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--gutter-section)' }}>
        {[
          { label: 'Tổng biển số', value: String(st.plates.length), delta: '+18 tuần này', color: 'var(--status-success)' },
          { label: 'Yêu cầu mới', value: String(st.contacts.filter((c) => c.status === 'Mới').length), delta: '+5 hôm nay', color: 'var(--status-success)' },
          { label: 'Tài khoản khách', value: '861', delta: '+24 tuần này', color: 'var(--status-success)' },
          { label: 'Biển đã bán', value: String(st.plates.filter((p) => p.status === 'Đã bán').length), delta: '−3 so với tuần trước', color: 'var(--status-danger)' },
        ].map((s2) => (
          <div key={s2.label} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{s2.label}</span>
            <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{s2.value}</span>
            <span style={{ font: 'var(--type-caption)', color: s2.color }}>{s2.delta}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 360px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Yêu cầu liên hệ gần đây</span>
            <a href="#" onClick={(e) => { e.preventDefault(); go('acontacts')(); }} style={{ font: 'var(--type-caption)' }}>Xem tất cả</a>
          </div>
          {st.contacts.slice(0, 5).map((c) => {
            const p = st.plates.find((x) => x.id === c.pid) || st.plates[0];
            return (
              <div key={c.id} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
                <div style={{ flex: '1 1 130px', display: 'flex', flexDirection: 'column' }}><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{c.name}</span><span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{c.phone} · {c.time}</span></div>
                <PlateVisual size="sm" prov={p.prov} seri={p.seri} num={p.num} />
                <Badge tone={TONES[c.status] || 'neutral'}>{c.status}</Badge>
              </div>
            );
          })}
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Biển số vừa thêm</span></div>
          {st.plates.slice(0, 5).map((p) => (
            <div key={p.id} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <PlateVisual size="sm" prov={p.prov} seri={p.seri} num={p.num} />
              <span style={{ flex: 1, font: 'var(--type-caption)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{p.price}</span>
              <Badge tone={TONES[p.status] || 'neutral'}>{p.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
