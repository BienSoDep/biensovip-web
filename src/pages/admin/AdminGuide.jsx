import { useState, useMemo } from 'react';
import {
  Info,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  BookOpen,
  Car,
  Layers,
  FolderTree,
  Ticket,
  Users,
  Flame,
  FileText,
  Video,
  Compass,
  ShieldCheck,
  Bell,
  Star,
  Bot,
  Handshake,
  Palette,
  MessageSquareQuote,
  Shield,
  History,
  Sliders,
  Wrench,
  LineChart,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  LayoutGrid,
  List,
  Maximize2,
} from 'lucide-react';
import Modal from '../../components/Modal.jsx';
import { ADMIN_NAV } from '../../common/constants.js';

// Bản đồ Icon tương ứng từng màn hình
const ICON_MAP = {
  dash: LayoutDashboard,
  aguide: BookOpen,
  aplates: Car,
  asales: Layers,
  acats: FolderTree,
  acoupons: Ticket,
  acustomers: Users,
  ainterestleads: Flame,
  aposts: FileText,
  avideos: Video,
  ameanings: Compass,
  apolicypages: ShieldCheck,
  anotifications: Bell,
  areviews: Star,
  achatbot: Bot,
  acollabs: Handshake,
  acollabcontent: Palette,
  actvtemplates: MessageSquareQuote,
  astaff: Shield,
  aauditlog: History,
  ashowroom: Sliders,
  afeatureflags: Wrench,
  ainsights: LineChart,
  avpamarket: TrendingUp,
};

