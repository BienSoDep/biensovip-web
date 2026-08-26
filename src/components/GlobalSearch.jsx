import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { Search } from 'lucide-react';
import Modal from './Modal.jsx';
import { useGlobalSearch } from '../services/globalSearch.js';

const money = (n) => (n == null ? '' : Number(n).toLocaleString('vi-VN') + 'đ');

// UC35 — Ctrl+K global search cross-entity (Plate/Customer/Post/Contact).
export default function GlobalSearch({ go, patch }) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [q] = useDebouncedValue(keyword, 300);
  const inputRef = useRef(null);
  const { data, isLoading } = useGlobalSearch(q);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setKeyword('');
  }, [open]);

  const goTo = (screen, q2) => {
    setOpen(false);
    patch?.({ adminQ: q2 || '' });
    go(screen)();
  };

  const groups = data ? [
    { label: 'Biển số', screen: 'aplates', items: (data.plates || []).map((p) => ({ id: p.id, text: p.plateNumber, sub: money(p.price) })) },
    { label: 'Khách hàng', screen: 'acustomers', items: (data.customers || []).map((c) => ({ id: c.id, text: c.fullName || c.email || c.phone, sub: c.email || c.phone })) },
    { label: 'Bài viết', screen: 'aposts', items: (data.posts || []).map((p) => ({ id: p.id, text: p.title, sub: p.slug })) },
    { label: 'Liên hệ', screen: 'acontacts', items: (data.contacts || []).map((c) => ({ id: c.id, text: c.fullName, sub: c.phone })) },
  ].filter((g) => g.items.length > 0) : [];

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Tìm kiếm" maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-field)', padding: '0 12px' }}>
          <Search size={16} style={{ color: 'var(--text-faint)' }} />
          <input ref={inputRef} value={keyword} onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm biển số, khách hàng, bài viết, liên hệ…"
            style={{ flex: 1, border: 'none', outline: 'none', height: 40, font: 'var(--type-body-sm)' }} />
        </div>

        {isLoading && q && <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Đang tìm…</span>}
        {!isLoading && q && groups.length === 0 && <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>Không tìm thấy kết quả.</span>}

        {groups.map((g) => (
          <div key={g.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: 'var(--type-caption)', fontSize: 'var(--fs-micro)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-faint)' }}>{g.label}</span>
            {g.items.map((it) => (
              <button key={it.id} type="button" onClick={() => goTo(g.screen, it.text)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, border: 'none', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-field)', padding: '8px 12px', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{it.text}</span>
                {it.sub && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{it.sub}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </Modal>
  );
}
