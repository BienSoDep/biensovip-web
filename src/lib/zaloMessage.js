import toast from 'react-hot-toast';

// Zalo không có tham số URL chính thức để tự điền sẵn tin nhắn (khác WhatsApp
// ?text=) — copy tin nhắn vào clipboard trước khi mở link, khách chỉ cần dán
// (Ctrl+V) khi khung chat mở ra. Giúp admin xác định đúng biển khách hỏi.
export function buildConsultMessage(plateNumber) {
  return `Tôi muốn được tư vấn biển số ${plateNumber}`;
}

// UC40 §3.4 — tin nhắn mẫu CTV mời khách, copy sẵn để gửi Zalo/Facebook nhanh không phải tự soạn.
export function buildCtvInviteMessage({ referralUrl }) {
  return `Chào bạn! Mình đang có mã giới thiệu mua biển số đẹp tại Biensovip.com — bạn xem thử nhé: ${referralUrl}. Có gì cần tư vấn thêm cứ nhắn mình!`;
}

export function buildCtvPlateInviteMessage({ plateNumber, referralUrl }) {
  return `Chào bạn! Mình đang có biển ${plateNumber} khá đẹp, giới thiệu qua bạn xem thử: ${referralUrl}`;
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

// Desktop không có handler xử lý tel: (trình duyệt desktop không mở app gọi điện nào) — bấm không
// phản ứng gì. Mobile thì tel: hoạt động bình thường (mở app gọi). Phát hiện qua UA thay vì onClick
// preventDefault trên <a href="tel:">, giữ href thật để middle-click/copy-link vẫn đúng trên mobile.
export function isMobileDevice() {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export async function callOrCopyPhone(phone) {
  try {
    await navigator.clipboard.writeText(phone);
    toast.success(`Đã sao chép số ${phone} — dán để gọi hoặc lưu danh bạ`);
  } catch {
    toast(`Số điện thoại: ${phone}`);
  }
}
