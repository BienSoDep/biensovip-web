import { Flame, Lightbulb } from 'lucide-react';

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
        <>
        <div className="admin-simple-table-wrap" style={{
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
                    <span
                      onClick={() => onActionClick && onActionClick('/admin/bien-so', { adminQ: plate.plateNumber })}
                      title={`Bấm để tìm và sửa biển ${plate.plateNumber}`}
                      style={{
                        fontWeight: 'var(--fw-bold)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.925rem',
                        letterSpacing: '0.04em',
                        color: 'var(--text-strong)',
                        background: 'var(--surface-sunken)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-hairline)',
                        cursor: 'pointer',
                        display: 'inline-block',
                      }}
                    >
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Lightbulb size={12} style={{ flexShrink: 0 }} /> {plate.suggestedTactic}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => onActionClick && onActionClick('/admin/bien-so', { adminQ: plate.plateNumber })}
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
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--action-primary)'; e.currentTarget.style.color = 'var(--action-primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-hairline)'; e.currentTarget.style.color = 'var(--text-strong)'; }}
                    >
                      Chỉnh giá / Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-simple-cards">
          {stalledPlates.map((plate) => (
            <div key={plate.plateId} className="admin-row">
              <div data-label="Biển số">
                <span
                  onClick={() => onActionClick && onActionClick('/admin/bien-so', { adminQ: plate.plateNumber })}
                  style={{ fontWeight: 'var(--fw-bold)', fontFamily: 'var(--font-mono)', color: 'var(--text-strong)', cursor: 'pointer' }}
                >
                  {plate.plateNumber}
                </span>
              </div>
              <div data-label="Giá niêm yết" style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>
                {formatPrice ? formatPrice(plate.price) : plate.price}
              </div>
              <div data-label="Lượt quan tâm">
                {plate.viewCount} xem · {plate.zaloClickCount} Zalo{plate.leadCount > 0 ? ` · ${plate.leadCount} lead` : ''}
              </div>
              <div data-label="Tồn kho" style={{ color: plate.daysInStock > 30 ? 'var(--status-danger-ink)' : 'var(--text-muted)' }}>
                {plate.daysInStock} ngày
              </div>
              <div data-label="Chẩn đoán">{plate.diagnosis}</div>
              <div data-label="Chiến thuật" style={{ color: 'var(--status-success-ink)' }}>{plate.suggestedTactic}</div>
              <div data-label="">
                <button
                  type="button"
                  onClick={() => onActionClick && onActionClick('/admin/bien-so', { adminQ: plate.plateNumber })}
                  style={{ padding: '6px 14px', background: 'var(--surface-card)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', color: 'var(--text-strong)' }}
                >
                  Chỉnh giá / Sửa
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </section>
  );
}
