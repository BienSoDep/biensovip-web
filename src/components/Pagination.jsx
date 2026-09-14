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
 * size="sm" cho bảng admin (gọn), "md" (mặc định) cho trang public.
 */
export default function Pagination({ page, totalPages, onChange, size = 'md', style }) {
  if (totalPages <= 1) return null;
  const { start, end, nums } = buildWindow(page, totalPages);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: size === 'sm' ? 'var(--space-1)' : 'var(--space-2)', flexWrap: 'wrap', ...style }}>
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onChange(Math.max(1, page - 1))}>Trước</Button>
      {start > 1 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => onChange(1)}>1</Button>
          <span style={{ color: 'var(--text-faint)' }}>…</span>
        </>
      )}
      {nums.map((n) => (
        <Button key={n} variant={n === page ? 'primary' : 'ghost'} size="sm" onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}>{n}</Button>
      ))}
      {end < totalPages && (
        <>
          <span style={{ color: 'var(--text-faint)' }}>…</span>
          <Button variant="ghost" size="sm" onClick={() => onChange(totalPages)}>{totalPages}</Button>
        </>
      )}
      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onChange(Math.min(totalPages, page + 1))}>Sau</Button>
    </div>
  );
}
