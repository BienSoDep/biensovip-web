import { useState, useMemo, useRef } from 'react';
import {
  MessageSquareQuote, Plus, Pencil, Trash2, RotateCw,
  Search, X, MessageCircle, Share2, Smartphone, Layers,
  Copy, Check, Sparkles, Eye, CheckCircle2, AlertCircle
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Badge, Input, Checkbox } from '../../components/index.jsx';
import Modal from '../../components/Modal.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import {
  useAdminCtvMessageTemplates, useCreateCtvMessageTemplate,
  useUpdateCtvMessageTemplate, useDeleteCtvMessageTemplate
} from '../../services/adminCtvMessageTemplates.js';

const CHANNEL_OPTS = [
  { value: '', label: 'Đa kênh (Không giới hạn)' },
  { value: 'zalo', label: 'Zalo' },
  { value: 'facebook', label: 'Facebook Messenger' },
  { value: 'sms', label: 'Tin nhắn SMS' },
];

const CHANNEL_CONFIG = {
  zalo: { label: 'Zalo', bg: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', border: 'rgba(2, 132, 199, 0.25)', icon: MessageCircle },
  facebook: { label: 'Facebook', bg: 'rgba(29, 78, 216, 0.1)', color: '#1d4ed8', border: 'rgba(29, 78, 216, 0.25)', icon: Share2 },
  sms: { label: 'SMS', bg: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: 'rgba(124, 58, 237, 0.25)', icon: Smartphone },
  default: { label: 'Đa kênh', bg: 'rgba(107, 114, 128, 0.1)', color: '#4b5563', border: 'rgba(107, 114, 128, 0.25)', icon: MessageSquareQuote },
};

const SMART_VARIABLES = [
  { tag: '{plateNumber}', label: 'Biển số xe', example: '30K-999.99' },
  { tag: '{referralUrl}', label: 'Link CTV giới thiệu', example: 'biensovip.com/b/30K-999.99?ref=CTV88' },
  { tag: '{platePrice}', label: 'Giá bán', example: '1.500.000.000đ' },
  { tag: '{consultantPhone}', label: 'Hotline hỗ trợ', example: '0815.792.699' },
];

const EMPTY_FORM = { title: '', category: '', channel: '', description: '', bodyTemplate: '', sortOrder: 0, isActive: true };

function TemplateForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const textareaRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Chèn nhanh biến số vào vị trí con trỏ chuột
  const insertVariable = (tag) => {
    const el = textareaRef.current;
    if (!el) {
      setForm((f) => ({ ...f, bodyTemplate: f.bodyTemplate + tag }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = form.bodyTemplate;
    const nextText = text.substring(0, start) + tag + text.substring(end);
    setForm((f) => ({ ...f, bodyTemplate: nextText }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Preview mẫu giả lập thay thế biến số thực tế
  const previewText = useMemo(() => {
    let t = form.bodyTemplate || '';
    SMART_VARIABLES.forEach((v) => {
      t = t.replaceAll(v.tag, v.example);
    });
    return t;
  }, [form.bodyTemplate]);

  const submit = () => {
    if (!form.title.trim()) return;
    if (!form.bodyTemplate.trim()) return;
    onSave({
      ...form,
      sortOrder: Number(form.sortOrder) || 0,
      category: form.category?.trim() || null,
      channel: form.channel || null,
      description: form.description?.trim() || null
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Input
        label="Tiêu đề mẫu tin nhắn"
        placeholder="VD: Mời khách quan tâm biển số đẹp VIP"
        value={form.title}
        onChange={set('title')}
        required
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        <Input
          label="Chuyên mục (tùy chọn)"
          placeholder="VD: Chào mời, Nhắc cọc, Chốt đơn…"
          value={form.category}
          onChange={set('category')}
        />

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', fontWeight: 600 }}>Kênh áp dụng</span>
          <select
            value={form.channel}
            onChange={set('channel')}
            style={{
              height: 42,
              borderRadius: 'var(--radius-field)',
              border: 'none',
              background: 'var(--surface-sunken)',
              boxShadow: 'var(--shadow-inset-hairline)',
              padding: '0 12px',
              font: 'var(--type-body-sm)',
              outline: 'none',
              color: 'var(--text-strong)',
            }}
          >
            {CHANNEL_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>

        <Input
          label="Thứ tự hiển thị"
          type="number"
          value={form.sortOrder}
          onChange={set('sortOrder')}
        />
      </div>

      <Input
        label="Mô tả hướng dẫn CTV khi nào nên dùng mẫu này"
        placeholder="VD: Sử dụng khi khách xem biển trên Zalo nhưng chưa phản hồi lại…"
        value={form.description}
        onChange={set('description')}
      />

      {/* Ô nhập nội dung + Thanh chèn biến thông minh */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', fontWeight: 600 }}>
            Nội dung mẫu tin nhắn <span style={{ color: 'var(--status-danger)' }}>*</span>
          </span>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Nhấp biến bên dưới để chèn nhanh
          </span>
        </div>

        {/* Thanh biến thông minh */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
            <Sparkles size={13} color="var(--action-primary)" /> Biến tự điền:
          </span>
          {SMART_VARIABLES.map((v) => (
            <button
              key={v.tag}
              type="button"
              onClick={() => insertVariable(v.tag)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 6,
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                fontSize: 12,
                fontFamily: 'monospace',
                fontWeight: 600,
                color: 'var(--action-primary)',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <span>+ {v.tag}</span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'sans-serif' }}>({v.label})</span>
            </button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          rows={5}
          value={form.bodyTemplate}
          onChange={set('bodyTemplate')}
          placeholder="VD: Chào anh/chị! Em đang có biển số {plateNumber} phong thủy cực vượng, gửi anh/chị xem chi tiết: {referralUrl}"
          style={{
            resize: 'vertical',
            borderRadius: 'var(--radius-field)',
            border: 'none',
            background: 'var(--surface-sunken)',
            boxShadow: 'var(--shadow-inset-hairline)',
            padding: '12px 14px',
            font: 'var(--type-body)',
            outline: 'none',
            color: 'var(--text-strong)',
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Live Preview Bubble */}
      {form.bodyTemplate.trim() && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Eye size={13} /> Xem trước hiển thị thực tế (khách sẽ nhận được như sau):
          </span>
          <div style={{
            background: form.channel === 'zalo' ? '#e0f2fe' : form.channel === 'facebook' ? '#dbeafe' : '#f1f5f9',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '12px 12px 12px 2px',
            padding: '12px 16px',
            fontSize: 13,
            color: '#0f172a',
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
            maxWidth: '90%',
          }}>
            {previewText}
          </div>
        </div>
      )}

      <Checkbox
        label="Đang bật (Cộng tác viên có thể nhìn thấy và sao chép mẫu này)"
        checked={form.isActive}
        onChange={(v) => setForm((f) => ({ ...f, isActive: !!v }))}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 8, borderTop: '1px solid var(--border-hairline)', paddingTop: 14 }}>
        <Button variant="ghost" size="md" onClick={onCancel}>Hủy bỏ</Button>
        <Button variant="primary" size="md" loading={saving} onClick={submit}>
          Lưu mẫu tin nhắn
        </Button>
      </div>
    </div>
  );
}

export default function AdminCtvMessageTemplates({ notify }) {
  const { data, isLoading, isError, refetch } = useAdminCtvMessageTemplates();
  const create = useCreateCtvMessageTemplate();
  const update = useUpdateCtvMessageTemplate();
  const del = useDeleteCtvMessageTemplate();

  const [modal, setModal] = useState(null); // null | 'create' | template object (edit)
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [channelFilter, setChannelFilter] = useState(''); // '' (all) | zalo | facebook | sms
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const items = data || [];

  // Lọc theo kênh & từ khóa tìm kiếm
  const filteredItems = useMemo(() => {
    return items.filter((t) => {
      const matchChannel = !channelFilter || t.channel === channelFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        (t.title || '').toLowerCase().includes(term) ||
        (t.bodyTemplate || '').toLowerCase().includes(term) ||
        (t.category || '').toLowerCase().includes(term);
      return matchChannel && matchSearch;
    });
  }, [items, channelFilter, searchTerm]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = items.length;
    const zalo = items.filter((t) => t.channel === 'zalo').length;
    const fb = items.filter((t) => t.channel === 'facebook').length;
    const sms = items.filter((t) => t.channel === 'sms').length;
    const active = items.filter((t) => t.isActive).length;
    return { total, zalo, fb, sms, active };
  }, [items]);

  const copySample = (t) => {
    let text = t.bodyTemplate || '';
    SMART_VARIABLES.forEach((v) => { text = text.replaceAll(v.tag, v.example); });
    navigator.clipboard?.writeText(text);
    setCopiedId(t.id);
    notify?.('Đã sao chép nội dung mẫu (kèm dữ liệu ví dụ)');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleActive = async (t) => {
    try {
      await update.mutateAsync({ id: t.id, ...t, isActive: !t.isActive });
      notify(t.isActive ? 'Đã ẩn mẫu tin nhắn đối với CTV' : 'Đã bật mẫu tin nhắn cho CTV');
    } catch (e) {
      notify(e.message || 'Lỗi cập nhật');
    }
  };

  const save = async (form) => {
    try {
      if (modal === 'create') {
        await create.mutateAsync(form);
        notify('Đã thêm mẫu tin nhắn thành công');
      } else {
        await update.mutateAsync({ id: modal.id, ...form });
        notify('Đã cập nhật mẫu tin nhắn thành công');
      }
      setModal(null);
    } catch (e) {
      notify(e.message || 'Lỗi khi lưu mẫu tin nhắn');
    }
  };

  const doDelete = async () => {
    try {
      await del.mutateAsync(confirmDelete.id);
      notify('Đã xóa mẫu tin nhắn thành công');
      setConfirmDelete(null);
    } catch (e) {
      notify(e.message || 'Lỗi khi xóa');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 4 Thẻ KPI Thống kê mẫu tin nhắn */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-3)' }}>
        <div
          onClick={() => setChannelFilter('')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: channelFilter === '' ? '2px solid var(--action-primary)' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquareQuote size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Tổng mẫu tin nhắn</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: 'var(--text-strong)' }}>{stats.total}</div>
          </div>
        </div>

        <div
          onClick={() => setChannelFilter('zalo')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: channelFilter === 'zalo' ? '2px solid #0284c7' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Kênh Zalo</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#0284c7' }}>{stats.zalo}</div>
          </div>
        </div>

        <div
          onClick={() => setChannelFilter('facebook')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: channelFilter === 'facebook' ? '2px solid #1d4ed8' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(29, 78, 216, 0.12)', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Share2 size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Kênh Facebook</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#1d4ed8' }}>{stats.fb}</div>
          </div>
        </div>

        <div
          onClick={() => setChannelFilter('sms')}
          style={{
            background: 'var(--white)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: channelFilter === 'sms' ? '2px solid #7c3aed' : '2px solid transparent',
            transition: 'all 120ms ease',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={22} />
          </div>
          <div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Kênh SMS</div>
            <div style={{ font: 'var(--type-title-2)', fontWeight: 700, color: '#7c3aed' }}>{stats.sms}</div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-card)',
        padding: '14px 18px',
        boxShadow: 'var(--shadow-inset-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
      }}>
        {/* Tab Pills Kênh */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: '', label: 'Tất cả kênh', count: stats.total },
            { id: 'zalo', label: 'Zalo', count: stats.zalo },
            { id: 'facebook', label: 'Facebook', count: stats.fb },
            { id: 'sms', label: 'SMS', count: stats.sms },
          ].map((t) => {
            const active = channelFilter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setChannelFilter(t.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'var(--action-dark)' : 'var(--surface-sunken)',
                  color: active ? 'var(--white)' : 'var(--text-body)',
                  font: 'var(--type-body-sm)',
                  fontWeight: active ? 600 : 500,
                  transition: 'all 120ms ease',
                }}
              >
                <span>{t.label}</span>
                <span style={{
                  padding: '1px 7px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  background: active ? 'rgba(255, 255, 255, 0.22)' : 'var(--border-hairline)',
                  color: active ? 'var(--white)' : 'var(--text-muted)',
                }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tìm kiếm & Nút Tạo mẫu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, nội dung…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: 36,
                padding: '0 30px 0 32px',
                borderRadius: 'var(--radius-field)',
                border: 'none',
                background: 'var(--surface-sunken)',
                boxShadow: 'var(--shadow-inset-hairline)',
                font: 'var(--type-body-sm)',
                color: 'var(--text-strong)',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            title="Làm mới"
            style={{
              height: 36,
              width: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-field)',
              border: '1px solid var(--border-hairline)',
              background: 'var(--white)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <RotateCw size={14} />
          </button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setModal('create')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36 }}
          >
            <Plus size={16} />
            <span>Thêm mẫu tin nhắn</span>
          </Button>
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <SkeletonTable rows={4} />
      ) : isError ? (
        <div style={{ padding: 48, textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <AlertCircle size={28} />
          <span>Lỗi tải danh sách mẫu tin nhắn.</span>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>Thử lại</Button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 56, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-inset-hairline)' }}>
          <MessageSquareQuote size={36} style={{ color: 'var(--text-faint)' }} />
          <div style={{ font: 'var(--type-body)', fontWeight: 600, color: 'var(--text-strong)' }}>
            Không tìm thấy mẫu tin nhắn
          </div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            {searchTerm ? 'Không có mẫu nào khớp với từ khóa tìm kiếm.' : 'Chưa có mẫu tin nhắn nào trong kênh này. Hãy thêm mẫu mới!'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filteredItems.map((t) => {
            const chCfg = CHANNEL_CONFIG[t.channel] || CHANNEL_CONFIG.default;
            const ChannelIcon = chCfg.icon;

            return (
              <div
                key={t.id}
                style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  padding: '18px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  opacity: t.isActive ? 1 : 0.6,
                  borderLeft: t.isActive ? '4px solid var(--action-primary)' : '4px solid #cbd5e1',
                  transition: 'all 120ms ease',
                }}
              >
                {/* Header Card */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ font: 'var(--type-title-3)', fontWeight: 700, color: 'var(--text-strong)' }}>
                      {t.title}
                    </span>

                    {/* Channel Tag */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: 12,
                      fontWeight: 600,
                      background: chCfg.bg,
                      color: chCfg.color,
                      border: `1px solid ${chCfg.border}`,
                    }}>
                      <ChannelIcon size={12} />
                      {chCfg.label}
                    </span>

                    {/* Category Tag */}
                    {t.category && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        background: 'rgba(59, 130, 246, 0.08)',
                        color: '#2563eb',
                      }}>
                        {t.category}
                      </span>
                    )}

                    {!t.isActive && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: '#f1f5f9',
                        color: '#64748b',
                      }}>
                        Đang ẩn
                      </span>
                    )}

                    <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                      Thứ tự: {t.sortOrder}
                    </span>
                  </div>

                  {/* Top Right Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => toggleActive(t)}
                      title={t.isActive ? 'Ẩn mẫu này' : 'Bật mẫu này'}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--border-hairline)',
                        background: 'var(--surface-sunken)',
                        cursor: 'pointer',
                        fontSize: 12,
                        color: t.isActive ? 'var(--text-strong)' : 'var(--text-muted)',
                      }}
                    >
                      {t.isActive ? 'Đang bật' : 'Đang tắt'}
                    </button>

                    <button
                      type="button"
                      onClick={() => copySample(t)}
                      title="Sao chép nội dung mẫu kèm dữ liệu giả lập"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--border-hairline)',
                        background: 'var(--surface-sunken)',
                        cursor: 'pointer',
                        fontSize: 12,
                        color: '#2563eb',
                      }}
                    >
                      {copiedId === t.id ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                      <span>{copiedId === t.id ? 'Đã copy' : 'Copy thử'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModal(t)}
                      title="Chỉnh sửa mẫu"
                      style={{
                        width: 32,
                        height: 32,
                        border: 'none',
                        background: 'var(--surface-sunken)',
                        borderRadius: 'var(--radius-field)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-body)',
                      }}
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDelete(t)}
                      title="Xóa mẫu"
                      style={{
                        width: 32,
                        height: 32,
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: 'var(--radius-field)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#dc2626',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Description Helper */}
                {t.description && (
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    💡 {t.description}
                  </div>
                )}

                {/* Message Body Content */}
                <div style={{
                  background: 'var(--surface-sunken)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-field)',
                  font: 'var(--type-body-sm)',
                  color: 'var(--text-body)',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  border: '1px solid var(--border-hairline)',
                }}>
                  {t.bodyTemplate}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo / Sửa mẫu tin nhắn */}
      {modal && (
        <Modal
          open
          onClose={() => setModal(null)}
          title={modal === 'create' ? 'Thêm mẫu tin nhắn mới cho CTV' : 'Chỉnh sửa mẫu tin nhắn'}
          maxWidth="680px"
        >
          <TemplateForm
            initial={modal === 'create' ? null : {
              title: modal.title,
              category: modal.category || '',
              channel: modal.channel || '',
              description: modal.description || '',
              bodyTemplate: modal.bodyTemplate,
              sortOrder: modal.sortOrder,
              isActive: modal.isActive
            }}
            onSave={save}
            onCancel={() => setModal(null)}
            saving={create.isPending || update.isPending}
          />
        </Modal>
      )}

      {/* Modal Xác nhận xóa mẫu */}
      {confirmDelete && (
        <Modal open onClose={() => setConfirmDelete(null)} title="Xóa mẫu tin nhắn?">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
              Xác nhận xóa mẫu <strong>"{confirmDelete.title}"</strong>? Các cộng tác viên sẽ không còn thấy mẫu này để sử dụng nữa.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="md" onClick={() => setConfirmDelete(null)}>Hủy bỏ</Button>
              <Button
                variant="primary"
                size="md"
                loading={del.isPending}
                onClick={doDelete}
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
              >
                Xóa mẫu
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
