import Modal from './Modal.jsx';
import Button from './Button.jsx';

// UC35 — modal xác nhận bulk action dùng chung, luôn nêu rõ số lượng mục bị ảnh hưởng.
export default function ConfirmBulkModal({ open, onClose, onConfirm, count, actionLabel, itemLabel = 'mục', loading, danger }) {
  return (
    <Modal open={open} onClose={onClose} title="Xác nhận thao tác hàng loạt" maxWidth="380px">
      <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
        Bạn có chắc muốn <b>{actionLabel}</b> <b>{count}</b> {itemLabel}?
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
        <Button variant="ghost" size="md" onClick={onClose}>Hủy</Button>
        <Button variant={danger ? 'danger' : 'primary'} size="md" onClick={onConfirm} loading={loading}>Xác nhận</Button>
      </div>
    </Modal>
  );
}
