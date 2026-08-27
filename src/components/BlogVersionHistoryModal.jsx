import { useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { useBlogPostVersions, useRollbackBlogPost } from '../services/blog.js';

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN');
}

// Item #5 backlog — lịch sử phiên bản bài viết + rollback. Mở từ Compose.jsx khi đang sửa bài đã lưu.
export default function BlogVersionHistoryModal({ open, onClose, postId, notify, onRolledBack }) {
  const { data, isLoading } = useBlogPostVersions(postId);
  const rollbackMut = useRollbackBlogPost();
  const [confirmVersion, setConfirmVersion] = useState(null);

  const doRollback = () => {
    if (!confirmVersion) return;
    rollbackMut.mutate({ postId, versionId: confirmVersion.id }, {
      onSuccess: () => { notify?.('Đã khôi phục về phiên bản đã chọn'); setConfirmVersion(null); onRolledBack?.(); onClose(); },
      onError: (e) => notify?.(e.message || 'Khôi phục thất bại.'),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Lịch sử phiên bản" maxWidth="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Mỗi lần lưu bài viết sẽ ghi lại 1 bản trước đó. Chọn "Khôi phục" để đưa nội dung bài viết về đúng bản đó.
        </p>
        {isLoading && <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải…</div>}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>Chưa có phiên bản cũ nào — bài viết chưa từng được sửa sau khi tạo.</div>
        )}
        {!isLoading && (data?.length ?? 0) > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
            {data.map((v) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{fmtDateTime(v.createdAt)}{v.versionedByName ? ` · ${v.versionedByName}` : ''}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setConfirmVersion(v)}>Khôi phục</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!confirmVersion} onClose={() => setConfirmVersion(null)} title="Khôi phục phiên bản?" maxWidth="380px">
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
          Nội dung hiện tại sẽ được lưu lại thành 1 phiên bản mới trước khi khôi phục, nên bạn vẫn có thể quay lại nếu đổi ý.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <Button variant="ghost" size="md" onClick={() => setConfirmVersion(null)}>Hủy</Button>
          <Button variant="primary" size="md" onClick={doRollback} disabled={rollbackMut.isPending}>{rollbackMut.isPending ? 'Đang khôi phục…' : 'Khôi phục'}</Button>
        </div>
      </Modal>
    </Modal>
  );
}
