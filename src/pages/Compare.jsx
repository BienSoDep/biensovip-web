import { ArrowLeftRight, X } from 'lucide-react';
import Button from '../components/Button.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import { useCompareIds, useComparePlates } from '../services/compareService.js';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';

const ROW_LABELS = [
  { key: 'type', label: 'Loại biển' },
  { key: 'province', label: 'Tỉnh / thành' },
  { key: 'vehicleType', label: 'Loại xe' },
  { key: 'price', label: 'Giá' },
  { key: 'fengShuiMeaning', label: 'Ý nghĩa phong thủy' },
];

export default function Compare({ go, notify, allPlates }) {
  const { ids, remove, clear } = useCompareIds();
  const { data, isLoading, isError, refetch } = useComparePlates(ids);
  // Fall back to the in-app plate list when the API is unavailable (mock/dev).
  const apiPlates = data?.items || [];
  const plates = (apiPlates.length > 0)
    ? apiPlates
    : (allPlates || []).filter((p) => ids.includes(p.id));

  const removePlate = (id) => {
    remove(id);
    if (ids.length <= 2) notify('Cần ít nhất 2 biển số để so sánh có ý nghĩa');
  };

  // Empty: no IDs at all
  if (ids.length === 0) {
    return (
      <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>So sánh biển số</h1>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chọn tối đa 3 biển để so sánh cạnh nhau.</p>
          </div>
        </div>
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-pill)', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeftRight size={28} style={{ color: 'var(--text-muted)' }} /></div>
          <div><h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có biển để so sánh</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Duyệt kho biển số và nhấn "So sánh" để thêm vào đây.</p></div>
          <Button variant="primary" size="md" onClick={go('list')}>Xem danh sách biển</Button>
        </div>
      </div>
    );
  }

  // Insufficient: only 1 plate
  if (ids.length === 1) {
    return (
      <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>So sánh biển số</h1>
            <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Cần ít nhất 2 biển để so sánh.</p>
          </div>
        </div>
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-pill)', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeftRight size={28} style={{ color: 'var(--text-muted)' }} /></div>
          <div><h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Cần thêm 1 biển nữa</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Chọn thêm ít nhất 1 biển số từ danh sách để bắt đầu so sánh.</p></div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="primary" size="md" onClick={go('list')}>Xem danh sách biển</Button>
            <Button variant="ghost" size="md" onClick={clear}>Bỏ chọn</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>So sánh biển số</h1>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{plates.length}/{ids.length} biển — so sánh cạnh nhau.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="md" onClick={go('list')}>Thêm biển</Button>
          <Button variant="ghost" size="md" onClick={clear}>Xóa tất cả</Button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '64px 0', textAlign: 'center', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Đang tải dữ liệu so sánh…</div>
      ) : isError ? (
        <div style={{ padding: '64px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--status-danger)' }}>Lỗi tải dữ liệu so sánh</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${plates.length},minmax(220px,1fr))`, minWidth: plates.length * 240 + 210 }}>
            <div style={{ padding: 'var(--space-3) var(--space-4)', font: 'var(--type-caption)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Thuộc tính</div>
            {plates.map((p) => {
              const { prov, seri, num } = splitPlateNumber(p.plateNumber);
              return (
                <div key={p.id} style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--white)', borderRadius: 'var(--radius-card) var(--radius-card) 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', position: 'relative' }}>
                  <button onClick={() => removePlate(p.id)} aria-label="Bỏ khỏi so sánh" style={{ position: 'absolute', top: 2, right: 2, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Bỏ khỏi so sánh"><X size={16} /></button>
                  {p.thumbnailUrl ? (
                    <img src={p.thumbnailUrl} alt={p.plateNumber} style={{ width: 120, height: 65, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  ) : (
                    <PlateVisual size="md" prov={prov} seri={seri} num={num} />
                  )}
                  <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{p.plateNumber}</span>
                  <button onClick={() => go('detail', p.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--action-primary)' }}>Xem chi tiết</button>
                </div>
              );
            })}
            {ROW_LABELS.map((row) => (
              <>
                <div key={`h-${row.key}`} style={{ padding: 'var(--space-3) var(--space-4)', font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', background: 'var(--surface-sunken)' }}>{row.label}</div>
                {plates.map((p) => (
                  <div key={p.id} style={{ padding: 'var(--space-3) var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-body)', boxShadow: 'inset 0 -1px 0 var(--grey-100)', textAlign: 'center' }}>
                    {row.key === 'price' ? (
                      <span style={{ font: 'var(--type-price)', color: 'var(--text-strong)' }}>{formatPrice(p.price, false)}</span>
                    ) : row.key === 'fengShuiMeaning' ? (
                      <span style={{ font: 'var(--type-caption)', color: p.fengShuiMeaning ? 'var(--text-body)' : 'var(--text-muted)', fontStyle: p.fengShuiMeaning ? undefined : 'italic' }}>{p.fengShuiMeaning || 'Chưa có'}</span>
                    ) : (
                      p[row.key] || '—'
                    )}
                  </div>
                ))}
              </>
            ))}
          </div>
        </div>
      )}

      {plates.length < ids.length && !isLoading && (
        <div style={{ padding: 'var(--space-4)', background: 'var(--amber-50)', borderRadius: 'var(--radius-md)', font: 'var(--type-caption)', color: '#8A6100', textAlign: 'center' }}>
          Một số biển không còn khả dụng và đã bị loại khỏi bảng so sánh.
        </div>
      )}
    </div>
  );
}
