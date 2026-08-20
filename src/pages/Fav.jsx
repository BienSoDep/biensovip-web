import Button from '../components/Button.jsx';
import PlateCard from '../components/PlateCard.jsx';
import { clearFavorites } from '../services/favoriteService.js';

export default function Fav({ favCards, user, patch, go, notify }) {
  const handleClearAll = async () => {
    if (user) {
      try { await clearFavorites(); } catch { /* ignore */ }
    }
    patch({ favs: {} });
    notify('Đã bỏ lưu tất cả');
  };

  return (
    <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Guest banner */}
      {!user && favCards.length > 0 && (
        <div style={{ background: 'var(--surface-accent)', borderRadius: 'var(--radius-card)', padding: '16px var(--space-6)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)', justifyContent: 'space-between' }}>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>Bạn đang dùng danh sách tạm trên trình duyệt. Đăng nhập để lưu vĩnh viễn.</span>
          <Button variant="primary" size="sm" onClick={go('login')}>Đăng nhập</Button>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 320px' }}>
          <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Biển số đã lưu</h1>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{favCards.length ? favCards.length + ' biển số bạn đang theo dõi. Chúng tôi báo ngay nếu giá thay đổi.' : 'Bạn chưa lưu biển số nào.'}</p>
        </div>
        {favCards.length > 0 && <Button variant="outline" size="sm" onClick={handleClearAll}>Bỏ lưu tất cả</Button>}
      </div>
      {favCards.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(276px,100%),1fr))', gap: 'var(--gutter-section)', animation: 'fadeIn 180ms var(--ease-out)' }}>
          {favCards.map((p) => <PlateCard key={p.id} {...p} />)}
        </div>
      ) : (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '72px var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có biển số nào được lưu</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 380 }}>Nhấn biểu tượng trái tim trên bất kỳ biển số nào để lưu vào đây.</span>
          <Button variant="primary" size="md" onClick={go('list')}>Khám phá kho biển số</Button>
        </div>
      )}
    </section>
  );
}
