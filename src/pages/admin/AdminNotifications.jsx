import { useEffect, useRef, useState } from 'react';
import {
  Phone, MessageCircle, RefreshCw, CheckCircle2, AlertCircle, Send, XCircle, Info, Zap,
  ChevronLeft, ChevronRight, Eye, X, Moon, Clock, ShieldCheck, Sparkles, Search, Copy,
  Check, Users, Mail, Bell, Play, Filter,
} from 'lucide-react';
import { useDebouncedValue } from '@mantine/hooks';
import Button from '../../components/Button.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { Input, Select } from '../../components/index.jsx';
import {
  useAdminBroadcasts,
  useSendBroadcast,
  useNotificationTypeSettings,
  useUpdateNotificationTypeSetting,
  useSendTestEmail,
  usePreviewEmail,
  useNotificationRecipientCount,
  useFengShuiQueueStats,
  useAdminEmailLogs,
  useRunNotificationTrigger,
  useRunAllNotificationTriggers,
  useNotificationGuardrails,
} from '../../services/adminNotificationService.js';
import { useAdminCustomers } from '../../services/adminCustomers.js';
import { useAdminSubscribers, useSubscriberActiveCount, useRemoveSubscriber, useAdminBlasts } from '../../services/subscribers.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { canPerm } from '../../layout/AdminShell.jsx';
import { useAdminEmailTemplates, useUpdateEmailTemplate, usePreviewEmailTemplate } from '../../services/emailTemplates.js';
import { formatDate, formatDateTime } from '../../lib/date.js';
import { sanitizeHtml } from '../../lib/sanitizeHtml.js';

const TYPE_LABEL = {
  plate_match: 'Biển mới khớp tìm kiếm đã lưu', hot_alert: 'Biển yêu thích đang HOT', re_engage: 'Nhắc quay lại (không hoạt động)',
  price_drop: 'Biển yêu thích giảm giá', ai_pick: 'Gợi ý AI', digest: 'Email tổng hợp hàng ngày',
  plate_sold: 'Biển yêu thích đã bán',
  fengshui_match: 'Biển mới hợp mệnh', contact_status: 'Cập nhật yêu cầu liên hệ', new_review: 'Đánh giá mới trên biển đang theo dõi',
  search_stale: 'Tìm kiếm đã lưu chưa có kết quả', viewed_price_drop: 'Giảm giá biển đã xem', compare_price_drop: 'Giảm giá biển đang so sánh',
  profile_incomplete: 'Nhắc hoàn thiện hồ sơ', collaborator_commission: 'Hoa hồng CTV đã thanh toán (email)',
  guest_contact_received: 'Xác nhận tiếp nhận yêu cầu (Khách để lại thông tin)',
  guest_contact_status: 'Cập nhật tiến độ tư vấn (Khách để lại thông tin)',
  subscriber_welcome: 'Chào mừng đăng ký nhận tin (Newsletter)',
  guest_account_invite: 'Mời khách để lại thông tin tạo tài khoản VIP',
  lead_plate_reminder: 'Nhắc nhở biển số đẹp khách từng quan tâm',
};

// Mô tả điều kiện kích hoạt thật — lấy trực tiếp từ logic job/service backend, không phải suy đoán.
const TYPE_DESC = {
  plate_match: 'Gửi khi có biển mới đăng (15 phút gần nhất) khớp bộ lọc tìm kiếm đã lưu của người dùng.',
  hot_alert: 'Gửi khi biển đã yêu thích vừa được đánh dấu HOT trong 1 giờ gần nhất.',
  re_engage: 'Gửi cho user không hoạt động quá lâu, hoặc tài khoản mới 2-5 ngày chưa lưu biển nào.',
  price_drop: 'Gửi khi biển đã yêu thích giảm giá vượt ngưỡng cấu hình so với lúc lưu.',
  ai_pick: 'Gửi gợi ý biển cùng tỉnh/loại xe với biển đã lưu, xếp theo lượt xem — tối đa 3 gợi ý/ngày.',
  digest: 'Gửi email gộp mọi thông báo web trong 24h qua, vào đúng giờ mỗi user tự chọn trong hồ sơ cá nhân — không phải giờ admin đặt ở đây.',
  plate_sold: 'Gửi ngay khi biển đã yêu thích chuyển sang trạng thái Đã bán.',
  fengshui_match: 'Gửi khi có biển mới đăng có số cuối hợp mệnh theo năm sinh của người dùng.',
  contact_status: 'Gửi ngay khi admin đổi trạng thái yêu cầu liên hệ của người dùng.',
  new_review: 'Gửi ngay khi 1 đánh giá về biển được admin duyệt lần đầu — báo cho ai đã yêu thích biển đó.',
  search_stale: 'Gửi khi 1 tìm kiếm đã lưu quá 30 ngày không có kết quả mới — nhắc user nới bộ lọc.',
  viewed_price_drop: 'Gửi khi biển đã xem (không cần yêu thích) giảm giá vượt ngưỡng so với lúc xem.',
  compare_price_drop: 'Gửi khi biển trong danh sách so sánh giảm giá vượt ngưỡng so với lúc mở so sánh.',
  profile_incomplete: 'Gửi cho user đăng ký ≥2 ngày còn thiếu họ tên/ngày sinh/giới tính, đúng giờ admin đặt bên dưới.',
  collaborator_commission: 'Gửi tới email CTV khi hoa hồng của họ chuyển sang trạng thái Đã thanh toán.',
  guest_contact_received: 'Tự động gửi email xác nhận ngay khi khách để lại thông tin liên hệ / đặt cọc / mua biển trên website.',
  guest_contact_status: 'Tự động gửi email thông báo khi chuyên viên/admin cập nhật trạng thái yêu cầu tư vấn của khách vãng lai.',
  subscriber_welcome: 'Tự động gửi email chào mừng và gửi mã ưu đãi ngay khi người dùng đăng ký nhận tin ở chân trang / popup.',
  guest_account_invite: 'Tự động gửi email mời khách hàng đã để lại thông tin tạo tài khoản thành viên để nhận ưu đãi và lưu biển.',
  lead_plate_reminder: 'Tự động nhắc nhở khách về biển số đẹp họ từng quan tâm nhưng chưa chốt giao dịch.',
};

