import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { Select } from '../../components/index.jsx';
import { useAdminPolicyPages, useUpdatePolicyPage } from '../../services/policyPages.js';

const SLUG_OPTS = [
  { value: 'terms', label: 'Điều khoản sử dụng' },
  { value: 'privacy', label: 'Chính sách bảo mật' },
  { value: 'transfer', label: 'Hướng dẫn sang tên' },
  { value: 'faq', label: 'Câu hỏi thường gặp' },
];

// Chỉnh nội dung 4 trang chính sách tĩnh — title/subtitle/updatedLabel là field riêng, phần nội dung
// biến thiên (sections/steps/items/notes...) sửa qua JSON thô. JSON đúng cấu trúc từng trang cần tự
// tra biensovip-web/src/lib/content/vi/{terms,privacy,transfer,faq}.json để biết hình dạng field.
export default function AdminPolicyPages({ notify }) {
  const [slug, setSlug] = useState('terms');
  const { data: pages, isLoading, isError } = useAdminPolicyPages();
  const update = useUpdatePolicyPage();
  const [form, setForm] = useState(null);

  const page = pages?.find((p) => p.slug === slug);
  const current = form || page || {};
  const title = current.title ?? '';
  const subtitle = current.subtitle ?? '';
  const updatedLabel = current.updatedLabel ?? '';
  const contentJson = current.contentJson ?? '{}';

  const set = (field, value) => setForm({ title, subtitle, updatedLabel, contentJson, [field]: value });

  const selectSlug = (v) => { setSlug(v); setForm(null); };

  const save = async () => {
    if (!title.trim()) { notify('Vui lòng nhập tiêu đề'); return; }
    try {
      JSON.parse(contentJson || '{}');
    } catch {
      notify('Nội dung JSON không hợp lệ — kiểm tra lại dấu ngoặc/dấu phẩy');
      return;
    }
    try {
      await update.mutateAsync({ slug, title: title.trim(), subtitle: subtitle || null, updatedLabel: updatedLabel || null, contentJson });
      notify('Đã lưu nội dung trang');
      setForm(null);
    } catch (e) {
      notify(e.message || 'Lỗi khi lưu nội dung');
    }
  };

  if (isLoading) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>;
  if (isError) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Lỗi tải danh sách trang</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 820, animation: 'pageIn 180ms var(--ease-out)' }}>
      <Select value={slug} options={SLUG_OPTS} onChange={selectSlug} variant="pill" />

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Tiêu đề</span>
          <input value={title} onChange={(e) => set('title', e.target.value)}
            style={{ borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-body-sm)' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Phụ đề (tùy chọn)</span>
          <input value={subtitle} onChange={(e) => set('subtitle', e.target.value)}
            style={{ borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-body-sm)' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Nhãn cập nhật (tùy chọn, VD: "Cập nhật lần cuối: 01/08/2026")</span>
          <input value={updatedLabel} onChange={(e) => set('updatedLabel', e.target.value)}
            style={{ borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-body-sm)' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Nội dung (JSON)</span>
          <textarea value={contentJson} onChange={(e) => set('contentJson', e.target.value)} rows={18}
            style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-mono, monospace)', fontSize: 13 }} />
        </label>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="primary" size="md" loading={update.isPending} onClick={save}>Lưu nội dung</Button>
          {form && <Button variant="ghost" size="md" onClick={() => setForm(null)}>Hủy</Button>}
        </div>
      </div>
    </div>
  );
}
