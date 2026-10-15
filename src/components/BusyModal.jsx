import Modal from './Modal.jsx';

// Modal "đang xử lý" dùng cho thao tác đồng bộ bounded (không có runId backend để poll %) nhưng có thể
// chạy vài giây tới vài chục giây — thanh indeterminate thay cho chỉ spinner trên nút, để admin biết hệ
// thống đang làm việc chứ không phải treo. Khác ApproveRunModal (VpaAdminList.jsx): cái đó poll %  thật
// qua runId cho các job chạy nền thật sự (approve-all/recomputed/matched-samples/recompute-suggestions).
export default function BusyModal({ open, title, message }) {
  if (!open) return null;
  return (
    <Modal open onClose={() => {}} title={title} maxWidth="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--grey-200)', overflow: 'hidden' }}>
          <div style={{
            width: '40%', height: '100%', background: 'var(--action-primary)', borderRadius: 4,
            animation: 'busyModalIndeterminate 1.1s ease-in-out infinite',
          }} />
        </div>
        <style>{'@keyframes busyModalIndeterminate { 0% { margin-left: 0%; } 50% { margin-left: 60%; } 100% { margin-left: 0%; } }'}</style>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{message}</p>
      </div>
    </Modal>
  );
}
