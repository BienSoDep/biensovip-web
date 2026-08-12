import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { Input, Select } from '../../components/index.jsx';
import { useAdminBroadcasts, useSendBroadcast } from '../../services/adminNotificationService.js';

const TARGETS = [
  { value: 'all', label: 'Tất cả người dùng' },
  { value: 'subscribed', label: 'Đã đăng ký nhận thông báo' },
];
const CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'zalo', label: 'Zalo' },
  { value: 'email_zalo', label: 'Email + Zalo' },
];
const CHANNEL_LABEL = Object.fromEntries(CHANNELS.map((c) => [c.value, c.label]));

export default function AdminNotifications({ notify }) {
  const { data, isLoading, isError, refetch } = useAdminBroadcasts();
  const sendBroadcast = useSendBroadcast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [channel, setChannel] = useState('email');
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);

  const items = data?.items || [];

  const send = async () => {
    if (!title.trim() || !body.trim()) { setErr('Nhập đủ tiêu đề và nội dung.'); return; }
    setErr('');
    setSending(true);
    try {
      const res = await sendBroadcast.mutateAsync({ title: title.trim(), content: body.trim(), channel, target });
      setTitle(''); setBody('');
      notify(res.recipientCount > 0 ? `Đã gửi thông báo tới ${res.recipientCount} người dùng` : 'Đã tạo thông báo nhưng không có người nhận hợp lệ');
    } catch (e) {
      setErr(e.message || 'Lỗi khi gửi.');
    } finally {
      setSending(false);
    }
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
        <Select label="Kênh gửi" value={channel} options={CHANNELS} onChange={setChannel} />
        {err && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err}</span>}
        <Button variant="dark" size="md" style={{ alignSelf: 'flex-start' }} onClick={send} disabled={sending}>{sending ? 'Đang gửi…' : 'Gửi thông báo'}</Button>
      </div>

      <div style={{ flex: '1 1 360px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Đã gửi ({items.length})</span></div>
        {isLoading ? (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
        ) : isError ? (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span>Lỗi tải dữ liệu</span>
            <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '48px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có thông báo nào được gửi.</div>
        ) : (
          items.map((n) => (
            <div key={n.id} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ flex: 1, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{n.title}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{CHANNEL_LABEL[n.channel] || n.channel}</span>
              </div>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{n.content}</span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{n.recipientCount} người nhận · {n.sentEmailCount} email · {n.sentZaloCount} zalo</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
