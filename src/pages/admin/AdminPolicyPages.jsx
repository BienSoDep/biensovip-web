import { useState } from 'react';
import { Plus, Trash2, Eye } from 'lucide-react';
import Button from '../../components/Button.jsx';
import { Select, ImageUrlInput } from '../../components/index.jsx';
import Modal from '../../components/Modal.jsx';
import { useAdminPolicyPages, useUpdatePolicyPage } from '../../services/policyPages.js';

const SLUG_OPTS = [
  { value: 'terms', label: 'Điều khoản sử dụng' },
  { value: 'privacy', label: 'Chính sách bảo mật' },
  { value: 'transfer', label: 'Hướng dẫn sang tên' },
  { value: 'faq', label: 'Câu hỏi thường gặp' },
  { value: 'process', label: 'Quy trình giao dịch (5 bước)' },
];

const EMPTY_STEP = { title: '', desc: '', detail: '', imageUrl: '' };

function parseContent(json) {
  try { return JSON.parse(json || '{}'); } catch { return {}; }
}

// tiny HTML-in-string renderer — khớp Terms.jsx/Privacy.jsx: chỉ hỗ trợ <strong>…</strong>.
function Rich({ html }) {
  const parts = String(html || '').split(/(<strong>.*?<\/strong>)/g);
  return parts.map((p, i) => (p.startsWith('<strong>') ? <strong key={i}>{p.replace(/<\/?strong>/g, '')}</strong> : p));
}

// Body 1 mục — khớp Privacy.jsx: hỗ trợ thêm type "list"/"mixed" (danh sách <li> trộn với đoạn văn).
function SectionBody({ s }) {
  if (s.type === 'list' || s.type === 'mixed') {
    const items = String(s.body || '').split(/(<li>.*?<\/li>)/g).filter((x) => x.startsWith('<li>'));
    const lead = String(s.body || '').replace(/(<li>.*?<\/li>)/g, '').trim();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {lead && <p style={{ margin: 0 }}><Rich html={lead} /></p>}
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((li, i) => <li key={i}><Rich html={li.replace(/<\/?li>/g, '')} /></li>)}
        </ul>
      </div>
    );
  }
  return <p style={{ margin: 0 }}><Rich html={s.body} /></p>;
}

// Preview khớp gần đúng layout thật của 5 trang public (Terms/Privacy dùng "sections", Faq dùng
// "items" {q,a}, Transfer dùng "steps"+"notes", Process dùng "steps" có ảnh) — admin xem trước nội
// dung sẽ hiện ra sao mà không cần lưu rồi mở tab khác kiểm tra.
function PolicyPreview({ slug, title, subtitle, updatedLabel, contentJson }) {
  const content = parseContent(contentJson);
  const textStyle = { font: 'inherit', color: 'inherit', lineHeight: 1.6 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, font: '15px/1.5 var(--font-body, sans-serif)', color: '#1a1a1a' }}>
      <div>
        <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 700 }}>{title || '(chưa có tiêu đề)'}</h1>
        {subtitle && <p style={{ margin: 0, fontSize: 14, color: '#666' }}>{subtitle}</p>}
        {updatedLabel && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#999' }}>{updatedLabel}</p>}
      </div>

      {slug === 'faq' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(content.items || []).map((item, i) => (
            <div key={i} style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{item.q}</div>
              <div style={{ ...textStyle, fontSize: 14 }}>{item.a}</div>
            </div>
          ))}
          {!(content.items || []).length && <p style={{ color: '#999' }}>Chưa có câu hỏi nào.</p>}
        </div>
      ) : slug === 'transfer' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(content.steps || []).map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', border: '1px solid #e5e5e5', borderRadius: 12, padding: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f36b21', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.title}</div>
                  <div style={{ ...textStyle, fontSize: 14 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          {!!(content.notes || []).length && (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {content.notes.map((n, i) => <li key={i} style={textStyle}>{n}</li>)}
            </ul>
          )}
        </>
      ) : slug === 'process' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(content.steps || []).map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', border: '1px solid #e5e5e5', borderRadius: 12, padding: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f36b21', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>{i + 1}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontWeight: 600 }}>{s.title}</div>
                <div style={{ ...textStyle, fontSize: 14 }}>{s.desc}</div>
                {s.imageUrl && <img src={s.imageUrl} alt="" style={{ maxWidth: 240, borderRadius: 8, marginTop: 6 }} />}
              </div>
            </div>
          ))}
          {!(content.steps || []).length && <p style={{ color: '#999' }}>Chưa có bước nào.</p>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(content.sections || []).map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{s.title}</h2>
              <SectionBody s={s} />
            </div>
          ))}
          {!(content.sections || []).length && <p style={{ color: '#999' }}>Chưa có nội dung nào.</p>}
        </div>
      )}
    </div>
  );
}

