import Modal from './Modal.jsx';
import Button from './Button.jsx';

// Shared styled confirm dialog — replaces native window.confirm in admin screens.
// Danger-styled confirm with loading state + per-action copy.
export default function ConfirmModal({ open, onClose, onConfirm, title = 'Xác nhận', message, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', danger = false, loading = false, children }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="420px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {message && <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{message}</p>}
        {children}
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} size="md" onClick={onConfirm} disabled={loading} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
