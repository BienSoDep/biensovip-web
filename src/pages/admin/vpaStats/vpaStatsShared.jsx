import { InfoTip } from '../../../components/index.jsx';

export const PALETTE = ['#F19720', '#C75B00', '#F5C542', '#3FBF8F', '#E5484D', '#8A6100', '#6B7180', '#3A3E47'];

export const STATE_NAMES = {
  None: 'Chưa có gợi ý',
  Suggested: 'Chờ duyệt giá',
  Approved: 'Đã duyệt giá',
  Rejected: 'Đã từ chối',
  Drifted: 'Đề xuất đổi giá'
};

export const STATE_COLORS = {
  Approved: 'var(--status-success-ink, #2b8a3e)',
  Suggested: 'var(--action-primary, #F19720)',
  None: 'var(--text-muted, #868e96)',
  Drifted: 'var(--status-warning-ink, #d97706)',
  Rejected: 'var(--status-danger, #e03131)',
};

export const VIP_PLATE_KEYWORDS = ['ngũ quý', 'tứ quý', 'sảnh tiến', 'tam hoa'];

export const num = (v) => (v == null ? '0' : new Intl.NumberFormat('vi-VN').format(v));

export const CARD = {
  background: 'var(--white, #ffffff)',
  border: '1px solid var(--border-hairline, rgba(0, 0, 0, 0.08))',
  borderRadius: 'var(--radius-card, 8px)',
  boxShadow: 'var(--shadow-inset-hairline, inset 0 0 0 1px rgba(0, 0, 0, 0.04))',
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  position: 'relative',
};

export const ALL_OPT = { value: '', label: 'Toàn thị trường' };
export const catOpts = (list) => [ALL_OPT, ...(list || []).map((c) => ({ value: c.id, label: c.name }))];

export function SectionTitle({ icon: Icon, children, tip, action }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border-hairline, rgba(0, 0, 0, 0.08))',
        marginBottom: '4px',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-strong, #111827)',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        {Icon && <Icon size={15} color="var(--action-primary, #C75B00)" />} {children}{' '}
        {tip && <InfoTip size={12} text={tip} />}
      </span>
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, tone, icon: Icon, badge, color = 'var(--action-primary, #C75B00)' }) {
  const accentColor = tone || color;

  return (
    <div
      style={{
        flex: '1 1 180px',
        background: 'var(--white, #ffffff)',
        border: '1px solid var(--border-hairline, rgba(0, 0, 0, 0.08))',
        boxShadow: 'var(--shadow-inset-hairline, inset 0 0 0 1px rgba(0, 0, 0, 0.04))',
        borderRadius: 'var(--radius-card, 8px)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
        minWidth: 0,
        transition: 'transform 140ms ease, box-shadow 140ms ease',
      }}
      className="gentelella-tile"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {Icon && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '6px',
                background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                color: accentColor,
                flexShrink: 0,
              }}
            >
              <Icon size={15} />
            </span>
          )}
          <span
            style={{
              font: 'var(--type-caption)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted, #6b7280)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </span>
        </div>
        {badge && (
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
              color: accentColor,
              border: `1px solid color-mix(in srgb, ${accentColor} 24%, transparent)`,
              whiteSpace: 'nowrap',
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <div
        style={{
          font: 'var(--type-title-1)',
          fontSize: '24px',
          fontWeight: 700,
          color: tone || 'var(--text-strong, #111827)',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>

      {sub && (
        <div
          style={{
            font: 'var(--type-caption)',
            fontSize: '11.5px',
            color: 'var(--text-muted, #6b7280)',
            lineHeight: 1.35,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
