import { opts } from '../../lib/mockData.js';
import { Badge, Select } from '../../components/index.jsx';

const TONES = { Active: 'mint', Pending: 'amber', Inactive: 'neutral' };
const STATUSES = ['Active', 'Pending', 'Inactive'];
const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

export default function AdminCollaborators({ st, patch, setSt, notify }) {
  const collabs = st.collabs || [];
  const f = st.admCtv || 'Tất cả';
  const list = collabs.filter((c) => f === 'Tất cả' || c.status === f);
  const totalEarned = collabs.reduce((a, c) => a + (Number(c.earned) || 0), 0);
  const pendingPayout = collabs.reduce((a, c) => a + (Number(c.pending) || 0), 0);

  const setStatus = (id, v) => {
    setSt((s) => ({ ...s, collabs: (s.collabs || []).map((c) => (c.id === id ? { ...c, status: v } : c)) }));
    notify('Đã cập nhật trạng thái CTV');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Commission report */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--gutter-section)' }}>
        {[
          ['Tổng hoa hồng', money(totalEarned), 'var(--status-success)'],
          ['Chờ thanh toán', money(pendingPayout), 'var(--status-warning)'],
          ['Tổng CTV', String(collabs.length), 'var(--text-strong)'],
          ['Đang hoạt động', String(collabs.filter((c) => c.status === 'Active').length), 'var(--text-strong)'],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <Select label="Trạng thái" value={f} options={opts(['Tất cả', ...STATUSES])} onChange={(v) => patch({ admCtv: v })} />
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '1 1 120px' }}>Tên</span><span style={{ flex: '1 1 110px' }}>Điện thoại</span><span style={{ flex: '1 1 120px' }}>Mã giới thiệu</span><span style={{ flex: '1 1 96px' }}>Hoa hồng</span><span style={{ flex: '1 1 120px' }}>Trạng thái</span>
        </div>
        {list.map((c) => (
          <div key={c.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
            <span style={{ flex: '1 1 120px', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{c.name}</span>
            <span style={{ flex: '1 1 110px', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{c.phone}</span>
            <span style={{ flex: '1 1 120px', font: 'var(--type-caption)', color: 'var(--text-body)' }}>{c.code}</span>
            <span style={{ flex: '1 1 96px', font: 'var(--type-caption)', color: 'var(--text-strong)' }}>{money(c.earned)}</span>
            <span style={{ flex: '1 1 120px' }}>
              <Select value={c.status} options={opts(STATUSES)} onChange={(v) => setStatus(c.id, v)} variant="pill" style={{ whiteSpace: 'nowrap', color: 'var(--text-strong)' }} />
            </span>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có CTV nào khớp bộ lọc.</div>}
      </div>
    </div>
  );
}
