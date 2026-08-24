import { useEffect, useRef, useState } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { useDebouncedValue } from '@mantine/hooks';
import Button from '../../components/Button.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { Input, Select } from '../../components/index.jsx';
import RichTextEditor from '../../components/RichTextEditor.jsx';
import { useAdminBroadcasts, useSendBroadcast, useNotificationTypeSettings, useUpdateNotificationTypeSetting, useSendTestEmail, usePreviewEmail, useNotificationRecipientCount } from '../../services/adminNotificationService.js';
import { useAdminCustomers } from '../../services/adminCustomers.js';
import { useAdminSubscribers, useSubscriberActiveCount, useRemoveSubscriber, useAdminBlasts } from '../../services/subscribers.js';
import { useAdminEmailTemplates, useUpdateEmailTemplate } from '../../services/emailTemplates.js';
import { formatDate } from '../../lib/date.js';

const TYPE_LABEL = {
  plate_match: 'Biển mới khớp tìm kiếm đã lưu', hot_alert: 'Biển yêu thích đang HOT', re_engage: 'Nhắc quay lại (không hoạt động)',
  price_drop: 'Biển yêu thích giảm giá', ai_pick: 'Gợi ý AI', digest: 'Email tổng hợp hàng ngày',
  plate_sold: 'Biển yêu thích đã bán',
  fengshui_match: 'Biển mới hợp mệnh', contact_status: 'Cập nhật yêu cầu liên hệ', new_review: 'Đánh giá mới trên biển đang theo dõi',
  search_stale: 'Tìm kiếm đã lưu chưa có kết quả', viewed_price_drop: 'Giảm giá biển đã xem', compare_price_drop: 'Giảm giá biển đang so sánh',
  profile_incomplete: 'Nhắc hoàn thiện hồ sơ', collaborator_commission: 'Hoa hồng CTV đã thanh toán (email)',
};

const TARGETS = [
  { value: 'all', label: 'Tất cả người dùng' },
  { value: 'subscribed', label: 'Đã đăng ký nhận thông báo' },
  { value: 'subscribers', label: 'Email đăng ký nhận tin (footer/banner)' },
  { value: 'specific', label: 'Chọn người dùng cụ thể' },
];
const CHANNELS = [
  { value: 'web', label: 'Chỉ chuông web' },
  { value: 'email', label: 'Chỉ email' },
  { value: 'email_zalo', label: 'Chuông web + Email' },
];
const CHANNEL_LABEL = { web: 'Chuông web', email: 'Email', zalo: 'Zalo', email_zalo: 'Chuông web + Email' };

// Content giờ có thể là HTML (soạn bằng rich text editor) — tóm tắt thuần text cho danh sách "Đã gửi".
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

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
          <div style={{ color: '#374151', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: body || '<p style="color:#9CA3AF">—</p>' }} />
        </div>
        <div style={{ padding: '12px 20px', background: '#fff7ed', color: '#9a3412', fontSize: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> 081 579 2699</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MessageCircle size={12} /> Zalo: biensovip</span>
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
  const allUsers = useAdminCustomers({ page: 1, perPage: 1 });
  const subCount = useSubscriberActiveCount();

  const [tab, setTab] = useState('send');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [channel, setChannel] = useState('email');
  const subEstimate = useNotificationRecipientCount({ target });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);

  // Ước lượng số người nhận theo đối tượng hiện tại — cập nhật mỗi khi target/channel/user thay đổi.
  let recipientEstimate = null;
  if (target === 'subscribers') recipientEstimate = subCount.data?.count;
  else if (target === 'specific') recipientEstimate = selectedUsers.length;
  else if (target === 'all') recipientEstimate = allUsers.data?.total;
  else if (target === 'subscribed') recipientEstimate = subEstimate.data?.count;

  const items = data?.items || [];
  const TABS = [
    { key: 'send', label: 'Gửi thông báo', desc: 'Soạn & gửi tới user hoặc email đăng ký' },
    { key: 'subscribers', label: 'Email đăng ký', desc: 'Danh sách nhận tin & lịch sử gửi' },
    { key: 'automation', label: 'Tự động hóa', desc: 'Kênh, nội dung & lịch cho email tự động' },
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
              <Input label="Tiêu đề" placeholder="VD: Bảo trì hệ thống tối nay" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Nội dung</span>
                <RichTextEditor value={body} onChange={setBody} minHeight={180} />
              </div>
              <Select label="Đối tượng" value={target} options={TARGETS} onChange={setTarget} />
              {target === 'specific' && <UserPicker selected={selectedUsers} onChange={setSelectedUsers} />}
              {target !== 'subscribers' && <Select label="Kênh gửi" value={channel} options={CHANNELS} onChange={setChannel} />}
              {target === 'subscribers' && (
                <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Gửi email tới danh sách đăng ký nhận tin (footer/banner). Không cần tài khoản.</p>
              )}
              {recipientEstimate != null && (
                <span style={{ font: 'var(--type-caption)', color: recipientEstimate === 0 ? 'var(--status-danger)' : 'var(--text-muted)' }}>
                  ~{recipientEstimate.toLocaleString('vi-VN')} người nhận
                </span>
              )}
              {err && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{err}</span>}
              <Button variant="primary" size="lg" fullWidth onClick={send} disabled={sending || recipientEstimate === 0}>{sending ? 'Đang gửi…' : 'Gửi thông báo'}</Button>
            </div>
          </div>

          <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)' }}>
          {(target === 'subscribers' || channel === 'email' || channel === 'email_zalo') && (
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
              <EmailPreview title={title} body={body} />
            </div>
          )}

          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
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
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stripHtml(n.content)}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{n.recipientCount} người nhận · {n.sentEmailCount} email · {n.sentZaloCount} zalo</span>
                </div>
              ))
            )}
          </div>
          </div>
        </div>
      )}

      {tab === 'subscribers' && <SubscriberSection notify={notify} />}
      {tab === 'automation' && <TypeSettingsSection notify={notify} />}
    </div>
  );
}

