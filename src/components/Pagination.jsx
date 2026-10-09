import Button from './Button.jsx';

// Cửa sổ tối đa 5 số trang trượt theo trang hiện tại, cộng số 1/totalPages tách riêng ở 2 đầu khi
// chúng KHÔNG liền kề cửa sổ (còn liền kề — start=2 hoặc end=totalPages-1 — thì gộp thẳng vào cửa
// sổ luôn, tránh hiện trùng số kiểu "1 2 3 4 5 6" thay vì đúng 5 số). Rút ra từ PlateList.jsx để
// dùng chung cho mọi trang có phân trang (Blog, Reviews, các bảng admin).
function buildWindow(page, totalPages, windowSize = 5) {
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(start + windowSize - 1, totalPages);
  start = Math.max(1, end - windowSize + 1);
  if (start === 2) { start = 1; end = Math.min(windowSize, totalPages); }
  if (end === totalPages - 1) { end = totalPages; start = Math.max(1, totalPages - windowSize + 1); }
  const nums = [];
  for (let n = start; n <= end; n++) nums.push(n);
  return { start, end, nums };
}

/**
 * Thanh phân trang dùng chung: Trước · 1 … [cửa sổ 5 số] … cuối · Sau.
 * Hỗ trợ getHref: khi truyền vào, các nút số trang render thẻ <a> chuẩn cho Googlebot cào và người dùng mở tab mới.
 * size="sm" cho bảng admin (gọn), "md" (mặc định) cho trang public.
 */
export default function Pagination({ page, totalPages, onChange, getHref, size = 'md', style }) {
  if (totalPages <= 1) return null;
  const { start, end, nums } = buildWindow(page, totalPages);

  const renderPageItem = (n) => {
    const isCurrent = n === page;
    const href = getHref ? getHref(n) : undefined;

    if (href) {
      return (
        <a
          key={n}
          href={href}
          className="pagination-btn pressable"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
              e.preventDefault();
              onChange(n);
            }
          }}
          aria-current={isCurrent ? 'page' : undefined}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 32,
            height: 32,
            padding: '0 10px',
            borderRadius: 'var(--radius-sm)',
            font: 'var(--type-caption)',
            fontWeight: isCurrent ? 'var(--fw-bold)' : 'var(--fw-medium)',
            textDecoration: 'none',
            background: isCurrent ? 'var(--action-primary)' : 'transparent',
            color: isCurrent ? 'var(--white)' : 'var(--text-body)',
            border: isCurrent ? 'none' : '1px solid transparent',
            cursor: 'pointer',
            transition: 'background 120ms ease, color 120ms ease',
          }}
        >
          {n}
        </a>
      );
    }

    return (
      <Button key={n} variant={isCurrent ? 'primary' : 'ghost'} size="sm" onClick={() => onChange(n)} aria-current={isCurrent ? 'page' : undefined}>{n}</Button>
    );
  };

  return (
    <nav aria-label="Phân trang" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: size === 'sm' ? 'var(--space-1)' : 'var(--space-2)', flexWrap: 'wrap', ...style }}>
      {getHref && page > 1 ? (
        <a
          href={getHref(page - 1)}
          className="pagination-btn pressable"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
              e.preventDefault();
              onChange(page - 1);
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 32,
            padding: '0 14px',
            borderRadius: 'var(--radius-sm)',
            font: 'var(--type-caption)',
            textDecoration: 'none',
            border: '1px solid var(--border-hairline)',
            background: 'var(--white)',
            color: 'var(--text-body)',
          }}
        >
          Trước
        </a>
      ) : (
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onChange(Math.max(1, page - 1))}>Trước</Button>
      )}

      {start > 1 && (
        <>
          {renderPageItem(1)}
          <span style={{ color: 'var(--text-faint)' }}>…</span>
        </>
      )}

      {nums.map(renderPageItem)}

      {end < totalPages && (
        <>
          <span style={{ color: 'var(--text-faint)' }}>…</span>
          {renderPageItem(totalPages)}
        </>
      )}

      {getHref && page < totalPages ? (
        <a
          href={getHref(page + 1)}
          className="pagination-btn pressable"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
              e.preventDefault();
              onChange(page + 1);
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 32,
            padding: '0 14px',
            borderRadius: 'var(--radius-sm)',
            font: 'var(--type-caption)',
            textDecoration: 'none',
            border: '1px solid var(--border-hairline)',
            background: 'var(--white)',
            color: 'var(--text-body)',
          }}
        >
          Sau
        </a>
      ) : (
        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onChange(Math.min(totalPages, page + 1))}>Sau</Button>
      )}
    </nav>
  );
}

