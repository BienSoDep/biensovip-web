// Nhãn hiển thị cho biển VPA — không bao giờ có giá khởi điểm/giá trúng (API công khai không trả).
export const VPA_EXPIRED_LABELS = { Auctioned: 'Đã đấu', NoBidder: 'Chưa có người trúng', Pending: 'Chờ kết quả' };

export function formatCountdown(iso, now = Date.now()) {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return 'Đang diễn ra';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 48) return `Còn ${Math.floor(h / 24)} ngày`;
  return h > 0 ? `Còn ${h}g ${m}p` : `Còn ${m} phút`;
}

export function formatDateTime(iso) {
  return iso ? new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
}

// Chuỗi hiện trên thẻ: tab Tuần = đếm ngược, tab Tháng = ngày phiên, tab Hết hạn = nhãn kết quả.
export function vpaBadge(p, now = Date.now()) {
  if (p.tab === 'weekly') return formatCountdown(p.auctionStartAt, now);
  if (p.tab === 'monthly') return p.auctionStartAt ? `Phiên ${new Date(p.auctionStartAt).toLocaleDateString('vi-VN')}` : 'Sắp đấu giá';
  return VPA_EXPIRED_LABELS[p.expiredLabel] || 'Hết hạn';
}

// Backend trả enum dạng số (không bật JsonStringEnumConverter) — chấp nhận cả tên để không vỡ nếu đổi cấu hình.
export const isCar = (v) => v === 1 || v === 'Car';

// ---- Admin ----
export const VPA_TAB_LABELS = { 1: 'Tháng', 2: 'Tuần', 3: 'Hết hạn', 4: 'Hết hạn nội bộ' };
export const VPA_PRICE_STATES = {
  0: { label: 'Chưa có gợi ý', tone: 'neutral' },
  1: { label: 'Có gợi ý', tone: 'amber' },
  2: { label: 'Đã duyệt', tone: 'mint' },
  3: { label: 'Đã từ chối', tone: 'rose' },
  4: { label: 'Đề xuất đổi giá', tone: 'blue' },
};
export const VPA_SOURCES = [
  { id: 1, key: 'official', label: 'Danh sách chính thức', prefix: 'official' },
  { id: 2, key: 'published', label: 'Danh sách công bố', prefix: 'published' },
  { id: 3, key: 'results', label: 'Kết quả đấu giá', prefix: 'results' },
];
export const VPA_RUN_STATUS = { 0: 'Đang chạy', 1: 'Thành công', 2: 'Chưa đủ dữ liệu', 3: 'Lỗi' };

// Cờ trường Admin đã sửa tay (khớp VpaLockedFields ở backend): crawl không ghi đè các trường này.
export const VPA_LOCK_FLAGS = [
  { flag: 1, label: 'Loại biển' },
  { flag: 2, label: 'Tỉnh' },
  { flag: 4, label: 'Tab' },
  { flag: 8, label: 'Nổi bật' },
];

// Giải thích hiển thị ở tiêu đề cột / khung "Về trang này".
export const VPA_HELP = {
  tab: 'Tháng = biển sắp đấu giá (công bố trước). Tuần = có phiên trong tuần. Hết hạn = phiên đã qua. Hết hạn nội bộ = biến mất khỏi VPA, chỉ Admin thấy, không hiện cho khách.',
  startingPrice: 'Giá khởi điểm VPA công bố cho biển. Chỉ Admin thấy, không bao giờ hiện cho khách.',
  suggested: 'Giá gợi ý = trung bình giá trúng của nhóm biển giống nhau (tỉnh + loại xe + loại biển + chữ ký) × hệ số. Số trong ngoặc là số mẫu dùng để tính; ít mẫu thì gợi ý kém tin cậy.',
  approved: 'Giá khách thấy sau khi bạn duyệt. Chưa duyệt thì khách thấy "Giá liên hệ". Giá này không tự đổi khi crawl.',
  priceState: 'Chưa có gợi ý = nhóm chưa đủ mẫu. Có gợi ý = chờ duyệt. Đã duyệt = đang hiện cho khách. Từ chối = không dùng gợi ý. Đề xuất đổi giá = có gợi ý mới lệch quá % so với giá đã duyệt (giá khách thấy chưa đổi).',
  featured: 'Biển nổi bật (ngũ quý, lộc phát…). Xếp trước trong danh sách khách và được đưa vào sitemap khi đang ở tab Tháng/Tuần.',
  manual: 'Biển Admin thêm tay, không có trong dữ liệu VPA. Crawl không đổi tab hay đánh dấu biến mất.',
  lock: 'Trường bạn đã sửa tay được khóa: crawl VPA sẽ không ghi đè. Bấm "Trả về theo VPA" để bỏ khóa.',
};
