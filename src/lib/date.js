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
