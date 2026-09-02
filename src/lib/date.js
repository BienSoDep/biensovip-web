import { differenceInMinutes, differenceInHours, differenceInDays, format } from 'date-fns';

// Shared date formatting — thay các hàm timeAgo/toLocaleDateString trùng lặp bằng date-fns.
// timeAgo: nhãn tiếng Việt gọn; capDays > 0 → quá ngưỡng thì hiện ngày thay vì "X ngày trước".

export function timeAgo(dateStr, { capDays = 0 } = {}) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const mins = differenceInMinutes(now, d);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = differenceInHours(now, d);
  if (hours < 24) return `${hours} giờ trước`;
  const days = differenceInDays(now, d);
  if (capDays && days >= capDays) return format(d, 'dd/MM/yyyy');
  return `${days} ngày trước`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'dd/MM/yyyy');
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm');
}

// Validate ngày sinh dạng ISO 'yyyy-mm-dd' — hợp lệ thật (không phải chỉ khớp regex, VD 2024-02-30
// bị từ chối), năm trong khoảng [1900, năm hiện tại]. Trước đây định nghĩa trùng ở LuckyPlate.jsx/Profile.jsx.
export function validBirthDate(iso) {
  if (!iso) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const currentYear = new Date().getFullYear();
  if (!y || !m || !d || y < 1900 || y > currentYear) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
