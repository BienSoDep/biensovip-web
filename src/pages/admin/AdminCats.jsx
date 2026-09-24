import { useState, useEffect } from 'react';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plus,
  CheckCircle2,
  HelpCircle,
  FileText,
  Eye,
  Save,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import { Input, IconButton, InfoTip, Badge, Switch } from '../../components/index.jsx';
import { CATEGORY_GROUPS, REGIONS, useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useReorderCategories, useRestoreCategory, useSetCategoryActive, useSetRegionActive } from '../../services/categories.js';
import { useAdminPlates } from '../../services/adminPlates.js';
import { useAdminFaqSets, useCreateFaqSet, useUpdateFaqSet, useDeleteFaqSet, useAdminHowToSteps, useReplaceHowToSteps } from '../../services/faqHowTo.js';

// Dữ liệu mẫu chuẩn của website cho Kho FAQ và Kho HowTo
const DEFAULT_HOW_TO_STEPS = [
  { name: '1. Liên hệ & Chọn biển số ưng ý', text: 'Khách hàng chọn biển số đẹp trên website Biensovip.com, liên hệ qua Zalo hoặc Hotline để nhân viên kiểm tra tình trạng biển và giữ chỗ tạm thời trong 15 phút.' },
  { name: '2. Kiểm tra & Đối chiếu hồ sơ gốc', text: 'Nhân viên gửi hình ảnh/video hồ sơ gốc, giấy đăng ký xe và xác nhận tình trạng pháp lý, đảm bảo biển sạch, không tranh chấp trước khi đặt cọc.' },
  { name: '3. Thống nhất giá & Đặt cọc giữ biển', text: 'Hai bên chốt giá cuối cùng, khách hàng đặt cọc 10–30% giá trị biển số (có biên nhận hoặc hợp đồng đặt cọc có dấu pháp lý) để khoá giao dịch.' },
  { name: '4. Ký hợp đồng công chứng & Sang tên', text: 'Hai bên ký hợp đồng chuyển nhượng tại văn phòng công chứng. Biensovip hỗ trợ nộp hồ sơ sang tên chính chủ tại Phòng Cảnh sát Giao thông.' },
  { name: '5. Nhận giấy tờ mới & Hoàn tất thanh toán', text: 'Khách hàng nhận giấy đăng ký xe mới mang tên chính chủ, kiểm tra thông tin trên cổng dịch vụ công quốc gia và thanh toán phần còn lại.' },
];

