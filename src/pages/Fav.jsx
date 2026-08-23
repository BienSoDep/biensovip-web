import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/Button.jsx';
import PlateCard from '../components/PlateCard.jsx';

const SNAP_KEY = 'biensovip_fav_snap';
const PER_PAGE = 12;
const readSnaps = () => { try { return JSON.parse(localStorage.getItem(SNAP_KEY)) || {}; } catch { return {}; } };
const writeSnaps = (o) => { try { localStorage.setItem(SNAP_KEY, JSON.stringify(o)); } catch { /* storage blocked */ } };

const SORT_OPTS = [
  { value: 'newest', label: 'Mới thêm' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
];

export default function Fav({ favCards, user, onClearAll, go, notify, contact }) {
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  // Price snapshot per favorite — capture current price on first sight so a later
  // price change surfaces a "Giá đã đổi" badge. ponytail: snapshot is lazy (captured
  // on first fav view), not strictly at add-time; upgrade by storing price in toggleFav.
  useEffect(() => {
    const snaps = readSnaps();
    let dirty = false;
    favCards.forEach((p) => { if (snaps[p.id] == null) { snaps[p.id] = p.price ?? 0; dirty = true; } });
    if (dirty) writeSnaps(snaps);
  }, [favCards]);

  const changed = useMemo(() => {
    const snaps = readSnaps();
    const set = {};
    favCards.forEach((p) => { if (snaps[p.id] != null && Number(snaps[p.id]) !== Number(p.price ?? 0)) set[p.id] = true; });
    return set;
  }, [favCards]);

  const sorted = useMemo(() => {
    const list = [...favCards];
    if (sort === 'price_asc') list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    else if (sort === 'price_desc') list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    return list;
  }, [favCards, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const shown = sorted.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const removeWithUndo = (p) => {
    p.onFav?.();
    toast('Đã bỏ lưu', { action: { label: 'Hoàn tác', onClick: () => p.onFav?.() } });
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SORT_OPTS.map((o) => (
            <button key={o.value} type="button" onClick={() => { setSort(o.value); setPage(1); }}
              style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--radius-pill)', font: 'var(--type-caption)', background: sort === o.value ? 'var(--action-primary)' : 'var(--surface-muted)', color: sort === o.value ? 'var(--white)' : 'var(--text-body)' }}>{o.label}</button>
          ))}
        </div>
        {favCards.length > 0 && <Button variant="outline" size="sm" onClick={onClearAll}>Bỏ lưu tất cả</Button>}
      </div>
      {shown.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(276px,100%),1fr))', gap: 'var(--gutter-section)', animation: 'fadeIn 180ms var(--ease-out)' }}>
          {shown.map((p) => (
            <div key={p.id} style={{ position: 'relative' }}>
              {changed[p.id] && (
                <span style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, background: 'var(--amber-400)', color: '#7A5A00', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>Giá đã đổi</span>
              )}
              <button type="button" aria-label="Bỏ lưu" onClick={() => removeWithUndo(p)}
                style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, border: 'none', cursor: 'pointer', background: 'var(--white)', boxShadow: 'var(--shadow-2)', color: 'var(--status-danger)', borderRadius: 'var(--radius-pill)', padding: '5px 10px', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)' }}>Bỏ lưu</button>
              <PlateCard {...p} contact={contact} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '72px var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa có biển số nào được lưu</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 380 }}>Nhấn biểu tượng trái tim trên bất kỳ biển số nào để lưu vào đây.</span>
          <Button variant="primary" size="md" onClick={go('list')}>Khám phá kho biển số</Button>
        </div>
      )}
      {sorted.length > PER_PAGE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' }}>
          <Button variant="outline" size="sm" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>Trước</Button>
          <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{cur} / {pages}</span>
          <Button variant="outline" size="sm" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Sau</Button>
        </div>
      )}
    </section>
  );
}
