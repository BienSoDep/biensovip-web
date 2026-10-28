import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Sparkles, MapPin, Compass, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useDebouncedValue } from '@mantine/hooks';
import { usePlates } from '../services/plates.js';
import { splitPlateNumber, formatPrice } from '../lib/plateFormat.js';
import PlateVisual from './PlateVisual.jsx';
import { routeFor } from '../config/routes.js';

const QUICK_CATEGORIES = [
  { label: 'Tứ quý', query: 'tứ quý', cat: 'tu-quy' },
  { label: 'Thần tài (39-79)', query: '79', cat: 'than-tai' },
  { label: 'Lộc phát (68-86)', query: '68', cat: 'loc-phat' },
  { label: 'Tam hoa', query: 'tam hoa', cat: 'tam-hoa' },
  { label: 'Sảnh tiến', query: 'sảnh tiến', cat: 'sanh-tien' },
];

const POPULAR_PROVINCES = [
  { name: 'Đà Nẵng (43)', code: '43' },
  { name: 'Hà Nội (29-30)', code: '29' },
  { name: 'TP.HCM (50-59)', code: '51' },
  { name: 'Quảng Nam (92)', code: '92' },
];

/**
 * CommandPalette - Fast search palette inspired by Motion UI (motion.dev/ui/components/command-palette)
 * Trigger with Ctrl+K / Cmd+K or clicking the search trigger anywhere.
 */
