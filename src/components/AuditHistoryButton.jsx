import { useState } from 'react';
import { History } from 'lucide-react';
import Modal from './Modal.jsx';
import { useAuditLogByEntity } from '../services/adminAuditLog.js';
import { formatDate } from '../lib/date.js';
import { loadAuth } from '../lib/authStore.js';

const ACTION_LABEL = { create: 'Tạo mới', update: 'Cập nhật', delete: 'Xóa', status_change: 'Đổi trạng thái' };

// Nút nhỏ mở modal xem lịch sử audit log của 1 entity cụ thể (UC31).
// Chỉ super-admin thấy được — backend đã chặn 403 cho role khác, nhưng ẩn UI luôn để tránh gây tò mò.
export default function AuditHistoryButton({ entityType, entityId }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useAuditLogByEntity(open ? entityType : null, open ? entityId : null);

  if (loadAuth()?.user?.role !== 'super-admin') return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Xem lịch sử"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
      >
        <History size={16} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Lịch sử thay đổi" maxWidth="480px">
        {isLoading ? (
          <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</p>
        ) : !data?.length ? (
          <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có lịch sử nào.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {data.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: 'var(--space-2)', font: 'var(--type-caption)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-faint)', minWidth: 130 }}>{formatDate(log.createdAt)}</span>
                <span style={{ fontWeight: 'var(--fw-semibold)' }}>{log.actorLabel}</span>
                <span style={{ color: 'var(--text-muted)' }}>{ACTION_LABEL[log.action] || log.action}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
