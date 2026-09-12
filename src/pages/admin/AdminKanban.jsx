import { useEffect, useState } from 'react';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { useAdminContacts, useUpdateContactStatus } from '../../services/adminContacts.js';
import { useAdminTransactions, useConfirmTransactionPayment } from '../../services/adminTransactions.js';
import { formatDateTime } from '../../lib/date.js';
import Modal from '../../components/Modal.jsx';
import Button from '../../components/Button.jsx';
import { Badge, ImageUrlInput } from '../../components/index.jsx';

// Pipeline 2 tầng: 3 cột đầu là vòng đời LIÊN HỆ (ContactRequest, kéo-thả được), 2 cột sau là vòng đời
// THANH TOÁN (Transaction, chỉ đọc). Thanh toán là 2 bước tiền thật nên cố ý KHÔNG cho kéo thả:
// card giao dịch không có useDraggable, DndContext cũng chặn theo kind — không có đường nào nhảy cóc
// từ "Đã chốt" thẳng sang "Đã xác nhận" mà bỏ qua khâu xác nhận tiền.
// ponytail: tải 1 trang 100 liên hệ + 100 giao dịch, không phân trang/cuộn vô hạn — đủ cho quy mô hiện
// tại. Nếu số liên hệ đang mở tăng nhiều thì thêm lọc theo khoảng ngày + phân trang.
// Màu cột đi từ vàng nhạt → vàng đậm dần theo tiến độ (user yêu cầu: "cũng màu vàng chủ đạo
// nhưng đi từ vàng nhạt lên đậm") — nhìn màu là biết thẻ đang ở khâu nào, không phải đọc chữ.
// Khai báo ở đây chứ không hardcode trong CSS vì mỗi cột chỉ dùng đúng 2 biến thể (nền/viền).
const COLUMNS = [
  { key: 'new', kind: 'contact', label: 'Mới', tint: 'var(--kanban-1-tint)', ink: 'var(--kanban-1-ink)', edge: 'var(--kanban-1-edge)' },
  { key: 'consulting', kind: 'contact', label: 'Đang tư vấn', tint: 'var(--kanban-2-tint)', ink: 'var(--kanban-2-ink)', edge: 'var(--kanban-2-edge)' },
  { key: 'closed', kind: 'contact', label: 'Đã chốt', tint: 'var(--kanban-3-tint)', ink: 'var(--kanban-3-ink)', edge: 'var(--kanban-3-edge)' },
  { key: 'pending', kind: 'tx', label: 'Chờ thanh toán', tint: 'var(--kanban-4-tint)', ink: 'var(--kanban-4-ink)', edge: 'var(--kanban-4-edge)' },
  { key: 'payment_confirmed', kind: 'tx', label: 'Đã xác nhận', tint: 'var(--kanban-5-tint)', ink: 'var(--kanban-5-ink)', edge: 'var(--kanban-5-edge)' },
];

const STATUS_KEYS = COLUMNS.filter((c) => c.kind === 'contact').map((c) => c.key);

// Mã intent là tiếng Anh trong DB (`deposit_request`) — hiện thẳng lên thẻ thì admin đọc không ra.
// Map sang nhãn tiếng Việt, giữ nguyên mã gốc làm fallback cho giá trị lạ (không bịa nhãn).
const INTENT_LABEL = { inquiry: 'Hỏi chung', deposit_request: 'Đặt cọc', buy: 'Mua đứt', hunting: 'Săn hộ' };

const VND = new Intl.NumberFormat('vi-VN');

