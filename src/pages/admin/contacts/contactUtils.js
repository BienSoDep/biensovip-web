export const INTENT_LABEL = { inquiry: 'Hỏi chung', deposit_request: 'Đặt cọc', buy: 'Mua đứt', hunting: 'Săn hộ' };
export const INTENT_COLOR = { inquiry: 'var(--text-muted)', deposit_request: 'var(--accent-orange-ink)', buy: 'var(--blue-700)', hunting: 'var(--accent-purple-ink)' };
export const SOURCE_LABEL = { 'home-page': 'Trang chủ', 'contact-page': 'Trang liên hệ', 'plate-detail': 'Trang biển số', 'chatbot': 'Trợ lý AI' };
export const STATUS_OPTS = ['Mới', 'Đang tư vấn', 'Đã chốt', 'Hủy'];
export const STATUS_VAL = { 'Mới': 'new', 'Đang tư vấn': 'consulting', 'Đã chốt': 'closed', 'Hủy': 'cancelled' };
// found giữ lại trong map hiển thị — phòng data cũ chưa migrate về closed vẫn hiện đúng nhãn thay vì "undefined".
export const STATUS_LABEL = { new: 'Mới', consulting: 'Đang tư vấn', closed: 'Đã chốt', found: 'Đã chốt (cũ)', cancelled: 'Hủy' };
export const STATUS_COLOR = { new: 'var(--blue-700)', consulting: 'var(--status-warning-ink)', closed: 'var(--status-success-ink)', found: '#7B2D8B', cancelled: 'var(--text-faint)' };
export const INTENT_OPTS = ['Tất cả', 'Hỏi chung', 'Đặt cọc', 'Mua đứt', 'Săn hộ'];
export const INTENT_VAL = { 'Hỏi chung': 'inquiry', 'Đặt cọc': 'deposit_request', 'Mua đứt': 'buy', 'Săn hộ': 'hunting' };

// Đếm ngược số ngày còn lại trước khi ContactPurgeJob xóa cứng (retention 30 ngày, xem backend).
export const daysLeftInTrash = (deletedAt) => {
  if (!deletedAt) return null;
  const elapsedMs = Date.now() - new Date(deletedAt).getTime();
  return Math.max(0, 30 - Math.floor(elapsedMs / 86400000));
};
