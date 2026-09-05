import { useState } from 'react';
import { ExternalLink, ChevronDown } from 'lucide-react';

// Danh sách tên event GA4 duy nhất đang thật sự bắn từ code (29 tên — một số như `generate_lead`
// gọi từ nhiều nơi khác nhau nên tổng lượt gọi trong code lớn hơn số tên event ở đây). Nguồn duy
// nhất là docs/features/analytics/01..05-*.md (biensodep-infrastructure). Cập nhật file này khi
// thêm/bớt event thật trong src/services/tracking/events.js, không để lệch giữa 2 nơi.
const TRACKED_EVENTS = [
  { group: 'Hành trình đấu giá hộ', items: ['view_item_list', 'select_item', 'view_item', 'add_to_wishlist', 'remove_from_wishlist', 'generate_lead', 'share'] },
  { group: 'Tìm kiếm & lọc', items: ['search', 'filter_apply', 'search_no_results', 'select_price_preset', 'avoid_number_toggle', 'save_search'] },
  { group: 'Content/blog', items: ['view_item (blog)', 'select_content', 'scroll', 'share (blog)'] },
  { group: 'Auth & tài khoản', items: ['sign_up', 'sign_up_failed', 'login', 'complete_profile', 'skip_profile_onboarding', 'become_collaborator'] },
  { group: 'Hợp mệnh & tính năng khác', items: ['fengshui_lookup', 'add_to_compare', 'remove_from_compare', 'submit_review', 'remove_saved_search', 'toggle_saved_search_notify'] },
];

// Property ID số của GA4 (khác Measurement ID VITE_GA4_MEASUREMENT_ID dùng trong index.html) — đọc
// từ VITE_GA4_PROPERTY_ID, xem docs/ops/DEPLOYMENT-GUIDE.md. Dùng URL gốc property (không cố định
// sâu vào 1 path report cụ thể — Google hay đổi URL scheme nội bộ GA4, path càng sâu càng dễ lỗi thời)
// để admin tự điều hướng tới report cần xem sau khi vào.
const GA4_PROPERTY_ID = import.meta.env.VITE_GA4_PROPERTY_ID || '';
const GA4_CONFIGURED = !!GA4_PROPERTY_ID;
const GA4_REPORT_URL = `https://analytics.google.com/analytics/web/#/p${GA4_PROPERTY_ID}`;

export default function GoogleAnalyticsPanel() {
  const [expanded, setExpanded] = useState(false);
  const totalEvents = TRACKED_EVENTS.reduce((n, g) => n + g.items.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', boxShadow: 'var(--shadow-inset-hairline)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--type-label)', color: 'var(--text-muted)' }}>Google Analytics (GA4)</span>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{totalEvents} loại event đang track — traffic, hành vi khách theo thời gian thực</span>
        <div style={{ flex: 1 }} />
        {GA4_CONFIGURED ? (
          <a href={GA4_REPORT_URL} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--text-inverse)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', textDecoration: 'none' }}>
            Mở Google Analytics <ExternalLink size={14} />
          </a>
        ) : (
          <span title="Chưa cấu hình VITE_GA4_PROPERTY_ID — xem docs/ops/DEPLOYMENT-GUIDE.md" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', color: 'var(--text-faint)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'not-allowed' }}>
            Chưa cấu hình GA4 <ExternalLink size={14} />
          </span>
        )}
      </div>

      <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--link)' }}>
        <ChevronDown size={14} style={{ transform: expanded ? 'none' : 'rotate(-90deg)', transition: 'transform 140ms var(--ease-out)' }} />
        {expanded ? 'Ẩn danh sách event' : 'Xem danh sách event đang track'}
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
          {TRACKED_EVENTS.map((g) => (
            <div key={g.group} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{g.group}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {g.items.map((ev) => (
                  <code key={ev} style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', font: 'var(--type-caption)', color: 'var(--text-body)' }}>{ev}</code>
                ))}
              </div>
            </div>
          ))}
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Chi tiết vị trí/lý do track từng event: xem `docs/features/analytics/` trong repo.</span>
        </div>
      )}
    </div>
  );
}
