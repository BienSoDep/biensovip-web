import toast from 'react-hot-toast';

// Zalo không có tham số URL chính thức để tự điền sẵn tin nhắn (khác WhatsApp
// ?text=) — copy tin nhắn vào clipboard trước khi mở link, khách chỉ cần dán
// (Ctrl+V) khi khung chat mở ra. Giúp admin xác định đúng biển khách hỏi.
export function buildConsultMessage(plateNumber) {
  return `Tôi muốn được tư vấn biển số ${plateNumber}`;
}

export async function openZaloWithMessage(zaloPhone, message) {
  try {
    await navigator.clipboard.writeText(message);
    toast.success('Đã sao chép tin nhắn — dán (Ctrl+V) khi khung chat Zalo mở ra');
  } catch {
    /* clipboard API có thể bị chặn (không phải HTTPS, quyền bị từ chối) — vẫn mở Zalo bình thường */
  }
  window.open(`https://zalo.me/${zaloPhone}`, '_blank', 'noopener,noreferrer');
}
