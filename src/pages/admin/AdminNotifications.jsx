import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Input, Select } from '../../components/index.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { canPerm } from '../../layout/AdminShell.jsx';
import {
  useAdminBroadcasts,
  useSendBroadcast,
  useNotificationRecipientCount,
} from '../../services/adminNotificationService.js';
import { useAdminCustomers } from '../../services/adminCustomers.js';
import { useSubscriberActiveCount } from '../../services/subscribers.js';
import { useAdminEmailTemplates } from '../../services/emailTemplates.js';
import {
  TARGETS, CHANNELS, CHANNEL_LABEL, stripHtml, plainTextToHtml
} from './notifications/notificationConstants.js';
import {
  EmailPreview, TemplatePreview, UserPicker
} from './notifications/NotificationPreviews.jsx';
import SubscriberSection from './notifications/SubscriberSection.jsx';
import TypeSettingsSection from './notifications/TypeSettingsSection.jsx';
import EmailLogsSection from './notifications/EmailLogsSection.jsx';

export default function AdminNotifications({ notify, st }) {
  const [sentPage, setSentPage] = useState(1);
  const { data, isLoading, isError, refetch } = useAdminBroadcasts({ page: sentPage, perPage: 20 });
  const sendBroadcast = useSendBroadcast();
  const allUsers = useAdminCustomers({ page: 1, perPage: 1 });
  const subCount = useSubscriberActiveCount();

  const [tab, setTab] = useState('send');
  const [title, setTitle] = useState('');
  const [plainBody, setPlainBody] = useState('');
  const body = plainTextToHtml(plainBody);
  const [target, setTarget] = useState('all');
  const [channel, setChannel] = useState('email');
  const subEstimate = useNotificationRecipientCount({ target });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);

  // UC27 — "Layout email" cho broadcast thủ công: chọn template drag-drop đã tạo
  const { data: templatesData } = useAdminEmailTemplates();
  const templates = templatesData?.items || templatesData || [];
  const broadcastTemplates = templates.filter((t) => (t.appliesTo || []).includes('broadcast'));
  const [templateId, setTemplateId] = useState('');

  // Ước lượng số người nhận theo đối tượng hiện tại
  let recipientEstimate = null;
  if (target === 'subscribers') recipientEstimate = subCount.data?.count;
  else if (target === 'specific') recipientEstimate = selectedUsers.length;
  else if (target === 'all') recipientEstimate = allUsers.data?.total;
  else if (target === 'subscribed') recipientEstimate = subEstimate.data?.count;

  const items = data?.items || [];
  const canSubscribers = !st || canPerm(st, 'subscribers:view');
  const TABS = [
    { key: 'send', label: 'Gửi thông báo', desc: 'Soạn & gửi tới user hoặc email đăng ký' },
    ...(canSubscribers ? [{ key: 'subscribers', label: 'Email đăng ký', desc: 'Danh sách nhận tin & lịch sử gửi' }] : []),
    { key: 'automation', label: 'Tự động hóa', desc: 'Kênh, nội dung & lịch cho email tự động' },
    { key: 'logs', label: 'Lịch sử & Logs email', desc: 'Nhật ký gửi email hệ thống & tự động hóa' },
  ];

  const send = async () => {
    if (!title.trim() || !stripHtml(body)) { setErr('Nhập đủ tiêu đề và nội dung.'); return; }
    if (target === 'specific' && selectedUsers.length === 0) { setErr('Chọn ít nhất một người dùng.'); return; }
    setErr('');
    setSending(true);
    try {
      const res = await sendBroadcast.mutateAsync({
        title: title.trim(), content: body, channel, target,
        userIds: target === 'specific' ? selectedUsers.map((u) => u.id) : undefined,
        templateId: target !== 'subscribers' && templateId ? templateId : undefined,
      });
      setTitle(''); setPlainBody(''); setSelectedUsers([]); setTemplateId('');
      notify(res.recipientCount > 0 ? `Đã gửi thông báo tới ${res.recipientCount} người dùng` : 'Đã tạo thông báo nhưng không có người nhận hợp lệ');
    } catch (e) {
      setErr(e.message || 'Lỗi khi gửi.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div>
        <h1 style={{ margin: 0, font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Thông báo &amp; Email</h1>
        <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Gửi thông báo thủ công, quản lý email đăng ký nhận tin và cấu hình email tự động.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            style={{
              padding: '10px 16px', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
              font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)',
              background: tab === t.key ? 'var(--action-dark)' : 'var(--white)',
              color: tab === t.key ? 'var(--white)' : 'var(--text-muted)',
              boxShadow: 'var(--shadow-inset-hairline)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 360px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Soạn thông báo mới</span>
            </div>
            <div style={{ padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Input label="Tiêu đề" placeholder="VD: Bảo trì hệ thống tối nay" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Nội dung</span>
                <textarea
                  rows={7} value={plainBody} onChange={(e) => setPlainBody(e.target.value)}
                  placeholder="Nhập nội dung thông báo…"
                  style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }}
                />
              </div>
              <Select label="Đối tượng" value={target} options={TARGETS} onChange={setTarget} />
              {target === 'specific' && <UserPicker selected={selectedUsers} onChange={setSelectedUsers} />}
              {target !== 'subscribers' && <Select label="Kênh gửi" value={channel} options={CHANNELS} onChange={setChannel} />}
              {target !== 'subscribers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <Select label="Layout email" value={templateId} onChange={setTemplateId}
                    options={[{ value: '', label: 'Mặc định hệ thống' }, ...broadcastTemplates.map((t) => ({ value: t.id, label: t.name }))]} />
                  {broadcastTemplates.length === 0 && (
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Chưa có template áp dụng cho "broadcast" — tạo ở tab "Mẫu email".</span>
                  )}
                </div>
              )}
              {target === 'subscribers' && (
                <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Gửi email tới danh sách đăng ký nhận tin (footer/banner). Không cần tài khoản.</p>
              )}
              {recipientEstimate != null && (
                <span style={{ font: 'var(--type-caption)', color: recipientEstimate === 0 ? 'var(--status-danger)' : 'var(--text-muted)' }}>
                  ~{recipientEstimate.toLocaleString('vi-VN')} người nhận
                </span>
              )}
              {target === 'specific' && selectedUsers.length === 0 && (
                <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Chọn ít nhất 1 người dùng để gửi.</span>
              )}
              {err && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err}</span>}
              <Button variant="primary" size="lg" fullWidth onClick={send} disabled={sending || recipientEstimate == null || recipientEstimate === 0}>{sending ? 'Đang gửi…' : 'Gửi thông báo'}</Button>
            </div>
          </div>

          <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)' }}>
          {(target === 'subscribers' || channel === 'email' || channel === 'email_zalo') && (
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
              <EmailPreview title={title} body={body} />
            </div>
          )}

          {target !== 'subscribers' && templateId && (
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
              <TemplatePreview templateId={templateId} />
            </div>
          )}

          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Đã gửi ({items.length})</span></div>
            {isLoading ? (
              <div style={{ padding: 'var(--gutter-card)' }}><SkeletonTable rows={4} cols={1} /></div>
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
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stripHtml(n.content)}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{n.recipientCount} người nhận · {n.sentEmailCount} email · {n.sentZaloCount} zalo</span>
                </div>
              ))
            )}
            {!isLoading && !isError && data?.total > 20 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)' }}>
                <button type="button" disabled={sentPage <= 1} onClick={() => setSentPage((p) => Math.max(1, p - 1))} style={{ border: 'none', background: 'none', font: 'var(--type-caption)', color: sentPage <= 1 ? 'var(--text-faint)' : 'var(--link)', cursor: sentPage <= 1 ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <ChevronLeft size={13} /> Trước
                </button>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Trang {sentPage} / {Math.max(1, Math.ceil(data.total / 20))}</span>
                <button type="button" disabled={sentPage >= Math.ceil(data.total / 20)} onClick={() => setSentPage((p) => p + 1)} style={{ border: 'none', background: 'none', font: 'var(--type-caption)', color: sentPage >= Math.ceil(data.total / 20) ? 'var(--text-faint)' : 'var(--link)', cursor: sentPage >= Math.ceil(data.total / 20) ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  Sau <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {tab === 'subscribers' && <SubscriberSection notify={notify} />}
      {tab === 'automation' && <TypeSettingsSection notify={notify} />}
      {tab === 'logs' && <EmailLogsSection notify={notify} />}
    </div>
  );
}
