import { useEffect, useLayoutEffect, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import Button from '../Button.jsx';

// Tour hướng dẫn CTV mới — chuỗi tooltip trỏ vào từng khu vực dashboard qua [data-tour="key"].
// Tự hiện 1 lần sau khi CTV đăng ký xong (cờ lưu theo referralCode trong localStorage, mỗi CTV
// 1 cờ riêng — không đụng chung nếu nhiều CTV dùng chung máy/trình duyệt test).
const SEEN_KEY_PREFIX = 'biensovip_ctv_tour_seen_';

const STEPS = [
  { target: 'ctv-referral-code', tab: 'overview', title: 'Mã giới thiệu của bạn', text: 'Đây là mã riêng của bạn. Khách bấm vào link/mã này mua hàng, hệ thống tự ghi nhận bạn là người giới thiệu.' },
  { target: 'ctv-copy-link', tab: 'overview', title: 'Sao chép link giới thiệu', text: 'Bấm để sao chép link, gửi cho khách qua Zalo, Facebook, tin nhắn… Khách bấm vào link này sẽ tự động gắn với mã của bạn.' },
  { target: 'ctv-kpi-grid', tab: 'overview', title: 'Số liệu tổng quan', text: 'Theo dõi lượt click, khách đã giới thiệu, giao dịch thành công và hoa hồng tích lũy. Mỗi số liệu đều có dấu ⓘ giải thích chi tiết.' },
  { target: 'ctv-bank-edit', tab: 'overview', title: 'Thông tin ngân hàng', text: 'Nhập số tài khoản ngân hàng để nhận hoa hồng. Admin chuyển khoản hoa hồng "Đã duyệt" vào đúng số tài khoản bạn đăng ký ở đây.' },
  { target: 'ctv-tabs', tab: 'overview', title: 'Các mục quản lý', text: 'Chuyển giữa 4 mục: Tổng quan, Hoa hồng, Mã giới thiệu, Tin nhắn — mỗi mục có công cụ riêng, xem tiếp ở các bước sau.' },
  { target: 'ctv-commission-chart', tab: 'commission', title: 'Biểu đồ hoa hồng', text: 'Biểu đồ hoa hồng theo tháng — lọc 3/6/12 tháng gần nhất để theo dõi xu hướng thu nhập.' },
  { target: 'ctv-commission-history', tab: 'commission', title: 'Lịch sử hoa hồng', text: 'Danh sách từng giao dịch kèm trạng thái: Chờ duyệt → Đã duyệt → Đã trả. Có thể xuất file CSV để lưu trữ.' },
  { target: 'ctv-referral-link', tab: 'referral', title: 'Link & tin nhắn mời khách', text: 'Ngoài link, bạn có thể copy sẵn mẫu tin nhắn mời khách — soạn sẵn, chỉ việc dán và gửi.' },
  { target: 'ctv-click-stats', tab: 'referral', title: 'Thống kê lượt click', text: 'Xem khách bấm link của bạn từ đâu (Zalo, Facebook, khác) và theo khoảng thời gian nào.' },
  { target: 'ctv-hot-plates', tab: 'referral', title: 'Biển đang được quan tâm', text: 'Gợi ý những biển số đang có nhiều người xem — ưu tiên giới thiệu cho khách để tăng khả năng chốt đơn.' },
  { target: 'ctv-messages', tab: 'messages', title: 'Mẫu tin nhắn soạn sẵn', text: 'Các mẫu tin nhắn mời khách theo từng tình huống — copy nhanh, đỡ phải tự soạn mỗi lần.' },
];

function seenKey(referralCode) {
  return `${SEEN_KEY_PREFIX}${referralCode || 'anon'}`;
}

export function hasSeenTour(referralCode) {
  try { return localStorage.getItem(seenKey(referralCode)) === '1'; } catch { return true; }
}

function markSeen(referralCode) {
  try { localStorage.setItem(seenKey(referralCode), '1'); } catch { /* storage blocked */ }
}

import { useHideOnScroll } from '../../hooks/useHideOnScroll.js';

export function HelpButton({ onClick }) {
  const scrolling = useHideOnScroll();
  return (
    <button
      type="button"
      onClick={onClick}
      title="Xem hướng dẫn sử dụng dashboard"
      aria-label="Xem hướng dẫn sử dụng dashboard"
      style={{
        position: 'fixed',
        bottom: 118,
        right: 10,
        width: 42,
        height: 42,
        borderRadius: '50%',
        border: 'none',
        background: 'var(--action-primary)',
        color: 'var(--white)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-3)',
        zIndex: 85,
        opacity: scrolling ? 0 : 1,
        transform: scrolling ? 'translateX(72px)' : 'translateX(0)',
        pointerEvents: scrolling ? 'none' : 'auto',
        transition: 'opacity 160ms var(--ease-standard), transform 160ms var(--ease-standard)',
      }}
    >
      <HelpCircle size={20} />
    </button>
  );
}

// active: bật/tắt tour. referralCode: khóa cờ "đã xem" theo từng CTV. setTab: đổi tab dashboard
// theo bước hiện tại (tour đi qua cả 4 tab). onClose: đóng tour (tắt hẳn hoặc bấm xong bước cuối).
export default function OnboardingTour({ active, referralCode, setTab, onClose }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => { if (active) setStep(0); }, [active]);

  useEffect(() => {
    if (!active) return;
    setTab(STEPS[step].tab);
  }, [active, step, setTab]);

  useLayoutEffect(() => {
    if (!active) return;

    const update = () => {
      const el = document.querySelector(`[data-tour="${STEPS[step].target}"]`);
      if (!el) { setRect(null); return; }
      setRect(el.getBoundingClientRect());
    };

    let timer;
    const id = requestAnimationFrame(() => {
      const el = document.querySelector(`[data-tour="${STEPS[step].target}"]`);
      if (!el) { setRect(null); return; }
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      update();
      timer = setTimeout(update, 320);
    });

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });

    return () => {
      cancelAnimationFrame(id);
      clearTimeout(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [active, step]);

  if (!active) return null;

  const finish = () => { markSeen(referralCode); onClose(); };
  const next = () => (step < STEPS.length - 1 ? setStep((s) => s + 1) : finish());
  const prev = () => step > 0 && setStep((s) => s - 1);
  const s = STEPS[step];

  const tipTop = rect ? (rect.top < 220 ? rect.bottom + 14 : rect.top - 14) : window.innerHeight / 2;
  const tipFlipped = rect ? rect.top < 220 : false;
  const tipLeft = rect ? Math.max(190, Math.min(window.innerWidth - 190, rect.left + rect.width / 2)) : window.innerWidth / 2;

  return (
    <>
      <div onClick={finish} style={{ position: 'fixed', inset: 0, background: rect ? 'transparent' : 'var(--overlay-scrim, rgba(15,23,42,.45))', zIndex: 1000 }} aria-hidden="true" />
      {rect && (
        <div style={{
          position: 'fixed', top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12,
          border: '2px solid var(--action-primary)', borderRadius: 'var(--radius-card)', boxShadow: '0 0 0 4000px var(--overlay-scrim, rgba(15,23,42,.45))',
          zIndex: 1001, pointerEvents: 'none', transition: 'all 160ms ease',
        }} />
      )}
      <div role="dialog" aria-label={s.title} style={{
        position: 'fixed', top: tipTop, left: tipLeft, transform: tipFlipped ? 'translate(-50%,0)' : 'translate(-50%,-100%)',
        width: 'min(380px, calc(100vw - 32px))', boxSizing: 'border-box', background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,.35)', zIndex: 1002, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{s.title}</span>
          <button type="button" onClick={finish} aria-label="Đóng hướng dẫn" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 2 }}>
            <X size={16} />
          </button>
        </div>
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.55 }}>{s.text}</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8, flexWrap: 'nowrap' }}>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{step + 1}/{STEPS.length}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {step < STEPS.length - 1 && (
              <Button variant="ghost" size="sm" onClick={finish} style={{ padding: '0 10px', height: 32, font: 'var(--type-caption)' }}>
                Bỏ qua
              </Button>
            )}
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={prev} style={{ padding: '0 10px', height: 32, font: 'var(--type-caption)' }}>
                Quay lại
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={next}
              style={{
                padding: '0 16px',
                height: 32,
                font: 'var(--type-body-sm)',
                outline: 'none',
              }}
            >
              {step < STEPS.length - 1 ? 'Tiếp theo' : 'Hoàn tất'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
