import { ShieldAlert, CheckCircle, ArrowRight, Lightbulb } from 'lucide-react';

export default function BottleneckRadarSection({ bottlenecks = [], onActionClick }) {
  return (
    <section style={{
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--gutter-card)',
      boxShadow: 'var(--shadow-inset-hairline)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShieldAlert size={20} color="var(--status-danger)" />
            <h2 style={{ font: 'var(--type-title-2)', margin: 0, fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
              Điểm Nghẽn Chuyển Đổi & Khuyến Nghị Hành Động
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Thuật toán tự động rà soát những rào cản khiến khách hàng chưa liên hệ hoặc không chốt đơn.
          </p>
        </div>
        <span style={{
          font: 'var(--type-caption)',
          color: 'var(--text-muted)',
          background: 'var(--surface-sunken)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-hairline)',
          fontWeight: 'var(--fw-semibold)',
        }}>
          {bottlenecks.length} phát hiện
        </span>
      </div>

      {bottlenecks.length === 0 ? (
        <div style={{
          padding: 'var(--space-6)',
          textAlign: 'center',
          background: 'var(--status-success-bg)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--status-success)',
          color: 'var(--status-success-ink)',
        }}>
          <CheckCircle size={36} style={{ margin: '0 auto 8px', color: 'var(--status-success-ink)' }} />
          <div style={{ fontWeight: 'var(--fw-bold)', fontSize: '1rem', marginBottom: 4 }}>
            Tuyệt vời! Không phát hiện điểm nghẽn nghiêm trọng nào
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            Phễu khách hàng và tốc độ phản hồi tư vấn trong khoảng ngày này đang diễn ra rất mượt mà.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {bottlenecks.map((item) => {
            const isCrit = item.severity === 'critical';
            const isWarn = item.severity === 'warning';
            const badgeColor = isCrit ? 'var(--status-danger-ink)' : isWarn ? 'var(--status-warning-ink)' : 'var(--status-success-ink)';
            const badgeBg = isCrit ? 'var(--status-danger-bg)' : isWarn ? 'var(--status-warning-bg)' : 'var(--status-success-bg)';
            const accentBorder = isCrit ? 'var(--status-danger)' : isWarn ? 'var(--status-warning)' : 'var(--status-success)';
            const badgeLabel = isCrit ? 'Cấp bách' : isWarn ? 'Cảnh báo' : 'Cơ hội';
            const dotColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981';

            return (
              <div
                key={item.id}
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-hairline)',
                  borderLeft: `4px solid ${accentBorder}`,
                  background: 'var(--surface-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  transition: 'var(--transition-card)',
                }}
              >
                {/* Header row: Badge + Title + Metric Pill */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    flexWrap: 'wrap',
                    flex: '1 1 auto',
                    minWidth: 0,
                  }}>
                    <span style={{
                      background: badgeBg,
                      color: badgeColor,
                      fontWeight: 'var(--fw-bold)',
                      font: 'var(--type-caption)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
                      {badgeLabel}
                    </span>
                    <span style={{
                      fontWeight: 'var(--fw-bold)',
                      font: 'var(--type-title-3)',
                      color: 'var(--text-strong)',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}>
                      {item.title}
                    </span>
                  </div>

                  {item.metric && (
                    <span style={{
                      font: 'var(--type-caption)',
                      fontWeight: 'var(--fw-semibold)',
                      padding: '3px 10px',
                      background: 'var(--surface-sunken)',
                      borderRadius: 'var(--radius-pill)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      alignSelf: 'flex-start',
                    }}>
                      {item.metric}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div style={{
                  font: 'var(--type-body-sm)',
                  color: 'var(--text-body)',
                  lineHeight: 1.6,
                }}>
                  {item.description}
                </div>

                {/* Action Box */}
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    flex: '1 1 auto',
                    minWidth: 200,
                  }}>
                    <Lightbulb size={16} color="var(--amber-500)" style={{ flexShrink: 0 }} />
                    <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', lineHeight: 1.4 }}>
                      <strong style={{ color: 'var(--text-strong)' }}>Đề xuất cho Shop: </strong>
                      {item.suggestedAction}
                    </span>
                  </div>

                  {item.actionLink && (
                    <button
                      type="button"
                      onClick={() => onActionClick && onActionClick(item.actionLink)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        background: 'var(--action-primary)',
                        color: 'var(--text-inverse)',
                        border: 'none',
                        borderRadius: 'var(--radius-pill)',
                        fontWeight: 'var(--fw-semibold)',
                        font: 'var(--type-caption)',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-1)',
                        transition: 'var(--transition-control)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--action-primary-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--action-primary)'; }}
                    >
                      <span>Xử lý ngay</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