function Card({ item, dragging, onClick, edge, onQuickMove, onConfirm, confirming }) {
  return (
    <div onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      title={onClick ? 'Mở liên hệ' : undefined}
      style={{ background: 'var(--white)', borderLeft: edge ? `3px solid ${edge}` : undefined, borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-1)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 4, cursor: onClick ? 'pointer' : onConfirm ? 'default' : 'grab', opacity: dragging ? 0.5 : 1 }}>
      <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.fullName}</span>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{item.phone}</span>
      {item.plateNumber && <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Biển {item.plateNumber}</span>}
      {/* Số tiền chỉ có ở thẻ giao dịch — đây là thứ admin cần đối chiếu trước khi xác nhận. */}
      {item.amount != null && <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-body)' }}>{VND.format(item.amount)} đ</span>}
      {item.intent && <span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--action-primary)' }}>{INTENT_LABEL[item.intent] || item.intent}</span>}
      {/* Nút đổi trạng thái không cần kéo — đường dự phòng cho mobile, nơi kéo-thả xuyên cột
          (cột xếp dọc, cách nhau cả màn hình) gần như không dùng được bằng ngón tay. */}
      {onQuickMove && (
        <button type="button" aria-label="Đổi trạng thái"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onQuickMove(); }}
          style={{ marginTop: 4, width: '100%', border: `1px solid ${edge || 'var(--grey-200)'}`, background: 'transparent', borderRadius: 'var(--radius-field)', padding: '5px 8px', font: 'var(--type-caption)', color: 'var(--text-body)', cursor: 'pointer' }}>
          Đổi trạng thái →
        </button>
      )}
      {/* Xác nhận tiền là hành động 1 chiều, không hoàn tác được từ UI — bấm là gọi thẳng
          confirm-payment (atomic claim ở BE). KHÔNG gắn vào kéo-thả: kéo chỉ đổi trạng thái liên hệ. */}
      {onConfirm && (
        <button type="button" disabled={confirming}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onConfirm(); }}
          style={{ marginTop: 4, width: '100%', border: 'none', background: 'var(--action-primary)', color: 'var(--white)', borderRadius: 'var(--radius-field)', padding: '6px 8px', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', cursor: confirming ? 'wait' : 'pointer', opacity: confirming ? 0.6 : 1 }}>
          {confirming ? 'Đang xác nhận…' : 'Xác nhận đã nhận tiền'}
        </button>
      )}
    </div>
  );
}

// touch-action: none chỉ ở đây — trên mobile nếu không chặn, trình duyệt hiểu thao tác kéo là
// cuộn trang và nuốt luôn sự kiện, thẻ không bao giờ nhấc lên được.
// overlay=true (thẻ đang bay theo con trỏ) KHÔNG gắn listeners — nếu không, thẻ overlay tự nhận
// pointer event và nuốt luôn cú thả, kéo lần 2 sẽ không nhấc được.
function DraggableCard({ item, onOpen, edge, onQuickMove, overlay }) {
  const drag = useDraggable({ id: item.id });
  const bind = overlay ? {} : { ...drag.attributes, ...drag.listeners };
  return (
    <div ref={overlay ? undefined : drag.setNodeRef} {...bind} style={{ touchAction: 'none' }}>
      <Card item={item} dragging={!overlay && drag.isDragging} onClick={onOpen} edge={edge} onQuickMove={onQuickMove} />
    </div>
  );
}

// KeyboardSensor: kéo card bằng Space + phím mũi tên. Getter mặc định của dnd-kit dịch con trỏ ảo
// 25px/lần — với 4 cột ngang, phải nhấn ~15 lần mới qua cột kế tiếp. Getter dưới nhảy nguyên bề rộng
// cột (đo từ DOM) + gap, nên 1 lần nhấn = 1 cột: vừa đúng UX bàn phím, vừa là đường test không cần chuột.
// Dùng kèm collisionDetection=closestCorners trên DndContext để chọn cột dưới điểm ảo đó.
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

function Column({ col, children, count, style }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div ref={setNodeRef} data-kanban-col style={{ flex: '1 1 240px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: isOver ? col.tint : 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--space-3)', transition: 'var(--transition-control)', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', borderBottom: `2px solid ${col.edge}`, paddingBottom: 'var(--space-2)' }}>
        <span style={{ font: 'var(--type-title-3)', color: col.ink }}>{col.label}</span>
        <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: col.ink, background: col.tint, padding: '1px 8px', borderRadius: 'var(--radius-pill)' }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minHeight: 60 }}>
        {count === 0 ? (
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', padding: 'var(--space-2) 0', textAlign: 'center' }}>Chưa có thẻ nào</span>
        ) : children}
      </div>
    </div>
  );
}

const STATUS_LABEL = { new: 'Mới', consulting: 'Đang tư vấn', closed: 'Đã chốt', found: 'Đã chốt', cancelled: 'Đã hủy' };

