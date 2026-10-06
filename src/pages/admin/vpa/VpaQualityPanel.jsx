import { useVpaQuality } from '../../../services/adminVpa.js';
import { formatInt } from '../../../lib/vpaFormat.js';

const CARD = { background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' };
const TAB_NAMES = { Month: 'Tháng', Week: 'Tuần', Expired: 'Hết hạn', ExpiredInternal: 'Hết hạn nội bộ' };

function Tile({ label, value, warn, hint }) {
  return (
    <div title={hint} style={{ background: warn && value > 0 ? 'var(--amber-50)' : 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</span>
      <b style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{formatInt(value)}</b>
    </div>
  );
}

// Bảng chất lượng dữ liệu VPA: số biển theo tab và các nhóm cần xử lý (chưa phân loại, chưa có nhóm giá, chờ duyệt giá…).
export default function VpaQualityPanel({ enabled }) {
  const { data, isLoading, isError } = useVpaQuality(enabled);
  if (isLoading) return <div style={{ ...CARD, color: 'var(--text-muted)' }}>Đang tải chất lượng dữ liệu…</div>;
  if (isError || !data) return null;
  const unmapped = (() => { try { return data.unmappedJson ? Object.entries(JSON.parse(data.unmappedJson)) : []; } catch { return []; } })();
  return (
    <div style={CARD}>
      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Chất lượng dữ liệu</span>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Đếm trực tiếp từ kho biển VPA. Ô vàng là nhóm cần Admin xem lại.</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 'var(--space-3)' }}>
        <Tile label="Tổng số biển" value={data.total} />
        {Object.entries(data.byTab || {}).map(([k, n]) => <Tile key={k} label={`Tab ${TAB_NAMES[k] || k}`} value={n} />)}
        <Tile label="Chưa phân loại biển" value={data.noType} warn hint="Biển chưa khớp loại biển nào trong danh mục" />
        <Tile label="Chưa có tỉnh" value={data.noProvince} warn hint="Đầu số chưa khớp tỉnh trong danh mục" />
        <Tile label="Chưa thuộc nhóm giá" value={data.noPriceGroup} warn hint="Chưa có kết quả đấu giá cùng nhóm nên chưa có giá gợi ý (không tính tab nội bộ)" />
        <Tile label="Chờ duyệt giá" value={data.pendingPrice} warn hint="Có giá gợi ý hoặc đề xuất đổi giá, chờ Admin duyệt" />
        <Tile label="Đang ẩn" value={data.hidden} />
        <Tile label="Thêm tay" value={data.manual} />
        <Tile label="Có trường bị khóa" value={data.locked} hint="Admin đã sửa tay nên crawl không ghi đè" />
      </div>
      {unmapped.length > 0 && (
        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
          <b>Tiền tố biển chưa khớp danh mục (lượt gần nhất): </b>{unmapped.map(([k, n]) => `${k}: ${n}`).join(' · ')}
        </span>
      )}
    </div>
  );
}