// Nhóm các loại thông báo dành riêng cho khách chưa đăng ký / người để lại thông tin
const GUEST_TYPES = new Set([
  'guest_contact_received',
  'guest_contact_status',
  'subscriber_welcome',
  'guest_account_invite',
  'lead_plate_reminder',
]);

// Thông tin chi tiết: Cơ chế kích hoạt, đối tượng nhận, kênh hỗ trợ & danh sách biến khả dụng
const TYPE_META = {
  plate_match: {
    mechanism: 'Định kỳ (Mỗi 15 phút)',
    isRealtime: false,
    audience: 'Thành viên lưu bộ lọc tìm kiếm',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số xe khớp' },
      { key: '{Province}', desc: 'Tỉnh/Thành phố' },
    ],
  },
  hot_alert: {
    mechanism: 'Định kỳ (Mỗi 1 giờ)',
    isRealtime: false,
    audience: 'Người dùng thích biển đang HOT',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số HOT' },
    ],
  },
  re_engage: {
    mechanism: 'Hàng ngày (08:00 VN)',
    isRealtime: false,
    audience: 'Thành viên im lặng > 14 ngày',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  price_drop: {
    mechanism: 'Thời gian thực (Khi giảm giá ≥ 5%)',
    isRealtime: true,
    audience: 'Người dùng đã bấm yêu thích biển',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số xe' },
      { key: '{OldPrice}', desc: 'Giá trước khi giảm' },
      { key: '{NewPrice}', desc: 'Giá ưu đãi mới' },
    ],
  },
  ai_pick: {
    mechanism: 'Hàng ngày (10:00 VN)',
    isRealtime: false,
    audience: 'Thành viên có lịch sử tìm kiếm & xem biển',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  digest: {
    mechanism: 'Theo giờ thành viên tự cấu hình',
    isRealtime: false,
    audience: 'Thành viên bật email tổng hợp 24h',
    channels: ['Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  plate_sold: {
    mechanism: 'Thời gian thực (Ngay khi đổi sang Đã bán)',
    isRealtime: true,
    audience: 'Người dùng đang theo dõi biển số này',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số đã bán' },
    ],
  },
  fengshui_match: {
    mechanism: 'Hàng đợi thông minh (Dàn đều theo ngày)',
    isRealtime: false,
    audience: 'Thành viên đã cập nhật năm sinh hợp mệnh',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển hợp mệnh' },
    ],
  },
  contact_status: {
    mechanism: 'Thời gian thực (Khi admin đổi trạng thái)',
    isRealtime: true,
    audience: 'Thành viên có gửi yêu cầu tư vấn',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số quan tâm' },
      { key: '{StatusLabel}', desc: 'Trạng thái xử lý' },
    ],
  },
  new_review: {
    mechanism: 'Thời gian thực (Khi duyệt đánh giá mới)',
    isRealtime: true,
    audience: 'Người dùng theo dõi biển được đánh giá',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số xe' },
    ],
  },
  search_stale: {
    mechanism: 'Hàng tuần (1 lần / tuần)',
    isRealtime: false,
    audience: 'Người dùng có bộ lọc > 30 ngày chưa có kết quả',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  viewed_price_drop: {
    mechanism: 'Thời gian thực (Khi giảm giá)',
    isRealtime: true,
    audience: 'Người dùng đã xem chi tiết biển trong 7 ngày',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số xe' },
      { key: '{OldPrice}', desc: 'Giá cũ' },
      { key: '{NewPrice}', desc: 'Giá mới' },
    ],
  },
  compare_price_drop: {
    mechanism: 'Thời gian thực (Khi giảm giá)',
    isRealtime: true,
    audience: 'Người dùng đang so sánh biển số này',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số xe' },
      { key: '{OldPrice}', desc: 'Giá cũ' },
      { key: '{NewPrice}', desc: 'Giá mới' },
    ],
  },
  profile_incomplete: {
    mechanism: 'Định kỳ theo giờ cấu hình',
    isRealtime: false,
    audience: 'Thành viên đăng ký ≥ 2 ngày chưa đủ hồ sơ',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  collaborator_commission: {
    mechanism: 'Thời gian thực (Khi duyệt chi hoa hồng)',
    isRealtime: true,
    audience: 'Cộng tác viên (Gửi trực tiếp email CTV)',
    channels: ['Email'],
    vars: [
      { key: '{CtvName}', desc: 'Tên CTV' },
      { key: '{CustomerName}', desc: 'Tên khách mua' },
      { key: '{PlateNumber}', desc: 'Biển số chốt' },
      { key: '{CommissionAmount}', desc: 'Số tiền hoa hồng' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  guest_contact_received: {
    mechanism: 'Thời gian thực (Ngay khi gửi form liên hệ)',
    isRealtime: true,
    audience: 'Khách để lại thông tin / mua biển',
    channels: ['Email'],
    vars: [
      { key: '{CustomerName}', desc: 'Tên khách hàng' },
      { key: '{PlateNumber}', desc: 'Biển số quan tâm' },
      { key: '{Phone}', desc: 'Số điện thoại' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  guest_contact_status: {
    mechanism: 'Thời gian thực (Khi đổi trạng thái tư vấn)',
    isRealtime: true,
    audience: 'Khách hàng vãng lai đã để lại thông tin',
    channels: ['Email'],
    vars: [
      { key: '{CustomerName}', desc: 'Tên khách hàng' },
      { key: '{PlateNumber}', desc: 'Biển số quan tâm' },
      { key: '{Phone}', desc: 'Số điện thoại' },
      { key: '{StatusLabel}', desc: 'Trạng thái tư vấn' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  subscriber_welcome: {
    mechanism: 'Thời gian thực (Ngay khi đăng ký ở chân trang)',
    isRealtime: true,
    audience: 'Người dùng đăng ký nhận tin mới',
    channels: ['Email'],
    vars: [
      { key: '{CustomerName}', desc: 'Tên khách / Email' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  guest_account_invite: {
    mechanism: 'Định kỳ (Sau 1 - 3 ngày từ khi liên hệ)',
    isRealtime: false,
    audience: 'Khách tiềm năng chưa có tài khoản VIP',
    channels: ['Email'],
    vars: [
      { key: '{CustomerName}', desc: 'Tên khách hàng' },
      { key: '{Phone}', desc: 'Số điện thoại' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  lead_plate_reminder: {
    mechanism: 'Định kỳ (Sau 24h - 48h quan tâm)',
    isRealtime: false,
    audience: 'Khách quan tâm biển chưa chốt đơn',
    channels: ['Email'],
    vars: [
      { key: '{CustomerName}', desc: 'Tên khách hàng' },
      { key: '{PlateNumber}', desc: 'Biển số quan tâm' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
};

// Job backend THẬT SỰ đọc field TriggerHour để quyết định giờ gửi — chỉ loại này sửa "Giờ gửi" mới có
// tác dụng. digest dùng giờ user tự chọn (không phải TriggerHour); search_stale có seed TriggerHour
// nhưng job bỏ qua field này (chạy cố định 1 lần/ngày) — sửa giờ 2 loại này KHÔNG có tác dụng thật.
const HOUR_HAS_EFFECT = new Set(['profile_incomplete']);

const TARGETS = [
  { value: 'all', label: 'Tất cả người dùng' },
  { value: 'subscribed', label: 'Đã đăng ký nhận thông báo' },
  { value: 'subscribers', label: 'Email đăng ký nhận tin (footer/banner)' },
  { value: 'specific', label: 'Chọn người dùng cụ thể' },
];
const CHANNELS = [
  { value: 'web', label: 'Chỉ chuông web' },
  { value: 'email', label: 'Chỉ email' },
  { value: 'zalo', label: 'Chỉ Zalo' },
  { value: 'email_zalo', label: 'Chuông web + Email' },
];
const CHANNEL_LABEL = { web: 'Chuông web', email: 'Email', zalo: 'Zalo', email_zalo: 'Chuông web + Email' };

// Content giờ có thể là HTML (soạn bằng rich text editor) — tóm tắt thuần text cho danh sách "Đã gửi".
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Textarea nhập plain text (RichTextEditor/Tiptap crash trên trang này — xem RichTextEditor.jsx) —
// escape rồi wrap từng dòng trống-cách-nhau thành <p>, giữ tương thích với content HTML backend đã dùng.
function plainTextToHtml(text) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br/>')}</p>`).join('');
}

// Xem trước email gần đúng template EmailTemplate.Wrap (logo, thanh cam, tiêu đề, nội dung, liên hệ) — admin thấy email sẽ gửi ra sao trước khi gửi thật.
function EmailPreview({ title, body }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Xem trước email</span>
      <div style={{ maxWidth: 520, background: '#f6f7f9', borderRadius: 'var(--radius-md)', overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', background: '#ffffff', borderBottom: '3px solid #F97316' }}>
          <span style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', background: '#F97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>B</span>
          <span style={{ fontWeight: 700, color: '#111827' }}>Biensovip</span>
        </div>
        <div style={{ padding: '18px 20px', background: '#ffffff' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{title || '—'}</div>
          <div style={{ color: '#374151', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: body ? sanitizeHtml(body) : '<p style="color:#9CA3AF">—</p>' }} />
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

// Xem trước render thật của template drag-drop đã chọn (POST /admin/email-templates/{id}/preview) —
// khác EmailPreview ở trên: đây là đúng HTML sẽ gửi, không phải mock Wrap tĩnh.
function TemplatePreview({ templateId }) {
  const preview = usePreviewEmailTemplate();
  const [html, setHtml] = useState('');
  useEffect(() => {
    if (!templateId) { setHtml(''); return; }
    let cancelled = false;
    preview.mutateAsync({ id: templateId }).then((r) => { if (!cancelled) setHtml(r.html); }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);
  if (!templateId) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Xem trước layout template</span>
      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)' }}>
        {html ? (
          <iframe title="Template preview" srcDoc={html} style={{ width: '100%', height: 480, border: 'none', borderRadius: 'var(--radius-md)', background: '#ffffff' }} />
        ) : (
          <div style={{ height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải preview…</div>
        )}
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

  // UC27 — "Layout email" cho broadcast thủ công: chọn template drag-drop đã tạo (áp dụng type "broadcast")
  // để gửi kèm thay vì dùng EmailTemplate.Wrap mặc định. Rỗng = mặc định hệ thống.
  const { data: templatesData } = useAdminEmailTemplates();
  const templates = templatesData?.items || templatesData || [];
  const broadcastTemplates = templates.filter((t) => (t.appliesTo || []).includes('broadcast'));
  const [templateId, setTemplateId] = useState('');

  // Ước lượng số người nhận theo đối tượng hiện tại — cập nhật mỗi khi target/channel/user thay đổi.
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
                <button type="button" disabled={sentPage <= 1} onClick={() => setSentPage((p) => Math.max(1, p - 1))} style={{ border: 'none', background: 'none', font: 'var(--type-caption)', color: sentPage <= 1 ? 'var(--text-faint)' : 'var(--link)', cursor: sentPage <= 1 ? 'default' : 'pointer' }}>‹ Trước</button>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Trang {sentPage} / {Math.max(1, Math.ceil(data.total / 20))}</span>
                <button type="button" disabled={sentPage >= Math.ceil(data.total / 20)} onClick={() => setSentPage((p) => p + 1)} style={{ border: 'none', background: 'none', font: 'var(--type-caption)', color: sentPage >= Math.ceil(data.total / 20) ? 'var(--text-faint)' : 'var(--link)', cursor: sentPage >= Math.ceil(data.total / 20) ? 'default' : 'pointer' }}>Sau ›</button>
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

// Danh sách email đăng ký nhận tin (footer/banner) + lịch sử blast đã gửi tới subscriber.
function SubscriberSection({ notify }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const PER = 15;
  const { data, isLoading, isError, refetch } = useAdminSubscribers({ q, page, perPage: PER });
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
        ) : isError ? (
          <div style={{ padding: '40px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>
            Lỗi tải danh sách email.{' '}
            <button type="button" onClick={() => refetch()} style={{ color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Thử lại</button>
          </div>
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

// Thẻ hiển thị quy tắc hệ thống & chống spam (Guardrails) từ Engagement Engine
function SystemGuardrailsCard() {
  const { data: res, isLoading } = useNotificationGuardrails();
  const rails = res?.data || res || {
    quietStartHour: 22,
    quietEndHour: 1,
    maxPerDay: 12,
    reEngageAfterDays: 14,
    priceDropThresholdPct: 5,
    aiSuggestEnabled: false,
  };

  const startVn = ((rails.quietStartHour ?? 22) + 7) % 24;
  const endVn = ((rails.quietEndHour ?? 1) + 7) % 24;
  const quietStr = `${String(startVn).padStart(2, '0')}:00 - ${String(endVn).padStart(2, '0')}:00`;

  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-4) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-tint-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--action-primary)' }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Quy tắc hệ thống &amp; Chống spam (Guardrails Engine)
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(34, 197, 94, 0.1)', color: '#15803d', fontWeight: 'var(--fw-semibold)' }}>
                Đang bảo vệ
              </span>
            </div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Cấu hình kỹ thuật cốt lõi giúp tối ưu hóa tỷ lệ chuyển đổi, ngăn chặn tràn hộp thư và bảo vệ danh tiếng gửi mail.</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-2)' }}>
        <div style={{ padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            <Moon size={14} style={{ color: '#8b5cf6' }} />
            <span>Khung giờ im lặng (Quiet Hours)</span>
          </div>
          <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{quietStr} (Giờ VN)</div>
          <div style={{ font: 'var(--type-caption)', fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.4 }}>
            Tự động hoãn email/chuông đêm ({rails.quietStartHour}h - {rails.quietEndHour}h UTC). Admin quét thủ công vẫn gửi ngay.
          </div>
        </div>

        <div style={{ padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            <Bell size={14} style={{ color: '#f59e0b' }} />
            <span>Giới hạn tần suất (Daily Cap)</span>
          </div>
          <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Tối đa {rails.maxPerDay} tin / user / ngày</div>
          <div style={{ font: 'var(--type-caption)', fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.4 }}>
            Giới hạn tối đa số thông báo mỗi thành viên nhận trong ngày để chống spam khi có nhiều biến động.
          </div>
        </div>

        <div style={{ padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            <Zap size={14} style={{ color: '#ef4444' }} />
            <span>Ngưỡng kích hoạt giảm giá</span>
          </div>
          <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Giảm ≥ {rails.priceDropThresholdPct}% giá</div>
          <div style={{ font: 'var(--type-caption)', fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.4 }}>
            Chỉ kích hoạt thông báo khi giá biển yêu thích hoặc đã xem giảm sâu vượt mức tối thiểu này.
          </div>
        </div>

        <div style={{ padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            <Sparkles size={14} style={{ color: '#3b82f6' }} />
            <span>Trợ lý AI Gợi ý biển</span>
          </div>
          <div style={{ font: 'var(--type-title-3)', color: rails.aiSuggestEnabled ? '#15803d' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {rails.aiSuggestEnabled ? 'Đang hoạt động' : 'Tạm dừng (Mặc định)'}
          </div>
          <div style={{ font: 'var(--type-caption)', fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.4 }}>
            {rails.aiSuggestEnabled ? 'Đang phân tích gợi ý thông minh dựa trên DeepSeek AI.' : 'Gợi ý biển tĩnh theo tỉnh/loại xe để tối ưu hóa chi phí API.'}
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeSettingsSection({ notify }) {
  const { data, isLoading, isError, refetch } = useNotificationTypeSettings();
  const runAllTriggers = useRunAllNotificationTriggers();
  const [editingType, setEditingType] = useState(null);
  const [filterGroup, setFilterGroup] = useState('all'); // 'all' | 'guest' | 'registered' | 'inactive'
  const [searchQuery, setSearchQuery] = useState('');
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
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.min(75, Math.max(25, ((clientX - rect.left) / rect.width) * 100));
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
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftPct]);

  const handleRunAll = () => {
    if (!window.confirm('Bạn có chắc chắn muốn quét và kích hoạt đồng loạt tất cả 20 luồng thông báo tự động ngay bây giờ không?')) return;
    runAllTriggers.mutate(undefined, {
      onSuccess: (res) => {
        notify(res?.data?.message || res?.message || 'Đã kích hoạt quét thành công toàn bộ các luồng thông báo!');
      },
      onError: (err) => {
        notify(err?.response?.data?.message || err?.message || 'Lỗi khi kích hoạt quét tất cả');
      },
    });
  };

  const showSplit = Boolean(editingType);
  const rawList = data || [];

  const filteredList = rawList.filter((t) => {
    // Lọc theo nhóm đối tượng
    if (filterGroup === 'guest' && !GUEST_TYPES.has(t.type)) return false;
    if (filterGroup === 'registered' && GUEST_TYPES.has(t.type)) return false;
    if (filterGroup === 'inactive' && (t.webEnabled || t.emailEnabled)) return false;

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const label = (TYPE_LABEL[t.type] || '').toLowerCase();
      const desc = (TYPE_DESC[t.type] || '').toLowerCase();
      const typeCode = t.type.toLowerCase();
      const audience = (TYPE_META[t.type]?.audience || '').toLowerCase();
      if (!label.includes(q) && !desc.includes(q) && !typeCode.includes(q) && !audience.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
      {/* Banner thông số Guardrails */}
      <SystemGuardrailsCard />

      <div ref={containerRef} style={{ flex: '1 1 100%', minWidth: 0, display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ flex: showSplit ? `0 0 ${leftPct}%` : '1 1 100%', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Kênh &amp; nội dung thông báo tự động</span>
            <p style={{ margin: '4px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Bật/tắt chuông web, email, sửa câu chữ và khung giờ gửi cho từng loại — áp dụng toàn hệ thống.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              {(() => {
                const list = rawList;
                const webOn = list.filter((t) => t.webEnabled).length;
                const emailOn = list.filter((t) => t.emailEnabled).length;
                const sent = list.reduce((s, t) => s + (t.emailsSent || 0), 0);
                const chips = [
                  ['Tổng loại', list.length],
                  ['Khách để lại thông tin', list.filter(t => GUEST_TYPES.has(t.type)).length],
                  ['Thành viên đăng ký', list.filter(t => !GUEST_TYPES.has(t.type)).length],
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

          {/* Thanh công cụ tìm kiếm & Nút quét tất cả */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', padding: '10px var(--gutter-card)', background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-hairline)' }}>
            <div style={{ flex: '1 1 240px', position: 'relative', maxWidth: 360 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Tìm loại thông báo, mã code, đối tượng…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: 36,
                  paddingLeft: 34,
                  paddingRight: searchQuery ? 30 : 12,
                  borderRadius: 'var(--radius-field)',
                  border: 'none',
                  background: 'var(--white)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  font: 'var(--type-body-sm)',
                  color: 'var(--text-strong)',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 2 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleRunAll}
              disabled={runAllTriggers.isPending}
              title="Kích hoạt kiểm tra điều kiện & gửi ngay cho toàn bộ các đối tượng phù hợp ở cả 20 luồng"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: 'var(--action-dark)',
                color: 'var(--white)',
                font: 'var(--type-body-sm)',
                fontWeight: 'var(--fw-semibold)',
                cursor: runAllTriggers.isPending ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-sm)',
                opacity: runAllTriggers.isPending ? 0.75 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={13} className={runAllTriggers.isPending ? 'animate-spin' : ''} />
              {runAllTriggers.isPending ? 'Đang quét toàn bộ…' : 'Quét & gửi tất cả luồng (20)'}
            </button>
          </div>

          {/* Phân nhóm đối tượng thông báo */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px var(--gutter-card)', background: 'var(--white)', borderBottom: '1px solid var(--border-hairline)' }}>
            {[
              { id: 'all', label: `Tất cả (${rawList.length})` },
              { id: 'guest', label: `Khách chưa đăng ký / Để lại thông tin (${rawList.filter(t => GUEST_TYPES.has(t.type)).length})` },
              { id: 'registered', label: `Thành viên đã đăng ký (${rawList.filter(t => !GUEST_TYPES.has(t.type)).length})` },
              { id: 'inactive', label: `Đã tắt hoàn toàn (${rawList.filter(t => !t.webEnabled && !t.emailEnabled).length})` },
            ].map((b) => (
              <button key={b.id} type="button" onClick={() => setFilterGroup(b.id)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
                  font: 'var(--type-body-sm)', fontSize: 13,
                  fontWeight: filterGroup === b.id ? 'var(--fw-semibold)' : 'var(--fw-normal)',
                  background: filterGroup === b.id ? (b.id === 'guest' ? '#d97706' : b.id === 'inactive' ? '#dc2626' : 'var(--action-dark)') : 'var(--surface-sunken)',
                  color: filterGroup === b.id ? 'var(--white)' : 'var(--text-body)',
                  boxShadow: filterGroup === b.id ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                }}>
                {b.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: '32px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
          ) : isError ? (
            <div style={{ padding: '32px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span>Lỗi tải dữ liệu</span>
              <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none' }}>Thử lại</button>
            </div>
          ) : filteredList.length === 0 ? (
            <div style={{ padding: '32px var(--gutter-card)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              {searchQuery ? `Không tìm thấy loại thông báo nào khớp với "${searchQuery}".` : 'Không có loại thông báo nào trong nhóm này.'}
            </div>
          ) : (
            filteredList.map((t) => (
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
              onTouchStart={onDividerDown}
              role="separator"
              aria-orientation="vertical"
              title="Kéo để đổi tỉ lệ"
              style={{ flex: '0 0 auto', width: 24, alignSelf: 'stretch', cursor: 'col-resize', touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
    </div>
  );
}

// Hàng cấu hình từng loại thông báo với huy hiệu trực quan và bảng biến tương tác
function TypeSettingRow({ setting, notify, editing, onEdit, onCloseEdit, draftTitle, setDraftTitle, draftContent, setDraftContent }) {
  const update = useUpdateNotificationTypeSetting();
  const sendTest = useSendTestEmail();
  const runTrigger = useRunNotificationTrigger();
  const [triggerHour, setTriggerHour] = useState(setting.triggerHour ?? '');
  const isFengShui = setting.type === 'fengshui_match';
  const [dailyLimit, setDailyLimit] = useState(setting.dailyLimitPerUser ?? 2);
  const { data: queueStats } = useFengShuiQueueStats(isFengShui && editing);
  const [testEmail, setTestEmail] = useState('');

  const meta = TYPE_META[setting.type] || {
    mechanism: 'Thời gian thực',
    isRealtime: true,
    audience: 'Người dùng hệ thống',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên người nhận' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  };

  const handleRunNow = (e) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc muốn kích hoạt chạy quét trigger "${TYPE_LABEL[setting.type] || setting.type}" ngay bây giờ không?`)) return;
    runTrigger.mutate(setting.type, {
      onSuccess: (res) => {
        notify(res?.data?.message || res?.message || `Đã kích hoạt quét '${setting.type}' thành công!`);
      },
      onError: (err) => {
        notify(err?.response?.data?.message || err?.message || 'Kích hoạt thất bại');
      },
    });
  };

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
      titleTemplate: setting.titleTemplate, contentTemplate: setting.contentTemplate, triggerHour: setting.triggerHour, dailyLimitPerUser: setting.dailyLimitPerUser,
      [field]: !setting[field] }, {
      onError: (err) => notify?.(err?.message || 'Đổi cài đặt thất bại, thử lại.'),
    });
  };

  const saveEdit = async () => {
    try {
      await update.mutateAsync({
        type: setting.type, webEnabled: setting.webEnabled, emailEnabled: setting.emailEnabled,
        titleTemplate: draftTitle.trim() || null, contentTemplate: draftContent.trim() || null,
        triggerHour: setting.triggerHour !== null ? (triggerHour === '' ? null : Number(triggerHour)) : null,
        dailyLimitPerUser: isFengShui ? Math.max(0, Math.min(50, Number(dailyLimit) || 0)) : setting.dailyLimitPerUser,
      });
      notify('Đã lưu');
      onCloseEdit();
    } catch (e) { notify(e.message || 'Lỗi khi lưu'); }
  };

  const sendTestNow = async () => {
    if (!testEmail.trim()) { notify('Vui lòng nhập địa chỉ email nhận'); return; }
    try {
      await sendTest.mutateAsync({ type: setting.type, toEmail: testEmail.trim() });
      notify(`Đã gửi email thử tới ${testEmail.trim()}`);
    } catch (e) { notify(e.message || 'Lỗi khi gửi thử'); }
  };

  // Chèn nhanh biến vào nội dung soạn thảo
  const handleInsertVar = (varKey) => {
    setDraftContent((prev) => (prev ? `${prev} ${varKey}` : varKey));
    notify(`Đã chèn biến ${varKey} vào nội dung`);
  };

  return (
    <div
      role="button" tabIndex={0}
      onClick={editing ? onCloseEdit : onEdit}
      onKeyDown={(e) => { if (e.key === 'Enter') (editing ? onCloseEdit : onEdit)(); }}
      style={{
        padding: 'var(--space-3) var(--gutter-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        boxShadow: editing ? 'inset 3px 0 0 var(--action-primary), inset 0 -1px 0 var(--grey-100)' : 'inset 0 -1px 0 var(--grey-100)',
        background: editing ? 'var(--surface-tint-cream)' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
            {TYPE_LABEL[setting.type] || setting.type}
          </span>
          <span style={{ font: '10px monospace', padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
            {setting.type}
          </span>
          {GUEST_TYPES.has(setting.type) && (
            <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 'var(--fw-semibold)', display: 'inline-flex', alignItems: 'center' }}>
              Khách chưa đăng ký
            </span>
          )}
          {meta.isRealtime ? (
            <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontSize: 11, fontWeight: 'var(--fw-medium)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Zap size={10} /> Real-time
            </span>
          ) : (
            <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(107, 114, 128, 0.12)', color: '#4b5563', fontSize: 11, fontWeight: 'var(--fw-medium)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Clock size={10} /> Định kỳ
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Mail size={12} /> {setting.emailsSent ?? 0} email
          </span>
          <label onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={setting.webEnabled} onChange={() => toggle('webEnabled')} disabled={update.isPending} /> Chuông web
          </label>
          <label onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={setting.emailEnabled} onChange={() => toggle('emailEnabled')} disabled={update.isPending} /> Email
          </label>
          <button
            type="button"
            onClick={handleRunNow}
            disabled={runTrigger.isPending}
            title="Kích hoạt quét điều kiện và gửi ngay cho các đối tượng phù hợp"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-hairline)',
              background: 'var(--white)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-medium)',
              color: 'var(--action-primary)',
              cursor: runTrigger.isPending ? 'not-allowed' : 'pointer',
              opacity: runTrigger.isPending ? 0.7 : 1,
              boxShadow: 'var(--shadow-inset-hairline)',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={11} className={runTrigger.isPending ? 'animate-spin' : ''} />
            {runTrigger.isPending ? 'Đang quét…' : 'Quét & gửi ngay'}
          </button>
        </div>

        {!setting.webEnabled && !setting.emailEnabled && (
          <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)', fontWeight: 'var(--fw-semibold)' }}>⚠ Đã tắt hoàn toàn — không gửi qua bất kỳ kênh nào</span>
        )}
        <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>{editing ? 'Đang sửa ▸' : ''}</span>
      </div>

      {!editing && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          {TYPE_DESC[setting.type] && (
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', flex: '1 1 300px' }}>{TYPE_DESC[setting.type]}</span>
          )}
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--surface-sunken)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
            <Users size={11} /> {meta.audience}
          </span>
        </div>
      )}

      {editing && (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
          {/* Hộp tóm tắt cơ chế & đối tượng */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, padding: '10px 12px', background: 'var(--white)', borderRadius: 'var(--radius-field)', boxShadow: 'var(--shadow-inset-hairline)' }}>
            <div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Cơ chế kích hoạt:</div>
              <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{meta.mechanism}</div>
            </div>
            <div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đối tượng nhận:</div>
              <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{meta.audience}</div>
            </div>
            <div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Kênh phân phối:</div>
              <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{meta.channels.join(' & ')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 'var(--space-2) var(--space-3)', background: 'var(--white)', borderRadius: 'var(--radius-field)', boxShadow: 'var(--shadow-inset-hairline)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Mẫu mặc định gốc của hệ thống</span>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{setting.defaultTitle}</span>
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{setting.defaultContent}</span>
          </div>

          <Input label="Tiêu đề tùy chỉnh (để trống = dùng mặc định ở trên)" placeholder={setting.defaultTitle} value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Nội dung tùy chỉnh (để trống = dùng mặc định ở trên)</span>
            <textarea rows={3} value={draftContent} placeholder={setting.defaultContent} onChange={(e) => setDraftContent(e.target.value)} style={{ background: 'var(--white)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '10px 12px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
          </label>

          {/* Bảng biến placeholder tương tác (bấm để chèn) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-strong)', fontWeight: 'var(--fw-medium)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Copy size={12} /> Biến thay thế tự động (Bấm vào biến để chèn nhanh vào nội dung):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {meta.vars.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => handleInsertVar(v.key)}
                  title={`${v.desc} — Bấm để chèn`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-hairline)',
                    background: 'var(--white)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: 'var(--text-strong)',
                    boxShadow: 'var(--shadow-inset-hairline)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>{v.key}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>({v.desc})</span>
                </button>
              ))}
            </div>
          </div>

          {isFengShui && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 320 }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Hạn mức thông báo mỗi người / ngày (0 = tạm dừng gửi)</span>
              <input type="number" min="0" max="50" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)}
                style={{ height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 10px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }} />
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                Biển kho và biển VPA hợp mệnh (điểm ≥ 70%) xếp hàng theo từng người, kho gửi trước. Mỗi người nhận tối đa số thông báo này mỗi ngày, dàn đều
                {Number(dailyLimit) > 0 ? ` (cách nhau khoảng ${(24 / Number(dailyLimit)).toFixed(1)} giờ)` : ''}; phần còn lại chờ trong hàng đợi (giữ tối đa 50 biển/người, bỏ sau 7 ngày).
              </span>
              {queueStats && (
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-body)' }}>
                  Hàng đợi hiện tại: <b>{queueStats.pending.toLocaleString('vi-VN')}</b> biển đang chờ (kho {queueStats.pendingOwn.toLocaleString('vi-VN')} · VPA {queueStats.pendingVpa.toLocaleString('vi-VN')}) của <b>{queueStats.usersWaiting.toLocaleString('vi-VN')}</b> người; đã gửi 24 giờ qua: <b>{queueStats.sentLast24h.toLocaleString('vi-VN')}</b>.
                </span>
              )}
            </label>
          )}

          {setting.triggerHour !== null && HOUR_HAS_EFFECT.has(setting.type) ? (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 220 }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Giờ gửi (giờ UTC, 0-23)</span>
              <input type="number" min="0" max="23" value={triggerHour} onChange={(e) => setTriggerHour(e.target.value)}
                style={{ height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', padding: '0 10px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', outline: 'none' }} />
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                Giờ Việt Nam = UTC + 7 → gửi lúc {triggerHour !== '' ? `${(Number(triggerHour) + 7) % 24}h VN` : '—'} nếu nhập {triggerHour !== '' ? `${triggerHour}h UTC` : 'ở trên'}.
              </span>
            </label>
          ) : setting.triggerHour !== null ? (
            <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)', fontStyle: 'italic' }}>
              ⚠ Loại này không dùng "Giờ gửi" cố định — {setting.type === 'digest' ? 'mỗi user tự chọn giờ riêng trong hồ sơ cá nhân' : 'job chạy cố định 1 lần/ngày, bỏ qua giờ đặt ở đây'}. Ẩn field để tránh admin tưởng chỉnh được.
            </span>
          ) : (
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', fontStyle: 'italic' }}>Loại này gửi ngay khi sự kiện xảy ra (real-time), không có giờ cố định để chỉnh.</span>
          )}

          <div style={{ maxWidth: 280 }}>
            <Select label="Layout email (UC27)" value={activeTemplate?.id || ''} onChange={setEmailLayout}
              options={[{ value: '', label: 'Mặc định hệ thống' }, ...applicableTemplates.map((t) => ({ value: t.id, label: t.name }))]} />
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
              Khung "Xem trước email" bên phải luôn hiện đúng layout hiện tại (mặc định hoặc template đã chọn) — không cần preview riêng.
            </span>
            {applicableTemplates.length === 0 && (
              <span style={{ display: 'block', font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Chưa có template nào gắn cho loại này — tạo ở trang "Mẫu email".</span>
            )}
          </div>

          <Button variant="dark" size="sm" style={{ alignSelf: 'flex-start' }} onClick={saveEdit} disabled={update.isPending}>{update.isPending ? 'Đang lưu…' : 'Lưu cài đặt'}</Button>

          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', flexWrap: 'wrap', boxShadow: 'inset 0 1px 0 var(--border-hairline)', paddingTop: 'var(--space-2)' }}>
            <div style={{ flex: '1 1 220px' }}>
              <Input label="Gửi thử email mẫu tới" placeholder="ban@email.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} required />
            </div>
            <Button variant="ghost" size="sm" onClick={sendTestNow} disabled={sendTest.isPending}>{sendTest.isPending ? 'Đang gửi…' : 'Gửi thử'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Bảng lịch sử & nhật ký gửi email hệ thống, marketing và tự động hóa
function EmailLogsSection({ notify }) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [debouncedEmail] = useDebouncedValue(emailInput, 400);
  const [selectedLog, setSelectedLog] = useState(null);

  const { data, isLoading, isError, refetch, isFetching } = useAdminEmailLogs({
    page,
    pageSize,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    email: debouncedEmail.trim() || undefined,
  });

  const runAllTriggers = useRunAllNotificationTriggers();

  const handleRunAll = () => {
    if (!window.confirm('Bạn có chắc muốn kích hoạt chạy quét TOÀN BỘ các trigger thông báo tự động (phong thủy, giỏ hàng, welcome...) ngay bây giờ không?')) return;
    runAllTriggers.mutate(undefined, {
      onSuccess: (res) => {
        notify(res?.data?.message || res?.message || 'Đã kích hoạt chạy toàn bộ triggers thành công!');
        refetch();
      },
      onError: (err) => {
        notify(err?.response?.data?.message || err?.message || 'Kích hoạt thất bại');
      },
    });
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Tùy chọn lọc loại email
  const typeOptions = [
    { value: '', label: 'Tất cả loại email' },
    ...Object.entries(TYPE_LABEL).map(([key, label]) => ({
      value: key,
      label: `${label} (${key})`,
    })),
  ];

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'success', label: '✓ Thành công' },
    { value: 'failed', label: '✗ Thất bại' },
  ];

  return (
    <div style={{ flex: '1 1 100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        {/* Header & Actions */}
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Nhật ký gửi Email Hệ thống</span>
              <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 'var(--fw-semibold)' }}>
                {total.toLocaleString('vi-VN')} bản ghi
              </span>
            </div>
            <p style={{ margin: '4px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Theo dõi chi tiết mọi email tự động hóa, marketing và thông báo đã được gửi đi từ hệ thống.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Làm mới danh sách logs"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Làm mới
            </Button>
            <Button
              variant="dark"
              size="sm"
              onClick={handleRunAll}
              disabled={runAllTriggers.isPending}
              title="Quét kiểm tra và gửi email cho toàn bộ loại trigger tự động"
            >
              <Zap size={14} className={runAllTriggers.isPending ? 'animate-spin' : ''} />
              {runAllTriggers.isPending ? 'Đang kích hoạt…' : 'Quét tất cả triggers ngay'}
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-subtle)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ flex: '1 1 200px', minWidth: 160 }}>
            <Input
              label=""
              placeholder="Tìm theo email người nhận..."
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div style={{ flex: '1 1 220px', minWidth: 180 }}>
            <Select
              label=""
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setPage(1);
              }}
              options={typeOptions}
            />
          </div>
          <div style={{ flex: '0 1 180px', minWidth: 140 }}>
            <Select
              label=""
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={statusOptions}
            />
          </div>
          {(emailInput || typeFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setEmailInput('');
                setTypeFilter('');
                setStatusFilter('');
                setPage(1);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--action-primary)',
                font: 'var(--type-caption)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Logs Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', font: 'var(--type-body-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--surface-sunken)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', color: 'var(--text-muted)', fontSize: 12 }}>
                <th style={{ padding: '10px var(--gutter-card)', fontWeight: 'var(--fw-semibold)' }}>Thời gian</th>
                <th style={{ padding: '10px 12px', fontWeight: 'var(--fw-semibold)' }}>Người nhận</th>
                <th style={{ padding: '10px 12px', fontWeight: 'var(--fw-semibold)' }}>Loại thông báo</th>
                <th style={{ padding: '10px 12px', fontWeight: 'var(--fw-semibold)' }}>Tiêu đề</th>
                <th style={{ padding: '10px 12px', fontWeight: 'var(--fw-semibold)', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ padding: '10px var(--gutter-card)', fontWeight: 'var(--fw-semibold)', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px var(--gutter-card)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Đang tải nhật ký gửi email…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px var(--gutter-card)', textAlign: 'center', color: 'var(--status-danger)' }}>
                    Lỗi tải dữ liệu. <button type="button" onClick={() => refetch()} style={{ color: 'var(--link)', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Thử lại</button>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px var(--gutter-card)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Không tìm thấy nhật ký gửi email nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                items.map((log) => {
                  const isSuccess = log.status === 'success';
                  return (
                    <tr key={log.id} style={{ boxShadow: 'inset 0 -1px 0 var(--grey-100)', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '12px var(--gutter-card)', whiteSpace: 'nowrap', color: 'var(--text-faint)', font: 'var(--type-caption)' }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)' }}>
                        <div>{log.toEmail}</div>
                        {log.userId && <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>ID: {log.userId}</span>}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--surface-sunken)',
                          color: 'var(--text-strong)',
                          fontSize: 11,
                          fontWeight: 'var(--fw-medium)',
                        }}>
                          {TYPE_LABEL[log.type] || log.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }} title={log.subject}>
                        {log.subject || '—'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: 12,
                          fontWeight: 'var(--fw-semibold)',
                          background: isSuccess ? '#ecfdf5' : '#fef2f2',
                          color: isSuccess ? '#065f46' : '#991b1b',
                        }}>
                          {isSuccess ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {isSuccess ? 'Thành công' : 'Thất bại'}
                        </span>
                      </td>
                      <td style={{ padding: '12px var(--gutter-card)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-hairline)',
                            background: 'var(--white)',
                            color: 'var(--action-primary)',
                            fontSize: 12,
                            fontWeight: 'var(--fw-medium)',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={12} />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div style={{ padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 1px 0 var(--border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Trang {page} / {totalPages} (tổng {total.toLocaleString('vi-VN')} bản ghi)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-hairline)',
                  background: page <= 1 ? 'var(--surface-sunken)' : 'var(--white)',
                  color: page <= 1 ? 'var(--text-faint)' : 'var(--text-strong)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                }}
              >
                <ChevronLeft size={14} /> Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-hairline)',
                  background: page >= totalPages ? 'var(--surface-sunken)' : 'var(--white)',
                  color: page >= totalPages ? 'var(--text-faint)' : 'var(--text-strong)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                }}
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)',
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              maxWidth: 640,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Chi tiết nhật ký gửi email</h3>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>ID: {selectedLog.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 'var(--space-4) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block' }}>Tiêu đề email</span>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{selectedLog.subject || '—'}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block' }}>Người nhận</span>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{selectedLog.toEmail}</span>
                </div>
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block' }}>Thời gian gửi</span>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{formatDateTime(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block' }}>Phân loại</span>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                    {TYPE_LABEL[selectedLog.type] || selectedLog.type} ({selectedLog.type})
                  </span>
                </div>
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block' }}>Trạng thái</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 12,
                    fontWeight: 'var(--fw-semibold)',
                    background: selectedLog.status === 'success' ? '#ecfdf5' : '#fef2f2',
                    color: selectedLog.status === 'success' ? '#065f46' : '#991b1b',
                  }}>
                    {selectedLog.status === 'success' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {selectedLog.status === 'success' ? 'Thành công' : 'Thất bại'}
                  </span>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                  <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={14} /> Thông báo lỗi từ Mail Service / SMTP:
                  </span>
                  <pre style={{ margin: '6px 0 0', font: 'var(--type-caption)', color: '#7f1d1d', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                    {selectedLog.errorMessage}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Dữ liệu đính kèm (Metadata):</span>
                  <pre style={{ margin: 0, padding: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', fontSize: 12, fontFamily: 'monospace', overflowX: 'auto', color: 'var(--text-strong)' }}>
                    {typeof selectedLog.metadata === 'string' ? selectedLog.metadata : JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 1px 0 var(--border-hairline)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
