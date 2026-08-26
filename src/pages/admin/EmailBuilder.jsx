import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { GripVertical, Plus, Trash2, Copy } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import { Input, IconButton, Select, Badge } from '../../components/index.jsx';
import {
  useAdminEmailTemplates, useEmailTemplate, useCreateEmailTemplate, useUpdateEmailTemplate,
  useDeleteEmailTemplate, usePreviewDraftEmailTemplate, useDuplicateEmailTemplate,
} from '../../services/emailTemplates.js';

// Block Catalog — khớp EmailBlockSchema.cs (backend) §5 spec UC27. Không cho thêm type mới ở đây mà
// không đồng bộ whitelist backend, vì backend sẽ 400 nếu type không nằm trong danh sách này.
const BLOCK_TYPES = [
  { type: 'header', label: 'Header (logo + tên site)', hasProps: false },
  { type: 'heading', label: 'Tiêu đề', hasProps: true },
  { type: 'paragraph', label: 'Đoạn văn', hasProps: true },
  { type: 'plate_block', label: 'Khối biển số', hasProps: true },
  { type: 'cta_button', label: 'Nút hành động (CTA)', hasProps: true },
  { type: 'stars', label: 'Sao đánh giá', hasProps: true },
  { type: 'video_banner', label: 'Banner video', hasProps: true },
  { type: 'contact_strip', label: 'Dải liên hệ', hasProps: false },
  { type: 'footer', label: 'Footer', hasProps: false },
  { type: 'spacer', label: 'Khoảng cách', hasProps: true },
  { type: 'divider', label: 'Đường kẻ ngang', hasProps: false },
];

const NOTIFICATION_TYPES = [
  { value: 'plate_match', label: 'Biển mới phù hợp' },
  { value: 'digest', label: 'Digest tổng hợp' },
  { value: 'broadcast', label: 'Thông báo chủ động (broadcast)' },
  { value: 'hot_alert', label: 'Biển hot' },
  { value: 'price_drop', label: 'Giảm giá' },
  { value: 're_engage', label: 'Nhắc quay lại' },
  { value: 'new_review', label: 'Đánh giá mới' },
  { value: 'ai_pick', label: 'AI gợi ý' },
];

function newBlockId() {
  return 'b' + Math.random().toString(36).slice(2, 10);
}

function defaultPropsFor(type) {
  switch (type) {
    case 'heading': return { text: 'Tiêu đề email', align: 'left' };
    case 'paragraph': return { text: 'Nội dung email...' };
    case 'plate_block': return { source: 'auto' };
    case 'cta_button': return { label: 'Xem chi tiết', url_type: 'site' };
    case 'stars': return { rating: 'auto' };
    case 'video_banner': return { source: 'featured' };
    case 'spacer': return { height_px: 24 };
    default: return {};
  }
}

