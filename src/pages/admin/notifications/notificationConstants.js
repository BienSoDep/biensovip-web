export const TYPE_LABEL = {
  plate_match: 'Biển mới khớp tìm kiếm đã lưu', hot_alert: 'Biển yêu thích đang HOT', re_engage: 'Nhắc quay lại (không hoạt động)',
  price_drop: 'Biển yêu thích giảm giá', ai_pick: 'Gợi ý AI', digest: 'Email tổng hợp hàng ngày',
  plate_sold: 'Biển yêu thích đã bán',
  fengshui_match: 'Biển mới hợp mệnh', contact_status: 'Cập nhật yêu cầu liên hệ', new_review: 'Đánh giá mới trên biển đang theo dõi',
  search_stale: 'Tìm kiếm đã lưu chưa có kết quả', viewed_price_drop: 'Giảm giá biển đã xem', compare_price_drop: 'Giảm giá biển đang so sánh',
  profile_incomplete: 'Nhắc hoàn thiện hồ sơ', collaborator_commission: 'Hoa hồng CTV đã thanh toán (email)',
  guest_contact_received: 'Xác nhận tiếp nhận yêu cầu (Khách để lại thông tin)',
  guest_contact_status: 'Cập nhật tiến độ tư vấn (Khách để lại thông tin)',
  subscriber_welcome: 'Chào mừng đăng ký nhận tin (Newsletter)',
  guest_account_invite: 'Mời khách để lại thông tin tạo tài khoản VIP',
  lead_plate_reminder: 'Nhắc nhở biển số đẹp khách từng quan tâm',
};

// Mô tả điều kiện kích hoạt thật — lấy trực tiếp từ logic job/service backend, không phải suy đoán.
export const TYPE_DESC = {
  plate_match: 'Gửi khi có biển mới đăng (15 phút gần nhất) khớp bộ lọc tìm kiếm đã lưu của người dùng.',
  hot_alert: 'Gửi khi biển đã yêu thích vừa được đánh dấu HOT trong 1 giờ gần nhất.',
  re_engage: 'Gửi cho user không hoạt động quá lâu, hoặc tài khoản mới 2-5 ngày chưa lưu biển nào.',
  price_drop: 'Gửi khi biển đã yêu thích giảm giá vượt ngưỡng cấu hình so với lúc lưu.',
  ai_pick: 'Gửi gợi ý biển cùng tỉnh/loại xe với biển đã lưu, xếp theo lượt xem — tối đa 3 gợi ý/ngày.',
  digest: 'Gửi email gộp mọi thông báo web trong 24h qua, vào đúng giờ mỗi user tự chọn trong hồ sơ cá nhân — không phải giờ admin đặt ở đây.',
  plate_sold: 'Gửi ngay khi biển đã yêu thích chuyển sang trạng thái Đã bán.',
  fengshui_match: 'Gửi khi có biển mới đăng có số cuối hợp mệnh theo năm sinh của người dùng.',
  contact_status: 'Gửi ngay khi admin đổi trạng thái yêu cầu liên hệ của người dùng.',
  new_review: 'Gửi ngay khi 1 đánh giá về biển được admin duyệt lần đầu — báo cho ai đã yêu thích biển đó.',
  search_stale: 'Gửi khi 1 tìm kiếm đã lưu quá 30 ngày không có kết quả mới — nhắc user nới bộ lọc.',
  viewed_price_drop: 'Gửi khi biển đã xem (không cần yêu thích) giảm giá vượt ngưỡng so với lúc xem.',
  compare_price_drop: 'Gửi khi biển trong danh sách so sánh giảm giá vượt ngưỡng so với lúc mở so sánh.',
  profile_incomplete: 'Gửi cho user đăng ký ≥2 ngày còn thiếu họ tên/ngày sinh/giới tính, đúng giờ admin đặt bên dưới.',
  collaborator_commission: 'Gửi tới email CTV khi hoa hồng của họ chuyển sang trạng thái Đã thanh toán.',
  guest_contact_received: 'Tự động gửi email xác nhận ngay khi khách để lại thông tin liên hệ / đặt cọc / mua biển trên website.',
  guest_contact_status: 'Tự động gửi email thông báo khi chuyên viên/admin cập nhật trạng thái yêu cầu tư vấn của khách vãng lai.',
  subscriber_welcome: 'Tự động gửi email chào mừng và gửi mã ưu đãi ngay khi người dùng đăng ký nhận tin ở chân trang / popup.',
  guest_account_invite: 'Tự động gửi email mời khách hàng đã để lại thông tin tạo tài khoản thành viên để nhận ưu đãi và lưu biển.',
  lead_plate_reminder: 'Tự động nhắc nhở khách về biển số đẹp họ từng quan tâm nhưng chưa chốt giao dịch.',
};

