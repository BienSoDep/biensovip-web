import { Compass, GitCompare, Eye, MessageSquare, PhoneCall, Bookmark, Share2, ArrowRight } from 'lucide-react';

export default function PlateEngagementSection({ plateEngagement, topInteracted = [], formatPrice, onActionClick }) {
  if (!plateEngagement) return null;

  const isHighIndecision = plateEngagement.indecisionRate >= 20;

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
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Compass size={20} color="var(--action-primary)" />
            <h2 style={{ font: 'var(--type-title-2)', margin: 0, fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
              Hành Vi Tương Tác Biển Số & Thước Đo Phân Vân
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Phân tích chi tiết các hành động vi mô của khách khi xem chi tiết từng biển số.
          </p>
        </div>

        {/* Thẻ Chỉ số Phân Vân - Bấm để xem danh sách biển */}
        <div
          onClick={() => onActionClick && onActionClick('/admin/bien-so')}
          title="Bấm để mở kho biển số"
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-pill)',
            background: isHighIndecision ? 'var(--status-warning-bg)' : 'var(--status-success-bg)',
            border: `1px solid ${isHighIndecision ? 'rgba(245, 197, 66, 0.4)' : 'rgba(63, 191, 143, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'var(--transition-control)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <GitCompare size={18} color={isHighIndecision ? 'var(--status-warning-ink)' : 'var(--status-success-ink)'} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ phân vân:</span>
            <strong style={{ color: isHighIndecision ? 'var(--status-warning-ink)' : 'var(--status-success-ink)' }}>
              {plateEngagement.indecisionRate}% khách so sánh/lưu biển
            </strong>
          </div>
        </div>
      </div>

      {/* 6 Thẻ Tương Tác Vi Mô */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
      }}>
        <div
          onClick={() => onActionClick && onActionClick('/admin/bien-so')}
          title="Xem kho biển số"
          style={{
            padding: '12px 14px',
            background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-hairline)',
            cursor: 'pointer',
            transition: 'var(--transition-card)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--action-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-hairline)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', font: 'var(--type-caption)' }}>
            <Eye size={15} /> <span>Xem chi tiết biển</span>
          </div>
          <div style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', marginTop: 4, color: 'var(--text-strong)' }}>
            {plateEngagement.detailViews.toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => onActionClick && onActionClick('/admin/ban-hang?status=new')}
          title="Xem khách để lại liên hệ qua Zalo"
          style={{
            padding: '12px 14px',
            background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-hairline)',
            cursor: 'pointer',
            transition: 'var(--transition-card)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--status-success)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-hairline)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-success-ink)', font: 'var(--type-caption)' }}>
            <MessageSquare size={15} /> <span>Bấm Chat Zalo</span>
          </div>
          <div style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', marginTop: 4, color: 'var(--status-success-ink)' }}>
            {plateEngagement.zaloClicks.toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => onActionClick && onActionClick('/admin/ban-hang?status=new')}
          title="Xem yêu cầu gọi tư vấn"
          style={{
            padding: '12px 14px',
            background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-hairline)',
            cursor: 'pointer',
            transition: 'var(--transition-card)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--action-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-hairline)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--action-primary)', font: 'var(--type-caption)' }}>
            <PhoneCall size={15} /> <span>Bấm Gọi điện</span>
          </div>
          <div style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', marginTop: 4, color: 'var(--action-primary)' }}>
            {plateEngagement.phoneCalls.toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => onActionClick && onActionClick('/admin/khach-quan-tam')}
          title="Mở danh sách khách lưu yêu thích biển"
          style={{
            padding: '12px 14px',
            background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-hairline)',
            cursor: 'pointer',
            transition: 'var(--transition-card)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--status-warning)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-hairline)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-warning-ink)', font: 'var(--type-caption)' }}>
            <Bookmark size={15} /> <span>Lưu Yêu thích</span>
          </div>
          <div style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', marginTop: 4, color: 'var(--status-warning-ink)' }}>
            {plateEngagement.wishlistSaves.toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => onActionClick && onActionClick('/admin/bien-so')}
          title="Xem danh sách biển số"
          style={{
            padding: '12px 14px',
            background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-hairline)',
            cursor: 'pointer',
            transition: 'var(--transition-card)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ink-700)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-hairline)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-700)', font: 'var(--type-caption)' }}>
            <GitCompare size={15} /> <span>Bấm So sánh</span>
          </div>
          <div style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', marginTop: 4, color: 'var(--ink-700)' }}>
            {plateEngagement.compareActions.toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => onActionClick && onActionClick('/admin/mau-tin-nhan-ctv')}
          title="Mở mẫu tin nhắn CTV để chia sẻ thêm"
          style={{
            padding: '12px 14px',
            background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-hairline)',
            cursor: 'pointer',
            transition: 'var(--transition-card)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--grey-500)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-hairline)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--grey-500)', font: 'var(--type-caption)' }}>
            <Share2 size={15} /> <span>Lượt Chia sẻ</span>
          </div>
          <div style={{ font: 'var(--type-title-2)', fontWeight: 'var(--fw-bold)', marginTop: 4, color: 'var(--text-strong)' }}>
            {plateEngagement.shares.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Top Biển Số Tương Tác Sôi Động Nhất */}
      {topInteracted.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 'var(--space-4)' }}>
          <div style={{
            font: 'var(--type-caption)',
            color: 'var(--text-muted)',
            fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 'var(--space-3)',
          }}>
            🔥 Top 5 Biển Số Nhận Được Tương Tác Cao Nhất Trong Kỳ (Bấm biển để mở kho điều chỉnh giá)
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-3)',
          }}>
            {topInteracted.map((tp) => (
              <div
                key={tp.plateId}
                onClick={() => onActionClick && onActionClick('/admin/bien-so', { adminQ: tp.plateNumber })}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                  minWidth: 0,
                  cursor: 'pointer',
                  transition: 'var(--transition-card)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--action-primary)';
                  e.currentTarget.style.background = 'var(--surface-card)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hairline)';
                  e.currentTarget.style.background = 'var(--surface-sunken)';
                }}
              >
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{
                      fontWeight: 'var(--fw-bold)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.95rem',
                      color: 'var(--text-strong)',
                      letterSpacing: '0.04em',
                    }}>
                      {tp.plateNumber}
                    </span>
                    <span style={{ fontWeight: 'var(--fw-semibold)', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>
                      {formatPrice ? formatPrice(tp.price) : tp.price}
                    </span>
                  </div>
                  <div style={{
                    font: 'var(--type-caption)',
                    color: 'var(--text-muted)',
                    marginTop: 3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {tp.highIntentReason}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{
                    font: 'var(--type-caption)',
                    fontWeight: 'var(--fw-bold)',
                    background: 'var(--blue-50)',
                    color: 'var(--action-primary)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--blue-100)',
                    whiteSpace: 'nowrap',
                  }}>
                    {tp.interactions} quan tâm
                  </span>
                  <ArrowRight size={13} color="var(--action-primary)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
