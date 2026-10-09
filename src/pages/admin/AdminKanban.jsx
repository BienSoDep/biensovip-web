import { useEffect, useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  Phone,
  MessageCircle,
  Copy,
  Search,
  Filter,
  X,
  User,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAdminContacts, useUpdateContactStatus } from '../../services/adminContacts.js';
import {
  useAdminTransactions,
  useConfirmTransactionPayment,
  usePayCommission,
} from '../../services/adminTransactions.js';
import { useStaffLite } from '../../services/adminStaff.js';
import { formatDateTime } from '../../lib/date.js';
import { toZaloUrl } from '../../lib/zaloMessage.js';
import Modal from '../../components/Modal.jsx';
import Button from '../../components/Button.jsx';
import { Badge, ImageUrlInput, Select } from '../../components/index.jsx';

const COLUMNS = [
  { key: 'new', kind: 'contact', label: 'Mới', tint: 'var(--kanban-1-tint)', ink: 'var(--kanban-1-ink)', edge: 'var(--kanban-1-edge)' },
  { key: 'consulting', kind: 'contact', label: 'Đang tư vấn', tint: 'var(--kanban-2-tint)', ink: 'var(--kanban-2-ink)', edge: 'var(--kanban-2-edge)' },
  { key: 'closed', kind: 'contact', label: 'Đã chốt', tint: 'var(--kanban-3-tint)', ink: 'var(--kanban-3-ink)', edge: 'var(--kanban-3-edge)' },
  { key: 'pending', kind: 'tx', label: 'Chờ thanh toán', tint: 'var(--kanban-4-tint)', ink: 'var(--kanban-4-ink)', edge: 'var(--kanban-4-edge)' },
  { key: 'payment_confirmed', kind: 'tx', label: 'Đã xác nhận', tint: 'var(--kanban-5-tint)', ink: 'var(--kanban-5-ink)', edge: 'var(--kanban-5-edge)' },
];

const STATUS_KEYS = COLUMNS.filter((c) => c.kind === 'contact').map((c) => c.key);
const INTENT_LABEL = { inquiry: 'Hỏi chung', deposit_request: 'Đặt cọc', buy: 'Mua đứt', hunting: 'Săn hộ' };
const VND = new Intl.NumberFormat('vi-VN');

