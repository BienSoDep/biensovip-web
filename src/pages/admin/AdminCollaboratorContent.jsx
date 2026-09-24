import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Columns,
  Edit3,
  Maximize2,
  Monitor,
  Smartphone,
  ExternalLink,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  HandCoins,
  Wallet,
  UserPlus,
  ArrowRight,
  Code2,
  Check,
  Share2,
  Link2,
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import CollaboratorIllustration from '../../components/CollaboratorIllustration.jsx';
import CounterStat from '../../components/CounterStat.jsx';
import EditableBlock from '../../components/EditableBlock.jsx';
import { useAdminCollaboratorBenefitContent } from '../../services/adminCollaborators.js';
import { useCollaboratorBenefitContent } from '../../services/collaborators.js';
import { sanitizeHtml } from '../../lib/sanitizeHtml.js';

// Mốc trượt tính hoa hồng mô phỏng thực tế khớp với Collaborator.jsx
const CALC_STEPS = [3_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000, 100_000_000, 300_000_000];
const CALC_RATE = 0.10;
const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

const STATS_DATA = [
  { icon: UserPlus, value: 50, suffix: '+', label: 'CTV đang hoạt động' },
  { icon: Wallet, value: 100, suffix: 'tr+', label: 'Đã chi trả hoa hồng' },
  { icon: HandCoins, value: 10, suffix: '%', label: 'Hoa hồng mặc định' },
];

const PROCESS_PREVIEW_STEPS = [
  { n: 1, title: 'Đăng ký & Kích hoạt', desc: 'Bấm kích hoạt CTV và xác thực email trong 30 giây.' },
  { n: 2, title: 'Chia sẻ liên kết', desc: 'Gửi link biển số hoặc mã QR cho người quen có nhu cầu.' },
  { n: 3, title: 'Khách chốt cọc', desc: 'Hệ thống tự động ghi nhận hoa hồng ngay khi có đơn cọc.' },
  { n: 4, title: 'Nhận hoa hồng', desc: 'Rút tiền đối soát định kỳ về tài khoản ngân hàng VietQR.' },
];

const DEFAULT_SAMPLE_TITLE = 'Trở thành Cộng tác viên Biển Số VIP';
const DEFAULT_SAMPLE_BODY = `<p>Giới thiệu bạn bè mua biển số đẹp, bạn nhận hoa hồng hấp dẫn trên mỗi giao dịch thành công. Chia sẻ mã giới thiệu, theo dõi hoa hồng và đối soát minh bạch ngay trên bảng điều khiển CTV.</p>
<ul>
  <li>Nhận hoa hồng lên đến 10% cho mỗi khách mua thành công</li>
  <li>Theo dõi lượt click, khách giới thiệu, giao dịch realtime</li>
  <li>Quản lý hoa hồng chờ chi trả và đã chi trả rõ ràng, minh bạch</li>
  <li>Bộ công cụ marketing chuyên nghiệp: link giới thiệu cá nhân & mã QR tiện lợi</li>
</ul>`;

// Kiểm tra tính cân bằng của các thẻ HTML phổ biến
function validateHtmlTags(html) {
  if (!html) return [];
  const tags = ['p', 'ul', 'li', 'strong', 'em', 'span', 'b', 'i', 'mark'];
  const issues = [];
  tags.forEach((t) => {
    const openMatches = html.match(new RegExp(`<${t}(\\s[^>]*)?>`, 'gi')) || [];
    const closeMatches = html.match(new RegExp(`</${t}>`, 'gi')) || [];
    if (openMatches.length !== closeMatches.length) {
      issues.push(`Thẻ <${t}> chưa cân bằng (${openMatches.length} mở, ${closeMatches.length} đóng)`);
    }
  });
  return issues;
}

