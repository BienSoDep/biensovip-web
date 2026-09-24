import { useState, useMemo, useRef } from 'react';
import {
  FileText,
  ShieldCheck,
  Truck,
  HelpCircle,
  GitBranch,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Printer,
  PhoneCall,
  ChevronDown,
  Sparkles,
  Plus,
  Trash2,
  Columns,
  Maximize2,
  Edit3,
  Smartphone,
  Monitor,
  Code2,
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import { ImageUrlInput } from '../../components/index.jsx';
import { useAdminPolicyPages, useUpdatePolicyPage } from '../../services/policyPages.js';
import { contentGet, contentItems } from '../../lib/content/index.js';

const SLUG_OPTS = [
  { value: 'terms', label: 'Điều khoản sử dụng', icon: FileText, desc: 'Quy định pháp lý, điều kiện giao dịch và bản quyền dịch vụ' },
  { value: 'privacy', label: 'Chính sách bảo mật', icon: ShieldCheck, desc: 'Quy định thu thập, sử dụng và bảo mật thông tin khách hàng' },
  { value: 'transfer', label: 'Hướng dẫn sang tên', icon: Truck, desc: 'Các bước, thủ tục và lưu ý chuyển quyền sở hữu biển số' },
  { value: 'faq', label: 'Câu hỏi thường gặp', icon: HelpCircle, desc: 'Giải đáp các thắc mắc phổ biến về định danh, giá và quy trình' },
  { value: 'process', label: 'Quy trình 5 bước', icon: GitBranch, desc: '5 bước mua bán, đặt cọc và bàn giao biển số đẹp' },
];

const EMPTY_STEP = { title: '', desc: '', detail: '', imageUrl: '' };

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Bộ phân tích HTML siêu nhẹ khớp Terms.jsx/Privacy.jsx (hỗ trợ <strong>)
function Rich({ html }) {
  const parts = String(html || '').split(/(<strong>.*?<\/strong>)/g);
  return parts.map((p, i) =>
    p.startsWith('<strong>') ? (
      <strong key={i}>{p.replace(/<\/?strong>/g, '')}</strong>
    ) : (
      p
    )
  );
}

// Body đoạn văn hoặc danh sách bullet
function SectionBody({ s }) {
  if (s.type === 'list' || s.type === 'mixed') {
    const items = String(s.body || '')
      .split(/(<li>.*?<\/li>)/g)
      .filter((x) => x.startsWith('<li>'));
    const lead = String(s.body || '')
      .replace(/(<li>.*?<\/li>)/g, '')
      .trim();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, font: 'var(--type-body)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>
        {lead && <p style={{ margin: 0 }}><Rich html={lead} /></p>}
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((li, i) => (
            <li key={i}><Rich html={li.replace(/<\/?li>/g, '')} /></li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>
      <Rich html={s.body} />
    </p>
  );
}

// LIVE PREVIEW: Render 100% chuẩn xác theo giao diện thật của khách ngoài trang chủ
function PolicyLivePreview({ slug, title, subtitle, updatedLabel, content, deviceMode = 'desktop' }) {
  const [openFaq, setOpenFaq] = useState(0);
  const previewScrollRef = useRef(null);

  const sections = content?.sections || contentItems(`${slug}.sections`) || [];
  const faqItems = content?.items || contentItems('faq.items') || [];
  const transferSteps = content?.steps || contentItems('transfer.steps') || [];
  const transferNotes = content?.notes || contentItems('transfer.notes') || [];
  const processSteps = content?.steps || contentItems('process.steps') || [];

  return (
    <div style={{
      width: '100%',
      maxWidth: deviceMode === 'mobile' ? 390 : '100%',
      margin: '0 auto',
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-card)',
      border: '1px solid var(--border-hairline)',
      boxShadow: deviceMode === 'mobile' ? '0 12px 36px rgba(0,0,0,0.12)' : 'none',
      overflow: 'hidden',
      transition: 'all 200ms var(--ease-out)',
    }}>
      {/* Giả lập thanh trình duyệt của khách */}
      <div style={{
        background: 'var(--white)',
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
            biensovip.com/{slug === 'terms' ? 'dieu-khoan' : slug === 'privacy' ? 'bao-mat' : slug === 'transfer' ? 'sang-ten' : slug === 'faq' ? 'hoi-dap' : 'quy-trinh'}
          </span>
        </div>
        <span style={{ background: 'var(--surface-sunken)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontWeight: 'var(--fw-semibold)' }}>
          {deviceMode === 'mobile' ? 'Giao diện Mobile' : 'Giao diện Desktop'}
        </span>
      </div>

      {/* Nội dung thực tế hiển thị cho người dùng */}
      <div
        ref={previewScrollRef}
        style={{
          padding: deviceMode === 'mobile' ? '20px 16px' : '32px 28px',
          maxHeight: 680,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        {/* 1. Header Trang Public */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <div>
            <h1 style={{
              margin: '0 0 var(--space-2)',
              font: deviceMode === 'mobile' ? 'var(--type-title-1)' : 'var(--type-display-2)',
              letterSpacing: 'var(--ls-display)',
              color: 'var(--text-strong)',
              lineHeight: 1.25,
            }}>
              {title || '(Chưa nhập tiêu đề)'}
            </h1>
            {subtitle && (
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {subtitle}
              </p>
            )}
            {updatedLabel && (
              <p style={{ margin: '6px 0 0', font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                {updatedLabel}
              </p>
            )}
          </div>

          {(slug === 'terms' || slug === 'privacy') && deviceMode !== 'mobile' && (
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                border: '1px solid var(--border-hairline)',
                background: 'var(--surface-card)',
                color: 'var(--text-strong)',
                padding: '7px 12px',
                borderRadius: 'var(--radius-field)',
                font: 'var(--type-caption)',
                fontWeight: 'var(--fw-medium)',
                cursor: 'default',
              }}
            >
              <Printer size={14} />
              <span>In trang</span>
            </button>
          )}
        </div>

        {/* 2. Layout Chi Tiết Theo Từng Loại Trang */}
        {slug === 'terms' || slug === 'privacy' ? (
          <>
            {/* Mục Lục Thông Minh */}
            {sections.length > 0 && (
              <nav style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-card)',
                padding: '14px 18px',
                border: '1px solid var(--border-hairline)',
                boxShadow: 'var(--shadow-inset-hairline)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-strong)' }}>
                  Mục lục bài viết
                </span>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {sections.map((s, idx) => (
                    <li key={idx} style={{ font: 'var(--type-body-sm)', color: 'var(--action-primary)' }}>
                      <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                        {s.title}
                      </span>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Nội Dung Điều Khoản / Bảo Mật */}
            <div style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-inset-hairline)',
              padding: deviceMode === 'mobile' ? '18px 16px' : '24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-6)',
              border: '1px solid var(--border-hairline)',
            }}>
              {sections.map((s, idx) => (
                <div key={idx} id={`sec-${slugify(s.title)}`} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)', fontSize: '1.15rem' }}>
                    {s.title}
                  </h2>
                  <SectionBody s={s} />
                </div>
              ))}
              {sections.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>
                  Chưa có điều khoản nào được thiết lập.
                </p>
              )}
            </div>
          </>
        ) : slug === 'transfer' ? (
          <>
            {/* Các Bước Hướng Dẫn Sang Tên */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {transferSteps.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--white)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: 'var(--shadow-inset-hairline)',
                    padding: '16px 18px',
                    display: 'flex',
                    gap: 'var(--space-4)',
                    alignItems: 'flex-start',
                    border: '1px solid var(--border-hairline)',
                  }}
                >
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--action-primary)',
                    color: 'var(--white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 'var(--fw-bold)',
                    font: 'var(--type-title-3)',
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                      {s.title}
                    </h3>
                    <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 1.55 }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Banner Hỗ Trợ Kèm Hotline / Zalo */}
            <div style={{
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-card)',
              padding: '18px 20px',
              border: '1px solid var(--border-hairline)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <PhoneCall size={20} color="var(--action-primary)" />
                <div>
                  <div style={{ font: 'var(--type-title-3)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                    {contentGet('transfer.need_help_title') || 'Cần hỗ trợ sang tên nhanh?'}
                  </div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Đội ngũ chuyên viên sẵn sàng tư vấn thủ tục thu hồi và đăng ký biển số trọn gói.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--action-primary)',
                  color: 'var(--text-inverse)',
                  font: 'var(--type-caption)',
                  fontWeight: 'var(--fw-semibold)',
                }}>
                  Nhắn Zalo tư vấn
                </span>
              </div>
            </div>

            {/* Khối Ghi Chú Quan Trọng */}
            {transferNotes.length > 0 && (
              <div style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-card)',
                padding: '16px 20px',
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}>
                <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                  Lưu ý quan trọng khi sang tên:
                </h3>
                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4, font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
                  {transferNotes.map((n, idx) => (
                    <li key={idx}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : slug === 'faq' ? (
          <>
            {/* Accordion Câu Hỏi Thường Gặp */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {faqItems.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--white)',
                      borderRadius: 'var(--radius-card)',
                      border: '1px solid var(--border-hairline)',
                      boxShadow: 'var(--shadow-inset-hairline)',
                      overflow: 'hidden',
                      transition: 'border-color 140ms var(--ease-out)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--space-3)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                        {item.q}
                      </span>
                      <ChevronDown
                        size={17}
                        style={{
                          color: 'var(--text-muted)',
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 180ms var(--ease-out)',
                          flexShrink: 0,
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: '0 18px 16px',
                        font: 'var(--type-body-sm)',
                        color: 'var(--text-body)',
                        lineHeight: 1.6,
                        borderTop: '1px dashed var(--border-hairline)',
                        paddingTop: 12,
                      }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
              {faqItems.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>
                  Chưa có câu hỏi nào trong danh mục.
                </p>
              )}
            </div>

            {/* Banner Chưa Tìm Thấy Câu Trả Lời */}
            <div style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              padding: '20px',
              textAlign: 'center',
              border: '1px solid var(--border-hairline)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}>
              <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                Chưa tìm thấy câu trả lời bạn cần?
              </h3>
              <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                Đội ngũ hỗ trợ Biensovip trực tuyến 24/7 để giải đáp mọi câu hỏi của quý khách.
              </p>
            </div>
          </>
        ) : (
          /* Process (Quy trình 5 bước) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {processSteps.map((s, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  padding: '16px 18px',
                  display: 'flex',
                  gap: 'var(--space-4)',
                  alignItems: 'flex-start',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--action-primary)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontWeight: 'var(--fw-bold)',
                  font: 'var(--type-title-3)',
                }}>
                  {idx + 1}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                    {s.title}
                  </h3>
                  <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 1.55 }}>
                    {s.desc}
                  </p>
                  {s.detail && (
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', background: 'var(--surface-sunken)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                      {s.detail}
                    </div>
                  )}
                  {s.imageUrl && (
                    <img src={s.imageUrl} alt="" style={{ maxWidth: 220, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)', marginTop: 4 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Editor từng bước cho Quy trình 5 bước
function ProcessStepsEditor({ contentJson, onChange }) {
  const content = useMemo(() => {
    try { return JSON.parse(contentJson || '{}'); } catch { return {}; }
  }, [contentJson]);

  const steps = content.steps?.length ? content.steps : [EMPTY_STEP];

  const commit = (nextSteps) => onChange(JSON.stringify({ ...content, steps: nextSteps }, null, 2));

  const setStep = (i, field, value) => {
    const next = steps.map((s, idx) => (idx === i ? { ...s, [field]: value } : s));
    commit(next);
  };
  const addStep = () => commit([...steps, { ...EMPTY_STEP }]);
  const removeStep = (i) => commit(steps.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {steps.map((s, i) => (
        <div key={i} style={{ border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-field)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: 'var(--surface-sunken)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: 'var(--type-label)', color: 'var(--action-primary)', fontWeight: 'var(--fw-bold)' }}>Bước {i + 1}</span>
            {steps.length > 1 && (
              <button type="button" onClick={() => removeStep(i)} aria-label="Xóa bước" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--status-danger)', display: 'flex' }}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Tiêu đề bước</span>
            <input value={s.title || ''} onChange={(e) => setStep(i, 'title', e.target.value)}
              style={{ borderRadius: 'var(--radius-field)', border: '1px solid var(--border-hairline)', padding: '8px 10px', font: 'var(--type-body-sm)', background: 'var(--surface-card)' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Mô tả ngắn (hiện ở tóm tắt)</span>
            <textarea rows={2} value={s.desc || ''} onChange={(e) => setStep(i, 'desc', e.target.value)}
              style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--border-hairline)', padding: '8px 10px', font: 'var(--type-body-sm)', background: 'var(--surface-card)' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>Chi tiết đầy đủ</span>
            <textarea rows={3} value={s.detail || ''} onChange={(e) => setStep(i, 'detail', e.target.value)}
              style={{ resize: 'vertical', borderRadius: 'var(--radius-field)', border: '1px solid var(--border-hairline)', padding: '8px 10px', font: 'var(--type-body-sm)', background: 'var(--surface-card)' }} />
          </label>
          <ImageUrlInput label="Ảnh minh họa bước (tùy chọn)" value={s.imageUrl || ''} onChange={(url) => setStep(i, 'imageUrl', url)} placeholder="https://..." />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addStep} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Plus size={14} /> Thêm bước
      </Button>
    </div>
  );
}

export default function AdminPolicyPages({ notify }) {
  const [slug, setSlug] = useState('terms');
  const [viewLayout, setViewLayout] = useState('split'); // 'split' | 'editor' | 'preview'
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'mobile'

  const { data: pages, isLoading, isError } = useAdminPolicyPages();
  const update = useUpdatePolicyPage();
  const [form, setForm] = useState(null);

  const page = pages?.find((p) => p.slug === slug);
  const current = form || page || {};
  const title = current.title ?? '';
  const subtitle = current.subtitle ?? '';
  const updatedLabel = current.updatedLabel ?? '';
  const contentJson = current.contentJson ?? '{}';

  // Kiểm tra tính hợp lệ của JSON theo thời gian thực
  const jsonStatus = useMemo(() => {
    if (slug === 'process') return { valid: true, parsed: null };
    try {
      const parsed = JSON.parse(contentJson || '{}');
      return { valid: true, parsed };
    } catch (e) {
      return { valid: false, error: e.message, parsed: null };
    }
  }, [contentJson, slug]);

  const set = (field, value) => setForm({ title, subtitle, updatedLabel, contentJson, [field]: value });

  const selectSlug = (v) => {
    setSlug(v);
    setForm(null);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(contentJson || '{}');
      set('contentJson', JSON.stringify(parsed, null, 2));
      notify('Đã định dạng JSON đẹp mắt');
    } catch {
      notify('JSON đang có lỗi cú pháp, vui lòng kiểm tra dấu phẩy hoặc ngoặc');
    }
  };

  const save = async () => {
    if (!title.trim()) { notify('Vui lòng nhập tiêu đề'); return; }
    if (!jsonStatus.valid) {
      notify('Nội dung JSON không hợp lệ — kiểm tra lại dấu ngoặc/dấu phẩy trước khi lưu');
      return;
    }
    try {
      await update.mutateAsync({ slug, title: title.trim(), subtitle: subtitle || null, updatedLabel: updatedLabel || null, contentJson });
      notify('Đã lưu nội dung trang thành công');
      setForm(null);
    } catch (e) {
      notify(e.message || 'Lỗi khi lưu nội dung');
    }
  };

  if (isLoading) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải dữ liệu chính sách…</div>;
  if (isError) return <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Lỗi tải danh sách trang chính sách</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', animation: 'pageIn 180ms var(--ease-out)', width: '100%' }}>
      {/* 1. Header Toolbar Đồng Bộ */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        background: 'var(--surface-card)',
        padding: 'var(--gutter-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)', margin: 0 }}>
              Trang Chính Sách & Quy Định Công Khai
            </h1>
            <span style={{
              background: 'var(--blue-50)',
              color: 'var(--action-primary)',
              padding: '2px 10px',
              borderRadius: 'var(--radius-pill)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-bold)',
              border: '1px solid var(--blue-100)',
            }}>
              Thời gian thực
            </span>
          </div>
          <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Chỉnh sửa nội dung và xem trước trực quan chuẩn 100% theo giao diện thực tế của người dùng.
          </p>
        </div>

        {/* Chế độ xem: Chia đôi (Split) / Chỉ sửa / Chỉ xem trước */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 3, background: 'var(--surface-sunken)', padding: 3, borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-hairline)' }}>
            <button
              type="button"
              onClick={() => setViewLayout('split')}
              style={{
                border: 'none',
                background: viewLayout === 'split' ? 'var(--text-strong)' : 'transparent',
                color: viewLayout === 'split' ? 'var(--white)' : 'var(--text-muted)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                font: 'var(--type-caption)',
                fontWeight: viewLayout === 'split' ? 'var(--fw-bold)' : 'var(--fw-medium)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'var(--transition-control)',
              }}
            >
              <Columns size={13} />
              <span>Chia đôi (Split)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewLayout('editor')}
              style={{
                border: 'none',
                background: viewLayout === 'editor' ? 'var(--text-strong)' : 'transparent',
                color: viewLayout === 'editor' ? 'var(--white)' : 'var(--text-muted)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                font: 'var(--type-caption)',
                fontWeight: viewLayout === 'editor' ? 'var(--fw-bold)' : 'var(--fw-medium)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'var(--transition-control)',
              }}
            >
              <Edit3 size={13} />
              <span>Chỉ soạn thảo</span>
            </button>

            <button
              type="button"
              onClick={() => setViewLayout('preview')}
              style={{
                border: 'none',
                background: viewLayout === 'preview' ? 'var(--text-strong)' : 'transparent',
                color: viewLayout === 'preview' ? 'var(--white)' : 'var(--text-muted)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                font: 'var(--type-caption)',
                fontWeight: viewLayout === 'preview' ? 'var(--fw-bold)' : 'var(--fw-medium)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'var(--transition-control)',
              }}
            >
              <Maximize2 size={13} />
              <span>Toàn màn hình</span>
            </button>
          </div>

          {/* Toggle Mobile / Desktop */}
          {viewLayout !== 'editor' && (
            <div style={{ display: 'flex', gap: 3, background: 'var(--surface-sunken)', padding: 3, borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-hairline)' }}>
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                title="Xem trước màn hình Máy tính"
                style={{
                  border: 'none',
                  background: deviceMode === 'desktop' ? 'var(--white)' : 'transparent',
                  color: deviceMode === 'desktop' ? 'var(--action-primary)' : 'var(--text-muted)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: deviceMode === 'desktop' ? 'var(--shadow-1)' : 'none',
                }}
              >
                <Monitor size={15} />
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                title="Xem trước màn hình Điện thoại"
                style={{
                  border: 'none',
                  background: deviceMode === 'mobile' ? 'var(--white)' : 'transparent',
                  color: deviceMode === 'mobile' ? 'var(--action-primary)' : 'var(--text-muted)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: deviceMode === 'mobile' ? 'var(--shadow-1)' : 'none',
                }}
              >
                <Smartphone size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Tabs Chọn Trang Chính Sách */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)',
        overflowX: 'auto',
        paddingBottom: 2,
        WebkitOverflowScrolling: 'touch',
      }}>
        {SLUG_OPTS.map((opt) => {
          const active = slug === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => selectSlug(opt.value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 'var(--radius-pill)',
                border: active ? '1px solid var(--text-strong)' : '1px solid var(--border-hairline)',
                background: active ? 'var(--text-strong)' : 'var(--surface-card)',
                color: active ? 'var(--white)' : 'var(--text-strong)',
                font: 'var(--type-body-sm)',
                fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'var(--transition-control)',
                boxShadow: active ? 'var(--shadow-1)' : 'none',
              }}
            >
              <Icon size={16} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Khung Làm Việc (Split View: Cột Trái Editor + Cột Phải Live Preview) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: viewLayout === 'split' ? 'minmax(380px, 1fr) minmax(420px, 1.25fr)' : '1fr',
        gap: 'var(--space-4)',
        alignItems: 'start',
      }}>
        {/* CỘT A: TRÌNH SOẠN THẢO (EDITOR) */}
        {viewLayout !== 'preview' && (
          <div style={{
            background: 'var(--surface-card)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            padding: 'var(--gutter-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-hairline)', paddingBottom: 'var(--space-3)' }}>
              <div>
                <h2 style={{ font: 'var(--type-title-2)', margin: 0, fontWeight: 'var(--fw-bold)' }}>
                  Chỉnh sửa: {SLUG_OPTS.find((o) => o.value === slug)?.label}
                </h2>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 2 }}>
                  {SLUG_OPTS.find((o) => o.value === slug)?.desc}
                </div>
              </div>

              {slug !== 'process' && (
                <button
                  type="button"
                  onClick={formatJson}
                  title="Format JSON cho dễ nhìn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border-hairline)',
                    font: 'var(--type-caption)',
                    cursor: 'pointer',
                    color: 'var(--text-strong)',
                  }}
                >
                  <Code2 size={13} />
                  <span>Định dạng JSON</span>
                </button>
              )}
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                Tiêu đề trang
              </span>
              <input
                value={title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="VD: Điều khoản sử dụng"
                style={{
                  borderRadius: 'var(--radius-field)',
                  border: '1px solid var(--border-hairline)',
                  padding: '9px 12px',
                  font: 'var(--type-body-sm)',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-strong)',
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                Phụ đề mô tả (tùy chọn)
              </span>
              <input
                value={subtitle}
                onChange={(e) => set('subtitle', e.target.value)}
                placeholder="Mô tả tóm tắt hiện dưới tiêu đề"
                style={{
                  borderRadius: 'var(--radius-field)',
                  border: '1px solid var(--border-hairline)',
                  padding: '9px 12px',
                  font: 'var(--type-body-sm)',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-strong)',
                }}
              />
            </label>

            {slug !== 'process' && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                  Nhãn ngày cập nhật (tùy chọn)
                </span>
                <input
                  value={updatedLabel}
                  onChange={(e) => set('updatedLabel', e.target.value)}
                  placeholder="VD: Cập nhật lần cuối: 01/08/2026"
                  style={{
                    borderRadius: 'var(--radius-field)',
                    border: '1px solid var(--border-hairline)',
                    padding: '9px 12px',
                    font: 'var(--type-body-sm)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-strong)',
                  }}
                />
              </label>
            )}

            {/* Trình nhập nội dung */}
            {slug === 'process' ? (
              <ProcessStepsEditor contentJson={contentJson} onChange={(json) => set('contentJson', json)} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                    Cấu trúc nội dung chi tiết (JSON)
                  </span>

                  {/* Trạng thái xác thực cú pháp JSON */}
                  <span style={{
                    font: 'var(--type-caption)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    color: jsonStatus.valid ? 'var(--status-success-ink)' : 'var(--status-danger-ink)',
                    background: jsonStatus.valid ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: 'var(--fw-semibold)',
                  }}>
                    {jsonStatus.valid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    <span>{jsonStatus.valid ? 'Cú pháp JSON chuẩn' : 'Có lỗi cú pháp JSON'}</span>
                  </span>
                </div>

                <textarea
                  value={contentJson}
                  onChange={(e) => set('contentJson', e.target.value)}
                  rows={viewLayout === 'split' ? 18 : 22}
                  style={{
                    resize: 'vertical',
                    borderRadius: 'var(--radius-field)',
                    border: `1px solid ${jsonStatus.valid ? 'var(--border-hairline)' : 'var(--status-danger)'}`,
                    padding: '12px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    lineHeight: 1.5,
                    background: 'var(--surface-sunken)',
                    color: 'var(--text-strong)',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* Thanh Nút Thao Tác */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-hairline)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="primary" size="md" loading={update.isPending} onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={15} />
                  <span>Lưu nội dung</span>
                </Button>

                {form && (
                  <Button variant="outline" size="md" onClick={() => setForm(null)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RotateCcw size={15} />
                    <span>Hủy thay đổi</span>
                  </Button>
                )}
              </div>

              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                {form ? '⚠️ Có thay đổi chưa lưu' : 'Đã đồng bộ với CSDL'}
              </div>
            </div>
          </div>
        )}

        {/* CỘT B: LIVE PREVIEW THỰC TẾ (XEM TRƯỚC THỜI GIAN THỰC) */}
        {viewLayout !== 'editor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="var(--amber-500)" />
                <span style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                  Xem trước thời gian thực (Live Preview)
                </span>
              </div>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                Cập nhật tức thì khi bạn gõ
              </span>
            </div>

            <PolicyLivePreview
              slug={slug}
              title={title}
              subtitle={subtitle}
              updatedLabel={updatedLabel}
              content={jsonStatus.valid ? jsonStatus.parsed : null}
              deviceMode={deviceMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