const DEFAULT_FAQ_SETS = [
  {
    name: 'FAQ Mua bán & Sang tên biển số đẹp',
    blogCategoryCode: '',
    items: [
      { question: 'Biển số đẹp có sang tên được không?', answer: 'Có. Tất cả biển số trên Biensovip đều có hồ sơ đầy đủ và sang tên được theo đúng quy định pháp luật. Xem thêm tại trang Hướng dẫn sang tên.' },
      { question: 'Mua biển số trả góp được không?', answer: 'Hiện tại chúng tôi hỗ trợ thanh toán 2 đợt: đặt cọc 30–50% khi ký hợp đồng, phần còn lại sau khi sang tên hoàn tất. Với biển giá trị cao, có thể thương lượng thêm.' },
      { question: 'Tôi ở tỉnh khác, mua biển số Đà Nẵng có được không?', answer: 'Được. Bạn cần có hộ khẩu hoặc tạm trú dài hạn tại Đà Nẵng để đăng ký sang tên. Nếu chưa có, chúng tôi sẽ tư vấn giải pháp phù hợp.' },
      { question: 'Làm sao biết biển số là thật, không phải lừa đảo?', answer: 'Biensovip hoạt động công khai tại Đà Nẵng, có địa chỉ văn phòng rõ ràng. Mọi giao dịch đều có hợp đồng công chứng. Bạn có thể đến xem giấy tờ gốc trước khi đặt cọc.' },
      { question: 'Sau khi mua, tôi có bán lại được không?', answer: 'Có. Biển số sau khi sang tên là tài sản của bạn. Bạn có thể bán lại bất kỳ lúc nào. Liên hệ chúng tôi để được hỗ trợ đăng bán miễn phí.' },
      { question: 'Phí sang tên là bao nhiêu?', answer: 'Phí sang tên do Nhà nước quy định, khoảng 2–4 triệu đồng tùy loại xe và tỉnh thành. Phí này không bao gồm trong giá biển số.' },
      { question: 'Thời gian sang tên mất bao lâu?', answer: 'Thông thường 1–2 ngày làm việc kể từ khi nộp hồ sơ đầy đủ. Trường hợp phức tạp có thể kéo dài 3–5 ngày.' },
      { question: 'Tôi muốn ký gửi bán biển số, thủ tục thế nào?', answer: 'Liên hệ Zalo 0905 221 334 hoặc đến văn phòng. Chúng tôi sẽ kiểm tra hồ sơ, chụp ảnh biển số và đăng lên website. Hoa hồng thỏa thuận khi có khách mua.' },
      { question: 'Có hỗ trợ vận chuyển xe không?', answer: 'Có. Chúng tôi hợp tác với đơn vị vận chuyển uy tín, hỗ trợ chở xe từ tỉnh khác về Đà Nẵng nếu cần.' },
      { question: 'Biển số đã bán có hiển thị lại không?', answer: 'Biển đã bán sẽ được đánh dấu "Đã bán" và không hiển thị trong danh sách mặc định. Bạn vẫn có thể xem lại trong trang chi tiết nếu có link.' },
    ],
  },
  {
    name: 'FAQ Định danh & Ý nghĩa phong thủy',
    blogCategoryCode: '',
    items: [
      { question: 'Thế nào là biển số đẹp theo phong thủy?', answer: 'Biển số đẹp phong thủy là biển có các con số tương sinh với bản mệnh (Kim, Mộc, Thủy, Hỏa, Thổ), tổng số nút cao (8, 9 nút) và các cặp số mang ý nghĩa may mắn như Lộc Phát (68, 86), Thần Tài (39, 79), Tứ Quý, Ngũ Quý mang lại bình an, phát tài.' },
      { question: 'Biển số định danh theo Thông tư 24/2023 là gì?', answer: 'Biển số định danh là biển số được cấp và quản lý theo mã định danh của chủ xe. Khi bán xe, chủ xe phải giữ lại đăng ký và biển số nộp lại cho công an để cấp cho xe khác thuộc quyền sở hữu của mình.' },
      { question: 'Làm sao để biết biển số có hợp tuổi/mệnh của tôi?', answer: 'Bạn có thể sử dụng công cụ Tra cứu phong thủy trên Biensovip.com hoặc liên hệ hotline để được đội ngũ tư vấn viên luận giải ngũ hành nạp âm, quẻ dịch chi tiết theo ngày tháng năm sinh.' },
    ],
  },
];