// Máy tính hoa hồng tương tác trong Live Preview
function LiveCommissionCalculator() {
  const [step, setStep] = useState(2);
  const deposit = CALC_STEPS[step];
  const commission = Math.round(deposit * CALC_RATE);

  return (
    <div style={{
      background: 'var(--surface-tint-cream)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--gutter-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      border: '1px solid rgba(212, 101, 10, 0.12)',
    }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <HandCoins size={16} color="var(--action-primary)" /> Thử tính hoa hồng của bạn
      </span>
      <input
        type="range"
        min={0}
        max={CALC_STEPS.length - 1}
        step={1}
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
        aria-label="Chọn số tiền khách đặt cọc"
        className="ctv-calc-slider"
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <span style={{ display: 'block', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Khách đặt cọc</span>
          <span style={{ display: 'block', font: 'var(--type-title-2)', color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>{money(deposit)}</span>
        </div>
        <ArrowRight size={20} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'block', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Bạn nhận (10%)</span>
          <span style={{ display: 'block', font: 'var(--type-title-1)', color: 'var(--action-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.3, fontWeight: 'var(--fw-bold)' }}>
            {money(commission)}
          </span>
        </div>
      </div>
    </div>
  );
}

// LIVE PREVIEW CHUẨN XÁC 100% THEO GIAO DIỆN TRANG /cong-tac-vien — HỖ TRỢ CHỈNH SỬA 2 CHIỀU TRỰC TIẾP
function CollaboratorBenefitLivePreview({ titleHtml, bodyHtml, onUpdateTitle, onUpdateBody, deviceMode = 'desktop' }) {
  const isMobile = deviceMode === 'mobile';

  return (
    <div style={{
      width: '100%',
      maxWidth: isMobile ? 390 : '100%',
      margin: '0 auto',
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-card)',
      border: '1px solid var(--border-hairline)',
      boxShadow: isMobile ? '0 16px 40px rgba(0,0,0,0.12)' : 'none',
      overflow: 'hidden',
      transition: 'all 200ms var(--ease-out)',
    }}>
      {/* Giả lập thanh trình duyệt khách */}
      <div style={{
        background: 'var(--white)',
        borderBottom: '1px solid var(--border-hairline)',
        padding: '9px 14px',
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
          <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
            biensovip.com/cong-tac-vien
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            background: 'var(--surface-sunken)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 'var(--fw-semibold)',
            fontSize: '0.7rem',
          }}>
            {isMobile ? '📱 Mobile 390px' : '💻 Desktop'}
          </span>
          <a
            href="/cong-tac-vien"
            target="_blank"
            rel="noopener noreferrer"
            title="Mở trang khách trong tab mới"
            style={{ color: 'var(--action-primary)', display: 'inline-flex', alignItems: 'center' }}
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Thanh thông báo chế độ chỉnh sửa trực tiếp 2 chiều */}
      <div style={{
        background: 'var(--brand-50)',
        borderBottom: '1px solid var(--brand-200)',
        padding: '7px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-2)',
        fontSize: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>
          <Edit3 size={13} />
          <span>Chỉnh sửa trực tiếp: Nhấp vào chữ trên bản xem trước để sửa — tự động đồng bộ sang ô HTML bên trái.</span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Đồng bộ 2 chiều</span>
      </div>

      {/* Nội dung thực tế hiển thị cho người xem */}
      <div style={{
        padding: isMobile ? '20px 14px' : '32px 28px',
        maxHeight: 'calc(100vh - 220px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}>
        {/* KHỐI 1: HERO CARD ƯU ĐÃI & QUYỀN LỢI CTV */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-inset-hairline)',
          padding: isMobile ? 'var(--space-5)' : 'var(--space-8) var(--gutter-card)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Huy hiệu chương trình đối tác */}
          <div style={{ alignSelf: 'flex-start' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--brand-50)',
              color: 'var(--action-primary)',
              border: '1px solid var(--brand-200)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-bold)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <Sparkles size={12} /> Chương trình Đối tác Cộng tác viên
            </span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: 'var(--space-6)',
          }}>
            {/* Cột trái: Tiêu đề + Nội dung HTML tùy chỉnh + Thống kê */}
            <div style={{
              flex: '1 1 360px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-5)',
              minWidth: 0,
              width: '100%',
            }}>
              {/* Tiêu đề trang (HTML) — Cho phép chỉnh sửa trực tiếp trên bản xem trước */}
              <EditableBlock
                tag="h1"
                html={titleHtml || 'Trở thành Cộng tác viên'}
                onChange={onUpdateTitle}
                multiline={false}
                title="Nhấp vào để sửa Tiêu đề (tự động đồng bộ sang ô HTML bên trái)"
                style={{
                  margin: 0,
                  font: isMobile ? 'var(--type-title-1)' : 'var(--type-display-3)',
                  letterSpacing: 'var(--ls-title)',
                  color: 'var(--text-strong)',
                  lineHeight: 1.25,
                  padding: '4px 6px',
                }}
              />

              {/* Nội dung ưu đãi (HTML) với style bullet đẹp mắt — Cho phép chỉnh sửa trực tiếp */}
              <EditableBlock
                tag="div"
                className="ctv-benefit-prose"
                html={bodyHtml || ''}
                onChange={onUpdateBody}
                multiline={true}
                title="Nhấp vào để sửa Nội dung ưu đãi (tự động đồng bộ sang ô HTML bên trái)"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  font: 'var(--type-body)',
                  color: 'var(--text-body)',
                  lineHeight: 1.65,
                  padding: '6px 8px',
                }}
              />

              {/* Số liệu thống kê */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: isMobile ? 'var(--space-4)' : 'var(--space-5)',
                paddingTop: 'var(--space-2)',
                borderTop: '1px solid var(--border-hairline)',
              }}>
                {STATS_DATA.map((s) => {
                  const StatIcon = s.icon;
                  return (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--brand-50)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <StatIcon size={16} color="var(--action-primary)" />
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)', lineHeight: 1.2 }}>
                          <CounterStat value={s.value} suffix={s.suffix} />
                        </span>
                        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                          {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cột phải: Minh họa CTV phone + coins */}
            <div style={{
              flex: isMobile ? '0 0 auto' : '1 1 260px',
              maxWidth: isMobile ? 240 : 320,
              minWidth: isMobile ? 180 : 220,
              display: 'flex',
              justifyContent: 'center',
            }}>
              <CollaboratorIllustration style={{ width: '100%', height: 'auto', maxHeight: isMobile ? 180 : 260 }} />
            </div>
          </div>

          {/* Máy tính hoa hồng tương tác */}
          <LiveCommissionCalculator />
        </div>

        {/* KHỐI 2: MÔ PHỎNG QUY TRÌNH 4 BƯỚC NHẬN HOA HỒNG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>
            Quy trình nhận hoa hồng — 4 bước đơn giản
          </span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: 'var(--space-3)',
          }}>
            {PROCESS_PREVIEW_STEPS.map((s) => (
              <div
                key={s.n}
                style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--surface-tint-cream)',
                  color: 'var(--action-primary)',
                  fontWeight: 'var(--fw-bold)',
                  fontSize: '0.85rem',
                }}>
                  0{s.n}
                </span>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{s.title}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KHỐI 3: MÔ PHỎNG NÚT KÍCH HOẠT / ĐĂNG KÝ CTV */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-inset-hairline)',
          padding: 'var(--gutter-card)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}>
          <div>
            <span style={{ display: 'block', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
              Sẵn sàng gia tăng thu nhập cùng Biển Số VIP?
            </span>
            <span style={{ display: 'block', font: 'var(--type-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
              Đăng ký hoàn toàn miễn phí, nhận hoa hồng tự động trên từng giao dịch.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', width: isMobile ? '100%' : 'auto' }}>
            <Button variant="primary" size="md" style={{ flex: isMobile ? 1 : 'none' }}>
              Đăng nhập CTV
            </Button>
            <Button variant="ghost" size="md" style={{ flex: isMobile ? 1 : 'none' }}>
              Đăng ký mới
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCollaboratorContent({ notify }) {
  const [viewLayout, setViewLayout] = useState('split'); // 'split' | 'editor' | 'preview'
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'mobile'

  const { data, isLoading, isError, update } = useAdminCollaboratorBenefitContent();
  const { data: preview } = useCollaboratorBenefitContent();
  const [form, setForm] = useState(null);
  const bodyTextareaRef = useRef(null);

  const current = form || data || preview || {};
  const title = current.titleHtml ?? '';
  const body = current.bodyHtml ?? '';

  const isDirty = Boolean(form);

  const set = (field, value) => {
    setForm({
      titleHtml: field === 'titleHtml' ? value : title,
      bodyHtml: field === 'bodyHtml' ? value : body,
    });
  };

  // Kiểm tra lỗi thẻ HTML
  const tagIssues = useMemo(() => {
    return validateHtmlTags(body);
  }, [body]);

  // Chèn mã mẫu hoặc đoạn HTML trợ giúp
  const insertSnippet = (snippet, wrap = false, tag = '') => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) {
      set('bodyHtml', (body || '') + '\n' + snippet);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = body || '';
    if (wrap && start !== end) {
      const selected = text.substring(start, end);
      const replacement = `<${tag}>${selected}</${tag}>`;
      const newText = text.substring(0, start) + replacement + text.substring(end);
      set('bodyHtml', newText);
    } else {
      const newText = text.substring(0, start) + snippet + text.substring(end);
      set('bodyHtml', newText);
    }
    textarea.focus();
  };

  // Khôi phục mẫu chuẩn giàu nội dung
  const loadPreset = () => {
    if (isDirty && !window.confirm('Khôi phục nội dung mẫu chuẩn sẽ thay thế các chỉnh sửa hiện tại?')) {
      return;
    }
    setForm({
      titleHtml: DEFAULT_SAMPLE_TITLE,
      bodyHtml: DEFAULT_SAMPLE_BODY,
    });
    notify('Đã tải mẫu nội dung chuẩn ưu đãi CTV');
  };

  const save = async () => {
    if (!title.trim()) {
      notify('Vui lòng nhập tiêu đề trang ưu đãi');
      return;
    }
    try {
      await update.mutateAsync({ titleHtml: title.trim(), bodyHtml: body });
      notify('Đã lưu nội dung trang ưu đãi CTV thành công');
      setForm(null);
    } catch (e) {
      notify(e.message || 'Lỗi khi lưu nội dung');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '64px 0', textAlign: 'center', font: 'var(--type-body)', color: 'var(--text-muted)' }}>
        Đang tải nội dung ưu đãi CTV…
      </div>
    );
  }

  if (isError && !preview) {
    return (
      <div style={{ padding: '64px 0', textAlign: 'center', font: 'var(--type-body)', color: 'var(--status-danger)' }}>
        Lỗi khi tải nội dung ưu đãi CTV
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* 1. HEADER TOOLBAR ĐỒNG BỘ CHUẨN ADMIN */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <h1 style={{ font: 'var(--type-title-1)', color: 'var(--text-strong)', margin: 0 }}>
              Nội dung ưu đãi CTV
            </h1>
            <span style={{
              background: 'var(--brand-50)',
              color: 'var(--action-primary)',
              padding: '2px 10px',
              borderRadius: 'var(--radius-pill)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-bold)',
              border: '1px solid var(--brand-200)',
            }}>
              Trang công khai /cong-tac-vien
            </span>
            <span style={{
              background: 'var(--status-success-bg)',
              color: 'var(--status-success-ink)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-semibold)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <Check size={11} /> Thời gian thực
            </span>
          </div>
          <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Chỉnh sửa nội dung giới thiệu hoa hồng và xem trước trực quan chuẩn 100% theo giao diện thực tế của khách hàng.
          </p>
        </div>

        {/* Thanh công cụ điều khiển giao diện: Split / Editor / Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            gap: 3,
            background: 'var(--surface-sunken)',
            padding: 3,
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-hairline)',
          }}>
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

          {/* Thiết bị Desktop / Mobile cho Live Preview */}
          {viewLayout !== 'editor' && (
            <div style={{
              display: 'flex',
              gap: 3,
              background: 'var(--surface-sunken)',
              padding: 3,
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-hairline)',
            }}>
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                title="Xem trên màn hình máy tính"
                style={{
                  border: 'none',
                  background: deviceMode === 'desktop' ? 'var(--action-primary)' : 'transparent',
                  color: deviceMode === 'desktop' ? 'var(--white)' : 'var(--text-muted)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                  fontWeight: deviceMode === 'desktop' ? 'var(--fw-bold)' : 'normal',
                }}
              >
                <Monitor size={13} />
                <span>Desktop</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                title="Xem trên điện thoại (390px)"
                style={{
                  border: 'none',
                  background: deviceMode === 'mobile' ? 'var(--action-primary)' : 'transparent',
                  color: deviceMode === 'mobile' ? 'var(--white)' : 'var(--text-muted)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                  fontWeight: deviceMode === 'mobile' ? 'var(--fw-bold)' : 'normal',
                }}
              >
                <Smartphone size={13} />
                <span>Mobile</span>
              </button>
            </div>
          )}

          {/* Nút thao tác lưu */}
          <Button
            variant="primary"
            size="md"
            loading={update.isPending}
            onClick={save}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={15} />
            <span>Lưu nội dung</span>
          </Button>

          {isDirty && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => setForm(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <RotateCcw size={14} />
              <span>Hủy</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: EDITOR + LIVE PREVIEW */}
      <div style={{
        display: 'grid',
        gridTemplateColumns:
          viewLayout === 'split' ? 'minmax(420px, 1fr) minmax(460px, 1.2fr)' : '1fr',
        gap: 'var(--space-4)',
        alignItems: 'start',
      }}>
        {/* CỘT SOẠN THẢO (EDITOR) */}
        {(viewLayout === 'split' || viewLayout === 'editor') && (
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-inset-hairline)',
            padding: 'var(--gutter-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}>
            {/* Header soạn thảo & trợ giúp HTML */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 'var(--space-3)',
              borderBottom: '1px solid var(--border-hairline)',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}>
              <div>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)', display: 'block' }}>
                  Trình soạn thảo nội dung
                </span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Hỗ trợ định dạng HTML an toàn: &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;mark&gt;
                </span>
              </div>

              <button
                type="button"
                onClick={loadPreset}
                style={{
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 10px',
                  font: 'var(--type-caption)',
                  color: 'var(--text-body)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Sparkles size={12} color="var(--action-primary)" />
                <span>Nạp mẫu chuẩn VIP</span>
              </button>
            </div>

            {/* Thanh công cụ chèn nhanh HTML (Quick Insert Toolbar) */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              background: 'var(--surface-sunken)',
              padding: '6px 8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-hairline)',
            }}>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', alignSelf: 'center', marginRight: 4 }}>
                Chèn nhanh:
              </span>
              <button
                type="button"
                onClick={() => insertSnippet('<p>Mô tả ngắn gọn về chương trình...</p>')}
                style={{
                  border: '1px solid var(--border-hairline)',
                  background: 'var(--white)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  font: 'var(--type-caption)',
                  cursor: 'pointer',
                }}
              >
                + Đoạn văn &lt;p&gt;
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('<ul>\n  <li>Quyền lợi 1...</li>\n  <li>Quyền lợi 2...</li>\n</ul>')}
                style={{
                  border: '1px solid var(--border-hairline)',
                  background: 'var(--white)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  font: 'var(--type-caption)',
                  cursor: 'pointer',
                }}
              >
                + Danh sách &lt;ul&gt;&lt;li&gt;
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('<strong>Nhấn mạnh</strong>', true, 'strong')}
                style={{
                  border: '1px solid var(--border-hairline)',
                  background: 'var(--white)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  font: 'var(--type-caption)',
                  cursor: 'pointer',
                }}
              >
                + In đậm &lt;strong&gt;
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('<mark>Nổi bật</mark>', true, 'mark')}
                style={{
                  border: '1px solid var(--border-hairline)',
                  background: 'var(--white)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  font: 'var(--type-caption)',
                  cursor: 'pointer',
                }}
              >
                + Đánh dấu &lt;mark&gt;
              </button>
            </div>

            {/* Ô 1: Tiêu đề trang (HTML) */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                  Tiêu đề chính (HTML)
                </span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                  {title.length} ký tự
                </span>
              </div>
              <textarea
                value={title}
                onChange={(e) => set('titleHtml', e.target.value)}
                rows={2}
                placeholder="VD: Trở thành Cộng tác viên Biển Số VIP"
                style={{
                  resize: 'vertical',
                  borderRadius: 'var(--radius-field)',
                  border: '1px solid var(--border-hairline)',
                  padding: '10px 12px',
                  font: 'var(--type-body)',
                  fontFamily: 'inherit',
                  lineHeight: 1.4,
                  background: 'var(--surface-card)',
                }}
              />
            </label>

            {/* Ô 2: Nội dung ưu đãi chi tiết (HTML) */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                  Nội dung chi tiết ưu đãi & quyền lợi (HTML)
                </span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
                  {body.length} ký tự • {body.split('\n').length} dòng
                </span>
              </div>
              <textarea
                ref={bodyTextareaRef}
                value={body}
                onChange={(e) => set('bodyHtml', e.target.value)}
                rows={14}
                placeholder="<p>Giới thiệu bạn bè...</p>&#10;<ul>&#10;  <li>Nhận hoa hồng...</li>&#10;</ul>"
                style={{
                  resize: 'vertical',
                  borderRadius: 'var(--radius-field)',
                  border: tagIssues.length > 0 ? '1px solid var(--status-warning)' : '1px solid var(--border-hairline)',
                  padding: '12px 14px',
                  font: 'var(--type-body-sm)',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1.6,
                  background: 'var(--surface-card)',
                }}
              />
            </label>

            {/* Thông báo tình trạng thẻ HTML */}
            {tagIssues.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 'var(--radius-field)',
                background: 'var(--status-success-bg)',
                color: 'var(--status-success-ink)',
                font: 'var(--type-caption)',
              }}>
                <CheckCircle2 size={14} />
                <span>Cú pháp HTML hợp lệ và cân bằng thẻ.</span>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '8px 12px',
                borderRadius: 'var(--radius-field)',
                background: 'var(--status-warning-bg)',
                color: 'var(--status-warning-ink)',
                font: 'var(--type-caption)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'var(--fw-bold)' }}>
                  <AlertCircle size={14} />
                  <span>Cảnh báo cú pháp HTML:</span>
                </div>
                <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
                  {tagIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hướng dẫn hiển thị */}
            <div style={{
              background: 'var(--surface-sunken)',
              padding: '12px',
              borderRadius: 'var(--radius-field)',
              border: '1px solid var(--border-hairline)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                💡 Mẹo trình bày đẹp:
              </span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                • Sử dụng thẻ <code>&lt;ul&gt;&lt;li&gt;</code> để hệ thống tự động gắn biểu tượng tích xanh VIP.<br />
                • Sử dụng thẻ <code>&lt;strong&gt;</code> để làm nổi bật các con số như "10%", "VietQR", "Realtime".
              </span>
            </div>
          </div>
        )}

        {/* CỘT LIVE PREVIEW TRỰC QUAN */}
        {(viewLayout === 'split' || viewLayout === 'preview') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <CollaboratorBenefitLivePreview
              titleHtml={title}
              bodyHtml={body}
              onUpdateTitle={(val) => set('titleHtml', val)}
              onUpdateBody={(val) => set('bodyHtml', val)}
              deviceMode={deviceMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