// Dữ liệu cẩm nang vận hành chi tiết, chuẩn xác 100% với tính năng thực tế trong ứng dụng
const GUIDE_DETAILS = {
  dash: {
    summary: 'Trung tâm chỉ huy & giám sát: Doanh thu tiềm năng, tỷ lệ chuyển đổi, ma trận phân bổ kho biển 6 chiều và widget giám sát sức khỏe hạ tầng thời gian thực.',
    badge: 'Giám sát điều hành',
    badgeType: 'brand',
    tabs: ['Executive Summary', 'Ma trận 6 chiều', 'Cung - Cầu', 'Giám sát sức khỏe hạ tầng'],
    workflow: [
      'Bắt đầu ca làm việc: Kiểm tra banner tóm tắt điều hành để nắm số lượng lead mới, doanh thu cọc phát sinh trong 24h qua.',
      'Phân tích ma trận 6 chiều để nhận diện loại xe, tỉnh thành và phân khúc giá nào đang có tỷ lệ tương tác cao nhất.',
      'Kiểm tra widget "Sức khỏe hệ thống": Theo dõi Ping Database thời gian thực (ms), RAM/Uptime server, Cloudinary CDN và trạng thái Background Worker.',
      'Bấm nút "Test email" trên widget sức khỏe để kiểm tra đường truyền SMTP khi nghi ngờ khách không nhận được email thông báo.',
    ],
    tips: 'Nên kiểm tra độ trễ Database Ping đầu ca. Nếu độ trễ vượt quá 100ms hoặc có Background Job bị lỗi, hãy báo ngay cho kỹ thuật.',
    perm: 'Mọi vai trò (Staff & SuperAdmin)',
  },
  aguide: {
    summary: 'Cẩm nang hướng dẫn sử dụng toàn diện hệ thống: Tra cứu nhanh quy trình thao tác, mẹo xử lý và quyền hạn của từng module.',
    badge: 'Cẩm nang quản trị',
    badgeType: 'neutral',
    tabs: ['Tra cứu theo từ khóa', 'Bộ lọc nhóm nghiệp vụ', 'Chi tiết quy trình'],
    workflow: [
      'Nhập từ khóa nghiệp vụ vào ô tìm kiếm (ví dụ: "nhập hàng loạt", "kanban", "hoa hồng", "live preview", "ping").',
      'Lọc theo nhóm nghiệp vụ ở thanh công cụ phía trên để xem các tính năng liên quan.',
      'Bấm "Xem chi tiết hướng dẫn" ở từng thẻ để đọc quy trình thao tác chuẩn, mẹo làm việc và quyền hạn.',
      'Bấm "Mở trang này →" để chuyển thẳng đến màn hình làm việc tương ứng.',
    ],
    tips: 'Trang hướng dẫn tự động ẩn các tính năng mà tài khoản của bạn chưa được phân quyền. Bạn chỉ thấy những gì mình được phép thao tác.',
    perm: 'Mọi vai trò',
  },
  aplates: {
    summary: 'Quản lý toàn bộ kho biển số với các công cụ tự động hóa cao cấp: Thêm nhanh, nhập hàng loạt (CSV/AI Prompt), sinh ảnh mô phỏng 3D, tự sinh thông tin phong thủy và bộ lọc phát hiện lỗi dữ liệu.',
    badge: 'Kho hàng cốt lõi',
    badgeType: 'brand',
    tabs: ['Thêm nhanh', 'Nhập hàng loạt', 'Sinh ảnh tự động', 'Tự sinh thông tin', 'Phát hiện lỗi'],
    workflow: [
      'Thêm nhanh 1 biển: Nhập biển số, giá bán, giá nhập, loại xe ngay trên thanh Quick Add Bar đầu bảng rồi nhấn Enter.',
      'Thêm hàng loạt: Bấm "Nhập hàng loạt" → Dán danh sách biển (hoặc tải CSV). Có thể dùng AI Prompt Generator để sinh danh sách theo định dạng chuẩn.',
      'Chuẩn hóa thông tin: Bấm "Sinh thông tin hàng loạt" để hệ thống tự nhận diện Loại biển, Tỉnh thành, Loại xe, Điểm nút phong thủy cho các biển còn trống.',
      'Sinh ảnh mô phỏng: Bấm "Sinh ảnh tự động" để hệ thống render ảnh biển xe 3D chuẩn kích thước đăng tải lên web và mạng xã hội.',
      'Kiểm tra lỗi dữ liệu: Bấm bộ lọc "Phát hiện lỗi" để rà soát các biển thiếu giá, thiếu ảnh, thiếu tỉnh thành hoặc sai cấu trúc.',
    ],
    tips: 'Mỗi khi điều chỉnh giá bán, hệ thống tự động lưu vào Lịch sử giá. Nhân viên không có quyền plates:cost_price sẽ tự động bị ẩn cột giá vốn để bảo mật.',
    perm: 'plates:view, plates:create, plates:edit, plates:delete',
  },
  asales: {
    summary: 'Hợp nhất toàn bộ luồng bán hàng trong một trang duy nhất với 3 chế độ xem linh hoạt (Kanban quy trình, Danh sách chi tiết, Giao dịch & Cọc), đồng bộ tức thì không cần tải lại trang.',
    badge: 'Gộp 3 chế độ xem',
    badgeType: 'accent',
    tabs: ['Quy trình (Kanban)', 'Danh sách liên hệ', 'Lịch sử giao dịch & Cọc'],
    workflow: [
      'Xem Quy trình (Kanban): Kéo thả thẻ khách hàng giữa các cột (Mới → Đang tư vấn → Đã chốt → Thất bại) để cập nhật tiến độ.',
      'Xem Danh sách: Tìm kiếm theo tên/SĐT khách, lọc theo trạng thái, gán nhân viên phụ trách tư vấn, và thêm ghi chú chăm sóc nội bộ.',
      'Xem Giao dịch: Theo dõi các giao dịch mua/đặt cọc. Bấm "Xác nhận đã nhận tiền" khi khách đã chuyển khoản → Hoa hồng CTV liên quan sẽ tự động chuyển sang trạng thái "Chờ duyệt".',
    ],
    tips: 'Bấm vào thẻ khách hàng trên bảng Kanban sẽ tự động chuyển sang chế độ Danh sách kèm lọc đúng tên khách để bạn xem lịch sử ghi chú chi tiết.',
    perm: 'contacts:view, contacts:edit, transactions:view, transactions:confirm',
  },
  acats: {
    summary: 'Quản lý 4 nhóm danh mục nền tảng: Loại biển (Ngũ quý, Lộc phát...), Tỉnh/Thành phố, Loại xe (Ô tô, Xe máy), và Khoảng giá. Hỗ trợ kéo thả đổi thứ tự hiển thị trang chủ.',
    badge: 'Cấu hình bộ lọc',
    badgeType: 'neutral',
    tabs: ['Loại biển', 'Tỉnh thành', 'Loại xe', 'Khoảng giá'],
    workflow: [
      'Chọn nhóm danh mục cần cấu hình từ các tab bên trong.',
      'Kéo thả biểu tượng 6 chấm (grip) để thay đổi thứ tự xuất hiện của danh mục ngoài bộ lọc người dùng.',
      'Gắn cờ HOT hoặc Nổi bật cho các danh mục đang được người dùng săn đón nhiều nhất.',
    ],
    tips: 'Mỗi tỉnh thành đều được ánh xạ với danh sách đầu số xe (ví dụ: Hà Nội = 29, 30, 31, 32, 33, 40). Đảm bảo giữ đúng mã đầu số để bộ lọc tự động nhận diện chính xác.',
    perm: 'categories:view, categories:edit',
  },
  acoupons: {
    summary: 'Tạo và quản lý các chiến dịch mã giảm giá khuyến mãi (giảm theo % hoặc số tiền cụ thể), thiết lập giới hạn lượt dùng và thời gian áp dụng.',
    badge: 'Khuyến mãi & Ưu đãi',
    badgeType: 'neutral',
    tabs: ['Danh sách coupon', 'Tạo mã mới', 'Giới hạn & Hiệu lực'],
    workflow: [
      'Bấm "Tạo mã giảm giá mới" → Điền mã code (viết hoa không dấu), loại giảm (% hoặc VNĐ), giá trị giảm.',
      'Cấu hình số lần dùng tối đa và khoảng thời gian có hiệu lực.',
      'Khách hàng sẽ áp dụng mã này ở bước gửi yêu cầu tư vấn hoặc đặt cọc giữ biển.',
    ],
    tips: 'Không nên xóa mã giảm giá đã từng có người sử dụng để tránh đứt gãy lịch sử đối soát giao dịch; chỉ cần bấm Tắt trạng thái kích hoạt.',
    perm: 'plates:view',
  },
  acustomers: {
    summary: 'Quản lý danh sách tài khoản khách hàng đã đăng ký. Tra cứu lịch sử mua bán, danh sách biển thả tim yêu thích và thông tin liên hệ.',
    badge: 'Hồ sơ người dùng',
    badgeType: 'neutral',
    tabs: ['Danh sách khách', 'Lịch sử mua hàng', 'Biển yêu thích', 'Lịch sử tương tác'],
    workflow: [
      'Tìm kiếm khách hàng theo Họ tên, Số điện thoại hoặc Email.',
      'Xem chi tiết hồ sơ: Các biển số khách đã bấm yêu thích (thả tim), các yêu cầu tư vấn đã gửi và lịch sử giao dịch đã thành công.',
      'Hỗ trợ khóa tạm thời tài khoản có hành vi spam hoặc quấy rối.',
    ],
    tips: 'Theo dõi danh sách biển yêu thích của khách giúp nhân viên tư vấn dễ dàng gợi ý các biển có cùng đuôi số hoặc cùng tầm giá khi gọi điện.',
    perm: 'customers:view, customers:edit',
  },
  ainterestleads: {
    summary: 'Radar phát hiện khách tiềm năng cao: Tự động gom các khách hàng xem nhiều lần 1 biển hoặc thả tim nhưng chưa để lại thông tin liên hệ.',
    badge: 'Khách tiềm năng cao',
    badgeType: 'brand',
    tabs: ['Khách quan tâm nóng', 'Hành vi tương tác', 'Chuyển đổi thành Lead'],
    workflow: [
      'Hệ thống tự động ghi nhận các tài khoản có từ 3 lượt xem cùng 1 biển hoặc đã bấm lưu biển vào mục yêu thích.',
      'Nhân viên xem danh sách các biển khách đang quan tâm và mức độ nóng (dựa trên tần suất truy cập gần nhất).',
      'Bấm "Nhận tư vấn" để chuyển khách thành liên hệ mới trong quy trình bán hàng và chủ động liên lạc.',
    ],
    tips: 'Thời gian vàng để liên hệ khách quan tâm là trong vòng 2 giờ kể từ khi hệ thống ghi nhận lượt thả tim hoặc lượt xem lặp lại.',
    perm: 'interest-leads:view',
  },
  aposts: {
    summary: 'Trung tâm nội dung SEO Marketing: Quản lý bài viết blog chuẩn SEO và kiểm duyệt bình luận độc giả trước khi hiển thị công khai.',
    badge: 'Gộp 2 tab',
    badgeType: 'accent',
    tabs: ['Bài viết blog', 'Bình luận độc giả'],
    workflow: [
      'Tab Bài viết: Bấm "Đăng bài mới" → Soạn nội dung với trình soạn thảo WYSIWYG, tải ảnh bìa, điền Meta Title/Description và gắn thẻ chuyên mục.',
      'Tab Bình luận: Duyệt hoặc từ chối các bình luận của độc giả gửi vào bài viết nhằm ngăn chặn spam link và nội dung độc hại.',
    ],
    tips: 'Sử dụng các bài viết chuyên sâu về phong thủy số xe và phân tích biển số theo từng tỉnh thành để kéo traffic tự nhiên từ Google.',
    perm: 'posts:view, posts:create, posts:edit',
  },
  avideos: {
    summary: 'Quản lý video ngắn giới thiệu biển số đẹp từ TikTok, YouTube Shorts, Facebook Reels hiển thị nổi bật trên trang chủ và trang chi tiết biển.',
    badge: 'Truyền thông Video',
    badgeType: 'neutral',
    tabs: ['Danh sách video', 'Thêm video qua link', 'Gắn với biển số'],
    workflow: [
      'Bấm "Thêm video" → Dán đường link video từ TikTok hoặc YouTube Shorts.',
      'Hệ thống tự động nhận diện nền tảng, bóc tách ID video và tự lấy ảnh đại diện (thumbnail).',
      'Nhập mã biển số tương ứng để video hiển thị trực tiếp trong trang chi tiết của biển số đó.',
    ],
    tips: 'Video ngắn quay thực tế biển số lắp trên xe thật luôn có tỷ lệ chuyển đổi chốt cọc cao gấp 3 lần so với chỉ xem ảnh tĩnh.',
    perm: 'videos:view, videos:create',
  },
  ameanings: {
    summary: 'Từ điển phong thủy số học: Quản lý mẫu ý nghĩa chung theo cặp số (00-99, thần tài, lộc phát...) và ý nghĩa riêng gán cho từng biển số cụ thể.',
    badge: 'Phong thủy số học',
    badgeType: 'neutral',
    tabs: ['Ý nghĩa cặp số chung', 'Ý nghĩa riêng từng biển'],
    workflow: [
      'Định nghĩa ý nghĩa cho các con số phong thủy quen thuộc: 68 (Lộc Phát), 79 (Thần Tài), 39 (Tiểu Thần Tài), ngũ hành tương sinh.',
      'Gán ý nghĩa phong thủy tùy biến cho các biển VIP đặc biệt để tăng giá trị cảm xúc khi khách đọc chi tiết biển.',
    ],
    tips: 'Khi tạo biển mới, nếu bạn không điền ý nghĩa riêng, hệ thống sẽ tự động ghép ý nghĩa phong thủy từ từ điển chung dựa trên đuôi số của biển.',
    perm: 'meanings:view, meanings:edit',
  },
  apolicypages: {
    summary: 'Chỉnh sửa nội dung 4 trang thông tin pháp lý ở chân trang: Điều khoản sử dụng, Chính sách bảo mật, Hướng dẫn sang tên đổi chủ, và Câu hỏi thường gặp (FAQ).',
    badge: 'Trang tĩnh pháp lý',
    badgeType: 'neutral',
    tabs: ['Điều khoản', 'Bảo mật', 'Sang tên đổi chủ', 'Hỏi đáp (FAQ)'],
    workflow: [
      'Chọn trang chính sách cần chỉnh sửa trong danh sách.',
      'Chỉnh sửa trực tiếp Tiêu đề, Phụ đề và Ngày cập nhật.',
      'Chỉnh sửa nội dung chi tiết theo cấu trúc phân đoạn trực quan hoặc kiểm tra mã JSON cấu trúc.',
    ],
    tips: 'Trang Hướng dẫn sang tên đổi chủ xe là trang được khách mua biển đấu giá tra cứu nhiều nhất. Hãy luôn cập nhật quy định thông tư mới của Bộ Công An.',
    perm: 'policy_pages:view, policy_pages:edit',
  },
  anotifications: {
    summary: 'Trung tâm kết nối & Email Marketing: Gửi thông báo tức thì (chuông web, email), quản lý email đăng ký nhận tin và dựng mẫu email tự động dạng kéo thả.',
    badge: 'Gộp 2 tab',
    badgeType: 'accent',
    tabs: ['Gửi thông báo & Sự kiện', 'Mẫu email (Email Builder)'],
    workflow: [
      'Tab Gửi thông báo: Soạn tin nhắn gửi chuông web hoặc gửi email marketing đến toàn bộ khách hoặc nhóm khách chọn lọc.',
      'Cấu hình quy tắc gửi tự động theo sự kiện: Khi có biển số mới, khi cọc thành công, khi tài khoản được kích hoạt.',
      'Tab Mẫu email: Dùng trình dựng Email Builder kéo-thả các khối (Header, Banner, Text, Button, Footer) và chèn biến tự động như {customerName}, {plateNumber}.',
    ],
    tips: 'Nên kiểm tra gửi thử nghiệm (Send Test) về email cá nhân của bạn trước khi bấm gửi hàng loạt cho hàng ngàn khách hàng.',
    perm: 'notifications:view, notifications:send, email_templates:view',
  },
  areviews: {
    summary: 'Quản lý uy tín thương hiệu: Duyệt đánh giá số sao và nhận xét từ khách hàng trước khi hiển thị công khai; phản hồi giải đáp thắc mắc của khách.',
    badge: 'Duyệt đánh giá',
    badgeType: 'neutral',
    tabs: ['Chờ duyệt', 'Đã duyệt', 'Phản hồi đánh giá'],
    workflow: [
      'Xem danh sách đánh giá mới do khách hàng gửi về dịch vụ hoặc chất lượng biển số.',
      'Kiểm tra nội dung: Bấm "Duyệt" để đưa lên web hoặc "Từ chối" nếu vi phạm tiêu chuẩn cộng đồng.',
      'Viết câu trả lời chính thức của Admin bên dưới đánh giá để thể hiện sự chăm sóc khách chu đáo.',
    ],
    tips: 'Những đánh giá 5 sao kèm ảnh chụp bàn giao biển số thực tế là bằng chứng xã hội mạnh nhất giúp tăng tỷ lệ chuyển đổi.',
    perm: 'reviews:view, reviews:approve',
  },
  achatbot: {
    summary: 'Trợ lý tư vấn AI: Xem lại lịch sử trò chuyện trực tuyến giữa khách và bot, tinh chỉnh kịch bản trả lời tự động và cấu hình đường dây nóng hỗ trợ.',
    badge: 'Trợ lý AI 24/7',
    badgeType: 'neutral',
    tabs: ['Lịch sử hội thoại', 'Cấu hình prompt AI', 'Quy tắc trả lời'],
    workflow: [
      'Xem lại các đoạn chat của khách để biết nhu cầu tìm kiếm phổ biến và những câu hỏi bot chưa giải đáp thỏa đáng.',
      'Cập nhật Prompt hệ thống để AI tư vấn chuẩn xác hơn về phong thủy số và gợi ý đúng các biển đang còn hàng.',
      'Cấu hình số điện thoại Hotline và Zalo để bot tự động gợi ý cho khách khi gặp tình huống phức tạp.',
    ],
    tips: 'Đọc kỹ lịch sử chat sẽ giúp phát hiện các dòng biển số đang có nhu cầu cao nhưng kho hàng chưa đáp ứng được.',
    perm: 'chatbot:view, chatbot:edit',
  },
  acollabs: {
    summary: 'Quản lý mạng lưới Cộng tác viên (CTV): Theo dõi lượt giới thiệu theo ref link, quản lý hệ số hoa hồng (mặc định 10%), duyệt và thanh toán chi trả hoa hồng.',
    badge: 'Mạng lưới CTV',
    badgeType: 'neutral',
    tabs: ['Danh sách CTV', 'Hoa hồng chờ duyệt', 'Lịch sử thanh toán'],
    workflow: [
      'CTV đăng ký qua trang landing page và được kích hoạt tài khoản tự động nhận mã giới thiệu riêng.',
      'Khi khách mua hàng qua link giới thiệu và thanh toán thành công, hệ thống tự động ghi nhận hoa hồng ở trạng thái "Chờ duyệt".',
      'Sau khi kế toán hoàn tất chuyển khoản tiền hoa hồng cho CTV, bấm "Xác nhận chi trả" để hoàn tất giao dịch.',
    ],
    tips: 'Có thể điều chỉnh hệ số hoa hồng riêng cho từng CTV xuất sắc (cột Hệ số) để khuyến khích bán hàng.',
    perm: 'collaborators:view, collaborators:edit',
  },
  acollabcontent: {
    summary: 'Trình biên tập trang chính sách CTV với Live Preview 2 chiều: Chỉnh sửa trực tiếp trên giao diện mô phỏng hoặc sửa mã HTML, giả lập Desktop & Mobile, và công cụ test hoa hồng.',
    badge: 'Live Preview 2 chiều',
    badgeType: 'brand',
    tabs: ['Soạn thảo nội dung', 'Live Preview 2 chiều', 'Giả lập Desktop/Mobile', 'Test tính hoa hồng'],
    workflow: [
      'Mở màn hình biên tập: Giao diện chia 2 cột gồm Cột mã nguồn/Form nội dung và Cột xem trước trực tiếp.',
      'Live Preview 2 chiều: Bấm trực tiếp vào các đoạn văn, tiêu đề trên màn hình xem trước để gõ sửa nội dung, hoặc sửa mã HTML bên trái thì màn hình xem trước cập nhật ngay tức thì.',
      'Chuyển đổi chế độ xem giữa Desktop toàn màn hình và Mobile (390px) để kiểm tra giao diện trên điện thoại.',
      'Dùng công cụ mô phỏng tính hoa hồng để thử nghiệm các mức giá biển và tỷ lệ chia sẻ trước khi công bố.',
    ],
    tips: 'Trước khi bấm "Xuất bản", hãy luôn kiểm tra chế độ xem Mobile 390px để đảm bảo các khối nội dung và bảng hoa hồng không bị vỡ giao diện trên smartphone.',
    perm: 'collaborators:view, collaborators:edit',
  },
  actvtemplates: {
    summary: 'Kho mẫu tin nhắn soạn sẵn cho CTV: Tạo các mẫu chào hàng, báo giá biển số kèm biến động ({plateNumber}, {referralUrl}) để CTV copy 1 chạm gửi khách.',
    badge: 'Kịch bản bán hàng',
    badgeType: 'neutral',
    tabs: ['Mẫu tin nhắn', 'Tạo kịch bản mới', 'Biến thay thế động'],
    workflow: [
      'Tạo kịch bản tin nhắn cho các tình huống: Chào biển mới về, Chúc mừng sinh nhật/hợp tuổi, Báo giá giảm sốc.',
      'Sử dụng các thẻ biến động như {plateNumber}, {price}, {referralUrl} để hệ thống tự điền dữ liệu thực tế khi CTV bấm nút Copy.',
      'CTV chỉ cần vào trang cá nhân, bấm "Copy tin nhắn" là có ngay nội dung hoàn chỉnh kèm link giới thiệu của mình để gửi Zalo.',
    ],
    tips: 'Viết nội dung ngắn gọn, súc tích và có kèm lời kêu gọi hành động (Call To Action) rõ ràng để tăng tỷ lệ khách bấm vào link.',
    perm: 'ctv_message_templates:view, ctv_message_templates:edit',
  },
  astaff: {
    summary: 'Quản trị nhân sự & Phân quyền RBAC (Chỉ dành cho SuperAdmin): Tạo tài khoản nhân viên, cấp quyền chi tiết theo từng nghiệp vụ, khóa tài khoản hoặc hỗ trợ đặt lại mật khẩu.',
    badge: 'Chỉ SuperAdmin',
    badgeType: 'danger',
    tabs: ['Danh sách nhân viên', 'Phân quyền chi tiết (RBAC)', 'Bảo mật & Đổi mật khẩu'],
    workflow: [
      'Tạo tài khoản nhân viên mới với email công việc.',
      'Tích chọn các quyền hạn cụ thể phù hợp với vị trí công việc: Quản lý biển số, Tư vấn bán hàng, Biên tập blog, Duyệt đánh giá...',
      'Khi nhân viên nghỉ việc hoặc có sự cố, SuperAdmin có thể khóa ngay tài khoản chỉ với 1 click hoặc đổi lại mật khẩu.',
    ],
    tips: 'Tuân thủ nguyên tắc quyền tối thiểu (Least Privilege) — chỉ cấp đúng các quyền mà nhân sự đó cần thực hiện hàng ngày.',
    perm: 'Chỉ SuperAdmin (Role: super-admin)',
  },
  aauditlog: {
    summary: 'Trung tâm giám sát bảo mật & Lịch sử hệ thống: Truy vết mọi thay đổi dữ liệu của nhân viên, nhật ký lỗi máy chủ (Error Logs) và cảnh báo rủi ro CTV.',
    badge: 'Gộp 3 tab',
    badgeType: 'accent',
    tabs: ['Hệ thống (Audit Logs)', 'Lỗi (Error Logs)', 'Rủi ro CTV (Chỉ SuperAdmin)'],
    workflow: [
      'Tab Hệ thống: Tra cứu lịch sử chỉnh sửa dữ liệu (ai đã sửa giá biển số, ai đã đổi trạng thái liên hệ, lúc mấy giờ, giá trị cũ và mới).',
      'Tab Lỗi: Xem nhanh nhật ký lỗi 500 và Exception từ Serilog mà không cần SSH truy cập máy chủ VPS.',
      'Tab Rủi ro CTV: Thuật toán tự động quét và cảnh báo các hành vi nghi vấn gian lận ref link hoặc spam hoa hồng.',
    ],
    tips: 'Khi có tranh chấp hoặc nhầm lẫn về giá bán biển số, hãy vào tab Hệ thống lọc theo mã biển số để xem ai là người đã cập nhật giá cuối cùng.',
    perm: 'audit_logs:view, error_logs:view, SuperAdmin cho tab Rủi ro CTV',
  },
  ashowroom: {
    summary: 'Cấu hình hiển thị trang public: Tùy chỉnh các con số uy tín ảo (Vanity Metrics) và độ ưu tiên sắp xếp danh sách biển số ngoài trang người dùng.',
    badge: 'Gộp 2 tab',
    badgeType: 'accent',
    tabs: ['Số liệu uy tín (Vanity Metrics)', 'Thứ tự sắp xếp danh sách'],
    workflow: [
      'Tab Số liệu: Cấu hình các con số hiển thị ngoài trang chủ (số biển đã bán, số khách hàng hài lòng, số tỉnh thành phủ sóng) để tăng sự tin tưởng của người mua.',
      'Tab Thứ tự sắp xếp: Kéo thả để sắp xếp độ ưu tiên mặc định khi hiển thị danh sách biển (Tỉnh thành ưu tiên, Biển VIP hot, Ngày đăng mới nhất, Loại biển).',
    ],
    tips: 'Thứ tự sắp xếp mặc định chỉ áp dụng khi khách hàng mới vào trang và chưa tự bấm chọn tiêu chí sắp xếp riêng.',
    perm: 'vanity_metrics:view, settings:view',
  },
  afeatureflags: {
    summary: 'Bộ công cụ vận hành kỹ thuật (SuperAdmin): Bật/tắt tính năng theo cờ (Feature Flags), chế độ bảo trì hệ thống kèm thông báo đếm ngược, và DB Console tra cứu an toàn.',
    badge: 'Gộp 3 tab',
    badgeType: 'danger',
    tabs: ['Feature Flags', 'Chế độ bảo trì', 'DB Console'],
    workflow: [
      'Tab Feature Flags: Bật hoặc tắt nhanh các tính năng thử nghiệm mà không cần phải triển khai lại code máy chủ.',
      'Tab Bảo trì: Bật bảo trì toàn trang hoặc bảo trì từng trang cụ thể; cài đặt thời gian bắt đầu/kết thúc dự kiến và lời nhắn cho khách. Tài khoản Admin vẫn truy cập bình thường.',
      'Tab DB Console: Tra cứu nhanh dữ liệu của 7 bảng cơ sở dữ liệu chính qua giao diện lọc có sẵn mà không cần mở phần mềm quản lý DB ngoài.',
    ],
    tips: 'Chế độ bảo trì cho phép Admin và nhân viên đã đăng nhập tiếp tục kiểm thử trang, chỉ người dùng vãng lai mới thấy màn hình bảo trì.',
    perm: 'feature_flags:view, maintenance:view, db_console:view (Chỉ SuperAdmin)',
  },
  ainsights: {
    summary: 'Báo cáo chuyên sâu & Phân tích hành vi khách hàng: Phễu chuyển đổi toàn diện, radar phát hiện điểm nghẽn, đối soát cung - cầu kho biển, tương tác vi mô và danh sách biển số tồn đọng cần kích cầu.',
    badge: 'Báo cáo & Phân tích chuyên sâu',
    badgeType: 'brand',
    tabs: ['Executive Summary', 'Phễu chuyển đổi', 'Radar điểm nghẽn', 'Tương tác vi mô', 'Cán cân Cung - Cầu', 'Biển tồn đọng'],
    workflow: [
      'Chọn khoảng thời gian phân tích (Hôm nay, 7 ngày qua, 14 ngày qua, 30 ngày qua hoặc Tháng này).',
      'Phễu chuyển đổi & Radar điểm nghẽn: Theo dõi tỷ lệ chuyển đổi qua từng bước (Xem biển → Thả tim/Lưu → Gửi tư vấn → Chốt cọc) để phát hiện bước nào đang làm rơi rụng khách nhiều nhất.',
      'Cán cân Cung - Cầu: So sánh nhu cầu tìm kiếm của khách với lượng biển thực tế trong kho theo phân khúc giá và khu vực để lên kế hoạch thu mua biển mới.',
      'Biển tồn đọng (Stalled Plates): Xem danh sách các biển lưu kho lâu ngày ít tương tác để quyết định giảm giá, chạy mã giảm giá hoặc đẩy bài truyền thông.',
      'Tương tác vi mô: Đo lường hành vi sao chép số biển, bấm gọi điện hotline, bấm chat Zalo để đánh giá độ nóng của từng biển.',
    ],
    tips: 'Kết hợp báo cáo Cung - Cầu với danh sách Biển tồn đọng để giải phóng vốn cho các biển chậm luân chuyển và nhập thêm các dòng biển đang cháy hàng.',
    perm: 'analytics:view',
  },
  avpamarket: {
    summary: 'Phân tích thị trường biển đấu giá VPA dựa trên giá trúng đấu giá thật (vpa_auction_results) — không phải giá gợi ý/giá duyệt nội bộ, vốn đã qua công thức × hệ số nên không phản ánh thị trường thô.',
    badge: 'Phân tích dữ liệu VPA',
    badgeType: 'brand',
    tabs: ['So kỳ 7 ngày', 'Xu hướng & trung bình động', 'Dự báo', 'Xếp hạng tăng giá', 'Lời khuyên', 'So giá VPA vs shop'],
    workflow: [
      'So kỳ: xem % tăng/giảm giá trúng trung bình 7 ngày qua so với 7 ngày trước — cần cả hai kỳ có ít nhất vài phiên mới tính % có ý nghĩa.',
      'Xu hướng & trung bình động: đường giá theo tuần (12 tuần gần nhất) kèm đường trung bình động 4 tuần để bớt nhiễu khi đọc hướng đi chung.',
      'Dự báo: ước tính giá tuần tới bằng hồi quy tuyến tính đơn giản — chọn tỉnh/loại biển cụ thể để xem dự báo riêng, hoặc để trống xem toàn thị trường. Luôn xem chỉ số R² và số tuần mẫu: R² thấp hoặc mẫu ít nghĩa là chỉ nên tham khảo, không nên coi là chắc chắn.',
      'Xếp hạng tăng giá: so % tăng/giảm giữa nửa đầu và nửa cuối cửa sổ 12 tuần, xếp theo tỉnh và theo loại biển — chỉ hiện nhóm có đủ mẫu cả hai nửa để tránh kết luận sai do quá ít phiên.',
      'Lời khuyên: vài câu gợi ý sinh tự động từ các số liệu trên (không phải AI) — đọc nhanh thay vì tự ngồi suy ra từ biểu đồ.',
      'So giá VPA vs shop: đối chiếu giá trúng đấu giá VPA với giá niêm yết biển của shop theo cùng tỉnh + loại biển. Hai con số KHÁC BẢN CHẤT (giá trúng thật vs giá rao bán) — chỉ dùng để cảm nhận mặt bằng, không phải so sánh trực tiếp lãi/lỗ.',
    ],
    tips: 'Dự báo và xu hướng chỉ đáng tin khi có đủ tuần dữ liệu (càng nhiều tuần, R² càng đáng tin) — với nhóm nhỏ (tỉnh ít giao dịch, loại biển hiếm), nên xem toàn thị trường thay vì lọc quá hẹp.',
    perm: 'vpa_prices:view',
  },
};

