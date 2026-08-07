import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { Input, Select } from '../../components/index.jsx';

const TARGETS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'customers', label: 'Khách hàng' },
  { value: 'staff', label: 'Nhân viên' },
];
const TARGET_LABEL = Object.fromEntries(TARGETS.map((t) => [t.value, t.label]));

export default function AdminNotifications({ st, patch, notify }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [err, setErr] = useState('');

  const sent = st.notifications || [];

  const send = () => {
    if (!title.trim() || !body.trim()) { setErr('Nhập đủ tiêu đề và nội dung.'); return; }
    patch((s) => ({ notifications: [{ id: Date.now(), title: title.trim(), body: body.trim(), target, read: false }, ...(s.notifications || [])] }));
    setTitle(''); setBody(''); setTarget('all'); setErr('');
    notify('Đã gửi thông báo');
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ flex: '1 1 360px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input label="Tiêu đề" placeholder="VD: Bảo trì hệ thống tối nay" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Nội dung</span>
          <textarea rows={6} placeholder="Nội dung thông báo" value={body} onChange={(e) => setBody(e.target.value)} style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
        </label>
        <Select label="Đối tượng" value={target} options={TARGETS} onChange={setTarget} />
        {err && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err}</span>}
        <Button variant="dark" size="md" style={{ alignSelf: 'flex-start' }} onClick={send}>Gửi thông báo</Button>
      </div>

      <div style={{ flex: '1 1 360px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Đã gửi ({sent.length})</span></div>
        {sent.length === 0 ? (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có thông báo nào được gửi.</div>
        ) : (
          sent.map((n) => (
            <div key={n.id} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ flex: 1, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{n.title}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{TARGET_LABEL[n.target]}</span>
              </div>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{n.body}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
