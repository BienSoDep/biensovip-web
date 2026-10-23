import { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, Check, Zap, Search } from 'lucide-react';
import { useCannedResponses, useSaveCannedResponse, useDeleteCannedResponse } from '../../../services/adminChatbot.js';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';

const CATEGORIES = [
  { value: 'sales', label: 'Tư vấn bán hàng' },
  { value: 'legal', label: 'Pháp lý & Thông tư 24' },
  { value: 'vpa', label: 'Đấu giá VPA' },
  { value: 'support', label: 'Chăm sóc & Hotline' },
];

export default function CannedResponsesPanel({ notify }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const { data: cannedList = [], isLoading, refetch } = useCannedResponses(selectedCategory || undefined);
  const saveMutation = useSaveCannedResponse();
  const deleteMutation = useDeleteCannedResponse();

  const filtered = cannedList.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.shortcut.toLowerCase().includes(q) ||
           item.title.toLowerCase().includes(q) ||
           item.content.toLowerCase().includes(q);
  });

  const handleOpenNew = () => {
    setEditingItem({
      id: '00000000-0000-0000-0000-000000000000',
      shortcut: '/',
      title: '',
      category: 'sales',
      content: '',
      sortOrder: cannedList.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingItem.shortcut || !editingItem.content || !editingItem.title) {
      notify?.('Vui lòng điền đầy đủ phím tắt, tiêu đề và nội dung');
      return;
    }

    try {
      await saveMutation.mutateAsync(editingItem);
      notify?.('Đã lưu mẫu câu trả lời thành công');
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      notify?.(err.message || 'Lỗi khi lưu');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mẫu câu trả lời này?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      notify?.('Đã xóa mẫu câu');
      refetch();
    } catch (err) {
      notify?.(err.message || 'Lỗi khi xóa');
    }
  };

  const copyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    notify?.('Đã sao chép nội dung');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Action Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm phím tắt, tiêu đề..."
              style={{
                padding: '8px 12px 8px 34px',
                borderRadius: 'var(--radius-field)',
                border: '1px solid var(--grey-200)',
                font: 'var(--type-body-sm)',
                minWidth: 240,
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-field)',
              border: '1px solid var(--grey-200)',
              font: 'var(--type-body-sm)',
              background: 'var(--white)',
            }}
          >
            <option value="">Tất cả danh mục</option>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <Button variant="primary" onClick={handleOpenNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Thêm câu trả lời mới
        </Button>
      </div>

      {/* Grid Cards */}
      {isLoading ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: 'var(--space-6)',
          textAlign: 'center',
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--grey-200)',
          color: 'var(--text-faint)',
        }}>
          Chưa có mẫu câu trả lời nào phù hợp
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 'var(--space-4)',
        }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--grey-200)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      background: 'rgba(234, 88, 12, 0.1)',
                      color: 'var(--action-primary)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: 13,
                    }}>
                      {item.shortcut}
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: 'var(--text-faint)',
                      background: 'var(--grey-100)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}>
                      {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.id, item.content)}
                      title="Sao chép"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-faint)', padding: 4 }}
                    >
                      {copiedId === item.id ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title="Chỉnh sửa"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-faint)', padding: 4 }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      title="Xóa"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div style={{ font: 'var(--type-body-md)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-title)', marginBottom: 8 }}>
                  {item.title}
                </div>

                <div style={{
                  font: 'var(--type-body-sm)',
                  color: 'var(--text-body)',
                  lineHeight: 1.5,
                  background: 'var(--grey-50)',
                  padding: 10,
                  borderRadius: 6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: 120,
                  overflowY: 'auto',
                }}>
                  {item.content}
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-faint)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Thứ tự: {item.sortOrder}</span>
                <span>Gõ <strong>{item.shortcut}</strong> trong live chat</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm / Sửa */}
      {isModalOpen && editingItem && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem.id === '00000000-0000-0000-0000-000000000000' ? 'Thêm mẫu câu trả lời mới' : 'Chỉnh sửa mẫu câu'}
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', font: 'var(--type-body-sm)', fontWeight: 600, marginBottom: 4 }}>
                Phím tắt gợi ý (Bắt đầu bằng dấu /)
              </label>
              <input
                value={editingItem.shortcut}
                onChange={(e) => setEditingItem({ ...editingItem, shortcut: e.target.value })}
                placeholder="/tt24, /giucho, /hotline..."
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-300)', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', font: 'var(--type-body-sm)', fontWeight: 600, marginBottom: 4 }}>
                Tiêu đề ngắn
              </label>
              <input
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                placeholder="Quy định định danh Thông tư 24..."
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-300)', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', font: 'var(--type-body-sm)', fontWeight: 600, marginBottom: 4 }}>
                Phân loại
              </label>
              <select
                value={editingItem.category}
                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-300)', boxSizing: 'border-box', background: 'var(--white)' }}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', font: 'var(--type-body-sm)', fontWeight: 600, marginBottom: 4 }}>
                Nội dung câu trả lời chuẩn
              </label>
              <textarea
                value={editingItem.content}
                onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                placeholder="Nội dung tư vấn chi tiết..."
                rows={5}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-300)', boxSizing: 'border-box', font: 'var(--type-body-sm)', lineHeight: 1.5 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', font: 'var(--type-body-sm)', fontWeight: 600, marginBottom: 4 }}>
                Thứ tự sắp xếp (Số nhỏ xếp trước)
              </label>
              <input
                type="number"
                value={editingItem.sortOrder}
                onChange={(e) => setEditingItem({ ...editingItem, sortOrder: parseInt(e.target.value, 10) || 1 })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-300)', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit" variant="primary" disabled={saveMutation.isPending}>
                Lưu mẫu câu
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
