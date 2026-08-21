import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { Input, Select } from '../../components/index.jsx';
import { useAdminBroadcasts, useSendBroadcast, useNotificationTypeSettings, useUpdateNotificationTypeSetting, useSendTestEmail } from '../../services/adminNotificationService.js';
import { useAdminCustomers } from '../../services/adminCustomers.js';

const TYPE_LABEL = {
  plate_match: 'Biển mới khớp tìm kiếm đã lưu', hot_alert: 'Biển yêu thích đang HOT', re_engage: 'Nhắc quay lại (không hoạt động)',
  price_drop: 'Biển yêu thích giảm giá', ai_pick: 'Gợi ý AI', digest: 'Email tổng hợp hàng ngày',
  plate_sold: 'Biển yêu thích đã bán', auction_ending: 'Sắp hết hạn đấu giá (admin)', auction_expired: 'Đã hết hạn đấu giá (admin)',
  fengshui_match: 'Biển mới hợp mệnh', contact_status: 'Cập nhật yêu cầu liên hệ', new_review: 'Đánh giá mới trên biển đang theo dõi',
  search_stale: 'Tìm kiếm đã lưu chưa có kết quả', viewed_price_drop: 'Giảm giá biển đã xem', compare_price_drop: 'Giảm giá biển đang so sánh',
  profile_incomplete: 'Nhắc hoàn thiện hồ sơ', collaborator_commission: 'Hoa hồng CTV đã thanh toán (email)',
};

const TARGETS = [
  { value: 'all', label: 'Tất cả người dùng' },
  { value: 'subscribed', label: 'Đã đăng ký nhận thông báo' },
  { value: 'specific', label: 'Chọn người dùng cụ thể' },
];
const CHANNELS = [
  { value: 'web', label: 'Chỉ chuông web' },
  { value: 'email', label: 'Chỉ email' },
  { value: 'email_zalo', label: 'Chuông web + Email' },
];
const CHANNEL_LABEL = { web: 'Chuông web', email: 'Email', zalo: 'Zalo', email_zalo: 'Chuông web + Email' };

