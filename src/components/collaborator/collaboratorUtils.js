// Fallback copy cho trình duyệt không có Clipboard API (HTTP không HTTPS).
export function fallbackCopy(text, onOk) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) onOk();
  } catch { /* không hỗ trợ — bỏ qua */ }
}

export function money(n) {
  return (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
}

// Nhãn tiến độ hiển thị cho CTV — ưu tiên tín hiệu Transaction/Plate thật hơn ContactRequest.Status
export function contactStageInfo(c) {
  if (c.plateSold) return { label: 'Đã bán', tone: 'mint' };
  if (c.depositStatus === 'payment_confirmed') return { label: 'Đã cọc', tone: 'blue' };
  if (c.depositStatus === 'pending') return { label: 'Đã cọc (chờ xác nhận)', tone: 'amber' };
  if (c.status === 'closed') return { label: 'Đã chốt', tone: 'mint' };
  if (c.status === 'consulting') return { label: 'Đang tư vấn', tone: 'amber' };
  return { label: 'Mới liên hệ', tone: 'neutral' };
}

// Trục/tooltip tiền dạng gọn: 1.500.000 -> "1,5tr", dưới 1 triệu giữ nguyên số.
export function formatMoneyAxis(v) {
  if (v >= 1e6) return `${(v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1).replace('.', ',')}tr`;
  return v.toLocaleString('vi-VN');
}
