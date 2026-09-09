import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Input, Switch } from '../../components/index.jsx';
import Modal from '../../components/Modal.jsx';
import { useAdminMaintenanceList, useUpdateMaintenancePage, useBulkUpdateMaintenance } from '../../services/maintenanceService.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { formatDateTime } from '../../lib/date.js';

const SCREEN_LABEL = {
  home: 'Trang chủ', list: 'Danh sách biển số', detail: 'Chi tiết biển số', fav: 'Yêu thích',
  profile: 'Tài khoản', about: 'Giới thiệu', blog: 'Blog', post: 'Bài viết', lucky: 'Hợp mệnh',
  chat: 'Liên hệ tư vấn', compare: 'So sánh', saved: 'Thông báo biển mới', reviews: 'Đánh giá',
  notifications: 'Thông báo mới', collab: 'Cộng tác viên', collabProcess: 'CTV — Quy trình nhận hoa hồng',
  collabLeaderboard: 'CTV — Bảng xếp hạng', terms: 'Điều khoản', privacy: 'Bảo mật',
  transfer: 'Hướng dẫn sang tên', faq: 'Hỏi đáp', provinceLanding: 'Landing tỉnh/thành',
  plateTypeLanding: 'Landing loại biển',
};

// UC mới — bảo trì/coming-soon từng trang public. RBAC resource "maintenance".
export default function AdminMaintenance({ notify, patch }) {
  const { data, isLoading, isError, refetch } = useAdminMaintenanceList();
  const update = useUpdateMaintenancePage();
  const bulkUpdate = useBulkUpdateMaintenance();
  const [editing, setEditing] = useState(null); // MaintenancePageDto đang mở modal soạn
  const [form, setForm] = useState({ title: '', message: '', expectedBackAt: '', scheduledStartAt: '' });
  const [bulkOpen, setBulkOpen] = useState(null); // true | false — đang soạn bulk bật/tắt, null = đóng
  const [bulkForm, setBulkForm] = useState({ title: '', message: '', expectedBackAt: '' });

  const items = data || [];
  const staleItems = items.filter((i) => i.isStale);

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      message: item.message || '',
      expectedBackAt: item.expectedBackAt ? item.expectedBackAt.slice(0, 16) : '',
      scheduledStartAt: item.scheduledStartAt ? item.scheduledStartAt.slice(0, 16) : '',
    });
  };

  const save = (enabled) => {
    if (!editing) return;
    if (enabled && !form.title.trim()) { notify('Vui lòng nhập tiêu đề hiển thị'); return; }
    update.mutate({
      screen: editing.screen, enabled,
      title: form.title.trim() || null,
      message: form.message.trim() || null,
      expectedBackAt: form.expectedBackAt ? new Date(form.expectedBackAt).toISOString() : null,
      scheduledStartAt: form.scheduledStartAt ? new Date(form.scheduledStartAt).toISOString() : null,
    }, {
      onSuccess: () => { notify(enabled ? 'Đã bật bảo trì' : 'Đã tắt bảo trì'); setEditing(null); },
      onError: (err) => notify(err.message || 'Cập nhật thất bại, thử lại.'),
    });
  };

  const saveBulk = () => {
    if (bulkOpen && !bulkForm.title.trim()) { notify('Vui lòng nhập tiêu đề hiển thị'); return; }
    bulkUpdate.mutate({
      enabled: bulkOpen,
      title: bulkForm.title.trim() || null,
      message: bulkForm.message.trim() || null,
      expectedBackAt: bulkForm.expectedBackAt ? new Date(bulkForm.expectedBackAt).toISOString() : null,
    }, {
      onSuccess: () => { notify(bulkOpen ? 'Đã bật bảo trì toàn site' : 'Đã tắt bảo trì toàn site'); setBulkOpen(null); },
      onError: (err) => notify(err.message || 'Cập nhật thất bại, thử lại.'),
    });
  };

  const quickToggle = (item) => {
    if (item.enabled) {
      // Tắt nhanh — không cần soạn lại nội dung.
      update.mutate({ screen: item.screen, enabled: false, title: item.title, message: item.message, expectedBackAt: item.expectedBackAt },
        { onSuccess: () => notify('Đã tắt bảo trì'), onError: (err) => notify(err.message || 'Cập nhật thất bại, thử lại.') });
    } else {
      openEdit(item); // Bật cần tiêu đề — mở modal soạn trước
    }
  };

  if (isLoading) return <SkeletonTable rows={8} cols={3} />;
  if (isError) return (
    <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Không tải được danh sách.</p>
      <Button variant="outline" onClick={refetch}>Thử lại</Button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {staleItems.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-card)', background: 'var(--red-50, #fef2f2)', boxShadow: 'inset 0 0 0 1px var(--status-danger)' }}>
          <TriangleAlert size={18} style={{ color: 'var(--status-danger)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--status-danger)' }}>Có trang bảo trì có thể bị quên tắt</div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              {staleItems.map((i) => SCREEN_LABEL[i.screen] || i.screen).join(', ')} — bật quá lâu không có ngày dự kiến mở lại, hoặc đã quá hạn dự kiến. Kiểm tra lại và tắt nếu không còn cần thiết.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 560 }}>
          Bật bảo trì cho 1 trang — khách truy cập sẽ thấy trang thông báo thay vì nội dung thật. Admin/nhân viên đang đăng nhập vẫn xem được trang thật để kiểm tra trước khi tắt bảo trì.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {patch && <Button variant="ghost" size="sm" onClick={() => patch({ screen: 'aauditlog' })}>Xem lịch sử</Button>}
          <Button variant="outline" size="sm" onClick={() => { setBulkForm({ title: '', message: '', expectedBackAt: '' }); setBulkOpen(false); }}>Tắt bảo trì toàn site</Button>
          <Button variant="primary" size="sm" onClick={() => { setBulkForm({ title: '', message: '', expectedBackAt: '' }); setBulkOpen(true); }}>Bật bảo trì toàn site</Button>
        </div>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        {items.map((item) => (
          <div key={item.screen} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
            <Switch checked={item.enabled} onChange={() => quickToggle(item)} disabled={update.isPending} label={`Bảo trì ${SCREEN_LABEL[item.screen] || item.screen}`} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ font: 'var(--type-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{SCREEN_LABEL[item.screen] || item.screen}</span>
                {item.isStale && <TriangleAlert size={14} style={{ color: 'var(--status-danger)' }} />}
              </div>
              {item.enabled && (
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  {item.title}{item.expectedBackAt ? ` — dự kiến mở lại ${formatDateTime(item.expectedBackAt)}` : ''}
                </div>
              )}
              {!item.enabled && item.scheduledStartAt && (
                <div style={{ font: 'var(--type-caption)', color: 'var(--action-primary)' }}>Sẽ tự bật lúc {formatDateTime(item.scheduledStartAt)}</div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Soạn nội dung</Button>
          </div>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Soạn bảo trì — ${editing ? (SCREEN_LABEL[editing.screen] || editing.screen) : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Tiêu đề hiển thị" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="VD: Trang đang bảo trì" required />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Nội dung (tùy chọn)
            <textarea rows={3} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="VD: Chúng tôi đang nâng cấp trang này, quay lại sau nhé."
              style={{ border: '1px solid var(--border-hairline)', padding: '8px 10px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', resize: 'vertical' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Lịch hẹn tự bật lúc (tùy chọn)
            <input type="datetime-local" value={form.scheduledStartAt} onChange={(e) => setForm((f) => ({ ...f, scheduledStartAt: e.target.value }))}
              style={{ border: '1px solid var(--border-hairline)', padding: '8px 10px', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Dự kiến mở lại — hệ thống tự tắt đúng giờ này (tùy chọn)
            <input type="datetime-local" value={form.expectedBackAt} onChange={(e) => setForm((f) => ({ ...f, expectedBackAt: e.target.value }))}
              style={{ border: '1px solid var(--border-hairline)', padding: '8px 10px', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }} />
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setEditing(null)}>Hủy</Button>
            {editing?.enabled && <Button variant="outline" onClick={() => save(false)} loading={update.isPending}>Tắt bảo trì</Button>}
            <Button variant="primary" onClick={() => save(true)} loading={update.isPending}>Lưu &amp; bật bảo trì</Button>
          </div>
        </div>
      </Modal>

      <Modal open={bulkOpen !== null} onClose={() => setBulkOpen(null)} title={bulkOpen ? 'Bật bảo trì toàn site' : 'Tắt bảo trì toàn site'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            {bulkOpen ? 'Áp dụng cho toàn bộ trang public cùng lúc — dùng khi deploy lớn, tránh sót từng trang.' : 'Tắt bảo trì cho toàn bộ trang public đang bật.'}
          </p>
          {bulkOpen && (
            <>
              <Input label="Tiêu đề hiển thị" value={bulkForm.title} onChange={(e) => setBulkForm((f) => ({ ...f, title: e.target.value }))} placeholder="VD: Hệ thống đang bảo trì" required />
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                Nội dung (tùy chọn)
                <textarea rows={3} value={bulkForm.message} onChange={(e) => setBulkForm((f) => ({ ...f, message: e.target.value }))}
                  style={{ border: '1px solid var(--border-hairline)', padding: '8px 10px', font: 'var(--type-body-sm)', color: 'var(--text-strong)', resize: 'vertical' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                Dự kiến mở lại (tùy chọn)
                <input type="datetime-local" value={bulkForm.expectedBackAt} onChange={(e) => setBulkForm((f) => ({ ...f, expectedBackAt: e.target.value }))}
                  style={{ border: '1px solid var(--border-hairline)', padding: '8px 10px', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }} />
              </label>
            </>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setBulkOpen(null)}>Hủy</Button>
            <Button variant={bulkOpen ? 'primary' : 'outline'} onClick={saveBulk} loading={bulkUpdate.isPending}>
              {bulkOpen ? 'Bật bảo trì toàn site' : 'Tắt bảo trì toàn site'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
