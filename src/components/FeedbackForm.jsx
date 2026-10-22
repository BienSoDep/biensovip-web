import { useState } from 'react';
import toast from 'react-hot-toast';
import { Input, Select } from './index.jsx';
import Button from './Button.jsx';
import { useSubmitFeedback } from '../services/systemFeedback.js';

// Backend serialize enum C# mặc định dạng số (không cấu hình JsonStringEnumConverter) — value ở
// đây PHẢI khớp thứ tự khai báo SystemFeedbackCategory { Bug, Suggestion, Other } bên backend.
const CATEGORY_OPTS = [
  { value: 0, label: 'Lỗi hệ thống' },
  { value: 1, label: 'Góp ý cải thiện' },
  { value: 2, label: 'Khác' },
];

// Form báo cáo lỗi/góp ý — chỉ hiện cho user đã đăng nhập (gắn trong Profile). Tự gửi kèm URL
// trang đang xem để dev dễ tái hiện lỗi hơn, không cần người dùng tự mô tả "tôi đang ở trang nào".
export default function FeedbackForm() {
  const [form, setForm] = useState({ category: 0, title: '', description: '' });
  const submit = useSubmitFeedback();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Vui lòng nhập đủ tiêu đề và mô tả chi tiết.');
      return;
    }
    submit.mutate({
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      pageUrl: window.location.href,
    }, {
      onSuccess: () => {
        toast.success('Đã gửi báo cáo, cảm ơn bạn đã góp ý!');
        setForm({ category: 0, title: '', description: '' });
      },
      onError: (err) => toast.error(err?.message || 'Gửi thất bại, vui lòng thử lại.'),
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Select label="Loại báo cáo" value={CATEGORY_OPTS.find((o) => o.value === form.category)?.label}
        options={CATEGORY_OPTS.map((o) => ({ value: o.label, label: o.label }))}
        onChange={(label) => setForm((f) => ({ ...f, category: CATEGORY_OPTS.find((o) => o.label === label)?.value ?? 0 }))} />
      <Input label="Tiêu đề" placeholder="VD: Nút lưu không hoạt động ở trang Hồ sơ (nhấn Enter để gửi)" value={form.title} onChange={set('title')} required />
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Mô tả chi tiết <span style={{ color: 'var(--status-danger)' }}>*</span></span>
        <textarea rows={4} placeholder="Mô tả lỗi bạn gặp hoặc góp ý của bạn, càng chi tiết càng dễ xử lý."
          value={form.description} onChange={set('description')}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          style={{ background: 'var(--surface-sunken)', border: 'none', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-field)', padding: '12px 14px', font: 'var(--type-body)', color: 'var(--text-strong)', resize: 'vertical', outline: 'none' }} />
      </label>
      <Button variant="primary" type="submit" size="lg" disabled={submit.isPending} style={{ alignSelf: 'flex-start' }}>
        {submit.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
      </Button>
    </form>
  );
}