// Huy hiệu màu tương ứng loại badge
const BADGE_STYLES = {
  brand: {
    bg: 'var(--surface-tint-cream, #fff8f0)',
    fg: 'var(--action-primary, #d4650a)',
    border: '1px solid var(--action-primary, #d4650a)',
  },
  accent: {
    bg: 'var(--blue-50, #eff6ff)',
    fg: 'var(--blue-700, #1d4ed8)',
    border: '1px solid var(--blue-200, #bfdbfe)',
  },
  danger: {
    bg: 'var(--status-danger-tint, #fef2f2)',
    fg: 'var(--status-danger-ink, #991b1b)',
    border: '1px solid var(--status-danger, #e5484d)',
  },
  neutral: {
    bg: 'var(--surface-sunken, #f3f4f6)',
    fg: 'var(--text-muted, #64748b)',
    border: '1px solid var(--border-hairline, #e2e8f0)',
  },
};

// ==========================================
// THẺ HIỂN THỊ DẠNG LƯỚI (GRID CARD)
// Thiết kế cố định tỷ lệ, căng tràn 100% chiều cao hàng để mọi thẻ luôn ĐỀU NHAU TĂM TẮP
// ==========================================
function GuideCard({ item, go, isExpanded, onToggleExpand, onOpenDetail }) {
  const [key, title] = item;
  const data = GUIDE_DETAILS[key] || {
    summary: 'Chức năng quản lý thuộc hệ thống.',
    badge: 'Mục chức năng',
    badgeType: 'neutral',
    tabs: [],
    workflow: ['Nhấp vào nút "Mở trang này" để truy cập và thao tác.'],
    tips: 'Liên hệ Quản trị viên nếu cần cấp thêm quyền hạn.',
    perm: 'Quyền truy cập cơ bản',
  };

  const IconComponent = ICON_MAP[key] || Sparkles;
  const badgeStyle = BADGE_STYLES[data.badgeType] || BADGE_STYLES.neutral;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--white)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
        border: '1px solid var(--border-hairline)',
        overflow: 'hidden',
        transition: 'box-shadow 150ms ease, border-color 150ms ease',
      }}
    >
      {/* Khối Header trên: Đặt chiều cao tối thiểu và chia đều để thẳng hàng ngang tuyệt đối */}
      <div
        style={{
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 180,
          gap: 'var(--space-2)',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--surface-tint-cream)',
                  color: 'var(--action-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconComponent size={19} />
              </div>
              <div>
                <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)', lineHeight: 1.25 }}>
                  {title}
                </h3>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Mã: <code>{key}</code>
                </span>
              </div>
            </div>
            {data.badge && (
              <span
                style={{
                  font: 'var(--type-caption)',
                  fontSize: '11px',
                  fontWeight: 'var(--fw-semibold)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  whiteSpace: 'nowrap',
                  background: badgeStyle.bg,
                  color: badgeStyle.fg,
                  border: badgeStyle.border,
                }}
              >
                {data.badge}
              </span>
            )}
          </div>

          {/* Tóm tắt: giới hạn 3 dòng để cân đối lưới */}
          <p
            style={{
              margin: '8px 0 0',
              font: 'var(--type-body-sm)',
              color: 'var(--text-body)',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {data.summary}
          </p>
        </div>

        {/* Tabs / Tính năng con: Cố định vị trí sát đáy Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto', minHeight: 26, alignItems: 'flex-end' }}>
          {data.tabs && data.tabs.slice(0, 3).map((tab, idx) => (
            <span
              key={idx}
              style={{
                font: 'var(--type-caption)',
                fontSize: '11px',
                background: 'var(--surface-sunken)',
                color: 'var(--text-strong)',
                padding: '2px 7px',
                borderRadius: 4,
                border: '1px solid var(--border-hairline)',
                whiteSpace: 'nowrap',
              }}
            >
              {tab}
            </span>
          ))}
          {data.tabs && data.tabs.length > 3 && (
            <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)', padding: '2px 4px' }}>
              +{data.tabs.length - 3} tab
            </span>
          )}
        </div>
      </div>

      {/* Accordion Chi tiết quy trình & Mẹo (khi mở rộng) */}
      {isExpanded && (
        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--surface-sunken)',
            borderTop: '1px solid var(--border-hairline)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: '1 1 auto',
            gap: 'var(--space-3)',
            animation: 'fadeIn 160ms var(--ease-out)',
          }}
        >
          {/* Quy trình thao tác */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} style={{ color: 'var(--status-success-ink, #16a34a)' }} />
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Quy trình thao tác chuẩn
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenDetail}
                title="Mở toàn màn hình"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--action-primary)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Maximize2 size={13} />
              </button>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 1.55 }}>
              {data.workflow.map((step, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Phần chân của expanded section (Lưu ý + Quyền) luôn pinned sát đáy */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {data.tips && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  background: 'var(--surface-tint-cream)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                <AlertTriangle size={15} style={{ color: 'var(--action-primary)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-strong)', lineHeight: 1.45 }}>
                  <strong>Lưu ý:</strong> {data.tips}
                </div>
              </div>
            )}

            {data.perm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Quyền yêu cầu: <strong>{data.perm}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer hành động - luôn dính đáy card, thẳng hàng 100% */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px var(--space-4)',
          background: 'var(--surface-sunken)',
          borderTop: '1px solid var(--border-hairline)',
          marginTop: 'auto',
          minHeight: 46,
        }}
      >
        <button
          type="button"
          onClick={onToggleExpand}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            font: 'var(--type-caption)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--text-muted)',
            padding: '4px 0',
          }}
        >
          {isExpanded ? (
            <>
              Thu gọn <ChevronUp size={14} />
            </>
          ) : (
            <>
              Xem quy trình & mẹo <ChevronDown size={14} />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => go(key)()}
          style={{
            background: 'var(--action-primary)',
            color: 'var(--text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            padding: '5px 13px',
            font: 'var(--type-caption)',
            fontWeight: 'var(--fw-bold)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: 'var(--shadow-inset-hairline)',
          }}
        >
          Mở trang →
        </button>
      </div>
    </div>
  );
}

