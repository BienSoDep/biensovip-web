import { Sparkles } from 'lucide-react';

export default function ExecutiveSummaryBanner({ summary }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e2638 0%, #111827 100%)',
      color: 'var(--text-inverse)',
      borderRadius: 'var(--radius-card)',
      padding: '18px 24px',
      border: '1px solid rgba(255, 255, 255, 0.09)',
      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{
          background: 'rgba(245, 197, 66, 0.15)',
          border: '1px solid rgba(245, 197, 66, 0.3)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-pill)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--amber-400)',
          font: 'var(--type-caption)',
          fontWeight: 'var(--fw-bold)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          <Sparkles size={14} />
          <span>Đánh Giá Tình Hình Kinh Doanh Trong Kỳ</span>
        </div>
      </div>
      <div style={{
        font: 'var(--type-body)',
        fontSize: '0.965rem',
        lineHeight: 1.6,
        fontWeight: 'var(--fw-normal)',
        color: '#e2e8f0',
      }}>
        {summary || 'Hệ thống đang tổng hợp dữ liệu giao dịch và luồng khách trong khoảng ngày đã chọn.'}
      </div>
    </div>
  );
}