function Card({ item, dragging, onClick, edge, onQuickMove, onConfirm, confirming, onCopy }) {
  const initialLetter = (item.fullName || 'K').trim().charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      title={onClick ? 'Bấm để xem chi tiết' : undefined}
      style={{
        background: 'var(--white)',
        borderLeft: edge ? `3.5px solid ${edge}` : undefined,
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-1)',
        border: '1px solid var(--border-hairline)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: onClick ? 'pointer' : onConfirm ? 'default' : 'grab',
        opacity: dragging ? 0.45 : 1,
        transition: 'transform 120ms ease, box-shadow 120ms ease',
      }}
    >
      {/* Header: Avatar + Tên khách + Mục đích */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--brand-50, #fff7ed)',
              color: 'var(--action-primary, #C75B00)',
              fontWeight: 'var(--fw-bold)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {initialLetter}
          </div>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                font: 'var(--type-body-sm)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--text-strong)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.fullName}
            </span>
            {item.createdAt && (
              <span style={{ font: 'var(--type-caption)', fontSize: '10px', color: 'var(--text-faint)' }}>
                {formatDateTime(item.createdAt).slice(0, 16)}
              </span>
            )}
          </div>
        </div>

        {item.intent && (
          <span
            style={{
              font: 'var(--type-caption)',
              fontSize: '10px',
              fontWeight: 'var(--fw-semibold)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-pill)',
              background: item.intent === 'deposit_request' ? '#ffedd5' : 'var(--surface-sunken)',
              color: item.intent === 'deposit_request' ? '#c2410c' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {INTENT_LABEL[item.intent] || item.intent}
          </span>
        )}
      </div>

      {/* SĐT + Nút Gọi & Zalo 1-click */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, background: 'var(--surface-sunken)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
            {item.phone}
          </span>
          {onCopy && (
            <button
              type="button"
              title="Sao chép SĐT"
              onClick={(e) => onCopy(e, item.phone, 'Đã sao chép số điện thoại')}
              style={{ border: 'none', background: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <Copy size={11} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <a
            href={`tel:${item.phone}`}
            title="Gọi ngay"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: 'var(--radius-pill)',
              background: '#ecfdf5',
              color: '#059669',
              textDecoration: 'none',
            }}
          >
            <Phone size={11} />
          </a>
          <a
            href={toZaloUrl(item.phone)}
            target="_blank"
            rel="noreferrer"
            title="Nhắn Zalo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: 'var(--radius-pill)',
              background: '#eff6ff',
              color: '#2563eb',
              textDecoration: 'none',
            }}
          >
            <MessageCircle size={11} />
          </a>
        </div>
      </div>

      {/* Biển số quan tâm / giao dịch */}
      {item.plateNumber && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Biển:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--action-primary)' }}>
              {item.plateNumber}
            </span>
            {onCopy && (
              <button
                type="button"
                title="Sao chép số biển"
                onClick={(e) => onCopy(e, item.plateNumber, 'Đã sao chép số biển')}
                style={{ border: 'none', background: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <Copy size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tiền giao dịch nếu có */}
      {item.amount != null && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, borderTop: '1px dashed var(--grey-200)', paddingTop: 4 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontSize: '11px' }}>Số tiền:</span>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--status-success-ink, #059669)' }}>
            {VND.format(item.amount)} đ
          </span>
        </div>
      )}

      {/* Nhân viên phụ trách */}
      {item.assignedStaffName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--text-muted)' }}>
          <User size={11} />
          <span>{item.assignedStaffName}</span>
        </div>
      )}

      {/* Nút hành động trực tiếp */}
      {onQuickMove && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onQuickMove(); }}
          style={{
            marginTop: 2,
            width: '100%',
            border: `1px solid ${edge || 'var(--grey-200)'}`,
            background: 'var(--white)',
            borderRadius: 'var(--radius-field)',
            padding: '5px 8px',
            font: 'var(--type-caption)',
            fontWeight: 'var(--fw-medium)',
            color: 'var(--text-body)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <span>Đổi giai đoạn</span> <ArrowRight size={12} />
        </button>
      )}

      {onConfirm && (
        <button
          type="button"
          disabled={confirming}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onConfirm(); }}
          style={{
            marginTop: 2,
            width: '100%',
            border: 'none',
            background: 'var(--action-primary)',
            color: 'var(--white)',
            borderRadius: 'var(--radius-field)',
            padding: '6px 8px',
            font: 'var(--type-caption)',
            fontWeight: 'var(--fw-semibold)',
            cursor: confirming ? 'wait' : 'pointer',
            opacity: confirming ? 0.6 : 1,
          }}
        >
          {confirming ? 'Đang xác nhận…' : '✓ Xác nhận đã nhận tiền'}
        </button>
      )}
    </div>
  );
}

function DraggableCard({ item, onOpen, edge, onQuickMove, overlay, onCopy }) {
  const drag = useDraggable({ id: item.id });
  const bind = overlay ? {} : { ...drag.attributes, ...drag.listeners };
  return (
    <div ref={overlay ? undefined : drag.setNodeRef} {...bind} style={{ touchAction: 'none' }}>
      <Card item={item} dragging={!overlay && drag.isDragging} onClick={onOpen} edge={edge} onQuickMove={onQuickMove} onCopy={onCopy} />
    </div>
  );
}