// Nhóm các loại thông báo dành riêng cho khách chưa đăng ký / người để lại thông tin
export const GUEST_TYPES = new Set([
  'guest_contact_received',
  'guest_contact_status',
  'subscriber_welcome',
  'guest_account_invite',
  'lead_plate_reminder',
]);

// Thông tin chi tiết: Cơ chế kích hoạt, đối tượng nhận, kênh hỗ trợ & danh sách biến khả dụng
export const TYPE_META = {
  plate_match: {
    mechanism: 'Định kỳ (Mỗi 15 phút)',
    isRealtime: false,
    audience: 'Thành viên lưu bộ lọc tìm kiếm',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số xe khớp' },
      { key: '{Province}', desc: 'Tỉnh/Thành phố' },
    ],
  },
  hot_alert: {
    mechanism: 'Định kỳ (Mỗi 1 giờ)',
    isRealtime: false,
    audience: 'Người dùng thích biển đang HOT',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số HOT' },
    ],
  },
  re_engage: {
    mechanism: 'Hàng ngày (08:00 VN)',
    isRealtime: false,
    audience: 'Thành viên im lặng > 14 ngày',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  price_drop: {
    mechanism: 'Thời gian thực (Khi giảm giá ≥ 5%)',
    isRealtime: true,
    audience: 'Người dùng đã bấm yêu thích biển',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số xe' },
      { key: '{OldPrice}', desc: 'Giá trước khi giảm' },
      { key: '{NewPrice}', desc: 'Giá ưu đãi mới' },
    ],
  },
  ai_pick: {
    mechanism: 'Hàng ngày (10:00 VN)',
    isRealtime: false,
    audience: 'Thành viên có lịch sử tìm kiếm & xem biển',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  digest: {
    mechanism: 'Theo giờ thành viên tự cấu hình',
    isRealtime: false,
    audience: 'Thành viên bật email tổng hợp 24h',
    channels: ['Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  plate_sold: {
    mechanism: 'Thời gian thực (Ngay khi đổi sang Đã bán)',
    isRealtime: true,
    audience: 'Người dùng đã bấm yêu thích biển',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số xe đã bán' },
    ],
  },
  fengshui_match: {
    mechanism: 'Định kỳ (Mỗi 30 phút)',
    isRealtime: false,
    audience: 'Thành viên có ngày sinh/năm sinh',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số hợp mệnh' },
    ],
  },
  contact_status: {
    mechanism: 'Thời gian thực (Khi đổi trạng thái tư vấn)',
    isRealtime: true,
    audience: 'Thành viên gửi yêu cầu liên hệ',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số tư vấn' },
      { key: '{Status}', desc: 'Trạng thái mới' },
    ],
  },
  new_review: {
    mechanism: 'Thời gian thực (Khi duyệt đánh giá)',
    isRealtime: true,
    audience: 'Người dùng đã thích biển được đánh giá',
    channels: ['Web'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{PlateNumber}', desc: 'Biển số xe' },
    ],
  },
  search_stale: {
    mechanism: 'Hàng ngày (11:00 VN)',
    isRealtime: false,
    audience: 'Thành viên có bộ lọc lưu > 30 ngày',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  viewed_price_drop: {
    mechanism: 'Thời gian thực (Khi giảm giá ≥ 5%)',
    isRealtime: true,
    audience: 'Người dùng đã xem biển trong 7 ngày',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số xe' },
      { key: '{OldPrice}', desc: 'Giá cũ' },
      { key: '{NewPrice}', desc: 'Giá mới' },
    ],
  },
  compare_price_drop: {
    mechanism: 'Thời gian thực (Khi giảm giá ≥ 5%)',
    isRealtime: true,
    audience: 'Người dùng từng đưa biển vào so sánh',
    channels: ['Web', 'Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PlateNumber}', desc: 'Biển số xe' },
      { key: '{OldPrice}', desc: 'Giá cũ' },
      { key: '{NewPrice}', desc: 'Giá mới' },
    ],
  },
  profile_incomplete: {
    mechanism: 'Hàng ngày (Theo giờ admin cấu hình)',
    isRealtime: false,
    audience: 'Thành viên mới thiếu ngày sinh/họ tên',
    channels: ['Email'],
    vars: [
      { key: '{UserName}', desc: 'Tên thành viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{MissingFields}', desc: 'Các trường còn thiếu' },
    ],
  },
  collaborator_commission: {
    mechanism: 'Thời gian thực (Khi thanh toán hoa hồng)',
    isRealtime: true,
    audience: 'Cộng tác viên nhận thanh toán',
    channels: ['Email'],
    vars: [
      { key: '{CollaboratorName}', desc: 'Tên cộng tác viên' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{Amount}', desc: 'Số tiền thanh toán' },
    ],
  },
  guest_contact_received: {
    mechanism: 'Thời gian thực (Ngay khi submit form)',
    isRealtime: true,
    audience: 'Khách hàng để lại thông tin liên hệ',
    channels: ['Email'],
    vars: [
      { key: '{CustomerName}', desc: 'Tên khách hàng' },
      { key: '{CustomerPhone}', desc: 'Số điện thoại' },
      { key: '{PlateNumber}', desc: 'Biển số quan tâm' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  guest_contact_status: {
    mechanism: 'Thời gian thực (Khi cập nhật trạng thái)',
    isRealtime: true,
    audience: 'Khách hàng để lại thông tin liên hệ',
    channels: ['Email'],
    vars: [
      { key: '{CustomerName}', desc: 'Tên khách hàng' },
      { key: '{PlateNumber}', desc: 'Biển số tư vấn' },
      { key: '{Status}', desc: 'Trạng thái xử lý' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  subscriber_welcome: {
    mechanism: 'Thời gian thực (Ngay khi đăng ký)',
    isRealtime: true,
    audience: 'Email đăng ký nhận bản tin mới',
    channels: ['Email'],
    vars: [
      { key: '{CustomerEmail}', desc: 'Email khách hàng' },
      { key: '{SiteName}', desc: 'Tên website' },
      { key: '{PromoCode}', desc: 'Mã ưu đãi tặng kèm' },
    ],
  },
  guest_account_invite: {
    mechanism: 'Định kỳ (Sau 24h từ khi liên hệ)',
    isRealtime: false,
    audience: 'Khách để lại thông tin chưa có tài khoản',
    channels: ['Email'],
    vars: [
      { key: '{CustomerName}', desc: 'Tên khách hàng' },
      { key: '{RegisterLink}', desc: 'Link kích hoạt tài khoản' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
  lead_plate_reminder: {
    mechanism: 'Định kỳ (Sau 3 ngày chưa chốt)',
    isRealtime: false,
    audience: 'Khách để lại thông tin nhưng chưa hoàn tất',
    channels: ['Email'],
    vars: [
      { key: '{CustomerName}', desc: 'Tên khách hàng' },
      { key: '{PlateNumber}', desc: 'Biển số đang quan tâm' },
      { key: '{SiteName}', desc: 'Tên website' },
    ],
  },
};

export const HOUR_HAS_EFFECT = new Set(['profile_incomplete']);

export const TARGETS = [
  { value: 'all', label: 'Tất cả người dùng' },
  { value: 'subscribed', label: 'Đã đăng ký nhận thông báo' },
  { value: 'subscribers', label: 'Email đăng ký nhận tin (footer/banner)' },
  { value: 'specific', label: 'Chọn người dùng cụ thể' },
];

export const CHANNELS = [
  { value: 'web', label: 'Chỉ chuông web' },
  { value: 'email', label: 'Chỉ email' },
  { value: 'zalo', label: 'Chỉ Zalo' },
  { value: 'email_zalo', label: 'Chuông web + Email' },
];

export const CHANNEL_LABEL = { web: 'Chuông web', email: 'Email', zalo: 'Zalo', email_zalo: 'Chuông web + Email' };

export function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function plainTextToHtml(text) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br/>')}</p>`).join('');
}