// 1 hàng danh mục kéo-thả được — GripVertical làm tay cầm kéo
function SortableCategoryRow({ c, idx, isBlogCategory, isPriceRange, isToggleable, onEdit, onDelete, onToggleActive }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: 'var(--space-3) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
    boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--white)',
  };
  return (
    <div ref={setNodeRef} style={style}>
      <button type="button" {...attributes} {...listeners} aria-label="Kéo để đổi thứ tự"
        style={{ border: 'none', background: 'transparent', cursor: 'grab', width: 44, height: 44, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}>
        <GripVertical size={16} />
      </button>
      <span style={{ width: 22, textAlign: 'center', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', padding: '2px 0' }}>{idx + 1}</span>
      <span style={{ flex: 1, font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{c.name}</span>
      {c.region && (
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', padding: '2px 8px' }}>
          {REGIONS.find((r) => r.value === c.region)?.label || c.region}
        </span>
      )}
      {isBlogCategory && c.code && (
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.code}</span>
      )}
      {isPriceRange && (
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          {c.minPrice != null ? c.minPrice.toLocaleString('vi-VN') : '0'} - {c.maxPrice != null ? c.maxPrice.toLocaleString('vi-VN') : '∞'}
        </span>
      )}
      {!isBlogCategory && (c.plateCount > 0
        ? <Badge tone="amber">{c.plateCount} biển</Badge>
        : <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>0 biển</span>)}
      {isBlogCategory && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{c.plateCount} bài viết</span>}
      {isToggleable && <Switch checked={c.isActive} onChange={() => onToggleActive(c)} />}
      <IconButton name="pencil" label="Sửa danh mục" size="sm" onClick={() => onEdit(c)} />
      <IconButton name="trash-2" label="Xóa danh mục" size="sm" onClick={() => onDelete(c)} />
    </div>
  );
}

// Tab "Kho FAQ" — quản lý các bộ FAQ dùng chung
function FaqSetManager({ notify }) {
  const { data, isLoading } = useAdminFaqSets();
  const { data: blogCatData } = useAdminCategories('blog_category');
  const catOpts = (blogCatData?.items || []).map((c) => ({ code: c.code || c.name, name: c.name }));
  const createSet = useCreateFaqSet();
  const updateSet = useUpdateFaqSet();
  const deleteSet = useDeleteFaqSet();
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', blogCategoryCode: '', items: [] });
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const items = data?.items || [];

  const resetForm = () => { setForm({ name: '', blogCategoryCode: '', items: [] }); setEditId(null); setErr(''); };
  const startEdit = (s) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      blogCategoryCode: s.blogCategoryCode || '',
      items: s.items.map((it) => ({ question: it.question, answer: it.answer })),
    });
    setErr('');
  };

  const seedDefaultSets = async () => {
    setIsSeeding(true);
    try {
      for (const s of DEFAULT_FAQ_SETS) {
        await createSet.mutateAsync({
          name: s.name,
          blogCategoryCode: s.blogCategoryCode || null,
          items: s.items,
        });
      }
      notify('Đã khởi tạo thành công 2 bộ FAQ chuẩn từ website');
    } catch (e) {
      notify(e?.message || 'Lỗi khi khởi tạo bộ FAQ', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const save = () => {
    const name = form.name.trim();
    if (!name) { setErr('Nhập tên bộ FAQ.'); return; }
    const validItems = form.items.filter((it) => it.question.trim() && it.answer.trim());
    if (validItems.length === 0) { setErr('Cần ít nhất 1 câu hỏi có đủ câu hỏi và trả lời.'); return; }
    setErr('');
    const body = { name, blogCategoryCode: form.blogCategoryCode || null, items: validItems };
    const opts = {
      onSuccess: () => { resetForm(); notify(editId ? 'Đã cập nhật bộ FAQ' : 'Đã tạo bộ FAQ'); },
      onError: (e) => setErr(e.message || 'Có lỗi xảy ra.'),
    };
    if (editId) updateSet.mutate({ id: editId, body }, opts);
    else createSet.mutate(body, opts);
  };

  const doDelete = () => {
    deleteSet.mutate(confirmDel.id, {
      onSuccess: () => { setConfirmDel(null); notify('Đã xóa bộ FAQ'); },
      onError: (e) => notify(e.message || 'Xóa thất bại.', 'error'),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* Thanh toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        background: 'var(--white)',
        padding: 'var(--gutter-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Kho bộ FAQ dùng chung</span>
            <span style={{ background: 'var(--brand-50)', color: 'var(--action-primary)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)' }}>
              {items.length} bộ FAQ
            </span>
          </div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Quản lý các bộ câu hỏi thường gặp được gắn vào bài viết blog và hiển thị trên trang hỏi đáp toàn site.
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={seedDefaultSets}
            loading={isSeeding}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={14} color="var(--action-primary)" />
            <span>Nạp bộ FAQ chuẩn từ website</span>
          </Button>
          {editId && (
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Tạo bộ mới
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        {/* Cột 1: Danh sách các bộ FAQ */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Danh sách bộ FAQ ({items.length})</span>
          </div>
          {isLoading && <div style={{ padding: 'var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>}
          {!isLoading && items.length === 0 && (
            <div style={{ padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
              <HelpCircle size={32} color="var(--text-faint)" />
              <div>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', display: 'block' }}>
                  Chưa có bộ FAQ nào trong cơ sở dữ liệu
                </span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                  Bấm nút bên dưới để tự động đưa 13 câu hỏi thường gặp thực tế từ website vào kho quản trị.
                </span>
              </div>
              <Button variant="primary" size="sm" onClick={seedDefaultSets} loading={isSeeding}>
                <Sparkles size={14} style={{ marginRight: 6 }} /> Khởi tạo bộ FAQ mẫu
              </Button>
            </div>
          )}
          {items.map((s) => {
            const isEditing = editId === s.id;
            const isExpanded = expandedId === s.id;
            return (
              <div key={s.id} style={{
                padding: 'var(--space-3) var(--gutter-card)',
                boxShadow: 'inset 0 -1px 0 var(--grey-100)',
                background: isEditing ? 'var(--surface-tint-cream)' : 'transparent',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{s.name}</span>
                      {isEditing && <span style={{ background: 'var(--brand-100)', color: 'var(--action-primary)', padding: '1px 6px', borderRadius: 'var(--radius-xs)', fontSize: '0.7rem', fontWeight: 'bold' }}>Đang sửa</span>}
                    </div>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      {s.blogCategoryCode ? `Danh mục: ${s.blogCategoryCode}` : 'Áp dụng chung (Toàn site)'} · {s.items?.length || 0} câu hỏi
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    title="Xem chi tiết câu hỏi"
                    style={{ border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', padding: '4px 8px', font: 'var(--type-caption)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>{isExpanded ? 'Thu gọn' : 'Xem câu hỏi'}</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  <IconButton name="pencil" label="Sửa bộ FAQ" size="sm" onClick={() => startEdit(s)} />
                  <IconButton name="trash-2" label="Xóa bộ FAQ" size="sm" onClick={() => setConfirmDel(s)} />
                </div>

                {/* Danh sách câu hỏi thu gọn/mở rộng */}
                {isExpanded && s.items?.length > 0 && (
                  <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 4 }}>
                    {s.items.map((it, iidx) => (
                      <div key={iidx} style={{ paddingBottom: 6, borderBottom: iidx < s.items.length - 1 ? '1px dashed var(--border-hairline)' : 'none' }}>
                        <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', display: 'block' }}>
                          Q: {it.question}
                        </span>
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-body)', display: 'block', marginTop: 2, lineHeight: 1.5 }}>
                          A: {it.answer}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cột 2: Form tạo / sửa bộ FAQ */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
              {editId ? 'Sửa bộ FAQ' : 'Tạo bộ FAQ mới'}
            </span>
            {editId && (
              <button type="button" onClick={resetForm} style={{ border: 'none', background: 'transparent', color: 'var(--action-primary)', cursor: 'pointer', font: 'var(--type-caption)' }}>
                + Đổi sang tạo mới
              </button>
            )}
          </div>
          <Input label="Tên bộ FAQ" placeholder="VD: FAQ mua bán biển số" value={form.name} error={err}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Danh mục blog áp dụng</span>
            <select value={form.blogCategoryCode} onChange={(e) => setForm((f) => ({ ...f, blogCategoryCode: e.target.value }))}
              style={{ height: 36, border: 'none', borderRadius: 'var(--radius-field)', background: 'var(--surface-sunken)', padding: '0 10px', font: 'var(--type-body-sm)' }}>
              <option value="">— Không gắn danh mục (Áp dụng chung) —</option>
              {catOpts.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
              Danh sách câu hỏi & câu trả lời ({form.items.length})
            </span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Tối đa 15 câu/bộ
            </span>
          </div>

          {form.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', border: '1px solid var(--border-hairline)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--brand-50)', color: 'var(--action-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <Input placeholder="Nhập câu hỏi..." value={item.question} onChange={(e) => setForm((f) => ({ ...f, items: f.items.map((it, ii) => (ii === i ? { ...it, question: e.target.value } : it)) }))} />
                </div>
                <IconButton name="trash-2" label="Xóa câu hỏi" size="sm" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, ii) => ii !== i) }))} />
              </div>
              <textarea
                placeholder="Nhập câu trả lời chi tiết..."
                value={item.answer}
                rows={2}
                onChange={(e) => setForm((f) => ({ ...f, items: f.items.map((it, ii) => (ii === i ? { ...it, answer: e.target.value } : it)) }))}
                style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--border-hairline)', padding: '8px 10px', font: 'var(--type-body-sm)', fontFamily: 'inherit' }}
              />
            </div>
          ))}

          <Button variant="outline" size="sm" disabled={form.items.length >= 15} onClick={() => setForm((f) => ({ ...f, items: [...f.items, { question: '', answer: '' }] }))}>
            <Plus size={14} style={{ marginRight: 4 }} /> Thêm câu hỏi
          </Button>

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
            {editId && <Button variant="ghost" size="md" onClick={resetForm}>Hủy sửa</Button>}
            <Button variant="primary" size="md" onClick={save} disabled={createSet.isPending || updateSet.isPending}>
              {editId ? 'Lưu thay đổi' : 'Tạo bộ FAQ'}
            </Button>
          </div>
        </div>
      </div>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Xác nhận xóa" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Bộ FAQ <b>{confirmDel?.name}</b> sẽ bị xóa vĩnh viễn khỏi hệ thống.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="md" onClick={() => setConfirmDel(null)}>Hủy</Button>
            <Button variant="danger" size="md" onClick={doDelete} loading={deleteSet.isPending}>Xóa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Tab "Kho HowTo" — 1 bộ DUY NHẤT toàn site, hiển thị chân trang bài blog & tạo schema SEO
function HowToManager({ notify }) {
  const { data, isLoading } = useAdminHowToSteps();
  const replaceSteps = useReplaceHowToSteps();
  const [steps, setSteps] = useState(null);

  const serverItems = data?.items || [];
  // Nếu server chưa có dữ liệu và local chưa chỉnh, tự động gán DEFAULT_HOW_TO_STEPS để admin không bị trống
  const current = steps ?? (serverItems.length > 0
    ? serverItems.map((s) => ({ name: s.name, text: s.text }))
    : DEFAULT_HOW_TO_STEPS);

  useEffect(() => {
    if (steps === null && data?.items) {
      if (serverItems.length > 0) {
        setSteps(serverItems.map((s) => ({ name: s.name, text: s.text })));
      } else {
        setSteps(DEFAULT_HOW_TO_STEPS);
      }
    }
  }, [data, steps, serverItems]);

  const loadPreset = () => {
    setSteps(DEFAULT_HOW_TO_STEPS);
    notify('Đã nạp 5 bước quy trình chuẩn từ website');
  };

  const save = () => {
    const valid = current.filter((s) => s.name.trim() && s.text.trim());
    if (valid.length === 0) {
      notify('Cần ít nhất 1 bước có đủ tiêu đề và nội dung.', 'error');
      return;
    }
    replaceSteps.mutate(valid, {
      onSuccess: () => notify('Đã lưu HowTo — áp dụng ngay cho mọi bài viết và schema SEO.'),
      onError: (e) => notify(e.message || 'Lưu thất bại.', 'error'),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* Header Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        background: 'var(--white)',
        padding: 'var(--gutter-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>
              Hướng dẫn từng bước (HowTo) — Hiển thị toàn site
            </span>
            <span style={{ background: 'var(--status-success-bg)', color: 'var(--status-success-ink)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)' }}>
              Rich Snippet SEO
            </span>
          </div>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Chỉ 1 bộ duy nhất — hiển thị ở cuối MỌI bài viết blog và tự động sinh cấu trúc dữ liệu Google HowTo Schema.
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPreset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={14} color="var(--action-primary)" />
            <span>Nạp lại 5 bước chuẩn</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={save}
            loading={replaceSteps.isPending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={14} />
            <span>Lưu toàn bộ</span>
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        {/* Cột trái: Trình chỉnh sửa các bước */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-inset-hairline)',
          padding: 'var(--gutter-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
              Các bước thực hiện ({current.length})
            </span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Tối đa 20 bước
            </span>
          </div>

          {isLoading && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</span>}

          {!isLoading && current.map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-hairline)',
            }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span style={{
                  width: 24,
                  height: 24,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--brand-50)',
                  color: 'var(--action-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}>
                  {i < 9 ? `0${i + 1}` : i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <Input
                    placeholder={`Bước ${i + 1} — tiêu đề`}
                    value={item.name}
                    onChange={(e) => setSteps(current.map((s, si) => (si === i ? { ...s, name: e.target.value } : s)))}
                  />
                </div>
                <IconButton name="trash-2" label="Xóa bước" size="sm" onClick={() => setSteps(current.filter((_, si) => si !== i))} />
              </div>
              <textarea
                placeholder="Mô tả chi tiết bước này..."
                rows={2}
                value={item.text}
                onChange={(e) => setSteps(current.map((s, si) => (si === i ? { ...s, text: e.target.value } : s)))}
                style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--border-hairline)', padding: '8px 10px', font: 'var(--type-body-sm)', fontFamily: 'inherit' }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
            <Button variant="outline" size="sm" disabled={current.length >= 20} onClick={() => setSteps([...current, { name: `${current.length + 1}. `, text: '' }])}>
              <Plus size={14} style={{ marginRight: 4 }} /> Thêm bước mới
            </Button>
            <Button variant="primary" size="md" onClick={save} loading={replaceSteps.isPending}>
              Lưu toàn bộ
            </Button>
          </div>
        </div>

        {/* Cột phải: Live Preview giao diện thực tế của khách hàng */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-inset-hairline)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header trình duyệt giả lập */}
          <div style={{
            background: 'var(--surface-sunken)',
            borderBottom: '1px solid var(--border-hairline)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ marginLeft: 6, fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
                biensovip.com/bai-viet/...#huong-dan
              </span>
            </div>
            <span style={{ background: 'var(--white)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontWeight: 'var(--fw-semibold)' }}>
              Xem trước chân trang bài viết
            </span>
          </div>

          <div style={{ padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: 'var(--space-2)' }}>
              <h2 style={{ margin: 0, font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>
                Hướng dẫn từng bước
              </h2>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                Quy trình mua bán và sang tên chuẩn hóa
              </span>
            </div>

            <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {current.map((s, idx) => (
                <li key={idx} style={{ color: 'var(--action-primary)' }}>
                  <strong style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', display: 'block' }}>
                    {s.name || `Bước ${idx + 1}`}
                  </strong>
                  <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 1.6 }}>
                    {s.text || '(Chưa nhập nội dung bước)'}
                  </p>
                </li>
              ))}
            </ol>

            <div style={{
              background: 'var(--surface-sunken)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-hairline)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <CheckCircle2 size={16} color="var(--status-success)" />
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                Tự động nhúng cấu trúc Schema <b>HowTo</b> của Google giúp bài viết đạt vị trí tìm kiếm nổi bật.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCats({ notify, goToMeanings }) {
  const [mainTab, setMainTab] = useState('categories');
  const [group, setGroup] = useState('plate_type');
  const [form, setForm] = useState({ name: '', displayOrder: 0, minPrice: '', maxPrice: '', code: '' });
  const [formErr, setFormErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleteErr, setDeleteErr] = useState(null);
  const [editId, setEditId] = useState(null);

  const { data, isLoading, isError } = useAdminCategories(group);
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const restoreCat = useRestoreCategory();
  const reorderCats = useReorderCategories();
  const setCategoryActive = useSetCategoryActive();
  const setRegionActive = useSetRegionActive();

  const items = data?.items || [];
  const editingItem = editId ? items.find((c) => c.id === editId) : null;
  const isPriceRange = group === 'price_range';
  // Xem nhanh biển thuộc "Loại biển" đang sửa — chỉ query khi có id thật, không query lúc thêm mới.
  const showCatPlates = group === 'plate_type' && !!editId;
  const { data: catPlatesData, isLoading: catPlatesLoading } = useAdminPlates(
    { plateTypeId: editId, status: 'all', page: 1, perPage: 8 }, showCatPlates
  );
  const catPlates = showCatPlates ? (catPlatesData?.items || []) : [];
  const isBlogCategory = group === 'blog_category';
  const isToggleable = group === 'province' || group === 'vehicle_type';

  const toggleActive = (c) => {
    setCategoryActive.mutate({ id: c.id, isActive: !c.isActive }, {
      onSuccess: () => notify(c.isActive ? `Đã tắt ${c.name}` : `Đã bật ${c.name}`),
      onError: (err) => notify(err.message || 'Bật/tắt danh mục thất bại, thử lại.', 'error'),
    });
  };

  const toggleRegion = (region, isActive) => {
    setRegionActive.mutate({ region, isActive }, {
      onSuccess: () => notify(isActive ? 'Đã bật cả miền' : 'Đã tắt cả miền'),
      onError: (err) => notify(err.message || 'Bật/tắt cả miền thất bại, thử lại.', 'error'),
    });
  };

  const resetForm = () => { setForm({ name: '', displayOrder: 0, minPrice: '', maxPrice: '', code: '' }); setEditId(null); setFormErr(''); };

  const startEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name, displayOrder: c.displayOrder ?? 0, minPrice: c.minPrice != null ? String(c.minPrice) : '', maxPrice: c.maxPrice != null ? String(c.maxPrice) : '', code: c.code || '' });
    setFormErr('');
  };

  const addCat = () => {
    const name = form.name.trim();
    if (!name) { setFormErr('Nhập tên danh mục.'); return; }
    if (isBlogCategory && !editId && !form.code.trim()) { setFormErr('Nhập mã danh mục (khớp với giá trị Category của bài viết).'); return; }
    if (isPriceRange) {
      const min = form.minPrice !== '' ? Number(form.minPrice) : null;
      const max = form.maxPrice !== '' ? Number(form.maxPrice) : null;
      if (min != null && min < 0) { setFormErr('Giá tối thiểu không được âm.'); return; }
      if (max != null && max < 0) { setFormErr('Giá tối đa không được âm.'); return; }
      if (min != null && max != null && min > max) { setFormErr('Giá tối thiểu không được lớn hơn giá tối đa.'); return; }
    }
    setFormErr('');
    const body = {
      group,
      name,
      // Item mới luôn thêm cuối danh sách — thứ tự sau đó chỉnh bằng nút mũi tên lên/xuống, không cần
      // admin tự nhập số tay (dễ nhầm, không biết số nào đang được dùng).
      displayOrder: editId ? Number(form.displayOrder) || 0 : items.length,
      minPrice: isPriceRange && form.minPrice !== '' ? Number(form.minPrice) : null,
      maxPrice: isPriceRange && form.maxPrice !== '' ? Number(form.maxPrice) : null,
      code: isBlogCategory ? form.code.trim() : null,
    };
    const opts = {
      onSuccess: () => { resetForm(); notify(editId ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục'); },
      onError: (err) => {
        if (err.code === 'DUPLICATE_CATEGORY') setFormErr('Tên danh mục đã tồn tại.');
        else setFormErr(err.message || 'Có lỗi xảy ra.');
      },
    };
    if (editId) updateCat.mutate({ id: editId, body }, opts);
    else createCat.mutate(body, opts);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((c) => c.id === active.id);
    const newIdx = items.findIndex((c) => c.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(items, oldIdx, newIdx);
    reorderCats.mutate(next.map((c) => c.id), {
      onSuccess: () => notify('Đã cập nhật thứ tự'),
      onError: (e) => notify(e?.message || 'Lỗi cập nhật thứ tự — danh sách giữ nguyên, thử lại.', 'error'),
    });
  };

  const doDelete = () => {
    const id = confirmDel.id;
    setDeleteErr(null);
    deleteCat.mutate(id, {
      onSuccess: () => {
        setConfirmDel(null); setDeleteErr(null);
        toast((t) => (
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            Đã xóa danh mục
            <button type="button" onClick={() => { toast.dismiss(t.id); restoreCat.mutate(id, { onSuccess: () => notify('Đã hoàn tác') }); }}
              style={{ border: 'none', background: 'none', color: 'var(--action-primary)', fontWeight: 'var(--fw-bold)', cursor: 'pointer', textDecoration: 'underline' }}>
              Hoàn tác
            </button>
          </span>
        ), { duration: 5000 });
      },
      onError: (err) => {
        if (err.code === 'CATEGORY_IN_USE') setDeleteErr({ usageCount: err.usageCount });
        else { notify(err.message || 'Xóa thất bại.'); setConfirmDel(null); }
      },
    });
  };

  const closeDelete = () => { setConfirmDel(null); setDeleteErr(null); };

  const MAIN_TABS = [
    { value: 'categories', label: 'Danh mục' },
    { value: 'faq', label: 'Kho FAQ' },
    { value: 'howto', label: 'Kho HowTo' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div className="admin-tablist">
        {MAIN_TABS.map((t) => (
          <button key={t.value} type="button" onClick={() => setMainTab(t.value)}
            style={{
              height: 36, padding: '0 16px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
              background: mainTab === t.value ? 'var(--action-primary)' : 'var(--surface-sunken)',
              color: mainTab === t.value ? 'var(--white)' : 'var(--text-body)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)',
            }}>{t.label}</button>
        ))}
      </div>

      {mainTab === 'faq' && <FaqSetManager notify={notify} />}
      {mainTab === 'howto' && <HowToManager notify={notify} />}

      {mainTab === 'categories' && (<>
      <div className="admin-tablist">
        {CATEGORY_GROUPS.map((g) => (
          <button key={g.value} type="button" onClick={() => setGroup(g.value)}
            style={{
              height: 36, padding: '0 16px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
              background: group === g.value ? 'var(--action-dark)' : 'var(--surface-muted)',
              color: group === g.value ? 'var(--white)' : 'var(--text-body)', font: 'var(--type-body-sm)',
            }}>{g.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 340px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{CATEGORY_GROUPS.find((g) => g.value === group)?.label}</span>
            <InfoTip text="Thứ tự hiển thị: danh mục ở trên xuất hiện trước trên trang website. Kéo tay cầm ☰ cạnh số thứ tự (1, 2, 3…) để sắp xếp lại." />
          </div>
          {isLoading && <div style={{ padding: 'var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>}
          {isError && <div style={{ padding: 'var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Không tải được danh sách.</div>}
          {!isLoading && !isError && items.length === 0 && (
            <div style={{ padding: 'var(--gutter-card)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có danh mục nào.</div>
          )}
          {group === 'province' && (
            <div style={{ padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Bật/tắt cả miền:</span>
              {REGIONS.map((r) => (
                <span key={r.value} style={{ display: 'inline-flex', gap: 4 }}>
                  <Button variant="outline" size="sm" onClick={() => toggleRegion(r.value, true)} disabled={setRegionActive.isPending}>Bật {r.label}</Button>
                  <Button variant="outline" size="sm" onClick={() => toggleRegion(r.value, false)} disabled={setRegionActive.isPending}>Tắt {r.label}</Button>
                </span>
              ))}
            </div>
          )}
          <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {items.map((c, idx) => (
                <SortableCategoryRow key={c.id} c={c} idx={idx} isBlogCategory={isBlogCategory} isPriceRange={isPriceRange} isToggleable={isToggleable} onEdit={startEdit} onDelete={setConfirmDel} onToggleActive={toggleActive} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{editId ? 'Sửa danh mục' : 'Thêm danh mục mới'}</span>
          <Input label="Tên danh mục" placeholder="VD: Biển tiến" value={form.name} error={formErr}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          {isBlogCategory && (
            <>
              <Input label="Mã danh mục (khớp Category của bài viết, VD: phong-thuy)" placeholder="phong-thuy" value={form.code}
                disabled={Boolean(editId)}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required={!editId} />
              {editId && (
                <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Mã không sửa được sau khi tạo — bài viết cũ trỏ tới danh mục bằng mã này, đổi mã sẽ làm chúng mồ côi. Cần mã khác thì tạo danh mục mới rồi chuyển bài viết sang.
                </p>
              )}
            </>
          )}
          {!editId && (
            <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Danh mục mới thêm vào cuối danh sách — kéo tay cầm ☰ để đổi thứ tự hiển thị trên website.</p>
          )}
          {isPriceRange && (
            <>
              <Input label="Giá tối thiểu (VND)" type="number" value={form.minPrice}
                onChange={(e) => setForm((f) => ({ ...f, minPrice: e.target.value }))} />
              <Input label="Giá tối đa (VND) — để trống nếu không giới hạn" type="number" value={form.maxPrice}
                onChange={(e) => setForm((f) => ({ ...f, maxPrice: e.target.value }))} />
            </>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignSelf: 'flex-start' }}>
            {editId && <Button variant="ghost" size="md" onClick={resetForm}>Hủy sửa</Button>}
            <Button variant="dark" size="md" onClick={addCat} disabled={createCat.isPending || updateCat.isPending}>
              {editId ? (updateCat.isPending ? 'Đang lưu…' : 'Lưu thay đổi') : (createCat.isPending ? 'Đang thêm…' : 'Thêm danh mục')}
            </Button>
          </div>
        </div>

        {showCatPlates && (
          <div style={{ flex: '1 1 300px', minWidth: 0, background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Biển "{editingItem?.name}"</span>
              <div style={{ flex: 1 }} />
              <Button variant="outline" size="sm" onClick={() => goToMeanings?.(editingItem?.name || '')}>Xem/sửa ý nghĩa</Button>
            </div>
            {catPlatesLoading && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</span>}
            {!catPlatesLoading && catPlates.length === 0 && (
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chưa có biển nào thuộc loại này.</span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {catPlates.map((p) => (
                <span key={p.id} style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', padding: '6px 0', boxShadow: 'inset 0 -1px 0 var(--grey-100)' }}>{p.plateNumber}</span>
              ))}
            </div>
            {editingItem?.plateCount > catPlates.length && (
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang hiện {catPlates.length}/{editingItem.plateCount} biển — vào "Biển số" và lọc theo Loại biển để xem hết.</span>
            )}
          </div>
        )}
      </div>

      <Modal open={!!confirmDel} onClose={closeDelete} title={deleteErr ? 'Không thể xóa' : 'Xác nhận xóa'} maxWidth="420px">
        {deleteErr ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              Danh mục <b>{confirmDel?.name}</b> đang được <b>{deleteErr.usageCount ?? ''} biển số</b> sử dụng nên không thể xóa. Hãy gỡ liên kết hoặc đổi danh mục cho các biển đó trước.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button variant="primary" size="md" onClick={closeDelete}>Đã hiểu</Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Danh mục <b>{confirmDel?.name}</b> sẽ được ẩn khỏi hệ thống. Bạn có thể khôi phục lại sau nếu cần.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button variant="ghost" size="md" onClick={closeDelete} disabled={deleteCat.isPending}>Hủy</Button>
              <Button variant="danger" size="md" onClick={doDelete} loading={deleteCat.isPending}>Xóa</Button>
            </div>
          </div>
        )}
      </Modal>
      </>)}
    </div>
  );
}
