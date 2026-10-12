import { InfoTip } from '../../../components/index.jsx';

export const PALETTE = ['#3B5BFF', '#C75B00', '#F5C542', '#3FBF8F', '#E5484D', '#8A6100', '#6B7180', '#3A3E47'];

export const STATE_NAMES = {
  None: 'Chưa có gợi ý',
  Suggested: 'Chờ duyệt giá',
  Approved: 'Đã duyệt giá',
  Rejected: 'Đã từ chối',
  Drifted: 'Đề xuất đổi giá'
};

export const STATE_COLORS = {
  Approved: 'var(--status-success-ink, #2b8a3e)',
  Suggested: 'var(--action-primary, #3b5bff)',
  None: 'var(--text-muted, #868e96)',
  Drifted: 'var(--status-warning-ink, #d97706)',
  Rejected: 'var(--status-danger, #e03131)',
};

export const VIP_PLATE_KEYWORDS = ['ngũ quý', 'tứ quý', 'sảnh tiến', 'tam hoa'];

export const num = (v) => (v == null ? '0' : new Intl.NumberFormat('vi-VN').format(v));

export const CARD = {
  background: 'var(--white)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-4)',
  boxShadow: 'var(--shadow-inset-hairline)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)'
};

export const ALL_OPT = { value: '', label: 'Toàn thị trường' };
export const catOpts = (list) => [ALL_OPT, ...(list || []).map((c) => ({ value: c.id, label: c.name }))];

export function SectionTitle({ icon: Icon, children, tip, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
        {Icon && <Icon size={16} color="var(--action-primary)" />} {children} {tip && <InfoTip size={12} text={tip} />}
      </span>
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, tone, icon: Icon, badge }) {
  return (
    <div style={{
      flex: '1 1 180px',
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-3) var(--space-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
        {badge ? (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'rgba(59,91,255,0.08)',
            color: 'var(--action-primary)'
          }}>
            {badge}
          </span>
        ) : Icon && <Icon size={15} style={{ opacity: 0.4 }} />}
      </div>
      <span style={{ font: 'var(--type-h3)', fontWeight: 'var(--fw-bold)', color: tone || 'var(--text-strong)', lineHeight: 1.2 }}>
        {value}
      </span>
      {sub && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );
}