// Hoa hồng CTV gắn trên giao dịch — cùng nhãn/màu với view Giao dịch (AdminTransactions.jsx) để
// admin đọc quen mắt, không phải học lại. `commissionAmount` null = giao dịch không qua CTV.
const COMMISSION_STATUS_LABEL = { pending: 'Chờ duyệt', approved: 'Đã duyệt', paid: 'Đã trả', cancelled: 'Đã hủy' };
const COMMISSION_STATUS_TONE = { pending: 'orange', approved: 'mint', paid: 'mint', cancelled: 'neutral' };
// Thông tin chuyển khoản CTV để admin đối chiếu trước khi chốt tiền — gộp 1 dòng cho tooltip.
const ctvBankInfo = (t) => {
  if (!t?.ctvName) return undefined;
  const parts = [t.ctvName];
  if (t.ctvBankAccountHolder) parts.push(`Chủ TK: ${t.ctvBankAccountHolder}`);
  if (t.ctvBankAccount) parts.push(`STK: ${t.ctvBankAccount}`);
  if (t.ctvBankCode) parts.push(`Ngân hàng: ${t.ctvBankCode}`);
  return parts.join(' — ');
};

// Dòng nhãn/giá trị trong modal — mọi field đều optional ở tầng DTO, thiếu thì ẩn hẳn dòng
// thay vì in "undefined" (admin đọc modal để quyết định, dữ liệu rác làm nhiễu).
function Row({ label, children }) {
  if (children == null || children === '') return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{children}</span>
    </div>
  );
}