export default function CommandPalette({
  open,
  onClose,
  go,
  openPlate,
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 250);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const { data, isFetching } = usePlates(
    { q: debouncedQuery.trim(), perPage: 6 },
    { enabled: debouncedQuery.trim().length >= 1 }
  );

  const searchResults = data?.items || [];

  // Focus input on open
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onClose(false); // Can trigger toggle if wired
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Keyboard navigation inside palette (ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e) => {
    if (searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % searchResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = searchResults[selectedIndex];
        if (selected) {
          handleSelectPlate(selected);
        }
      }
    } else if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      onClose();
      go('list')();
    }
  };

  const handleSelectPlate = (plate) => {
    onClose();
    if (openPlate) {
      openPlate(plate.slug || plate.id);
    } else if (typeof window !== 'undefined') {
      window.location.href = routeFor('detail', plate.slug || plate.id);
    }
  };

  const handleQuickFilter = (keyword) => {
    onClose();
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/danh-sach?q=${encodeURIComponent(keyword)}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
      if (go) go('list')();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tìm kiếm biển số"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-modal, 9999)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: 'clamp(16px, 8vh, 80px) 16px',
          }}
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(14, 15, 18, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Palette Window */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: -16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 460, damping: 28 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 640,
              background: 'var(--white)',
              borderRadius: 'var(--radius-card, 16px)',
              boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(241, 151, 32, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '82vh',
            }}
          >
            {/* Header: Input Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-hairline)',
                background: 'var(--white)',
              }}
            >
              <Search size={20} style={{ color: 'var(--brand-500)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Tìm biển số, tỉnh thành, loại biển (VD: 68, 51A, Tứ quý)..."
                aria-label="Nhập từ khóa tìm kiếm"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 16,
                  color: 'var(--text-strong)',
                  background: 'transparent',
                }}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  style={{
                    border: 'none',
                    background: 'var(--surface-sunken)',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  <X size={14} />
                </button>
              )}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                  background: 'var(--surface-sunken)',
                  padding: '3px 7px',
                  borderRadius: 'var(--radius-xs, 4px)',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                ESC
              </span>
            </div>

            {/* Results / Suggestions Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {isFetching ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  Đang tìm kiếm biển số phù hợp...
                </div>
              ) : query.trim().length >= 1 ? (
                searchResults.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Kết quả biển số ({searchResults.length})
                    </div>
                    {searchResults.map((p, idx) => {
                      const { prov, seri, num } = splitPlateNumber(p.plateNumber);
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={p.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelectPlate(p)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm, 8px)',
                            background: isSelected ? 'rgba(241, 151, 32, 0.10)' : 'transparent',
                            border: `1px solid ${isSelected ? 'rgba(241, 151, 32, 0.28)' : 'transparent'}`,
                            cursor: 'pointer',
                            transition: 'all 120ms ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                            <div style={{ width: 84, flexShrink: 0 }}>
                              <PlateVisual size="sm" prov={prov} seri={seri} num={num} shape="short" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>
                                {p.plateNumber}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {[p.vehicleType, p.province, p.type].filter(Boolean).join(' · ')}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-600, #a3610a)' }}>
                              {formatPrice(p.price, p.priceOnRequest)}
                            </span>
                            {isSelected && (
                              <CornerDownLeft size={15} style={{ color: 'var(--brand-500)' }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '36px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 14, color: 'var(--text-body)' }}>Không tìm thấy biển số khớp với "{query}"</span>
                    <button
                      type="button"
                      onClick={() => handleQuickFilter(query)}
                      style={{
                        padding: '8px 16px',
                        background: 'var(--action-primary)',
                        color: 'var(--action-primary-text, var(--ink-900))',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Tìm sâu trong danh mục →
                    </button>
                  </div>
                )
              ) : (
                /* Default Discovery State when empty */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '4px' }}>
                  {/* Quick Categories */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Dòng biển VIP được tìm kiếm nhiều
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {QUICK_CATEGORIES.map((cat) => (
                        <button
                          key={cat.label}
                          type="button"
                          onClick={() => handleQuickFilter(cat.query)}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--surface-sunken)',
                            border: '1px solid var(--border-hairline)',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-strong)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 140ms ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--brand-500)';
                            e.currentTarget.style.background = 'var(--brand-50)';
                            e.currentTarget.style.color = 'var(--brand-700)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-hairline)';
                            e.currentTarget.style.background = 'var(--surface-sunken)';
                            e.currentTarget.style.color = 'var(--text-strong)';
                          }}
                        >
                          <Sparkles size={13} style={{ color: 'var(--brand-500)' }} />
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Popular Cities */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Kho biển theo tỉnh thành
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {POPULAR_PROVINCES.map((prov) => (
                        <button
                          key={prov.code}
                          type="button"
                          onClick={() => handleQuickFilter(prov.code)}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--white)',
                            border: '1px solid var(--border-hairline)',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-strong)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 140ms ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--brand-500)';
                            e.currentTarget.style.background = 'var(--brand-50)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-hairline)';
                            e.currentTarget.style.background = 'var(--white)';
                          }}
                        >
                          <MapPin size={13} style={{ color: 'var(--brand-500)' }} />
                          {prov.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Shortcuts */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 8,
                      paddingTop: 8,
                      borderTop: '1px solid var(--border-hairline)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        go('lucky')();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        background: 'var(--surface-tint-cream)',
                        border: '1px solid var(--brand-200)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Compass size={18} style={{ color: 'var(--brand-600)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>
                          Tra cứu biển hợp mệnh
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Theo ngày sinh & ngũ hành
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        go('compare')();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        background: 'var(--surface-sunken)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <ArrowRight size={18} style={{ color: 'var(--brand-600)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>
                          So sánh 2 biển số
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Biểu đồ phong thủy 4 chiều
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderTop: '1px solid var(--border-hairline)',
                background: 'var(--surface-sunken)',
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <kbd style={{ padding: '2px 5px', borderRadius: 4, background: 'var(--white)', border: '1px solid var(--border-hairline)', fontSize: 10, fontWeight: 700 }}>↑</kbd>
                  <kbd style={{ padding: '2px 5px', borderRadius: 4, background: 'var(--white)', border: '1px solid var(--border-hairline)', fontSize: 10, fontWeight: 700 }}>↓</kbd>
                  Di chuyển
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <kbd style={{ padding: '2px 5px', borderRadius: 4, background: 'var(--white)', border: '1px solid var(--border-hairline)', fontSize: 10, fontWeight: 700 }}>↵</kbd>
                  Mở biển
                </span>
              </div>
              <span>Biensovip Search Engine</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
