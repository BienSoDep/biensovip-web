import { useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '../../components/Button.jsx';
import { Select, InfoTip } from '../../components/index.jsx';
import { usePlateSortSettings, useUpdatePlateSortSettings } from '../../services/adminPlateSortSettings.js';
import { useAdminCategories } from '../../services/categories.js';

const CRITERIA_LABEL = {
  province: 'Tỉnh ưu tiên',
  hot: 'Biển hot',
  date: 'Ngày đăng',
  type: 'Loại biển',
};
const CRITERIA_DESC = {
  province: 'Biển thuộc tỉnh đã chọn bên dưới luôn xếp trước biển tỉnh khác.',
  hot: 'Biển đã đánh dấu "Nổi bật" (IsHot) xếp trước.',
  date: 'Biển đăng gần đây xếp trước (mới nhất lên đầu).',
  type: 'Theo thứ tự hiển thị của Loại biển đã cấu hình ở Danh mục.',
};

// 1 tiêu chí kéo-thả được — GripVertical làm tay cầm kéo, khớp pattern AdminCats.jsx.
function SortableCriterionRow({ token, idx, provinceOptions, priorityProvinceId, onProvinceChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: token });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: 'var(--space-3) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
    boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--white)',
  };
  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button type="button" {...attributes} {...listeners} aria-label="Kéo để đổi thứ tự ưu tiên"
          style={{ border: 'none', background: 'transparent', cursor: 'grab', width: 44, height: 44, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}>
          <GripVertical size={16} />
        </button>
        <span style={{ width: 22, textAlign: 'center', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', padding: '2px 0' }}>{idx + 1}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{CRITERIA_LABEL[token] || token}</div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{CRITERIA_DESC[token]}</div>
        </div>
      </div>
      {token === 'province' && (
        <div style={{ paddingLeft: 44 + 22 + 12, maxWidth: 280 }}>
          <Select value={priorityProvinceId || ''} options={provinceOptions} onChange={onProvinceChange} placeholder="Chọn tỉnh ưu tiên" />
        </div>
      )}
    </div>
  );
}

export default function AdminPlateSortSettings({ notify }) {
  const { data, isLoading, isError } = usePlateSortSettings();
  const update = useUpdatePlateSortSettings();
  const { data: provincesData } = useAdminCategories('province');
  const [order, setOrder] = useState(null); // null = chưa đồng bộ từ server
  const [priorityProvinceId, setPriorityProvinceId] = useState(null);

  // Đồng bộ state cục bộ khi data đầu tiên về — tránh ghi đè thao tác đang dở của admin nếu refetch.
  useEffect(() => {
    if (data && order === null) {
      setOrder(data.priorityOrder);
      setPriorityProvinceId(data.priorityProvinceId || null);
    }
  }, [data, order]);

  const provinceOptions = (provincesData?.items || []).map((c) => ({ value: c.id, label: c.name }));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const save = (nextOrder, nextProvinceId) => {
    update.mutate({ priorityOrder: nextOrder, priorityProvinceId: nextProvinceId }, {
      onSuccess: () => notify('Đã cập nhật thứ tự ưu tiên'),
      onError: (err) => notify(err.message || 'Lỗi cập nhật — thử lại.'),
    });
  };

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !order) return;
    const oldIdx = order.indexOf(active.id);
    const newIdx = order.indexOf(over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(order, oldIdx, newIdx);
    setOrder(next);
    save(next, priorityProvinceId);
  };

  const handleProvinceChange = (id) => {
    setPriorityProvinceId(id || null);
    save(order, id || null);
  };

  if (isLoading || order === null) return <div style={{ padding: 'var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>;
  if (isError) return <div style={{ padding: 'var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Không tải được cấu hình.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
        Áp dụng cho danh sách biển công khai khi khách KHÔNG chọn sắp xếp nào (mặc định "Mới nhất"). Kéo tay cầm ☰ để đổi thứ tự ưu tiên — tiêu chí ở trên quyết định chính, tiêu chí bên dưới chỉ dùng để phân định khi tiêu chí trên bằng nhau.
        <InfoTip text='Các lựa chọn sắp xếp chủ động khác (Giá, Lượt xem, Nổi bật trước, Số biển A→Z) không bị ảnh hưởng — chỉ mục sắp xếp mặc định mới dùng thứ tự ưu tiên này.' />
      </p>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            {order.map((token, idx) => (
              <SortableCriterionRow key={token} token={token} idx={idx} provinceOptions={provinceOptions}
                priorityProvinceId={priorityProvinceId} onProvinceChange={handleProvinceChange} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <Button variant="ghost" size="sm" disabled style={{ alignSelf: 'flex-start', opacity: 0.6 }}>
        {update.isPending ? 'Đang lưu…' : 'Tự động lưu khi kéo/đổi tỉnh'}
      </Button>
    </div>
  );
}
