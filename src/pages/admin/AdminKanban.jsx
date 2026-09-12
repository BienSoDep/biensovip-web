import { useState } from 'react';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { useAdminContacts, useUpdateContactStatus } from '../../services/adminContacts.js';
import { useAdminTransactions } from '../../services/adminTransactions.js';

// Kanban pipeline — cột = trạng thái nghiệp vụ, kéo card đổi trạng thái. 3 cột đầu đọc ContactRequest
// (gọi PATCH .../status sẵn có); cột "Giao dịch" đọc Transaction (read-only — giao dịch do admin chốt
// ở trang Giao dịch, không kéo thả ở đây).
// ponytail: tải 1 trang 100 liên hệ, không phân trang/cuộn vô hạn — đủ cho quy mô hiện tại. Nếu số liên
// hệ đang mở tăng nhiều thì thêm lọc theo khoảng ngày + phân trang.
const COLUMNS = [
  { key: 'new', label: 'Mới' },
  { key: 'consulting', label: 'Đang tư vấn' },
  { key: 'closed', label: 'Đã chốt' },
  { key: 'transactions', label: 'Giao dịch' },
];

const STATUS_KEYS = COLUMNS.filter((c) => c.key !== 'transactions').map((c) => c.key);

function Card({ item, dragging }) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-1)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 4, cursor: 'grab', opacity: dragging ? 0.5 : 1 }}>
      <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.fullName}</span>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{item.phone}</span>
      {item.plateNumber && <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Biển {item.plateNumber}</span>}
      {item.intent && <span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--action-primary)' }}>{item.intent}</span>}
    </div>
  );
}

function DraggableCard({ item }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <Card item={item} dragging={isDragging} />
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

function Column({ col, children, count }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div ref={setNodeRef} data-kanban-col style={{ flex: '1 1 240px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: isOver ? 'var(--surface-tint-blue)' : 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--space-3)', transition: 'var(--transition-control)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{col.label}</span>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minHeight: 60 }}>
        {children}
      </div>
    </div>
  );
}

export default function AdminKanban({ notify }) {
  const { data, isLoading } = useAdminContacts({ page: 1, perPage: 100 });
  const { data: txData } = useAdminTransactions({ page: 1, limit: 100 });
  const updateStatus = useUpdateContactStatus();
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnStepGetter }),
  );

  const contacts = data?.items || [];
  const transactions = txData?.items || [];

  const byStatus = (key) => contacts.filter((c) => c.status === key);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h1 style={{ margin: 0, font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>Quy trình bán hàng</h1>
      {isLoading ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
            {COLUMNS.map((col) => {
              if (col.key === 'transactions') {
                return (
                  <Column key={col.key} col={col} count={transactions.length}>
                    {transactions.map((t) => (
                      <Card key={t.id} item={{ fullName: t.fullName, phone: t.phone, plateNumber: t.plateNumber, intent: 'giao dịch' }} />
                    ))}
                  </Column>
                );
              }
              const items = byStatus(col.key);
              return (
                <Column key={col.key} col={col} count={items.length}>
                  {items.map((c) => <DraggableCard key={c.id} item={c} />)}
                </Column>
              );
            })}
          </div>
          <DragOverlay>{activeItem ? <Card item={activeItem} /> : null}</DragOverlay>
        </DndContext>
      )}
      <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Kéo thẻ giữa các cột để đổi trạng thái liên hệ. Cột Giao dịch chỉ xem — chốt thanh toán ở trang Giao dịch.</p>
    </div>
  );
}