// ==========================================
// THẺ HIỂN THỊ DẠNG DANH SÁCH (FULL-WIDTH ROW)
// Xếp hàng ngang thanh lịch, không bao giờ lo so le chiều cao!
// ==========================================
function GuideListItem({ item, go, isExpanded, onToggleExpand, onOpenDetail }) {
  const [key, title] = item;
  const data = GUIDE_DETAILS[key] || {
    summary: 'Chức năng quản lý thuộc hệ thống.',
    badge: 'Mục chức năng',
    badgeType: 'neutral',
    tabs: [],
    workflow: ['Nhấp vào nút "Mở trang này" để truy cập và thao tác.'],
    tips: 'Liên hệ Quản trị viên nếu cần cấp thêm quyền hạn.',
    perm: 'Quyền truy cập cơ bản',
  };

  const IconComponent = ICON_MAP[key] || Sparkles;
  const badgeStyle = BADGE_STYLES[data.badgeType] || BADGE_STYLES.neutral;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--white)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)',
        border: '1px solid var(--border-hairline)',
        overflow: 'hidden',
        transition: 'border-color 150ms ease',
      }}
    >
      {/* Row chính */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          gap: 'var(--space-3)',
          cursor: 'pointer',
        }}
        onClick={onToggleExpand}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 260, flex: '1 1 340px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--surface-tint-cream)',
              color: 'var(--action-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconComponent size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                {title}
              </span>
              <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)' }}>
                ({key})
              </span>
              {data.badge && (
                <span
                  style={{
                    font: 'var(--type-caption)',
                    fontSize: '10px',
                    fontWeight: 'var(--fw-semibold)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-pill)',
                    whiteSpace: 'nowrap',
                    background: badgeStyle.bg,
                    color: badgeStyle.fg,
                    border: badgeStyle.border,
                  }}
                >
                  {data.badge}
                </span>
              )}
            </div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', lineHeight: 1.35, marginTop: 2 }}>
              {data.summary}
            </div>
          </div>
        </div>

        {/* Nút hành động bên phải */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onToggleExpand}
            style={{
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-pill)',
              padding: '5px 12px',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-medium)',
              color: 'var(--text-strong)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            {isExpanded ? 'Thu gọn' : 'Xem quy trình'} {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <button
            type="button"
            onClick={() => go(key)()}
            style={{
              background: 'var(--action-primary)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '5px 13px',
              font: 'var(--type-caption)',
              fontWeight: 'var(--fw-bold)',
              cursor: 'pointer',
            }}
          >
            Mở trang →
          </button>
        </div>
      </div>

      {/* Expanded panel 2 cột full width */}
      {isExpanded && (
        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--surface-sunken)',
            borderTop: '1px solid var(--border-hairline)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
            animation: 'fadeIn 160ms var(--ease-out)',
          }}
        >
          {/* Cột 1: Quy trình chuẩn */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <CheckCircle2 size={16} style={{ color: 'var(--status-success-ink, #16a34a)' }} />
              <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quy trình thao tác chuẩn
              </span>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 1.6 }}>
              {data.workflow.map((step, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Cột 2: Tabs + Lưu ý + Quyền */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {data.tabs && data.tabs.length > 0 && (
              <div>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Các tab / tính năng cốt lõi:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {data.tabs.map((tab, idx) => (
                    <span
                      key={idx}
                      style={{
                        font: 'var(--type-caption)',
                        fontSize: '11px',
                        background: 'var(--white)',
                        color: 'var(--text-strong)',
                        padding: '3px 8px',
                        borderRadius: 4,
                        border: '1px solid var(--border-hairline)',
                      }}
                    >
                      {tab}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.tips && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  background: 'var(--surface-tint-cream)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                <AlertTriangle size={16} style={{ color: 'var(--action-primary)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-strong)', lineHeight: 1.45 }}>
                  <strong>Lưu ý:</strong> {data.tips}
                </div>
              </div>
            )}

            {data.perm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
                <Lock size={13} style={{ color: 'var(--text-muted)' }} />
                <span style={{ font: 'var(--type-caption)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Quyền yêu cầu: <strong>{data.perm}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function AdminGuide({ isSuperAdmin, canSee, go }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [detailModalKey, setDetailModalKey] = useState(null);

  // Lọc sections theo quyền hạn thực tế
  const rawSections = useMemo(() => {
    return ADMIN_NAV.map(({ group, items }) => ({
      title: group || 'Bắt đầu',
      groupKey: group || 'START',
      items: items.filter(([key]) => canSee(key)),
    })).filter((sec) => sec.items.length > 0);
  }, [canSee]);

  // Tổng số mục được phép xem
  const totalAllowedItems = useMemo(() => {
    return rawSections.reduce((acc, sec) => acc + sec.items.length, 0);
  }, [rawSections]);

  // Bộ lọc danh mục và từ khóa tìm kiếm
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return rawSections
      .map((section) => {
        if (activeGroup !== 'ALL' && section.groupKey !== activeGroup) {
          return null;
        }

        const filteredItems = section.items.filter(([key, title]) => {
          if (!q) return true;
          const data = GUIDE_DETAILS[key];
          const matchTitle = title.toLowerCase().includes(q);
          const matchKey = key.toLowerCase().includes(q);
          const matchSummary = data?.summary?.toLowerCase().includes(q);
          const matchBadge = data?.badge?.toLowerCase().includes(q);
          const matchTabs = data?.tabs?.some((t) => t.toLowerCase().includes(q));
          const matchTips = data?.tips?.toLowerCase().includes(q);
          const matchWorkflow = data?.workflow?.some((w) => w.toLowerCase().includes(q));

          return matchTitle || matchKey || matchSummary || matchBadge || matchTabs || matchTips || matchWorkflow;
        });

        if (filteredItems.length === 0) return null;
        return {
          ...section,
          items: filteredItems,
        };
      })
      .filter(Boolean);
  }, [rawSections, searchQuery, activeGroup]);

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const allKeys = new Set();
    filteredSections.forEach((sec) => sec.items.forEach(([k]) => allKeys.add(k)));
    setExpandedKeys(allKeys);
  };

  const collapseAll = () => {
    setExpandedKeys(new Set());
  };

  // Danh sách các nhóm nghiệp vụ có sẵn cho tab filter
  const groupFilters = useMemo(() => {
    const groups = [{ key: 'ALL', label: 'Tất cả' }];
    rawSections.forEach((s) => {
      groups.push({ key: s.groupKey, label: s.title });
    });
    return groups;
  }, [rawSections]);

  // Dữ liệu cho modal xem chi tiết nếu đang mở
  const modalItemData = detailModalKey ? GUIDE_DETAILS[detailModalKey] : null;
  const modalItemTitle = detailModalKey
    ? rawSections.flatMap((s) => s.items).find(([k]) => k === detailModalKey)?.[1] || detailModalKey
    : null;
  const ModalIcon = detailModalKey ? ICON_MAP[detailModalKey] || Sparkles : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', animation: 'pageIn 180ms var(--ease-out)' }}>
      {/* Banner vai trò và giới thiệu */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)',
          background: 'var(--surface-tint-cream)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--gutter-card)',
          border: '1px solid var(--border-hairline)',
        }}
      >
        <Info size={22} style={{ color: 'var(--action-primary)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
              Vai trò: {isSuperAdmin ? 'Quản trị viên cấp cao (Super-admin)' : 'Nhân viên vận hành (Staff)'}
            </span>
            <span
              style={{
                font: 'var(--type-caption)',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: isSuperAdmin ? 'var(--status-danger-tint)' : 'var(--blue-50)',
                color: isSuperAdmin ? 'var(--status-danger-ink)' : 'var(--blue-700)',
                fontWeight: 'var(--fw-semibold)',
              }}
            >
              Được cấp quyền {totalAllowedItems} module chức năng
            </span>
          </div>
          <p style={{ margin: '6px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 1.5 }}>
            {isSuperAdmin
              ? 'Dưới đây là cẩm nang vận hành chi tiết toàn bộ các tính năng, quy trình chuẩn, các tab hợp nhất và mẹo xử lý thực tế trong hệ thống.'
              : 'Dưới đây là các tính năng Quản trị viên đã cấp quyền cho tài khoản của bạn. Các mục bạn không có quyền truy cập đã được tự động ẩn.'}
          </p>
        </div>
      </div>

      {/* Thanh công cụ tìm kiếm, bộ lọc nhóm và chuyển chế độ xem */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          background: 'var(--white)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-inset-hairline)',
          border: '1px solid var(--border-hairline)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          {/* Ô tìm kiếm thông minh */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 280px',
              maxWidth: 480,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 12,
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Tìm tính năng (nhập hàng loạt, kanban, sinh ảnh, live preview, ping, email...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 36px 0 38px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-hairline)',
                background: 'var(--surface-sunken)',
                font: 'var(--type-body-sm)',
                color: 'var(--text-strong)',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Công cụ: Chuyển dạng Lưới/Danh sách & Bung/Thu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {/* View Mode Toggle: Grid vs List */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface-sunken)',
                padding: 3,
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Dạng lưới thẻ"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: viewMode === 'grid' ? 'var(--white)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--action-primary)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  font: 'var(--type-caption)',
                  fontWeight: viewMode === 'grid' ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  cursor: 'pointer',
                }}
              >
                <LayoutGrid size={15} /> Lưới
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Dạng danh sách hàng ngang"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: viewMode === 'list' ? 'var(--white)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--action-primary)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  font: 'var(--type-caption)',
                  fontWeight: viewMode === 'list' ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  cursor: 'pointer',
                }}
              >
                <List size={15} /> Danh sách
              </button>
            </div>

            <button
              type="button"
              onClick={expandAll}
              style={{
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-pill)',
                padding: '6px 13px',
                font: 'var(--type-caption)',
                fontWeight: 'var(--fw-semibold)',
                color: 'var(--text-strong)',
                cursor: 'pointer',
              }}
            >
              Mở rộng tất cả
            </button>
            <button
              type="button"
              onClick={collapseAll}
              style={{
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-pill)',
                padding: '6px 13px',
                font: 'var(--type-caption)',
                fontWeight: 'var(--fw-semibold)',
                color: 'var(--text-strong)',
                cursor: 'pointer',
              }}
            >
              Thu gọn tất cả
            </button>
          </div>
        </div>

        {/* Chips chọn nhóm */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {groupFilters.map((group) => {
            const active = activeGroup === group.key;
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => setActiveGroup(group.key)}
                style={{
                  height: 32,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  cursor: 'pointer',
                  font: 'var(--type-caption)',
                  fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  background: active ? 'var(--action-primary)' : 'var(--surface-sunken)',
                  color: active ? 'var(--text-inverse)' : 'var(--text-body)',
                  boxShadow: active ? 'var(--shadow-inset-hairline)' : 'none',
                  transition: 'background 120ms ease, color 120ms ease',
                }}
              >
                {group.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hiển thị kết quả tìm kiếm / danh sách mục */}
      {filteredSections.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            background: 'var(--white)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border-hairline)',
          }}
        >
          <Search size={32} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }} />
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-strong)', fontWeight: 'var(--fw-semibold)' }}>
            Không tìm thấy tính năng nào khớp với từ khóa "{searchQuery}"
          </p>
          <p style={{ margin: '6px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Thử tìm bằng từ khóa khác hoặc bấm nút xóa tìm kiếm.
          </p>
        </div>
      ) : (
        filteredSections.map((section) => (
          <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>
                {section.title}
              </h2>
              <span
                style={{
                  font: 'var(--type-caption)',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 'var(--fw-semibold)',
                }}
              >
                {section.items.length} mục
              </span>
            </div>

            {/* Render dạng Lưới (Grid) hoặc Danh sách (List) */}
            {viewMode === 'grid' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 'var(--space-4)',
                  alignItems: 'stretch',
                }}
              >
                {section.items.map((item) => (
                  <GuideCard
                    key={item[0]}
                    item={item}
                    go={go}
                    isExpanded={expandedKeys.has(item[0])}
                    onToggleExpand={() => toggleExpand(item[0])}
                    onOpenDetail={() => setDetailModalKey(item[0])}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {section.items.map((item) => (
                  <GuideListItem
                    key={item[0]}
                    item={item}
                    go={go}
                    isExpanded={expandedKeys.has(item[0])}
                    onToggleExpand={() => toggleExpand(item[0])}
                    onOpenDetail={() => setDetailModalKey(item[0])}
                  />
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {/* Modal Chi tiết toàn màn hình khi cần đọc tập trung */}
      {detailModalKey && modalItemData && (
        <Modal
          open={Boolean(detailModalKey)}
          onClose={() => setDetailModalKey(null)}
          title={modalItemTitle}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--surface-tint-cream)',
                  color: 'var(--action-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {ModalIcon && <ModalIcon size={24} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
                    {modalItemTitle}
                  </span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    (Mã: <code>{detailModalKey}</code>)
                  </span>
                </div>
                <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 1.5 }}>
                  {modalItemData.summary}
                </p>
              </div>
            </div>

            {/* Các tab con */}
            {modalItemData.tabs && modalItemData.tabs.length > 0 && (
              <div>
                <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', display: 'block', marginBottom: 6 }}>
                  CÁC TAB / TÍNH NĂNG CHÍNH:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {modalItemData.tabs.map((tab, idx) => (
                    <span
                      key={idx}
                      style={{
                        font: 'var(--type-caption)',
                        fontSize: '12px',
                        background: 'var(--surface-sunken)',
                        color: 'var(--text-strong)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--border-hairline)',
                      }}
                    >
                      {tab}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quy trình chi tiết */}
            <div
              style={{
                background: 'var(--surface-sunken)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-4)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <CheckCircle2 size={18} style={{ color: 'var(--status-success-ink, #16a34a)' }} />
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
                  QUY TRÌNH THAO TÁC CHUẨN
                </span>
              </div>
              <ol style={{ margin: 0, paddingLeft: 20, font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 1.65 }}>
                {modalItemData.workflow.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: 6 }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Mẹo lưu ý */}
            {modalItemData.tips && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  background: 'var(--surface-tint-cream)',
                  borderRadius: 'var(--radius-card)',
                  padding: 'var(--space-3) var(--space-4)',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                <AlertTriangle size={18} style={{ color: 'var(--action-primary)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)', lineHeight: 1.5 }}>
                  <strong>Lưu ý nghiệp vụ:</strong> {modalItemData.tips}
                </div>
              </div>
            )}

            {/* Quyền yêu cầu & Nút hành động */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Quyền yêu cầu: <strong>{modalItemData.perm}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={() => setDetailModalKey(null)}
                  style={{
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '8px 16px',
                    font: 'var(--type-caption)',
                    fontWeight: 'var(--fw-semibold)',
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalKey(null);
                    go(detailModalKey)();
                  }}
                  style={{
                    background: 'var(--action-primary)',
                    color: 'var(--text-inverse)',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    padding: '8px 18px',
                    font: 'var(--type-caption)',
                    fontWeight: 'var(--fw-bold)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-inset-hairline)',
                  }}
                >
                  Truy cập trang này →
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
