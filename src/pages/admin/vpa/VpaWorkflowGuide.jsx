import { useState, useMemo } from 'react';
import {
  BookOpen, Search, Eye, EyeOff, CheckCheck, Check, X, Users, RefreshCw, Sparkles,
  Copy, Download, SlidersHorizontal, AlertTriangle, ShieldCheck, HelpCircle, Layers,
  ChevronDown, ChevronUp, ArrowRight, Star, Pin, ExternalLink, Zap, CheckCircle2,
  Info, Database, Flame, Clock, Car, Filter, Lightbulb,
} from 'lucide-react';
import Button from '../../../components/Button.jsx';
import { Badge } from '../../../components/index.jsx';

// Danh mục các nhóm quy trình
const CATEGORIES = [
  { id: 'all', label: 'Tất cả quy trình', icon: Layers },
  { id: 'crawl-seed', label: '1. Cào & Sinh dữ liệu', icon: Sparkles },
  { id: 'pricing', label: '2. Duyệt & Tính giá', icon: CheckCheck },
  { id: 'visibility', label: '3. Ẩn & Bỏ ẩn biển số', icon: Eye },
  { id: 'bulk', label: '4. Thao tác hàng loạt', icon: Copy },
  { id: 'integrity', label: '5. Toàn vẹn & Sửa lỗi', icon: ShieldCheck },
  { id: 'tabs', label: '6. Phân loại Tab & Trạng thái', icon: Clock },
];

