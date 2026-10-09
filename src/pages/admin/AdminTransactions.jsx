import { useState, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  Search,
  Copy,
  X,
  Clock,
  CheckCircle2,
  Wallet,
  Download,
  Phone,
  MessageCircle,
  Plus,
} from 'lucide-react';
import {
  useAdminTransactions,
  useCreateTransaction,
  useConfirmTransactionPayment,
  useDeleteTransaction,
  useDeletedTransactions,
  useRestoreTransaction,
} from '../../services/adminTransactions.js';
import { usePlates } from '../../services/plates.js';
import { Select, Input, Badge, ImageUrlInput } from '../../components/index.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import Modal from '../../components/Modal.jsx';
import Drawer from '../../components/Drawer.jsx';
import Button from '../../components/Button.jsx';
import PlateVisual from '../../components/PlateVisual.jsx';
import { parsePlateNumber } from '../../lib/plateFormat.js';
import { formatDateTime, formatDate } from '../../lib/date.js';
import { toZaloUrl } from '../../lib/zaloMessage.js';

const STATUS_OPTS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'payment_confirmed', label: 'Đã xác nhận' },
  { value: 'cancelled', label: 'Đã hủy' },
];
const STATUS_LABEL = { pending: 'Chờ thanh toán', payment_confirmed: 'Đã xác nhận', cancelled: 'Đã hủy' };
const INTENT_LABEL = { deposit_request: 'Đặt cọc', buy: 'Mua đứt' };
const COMMISSION_STATUS_LABEL = { pending: 'Chờ duyệt', approved: 'Đã duyệt', paid: 'Đã trả', cancelled: 'Đã hủy' };
const COMMISSION_STATUS_TONE = { pending: 'orange', approved: 'mint', paid: 'mint', cancelled: 'neutral' };
const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

const daysLeftInTrash = (deletedAt) => {
  if (!deletedAt) return null;
  const elapsedMs = Date.now() - new Date(deletedAt).getTime();
  return Math.max(0, 30 - Math.floor(elapsedMs / 86400000));
};

