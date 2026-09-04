import { useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useAdminTransactions, useCreateTransaction, useConfirmTransactionPayment } from '../../services/adminTransactions.js';
import { usePlates } from '../../services/plates.js';
import { Select, Input, Badge, ImageUrlInput } from '../../components/index.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import Modal from '../../components/Modal.jsx';
import Button from '../../components/Button.jsx';

const STATUS_OPTS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'payment_confirmed', label: 'Đã xác nhận' },
  { value: 'cancelled', label: 'Đã hủy' },
];
const STATUS_LABEL = { pending: 'Chờ thanh toán', payment_confirmed: 'Đã xác nhận', cancelled: 'Đã hủy' };
const INTENT_LABEL = { deposit_request: 'Đặt cọc', buy: 'Mua đứt' };
const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

// UC37 — form "Tạo giao dịch", tái dùng cho cả nút tạo tay ở trang này và nút "Tạo giao dịch từ liên hệ này"
// ở AdminContacts (truyền sẵn prefill).
export function CreateTransactionForm({ prefill, onDone, notify }) {
  const [plateQuery, setPlateQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(plateQuery, 300);
  const [plate, setPlate] = useState(prefill?.plate || null);
  const [fullName, setFullName] = useState(prefill?.fullName || '');
  const [phone, setPhone] = useState(prefill?.phone || '');
  const [amount, setAmount] = useState(prefill?.amount ? String(prefill.amount) : '');
  const [intent, setIntent] = useState('deposit_request');
  const createTransaction = useCreateTransaction();
  const { data: plateResults } = usePlates({ q: debouncedQuery, perPage: 8 }, { enabled: debouncedQuery.length >= 2 && !plate });

  const submit = async () => {
    if (!plate?.id) { notify('Chọn biển số'); return; }
    if (!fullName.trim() || !phone.trim()) { notify('Nhập đầy đủ tên và SĐT khách'); return; }
    const amountNum = Number(amount);
    if (!(amountNum > 0)) { notify('Số tiền phải lớn hơn 0'); return; }
    try {
      await createTransaction.mutateAsync({
        plateId: plate.id, contactRequestId: prefill?.contactRequestId || null,
        fullName: fullName.trim(), phone: phone.trim(), amount: amountNum, intent,
      });
      notify('Đã tạo giao dịch');
      onDone?.();
    } catch (e) {
      notify(e.message || 'Tạo giao dịch thất bại');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {plate ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)' }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)' }}>{plate.plateNumber}</span>
          {!prefill?.plate && <button type="button" onClick={() => setPlate(null)} style={{ border: 'none', background: 'none', color: 'var(--action-primary)', cursor: 'pointer', font: 'var(--type-caption)' }}>Đổi</button>}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <Input label="Tìm biển số" placeholder="VD: 30A-123.45" value={plateQuery} onChange={(e) => setPlateQuery(e.target.value)} />
          {plateResults?.items?.length > 0 && (
            <div style={{ position: 'absolute', zIndex: 10, top: '100%', left: 0, right: 0, background: 'var(--white)', boxShadow: 'var(--shadow-elevated)', borderRadius: 'var(--radius-field)', maxHeight: 220, overflowY: 'auto' }}>
              {plateResults.items.map((p) => (
                <button key={p.id} type="button" onClick={() => { setPlate(p); setPlateQuery(''); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-body-sm)' }}>
                  {p.plateNumber} — {money(p.price)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <Input label="Tên khách" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!!prefill?.fullName} />
      <Input label="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!!prefill?.phone} />
      <Input label="Số tiền" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
        Loại giao dịch
        <Select value={intent} options={[{ value: 'deposit_request', label: 'Đặt cọc' }, { value: 'buy', label: 'Mua đứt' }]} onChange={setIntent} />
      </label>
      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="sm" disabled={createTransaction.isPending} onClick={submit}>
          {createTransaction.isPending ? 'Đang tạo...' : 'Tạo giao dịch'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminTransactions({ notify, filterContactRequestId }) {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const { data, isLoading } = useAdminTransactions({ status, page, limit: 20 });
  const confirmPayment = useConfirmTransactionPayment();

  const items = (data?.items || []).filter((t) => !filterContactRequestId || t.contactRequestId === filterContactRequestId);
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / (data?.limit || 20)));

  const submitConfirm = async () => {
    try {
      await confirmPayment.mutateAsync({ id: confirmTarget.id, proofUrl: proofUrl || undefined });
      notify('Đã xác nhận thanh toán');
      setConfirmTarget(null);
      setProofUrl('');
    } catch (e) {
      notify(e.message || 'Xác nhận thất bại');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Trạng thái:</span>
          <Select value={status} options={STATUS_OPTS} onChange={(v) => { setStatus(v); setPage(1); }} variant="pill" />
        </div>
        <span style={{ flex: 1, font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'right' }}>{total} giao dịch</span>
        <Button variant="primary" size="md" onClick={() => setCreating(true)}>Tạo giao dịch</Button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : items.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có giao dịch nào.</div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 680 }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                <span style={{ flex: '1 1 100px' }}>Khách</span>
                <span style={{ flex: '1 1 100px' }}>Biển số</span>
                <span style={{ flex: '1 1 90px' }}>Số tiền</span>
                <span style={{ flex: '1 1 80px' }}>Loại</span>
                <span style={{ flex: '1 1 90px' }}>CTV</span>
                <span style={{ flex: '1 1 140px' }}>Trạng thái</span>
              </div>
              {items.map((t) => (
                <div key={t.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', font: 'var(--type-body-sm)' }}>
                  <span style={{ flex: '1 1 100px' }}>
                    <div>{t.fullName}</div>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{t.phone}</div>
                  </span>
                  <span style={{ flex: '1 1 100px' }}>{t.plateNumber || '—'}</span>
                  <span style={{ flex: '1 1 90px', fontWeight: 'var(--fw-semibold)' }}>{money(t.amount)}</span>
                  <span style={{ flex: '1 1 80px' }}>{INTENT_LABEL[t.intent] || t.intent}</span>
                  <span style={{ flex: '1 1 90px', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{t.referralCodeUsed || '—'}</span>
                  <span style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge tone={t.status === 'payment_confirmed' ? 'mint' : t.status === 'cancelled' ? 'neutral' : 'orange'}>
                      {STATUS_LABEL[t.status] || t.status}
                    </Badge>
                    {t.status === 'payment_confirmed' && (
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                        {t.paymentConfirmedVia === 'zalopay_webhook' ? 'ZaloPay' : 'Thủ công'}
                      </span>
                    )}
                    {t.status === 'pending' && (
                      <Button variant="outline" size="sm" onClick={() => { setConfirmTarget(t); setProofUrl(''); }}>Xác nhận đã nhận tiền</Button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ minWidth: 32, height: 32, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page <= 1 ? 'var(--text-faint)' : 'var(--text-body)', cursor: page <= 1 ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }}>‹</button>
          <span style={{ font: 'var(--type-body-sm)' }}>{page}/{totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{ minWidth: 32, height: 32, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--white)', color: page >= totalPages ? 'var(--text-faint)' : 'var(--text-body)', cursor: page >= totalPages ? 'default' : 'pointer', boxShadow: 'var(--shadow-inset-hairline)' }}>›</button>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Tạo giao dịch" maxWidth="480px">
        <CreateTransactionForm notify={notify} onDone={() => setCreating(false)} />
      </Modal>

      <Modal open={!!confirmTarget} onClose={() => setConfirmTarget(null)} title="Xác nhận đã nhận tiền" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Giao dịch {confirmTarget?.fullName} — {money(confirmTarget?.amount)}
          </span>
          <ImageUrlInput label="Ảnh minh chứng (không bắt buộc)" value={proofUrl} onChange={setProofUrl} />
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => setConfirmTarget(null)}>Hủy</Button>
            <Button variant="primary" size="sm" disabled={confirmPayment.isPending} onClick={submitConfirm}>
              {confirmPayment.isPending ? 'Đang xác nhận...' : 'Xác nhận'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