// Quy trình 5 bước dùng editor riêng (từng bước có ảnh minh hoạ) thay vì bắt admin gõ tay JSON —
// 4 trang chính sách còn lại vẫn sửa qua ô JSON thô (ít khi đổi cấu trúc, không cần ảnh).
function ProcessStepsEditor({ contentJson, onChange }) {
  const content = parseContent(contentJson);
  const steps = content.steps?.length ? content.steps : [EMPTY_STEP];

  const commit = (nextSteps) => onChange(JSON.stringify({ ...content, steps: nextSteps }));

  const setStep = (i, field, value) => {
    const next = steps.map((s, idx) => (idx === i ? { ...s, [field]: value } : s));
    commit(next);
  };
  const addStep = () => commit([...steps, { ...EMPTY_STEP }]);
  const removeStep = (i) => commit(steps.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {steps.map((s, i) => (
        <div key={i} style={{ border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-field)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--action-primary)' }}>Bước {i + 1}</span>
            {steps.length > 1 && <button type="button" onClick={() => removeStep(i)} aria-label="Xóa bước" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--status-danger)', display: 'flex' }}><Trash2 size={16} /></button>}
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Tiêu đề bước</span>
            <input value={s.title || ''} onChange={(e) => setStep(i, 'title', e.target.value)}
              style={{ borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-body-sm)' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Mô tả ngắn (hiện ở tóm tắt)</span>
            <textarea rows={2} value={s.desc || ''} onChange={(e) => setStep(i, 'desc', e.target.value)}
              style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-body-sm)' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Chi tiết đầy đủ (hiện ở trang quy trình chi tiết)</span>
            <textarea rows={4} value={s.detail || ''} onChange={(e) => setStep(i, 'detail', e.target.value)}
              style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-body-sm)' }} />
          </label>
          <ImageUrlInput label="Ảnh minh họa bước (tùy chọn)" value={s.imageUrl || ''} onChange={(url) => setStep(i, 'imageUrl', url)} placeholder="https://..." />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addStep} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> Thêm bước</Button>
    </div>
  );
}

export default function AdminPolicyPages({ notify }) {
  const [slug, setSlug] = useState('terms');
  const { data: pages, isLoading, isError } = useAdminPolicyPages();
  const update = useUpdatePolicyPage();
  const [form, setForm] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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

        {slug !== 'process' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Nhãn cập nhật (tùy chọn, VD: "Cập nhật lần cuối: 01/08/2026")</span>
            <input value={updatedLabel} onChange={(e) => set('updatedLabel', e.target.value)}
              style={{ borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-body-sm)' }} />
          </label>
        )}

        {slug === 'process' ? (
          <ProcessStepsEditor contentJson={contentJson} onChange={(json) => set('contentJson', json)} />
        ) : (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Nội dung (JSON)</span>
            <textarea value={contentJson} onChange={(e) => set('contentJson', e.target.value)} rows={18}
              style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--grey-200)', padding: '10px 12px', font: 'var(--type-mono, monospace)', fontSize: 13 }} />
          </label>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="primary" size="md" loading={update.isPending} onClick={save}>Lưu nội dung</Button>
          <Button variant="outline" size="md" onClick={() => setPreviewOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={16} /> Xem trước</Button>
          {form && <Button variant="ghost" size="md" onClick={() => setForm(null)}>Hủy</Button>}
        </div>
      </div>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title={`Xem trước — ${SLUG_OPTS.find((o) => o.value === slug)?.label || slug}`} maxWidth="720px">
        <div style={{ maxHeight: '70vh', overflow: 'auto', background: '#fff', borderRadius: 'var(--radius-field)', padding: 24, border: '1px solid var(--grey-200)' }}>
          <PolicyPreview slug={slug} title={title} subtitle={subtitle} updatedLabel={updatedLabel} contentJson={contentJson} />
        </div>
      </Modal>
    </div>
  );
}
