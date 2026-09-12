export const NAV = [
  ['home', 'Trang chủ'], ['list', 'Danh sách'], ['detail', 'Chi tiết'], ['register', 'Đăng ký'],
  ['login', 'Đăng nhập'], ['forgot', 'Quên MK'], ['fav', 'Yêu thích'], ['about', 'Giới thiệu'],
  ['blog', 'Blog'], ['post', 'Bài viết'], ['dash', 'Tổng quan'],
  ['aplates', 'Ad·Biển'], ['acats', 'Ad·Danh mục'], ['acontacts', 'Ad·Liên hệ'], ['aposts', 'Ad·Bài viết'], ['astaff', 'Ad·Nhân viên'],
  ['acustomers', 'Ad·Khách'], ['avideos', 'Ad·Video'], ['anotifications', 'Ad·Thông báo'], ['acollabs', 'Ad·Cộng tác viên'],
  ['chat', 'Liên hệ'], ['compare', 'So sánh'], ['saved', 'Thông báo'], ['reviews', 'Đánh giá'], ['notifications', 'TB mới'], ['collab', 'Cộng tác viên'],
];
// Nhóm theo luồng nghiệp vụ — mỗi nhóm render 1 khối toggle mở/thu trong sidebar admin (AdminShell.jsx
// AdminSidebarNav) để admin đến thẳng mục cần thay vì lướt qua 21 mục phẳng như trước. group: null
// đánh dấu mục hiện luôn ngoài mọi nhóm (không thu gọn được) — chỉ dùng cho Tổng quan/Hướng dẫn.
// 2026-09 — tổ chức lại: gộp 1 số trang liên quan thành 1 mục có tab bên trong (xem AdminBlog.jsx,
// AdminLogs.jsx, AdminPublicDisplay.jsx, AdminOpsTools.jsx, AdminNotificationsHub.jsx) để giảm số mục
// sidebar (29→21) và xếp các mục liên quan gần nhau theo đúng luồng thao tác thật.
export const ADMIN_NAV = [
  { group: null, items: [['dash', 'Tổng quan'], ['aguide', 'Hướng dẫn sử dụng']] },
  { group: 'Bán hàng', items: [['aplates', 'Biển số'], ['akanban', 'Quy trình bán hàng'], ['acats', 'Danh mục'], ['acoupons', 'Mã giảm giá'], ['acontacts', 'Yêu cầu liên hệ'], ['atransactions', 'Giao dịch'], ['acustomers', 'Khách hàng'], ['ainterestleads', 'Khách quan tâm']] },
  { group: 'Nội dung', items: [['aposts', 'Blog'], ['avideos', 'Video'], ['ameanings', 'Ý nghĩa phong thủy'], ['apolicypages', 'Trang chính sách']] },
  { group: 'Tương tác khách hàng', items: [['anotifications', 'Thông báo'], ['areviews', 'Đánh giá'], ['achatbot', 'Trợ lý AI']] },
  { group: 'Cộng tác viên', items: [['acollabs', 'Cộng tác viên'], ['acollabcontent', 'Nội dung CTV'], ['actvtemplates', 'Mẫu tin nhắn CTV']] },
  { group: 'Hệ thống', items: [['astaff', 'Nhân viên'], ['aauditlog', 'Nhật ký'], ['ashowroom', 'Hiển thị trang public'], ['afeatureflags', 'Công cụ vận hành']] },
];
export const TONES = { 'Mới': 'blue', 'Đang tư vấn': 'amber', 'Đã chốt': 'mint', 'Còn hàng': 'mint', 'Đã bán': 'rose', 'Ẩn': 'neutral', 'Đã xuất bản': 'mint', 'Bản nháp': 'neutral' };
export const STATUS_FG = { 'Mới': 'var(--blue-700)', 'Đang tư vấn': 'var(--status-warning-ink)', 'Đã chốt': 'var(--status-success-ink)' };
export const PER_PAGE = 6;

// Fallback hotline/Zalo khi API /settings chưa load hoặc lỗi — 1 nguồn duy nhất, đổi số thật
// chỉ cần sửa ở đây (trước đây lặp lại rải rác ở App.jsx/Footer.jsx/LuckyPlate.jsx).
export const DEFAULT_CONTACT = { phone: '0815792699', zalo: '0815792699' };
