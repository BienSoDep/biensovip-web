import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { Input, Switch } from '../../components/index.jsx';
import Modal from '../../components/Modal.jsx';
import { useAdminMaintenanceList, useUpdateMaintenancePage } from '../../services/maintenanceService.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { formatDateTime } from '../../lib/date.js';

const SCREEN_LABEL = {
  home: 'Trang chủ', list: 'Danh sách biển số', detail: 'Chi tiết biển số', fav: 'Yêu thích',
  profile: 'Tài khoản', about: 'Giới thiệu', blog: 'Blog', post: 'Bài viết', lucky: 'Hợp mệnh',
  chat: 'Liên hệ tư vấn', compare: 'So sánh', saved: 'Thông báo biển mới', reviews: 'Đánh giá',
  notifications: 'Thông báo mới', collab: 'Cộng tác viên', terms: 'Điều khoản', privacy: 'Bảo mật',
  transfer: 'Hướng dẫn sang tên', faq: 'Hỏi đáp', provinceLanding: 'Landing tỉnh/thành',
  plateTypeLanding: 'Landing loại biển',
};

// UC mới — bảo trì/coming-soon từng trang public. RBAC resource "maintenance".
export default function AdminMaintenance({ notify }) {
  const { data, isLoading, isError, refetch } = useAdminMaintenanceList();
  const update = useUpdateMaintenancePage();
  const [editing, setEditing] = useState(null); // MaintenancePageDto đang mở modal soạn
  const [form, setForm] = useState({ title: '', message: '', expectedBackAt: '' });

  const items = data || [];

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      message: item.message || '',
      expectedBackAt: item.expectedBackAt ? item.expectedBackAt.slice(0, 16) : '',
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
    }, {
      onSuccess: () => { notify(enabled ? 'Đã bật bảo trì' : 'Đã tắt bảo trì'); setEditing(null); },
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
      <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
        Bật bảo trì cho 1 trang — khách truy cập sẽ thấy trang thông báo thay vì nội dung thật. Admin/nhân viên đang đăng nhập vẫn xem được trang thật để kiểm tra trước khi tắt bảo trì.
      </p>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        {items.map((item) => (
          <div key={item.screen} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
            <Switch checked={item.enabled} onChange={() => quickToggle(item)} disabled={update.isPending} label={`Bảo trì ${SCREEN_LABEL[item.screen] || item.screen}`} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: 'var(--type-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{SCREEN_LABEL[item.screen] || item.screen}</div>
              {item.enabled && (
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  {item.title}{item.expectedBackAt ? ` — dự kiến mở lại ${formatDateTime(item.expectedBackAt)}` : ''}
                </div>
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
            Dự kiến mở lại (tùy chọn)
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
    </div>
  );
}