function Column({ col, children, count, style }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      data-kanban-col
      style={{
        flex: '1 1 250px',
        minWidth: 230,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        background: isOver ? col.tint : 'var(--surface-sunken)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-3)',
        transition: 'all 140ms ease',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2.5px solid ${col.edge}`, paddingBottom: '8px' }}>
        <span style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-bold)', color: col.ink, fontSize: '14px' }}>
          {col.label}
        </span>
        <span
          style={{
            font: 'var(--type-caption)',
            fontWeight: 'var(--fw-bold)',
            color: col.ink,
            background: col.tint,
            padding: '2px 8px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '11px',
          }}
        >
          {count}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minHeight: 80 }}>
        {count === 0 ? (
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', padding: 'var(--space-3) 0', textAlign: 'center' }}>
            Trống
          </span>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function columnStepGetter(event, { currentCoordinates }) {
  const first = document.querySelector('[data-kanban-col]');
  const step = first ? first.getBoundingClientRect().width + 12 : 240;
  switch (event.code) {
    case 'ArrowRight': return { ...currentCoordinates, x: currentCoordinates.x + step };
    case 'ArrowLeft': return { ...currentCoordinates, x: currentCoordinates.x - step };
    case 'ArrowDown': return { ...currentCoordinates, y: currentCoordinates.y + 60 };
    case 'ArrowUp': return { ...currentCoordinates, y: currentCoordinates.y - 60 };
    default: return undefined;
  }
}

const STATUS_LABEL = { new: 'Mới', consulting: 'Đang tư vấn', closed: 'Đã chốt', found: 'Đã chốt', cancelled: 'Đã hủy' };
const COMMISSION_STATUS_LABEL = { pending: 'Chờ duyệt', approved: 'Đã duyệt', paid: 'Đã trả', cancelled: 'Đã hủy' };
const COMMISSION_STATUS_TONE = { pending: 'orange', approved: 'mint', paid: 'mint', cancelled: 'neutral' };

function Row({ label, children }) {
  if (children == null || children === '') return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{children}</span>
    </div>
  );
}

function DetailModal({ item, kind, onClose, onQuickMove, nextLabel, updateStatus, onConfirm, confirming, onOpenFull, proofUrl, onProofChange, onPayCommission, paying }) {
  if (!item) return null;
  const isTx = kind === 'tx';
  const canPayCommission = isTx && item.commissionId && item.commissionStatus === 'approved' && item.ctvId;

  return (
    <Modal open onClose={onClose} title={item.fullName || 'Chi tiết'} maxWidth="520px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Row label="Điện thoại">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href={`tel:${item.phone}`} style={{ color: 'var(--text-link)', textDecoration: 'none', fontWeight: 'var(--fw-bold)' }}>{item.phone}</a>
            <a href={toZaloUrl(item.phone)} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2563eb' }}>Chat Zalo ↗</a>
          </div>
        </Row>
        <Row label={isTx ? 'Biển giao dịch' : 'Biển quan tâm'}>{item.plateNumber || (isTx ? '—' : 'Khách hỏi chung, không có biển cụ thể')}</Row>
        {isTx && <Row label="Số tiền">{item.amount != null ? `${VND.format(item.amount)} đ` : '—'}</Row>}
        {item.intent && <Row label="Mục đích">{INTENT_LABEL[item.intent] || item.intent}</Row>}
        <Row label="Trạng thái">{isTx ? (item.status === 'pending' ? 'Chờ thanh toán' : 'Đã xác nhận thanh toán') : (STATUS_LABEL[item.status] || item.status)}</Row>
        {isTx && item.paymentConfirmedAt && <Row label="Xác nhận lúc">{formatDateTime(item.paymentConfirmedAt)}{item.paymentConfirmedVia === 'zalopay_webhook' ? ' · ZaloPay' : ' · thủ công'}</Row>}
        {item.createdAt && <Row label={isTx ? 'Ngày tạo giao dịch' : 'Thời gian gửi'}>{formatDateTime(item.createdAt)}</Row>}

        {isTx && (
          <Row label="Hoa hồng CTV">
            {item.commissionAmount != null ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'var(--fw-semibold)' }}>{VND.format(item.commissionAmount)} đ</span>
                <Badge tone={COMMISSION_STATUS_TONE[item.commissionStatus] || 'neutral'}>{COMMISSION_STATUS_LABEL[item.commissionStatus] || item.commissionStatus}</Badge>
                {item.ctvName && <span style={{ color: 'var(--text-muted)' }}>· {item.ctvName}</span>}
              </span>
            ) : (item.ctvName ? `${item.ctvName} · chưa phát sinh hoa hồng` : 'Không qua CTV')}
          </Row>
        )}

        {!isTx && <Row label="Người phụ trách">{item.assignedStaffName || 'Chưa gán'}</Row>}
        {!isTx && item.note && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Ghi chú yêu cầu</span>
            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>{item.note}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          {!isTx && nextLabel && (
            <Button variant="outline" disabled={updateStatus.isPending} onClick={() => onQuickMove(item)}>
              {updateStatus.isPending ? 'Đang cập nhật…' : `Chuyển sang "${nextLabel}"`}
            </Button>
          )}
          {isTx && item.status === 'pending' && (
            <>
              <ImageUrlInput label="Ảnh minh chứng (không bắt buộc)" value={proofUrl} onChange={onProofChange} />
              <Button variant="primary" disabled={confirming} onClick={() => onConfirm(item)}>
                {confirming ? 'Đang xác nhận…' : 'Xác nhận đã nhận tiền'}
              </Button>
            </>
          )}
          {canPayCommission && (
            <Button variant="outline" disabled={paying} onClick={() => onPayCommission(item)}>
              {paying ? 'Đang chi trả…' : `Chi trả hoa hồng ${VND.format(item.commissionAmount)} đ`}
            </Button>
          )}
          {onOpenFull && <Button variant="ghost" onClick={() => { onClose(); onOpenFull(item); }}>Mở chi tiết đầy đủ →</Button>}
        </div>
      </div>
    </Modal>
  );
}

function useNarrow() {
  const [narrow, setNarrow] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia('(max-width: 768px)').matches));
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const on = (e) => setNarrow(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

const NEXT_STATUS = { new: 'consulting', consulting: 'closed', found: 'closed', cancelled: 'closed' };

export default function AdminKanban({ notify, go, onOpenContact }) {
  const { data, isLoading } = useAdminContacts({ page: 1, perPage: 100 });
  const { data: txData } = useAdminTransactions({ page: 1, limit: 100 });
  const { data: staffData } = useStaffLite();
  const staffList = staffData?.items || [];

  const updateStatus = useUpdateContactStatus();
  const confirmPayment = useConfirmTransactionPayment();
  const payCommission = usePayCommission();

  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const narrow = useNarrow();
  const [mobileCol, setMobileCol] = useState('new');

  // Search & Filters on Kanban
  const [searchQ, setSearchQ] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [intentFilter, setIntentFilter] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnStepGetter }),
  );

  const contacts = data?.items || [];
  const transactions = txData?.items || [];

  // Lọc contact theo từ khóa, nhân viên và mục đích
  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      list = list.filter((c) =>
        (c.fullName && c.fullName.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.plateNumber && c.plateNumber.toLowerCase().includes(q))
      );
    }
    if (staffFilter) {
      if (staffFilter === 'unassigned') list = list.filter((c) => !c.assignedStaffId);
      else list = list.filter((c) => c.assignedStaffId === staffFilter);
    }
    if (intentFilter) {
      list = list.filter((c) => c.intent === intentFilter);
    }
    return list;
  }, [contacts, searchQ, staffFilter, intentFilter]);

  // Lọc giao dịch theo từ khóa và mục đích
  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      list = list.filter((t) =>
        (t.fullName && t.fullName.toLowerCase().includes(q)) ||
        (t.phone && t.phone.includes(q)) ||
        (t.plateNumber && t.plateNumber.toLowerCase().includes(q)) ||
        (t.ctvName && t.ctvName.toLowerCase().includes(q))
      );
    }
    if (intentFilter) {
      list = list.filter((t) => t.intent === intentFilter);
    }
    return list;
  }, [transactions, searchQ, intentFilter]);

  const byStatus = (key) => filteredContacts.filter((c) => c.status === key);
  const txByStatus = (key) => filteredTransactions.filter((t) => t.status === key);
  const activeItem = contacts.find((c) => c.id === activeId);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || !STATUS_KEYS.includes(over.id)) return;
    const contact = contacts.find((c) => c.id === active.id);
    if (!contact || contact.status === over.id) return;
    updateStatus.mutate({ id: contact.id, status: over.id }, {
      onError: () => notify?.('Không đổi được trạng thái, thử lại sau.', 'error'),
    });
  };

  const openDetail = (item, kind) => { setDetail({ item, kind }); setProofUrl(''); };
  const openFullContact = (c) => (onOpenContact ? onOpenContact(c) : go?.('acontacts')());
  const quickMove = (c) => {
    const next = NEXT_STATUS[c.status];
    if (!next) return;
    updateStatus.mutate({ id: c.id, status: next }, {
      onError: () => notify?.('Không đổi được trạng thái, thử lại sau.', 'error'),
      onSuccess: () => setDetail((d) => (d?.item.id === c.id ? { ...d, item: { ...d.item, status: next } } : d)),
    });
  };

  const askConfirm = (t) => {
    confirmPayment.mutate({ id: t.id, proofUrl: proofUrl || undefined }, {
      onError: (err) => notify?.(err?.message || 'Không xác nhận được thanh toán.', 'error'),
      onSuccess: () => { setDetail(null); setProofUrl(''); },
    });
  };

  const askPayCommission = (t) => {
    payCommission.mutate({ ctvId: t.ctvId, commissionIds: [t.commissionId], paidAmount: t.commissionAmount }, {
      onError: (err) => notify?.(err?.message || 'Không chi trả được hoa hồng.', 'error'),
      onSuccess: () => { notify?.('Đã chi trả hoa hồng', 'success'); setDetail(null); },
    });
  };

  const copyText = (e, text, msg) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    notify?.(msg || `Đã sao chép ${text}`);
  };

  const clearFilters = () => {
    setSearchQ('');
    setStaffFilter('');
    setIntentFilter('');
  };

  const hasFilters = !!(searchQ.trim() || staffFilter || intentFilter);

  const detailFor = () => (
    <DetailModal
      item={detail?.item} kind={detail?.kind} onClose={() => setDetail(null)}
      onQuickMove={quickMove} nextLabel={detail ? STATUS_LABEL[NEXT_STATUS[detail.item.status]] : undefined}
      updateStatus={updateStatus} onConfirm={askConfirm}
      confirming={confirmPayment.isPending && confirmPayment.variables?.id === detail?.item?.id}
      onOpenFull={detail?.kind === 'contact' ? openFullContact : undefined}
      proofUrl={proofUrl} onProofChange={setProofUrl}
      onPayCommission={askPayCommission}
      paying={payCommission.isPending && payCommission.variables?.commissionIds?.[0] === detail?.item?.commissionId}
    />
  );

  const renderColumn = (col, style) => {
    if (col.kind === 'tx') {
      const items = txByStatus(col.key);
      return (
        <Column key={col.key} col={col} count={items.length} style={style}>
          {items.map((t) => (
            <Card
              key={t.id}
              item={t}
              edge={col.edge}
              onClick={() => openDetail(t, 'tx')}
              onConfirm={col.key === 'pending' ? () => askConfirm(t) : undefined}
              confirming={confirmPayment.isPending && confirmPayment.variables?.id === t.id}
              onCopy={copyText}
            />
          ))}
        </Column>
      );
    }
    const items = byStatus(col.key);
    return (
      <Column key={col.key} col={col} count={items.length} style={style}>
        {items.map((c) => (
          <DraggableCard
            key={c.id}
            item={c}
            edge={col.edge}
            onOpen={() => openDetail(c, 'contact')}
            onQuickMove={NEXT_STATUS[c.status] ? () => quickMove(c) : undefined}
            onCopy={copyText}
          />
        ))}
      </Column>
    );
  };

  if (isLoading) {
    return <div style={{ padding: 'var(--space-6)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải bảng Kanban…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Thanh bộ lọc nhanh của Kanban */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--space-3)',
          background: 'var(--white)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-inset-hairline)',
          border: '1px solid var(--border-hairline)',
        }}
      >
        <div style={{ position: 'relative', minWidth: 220, flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Tìm theo tên khách, SĐT, số biển…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: 36,
              padding: '0 12px 0 32px',
              border: '1px solid var(--grey-200)',
              borderRadius: 'var(--radius-sm)',
              font: 'var(--type-body-sm)',
              color: 'var(--text-strong)',
              outline: 'none',
              background: 'var(--white)',
            }}
          />
        </div>

        <Select
          label="Phụ trách"
          value={staffFilter}
          options={[
            { value: '', label: 'Tất cả nhân viên' },
            { value: 'unassigned', label: 'Chưa gán người' },
            ...staffList.map((s) => ({ value: s.id, label: s.fullName })),
          ]}
          onChange={setStaffFilter}
        />

        <Select
          label="Mục đích"
          value={intentFilter}
          options={[
            { value: '', label: 'Tất cả mục đích' },
            { value: 'deposit_request', label: 'Đặt cọc' },
            { value: 'buy', label: 'Mua đứt' },
            { value: 'inquiry', label: 'Hỏi chung' },
            { value: 'hunting', label: 'Săn hộ' },
          ]}
          onChange={setIntentFilter}
        />

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <X size={13} /> Xóa lọc
          </Button>
        )}

        <div style={{ flex: 1 }} />
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          Hiển thị: <strong>{filteredContacts.length}</strong> liên hệ • <strong>{filteredTransactions.length}</strong> giao dịch
        </span>
      </div>

      {narrow ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div role="tablist" aria-label="Chọn giai đoạn" style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 2 }}>
            {COLUMNS.map((c) => {
              const active = c.key === mobileCol;
              const n = c.kind === 'tx' ? txByStatus(c.key).length : byStatus(c.key).length;
              return (
                <button
                  key={c.key}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setMobileCol(c.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    height: 36,
                    padding: '0 14px',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    cursor: 'pointer',
                    font: 'var(--type-body-sm)',
                    fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                    background: active ? c.edge : 'var(--white)',
                    color: active ? 'var(--white)' : 'var(--text-body)',
                    boxShadow: 'var(--shadow-inset-hairline)',
                  }}
                >
                  {c.label}
                  <span
                    style={{
                      minWidth: 18,
                      height: 18,
                      padding: '0 5px',
                      borderRadius: 'var(--radius-pill)',
                      background: active ? 'rgba(255,255,255,.28)' : c.tint,
                      color: active ? 'var(--white)' : c.ink,
                      font: 'var(--type-caption)',
                      fontSize: 'var(--fs-micro)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
          {renderColumn(COLUMNS.find((c) => c.key === mobileCol) || COLUMNS[0])}
          {detailFor()}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: 'var(--space-3)', alignItems: 'flex-start', paddingBottom: 8 }}>
            {COLUMNS.map((col) => renderColumn(col))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeItem ? <DraggableCard item={activeItem} overlay onCopy={copyText} /> : null}
          </DragOverlay>
          {detailFor()}
        </DndContext>
      )}

      <p style={{ margin: '4px 0 0', font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
        💡 Kéo thẻ giữa 3 cột đầu để đổi trạng thái. Bấm thẻ để xem chi tiết. Hai cột giao dịch (Chờ thanh toán & Đã xác nhận) được xử lý sau khi xác nhận tiền.
      </p>
    </div>
  );
}
