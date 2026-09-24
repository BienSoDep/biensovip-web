import { Clock, ArrowRight, Search, Lightbulb } from 'lucide-react';

export default function LeadHealthAndGapsSection({ leadHealth, searchGaps = [], onActionClick }) {
  const hasNewLeads = (leadHealth?.newLeadsWaiting ?? 0) > 0;
  const hasStagnantLeads = (leadHealth?.stagnantLeads ?? 0) > 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 'var(--space-4)',
      width: '100%',
    }}>
      {/* Cột A: Sức Khỏe Tư Vấn & Phản Hồi Khách */}
      <section style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--gutter-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
            <Clock size={18} color="var(--action-primary)" />
            <h3 style={{ font: 'var(--type-title-3)', margin: 0, fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
              Sức Khỏe Tư Vấn & Xử Lý Khách
            </h3>
          </div>
          <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Đo lường tốc độ phản hồi và theo sát các khách hàng để lại liên hệ.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: hasNewLeads ? 'var(--status-danger-bg)' : 'var(--surface-sunken)',
              border: hasNewLeads ? '1px solid rgba(229, 72, 77, 0.3)' : '1px solid var(--border-hairline)',
            }}>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-medium)', color: hasNewLeads ? 'var(--status-danger-ink)' : 'var(--text-strong)' }}>
                Yêu cầu mới đang chờ duyệt:
              </span>
              <span style={{
                font: 'var(--type-title-2)',
                fontWeight: 'var(--fw-bold)',
                color: hasNewLeads ? 'var(--status-danger-ink)' : 'var(--text-strong)',
              }}>
                {leadHealth?.newLeadsWaiting ?? 0}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: hasStagnantLeads ? 'var(--status-warning-bg)' : 'var(--surface-sunken)',
              border: hasStagnantLeads ? '1px solid rgba(245, 197, 66, 0.4)' : '1px solid var(--border-hairline)',
            }}>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-medium)', color: hasStagnantLeads ? 'var(--status-warning-ink)' : 'var(--text-strong)' }}>
                Khách đang ngâm quá 48h chưa chốt:
              </span>
              <span style={{
                font: 'var(--type-title-2)',
                fontWeight: 'var(--fw-bold)',
                color: hasStagnantLeads ? 'var(--status-warning-ink)' : 'var(--text-strong)',
              }}>
                {leadHealth?.stagnantLeads ?? 0}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-hairline)',
            }}>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                Yêu cầu chưa phân công nhân viên:
              </span>
              <span style={{ fontWeight: 'var(--fw-semibold)', font: 'var(--type-title-3)', color: 'var(--text-muted)' }}>
                {leadHealth?.unassignedLeads ?? 0}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-hairline)',
            }}>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                Tỷ lệ chốt thành công từ Lead:
              </span>
              <span style={{ fontWeight: 'var(--fw-bold)', font: 'var(--type-title-3)', color: 'var(--status-success-ink)' }}>
                {(leadHealth?.closingRatePct ?? 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-4)' }}>
          <button
            type="button"
            onClick={() => onActionClick && onActionClick('/admin/ban-hang?status=new')}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--action-primary)',
              color: 'var(--text-inverse)',
              border: 'none',
              fontWeight: 'var(--fw-semibold)',
              font: 'var(--type-caption)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              boxShadow: 'var(--shadow-1)',
              transition: 'var(--transition-control)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--action-primary-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--action-primary)'; }}
          >
            <span>Mở danh sách khách cần tư vấn</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Cột B: Khách Tìm Kiếm Gì Mà Kho Chưa Có? */}
      <section style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--gutter-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
            <Search size={18} color="var(--brand-500, #c75b00)" />
            <h3 style={{ font: 'var(--type-title-3)', margin: 0, fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
              Nhu Cầu Tìm Kiếm Chưa Có Trong Kho
            </h3>
          </div>
          <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Những biển số, đầu số khách gõ tìm nhiều lần nhưng kho đang thiếu hàng.
          </p>

          {searchGaps.length === 0 ? (
            <div style={{
              padding: '28px 16px',
              textAlign: 'center',
              background: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-muted)',
              font: 'var(--type-body-sm)',
            }}>
              Không có từ khóa tìm kiếm thiếu hàng nổi bật trong kỳ này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {searchGaps.slice(0, 5).map((gap, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border-hairline)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 'var(--fw-bold)', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                      &ldquo;{gap.query}&rdquo;
                    </div>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 2 }}>
                      {gap.suggestion}
                    </div>
                  </div>
                  <span style={{
                    font: 'var(--type-caption)',
                    fontWeight: 'var(--fw-bold)',
                    background: 'var(--blue-50)',
                    color: 'var(--action-primary)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--blue-100)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {gap.count} lần tìm
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          marginTop: 'var(--space-4)',
          padding: '10px 14px',
          background: 'var(--blue-50)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--blue-100)',
          font: 'var(--type-caption)',
          color: 'var(--action-primary)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          lineHeight: 1.5,
        }}>
          <Lightbulb size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong>Gợi ý kinh doanh: </strong>
            Báo cộng tác viên hoặc nguồn cung săn thêm các mẫu biển trên để đáp ứng ngay khi khách có nhu cầu.
          </span>
        </div>
      </section>
    </div>
  );
}
