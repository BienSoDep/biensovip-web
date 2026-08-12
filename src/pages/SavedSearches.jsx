import { Bell, Trash2 } from 'lucide-react';
import Button from '../components/Button.jsx';
import { Switch } from '../components/index.jsx';
import { useSavedSearches, useUpdateSavedSearch, useDeleteSavedSearch } from '../services/savedSearchService.js';

function filterSummary(filtersStr) {
  try {
    const f = typeof filtersStr === 'string' ? JSON.parse(filtersStr) : filtersStr;
    const parts = [];
    if (f.type) parts.push(f.type);
    if (f.province) parts.push(f.province);
    if (f.vehicleType) parts.push(f.vehicleType);
    if (f.priceMin || f.priceMax) parts.push([f.priceMin, f.priceMax].filter(Boolean).join(' – ') + 'đ');
    return parts.join(' · ') || 'Tất cả biển số';
  } catch { return filtersStr || 'Tất cả biển số'; }
}

export default function SavedSearches({ go, notify }) {
  const { data: items, isLoading, isError } = useSavedSearches();
  const updateSearch = useUpdateSavedSearch();
  const deleteSearch = useDeleteSavedSearch();

  const toggleNotify = (s) => {
    updateSearch.mutate({ id: s.id, notifyEnabled: !s.notifyEnabled }, {
      onError: () => notify('Không cập nhật được, thử lại sau.'),
    });
  };

  const remove = (s) => {
    if (!window.confirm('Xóa tiêu chí này?')) return;
    deleteSearch.mutate(s.id, {
      onError: () => notify('Không xóa được, thử lại sau.'),
      onSuccess: () => notify('Đã xóa tiêu chí'),
    });
  };

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Thông báo biển mới</h1>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Lưu tiêu chí để nhận thông báo khi có biển phù hợp.</p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center' }}>
          <span style={{ font: 'var(--type-body)', color: 'var(--text-muted)' }}>Đang tải...</span>
        </div>
      ) : isError ? (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          <span style={{ font: 'var(--type-body)', color: 'var(--status-danger)' }}>Không tải được danh sách tiêu chí.</span>
          <Button variant="outline" size="md" onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      ) : !items?.length ? (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '64px var(--space-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-pill)', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bell size={28} style={{ color: 'var(--text-muted)' }} /></div>
          <div><h2 style={{ margin: '0 0 var(--space-1)', font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có tiêu chí nào</h2><p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Dùng bộ lọc ở trang danh sách biển số rồi lưu lại để theo dõi.</p></div>
          <Button variant="primary" size="md" onClick={go('list')}>Vào danh sách biển</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {items.map((s) => (
            <div key={s.id} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{s.name}</span>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{filterSummary(s.filters)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Switch checked={s.notifyEnabled} onChange={() => toggleNotify(s)} label="Thông báo" />
                <button onClick={() => remove(s)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
