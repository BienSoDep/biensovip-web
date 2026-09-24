import { Layers, DollarSign, Lightbulb } from 'lucide-react';

export default function SupplyDemandSection({ categorySupplyDemand = [], priceSegments = [], onActionClick }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
      gap: 'var(--space-4)',
      width: '100%',
    }}>
      {/* Cột A: Cung Cầu Theo Loại Biển */}
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
            <Layers size={18} color="var(--action-primary)" />
            <h3 style={{ font: 'var(--type-title-3)', margin: 0, fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
              Cân Bằng Cung - Cầu Theo Loại Biển
            </h3>
          </div>
          <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            So sánh tỷ lệ khách quan tâm (% Cầu) với số lượng biển sẵn có trong kho (% Cung).
          </p>

          {categorySupplyDemand.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>
              Chưa có đủ dữ liệu phân loại trong khoảng ngày này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {categorySupplyDemand.slice(0, 6).map((cat, i) => {
                const isShort = cat.status === 'shortage';
                const isSurplus = cat.status === 'surplus';
                const badgeColor = isShort ? 'var(--status-danger-ink)' : isSurplus ? 'var(--status-warning-ink)' : 'var(--status-success-ink)';
                const badgeBg = isShort ? 'var(--status-danger-bg)' : isSurplus ? 'var(--status-warning-bg)' : 'var(--status-success-bg)';
                const borderColor = isShort ? 'rgba(229, 72, 77, 0.3)' : isSurplus ? 'rgba(245, 197, 66, 0.4)' : 'rgba(63, 191, 143, 0.3)';

                return (
                  <div key={i} style={{
                    padding: '12px 14px',
                    background: 'var(--surface-sunken)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hairline)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontWeight: 'var(--fw-bold)', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                        {cat.categoryName}
                      </span>
                      <span style={{
                        font: 'var(--type-caption)',
                        fontWeight: 'var(--fw-bold)',
                        background: badgeBg,
                        color: badgeColor,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        border: `1px solid ${borderColor}`,
                      }}>
                        {cat.statusLabel}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      font: 'var(--type-caption)',
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                    }}>
                      <span>Nhu cầu khách: <strong style={{ color: 'var(--text-strong)' }}>{cat.demandPct}%</strong></span>
                      <span>Kho có: <strong style={{ color: 'var(--text-strong)' }}>{cat.stockCount} biển ({cat.stockPct}%)</strong></span>
                    </div>

                    {cat.actionAdvice && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 6,
                        font: 'var(--type-caption)',
                        color: 'var(--text-strong)',
                        lineHeight: 1.45,
                        background: 'var(--surface-card)',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-hairline)',
                      }}>
                        <Lightbulb size={13} color="var(--amber-500)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{cat.actionAdvice}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 'var(--space-4)' }}>
          <button
            type="button"
            onClick={() => onActionClick && onActionClick('/admin/bien-so')}
            style={{
              width: '100%',
              padding: '9px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-strong)',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-semibold)',
              cursor: 'pointer',
              transition: 'var(--transition-control)',
              boxShadow: 'var(--shadow-1)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--action-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-hairline)'; }}
          >
            Quản lý kho biển số →
          </button>
        </div>
      </section>

      {/* Cột B: Phân Khúc Giá & Sức Mua Khách Hàng */}
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
            <DollarSign size={18} color="var(--status-success-ink)" />
            <h3 style={{ font: 'var(--type-title-3)', margin: 0, fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
              Phân Khúc Giá & Sức Mua Khách Hàng
            </h3>
          </div>
          <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Xác định tầm giá nào đang được khách xem nhiều nhất để điều chỉnh định giá và nhập hàng.
          </p>

          {priceSegments.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>
              Chưa có đủ dữ liệu phân khúc giá trong khoảng ngày này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {priceSegments.map((seg, i) => {
                const isHot = seg.status === 'hot';
                const isSlow = seg.status === 'slow';
                const tagColor = isHot ? 'var(--status-danger-ink)' : isSlow ? 'var(--status-warning-ink)' : 'var(--status-success-ink)';
                const tagBg = isHot ? 'var(--status-danger-bg)' : isSlow ? 'var(--status-warning-bg)' : 'var(--status-success-bg)';
                const borderColor = isHot ? 'rgba(229, 72, 77, 0.3)' : isSlow ? 'rgba(245, 197, 66, 0.4)' : 'rgba(63, 191, 143, 0.3)';

                return (
                  <div key={i} style={{
                    padding: '12px 14px',
                    background: 'var(--surface-sunken)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-hairline)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontWeight: 'var(--fw-bold)', font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                        {seg.segmentName}
                      </span>
                      <span style={{
                        font: 'var(--type-caption)',
                        fontWeight: 'var(--fw-bold)',
                        background: tagBg,
                        color: tagColor,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        border: `1px solid ${borderColor}`,
                      }}>
                        {seg.statusLabel} ({seg.demandPct}%)
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      font: 'var(--type-caption)',
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                    }}>
                      <span>Tồn kho hiện có: <strong style={{ color: 'var(--text-strong)' }}>{seg.stockCount} biển</strong></span>
                    </div>

                    {seg.suggestedAction && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 6,
                        font: 'var(--type-caption)',
                        color: 'var(--text-strong)',
                        lineHeight: 1.45,
                        background: 'var(--surface-card)',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-hairline)',
                      }}>
                        <Lightbulb size={13} color="var(--amber-500)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{seg.suggestedAction}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
