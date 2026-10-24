import { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, Check, Zap, Search, X, Filter, Tag, Eye } from 'lucide-react';
import { useCannedResponses, useSaveCannedResponse, useDeleteCannedResponse } from '../../../services/adminChatbot.js';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';

const CATEGORIES = [
  { value: 'sales', label: 'Tư vấn bán hàng', color: '#10b981', bg: '#ecfdf5' },
  { value: 'legal', label: 'Pháp lý & Thông tư 24', color: '#6366f1', bg: '#eef2ff' },
  { value: 'vpa', label: 'Đấu giá VPA', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'support', label: 'Chăm sóc & Hotline', color: '#06b6d4', bg: '#f0fdfa' },
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
      <style>{`
        .bsd-canned-card {
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
        }
        .bsd-canned-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.08) !important;
          border-color: var(--grey-300, #cbd5e1) !important;
        }
      `}</style>

      {/* Action Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        background: 'var(--white)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border-hairline)',
        boxShadow: 'var(--shadow-inset-hairline)'
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo phím tắt, tiêu đề..."
              style={{
                padding: '8px 30px 8px 32px',
                borderRadius: 'var(--radius-field)',
                border: '1px solid var(--border-hairline)',
                font: 'var(--type-body-sm)',
                background: 'var(--surface-sunken)',
                color: 'var(--text-strong)',
                minWidth: 240,
                outline: 'none',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 2,
                  display: 'flex'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-field)',
                border: '1px solid var(--border-hairline)',
                font: 'var(--type-body-sm)',
                background: 'var(--surface-sunken)',
                color: 'var(--text-strong)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">Tất cả danh mục ({cannedList.length})</option>
              {CATEGORIES.map(c => {
                const count = cannedList.filter(i => i.category === c.value).length;
                return (
                  <option key={c.value} value={c.value}>{c.label} ({count})</option>
                );
              })}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Hiển thị <strong>{filtered.length}</strong> mẫu câu
          </span>
          <Button variant="primary" onClick={handleOpenNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <Plus size={16} /> Thêm mẫu mới
          </Button>
        </div>
      </div>

      {/* Grid Cards */}
      {isLoading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>
          Đang tải danh sách mẫu câu...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: '48px 16px',
          textAlign: 'center',
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-hairline)',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10
        }}>
          <Zap size={32} strokeWidth={1.3} style={{ opacity: 0.4 }} />
          <div style={{ font: 'var(--type-body-md)' }}>Không có mẫu câu trả lời nào phù hợp với bộ lọc hiện tại.</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 'var(--space-3)',
        }}>
          {filtered.map((item) => {
            const catObj = CATEGORIES.find(c => c.value === item.category) || { label: item.category, color: '#64748b', bg: '#f1f5f9' };
            return (
              <div
                key={item.id}
                className="bsd-canned-card"
                style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--border-hairline)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-inset-hairline)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        onClick={() => copyToClipboard(item.id, item.shortcut)}
                        title="Bấm để sao chép phím tắt"
                        style={{
                          background: 'rgba(234, 88, 12, 0.1)',
                          color: 'var(--action-primary)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {item.shortcut}
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: catObj.color,
                        background: catObj.bg,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        border: `1px solid ${catObj.color}25`
                      }}>
                        {catObj.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.id, item.content)}
                        title="Sao chép nội dung"
                        style={{
                          border: 'none',
                          background: 'var(--surface-sunken)',
                          cursor: 'pointer',
                          color: copiedId === item.id ? '#10b981' : 'var(--text-muted)',
                          padding: 6,
                          borderRadius: 'var(--radius-field)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        title="Chỉnh sửa mẫu câu"
                        style={{
                          border: 'none',
                          background: 'var(--surface-sunken)',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: 6,
                          borderRadius: 'var(--radius-field)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        title="Xóa mẫu câu"
                        style={{
                          border: 'none',
                          background: 'var(--surface-sunken)',
                          cursor: 'pointer',
                          color: '#ef4444',
                          padding: 6,
                          borderRadius: 'var(--radius-field)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ font: 'var(--type-body-md)', fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8 }}>
                    {item.title}
                  </div>

                  <div style={{
                    font: 'var(--type-body-sm)',
                    color: 'var(--text-body)',
                    lineHeight: 1.5,
                    background: 'var(--surface-sunken)',
                    padding: '10px 12px',
                    borderRadius: 6,
                    whiteSpace: 'pre-wrap',
                    maxHeight: 120,
                    overflowY: 'auto',
                    border: '1px solid var(--border-hairline)'
                  }}>
                    {item.content}
                  </div>
                </div>

                <div style={{
                  marginTop: 14,
                  paddingTop: 10,
                  borderTop: '1px solid var(--border-hairline)',
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Thứ tự: <strong>#{item.sortOrder}</strong></span>
                  <span>Gõ <code style={{ color: 'var(--action-primary)', fontWeight: 600 }}>{item.shortcut}</code> trong chat</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm / Sửa */}
      {isModalOpen && editingItem && (
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem.id === '00000000-0000-0000-0000-000000000000' ? 'Thêm mẫu câu trả lời mới' : 'Chỉnh sửa mẫu câu'}
          maxWidth="560px"
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', font: 'var(--type-body-sm)', fontWeight: 600, color: 'var(--text-strong)', marginBottom: 5 }}>
                Phím tắt gợi ý (Bắt đầu bằng dấu /)
              </label>
              <input
                value={editingItem.shortcut}
                onChange={(e) => setEditingItem({ ...editingItem, shortcut: e.target.value })}
                placeholder="/tt24, /giucho, /hotline..."
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-field)',
                  border: '1px solid var(--border-hairline)',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  fontWeight: 600
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', font: 'var(--type-body-sm)', fontWeight: 600, color: 'var(--text-strong)', marginBottom: 5 }}>
                Tiêu đề ngắn
              </label>
              <input
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                placeholder="Quy định định danh Thông tư 24..."
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-field)',
                  border: '1px solid var(--border-hairline)',
                  boxSizing: 'border-box',
                  font: 'var(--type-body-sm)'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', font: 'var(--type-body-sm)', fontWeight: 600, color: 'var(--text-strong)', marginBottom: 5 }}>
                  Phân loại
                </label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-field)',
                    border: '1px solid var(--border-hairline)',
                    boxSizing: 'border-box',
                    background: 'var(--white)',
                    font: 'var(--type-body-sm)'
                  }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', font: 'var(--type-body-sm)', fontWeight: 600, color: 'var(--text-strong)', marginBottom: 5 }}>
                  Thứ tự ưu tiên
                </label>
                <input
                  type="number"
                  value={editingItem.sortOrder}
                  onChange={(e) => setEditingItem({ ...editingItem, sortOrder: parseInt(e.target.value, 10) || 1 })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-field)',
                    border: '1px solid var(--border-hairline)',
                    boxSizing: 'border-box',
                    font: 'var(--type-body-sm)'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <label style={{ font: 'var(--type-body-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>
                  Nội dung câu trả lời chuẩn
                </label>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {editingItem.content.length} ký tự
                </span>
              </div>
              <textarea
                value={editingItem.content}
                onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                placeholder="Nội dung tư vấn chi tiết sẽ được tự động chèn vào khung chat..."
                rows={5}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-field)',
                  border: '1px solid var(--border-hairline)',
                  boxSizing: 'border-box',
                  font: 'var(--type-body-sm)',
                  lineHeight: 1.5,
                  outline: 'none'
                }}
              />
            </div>

            {/* Live Preview Bubble */}
            {editingItem.content && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Eye size={12} /> Xem trước hiển thị trong khung chat
                </div>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '14px 14px 4px 14px',
                  background: 'var(--action-primary)',
                  color: '#ffffff',
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 2px 6px rgba(234, 88, 12, 0.2)'
                }}>
                  {editingItem.content}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit" variant="primary" disabled={saveMutation.isPending} style={{ fontWeight: 600 }}>
                Lưu mẫu câu
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
