import {
  UserPlus, Share2, Link2, HandCoins, Wallet,
  Bell, BarChart3 as BarChartIcon, Trophy, MessageSquareText, TrendingUp, Download, Flame, Mail, FileWarning, Users, QrCode
} from 'lucide-react';

export const STATS = [
  { icon: UserPlus, value: 50, suffix: '+', label: 'CTV đang hoạt động' },
  { icon: Wallet, value: 100, suffix: 'tr+', label: 'Đã chi trả hoa hồng' },
  { icon: HandCoins, value: 10, suffix: '%', label: 'Hoa hồng mặc định' },
];

export const STEP_ICONS = [UserPlus, Share2, Link2, HandCoins];

export const PROCESS_STEPS = [
  { n: 1, title: 'Đăng ký làm CTV', desc: 'Đăng nhập tài khoản, xác thực email, nhập số tài khoản ngân hàng nhận tiền. Kích hoạt ngay, không cần chờ admin duyệt.' },
  { n: 2, title: 'Chia sẻ link giới thiệu', desc: 'Mỗi CTV có 1 mã/link riêng. Gửi link cho khách qua Zalo, Facebook, tin nhắn… — khách bấm vào là hệ thống tự nhớ bạn là người giới thiệu.' },
  { n: 3, title: 'Khách đặt cọc / mua biển', desc: 'Khi khách qua link của bạn để lại yêu cầu đặt cọc hoặc mua biển, hệ thống tự tính hoa hồng theo % trên số tiền đặt cọc — không cần bạn thao tác gì thêm.' },
  { n: 4, title: 'Nhận hoa hồng', desc: 'Hoa hồng ở trạng thái "Chờ duyệt" cho tới khi admin xác nhận giao dịch và chuyển khoản vào đúng số tài khoản bạn đăng ký — khi đó chuyển sang "Đã thanh toán".' },
];

export const CTV_TOOLS_FEATURED = [
  { icon: Bell, title: 'Thông báo ngay khi có khách đặt cọc', desc: 'Không cần tự vào dashboard kiểm tra — hệ thống báo ngay khi có khách đặt cọc/mua qua link của bạn.', badge: 'Mới' },
  { icon: BarChartIcon, title: 'Biểu đồ hoa hồng theo tháng', desc: 'Theo dõi trực quan hoa hồng chờ duyệt/đã duyệt/đã trả, lọc theo 3/6/12 tháng gần nhất.', badge: 'Mới' },
  { icon: Trophy, title: 'Bảng xếp hạng CTV', desc: 'So sánh số giao dịch thành công trong tháng với CTV khác — tùy chọn ẩn danh, không lộ số tiền.', badge: 'Mới' },
];

export const CTV_TOOLS_REST = [
  { icon: Link2, title: 'Link/QR riêng theo từng biển' },
  { icon: MessageSquareText, title: 'Mẫu tin nhắn mời khách soạn sẵn' },
  { icon: TrendingUp, title: 'Lịch sử click chi tiết' },
  { icon: Download, title: 'Xuất CSV lịch sử hoa hồng' },
  { icon: Flame, title: 'Gợi ý biển đang được quan tâm' },
  { icon: Mail, title: 'Liên kết Gmail cá nhân' },
  { icon: FileWarning, title: 'Báo cáo giao dịch ngoài nền tảng' },
  { icon: Users, title: 'Danh sách khách đã giới thiệu' },
  { icon: QrCode, title: 'QR chuyển khoản tự sinh' },
];

export const CTV_TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'commission', label: 'Hoa hồng' },
  { key: 'referral', label: 'Mã giới thiệu' },
  { key: 'messages', label: 'Tin nhắn' },
];

export const CLICK_SOURCE_LABEL = { zalo: 'Zalo', facebook: 'Facebook', other: 'Khác/Trực tiếp' };

export const CLICK_RANGE_OPTS = [
  { value: 7, label: '7 ngày' },
  { value: 30, label: '30 ngày' },
  { value: 90, label: '90 ngày' },
];