// 1 block trên canvas — kéo sắp xếp bằng tay cầm GripVertical (theo pattern AdminCats.jsx), click phần
// còn lại của hàng để chọn (hiện panel props bên phải).
function SortableBlockRow({ block, isSelected, onSelect, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const meta = BLOCK_TYPES.find((b) => b.type === block.type);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
    padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
    background: isSelected ? 'var(--surface-muted)' : 'var(--white)',
    boxShadow: isSelected ? 'inset 0 0 0 2px var(--action-dark)' : 'inset 0 0 0 1px var(--border-hairline)',
    cursor: 'pointer',
  };
  return (
    <div ref={setNodeRef} style={style} onClick={() => onSelect(block.id)}>
      <button type="button" {...attributes} {...listeners} aria-label="Kéo để đổi thứ tự"
        onClick={(e) => e.stopPropagation()}
        style={{ border: 'none', background: 'transparent', cursor: 'grab', padding: 2, color: 'var(--text-faint)', display: 'flex', touchAction: 'none' }}>
        <GripVertical size={16} />
      </button>
      <span style={{ flex: 1, font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{meta?.label || block.type}</span>
      <IconButton name="trash-2" label="Xóa khối" size="sm" onClick={(e) => { e.stopPropagation(); onRemove(block.id); }} />
    </div>
  );
}

// Panel props bên phải — field khác nhau theo từng block type (spec.md §5 UC27 Step 5).
function PropsPanel({ block, onChange }) {
  if (!block) return <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chọn 1 khối trên canvas để chỉnh thuộc tính.</p>;
  const meta = BLOCK_TYPES.find((b) => b.type === block.type);
  const props = block.props || {};
  const setProp = (key, value) => onChange({ ...props, [key]: value });

  if (!meta?.hasProps) {
    return <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}><b>{meta?.label}</b> — khối cố định, không có tùy chỉnh riêng.</p>;
  }

  switch (block.type) {
    case 'heading':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input label="Nội dung tiêu đề" value={props.text || ''} onChange={(e) => setProp('text', e.target.value)}
            error={!props.text?.trim() ? 'Bắt buộc' : props.text.length > 200 ? 'Tối đa 200 ký tự' : ''} />
          <Select label="Căn lề" value={props.align || 'left'} onChange={(v) => setProp('align', v)}
            options={[{ value: 'left', label: 'Trái' }, { value: 'center', label: 'Giữa' }]} />
        </div>
      );
    case 'paragraph':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Nội dung đoạn văn</label>
          <textarea value={props.text || ''} onChange={(e) => setProp('text', e.target.value)} rows={5}
            style={{ font: 'var(--type-body-sm)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)', resize: 'vertical' }} />
          {!props.text?.trim() && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Bắt buộc</span>}
        </div>
      );
    case 'plate_block':
      return (
        <Select label="Nguồn dữ liệu biển" value={props.source || 'auto'} onChange={(v) => setProp('source', v)}
          options={[{ value: 'auto', label: 'Tự động (biển thật của notification)' }, { value: 'sample', label: 'Biển mẫu' }]} />
      );
    case 'cta_button':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input label="Nhãn nút" value={props.label || ''} onChange={(e) => setProp('label', e.target.value)}
            error={!props.label?.trim() ? 'Bắt buộc' : ''} />
          <Select label="Đích đến" value={props.url_type || 'site'} onChange={(v) => setProp('url_type', v)}
            options={[
              { value: 'site', label: 'Trang chủ' }, { value: 'profile', label: 'Trang tài khoản' },
              { value: 'plate', label: 'Biển liên quan' }, { value: 'custom', label: 'URL tùy chỉnh' },
            ]} />
          {props.url_type === 'custom' && (
            <Input label="URL tùy chỉnh" value={props.custom_url || ''} onChange={(e) => setProp('custom_url', e.target.value)}
              error={!props.custom_url?.trim() ? 'Bắt buộc khi chọn URL tùy chỉnh' : ''} />
          )}
        </div>
      );
    case 'stars':
      return (
        <Select label="Số sao" value={String(props.rating || 'auto')} onChange={(v) => setProp('rating', v)}
          options={[{ value: 'auto', label: 'Tự động' }, ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} sao` }))]} />
      );
    case 'video_banner':
      return (
        <Select label="Nguồn video" value={props.source || 'featured'} onChange={(v) => setProp('source', v)}
          options={[{ value: 'featured', label: 'Video nổi bật' }, { value: 'none', label: 'Không hiện nếu không có video' }]} />
      );
    case 'spacer':
      return (
        <Input label="Chiều cao (px)" type="number" value={String(props.height_px ?? 24)}
          onChange={(e) => setProp('height_px', Math.max(0, Number(e.target.value) || 0))} />
      );
    default:
      return null;
  }
}

export default function EmailBuilder({ notify }) {
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null); // null = tạo mới
  const [name, setName] = useState('');
  const [appliesTo, setAppliesTo] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [sampleType, setSampleType] = useState('plate_match');
  const [confirmDel, setConfirmDel] = useState(null);
  const [nameErr, setNameErr] = useState('');

  const { data: listData, isLoading, isError } = useAdminEmailTemplates();
  const { data: detail } = useEmailTemplate(editingId);
  const createTpl = useCreateEmailTemplate();
  const updateTpl = useUpdateEmailTemplate();
  const deleteTpl = useDeleteEmailTemplate();
  const duplicateTpl = useDuplicateEmailTemplate();
  const previewDraft = usePreviewDraftEmailTemplate();

  const items = listData?.items || listData || [];
  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;

  // Load template đã lưu vào form khi chọn sửa.
  useEffect(() => {
    if (!detail) return;
    setName(detail.name);
    setAppliesTo(detail.appliesTo || []);
    try {
      const parsed = JSON.parse(detail.layoutJson);
      setBlocks((parsed.blocks || []).map((b) => ({ ...b, id: b.id || newBlockId() })));
    } catch {
      setBlocks([]);
    }
    setSelectedId(null);
  }, [detail]);

  const resetForm = () => {
    setEditingId(null); setName(''); setAppliesTo([]); setBlocks([]); setSelectedId(null); setNameErr('');
  };

  const addBlock = (type) => {
    setBlocks((prev) => [...prev, { id: newBlockId(), type, props: defaultPropsFor(type) }]);
  };

  const removeBlock = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateBlockProps = (id, newProps) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, props: newProps } : b)));
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setBlocks((prev) => {
      const oldIdx = prev.findIndex((b) => b.id === active.id);
      const newIdx = prev.findIndex((b) => b.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const layoutJson = useMemo(() => JSON.stringify({
    version: 1,
    blocks: blocks.map(({ id, type, props }) => (Object.keys(props || {}).length ? { id, type, props } : { id, type })),
  }), [blocks]);
  const [debouncedLayout] = useDebouncedValue(layoutJson, 500);

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewErr, setPreviewErr] = useState('');
  useEffect(() => {
    if (blocks.length === 0) { setPreviewHtml(''); setPreviewErr(''); return; }
    previewDraft.mutate({ layoutJson: debouncedLayout, sampleType }, {
      onSuccess: (res) => { setPreviewHtml(res.html); setPreviewErr(''); },
      onError: (err) => setPreviewErr(err.message || 'Không xem trước được — kiểm tra lại các khối.'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedLayout, sampleType]);

  const save = () => {
    if (!name.trim()) { setNameErr('Nhập tên template.'); return; }
    if (blocks.length === 0) { notify('Cần ít nhất 1 khối nội dung.'); return; }
    setNameErr('');
    const body = { name: name.trim(), appliesTo, layoutJson };
    const opts = {
      onSuccess: (res) => {
        notify(editingId ? 'Đã cập nhật template' : 'Đã tạo template');
        if (!editingId) setEditingId(res.id);
      },
      onError: (err) => notify(err.message || 'Lưu thất bại.'),
    };
    if (editingId) updateTpl.mutate({ id: editingId, ...body }, opts);
    else createTpl.mutate(body, opts);
  };

  const setActive = () => {
    if (!editingId) { notify('Lưu template trước khi đặt làm mặc định.'); return; }
    updateTpl.mutate({ id: editingId, isActive: true }, {
      onSuccess: () => notify('Đã đặt làm mặc định cho các loại thông báo đã chọn'),
      onError: (err) => notify(err.message || 'Có lỗi xảy ra.'),
    });
  };

  const doDelete = () => {
    deleteTpl.mutate(confirmDel.id, {
      onSuccess: () => { notify('Đã xóa template'); if (editingId === confirmDel.id) resetForm(); setConfirmDel(null); },
      onError: (err) => { notify(err.code === 'TEMPLATE_ACTIVE' ? 'Template đang active — đổi active sang template khác trước.' : (err.message || 'Xóa thất bại.')); setConfirmDel(null); },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Template email</span>
          {isLoading && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang tải…</span>}
          {isError && <span style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Không tải được danh sách.</span>}
        </div>
        <Button variant="ghost" size="sm" onClick={resetForm}>+ Template mới</Button>
      </div>

      {/* Danh sách template đã lưu — click để mở sửa */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {items.map((t) => (
          <button key={t.id} type="button" onClick={() => setEditingId(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 'var(--radius-pill)',
              border: editingId === t.id ? '2px solid var(--action-dark)' : '1px solid var(--border-hairline)',
              background: 'var(--white)', cursor: 'pointer', font: 'var(--type-caption)',
            }}>
            {t.name}{t.isActive && <Badge tone="mint">Active</Badge>}
            <span role="button" tabIndex={-1} title="Nhân bản" onClick={(e) => { e.stopPropagation(); duplicateTpl.mutate(t.id, { onSuccess: () => notify('Đã nhân bản template'), onError: (err) => notify(err.message || 'Nhân bản thất bại.') }); }}
              style={{ color: 'var(--text-faint)', display: 'flex' }}><Copy size={12} /></span>
            <span role="button" tabIndex={-1} title="Xóa" onClick={(e) => { e.stopPropagation(); setConfirmDel(t); }}
              style={{ color: 'var(--text-faint)', display: 'flex' }}><Trash2 size={12} /></span>
          </button>
        ))}
        {items.length === 0 && !isLoading && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có template nào.</span>}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        {/* Cột 1: Block Palette */}
        <div style={{ flex: '0 0 200px', minWidth: 180, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Khối nội dung</span>
          {BLOCK_TYPES.map((b) => (
            <button key={b.type} type="button" onClick={() => addBlock(b.type)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-hairline)', background: 'transparent', cursor: 'pointer', font: 'var(--type-caption)', textAlign: 'left' }}>
              <Plus size={13} /> {b.label}
            </button>
          ))}
        </div>

        {/* Cột 2: Canvas + Props panel */}
        <div style={{ flex: '1 1 320px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)' }}>
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input label="Tên template" placeholder="VD: Digest mặc định 2026" value={name} error={nameErr}
              onChange={(e) => setName(e.target.value)} />
            <div>
              <label style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Áp dụng cho loại thông báo</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {NOTIFICATION_TYPES.map((t) => {
                  const active = appliesTo.includes(t.value);
                  return (
                    <button key={t.value} type="button"
                      onClick={() => setAppliesTo((prev) => active ? prev.filter((x) => x !== t.value) : [...prev, t.value])}
                      style={{
                        height: 28, padding: '0 10px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', font: 'var(--type-caption)',
                        background: active ? 'var(--action-dark)' : 'var(--surface-muted)', color: active ? 'var(--white)' : 'var(--text-body)',
                      }}>{t.label}</button>
                  );
                })}
              </div>
            </div>

            {blocks.length === 0 ? (
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có khối nào — bấm khối bên trái để thêm vào canvas.</p>
            ) : (
              <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {blocks.map((b) => (
                      <SortableBlockRow key={b.id} block={b} isSelected={selectedId === b.id} onSelect={setSelectedId} onRemove={removeBlock} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button variant="dark" size="md" onClick={save} disabled={createTpl.isPending || updateTpl.isPending}>
                {createTpl.isPending || updateTpl.isPending ? 'Đang lưu…' : 'Lưu template'}
              </Button>
              {editingId && (
                <Button variant="ghost" size="md" onClick={setActive} disabled={updateTpl.isPending}>Đặt làm mặc định</Button>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)' }}>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', display: 'block', marginBottom: 'var(--space-3)' }}>Thuộc tính khối đang chọn</span>
            <PropsPanel block={selectedBlock} onChange={(props) => selectedBlock && updateBlockProps(selectedBlock.id, props)} />
          </div>
        </div>

        {/* Cột 3: Preview */}
        <div style={{ flex: '1 1 360px', minWidth: 300, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Select label="Xem trước với dữ liệu mẫu" value={sampleType} onChange={setSampleType}
            options={NOTIFICATION_TYPES} />
          {previewErr && <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--status-danger)' }}>{previewErr}</p>}
          {blocks.length === 0 ? (
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Thêm khối vào canvas để xem trước.</p>
          ) : (
            <iframe title="Xem trước email" srcDoc={previewHtml}
              style={{ width: '100%', minHeight: 480, border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-md)', background: '#fff' }} />
          )}
        </div>
      </div>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Xác nhận xóa" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Template <b>{confirmDel?.name}</b> sẽ bị xóa vĩnh viễn.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setConfirmDel(null)}>Hủy</Button>
            <Button variant="danger" size="md" onClick={doDelete} loading={deleteTpl.isPending}>Xóa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