const ctvBankInfo = (t) => {
  if (!t.ctvName) return undefined;
  const parts = [t.ctvName];
  if (t.ctvBankAccountHolder) parts.push(`Chủ TK: ${t.ctvBankAccountHolder}`);
  if (t.ctvBankAccount) parts.push(`STK: ${t.ctvBankAccount}`);
  if (t.ctvBankCode) parts.push(`Ngân hàng: ${t.ctvBankCode}`);
  return parts.join(' — ');
};

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
            <div style={{ position: 'absolute', zIndex: 10, top: '100%', left: 0, right: 0, background: 'var(--white)', boxShadow: 'var(--shadow-4)', borderRadius: 'var(--radius-field)', maxHeight: 220, overflowY: 'auto' }}>
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
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [detailTx, setDetailTx] = useState(null);

  const { data, isLoading, isError, refetch } = useAdminTransactions({ status, page, limit: 50 });
  const confirmPayment = useConfirmTransactionPayment();
  const deleteTransaction = useDeleteTransaction();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { data: deletedData, isLoading: deletedLoading } = useDeletedTransactions({ page: 1, limit: 20 });
  const restoreTransaction = useRestoreTransaction();
  const deletedItems = deletedData?.items || [];

  const rawItems = (data?.items || []).filter((t) => !filterContactRequestId || t.contactRequestId === filterContactRequestId);

  // Lọc tìm kiếm & ngày
  const items = useMemo(() => {
    let list = rawItems;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) =>
        (t.fullName && t.fullName.toLowerCase().includes(q)) ||
        (t.phone && t.phone.includes(q)) ||
        (t.plateNumber && t.plateNumber.toLowerCase().includes(q)) ||
        (t.ctvName && t.ctvName.toLowerCase().includes(q))
      );
    }
    if (fromDate) {
      const start = new Date(fromDate).getTime();
      list = list.filter((t) => new Date(t.createdAt).getTime() >= start);
    }
    if (toDate) {
      const end = new Date(toDate).getTime() + 86400000;
      list = list.filter((t) => new Date(t.createdAt).getTime() <= end);
    }
    return list;
  }, [rawItems, search, fromDate, toDate]);

  // Thống kê nhanh số tiền
  const kpis = useMemo(() => {
    let pendingSum = 0;
    let pendingCnt = 0;
    let confirmedSum = 0;
    let confirmedCnt = 0;
    rawItems.forEach((t) => {
      const val = Number(t.amount) || 0;
      if (t.status === 'pending') {
        pendingSum += val;
        pendingCnt++;
      } else if (t.status === 'payment_confirmed') {
        confirmedSum += val;
        confirmedCnt++;
      }
    });
    return { pendingSum, pendingCnt, confirmedSum, confirmedCnt };
  }, [rawItems]);

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

  const submitDelete = async () => {
    try {
      await deleteTransaction.mutateAsync(deleteTarget.id);
      notify('Đã chuyển vào Thùng rác — có thể khôi phục trong 30 ngày');
      setDeleteTarget(null);
    } catch (e) {
      notify(e.message || 'Xóa thất bại');
    }
  };

  const handleRestore = async (t) => {
    if (!window.confirm(`Khôi phục giao dịch của ${t.fullName}? Giao dịch sẽ trở lại danh sách.`)) return;
    try {
      await restoreTransaction.mutateAsync(t.id);
      notify('Đã khôi phục giao dịch');
    } catch (e) {
      notify(e.message || 'Khôi phục thất bại', 'error');
    }
  };

  const copyText = (e, text, msg) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    notify(msg || `Đã sao chép ${text}`);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setFromDate('');
    setToDate('');
  };

  const hasFilter = search.trim() || status !== 'all' || fromDate || toDate;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 1. Hàng KPI tổng tiền giao dịch */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'var(--space-2)' }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-card)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-pill)', background: 'var(--brand-50, #fff7ed)', color: 'var(--action-primary, #C75B00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Chờ xác nhận tiền ({kpis.pendingCnt})</span>
            <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', fontSize: '16px', color: 'var(--action-primary, #C75B00)' }}>
              {money(kpis.pendingSum)}
            </span>
          </div>
        </div>

        <div style={{ background: 'var(--white)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-card)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-pill)', background: 'var(--mint-50, #ecfdf5)', color: 'var(--status-success-ink, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Đã xác nhận thanh toán ({kpis.confirmedCnt})</span>
            <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', fontSize: '16px', color: 'var(--status-success-ink, #059669)' }}>
              {money(kpis.confirmedSum)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Thanh tìm kiếm và bộ lọc */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          alignItems: 'center',
          background: 'var(--white)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-hairline)',
          boxShadow: 'var(--shadow-inset-hairline)',
        }}
      >
        <div style={{ position: 'relative', minWidth: 200, flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên khách, SĐT, biển số, CTV…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: 36,
              padding: '0 12px 0 32px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--grey-200)',
              font: 'var(--type-body-sm)',
              color: 'var(--text-body)',
              background: 'var(--white)',
              outline: 'none',
            }}
          />
        </div>

        <Select value={status} options={STATUS_OPTS} onChange={(v) => { setStatus(v); setPage(1); }} variant="pill" />

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          <span>Từ:</span>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ height: 34, border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', padding: '0 8px', font: 'var(--type-caption)' }} />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          <span>Đến:</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ height: 34, border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', padding: '0 8px', font: 'var(--type-caption)' }} />
        </label>

        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={clearFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <X size={13} /> Xóa lọc
          </Button>
        )}

        <div style={{ flex: 1 }} />

        <Button variant="primary" size="md" onClick={() => setCreating(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> Tạo giao dịch
        </Button>
      </div>

      {/* 3. Danh sách giao dịch */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : isError ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>
          Lỗi tải danh sách giao dịch.{' '}
          <button type="button" onClick={() => refetch()} style={{ font: 'var(--type-caption)', color: 'var(--link)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Thử lại</button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Không có giao dịch nào khớp bộ lọc.</div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden', border: '1px solid var(--border-hairline)' }}>
          <div className="admin-table-scroll" style={{ overflowX: 'auto' }}>
            <div className="admin-rows" style={{ minWidth: 840 }}>
              <div className="admin-head" style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                <span style={{ flex: '1 1 120px' }}>Khách hàng</span>
                <span style={{ flex: '1 1 100px' }}>Biển số</span>
                <span style={{ flex: '1 1 90px' }}>Số tiền</span>
                <span style={{ flex: '1 1 70px' }}>Loại</span>
                <span style={{ flex: '1 1 100px' }}>Cộng tác viên</span>
                <span style={{ flex: '1 1 110px' }}>Hoa hồng</span>
                <span style={{ flex: '1 1 150px' }}>Trạng thái</span>
                <span style={{ flex: '0 0 90px', textAlign: 'right' }}>Thao tác</span>
              </div>
              {items.map((t) => (
                <div
                  className="admin-row"
                  key={t.id}
                  onClick={() => setDetailTx(t)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setDetailTx(t); } }}
                  title="Xem chi tiết giao dịch"
                  style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', font: 'var(--type-body-sm)', cursor: 'pointer' }}
                >
                  <span data-primary data-label="Khách" style={{ flex: '1 1 120px' }}>
                    <div style={{ fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>{t.fullName}</div>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{t.phone}</span>
                      <button type="button" title="Sao chép SĐT" onClick={(e) => copyText(e, t.phone, 'Đã sao chép SĐT')} style={{ border: 'none', background: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <Copy size={11} />
                      </button>
                      <a href={`tel:${t.phone}`} title="Gọi" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--action-primary)' }}><Phone size={12} /></a>
                      <a href={toZaloUrl(t.phone)} target="_blank" rel="noreferrer" title="Zalo" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--blue-700)' }}><MessageCircle size={12} /></a>
                    </div>
                  </span>

                  <span data-label="Biển số" style={{ flex: '1 1 100px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)' }}>{t.plateNumber || '—'}</span>
                    {t.plateNumber && (
                      <button type="button" title="Sao chép biển" onClick={(e) => copyText(e, t.plateNumber, 'Đã sao chép số biển')} style={{ border: 'none', background: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <Copy size={11} />
                      </button>
                    )}
                  </span>

                  <span data-label="Số tiền" style={{ flex: '1 1 90px', fontWeight: 'var(--fw-bold)', color: 'var(--status-success-ink, #059669)' }}>
                    {money(t.amount)}
                  </span>

                  <span data-label="Loại" style={{ flex: '1 1 70px' }}>
                    <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontSize: '11px', background: 'var(--surface-sunken)', color: 'var(--text-body)' }}>
                      {INTENT_LABEL[t.intent] || t.intent}
                    </span>
                  </span>

                  <span data-label="CTV" style={{ flex: '1 1 100px' }}>
                    {t.ctvName ? (
                      <span title={ctvBankInfo(t)} style={{ display: 'block', cursor: 'help' }}>
                        <div style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{t.ctvName}</div>
                        <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{t.ctvPhone}</div>
                      </span>
                    ) : (
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{t.referralCodeUsed || '—'}</span>
                    )}
                  </span>

                  <span data-label="Hoa hồng" style={{ flex: '1 1 110px' }}>
                    {t.commissionAmount != null ? (
                      <span title={ctvBankInfo(t)} style={{ display: 'flex', flexDirection: 'column', gap: 2, cursor: t.ctvBankAccount ? 'help' : 'default' }}>
                        <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{money(t.commissionAmount)}</span>
                        <Badge tone={COMMISSION_STATUS_TONE[t.commissionStatus] || 'neutral'}>{COMMISSION_STATUS_LABEL[t.commissionStatus] || t.commissionStatus}</Badge>
                      </span>
                    ) : (
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>—</span>
                    )}
                  </span>

                  <span data-label="Trạng thái" style={{ flex: '1 1 150px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Badge tone={t.status === 'payment_confirmed' ? 'mint' : t.status === 'cancelled' ? 'neutral' : 'orange'}>
                      {STATUS_LABEL[t.status] || t.status}
                    </Badge>
                    {t.status === 'payment_confirmed' && (
                      <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', fontSize: '11px' }}>
                        {t.paymentConfirmedVia === 'zalopay_webhook' ? 'ZaloPay' : 'Thủ công'}
                      </span>
                    )}
                  </span>

                  <span data-label="Thao tác" style={{ flex: '0 0 90px', display: 'flex', justifyContent: 'flex-end', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                    {t.status === 'pending' && (
                      <Button variant="primary" size="sm" onClick={() => { setConfirmTarget(t); setProofUrl(''); }}>
                        Xác nhận
                      </Button>
                    )}
                    {t.status === 'pending' && (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(t)} style={{ color: 'var(--status-danger)' }}>
                        Xóa
                      </Button>
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

      {(deletedLoading || deletedItems.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h3 style={{ margin: 0, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)' }}>
            Giao dịch đã xóa {deletedItems.length > 0 && `(${deletedItems.length})`}
          </h3>
          {deletedLoading ? (
            <SkeletonTable rows={2} cols={4} />
          ) : (
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
              {deletedItems.map((t) => {
                const daysLeft = daysLeftInTrash(t.deletedAt);
                return (
                  <div key={t.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--grey-200)', font: 'var(--type-body-sm)', opacity: 0.75 }}>
                    <span style={{ flex: '1 1 100px' }}>
                      <div>{t.fullName}</div>
                      <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{t.phone}</div>
                    </span>
                    <span style={{ flex: '1 1 100px' }}>{t.plateNumber || '—'}</span>
                    <span style={{ flex: '1 1 90px', fontWeight: 'var(--fw-semibold)' }}>{money(t.amount)}</span>
                    <span style={{ flex: '1 1 140px', font: 'var(--type-caption)', color: 'var(--status-danger)' }}>
                      {daysLeft === 0 ? 'Xóa vĩnh viễn hôm nay' : `Tự xóa sau ${daysLeft} ngày`}
                    </span>
                    <Button variant="outline" size="sm" disabled={restoreTransaction.isPending} onClick={() => handleRestore(t)}>Khôi phục</Button>
                  </div>
                );
              })}
            </div>
          )}
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

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xóa giao dịch" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Chuyển giao dịch {deleteTarget?.fullName} — {money(deleteTarget?.amount)} vào Thùng rác? Có thể khôi phục trong 30 ngày, sau đó tự xóa vĩnh viễn.
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant="primary" size="sm" disabled={deleteTransaction.isPending} onClick={submitDelete} style={{ background: 'var(--status-danger)' }}>
              {deleteTransaction.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </div>
        </div>
      </Modal>

      <Drawer open={!!detailTx} onClose={() => setDetailTx(null)} title="Chi tiết giao dịch" width="min(52%, 720px)">
        {detailTx && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{detailTx.fullName}</span>
                <a href={`tel:${detailTx.phone}`} style={{ font: 'var(--type-body-sm)', color: 'var(--text-link)', textDecoration: 'none' }}>{detailTx.phone}</a>
              </div>
              <Badge tone={detailTx.status === 'payment_confirmed' ? 'mint' : detailTx.status === 'cancelled' ? 'neutral' : 'orange'}>
                {STATUS_LABEL[detailTx.status] || detailTx.status}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Biển số</span>
                {detailTx.plateNumber ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <PlateVisual size="sm" {...(parsePlateNumber(detailTx.plateNumber) || {})} />
                    <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{detailTx.plateNumber}</span>
                  </span>
                ) : <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-faint)' }}>—</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Số tiền</span>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{money(detailTx.amount)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Loại giao dịch</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{INTENT_LABEL[detailTx.intent] || detailTx.intent}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Kênh xác nhận</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
                  {detailTx.status === 'payment_confirmed' ? (detailTx.paymentConfirmedVia === 'zalopay_webhook' ? 'ZaloPay' : 'Thủ công') : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Xác nhận lúc</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{detailTx.paymentConfirmedAt ? formatDateTime(detailTx.paymentConfirmedAt) : '—'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Ngày tạo</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>{detailTx.createdAt ? formatDateTime(detailTx.createdAt) : '—'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Ảnh minh chứng thanh toán</span>
              {detailTx.paymentProofUrl ? (
                <a href={detailTx.paymentProofUrl} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                  <img src={detailTx.paymentProofUrl} alt="Ảnh minh chứng thanh toán"
                    style={{ width: '100%', maxWidth: 420, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-inset-hairline)', display: 'block' }} />
                </a>
              ) : <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-faint)' }}>Không có ảnh minh chứng</span>}
            </div>

            {detailTx.ctvName && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)' }}>
                <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Hoa hồng CTV</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{detailTx.ctvName} — {money(detailTx.commissionAmount)}</span>
                {detailTx.commissionStatus && <Badge tone={COMMISSION_STATUS_TONE[detailTx.commissionStatus] || 'neutral'}>{COMMISSION_STATUS_LABEL[detailTx.commissionStatus] || detailTx.commissionStatus}</Badge>}
                {(detailTx.ctvBankAccount || detailTx.ctvBankAccountHolder) && (
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    {[detailTx.ctvBankAccountHolder && `Chủ TK ${detailTx.ctvBankAccountHolder}`, detailTx.ctvBankAccount && `STK ${detailTx.ctvBankAccount}${detailTx.ctvBankCode ? ` · ${detailTx.ctvBankCode}` : ''}`].filter(Boolean).join(' — ')}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