// Danh sách các nút chức năng trong hệ thống VPA
const BUTTON_DIRECTORY = [
  {
    id: 'btn-unhide-bulk',
    name: 'Bỏ ẩn (Hàng loạt)',
    category: 'visibility',
    icon: Eye,
    styleMock: { background: '#3FBF8F', color: '#fff', border: 'none' },
    location: 'Thanh thao tác hàng loạt (Floating Dock nổi ở đáy màn hình khi tick chọn biển)',
    purpose: 'Gỡ cờ ẩn (is_hidden = false) cho tất cả các biển đang được chọn, khôi phục quyền hiển thị cho khách hàng trên website và ứng dụng.',
    whenToUse: 'Dùng khi muốn hiển thị lại các biển trước đây bị ẩn (do trùng kho shop đã bán, trùng cào, hoặc admin tạm ẩn trước đó).',
    steps: [
      'Lọc danh sách bằng bộ lọc "Ẩn/hiện: Đang ẩn" hoặc bấm mũi tên cạnh checkbox đầu bảng -> "Chỉ chọn biển đang ẩn".',
      'Tick chọn các biển muốn mở bán lại.',
      'Bấm nút "Bỏ ẩn" màu xanh lá trên thanh nổi ở dưới màn hình.',
    ],
    note: 'Biển sau khi bỏ ẩn sẽ ngay lập tức xuất hiện lại trong kết quả tìm kiếm, trang phong thủy và trợ lý AI của khách hàng.',
    severity: 'success',
  },
  {
    id: 'btn-hide-bulk',
    name: 'Ẩn khỏi khách (Hàng loạt)',
    category: 'visibility',
    icon: EyeOff,
    styleMock: { background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' },
    location: 'Thanh thao tác hàng loạt (Floating Dock)',
    purpose: 'Gán cờ ẩn (is_hidden = true) cho các biển được chọn để tạm ngừng hiển thị trên giao diện công khai.',
    whenToUse: 'Dùng khi phát hiện thông tin biển chưa chính xác, nghi ngờ lỗi crawl, hoặc muốn giữ nội bộ chưa công khai cho khách.',
    steps: [
      'Tick chọn các biển cần tạm ẩn.',
      'Bấm nút "Ẩn" trên thanh thao tác hàng loạt.',
    ],
    note: 'Biển bị ẩn vẫn hiển thị trong trang quản trị Admin với nhãn mờ [Ẩn] và độ mờ 60% để admin dễ nhận biết.',
    severity: 'warning',
  },
  {
    id: 'btn-recompute-suggestions',
    name: 'Tính lại giá gợi ý / Sinh giá gợi ý',
    category: 'pricing',
    icon: RefreshCw,
    styleMock: { background: '#1e293b', color: '#fff', border: 'none' },
    location: 'Đầu bảng tab "Duyệt giá" và hộp cảnh báo biển chưa có giá',
    purpose: 'Quét toàn bộ kho biển VPA, tự động nhận diện cấu trúc số biển, đối chiếu các mẫu đấu giá cùng nhóm và sinh giá gợi ý (suggested_price).',
    whenToUse: 'Bắt buộc bấm ngay sau khi cào danh sách công bố biển mới về hoặc khi ở tab Duyệt giá thấy thông báo còn biển chưa có giá (priceState = 0).',
    steps: [
      'Chuyển sang tab "Duyệt giá" (hoặc chọn trạng thái "Chưa có giá gợi ý").',
      'Bấm nút "Tính lại giá gợi ý ngay".',
      'Chờ hệ thống báo toast: "Đã quét và tính xong giá gợi ý: gán mới cho X biển...".',
    ],
    note: 'Thuật toán tự động nhóm theo loại xe (ô tô/xe máy), loại biển (ngũ quý, sảnh tiến, tam hoa...) và địa bàn tỉnh thành để đưa ra giá sát thị trường nhất.',
    severity: 'info',
  },
  {
    id: 'btn-approve-all-filter',
    name: 'Duyệt tất cả theo bộ lọc',
    category: 'pricing',
    icon: CheckCheck,
    styleMock: { background: 'var(--action-primary, #C75B00)', color: '#fff', border: 'none' },
    location: 'Góc phải trên thanh công cụ lọc của tab "Duyệt giá"',
    purpose: 'Kích hoạt tiến trình chạy nền (Background Runner) duyệt toàn bộ các biển đang khớp bộ lọc hiện tại (kể cả hàng nghìn biển trên nhiều trang).',
    whenToUse: 'Dùng khi bạn đã lọc kiểm tra và đồng ý phê duyệt toàn bộ danh sách (ví dụ: đã lọc theo 1 tỉnh cụ thể, hoặc 1 loại biển cụ thể).',
    steps: [
      'Thiết lập bộ lọc (ví dụ: Tỉnh Hà Nội, Loại xe Ô tô, Trạng thái: Có giá gợi ý).',
      'Bấm nút "Duyệt tất cả theo bộ lọc".',
      'Xác nhận trên modal thông báo số lượng biển dự kiến xử lý.',
      'Theo dõi thanh tiến trình chạy nền hiển thị trực tiếp trên màn hình.',
    ],
    note: 'Tiến trình chạy an toàn dưới background, admin có thể chuyển trang hoặc làm việc khác mà không bị gián đoạn.',
    severity: 'primary',
  },
  {
    id: 'btn-approve-group',
    name: 'Nhóm X biển (Duyệt theo nhóm định giá)',
    category: 'pricing',
    icon: Users,
    styleMock: { background: 'var(--surface-sunken, #f1f5f9)', color: 'var(--text-strong, #0f172a)', border: 'none' },
    location: 'Tại từng dòng ở cột "Thao tác" (hiển thị khi biển thuộc một nhóm giá có từ 2 biển trở lên)',
    purpose: 'Duyệt giá đồng loạt cho tất cả các biển có cùng cấu trúc số và cùng giá gợi ý trong nhóm giá đó chỉ với 1 click duy nhất.',
    whenToUse: 'Dùng khi bạn thấy giá gợi ý của biển này là chuẩn xác và muốn áp dụng ngay cho toàn bộ các biển cùng nhóm.',
    steps: [
      'Nhìn vào cột Thao tác, tìm nút có icon nhóm người và số lượng (ví dụ: "Nhóm 12").',
      'Bấm nút "Nhóm 12" -> Hệ thống duyệt ngay 12 biển tương đương.',
    ],
    note: 'Cực kỳ tiện lợi giúp admin không phải bấm duyệt từng biển lẻ.',
    severity: 'neutral',
  },
  {
    id: 'btn-bulk-seed',
    name: 'Sinh thông tin hàng loạt (Bulk Seed)',
    category: 'crawl-seed',
    icon: Sparkles,
    styleMock: { background: 'var(--white, #fff)', color: 'var(--text-strong, #0f172a)', border: '1px solid #e2e8f0' },
    location: 'Thanh công cụ trên cùng (tab Danh sách biển VPA)',
    purpose: 'Mở modal phân tích tự động: tự động nhận diện loại biển (plate_type), gắn tỉnh thành chuẩn, tính chữ ký phong thủy và duyệt giá gợi ý cho các biển còn thiếu thông tin.',
    whenToUse: 'Dùng khi dữ liệu cào về có một số biển bị sót danh mục loại biển hoặc chưa được gắn thẻ phong thủy.',
    steps: [
      'Bấm nút "Sinh thông tin hàng loạt".',
      'Xem bảng thống kê số biển thiếu loại biển, thiếu tỉnh thành, thiếu giá.',
      'Chọn các tùy chọn muốn kích hoạt và bấm "Thực hiện sinh thông tin".',
    ],
    note: 'Hệ thống dùng thuật toán phân tích biển số thông minh để chuẩn hóa dữ liệu.',
    severity: 'neutral',
  },
  {
    id: 'btn-copy-plates',
    name: 'Copy số biển (Vào bộ nhớ tạm)',
    category: 'bulk',
    icon: Copy,
    styleMock: { background: 'rgba(56, 189, 248, 0.15)', color: '#F19720', border: '1px solid rgba(56, 189, 248, 0.3)' },
    location: 'Thanh thao tác hàng loạt (Floating Dock)',
    purpose: 'Sao chép toàn bộ danh sách số biển đã tick chọn vào Clipboard theo định dạng mỗi số một dòng.',
    whenToUse: 'Dùng khi admin cần lấy nhanh danh sách 10-30 biển đẹp để dán gửi Zalo/Telegram báo giá cho khách hoặc gửi sếp kiểm tra.',
    steps: [
      'Tick chọn các biển số bạn cần báo giá.',
      'Bấm nút "Copy biển" trên thanh nổi màu đen.',
      'Mở Zalo/Chat và bấm Ctrl + V (Paste) để gửi ngay.',
    ],
    note: 'Không cần gõ tay từng biển, tiết kiệm tối đa thời gian tư vấn khách.',
    severity: 'info',
  },
  {
    id: 'btn-export-csv-selected',
    name: 'Xuất CSV các biển đã chọn',
    category: 'bulk',
    icon: Download,
    styleMock: { background: 'rgba(255, 255, 255, 0.12)', color: '#f8fafc', border: 'none' },
    location: 'Thanh thao tác hàng loạt (Floating Dock)',
    purpose: 'Tải về file Excel/CSV chứa thông tin chi tiết đầy đủ (Số biển, Loại xe, Tỉnh thành, Giá sàn, Giá gợi ý, Giá duyệt, Trạng thái) của RIÊNG các biển đang tick chọn.',
    whenToUse: 'Dùng khi cần lập bảng báo cáo riêng theo danh sách chọn lọc mà không muốn tải toàn bộ cơ sở dữ liệu hàng chục nghìn biển.',
    steps: [
      'Tick chọn các biển cần trích xuất.',
      'Bấm nút "Xuất CSV" trên thanh nổi màu đen.',
      'File CSV tải về tự động hỗ trợ tiếng Việt có dấu (UTF-8 BOM).',
    ],
    note: 'Phân biệt với nút "Xuất CSV" ở thanh header (nút ở header sẽ xuất toàn bộ biển theo bộ lọc hiện tại).',
    severity: 'neutral',
  },
  {
    id: 'btn-integrity-check',
    name: 'Kiểm tra dữ liệu (Integrity Panel)',
    category: 'integrity',
    icon: ShieldCheck,
    styleMock: { background: '#1e293b', color: '#fff', border: 'none' },
    location: 'Thanh công cụ trên cùng (cạnh nút Xuất CSV)',
    purpose: 'Bật/tắt bảng chẩn đoán chất lượng dữ liệu: phát hiện biển trùng lặp, biển thiếu thông tin, biển lệch tab và nút Tự động sửa lỗi (Auto-fix).',
    whenToUse: 'Dùng định kỳ hàng tuần hoặc sau mỗi đợt cào dữ liệu lớn để kiểm tra tính toàn vẹn của kho dữ liệu.',
    steps: [
      'Bấm nút "Kiểm tra dữ liệu" ở thanh công cụ.',
      'Bảng chẩn đoán hiện ra hiển thị các chỉ số: Biển trùng kho shop, Biển trùng cào, Biển lệch phiên.',
      'Bấm nút "Quét & Sửa tự động" nếu có lỗi phát hiện.',
    ],
    note: 'Giúp đảm bảo kho biển luôn sạch sẽ, không có rác dữ liệu.',
    severity: 'warning',
  },
  {
    id: 'btn-dropdown-advanced-approve',
    name: 'Menu duyệt nâng cao (3 tùy chọn)',
    category: 'pricing',
    icon: ChevronDown,
    styleMock: { background: 'var(--surface-sunken, #f1f5f9)', color: 'var(--text-strong, #0f172a)', border: '1px solid #cbd5e1' },
    location: 'Nút mũi tên ▾ cạnh nút "Duyệt tất cả theo bộ lọc"',
    purpose: 'Bao gồm 3 công cụ xử lý giá chuyên sâu theo lô:',
    whenToUse: 'Dùng cho các tình huống định giá phức tạp:',
    subItems: [
      {
        title: '1. Tìm mẫu & duyệt lại biển duyệt giá sàn',
        desc: 'Quét các biển trước đây chưa tìm thấy mẫu nên phải duyệt giá sàn (40 triệu / 80 triệu). Nếu hiện tại đã có dữ liệu đấu giá tương đồng mới, hệ thống sẽ tính giá chuẩn và duyệt lại.',
      },
      {
        title: '2. Chấp nhận toàn bộ giá đề xuất đổi mới (Drifted)',
        desc: 'Khi các phiên đấu giá mới làm thay đổi mặt bằng giá thị trường, hệ thống tính lại và gắn cờ Đề xuất đổi giá (badge lệch giá xanh/đỏ). Bấm tùy chọn này để duyệt hàng loạt toàn bộ giá mới.',
      },
      {
        title: '3. Duyệt lại giá toàn bộ',
        desc: 'Xóa toàn bộ giá duyệt cũ và chạy lại thuật toán định giá từ đầu cho toàn bộ kho biển theo quy tắc mới nhất.',
      },
    ],
    note: 'Chỉ nên chạy khi có sự thay đổi lớn về thuật toán định giá hoặc mặt bằng thị trường.',
    severity: 'primary',
  },
  {
    id: 'btn-smart-select',
    name: 'Bộ chọn nhanh thông minh (Smart Select)',
    category: 'bulk',
    icon: Filter,
    styleMock: { background: 'none', color: 'var(--text-muted, #64748b)', border: 'none' },
    location: 'Mũi tên nhỏ ▾ ngay cạnh ô checkbox chọn tất cả ở đầu bảng',
    purpose: 'Cung cấp menu chọn nhanh chỉ với 1 click: Chọn tất cả trên trang, Chỉ chọn biển đang ẩn, Chỉ chọn biển chờ duyệt giá, hoặc Bỏ chọn.',
    whenToUse: 'Dùng khi muốn chọn nhanh các biển có cùng trạng thái trên trang mà không phải tick từng ô.',
    steps: [
      'Bấm vào mũi tên ▾ nhỏ cạnh ô checkbox trên tiêu đề cột đầu tiên.',
      'Chọn mục bạn muốn (ví dụ: "Chỉ chọn biển đang ẩn").',
      'Hệ thống tự động tick toàn bộ các biển đó và mở thanh công cụ thao tác hàng loạt.',
    ],
    note: 'Kết hợp hoàn hảo với nút Bỏ ẩn hàng loạt để xử lý biển ẩn trong 2 giây.',
    severity: 'info',
  },
];

// Danh sách các Case thực tế phổ biến
const COMMON_SCENARIOS = [
  {
    id: 'case-unhide',
    title: 'Case 1: Tại sao có biển bị ẩn và cách Bỏ ẩn hàng loạt thế nào?',
    badge: 'Phổ biến nhất',
    badgeTone: 'warning',
    summary: 'Giải thích nguyên nhân biển VPA có nhãn [Ẩn] và quy trình 3 bước mở lại hiển thị cho khách hàng.',
    content: [
      {
        q: 'Tại sao biển lại bị ẩn (is_hidden = true)?',
        a: 'Biển VPA bị ẩn do 3 nguyên nhân chính: (1) Trùng kho shop (dup_shop): Biển số này đã có trong kho shop chính thức của bạn, hệ thống tự ẩn bản ghi VPA để khách không thấy 2 kết quả trùng lặp; (2) Trùng bản ghi cào (dup_rows): Crawler cào nhiều lần, bản ghi cũ/kém hơn bị ẩn đi; (3) Admin chủ động ẩn thủ công.',
      },
      {
        q: 'Khách hàng có xem được biển bị ẩn không?',
        a: 'KHÔNG. Toàn bộ giao diện tìm kiếm, danh sách biển, xem phong thủy và Chatbot AI đều tự động lọc bỏ các biển đang ẩn. Chỉ Admin mới nhìn thấy các biển này trong trang quản trị với nhãn [Ẩn].',
      },
      {
        q: 'Cách bỏ ẩn hàng loạt cho các biển đã chọn?',
        a: 'Bước 1: Trên bộ lọc, chọn "Ẩn/hiện: Đang ẩn" (hoặc bấm mũi tên cạnh checkbox đầu bảng -> "Chỉ chọn biển đang ẩn").\nBước 2: Tick chọn các biển muốn mở lại.\nBước 3: Nhìn xuống thanh màu đen nổi ở đáy màn hình, bấm nút "Bỏ ẩn" (icon con mắt màu xanh lá cây).\n-> Hệ thống lập tức gỡ ẩn và thông báo thành công!',
      },
    ],
  },
  {
    id: 'case-no-price',
    title: 'Case 2: Vừa cào danh sách biển mới về nhưng chưa có giá gợi ý?',
    badge: 'Quy trình hàng tuần',
    badgeTone: 'info',
    summary: 'Cách xử lý biển mới cào về để hệ thống tự động sinh giá gợi ý và sẵn sàng duyệt.',
    content: [
      {
        q: 'Hiện tượng gặp phải?',
        a: 'Khi vào tab "Duyệt giá" thấy bảng trống hoặc xuất hiện khung cảnh báo màu vàng: "Đang lọc biển chưa có giá trên hệ thống". Các biển này vừa cào về nên cột Giá gợi ý đang hiển thị dấu "—".',
      },
      {
        q: 'Cách xử lý chuẩn?',
        a: 'Bấm ngay nút "Tính lại giá gợi ý ngay" ở khung cảnh báo màu vàng (hoặc nút "Tính lại giá gợi ý" trên thanh công cụ). Thuật toán sẽ tự động phân loại cấu trúc số, tìm các mẫu trúng đấu giá tương tự và gán giá gợi ý cho toàn bộ các biển này trong vài giây.',
      },
    ],
  },
  {
    id: 'case-fast-approve',
    title: 'Case 3: Làm sao duyệt giá nhanh nhất khi có hàng nghìn biển chờ duyệt?',
    badge: 'Tối ưu tốc độ',
    badgeTone: 'success',
    summary: 'So sánh 4 phương thức duyệt giá từ thủ công đến tự động hóa hoàn toàn.',
    content: [
      {
        q: 'Phương thức 1: Duyệt theo Nhóm giá (Rất nhanh)',
        a: 'Nhìn vào cột Thao tác, tìm các nút có icon nhóm người "Nhóm 15", "Nhóm 40"... Bấm 1 lần sẽ duyệt toàn bộ các biển có cùng cấu trúc số trong nhóm đó.',
      },
      {
        q: 'Phương thức 2: Duyệt hàng loạt biển đã chọn',
        a: 'Tick chọn các biển trên trang -> Bấm nút "Duyệt giá" (icon CheckCheck màu cam) trên thanh nổi ở đáy màn hình.',
      },
      {
        q: 'Phương thức 3: Duyệt tất cả theo bộ lọc (Nhanh nhất cho số lượng lớn)',
        a: 'Lọc điều kiện mong muốn (ví dụ: Loại xe Ô tô, Tỉnh Hà Nội, Trạng thái: Có giá gợi ý) -> Bấm nút "Duyệt tất cả theo bộ lọc" ở đầu trang. Hệ thống chạy tiến trình nền duyệt toàn bộ mà không cần duyệt từng trang.',
      },
    ],
  },
  {
    id: 'case-price-drift',
    title: 'Case 4: Biển có nhãn "Đề xuất đổi giá" (Price Drift) là gì?',
    badge: 'Thị trường biến động',
    badgeTone: 'warning',
    summary: 'Cách xử lý khi thị trường đấu giá biến động khiến giá gợi ý lệch so với giá duyệt cũ.',
    content: [
      {
        q: 'Ý nghĩa của badge Đề xuất đổi giá?',
        a: 'Khi có các phiên đấu giá mới kết thúc với mức giá cao hơn hoặc thấp hơn trước đây, hệ thống tính toán lại và nhận thấy giá thị trường đã thay đổi. Cột Giá gợi ý sẽ xuất hiện badge lệch giá xanh (+% tăng) hoặc đỏ (-% giảm) so với giá duyệt cũ.',
      },
      {
        q: 'Cách phê duyệt giá mới?',
        a: 'Nếu đồng ý với mặt bằng giá mới: Bấm mũi tên ▾ cạnh nút Duyệt tất cả theo bộ lọc -> Chọn "Chấp nhận toàn bộ giá đề xuất đổi mới (Drifted)". Toàn bộ giá duyệt cũ sẽ được cập nhật theo giá thị trường mới nhất.',
      },
    ],
  },
  {
    id: 'case-quick-send',
    title: 'Case 5: Gửi danh sách 20 biển đẹp cho khách hàng qua Zalo trong 5 giây',
    badge: 'Tiện ích kinh doanh',
    badgeTone: 'info',
    summary: 'Sử dụng nút Copy biển để gửi danh sách tư vấn khách hàng cực nhanh.',
    content: [
      {
        q: 'Quy trình thực hiện:',
        a: 'Bước 1: Dùng ô tìm kiếm hoặc bộ lọc để tìm các biển số đẹp theo yêu cầu của khách (ví dụ: Tứ quý, Lộc phát...).\nBước 2: Tick chọn các biển số bạn muốn giới thiệu.\nBước 3: Bấm nút "Copy biển" trên thanh nổi màu đen ở cuối màn hình.\nBước 4: Mở khung chat Zalo/Telegram với khách hàng và bấm Ctrl + V (Dán) -> Danh sách số biển đã được định dạng rõ ràng từng dòng, sẵn sàng gửi ngay!',
      },
    ],
  },
];

// Bảng giải thích ý nghĩa các Tab VPA
const TAB_EXPLANATIONS = [
  {
    tabNumber: '1',
    name: 'Biển số tháng (Biển công bố)',
    badgeColor: '#F19720',
    desc: 'Danh sách các biển số xe dự kiến đưa ra đấu giá trong tháng được Bộ Công An và VPA công bố công khai. Chưa ấn định ngày giờ đấu giá cụ thể.',
    actionGuide: 'Cần phân loại, gán loại biển và tính giá gợi ý sẵn để khách hàng tham khảo đặt lịch trước.',
  },
  {
    tabNumber: '2',
    name: 'Biển số tuần (Biển chính thức)',
    badgeColor: '#3FBF8F',
    desc: 'Các biển số đã có lịch đấu giá chính thức (có ngày, giờ, ca đấu giá cụ thể trong tuần). Khách hàng có thể nộp tiền đặt trước để tham gia đấu giá.',
    actionGuide: 'Cần duyệt giá chuẩn xác và ghim/nổi bật các biển VIP lên đầu trang chủ để thu hút khách đăng ký đấu giá.',
  },
  {
    tabNumber: '3',
    name: 'Biển hết hạn',
    badgeColor: '#ef4444',
    desc: 'Các biển đã diễn ra phiên đấu giá xong hoặc đã quá thời hạn đấu giá của phiên.',
    actionGuide: 'Theo dõi kết quả đấu giá thực tế để đối chiếu và nạp dữ liệu mẫu cho thuật toán định giá tự động.',
  },
  {
    tabNumber: '4',
    name: 'Hết hạn nội bộ',
    badgeColor: '#64748b',
    desc: 'Các biển bị VPA rút khỏi danh sách công bố hoặc admin đưa vào diện theo dõi riêng nội bộ.',
    actionGuide: 'Tự động ẩn khỏi khách hàng, chỉ phục vụ lưu trữ lịch sử.',
  },
];

export default function VpaWorkflowGuide({ onNavigateTab }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCase, setExpandedCase] = useState(null);

  // Lọc danh sách nút theo danh mục và tìm kiếm
  const filteredButtons = useMemo(() => {
    return BUTTON_DIRECTORY.filter((btn) => {
      const matchCat = activeCategory === 'all' || btn.category === activeCategory;
      if (!matchCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        btn.name.toLowerCase().includes(q) ||
        btn.purpose.toLowerCase().includes(q) ||
        btn.location.toLowerCase().includes(q) ||
        btn.whenToUse.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  // Lọc danh sách case theo tìm kiếm
  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) return COMMON_SCENARIOS;
    const q = searchQuery.toLowerCase();
    return COMMON_SCENARIOS.filter((c) => {
      return (
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.content.some((item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', paddingBottom: 'var(--space-6)' }}>
      {/* Banner Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-card)',
          padding: '24px 28px',
          boxShadow: 'var(--shadow-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={20} color="#F19720" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Cẩm Nang Quy Trình & Hướng Dẫn Nút Bấm VPA
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', marginTop: 2 }}>
              Tra cứu nhanh ý nghĩa từng nút bấm, quy trình duyệt giá, cách bỏ ẩn hàng loạt và cách giải quyết các tình huống phổ biến trong quản trị biển số VPA.
            </p>
          </div>
        </div>

        {/* Thanh quy trình tổng quan 5 bước */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
            marginTop: 6,
            paddingTop: 14,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {[
            { step: '1', title: 'Cào dữ liệu VPA', desc: 'Đồng bộ từ web đấu giá VPA' },
            { step: '2', title: 'Sinh giá & Phân loại', desc: 'Tính giá gợi ý tự động' },
            { step: '3', title: 'Duyệt giá', desc: 'Duyệt nhóm / duyệt hàng loạt' },
            { step: '4', title: 'Mở bán & Bỏ ẩn', desc: 'Xuất bản cho khách hàng' },
            { step: '5', title: 'Giám sát biến động', desc: 'Cập nhật giá theo thị trường' },
          ].map((s, idx) => (
            <div
              key={s.step}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#F19720',
                    color: '#0f172a',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {s.step}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>{s.title}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Thanh tìm kiếm & Lọc danh mục */}
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-inset-hairline)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Tìm kiếm nút bấm hoặc câu hỏi (VD: bỏ ẩn, giá gợi ý, duplicate, nhóm, copy...)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--grey-300, #cbd5e1)',
                background: 'var(--surface-sunken)',
                fontSize: '13px',
                color: 'var(--text-strong)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
          {searchQuery && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Tìm thấy {filteredButtons.length} nút & {filteredCases.length} tình huống khớp
            </span>
          )}
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  border: active ? '1.5px solid var(--action-primary)' : '1px solid var(--grey-200, #e2e8f0)',
                  background: active ? 'var(--action-primary)' : 'var(--white)',
                  color: active ? '#ffffff' : 'var(--text-strong)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 140ms ease',
                }}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PHẦN 1: TÌNH HUỐNG THỰC TẾ PHỔ BIẾN (Scenarios) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="#d97706" />
            <span>Các Tình Huống Phổ Biến & Cách Xử Lý Nhanh</span>
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bấm vào từng mục để xem chi tiết</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredCases.map((c) => {
            const isOpen = expandedCase === c.id;
            return (
              <div
                key={c.id}
                style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  border: isOpen ? '1.5px solid var(--action-primary)' : '1px solid var(--grey-200, #e2e8f0)',
                  overflow: 'hidden',
                  transition: 'border-color 160ms ease',
                }}
              >
                <div
                  onClick={() => setExpandedCase(isOpen ? null : c.id)}
                  style={{
                    padding: '14px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    background: isOpen ? 'var(--surface-sunken)' : 'var(--white)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Badge tone={c.badgeTone}>{c.badge}</Badge>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-strong)' }}>
                      {c.title}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--grey-200)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {c.summary}
                    </div>
                    {c.content.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--surface-sunken)',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'var(--action-primary)' }}>Q:</span>
                          <span>{item.q}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-body)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                          {item.a}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PHẦN 2: TRA CỨU DANH MỤC NÚT BẤM (Button Directory) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="var(--action-primary)" />
            <span>Tra Cứu Chi Tiết Từng Nút Bấm ({filteredButtons.length} nút)</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredButtons.map((btn) => {
            const Icon = btn.icon;
            return (
              <div
                key={btn.id}
                style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-inset-hairline)',
                  border: '1px solid var(--grey-200, #e2e8f0)',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Header card: Visual Button Mockup */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div
                    style={{
                      ...btn.styleMock,
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '12px',
                      fontWeight: 600,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    }}
                  >
                    <Icon size={14} />
                    <span>{btn.name}</span>
                  </div>
                  <Badge tone={btn.severity === 'success' ? 'success' : btn.severity === 'warning' ? 'warning' : 'neutral'}>
                    {btn.category === 'visibility' ? 'Hiển thị' : btn.category === 'pricing' ? 'Giá & Duyệt' : btn.category === 'bulk' ? 'Hàng loạt' : btn.category === 'crawl-seed' ? 'Cào & Dữ liệu' : 'Toàn vẹn'}
                  </Badge>
                </div>

                {/* Vị trí hiển thị */}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 600 }}>Vị trí:</span>
                  <span>{btn.location}</span>
                </div>

                {/* Mục đích & Ý nghĩa */}
                <div style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.55 }}>
                  <strong style={{ color: 'var(--text-strong)' }}>Ý nghĩa: </strong>
                  {btn.purpose}
                </div>

                {/* Khi nào nên bấm */}
                <div style={{ fontSize: '12px', color: '#1e293b', background: 'var(--surface-sunken)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Khi nào bấm: </strong>
                  {btn.whenToUse}
                </div>

                {/* Các bước (nếu có) */}
                {btn.steps && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Các bước thực hiện:</span>
                    <ol style={{ margin: 0, paddingLeft: 18, fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.5 }}>
                      {btn.steps.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Menu con nếu có */}
                {btn.subItems && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {btn.subItems.map((sub, i) => (
                      <div key={i} style={{ background: 'var(--surface-sunken)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-strong)' }}>{sub.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub.desc}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lưu ý */}
                {btn.note && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--grey-100)', paddingTop: 8, fontStyle: 'italic' }}>
                    * {btn.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PHẦN 3: Ý NGHĨA CÁC TAB BIỂN VPA */}
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-inset-hairline)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} color="var(--action-primary)" />
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-strong)' }}>
            Ý Nghĩa 4 Phân Loại Tab VPA & Hướng Xử Lý Chuẩn
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {TAB_EXPLANATIONS.map((t) => (
            <div
              key={t.tabNumber}
              style={{
                border: '1px solid var(--grey-200)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 'var(--radius-pill)',
                    background: t.badgeColor,
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {t.tabNumber}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-strong)' }}>{t.name}</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.5 }}>
                {t.desc}
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '11px', color: 'var(--action-primary)', background: 'var(--surface-sunken)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontWeight: 500 }}>
                <Lightbulb size={13} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                <span><strong>Việc admin cần làm:</strong> {t.actionGuide}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