// Xem trước email gần đúng template EmailTemplate.Wrap (logo, thanh cam, tiêu đề, nội dung, liên hệ) — admin thấy email sẽ gửi ra sao trước khi gửi thật.
function EmailPreview({ title, body }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Xem trước email</span>
      <div style={{ maxWidth: 520, background: '#f6f7f9', borderRadius: 'var(--radius-md)', overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', background: '#ffffff', borderBottom: '3px solid #F97316' }}>
          <span style={{ width: 26, height: 26, borderRadius: 6, background: '#F97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>B</span>
          <span style={{ fontWeight: 700, color: '#111827' }}>Biensovip</span>
        </div>
        <div style={{ padding: '18px 20px', background: '#ffffff' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{title || '—'}</div>
          <div style={{ whiteSpace: 'pre-line', color: '#374151', lineHeight: 1.6 }}>{body || '—'}</div>
        </div>
        <div style={{ padding: '12px 20px', background: '#fff7ed', color: '#9a3412', fontSize: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span>📞 081 579 2699</span>
          <span>💬 Zalo: biensovip</span>
        </div>
        <div style={{ padding: '10px 20px', background: '#f1f2f4', color: '#6b7280', fontSize: 11, textAlign: 'center' }}>
          Biensovip.com — mua bán biển số xe đẹp
        </div>
      </div>
    </div>
  );
}

function UserPicker({ selected, onChange }) {
  const [q, setQ] = useState('');
  const { data, isLoading } = useAdminCustomers({ q, page: 1, perPage: 20 });
  const results = data?.items || [];

  const toggle = (u) => {
    const exists = selected.some((s) => s.id === u.id);
    onChange(exists ? selected.filter((s) => s.id !== u.id) : [...selected, { id: u.id, label: u.fullName || u.email || u.phone }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <Input label="Tìm người dùng (email, tên)" placeholder="Nhập để tìm…" value={q} onChange={(e) => setQ(e.target.value)} />
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selected.map((s) => (
            <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-pill)', padding: '4px 10px', font: 'var(--type-caption)', color: 'var(--text-strong)' }}>
              {s.label}
              <button type="button" onClick={() => onChange(selected.filter((x) => x.id !== s.id))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', font: 'var(--type-caption)' }}>×</button>
            </span>
          ))}
        </div>
      )}
      {q && (
        <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)' }}>
          {isLoading ? (
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang tìm…</span>
          ) : results.length === 0 ? (
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Không tìm thấy</span>
          ) : (
            results.map((u) => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                <input type="checkbox" checked={selected.some((s) => s.id === u.id)} onChange={() => toggle(u)} />
                {u.fullName || '(chưa có tên)'} — {u.email || u.phone}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminNotifications({ notify }) {
  const { data, isLoading, isError, refetch } = useAdminBroadcasts();
  const sendBroadcast = useSendBroadcast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [channel, setChannel] = useState('email');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);

  const items = data?.items || [];

  const send = async () => {
    if (!title.trim() || !body.trim()) { setErr('Nhập đủ tiêu đề và nội dung.'); return; }
    if (target === 'specific' && selectedUsers.length === 0) { setErr('Chọn ít nhất một người dùng.'); return; }
    setErr('');
    setSending(true);
    try {
      const res = await sendBroadcast.mutateAsync({
        title: title.trim(), content: body.trim(), channel, target,
        userIds: target === 'specific' ? selectedUsers.map((u) => u.id) : undefined,
      });
      setTitle(''); setBody(''); setSelectedUsers([]);
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
        {target === 'specific' && <UserPicker selected={selectedUsers} onChange={setSelectedUsers} />}
        <Select label="Kênh gửi" value={channel} options={CHANNELS} onChange={setChannel} />
        {(channel === 'email' || channel === 'email_zalo') && <EmailPreview title={title} body={body} />}
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

      <TypeSettingsSection notify={notify} />
    </div>
  );
}

function TypeSettingsSection({ notify }) {
  const { data, isLoading, isError, refetch } = useNotificationTypeSettings();
  const [editingType, setEditingType] = useState(null);

  return (
    <div style={{ flex: '1 1 100%', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
      <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Kênh &amp; nội dung thông báo tự động</span>
        <p style={{ margin: '4px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Bật/tắt chuông web, email, sửa câu chữ và khung giờ gửi cho từng loại — áp dụng toàn hệ thống.</p>
      </div>
      {isLoading ? (
        <div style={{ padding: '32px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
      ) : isError ? (
        <div style={{ padding: '32px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span>Lỗi tải dữ liệu</span>
          <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
        </div>
      ) : (
        (data || []).map((t) => (
          <TypeSettingRow key={t.type} setting={t} notify={notify}
            editing={editingType === t.type}
            onEdit={() => setEditingType(t.type)}
            onCloseEdit={() => setEditingType(null)} />
        ))
      )}
    </div>
  );
}

function TypeSettingRow({ setting, notify, editing, onEdit, onCloseEdit }) {
  const update = useUpdateNotificationTypeSetting();
  const sendTest = useSendTestEmail();
  const [title, setTitle] = useState(setting.titleTemplate || '');
  const [content, setContent] = useState(setting.contentTemplate || '');
  const [triggerHour, setTriggerHour] = useState(setting.triggerHour ?? '');
  const [testEmail, setTestEmail] = useState('');

  const toggle = (field) => {
    update.mutate({ type: setting.type, webEnabled: setting.webEnabled, emailEnabled: setting.emailEnabled,
      titleTemplate: setting.titleTemplate, contentTemplate: setting.contentTemplate, triggerHour: setting.triggerHour,
      [field]: !setting[field] });
  };

  const saveEdit = async () => {
    try {
      await update.mutateAsync({
        type: setting.type, webEnabled: setting.webEnabled, emailEnabled: setting.emailEnabled,
        titleTemplate: title.trim() || null, contentTemplate: content.trim() || null,
        triggerHour: setting.triggerHour !== null ? (triggerHour === '' ? null : Number(triggerHour)) : null,
      });
      notify('Đã lưu');
      onCloseEdit();
    } catch (e) { notify(e.message || 'Lỗi khi lưu'); }
  };

  const sendTestNow = async () => {
    if (!testEmail.trim()) { notify('Nhập email để gửi thử'); return; }
    try {
      await sendTest.mutateAsync({ type: setting.type, email: testEmail.trim() });
      notify(`Đã gửi email thử tới ${testEmail.trim()}`);
    } catch (e) { notify(e.message || 'Lỗi khi gửi thử'); }
  };

  return (
    <div style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ flex: '1 1 220px', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{TYPE_LABEL[setting.type] || setting.type}</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={setting.webEnabled} onChange={() => toggle('webEnabled')} disabled={update.isPending} /> Chuông web
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={setting.emailEnabled} onChange={() => toggle('emailEnabled')} disabled={update.isPending} /> Email
        </label>
        <Button variant="ghost" size="sm" onClick={editing ? onCloseEdit : onEdit}>{editing ? 'Đóng' : 'Sửa nội dung'}</Button>
      </div>
      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 'var(--space-2) var(--space-3)', background: 'var(--white)', borderRadius: 'var(--radius-field)', boxShadow: 'var(--shadow-inset-hairline)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Mặc định hiện tại</span>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{setting.defaultTitle}</span>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{setting.defaultContent}</span>
          </div>
          <Input label="Tiêu đề tùy chỉnh (để trống = dùng mặc định ở trên)" placeholder={setting.defaultTitle} value={title} onChange={(e) => setTitle(e.target.value)} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Nội dung tùy chỉnh (để trống = dùng mặc định ở trên)</span>
            <textarea rows={2} value={content} placeholder={setting.defaultContent} onChange={(e) => setContent(e.target.value)} style={{ background: 'var(--white)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '8px 12px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
          </label>
          {setting.triggerHour !== null && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 160 }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Giờ gửi (UTC, 0-23)</span>
              <input type="number" min="0" max="23" value={triggerHour} onChange={(e) => setTriggerHour(e.target.value)}
                style={{ height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 10px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }} />
            </label>
          )}
          <Button variant="dark" size="sm" style={{ alignSelf: 'flex-start' }} onClick={saveEdit} disabled={update.isPending}>{update.isPending ? 'Đang lưu…' : 'Lưu'}</Button>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', flexWrap: 'wrap', boxShadow: 'inset 0 1px 0 var(--border-hairline)', paddingTop: 'var(--space-2)' }}>
            <div style={{ flex: '1 1 220px' }}>
              <Input label="Gửi thử email mẫu tới" placeholder="ban@email.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
            </div>
            <Button variant="ghost" size="sm" onClick={sendTestNow} disabled={sendTest.isPending}>{sendTest.isPending ? 'Đang gửi…' : 'Gửi thử'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
