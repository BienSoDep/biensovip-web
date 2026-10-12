import { useState, useMemo } from 'react';
import { Columns3, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Hook quản lý trạng thái hiển thị cột (bật/tắt) và lưu vào localStorage.
 */
export function useTableColumns({ storageKey, columns }) {
  const [cols, setCols] = useState(() => {
    const base = Object.fromEntries(columns.map((c) => [c.key, c.default !== false]));
    if (!storageKey) return base;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && typeof saved === 'object') {
        return { ...base, ...saved };
      }
    } catch { /* ignore */ }
    return base;
  });

  const toggleCol = (key) => {
    setCols((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (storageKey) {
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
  };

  const selectAll = () => {
    const next = Object.fromEntries(columns.map((c) => [c.key, true]));
    setCols(next);
    if (storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
    }
  };

  const deselectAll = () => {
    // Giữ ít nhất 1 cột quan trọng đầu tiên hoặc cho phép bỏ hết
    const next = Object.fromEntries(columns.map((c) => [c.key, false]));
    setCols(next);
    if (storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
    }
  };

  const resetDefault = () => {
    const base = Object.fromEntries(columns.map((c) => [c.key, c.default !== false]));
    setCols(base);
    if (storageKey) {
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    }
  };

  return {
    cols,
    toggleCol,
    selectAll,
    deselectAll,
    resetDefault,
    isVisible: (key) => cols[key] !== false,
  };
}

/**
 * Nút dropdown chọn ẩn / hiện cột trên bảng dữ liệu.
 */
export function TableColumnMenu({ columns, cols, toggleCol, selectAll, deselectAll, resetDefault }) {
  const [open, setOpen] = useState(false);
  const visibleCount = columns.filter((c) => cols[c.key] !== false).length;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Tùy chọn ẩn/hiện cột dữ liệu"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 36,
          padding: '0 12px',
          borderRadius: 'var(--radius-field)',
          border: '1px solid var(--border-hairline)',
          background: 'var(--white)',
          color: 'var(--text-strong)',
          font: 'var(--type-caption)',
          fontWeight: 'var(--fw-medium)',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-inset-hairline)',
          transition: 'all 0.15s ease',
        }}
      >
        <Columns3 size={14} style={{ color: 'var(--action-primary)' }} />
        <span>Cột hiển thị ({visibleCount}/{columns.length})</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: 0,
              zIndex: 100,
              background: 'var(--white)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              border: '1px solid var(--border-hairline)',
              padding: '8px',
              minWidth: 220,
              maxHeight: 380,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Thanh thao tác nhanh */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 8px', borderBottom: '1px solid var(--border-hairline)', marginBottom: 4 }}>
              <button
                type="button"
                onClick={selectAll}
                style={{ border: 'none', background: 'none', color: 'var(--link)', font: 'var(--type-caption)', fontWeight: 'var(--fw-medium)', cursor: 'pointer', padding: 0 }}
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                onClick={deselectAll}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', font: 'var(--type-caption)', cursor: 'pointer', padding: 0 }}
              >
                Bỏ chọn
              </button>
              <button
                type="button"
                onClick={resetDefault}
                style={{ border: 'none', background: 'none', color: 'var(--action-primary)', font: 'var(--type-caption)', fontWeight: 'var(--fw-medium)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 2 }}
                title="Khôi phục danh sách cột mặc định"
              >
                <RotateCcw size={11} /> Mặc định
              </button>
            </div>

            {/* Danh sách các cột có checkbox */}
            {columns.map((c) => {
              const checked = cols[c.key] !== false;
              return (
                <label
                  key={c.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    font: 'var(--type-body-sm)',
                    fontSize: 13,
                    color: checked ? 'var(--text-strong)' : 'var(--text-muted)',
                    userSelect: 'none',
                    background: checked ? 'transparent' : 'var(--surface-sunken)',
                    opacity: checked ? 1 : 0.65,
                    transition: 'background 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCol(c.key)}
                    style={{ width: 14, height: 14, accentColor: 'var(--action-primary)', cursor: 'pointer' }}
                  />
                  <span>{c.label}</span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Tiêu đề cột có chức năng bấm để sắp xếp tăng/giảm.
 */
export function TableSortHeader({ sort, onSort, label, sortKey, style, tip, align = 'left' }) {
  const isSorted = sort?.key === sortKey;
  const isAsc = isSorted && sort.dir === 'asc';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
        ...style,
      }}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-sort={isSorted ? (isAsc ? 'ascending' : 'descending') : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: isSorted ? 'var(--action-primary)' : 'inherit',
          font: 'inherit',
          fontSize: 'inherit',
          fontWeight: isSorted ? 'var(--fw-bold, 700)' : 'inherit',
          letterSpacing: 'inherit',
          textTransform: 'inherit',
        }}
      >
        <span>{label}</span>
        {isSorted ? (
          isAsc ? (
            <ArrowUp size={13} style={{ color: 'var(--action-primary)' }} />
          ) : (
            <ArrowDown size={13} style={{ color: 'var(--action-primary)' }} />
          )
        ) : (
          <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
        )}
      </button>
      {tip && <span title={tip} style={{ cursor: 'help', opacity: 0.7, fontSize: 11 }}>ℹ️</span>}
    </span>
  );
}

/**
 * Hàm tiện ích sắp xếp 2 tầng thông minh:
 * Tự động sắp xếp Client-side mượt mà dựa trên sortKey và sortDir.
 */
export function sortTableItems(items, sortKey, sortDir, customExtractors = {}) {
  if (!sortKey || !sortDir || !Array.isArray(items)) return items || [];
  return [...items].sort((a, b) => {
    let va = customExtractors[sortKey] ? customExtractors[sortKey](a) : a[sortKey];
    let vb = customExtractors[sortKey] ? customExtractors[sortKey](b) : b[sortKey];

    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;

    // Chuỗi
    if (typeof va === 'string' && typeof vb === 'string') {
      const cmp = va.localeCompare(vb, 'vi', { sensitivity: 'base', numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    }
    // Boolean
    if (typeof va === 'boolean' && typeof vb === 'boolean') {
      const numA = va ? 1 : 0;
      const numB = vb ? 1 : 0;
      return sortDir === 'asc' ? numA - numB : numB - numA;
    }
    // Số
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortDir === 'asc' ? va - vb : vb - va;
    }
    // Ngày tháng
    if (va instanceof Date || vb instanceof Date || (typeof va === 'string' && !isNaN(Date.parse(va)) && isNaN(Number(va)))) {
      const ta = new Date(va).getTime();
      const tb = new Date(vb).getTime();
      return sortDir === 'asc' ? ta - tb : tb - ta;
    }

    return sortDir === 'asc' ? (va > vb ? 1 : va < vb ? -1 : 0) : (va < vb ? 1 : va > vb ? -1 : 0);
  });
}
