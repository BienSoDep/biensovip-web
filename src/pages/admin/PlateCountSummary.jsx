const nf = new Intl.NumberFormat('vi-VN');

// Dòng tổng số biển cho 2 trang admin (Biển số + Biển VPA): số khớp bộ lọc hiện tại và tổng khi không lọc.
// matched/all = undefined khi đang tải → hiện "…". scope = mô tả phạm vi của "tổng" (VD "trong tab Tháng").
export default function PlateCountSummary({ matched, all, filtered, scope = '' }) {
  const fmt = (n) => (n == null ? '…' : nf.format(n));
  return (
    <div role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 'var(--space-3)', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
      <span>
        {filtered ? 'Khớp bộ lọc: ' : 'Đang hiển thị: '}
        <b style={{ color: 'var(--text-strong)' }}>{fmt(matched)}</b> biển
      </span>
      {filtered && (
        <span>
          Không lọc{scope ? ` ${scope}` : ''}: <b style={{ color: 'var(--text-strong)' }}>{fmt(all)}</b> biển
        </span>
      )}
    </div>
  );
}
