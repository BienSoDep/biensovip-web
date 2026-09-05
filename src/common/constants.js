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
export const ADMIN_NAV = [
  { group: null, items: [['dash', 'Tổng quan'], ['aguide', 'Hướng dẫn sử dụng']] },
  { group: 'Bán hàng', items: [['aplates', 'Biển số'], ['atransactions', 'Giao dịch'], ['acontacts', 'Yêu cầu liên hệ'], ['acustomers', 'Khách hàng'], ['ainterestleads', 'Khách quan tâm'], ['acats', 'Danh mục']] },
  { group: 'Nội dung', items: [['aposts', 'Bài viết'], ['ameanings', 'Ý nghĩa phong thủy'], ['avideos', 'Video']] },
  { group: 'Tương tác khách hàng', items: [['anotifications', 'Thông báo'], ['aemailtpl', 'Mẫu email'], ['areviews', 'Đánh giá'], ['achatbot', 'Trợ lý AI']] },
  { group: 'Cộng tác viên', items: [['acollabs', 'Cộng tác viên'], ['acollabcontent', 'Nội dung CTV'], ['arisklog', 'Rủi ro CTV']] },
  { group: 'Hệ thống', items: [['astaff', 'Nhân viên'], ['aauditlog', 'Nhật ký hệ thống'], ['amaintenance', 'Bảo trì hệ thống']] },
];
export const TONES = { 'Mới': 'blue', 'Đang tư vấn': 'amber', 'Đã chốt': 'mint', 'Còn hàng': 'mint', 'Đã bán': 'rose', 'Ẩn': 'neutral', 'Đã xuất bản': 'mint', 'Bản nháp': 'neutral' };
export const STATUS_FG = { 'Mới': 'var(--blue-700)', 'Đang tư vấn': 'var(--status-warning-ink)', 'Đã chốt': 'var(--status-success-ink)' };
export const PER_PAGE = 6;
