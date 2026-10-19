import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Heart, Clock, Trash2, ArrowRight } from 'lucide-react';
import Button from '../components/Button.jsx';
import PlateCard from '../components/PlateCard.jsx';
import { PageHeader } from '../components/index.jsx';
import { usePlateHistory } from '../services/plateHistory.js';
import { routeFor } from '../config/routes.js';

const SNAP_KEY = 'biensovip_fav_snap';
const PER_PAGE = 12;
const readSnaps = () => { try { return JSON.parse(localStorage.getItem(SNAP_KEY)) || {}; } catch { return {}; } };
const writeSnaps = (o) => { try { localStorage.setItem(SNAP_KEY, JSON.stringify(o)); } catch { /* storage blocked */ } };

const SORT_OPTS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
];

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Vừa xem';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
}

export default function Fav({
  favCards = [],
  user,
  onClearAll,
  go,
  notify,
  contact,
  favTab = 'saved',
  favs = {},
  onFav,
  openPlate,
  openBuy,
}) {
  const [activeTab, setActiveTab] = useState(favTab);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  // Đồng bộ tab khi prop favTab thay đổi từ Header (bấm Tim hoặc Lịch sử)
  useEffect(() => {
    if (favTab) {
      setActiveTab(favTab);
      setPage(1);
    }
  }, [favTab]);

  // Hook lịch sử duyệt biển số (hoạt động cho cả Khách và User đã đăng nhập)
  const { history, removeItem: removeHistoryItem, clearAll: clearHistoryAll } = usePlateHistory(user);

  // Price snapshot per favorite
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

  // Chuyển đổi dữ liệu lịch sử thành định dạng card
  const historyCards = useMemo(() => {
    return (history || []).map((p) => ({
      id: p.id,
      plateNumber: p.plateNumber,
      price: p.price,
      salePrice: p.salePrice,
      priceOnRequest: p.priceOnRequest,
      province: p.province,
      vehicleType: p.vehicleType,
      thumbnailUrl: p.thumbnailUrl,
      status: p.status,
      slug: p.slug,
      viewedAt: p.viewedAt,
      fav: !!favs?.[p.id],
      onFav: onFav ? () => onFav(p.id) : undefined,
      onOpen: () => openPlate?.(p.slug || p.id),
      href: routeFor('detail', p.slug || p.id),
      onBuy: () => openBuy?.(p.id),
    }));
  }, [history, favs, onFav, openPlate, openBuy]);

  const activeItems = activeTab === 'saved' ? favCards : historyCards;

  const sorted = useMemo(() => {
    const list = [...activeItems];
    if (sort === 'price_asc') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sort === 'price_desc') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sort === 'newest') {
      if (activeTab === 'history') {
        list.sort((a, b) => new Date(b.viewedAt || 0) - new Date(a.viewedAt || 0));
      }
    }
    return list;
  }, [activeItems, sort, activeTab]);

  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const shown = sorted.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const removeFavWithUndo = (p) => {
    p.onFav?.();
    toast('Đã bỏ lưu', { action: { label: 'Hoàn tác', onClick: () => p.onFav?.() } });
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử duyệt biển số không?')) {
      clearHistoryAll();
      notify?.('Đã xóa toàn bộ lịch sử duyệt');
    }
  };

  return (
    <section style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--space-8) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Guest banner */}
      {!user && activeItems.length > 0 && (
        <div style={{ background: 'var(--surface-accent)', borderRadius: 'var(--radius-card)', padding: '16px var(--space-6)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)', justifyContent: 'space-between' }}>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
            {activeTab === 'saved'
              ? 'Bạn đang lưu danh sách yêu thích tạm trên trình duyệt. Đăng nhập để lưu vĩnh viễn.'
              : 'Lịch sử duyệt biển số đang được lưu trên trình duyệt này. Đăng nhập để lưu trữ vĩnh viễn và đồng bộ trên mọi thiết bị.'}
          </span>
          <Button variant="primary" size="sm" onClick={go('login')}>Đăng nhập</Button>
        </div>
      )}

      {/* Tabs Switcher: Biển đã lưu vs Đã xem gần đây */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border-hairline)', paddingBottom: 14 }}>
        <button
          type="button"
          onClick={() => { setActiveTab('saved'); setPage(1); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 18px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            cursor: 'pointer',
            font: 'var(--type-label)',
            fontWeight: activeTab === 'saved' ? 'var(--fw-bold)' : 'var(--fw-medium)',
            background: activeTab === 'saved' ? 'var(--action-primary)' : 'var(--surface-sunken)',
            color: activeTab === 'saved' ? 'var(--white)' : 'var(--text-body)',
            boxShadow: activeTab === 'saved' ? 'var(--shadow-2)' : 'none',
            transition: 'all 140ms ease',
          }}
        >
          <Heart size={16} fill={activeTab === 'saved' ? 'currentColor' : 'none'} />
          Biển đã lưu ({favCards.length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('history'); setPage(1); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 18px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            cursor: 'pointer',
            font: 'var(--type-label)',
            fontWeight: activeTab === 'history' ? 'var(--fw-bold)' : 'var(--fw-medium)',
            background: activeTab === 'history' ? 'var(--action-primary)' : 'var(--surface-sunken)',
            color: activeTab === 'history' ? 'var(--white)' : 'var(--text-body)',
            boxShadow: activeTab === 'history' ? 'var(--shadow-2)' : 'none',
            transition: 'all 140ms ease',
          }}
        >
          <Clock size={16} />
          Đã xem gần đây ({historyCards.length})
        </button>
      </div>

      <PageHeader
        eyebrow={activeTab === 'saved' ? 'Bộ sưu tập của bạn' : 'Lịch sử duyệt biển số'}
        title={activeTab === 'saved' ? 'Biển số đã lưu' : 'Biển số đã xem gần đây'}
        subtitle={
          activeTab === 'saved'
            ? (favCards.length ? `${favCards.length} biển số bạn đang theo dõi. Chúng tôi sẽ báo ngay nếu có cập nhật giá mới.` : 'Bạn chưa lưu biển số nào.')
            : (historyCards.length ? `${historyCards.length} biển số bạn đã xem gần đây trên hệ thống.` : 'Chưa có lịch sử duyệt biển số.')
        }
        actions={
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SORT_OPTS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { setSort(o.value); setPage(1); }}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    font: 'var(--type-caption)',
                    background: sort === o.value ? 'var(--action-primary)' : 'var(--surface-muted)',
                    color: sort === o.value ? 'var(--white)' : 'var(--text-body)',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {activeTab === 'saved' && favCards.length > 0 && (
              <Button variant="outline" size="sm" onClick={onClearAll}>Bỏ lưu tất cả</Button>
            )}
            {activeTab === 'history' && historyCards.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearHistory} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={14} /> Xóa lịch sử duyệt
              </Button>
            )}
          </>
        }
      />

      {shown.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(276px,100%),1fr))', gap: 'var(--gutter-section)', animation: 'fadeIn 180ms var(--ease-out)' }}>
          {shown.map((p) => (
            <div key={p.id} style={{ position: 'relative' }}>
              {activeTab === 'saved' && changed[p.id] && (
                <span style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, background: 'var(--amber-400)', color: '#7A5A00', font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', padding: '3px 10px', borderRadius: 'var(--radius-xs)' }}>
                  Giá đã đổi
                </span>
              )}
              {activeTab === 'history' && p.viewedAt && (
                <span style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, background: 'rgba(17, 24, 39, 0.75)', color: '#ffffff', font: 'var(--type-caption)', fontSize: '11px', fontWeight: 'var(--fw-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-xs)', backdropFilter: 'blur(4px)' }}>
                  {formatRelativeTime(p.viewedAt)}
                </span>
              )}
              {activeTab === 'saved' ? (
                <button
                  type="button"
                  aria-label="Bỏ lưu"
                  onClick={() => removeFavWithUndo(p)}
                  style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 2,
                    border: 'none', cursor: 'pointer', background: 'var(--white)',
                    boxShadow: 'var(--shadow-2)', color: 'var(--status-danger)',
                    borderRadius: 'var(--radius-sm)', padding: '7px 12px', minHeight: 32,
                    font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)',
                  }}
                >
                  Bỏ lưu
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Xóa khỏi lịch sử"
                  title="Xóa khỏi lịch sử xem"
                  onClick={() => {
                    removeHistoryItem(p.id);
                    notify?.('Đã xóa khỏi lịch sử');
                  }}
                  style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 2,
                    border: 'none', cursor: 'pointer', background: 'var(--white)',
                    boxShadow: 'var(--shadow-2)', color: 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)', padding: '6px 10px', minHeight: 30,
                    font: 'var(--type-caption)', fontWeight: 'var(--fw-medium)',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <Trash2 size={13} /> Xóa
                </button>
              )}
              <PlateCard {...p} contact={contact} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: '72px var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'center' }}>
          <span style={{ font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>
            {activeTab === 'saved' ? 'Chưa có biển số nào được lưu' : 'Chưa có biển số nào trong lịch sử duyệt'}
          </span>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 420 }}>
            {activeTab === 'saved'
              ? 'Nhấn biểu tượng trái tim trên bất kỳ biển số nào để lưu vào đây theo dõi.'
              : 'Khi bạn xem chi tiết các biển số xe trên website, danh sách sẽ tự động lưu lại tại đây để bạn tiện xem lại và so sánh.'}
          </span>
          <Button variant="primary" size="md" onClick={go('list')}>
            Khám phá kho biển số
          </Button>
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
