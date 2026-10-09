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
  { id: 1, key: 'official', label: 'Danh sách chính thức', note: 'Biển tuần', prefix: 'official' },
  { id: 2, key: 'published', label: 'Danh sách công bố', note: 'Biển tháng', prefix: 'published' },
  { id: 3, key: 'results', label: 'Kết quả đấu giá', note: 'Biển hết hạn', prefix: 'results' },
];
export const VPA_RUN_STATUS = { 0: 'Đang chạy', 1: 'Thành công', 2: 'Chưa đủ dữ liệu', 3: 'Lỗi' };
export const VPA_RUN_STATUS_TONE = { 0: 'blue', 1: 'mint', 2: 'amber', 3: 'rose' };

// Khung giờ tự động (giờ Việt Nam) của 1 nguồn, đọc từ vpa_settings — dùng để chú thích "lịch chạy dự kiến" ở bảng lịch sử.
// Hai mốc bằng nhau = không giới hạn giờ (chạy ngay khi đến hạn chu kỳ, bất kỳ lúc nào).
export function vpaScheduleWindowLabel(settings, source) {
  if (!settings) return null;
  const prefix = VPA_SOURCES.find((s) => s.id === source)?.prefix;
  if (!prefix) return null;
  const from = settings[`${prefix}WindowStartHour`];
  const to = settings[`${prefix}WindowEndHour`];
  if (from == null || to == null) return null;
  if (from === to) return 'Không giới hạn giờ';
  return `Tự động trong khung ${from}h–${to}h`;
}

// Ghi chú lưu trong lượt chạy (vpa_crawl_runs.note) → câu dễ hiểu cho Admin.
export function vpaRunNote(note) {
  if (!note) return null;
  if (note.startsWith('sudden_drop')) return 'Số biển giảm đột ngột so với lượt đủ trước nên đã bỏ qua phát hiện biến mất (không đổi biển nào sang tab nội bộ).';
  if (note.startsWith('MSG_VPA_ERR_04')) return `Lượt chưa đủ dữ liệu — ${note.replace(/^MSG_VPA_ERR_04:\s*/, '')}`;
  return note;
}

// Lý do đổi tab ghi trong vpa_plate_status_history.
export const VPA_CHANGE_REASONS = {
  official_listed: 'Lên danh sách chính thức (→ Tuần)',
  reappeared_official: 'Xuất hiện lại ở chính thức (→ Tuần)',
  auction_ended: 'Hết phiên (→ Hết hạn)',
  reappeared_published: 'Xuất hiện lại ở công bố (→ Tháng)',
  vanished_from_published: 'Biến mất khỏi công bố (→ Nội bộ)',
  run_reverted: 'Admin hoàn tác lượt',
  admin_edit: 'Admin sửa tay',
  manual_create: 'Admin thêm tay',
};

export function formatDuration(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} giây`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút ${s % 60 ? `${s % 60} giây` : ''}`.trim();
  const h = Math.floor(m / 60);
  return `${h} giờ ${m % 60} phút`;
}

export const formatInt = (n) => (n == null ? '—' : new Intl.NumberFormat('vi-VN').format(n));

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
  approveAll: 'Duyệt giá gợi ý cho TẤT CẢ biển đang khớp bộ lọc hiện tại — không chỉ các dòng đang hiển thị trên trang. Dùng khi đã kiểm bộ lọc đúng và muốn duyệt hàng loạt thay vì từng dòng.',
  approveRecomputed: 'Nguồn Công bố/Chính thức thường đi chậm hơn Kết quả đấu giá — lúc duyệt lần đầu, nhóm giá có thể chưa đủ mẫu nên giá gợi ý còn thiếu hoặc kém chính xác. Nút này tính lại giá mọi nhóm theo dữ liệu mới nhất, rồi áp giá gợi ý mới cho các biển đã duyệt — CHỈ với biển nghi chưa từng bị sửa giá tay (giá đã duyệt trùng giá gợi ý tại thời điểm đó). Biển Admin đã tự sửa giá khác giá gợi ý sẽ được giữ nguyên, không đổi.',
  approveRecomputedOverride: 'Giống "Duyệt lại giá toàn bộ", nhưng áp cho MỌI biển đã duyệt — kể cả biển nghi Admin đã sửa giá tay khác giá gợi ý. Có thể ghi đè mất giá bạn đã cố ý chỉnh (ví dụ theo thỏa thuận riêng với khách). Chỉ dùng khi chắc chắn muốn đồng bộ lại toàn bộ theo công thức.',
};
