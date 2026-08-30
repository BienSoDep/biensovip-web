import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { useAdminCollaboratorBenefitContent } from '../../services/adminCollaborators.js';
import { useCollaboratorBenefitContent } from '../../services/collaborators.js';

// Chỉnh nội dung trang ưu đãi CTV — text đơn giản (html), pattern ChatbotSettings.
// Title + Body hiện ở trang public /cong-tac-vien. Preview render đúng như khách thấy.
export default function AdminCollaboratorContent({ notify }) {
  const { data, isLoading, isError } = useAdminCollaboratorBenefitContent();
  const { data: preview } = useCollaboratorBenefitContent();
  const update = useAdminCollaboratorBenefitContent().update;
  const [form, setForm] = useState(null);

  const current = form || data || preview || {};
  const title = current.titleHtml ?? '';
  const body = current.bodyHtml ?? '';

  const set = (field, value) => setForm({ titleHtml: title, bodyHtml: body, [field]: value });

  const save = async () => {
    try {
      await update.mutateAsync({ titleHtml: title.trim(), bodyHtml: body });
      notify('Đã lưu nội dung trang ưu đãi CTV');
      setForm(null);
    } catch (e) {
      notify(e.message || 'Lỗi khi lưu nội dung');
    }
  };

  if (isLoading) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải…</div>;
  if (isError && !preview) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Lỗi tải nội dung</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 720, animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Tiêu đề (HTML)</span>
          <textarea value={title} onChange={(e) => set('titleHtml', e.target.value)} rows={2}
            style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-body-sm)', fontFamily: 'inherit' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Nội dung ưu đãi (HTML)</span>
          <textarea value={body} onChange={(e) => set('bodyHtml', e.target.value)} rows={12}
            style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-body-sm)', fontFamily: 'inherit' }} />
        </label>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="primary" size="md" loading={update.isPending} onClick={save}>Lưu nội dung</Button>
          {form && <Button variant="ghost" size="md" onClick={() => setForm(null)}>Hủy</Button>}
        </div>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Xem trước trang khách</h3>
        <h2 style={{ margin: 0, font: 'var(--type-display-3)', letterSpacing: 'var(--ls-title)', color: 'var(--text-strong)' }} dangerouslySetInnerHTML={{ __html: title }} />
        <div style={{ font: 'var(--type-body)', color: 'var(--text-body)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }} dangerouslySetInnerHTML={{ __html: body }} />
      </div>
    </div>
  );
}
