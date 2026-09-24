import { Users, Compass, Eye, MessageSquare, CheckCircle2, TrendingDown, ArrowRight } from 'lucide-react';
import StatCard from './StatCard.jsx';

export default function FunnelKpiSection({ funnelData, onActionClick, onSelectTab }) {
  const visitorsCount = funnelData?.visitorsCount ?? 0;
  const browsersCount = funnelData?.browsersCount ?? 0;
  const detailViewersCount = funnelData?.detailViewersCount ?? 0;
  const intentActionsCount = funnelData?.intentActionsCount ?? 0;
  const contactSubmissionsCount = funnelData?.contactSubmissionsCount ?? 0;
  const closedDealsCount = funnelData?.closedDealsCount ?? 0;

  const funnelSteps = [
    {
      step: 1,
      name: 'Khách vào Website',
      count: visitorsCount,
      rateNext: funnelData?.visitToBrowseRate ?? 0,
      dropOff: 100 - (funnelData?.visitToBrowseRate ?? 0),
      color: 'var(--action-primary)',
      link: 'tab:technical',
      actionLabel: 'Xem nhật ký phiên',
    },
    {
      step: 2,
      name: 'Tìm & xem danh mục biển số',
      count: browsersCount,
      rateNext: funnelData?.browseToDetailRate ?? 0,
      dropOff: 100 - (funnelData?.browseToDetailRate ?? 0),
      color: 'var(--brand-500, #c75b00)',
      link: '/admin/bien-so',
      actionLabel: 'Mở kho biển số',
    },
    {
      step: 3,
      name: 'Xem chi tiết biển cụ thể',
      count: detailViewersCount,
      rateNext: funnelData?.detailToIntentRate ?? 0,
      dropOff: 100 - (funnelData?.detailToIntentRate ?? 0),
      color: 'var(--brand-700, #8a3f00)',
      link: '/admin/bien-so',
      actionLabel: 'Rà soát giá biển',
    },
    {
      step: 4,
      name: 'Bấm Zalo / Gọi tư vấn',
      count: intentActionsCount,
      rateNext: funnelData?.intentToContactRate ?? 0,
      dropOff: 100 - (funnelData?.intentToContactRate ?? 0),
      color: 'var(--status-warning-ink)',
      link: '/admin/ban-hang?status=new',
      actionLabel: 'Xem khách mới',
    },
    {
      step: 5,
      name: 'Gửi thông tin & Lead tư vấn',
      count: contactSubmissionsCount,
      rateNext: funnelData?.contactToClosedRate ?? 0,
      dropOff: 100 - (funnelData?.contactToClosedRate ?? 0),
      color: 'var(--ink-700)',
      link: '/admin/ban-hang?status=new',
      actionLabel: 'Phân công tư vấn',
    },
    {
      step: 6,
      name: 'Chốt giao dịch thành công',
      count: closedDealsCount,
      isEnd: true,
      color: 'var(--status-success-ink)',
      link: '/admin/ban-hang?view=transactions',
      actionLabel: 'Xem bảng giao dịch',
    },
  ];

  return (
    <>
      {/* 5 Thẻ KPI Phễu Bán Hàng Trải Đều Full Trang - Có thể bấm trực tiếp để giải quyết */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-3)',
        width: '100%',
      }}>
        <StatCard
          label="1. Khách ghé thăm"
          value={visitorsCount.toLocaleString()}
          sub="Bấm để xem nhật ký kỹ thuật"
          icon={Users}
          color="var(--action-primary)"
          onClick={() => {
            if (onSelectTab) onSelectTab('technical');
            else if (onActionClick) onActionClick('tab:technical');
          }}
        />
        <StatCard
          label="2. Xem kho biển số"
          value={browsersCount.toLocaleString()}
          sub={`${funnelData?.visitToBrowseRate ? funnelData.visitToBrowseRate.toFixed(0) : 0}% vào xem kho`}
          icon={Compass}
          color="var(--brand-500, #c75b00)"
          onClick={() => onActionClick && onActionClick('/admin/bien-so')}
        />
        <StatCard
          label="3. Xem chi tiết biển"
          value={detailViewersCount.toLocaleString()}
          sub={`${funnelData?.browseToDetailRate ? funnelData.browseToDetailRate.toFixed(0) : 0}% xem sâu từng biển`}
          icon={Eye}
          color="var(--brand-700, #8a3f00)"
          onClick={() => onActionClick && onActionClick('/admin/bien-so')}
        />
        <StatCard
          label="4. Bấm Zalo / Gọi tư vấn"
          value={intentActionsCount.toLocaleString()}
          sub={`${funnelData?.detailToIntentRate ? funnelData.detailToIntentRate.toFixed(0) : 0}% có ý định liên hệ`}
          icon={MessageSquare}
          color="var(--status-warning-ink)"
          onClick={() => onActionClick && onActionClick('/admin/ban-hang?status=new')}
        />
        <StatCard
          label="5. Chốt thành công"
          value={closedDealsCount.toLocaleString()}
          sub={`Tỷ lệ: ${funnelData?.overallConversionRate ? funnelData.overallConversionRate.toFixed(1) : 0}% (Bấm xem GD)`}
          icon={CheckCircle2}
          color="var(--status-success-ink)"
          onClick={() => onActionClick && onActionClick('/admin/ban-hang?view=transactions')}
        />
      </div>

      {/* PHỄU BÁN HÀNG TRỰC QUAN KÈM HÀNH ĐỘNG GIẢI QUYẾT TỪNG BẬC */}
      <section style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--gutter-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
        width: '100%',
      }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <TrendingDown size={20} color="var(--action-primary)" />
            <h2 style={{ font: 'var(--type-title-2)', margin: 0, fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
              Phễu Khách Hàng & Điểm Rơi Rớt
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Theo dõi từng bước khách đi từ khi vào website tới lúc chốt đơn. Bấm vào từng bước để mở đúng mô-đun xử lý điểm nghẽn tương ứng.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {funnelSteps.map((stepItem, idx) => {
            const maxCount = Math.max(funnelData?.visitorsCount || 1, 1);
            const barWidth = Math.max((stepItem.count / maxCount) * 100, 3);
            const isHighDrop = !stepItem.isEnd && stepItem.dropOff > 70 && stepItem.count > 0;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (stepItem.link === 'tab:technical') {
                    if (onSelectTab) onSelectTab('technical');
                    else if (onActionClick) onActionClick('tab:technical');
                  } else if (onActionClick && stepItem.link) {
                    onActionClick(stepItem.link);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-hairline)',
                  cursor: 'pointer',
                  transition: 'var(--transition-card)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = stepItem.color;
                  e.currentTarget.style.background = 'var(--surface-card)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hairline)';
                  e.currentTarget.style.background = 'var(--surface-sunken)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  font: 'var(--type-body-sm)',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                      {stepItem.step}. {stepItem.name}
                    </span>
                    <span style={{
                      font: 'var(--type-caption)',
                      color: 'var(--action-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: 'var(--fw-medium)',
                    }}>
                      <span>({stepItem.actionLabel})</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                    <span style={{ fontWeight: 'var(--fw-bold)', color: stepItem.color, font: 'var(--type-label)' }}>
                      {stepItem.count.toLocaleString()} khách
                    </span>
                    {!stepItem.isEnd && (
                      <span style={{
                        font: 'var(--type-caption)',
                        color: isHighDrop ? 'var(--status-warning-ink)' : 'var(--text-muted)',
                        background: isHighDrop ? 'var(--status-warning-bg)' : 'var(--surface-card)',
                        border: isHighDrop ? '1px solid rgba(245, 197, 66, 0.4)' : '1px solid var(--border-hairline)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontWeight: isHighDrop ? 'var(--fw-bold)' : 'var(--fw-medium)',
                        whiteSpace: 'nowrap',
                      }}>
                        {isHighDrop ? `⚠️ Rớt ${stepItem.dropOff.toFixed(0)}%` : `Đi tiếp ${stepItem.rateNext.toFixed(0)}%`}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  width: '100%',
                  height: 10,
                  background: 'var(--grey-200)',
                  borderRadius: 'var(--radius-pill)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    background: stepItem.color,
                    borderRadius: 'var(--radius-pill)',
                    transition: 'width 300ms var(--ease-out)',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
