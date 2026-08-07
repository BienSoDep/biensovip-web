import { useState } from 'react';
import { opts } from '../../lib/mockData.js';
import { TONES } from '../../common/constants.js';
import { SearchField, Select, Badge, IconButton, Switch } from '../../components/index.jsx';

const CUST_STATUS = ['Tất cả', 'Mới', 'Đang tư vấn', 'Đã chốt'];

// ponytail: placeholder — đang dùng st.contacts làm khách hàng. Khi có st.users trong mockData.js thì
// đổi nguồn ở đây (list) và trường khóa (locked) cho phù hợp, không cần đụng layout.
export default function AdminCustomers({ st, setSt, notify }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('Tất cả');
  const [sel, setSel] = useState(null);

  const query = q.trim().toLowerCase();
  const list = st.contacts.filter((c) =>
    (status === 'Tất cả' || c.status === status) &&
    (!query || (c.name + ' ' + c.phone).toLowerCase().indexOf(query) >= 0)
  );

  const toggleLock = (c) => {
    setSt((x) => ({ ...x, contacts: x.contacts.map((y) => (y.id === c.id ? { ...y, locked: !y.locked } : y)) }));
    notify(c.locked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
  };

  const plate = sel ? st.plates.find((p) => p.id === sel.pid) || st.plates[0] : null;
  const detail = sel ? [
    ['Số điện thoại', sel.phone],
    ['Trạng thái', sel.status],
    ['Biển quan tâm', plate ? `${plate.prov}${plate.seri} ${plate.num}` : '—'],
    ['Thời gian', sel.time],
    ['Tài khoản', sel.locked ? 'Đã khóa' : 'Hoạt động'],
    ...(sel.note ? [['Ghi chú', sel.note]] : []),
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <SearchField placeholder="Tìm theo tên hoặc số điện thoại…" value={q} onChange={(e) => setQ(e.target.value)} width={260} />
        <Select label="Trạng thái" value={status} options={opts(CUST_STATUS)} onChange={setStatus} />
      </div>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          <span style={{ flex: '1 1 140px' }}>Khách hàng</span>
          <span style={{ flex: '1 1 120px' }}>Điện thoại</span>
          <span style={{ flex: '1 1 100px' }}>Trạng thái</span>
          <span style={{ flex: '0 0 88px' }}>Khóa</span>
        </div>
        {list.map((c) => (
          <div key={c.id} onClick={() => setSel(c)} title="Xem chi tiết" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', cursor: 'pointer' }}>
            <span style={{ flex: '1 1 140px', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{c.name}</span>
            <span style={{ flex: '1 1 120px', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{c.phone}</span>
            <span style={{ flex: '1 1 100px' }}><Badge tone={TONES[c.status] || 'neutral'}>{c.status}</Badge></span>
            <span style={{ flex: '0 0 88px', display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
              <Switch checked={!!c.locked} onChange={() => toggleLock(c)} />
            </span>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có khách hàng nào khớp tìm kiếm.</div>}
      </div>

      {sel && (
        <div onClick={() => setSel(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--overlay-scrim)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 18px', overflow: 'auto', animation: 'fadeIn 140ms var(--ease-out)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: 'var(--white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-4)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', animation: 'modalIn 180ms var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div style={{ flex: 1 }}><h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }}>{sel.name}</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Khách hàng quan tâm · {sel.time}</p></div>
              <IconButton name="x" label="Đóng" onClick={() => setSel(null)} />
            </div>
            {detail.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 'var(--space-3)', font: 'var(--type-body-sm)' }}>
                <span style={{ color: 'var(--text-muted)', minWidth: 108 }}>{k}</span>
                <span style={{ color: 'var(--text-strong)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
