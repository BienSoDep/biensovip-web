import { useState, useEffect } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { Input } from '../../../components/index.jsx';
import { useAdminCustomers } from '../../../services/adminCustomers.js';
import { usePreviewEmail } from '../../../services/adminNotificationService.js';
import { usePreviewEmailTemplate } from '../../../services/emailTemplates.js';
import { sanitizeHtml } from '../../../lib/sanitizeHtml.js';
import { TYPE_LABEL } from './notificationConstants.js';

// Xem trước email chuẩn xác 100% theo layout EmailTemplate.Wrap từ backend
export function EmailPreview({ title, body }) {
  const hasTitle = Boolean(title && title.trim());
  const hasBody = Boolean(body && body.trim() && body !== '<p></p>');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Xem trước email thực tế</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chuẩn layout EmailTemplate.Wrap</span>
      </div>

      <div style={{ background: '#F4F4F7', borderRadius: 'var(--radius-md)', padding: '20px 14px', overflow: 'hidden', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
        <div style={{ maxWidth: 520, margin: '0 auto', background: '#ffffff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* Header */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/assets/logo-mark.png"
                alt="Biensovip"
                width={36}
                height={36}
                style={{ display: 'block', borderRadius: 9, objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://res.cloudinary.com/dvwt6npcl/image/upload/v1787380390/biensovip/branding/logo-mark.png';
                }}
              />
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.03em', color: '#1A1A2E', textTransform: 'uppercase' }}>
                BIENSOVIP
              </span>
            </div>
            <span style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap' }}>
              Mua bán biển số xe đẹp
            </span>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 22px 12px' }}>
            <div style={{ fontSize: 18, lineHeight: 1.35, color: '#1A1A2E', fontWeight: 700, marginBottom: 14 }}>
              {hasTitle ? (
                title
              ) : (
                <span style={{ color: '#9CA3AF', fontWeight: 600, fontStyle: 'italic' }}>
                  (Tiêu đề thông báo sẽ hiển thị tại đây)
                </span>
              )}
            </div>

            <div style={{ fontSize: 14, lineHeight: 1.7, color: '#374151' }}>
              {hasBody ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }} />
              ) : (
                <div style={{ color: '#9CA3AF', fontStyle: 'italic', padding: '6px 0' }}>
                  Nội dung thông báo gửi đến khách hàng sẽ hiển thị tại đây theo đúng định dạng được soạn...
                </div>
              )}
            </div>
          </div>

          {/* Dải 3 thẻ liên hệ */}
          <div style={{ padding: '14px 22px 18px' }}>
            <div style={{ background: '#F4F4F7', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E', marginBottom: 10 }}>
                Cần hỗ trợ? Liên hệ ngay với chúng tôi:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: 10, color: '#6B7280', fontWeight: 600 }}>GỌI ĐIỆN</span>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#a3610a', marginTop: 2 }}>081 579 2699</span>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: 10, color: '#6B7280', fontWeight: 600 }}>ZALO</span>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0068ff', marginTop: 2 }}>Chat Zalo</span>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: 10, color: '#6B7280', fontWeight: 600 }}>EMAIL</span>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#a3610a', marginTop: 2 }}>Gửi email</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 22px 20px', borderTop: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
                  <strong style={{ color: '#1A1A2E' }}>Biensovip</strong> — mua bán biển số xe đẹp.<br />
                  Điện thoại: 081 579 2699 &middot; Zalo: 0815792699
                </p>
                <div style={{ marginTop: 6, fontSize: 10, color: '#6B7280', textDecoration: 'underline' }}>
                  Hủy đăng ký nhận email thông báo
                </div>
              </div>
              <div style={{ alignSelf: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f19720' }}>
                  Truy cập website &rarr;
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <div style={{ width: 24, height: 24, lineHeight: '24px', textAlign: 'center', background: '#0068FF', borderRadius: '50%', color: '#ffffff', fontSize: 10, fontWeight: 800 }}>
                Z
              </div>
              <div style={{ width: 24, height: 24, lineHeight: '24px', textAlign: 'center', background: '#010101', borderRadius: '50%', color: '#ffffff', fontSize: 11, fontWeight: 700 }}>
                T
              </div>
              <div style={{ width: 24, height: 24, lineHeight: '24px', textAlign: 'center', background: '#1877F2', borderRadius: '50%', color: '#ffffff', fontSize: 12, fontWeight: 700 }}>
                f
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export function TemplatePreview({ templateId }) {
  const preview = usePreviewEmailTemplate();
  const [html, setHtml] = useState('');
  useEffect(() => {
    if (!templateId) { setHtml(''); return; }
    let cancelled = false;
    preview.mutateAsync({ id: templateId }).then((r) => { if (!cancelled) setHtml(r.html); }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);
  if (!templateId) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>Xem trước layout template</span>
      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)' }}>
        {html ? (
          <iframe title="Template preview" srcDoc={html} style={{ width: '100%', height: 480, border: 'none', borderRadius: 'var(--radius-md)', background: '#ffffff' }} />
        ) : (
          <div style={{ height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải preview…</div>
        )}
      </div>
    </div>
  );
}

export function LivePreviewPanel({ setting, title, content }) {
  const preview = usePreviewEmail();
  const [debouncedTitle] = useDebouncedValue(title, 400);
  const [debouncedContent] = useDebouncedValue(content, 400);
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;
    preview.mutateAsync({ type: setting.type, title: debouncedTitle || null, content: debouncedContent || null })
      .then((res) => { if (!cancelled) setHtml(res.html); })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setting.type, debouncedTitle, debouncedContent]);

  return (
    <div style={{ width: '100%', position: 'sticky', top: 'var(--space-4)', background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)' }}>
        <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Xem trước email</span>
        <p style={{ margin: '4px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{TYPE_LABEL[setting.type] || setting.type} — cập nhật theo nội dung bạn đang gõ.</p>
      </div>
      <div style={{ padding: 'var(--gutter-card)', background: 'var(--surface-sunken)' }}>
        {html ? (
          <iframe title="Email preview" srcDoc={html} style={{ width: '100%', height: 640, border: 'none', borderRadius: 'var(--radius-md)', background: '#ffffff' }} />
        ) : (
          <div style={{ height: 640, display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải preview…</div>
        )}
      </div>
    </div>
  );
}

export function UserPicker({ selected, onChange }) {
  const [q, setQ] = useState('');
  const { data, isLoading } = useAdminCustomers({ q, page: 1, perPage: 20 });
  const results = data?.items || [];

  const toggle = (u) => {
    const exists = selected.some((s) => s.id === u.id);
    onChange(exists ? selected.filter((s) => s.id !== u.id) : [...selected, { id: u.id, label: u.fullName || u.email || u.phone }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <Input label="Tìm người dùng (email, tên)" placeholder="Nhập để tìm…" value={q} onChange={(e) => setQ(e.target.value)} />
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selected.map((s) => (
            <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-pill)', padding: '4px 10px', font: 'var(--type-caption)', color: 'var(--text-strong)' }}>
              {s.label}
              <button type="button" onClick={() => onChange(selected.filter((x) => x.id !== s.id))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', font: 'var(--type-caption)' }}>×</button>
            </span>
          ))}
        </div>
      )}
      {q && (
        <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)' }}>
          {isLoading ? (
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đang tìm…</span>
          ) : results.length === 0 ? (
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Không tìm thấy</span>
          ) : (
            results.map((u) => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                <input type="checkbox" checked={selected.some((s) => s.id === u.id)} onChange={() => toggle(u)} />
                {u.fullName || '(chưa có tên)'} — {u.email || u.phone}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