// Danh sách email đăng ký nhận tin (footer/banner) + lịch sử blast đã gửi tới subscriber.
function SubscriberSection({ notify }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const PER = 15;
  const { data, isLoading } = useAdminSubscribers({ q, page, perPage: PER });
  const count = useSubscriberActiveCount();
  const remove = useRemoveSubscriber();
  const blasts = useAdminBlasts({ page: 1, perPage: 10 });

  const items = data?.items || [];
  const total = data?.total || 0;
  const doRemove = async () => {
    if (!confirmTarget) return;
    try { await remove.mutateAsync(confirmTarget.id); notify('Đã hủy đăng ký'); }
    catch (e) { notify(e.message || 'Lỗi'); }
    finally { setConfirmTarget(null); }
  };

  return (
    <div style={{ flex: '1 1 100%', minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 420px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ flex: 1, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Email đăng ký nhận tin</span>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{count.data?.count ?? '–'} đang hoạt động</span>
          <Input label="" placeholder="Tìm email / tên" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        {isLoading ? (
          <div style={{ padding: '40px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '40px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có email nào đăng ký.</div>
        ) : (
          items.map((s) => (
            <div key={s.id} style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                  {s.source} · {formatDate(s.createdAt)}{s.unsubscribedAt ? ' · đã hủy' : ''}
                </div>
              </div>
              <button type="button" onClick={() => setConfirmTarget({ id: s.id, email: s.email })} disabled={remove.isPending}
                style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Hủy</button>
            </div>
          ))
        )}
        {total > PER && (
          <div style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Trước</button>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{page} / {Math.ceil(total / PER)}</span>
            <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page * PER >= total} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)' }}>Sau</button>
          </div>
        )}
      </div>

      <div style={{ flex: '1 1 360px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Đợt gửi tới subscriber</span>
        </div>
        {blasts.isLoading ? (
          <div style={{ padding: '40px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
        ) : (blasts.data?.items || []).length === 0 ? (
          <div style={{ padding: '40px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa gửi đợt nào tới subscriber.</div>
        ) : (
          (blasts.data?.items || []).map((b) => (
            <div key={b.id} style={{ padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>
              <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{b.title}</div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{b.sentCount}/{b.totalCount} đã gửi · {formatDate(b.createdAt)}</div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title="Hủy đăng ký"
        message={`Hủy đăng ký nhận tin của ${confirmTarget?.email}?`}
        confirmLabel="Hủy đăng ký"
        danger
        loading={remove.isPending}
        onConfirm={doRemove}
      />
    </div>
  );
}

function TypeSettingsSection({ notify }) {
  const { data, isLoading, isError, refetch } = useNotificationTypeSettings();
  const [editingType, setEditingType] = useState(null);
  // Title/content đang gõ dở (chưa lưu) của row đang edit — nằm ở section cha để panel preview bên
  // phải đọc được real-time mà không cần lift state phức tạp qua nhiều tầng props.
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  // Tỉ lệ cột trái (list) tính theo % — kéo divider để chỉnh, nhớ qua localStorage.
  const [leftPct, setLeftPct] = useState(() => {
    try { return Number(localStorage.getItem('adminNotifLeftPct')) || 55; } catch { return 55; }
  });
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const editingSetting = (data || []).find((t) => t.type === editingType) || null;

  const startEdit = (setting) => {
    setEditingType(setting.type);
    setDraftTitle(setting.titleTemplate || '');
    setDraftContent(setting.contentTemplate || '');
  };
  const closeEdit = () => setEditingType(null);

  const onDividerDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.min(75, Math.max(25, ((e.clientX - rect.left) / rect.width) * 100));
      setLeftPct(pct);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try { localStorage.setItem('adminNotifLeftPct', String(leftPct)); } catch { /* ignore */ }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftPct]);

  const showSplit = Boolean(editingType);

  return (
    <div ref={containerRef} style={{ flex: '1 1 100%', minWidth: 0, display: 'flex', alignItems: 'flex-start' }}>
      <div style={{ flex: showSplit ? `0 0 ${leftPct}%` : '1 1 100%', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Kênh &amp; nội dung thông báo tự động</span>
          <p style={{ margin: '4px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Bật/tắt chuông web, email, sửa câu chữ và khung giờ gửi cho từng loại — áp dụng toàn hệ thống.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            {(() => {
              const list = data || [];
              const webOn = list.filter((t) => t.webEnabled).length;
              const emailOn = list.filter((t) => t.emailEnabled).length;
              const sent = list.reduce((s, t) => s + (t.emailsSent || 0), 0);
              const chips = [
                ['Tổng loại', list.length],
                ['Chuông web bật', webOn],
                ['Email bật', emailOn],
                ['Email đã gửi', sent],
              ];
              return chips.map(([label, val]) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', minWidth: 96 }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{val.toLocaleString('vi-VN')}</span>
                </div>
              ));
            })()}
          </div>
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
              onEdit={() => startEdit(t)}
              onCloseEdit={closeEdit}
              draftTitle={draftTitle} setDraftTitle={setDraftTitle}
              draftContent={draftContent} setDraftContent={setDraftContent} />
          ))
        )}
      </div>

      {showSplit && (
        <>
          <div
            onMouseDown={onDividerDown}
            role="separator"
            aria-orientation="vertical"
            title="Kéo để đổi tỉ lệ"
            style={{ flex: '0 0 auto', width: 12, alignSelf: 'stretch', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ width: 4, height: 40, borderRadius: 'var(--radius-pill)', background: 'var(--border-hairline)' }} />
          </div>
          {editingSetting && (
            <div style={{ flex: `0 0 ${100 - leftPct}%`, minWidth: 280 }}>
              <LivePreviewPanel setting={editingSetting} title={draftTitle} content={draftContent} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Panel preview bên phải — gọi backend render HTML thật (EmailTemplate.Wrap, cùng code dùng khi gửi
// email thật) mỗi khi title/content đổi, debounce 400ms để không gọi API dồn dập theo từng ký tự gõ.
function LivePreviewPanel({ setting, title, content }) {
  const preview = usePreviewEmail();
  const [debouncedTitle] = useDebouncedValue(title, 400);
  const [debouncedContent] = useDebouncedValue(content, 400);
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;
    preview.mutateAsync({ type: setting.type, title: debouncedTitle || null, content: debouncedContent || null })
      .then((res) => { if (!cancelled) setHtml(res.html); })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setting.type, debouncedTitle, debouncedContent]);

  return (
    <div style={{ width: '100%', position: 'sticky', top: 'var(--space-4)', background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Xem trước email</span>
        <p style={{ margin: '4px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{TYPE_LABEL[setting.type] || setting.type} — cập nhật theo nội dung bạn đang gõ.</p>
      </div>
      <div style={{ padding: 'var(--gutter-card)', background: 'var(--surface-sunken)' }}>
        {html ? (
          <iframe title="Email preview" srcDoc={html} style={{ width: '100%', height: 640, border: 'none', borderRadius: 'var(--radius-md)', background: '#ffffff' }} />
        ) : (
          <div style={{ height: 640, display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải preview…</div>
        )}
      </div>
    </div>
  );
}

function TypeSettingRow({ setting, notify, editing, onEdit, onCloseEdit, draftTitle, setDraftTitle, draftContent, setDraftContent }) {
  const update = useUpdateNotificationTypeSetting();
  const sendTest = useSendTestEmail();
  const [triggerHour, setTriggerHour] = useState(setting.triggerHour ?? '');
  const [testEmail, setTestEmail] = useState('');

  // UC27 — dropdown "Layout email": liệt kê template áp dụng type này + tùy chọn "Mặc định hệ thống".
  const { data: templatesData } = useAdminEmailTemplates();
  const updateTemplate = useUpdateEmailTemplate();
  const templates = templatesData?.items || templatesData || [];
  const applicableTemplates = templates.filter((t) => (t.appliesTo || []).includes(setting.type));
  const activeTemplate = applicableTemplates.find((t) => t.isActive);
  const setEmailLayout = (templateId) => {
    if (!templateId) {
      const current = applicableTemplates.find((t) => t.isActive);
      if (current) updateTemplate.mutate({ id: current.id, isActive: false }, { onSuccess: () => notify('Đã đặt về layout mặc định hệ thống') });
      return;
    }
    updateTemplate.mutate({ id: templateId, isActive: true }, {
      onSuccess: () => notify('Đã áp dụng layout email'),
      onError: (err) => notify(err.message || 'Có lỗi xảy ra.'),
    });
  };

  const toggle = (field) => {
    update.mutate({ type: setting.type, webEnabled: setting.webEnabled, emailEnabled: setting.emailEnabled,
      titleTemplate: setting.titleTemplate, contentTemplate: setting.contentTemplate, triggerHour: setting.triggerHour,
      [field]: !setting[field] });
  };

  const saveEdit = async () => {
    try {
      await update.mutateAsync({
        type: setting.type, webEnabled: setting.webEnabled, emailEnabled: setting.emailEnabled,
        titleTemplate: draftTitle.trim() || null, contentTemplate: draftContent.trim() || null,
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
    <div
      role="button" tabIndex={0}
      onClick={editing ? onCloseEdit : onEdit}
      onKeyDown={(e) => { if (e.key === 'Enter') (editing ? onCloseEdit : onEdit)(); }}
      style={{ padding: 'var(--space-3) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', boxShadow: editing ? 'inset 3px 0 0 var(--action-primary), inset 0 -1px 0 var(--grey-100)' : 'inset 0 -1px 0 var(--grey-100)', background: editing ? 'var(--surface-tint-cream)' : 'transparent', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ flex: '1 1 220px', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{TYPE_LABEL[setting.type] || setting.type}</span>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{setting.emailsSent ?? 0} email</span>
        <label onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={setting.webEnabled} onChange={() => toggle('webEnabled')} disabled={update.isPending} /> Chuông web
        </label>
        <label onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={setting.emailEnabled} onChange={() => toggle('emailEnabled')} disabled={update.isPending} /> Email
        </label>
        <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>{editing ? 'Đang sửa ▸' : ''}</span>
      </div>
      {editing && (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 'var(--space-2) var(--space-3)', background: 'var(--white)', borderRadius: 'var(--radius-field)', boxShadow: 'var(--shadow-inset-hairline)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Mặc định hiện tại</span>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{setting.defaultTitle}</span>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{setting.defaultContent}</span>
          </div>
          <Input label="Tiêu đề tùy chỉnh (để trống = dùng mặc định ở trên)" placeholder={setting.defaultTitle} value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Nội dung tùy chỉnh (để trống = dùng mặc định ở trên)</span>
            <textarea rows={2} value={draftContent} placeholder={setting.defaultContent} onChange={(e) => setDraftContent(e.target.value)} style={{ background: 'var(--white)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '8px 12px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Biến có sẵn: {`{UserName}`} · {`{SiteName}`} — thay tự động theo từng người khi gửi.</span>
          </label>
          {setting.triggerHour !== null && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 160 }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Giờ gửi (UTC, 0-23)</span>
              <input type="number" min="0" max="23" value={triggerHour} onChange={(e) => setTriggerHour(e.target.value)}
                style={{ height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 10px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }} />
            </label>
          )}
          <div style={{ maxWidth: 280 }}>
            <Select label="Layout email (UC27)" value={activeTemplate?.id || ''} onChange={setEmailLayout}
              options={[{ value: '', label: 'Mặc định hệ thống' }, ...applicableTemplates.map((t) => ({ value: t.id, label: t.name }))]} />
            {applicableTemplates.length === 0 && (
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Chưa có template nào gắn cho loại này — tạo ở trang "Mẫu email".</span>
            )}
          </div>
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