// Modal chi tiết mở TẠI CHỖ khi bấm thẻ — trước đây bấm thẻ nhảy sang view Danh sách,
// mất ngữ cảnh cột đang đứng và phải cuộn tìm lại. Modal cho admin/staff xử lý ngay
// (đổi trạng thái / chốt tiền) mà không rời bảng. Nút "Mở chi tiết đầy đủ" giữ đường cũ
// cho các thao tác sâu (tạo link ZaloPay, ghi chú nội bộ, xóa) vốn chỉ có ở trang Danh sách.
function DetailModal({ item, kind, onClose, onQuickMove, nextLabel, updateStatus, onConfirm, confirming, onOpenFull, proofUrl, onProofChange }) {
  if (!item) return null;
  const isTx = kind === 'tx';
  return (
    <Modal open onClose={onClose} title={item.fullName || 'Chi tiết'} maxWidth="520px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Row label="Điện thoại"><a href={`tel:${item.phone}`} style={{ color: 'var(--text-link)', textDecoration: 'none' }}>{item.phone}</a></Row>
        <Row label={isTx ? 'Biển giao dịch' : 'Biển quan tâm'}>{item.plateNumber || (isTx ? '—' : 'Khách hỏi chung, không có biển cụ thể')}</Row>
        {isTx && <Row label="Số tiền">{item.amount != null ? `${VND.format(item.amount)} đ` : '—'}</Row>}
        {item.intent && <Row label="Mục đích">{INTENT_LABEL[item.intent] || item.intent}</Row>}
        <Row label="Trạng thái">{isTx ? (item.status === 'pending' ? 'Chờ thanh toán' : 'Đã xác nhận thanh toán') : (STATUS_LABEL[item.status] || item.status)}</Row>
        {isTx && item.paymentConfirmedAt && <Row label="Xác nhận lúc">{formatDateTime(item.paymentConfirmedAt)}{item.paymentConfirmedVia === 'zalopay_webhook' ? ' · ZaloPay' : ' · thủ công'}</Row>}
        {item.createdAt && <Row label={isTx ? 'Ngày tạo giao dịch' : 'Thời gian gửi'}>{formatDateTime(item.createdAt)}</Row>}

        {/* Hoa hồng CTV: có trên mọi giao dịch đi qua link giới thiệu. Cùng dữ liệu với cột
            "Hoa hồng" ở view Giao dịch — nếu thiếu ở đây thì admin chốt tiền mà không biết
            khoản hoa hồng nào sắp phát sinh cho CTV nào. */}
        {isTx && (
          <Row label="Hoa hồng CTV">
            {item.commissionAmount != null ? (
              <span title={ctvBankInfo(item)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', cursor: ctvBankInfo(item) ? 'help' : 'default' }}>
                <span style={{ fontWeight: 'var(--fw-semibold)' }}>{VND.format(item.commissionAmount)} đ</span>
                <Badge tone={COMMISSION_STATUS_TONE[item.commissionStatus] || 'neutral'}>{COMMISSION_STATUS_LABEL[item.commissionStatus] || item.commissionStatus}</Badge>
                {item.ctvName && <span style={{ color: 'var(--text-muted)' }}>· {item.ctvName}</span>}
              </span>
            ) : (item.ctvName ? `${item.ctvName} · chưa phát sinh hoa hồng` : 'Không qua CTV')}
          </Row>
        )}
        {isTx && (item.ctvBankAccount || item.ctvBankAccountHolder) && (
          <Row label="TK nhận hoa hồng">
            {[item.ctvBankAccountHolder && `Chủ TK ${item.ctvBankAccountHolder}`, item.ctvBankAccount && `STK ${item.ctvBankAccount}${item.ctvBankCode ? ` · ${item.ctvBankCode}` : ''}`]
              .filter(Boolean).join(' — ')}
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
          {/* Hành động ngay trong modal — cùng mutation với nút trên thẻ, không có đường thứ 2 ghi dữ liệu. */}
          {!isTx && nextLabel && (
            <Button variant="outline" disabled={updateStatus.isPending}
              onClick={() => onQuickMove(item)}>
              {updateStatus.isPending ? 'Đang cập nhật…' : `Chuyển sang "${nextLabel}"`}
            </Button>
          )}
          {isTx && item.status === 'pending' && (
            <>
              {/* Ảnh minh chứng: view Giao dịch thu field này trước khi chốt tiền, Kanban trước đây
                  gọi thẳng confirm-payment với proofUrl=undefined nên mất bước đính kèm. Cùng field,
                  cùng endpoint — không thêm đường ghi thứ 2. Optional như bên kia, không chặn nút. */}
              <ImageUrlInput label="Ảnh minh chứng (không bắt buộc)" value={proofUrl} onChange={onProofChange} />
              <Button variant="primary" disabled={confirming} onClick={() => onConfirm(item)}>
                {confirming ? 'Đang xác nhận…' : 'Xác nhận đã nhận tiền'}
              </Button>
            </>
          )}
          {onOpenFull && <Button variant="ghost" onClick={() => { onClose(); onOpenFull(item); }}>Mở chi tiết đầy đủ →</Button>}
        </div>
      </div>
    </Modal>
  );
}

// Màn hẹp: cột xếp dọc nên kéo-thả xuyên cột bất khả thi → thay bằng 1 cột + hàng tab chọn
// trạng thái, đổi trạng thái qua nút trên thẻ. Desktop giữ nguyên bảng 4 cột kéo-thả.
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

// "Đổi trạng thái →" đi tiến theo luồng, KHÔNG quay vòng: Mới → Đang tư vấn → Đã chốt, tới Đã chốt
// thì dừng (đã chốt là trạng thái cuối — quay về 'new' sẽ âm thầm hạ cấp một khách đã chốt).
// 'found' là data cũ của 'closed', 'cancelled' là đã hủy — cả hai đẩy về 'closed' để thoát khỏi
// trạng thái mồ côi mà Kanban không có cột. Trả undefined = không còn bước kế, nút tự ẩn.
const NEXT_STATUS = { new: 'consulting', consulting: 'closed', found: 'closed', cancelled: 'closed' };

export default function AdminKanban({ notify, go, onOpenContact }) {
  const { data, isLoading } = useAdminContacts({ page: 1, perPage: 100 });
  const { data: txData } = useAdminTransactions({ page: 1, limit: 100 });
  const updateStatus = useUpdateContactStatus();
  const confirmPayment = useConfirmTransactionPayment();
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null); // { item, kind } — thẻ đang mở modal
  const [proofUrl, setProofUrl] = useState(''); // ảnh minh chứng cho lần chốt tiền sắp tới
  const narrow = useNarrow();
  const [mobileCol, setMobileCol] = useState('new');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnStepGetter }),
  );

  const contacts = data?.items || [];
  const transactions = txData?.items || [];

  const byStatus = (key) => contacts.filter((c) => c.status === key);
  const txByStatus = (key) => transactions.filter((t) => t.status === key);
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

  // Bấm thẻ = mở modal tại chỗ. onOpenContact (nhảy sang view Danh sách) chỉ còn dùng làm
  // đường "Mở chi tiết đầy đủ" từ trong modal, không còn là hành động mặc định của cú bấm.
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
  // Chốt tiền khi modal đang mở: admin đã thấy số tiền + hoa hồng ngay trên modal nên không hỏi
  // lại bằng window.confirm nữa — modal là bước xác nhận. Gửi kèm proofUrl vừa nhập.
  const askConfirm = (t) => {
    confirmPayment.mutate({ id: t.id, proofUrl: proofUrl || undefined }, {
      onError: (err) => notify?.(err?.message || 'Không xác nhận được thanh toán.', 'error'),
      onSuccess: () => { setDetail(null); setProofUrl(''); },
    });
  };

  // 1 định nghĩa modal cho cả 2 layout — 2 nhánh render (narrow/desktop) cùng gọi nên không
  // lệch hành vi giữa mobile và desktop.
  const detailFor = () => (
    <DetailModal
      item={detail?.item} kind={detail?.kind} onClose={() => setDetail(null)}
      onQuickMove={quickMove} nextLabel={detail ? STATUS_LABEL[NEXT_STATUS[detail.item.status]] : undefined}
      updateStatus={updateStatus} onConfirm={askConfirm}
      confirming={confirmPayment.isPending && confirmPayment.variables?.id === detail?.item?.id}
      onOpenFull={detail?.kind === 'contact' ? openFullContact : undefined}
      proofUrl={proofUrl} onProofChange={setProofUrl}
    />
  );

  const renderColumn = (col, style) => {
    if (col.kind === 'tx') {
      const items = txByStatus(col.key);
      return (
        <Column key={col.key} col={col} count={items.length} style={style}>
          {items.map((t) => (
            <Card key={t.id} item={t} edge={col.edge} onClick={() => openDetail(t, 'tx')}
              onConfirm={col.key === 'pending' ? () => askConfirm(t) : undefined}
              confirming={confirmPayment.isPending && confirmPayment.variables?.id === t.id} />
          ))}
        </Column>
      );
    }
    const items = byStatus(col.key);
    return (
      <Column key={col.key} col={col} count={items.length} style={style}>
        {items.map((c) => (
          <DraggableCard key={c.id} item={c} edge={col.edge} onOpen={() => openDetail(c, 'contact')}
            onQuickMove={NEXT_STATUS[c.status] ? () => quickMove(c) : undefined} />
        ))}
      </Column>
    );
  };

  if (isLoading) {
    return <div style={{ padding: 'var(--space-6)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>;
  }

  if (narrow) {
    const col = COLUMNS.find((c) => c.key === mobileCol) || COLUMNS[0];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div role="tablist" aria-label="Chọn giai đoạn" style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 2 }}>
          {COLUMNS.map((c) => {
            const active = c.key === col.key;
            const n = c.kind === 'tx' ? txByStatus(c.key).length : byStatus(c.key).length;
            return (
              <button key={c.key} role="tab" aria-selected={active} type="button" onClick={() => setMobileCol(c.key)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', height: 36, padding: '0 14px', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', font: 'var(--type-body-sm)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)', background: active ? c.edge : 'var(--white)', color: active ? 'var(--white)' : 'var(--text-body)', boxShadow: 'var(--shadow-inset-hairline)' }}>
                {c.label}
                <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 'var(--radius-pill)', background: active ? 'rgba(255,255,255,.28)' : c.tint, color: active ? 'var(--white)' : c.ink, font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
              </button>
            );
          })}
        </div>
        {renderColumn(col)}
        {detailFor()}
        <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Bấm thẻ để xem chi tiết và xử lý. Hai cột thanh toán chỉ xem — chốt tiền trong modal hoặc bằng nút trên thẻ.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        {COLUMNS.map((col) => renderColumn(col))}
      </div>
      <DragOverlay dropAnimation={null}>{activeItem ? <DraggableCard item={activeItem} overlay /> : null}</DragOverlay>
      {detailFor()}
      <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Kéo thẻ giữa 3 cột đầu để đổi trạng thái liên hệ. Bấm thẻ để mở chi tiết tại chỗ. Hai cột thanh toán chỉ xem — chốt tiền trong modal.</p>
    </DndContext>
  );
}
