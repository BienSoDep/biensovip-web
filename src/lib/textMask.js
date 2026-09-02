// Che tên hiển thị công khai (review, danh sách khách hàng ẩn danh) — giữ chữ đầu/cuối, che phần giữa.
// Trước đây định nghĩa trùng ở PlateDetail.jsx/Reviews.jsx.
export function maskName(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Khách hàng';
  if (parts.length === 1) return parts[0][0] + '***';
  return `${parts[0]} *** ${parts[parts.length - 1]}`;
}
