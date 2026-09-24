import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import { Input } from '../../../components/index.jsx';
import AdminTransactions, { CreateTransactionForm } from '../AdminTransactions.jsx';

export default function ContactModals({
  linkAmountFor,
  setLinkAmountFor,
  linkAmountInput,
  setLinkAmountInput,
  handleCreatePaymentLink,
  creatingLinkFor,

  upgrading,
  setUpgrading,
  refetch,

  viewingTx,
  setViewingTx,

  deleteTarget,
  setDeleteTarget,
  deleteContact,
  submitDelete,
  notify,
}) {
  return (
    <>
      {/* Modal: Tạo link ZaloPay */}
      <Modal open={!!linkAmountFor} onClose={() => setLinkAmountFor(null)} title="Tạo link thanh toán ZaloPay" maxWidth="420px">
        {linkAmountFor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              label="Số tiền cần thu (VNĐ)"
              placeholder="VD: 50000000"
              value={linkAmountInput}
              onChange={(e) => setLinkAmountInput(e.target.value.replace(/[^\d]/g, ''))}
              required
            />
            <Button
              variant="primary"
              disabled={creatingLinkFor === linkAmountFor.id || !linkAmountInput}
              onClick={handleCreatePaymentLink}
            >
              {creatingLinkFor === linkAmountFor.id ? 'Đang tạo…' : 'Tạo link'}
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal: Tạo giao dịch từ liên hệ */}
      <Modal open={!!upgrading} onClose={() => setUpgrading(null)} title="Tạo giao dịch từ liên hệ này" maxWidth="480px">
        {upgrading && (
          <CreateTransactionForm
            notify={notify}
            onDone={() => { setUpgrading(null); refetch(); }}
            prefill={{
              contactRequestId: upgrading.id,
              fullName: upgrading.fullName,
              phone: upgrading.phone,
              plate: upgrading.plateId ? { id: upgrading.plateId, plateNumber: upgrading.plateNumber } : null,
            }}
          />
        )}
      </Modal>

      {/* Modal: Xem giao dịch liên quan */}
      <Modal open={!!viewingTx} onClose={() => setViewingTx(null)} title={`Giao dịch của ${viewingTx?.fullName || ''}`} maxWidth="820px">
        {viewingTx && <AdminTransactions notify={notify} filterContactRequestId={viewingTx.id} />}
      </Modal>

      {/* Modal: Xác nhận chuyển vào thùng rác */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xóa yêu cầu liên hệ" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Chuyển liên hệ {deleteTarget?.fullName} vào Thùng rác? Có thể khôi phục trong 30 ngày, sau đó tự xóa vĩnh viễn. Giao dịch chưa xác nhận thanh toán của liên hệ này cũng vào Thùng rác theo.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant="primary" disabled={deleteContact.isPending} onClick={submitDelete}>
              {deleteContact.isPending ? 'Đang xóa…' : 'Vào Thùng rác'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
