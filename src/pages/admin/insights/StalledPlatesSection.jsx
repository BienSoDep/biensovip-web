import { Flame } from 'lucide-react';

export default function StalledPlatesSection({ stalledPlates = [], formatPrice, onActionClick }) {
  return (
    <section style={{
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--gutter-card)',
      boxShadow: 'var(--shadow-inset-hairline)',
      width: '100%',
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
            <Flame size={20} color="var(--brand-500, #c75b00)" />
            <h2 style={{ font: 'var(--type-title-2)', margin: 0, fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
              Biển Số Được Quan Tâm Lớn Nhưng Đang Nghẽn Chốt
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Các biển số nhiều lượt xem & bấm Zalo nhưng chưa chốt được khách. Cần cập nhật giá hoặc áp dụng chiến thuật đẩy hàng.
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
          {stalledPlates.length} biển cần can thiệp
        </span>
      </div>

      {stalledPlates.length === 0 ? (
        <div style={{
          padding: '28px 16px',
          textAlign: 'center',
          background: 'var(--surface-sunken)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-hairline)',
          color: 'var(--text-muted)',
          font: 'var(--type-body-sm)',
        }}>
          Chưa phát hiện biển số nào có nhiều lượt hỏi mà bị tắc nghẽn kéo dài.
        </div>
      ) : (
        <div style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-hairline)',
        }}>
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', font: 'var(--type-body-sm)' }}>
            <thead>
              <tr style={{
                textAlign: 'left',
                color: 'var(--text-muted)',
                font: 'var(--type-caption)',
                background: 'var(--surface-sunken)',
                borderBottom: '1px solid var(--border-hairline)',
              }}>
                <th style={{ padding: '10px 14px', fontWeight: 'var(--fw-semibold)' }}>Biển số</th>
                <th style={{ padding: '10px 14px', fontWeight: 'var(--fw-semibold)' }}>Giá niêm yết</th>
                <th style={{ padding: '10px 14px', fontWeight: 'var(--fw-semibold)' }}>Lượt quan tâm</th>
                <th style={{ padding: '10px 14px', fontWeight: 'var(--fw-semibold)' }}>Tồn kho</th>
                <th style={{ padding: '10px 14px', fontWeight: 'var(--fw-semibold)' }}>Chẩn đoán</th>
                <th style={{ padding: '10px 14px', fontWeight: 'var(--fw-semibold)' }}>Chiến thuật đề xuất</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 'var(--fw-semibold)' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {stalledPlates.map((plate) => (
                <tr key={plate.plateId} style={{ borderTop: '1px solid var(--border-hairline)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontWeight: 'var(--fw-bold)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.925rem',
                      letterSpacing: '0.04em',
                      color: 'var(--text-strong)',
                      background: 'var(--surface-sunken)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-hairline)',
                    }}>
                      {plate.plateNumber}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>
                    {formatPrice ? formatPrice(plate.price) : plate.price}
                  </td>
                  <td style={{ padding: '12px 14px', font: 'var(--type-caption)' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-body)' }}>{plate.viewCount} xem</span>
                      <span style={{ color: 'var(--status-warning-ink)', fontWeight: 'var(--fw-semibold)' }}>
                        {plate.zaloClickCount} Zalo
                      </span>
                      {plate.leadCount > 0 && (
                        <span style={{ color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>
                          {plate.leadCount} lead
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', font: 'var(--type-caption)', color: plate.daysInStock > 30 ? 'var(--status-danger-ink)' : 'var(--text-muted)' }}>
                    {plate.daysInStock} ngày
                  </td>
                  <td style={{ padding: '12px 14px', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                    {plate.diagnosis}
                  </td>
                  <td style={{ padding: '12px 14px', font: 'var(--type-caption)', color: 'var(--status-success-ink)', fontWeight: 'var(--fw-medium)' }}>
                    💡 {plate.suggestedTactic}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => onActionClick && onActionClick('/admin/bien-so')}
                      style={{
                        padding: '6px 14px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 'var(--radius-pill)',
                        font: 'var(--type-caption)',
                        fontWeight: 'var(--fw-semibold)',
                        cursor: 'pointer',
                        color: 'var(--text-strong)',
                        transition: 'var(--transition-control)',
                        boxShadow: 'var(--shadow-1)',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--action-primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-hairline)'; }}
                    >
                      Chỉnh giá / Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
