import { Info } from 'lucide-react';

// Mỗi mục: [nav key, tiêu đề, mô tả ngắn, 'all' | 'super' — 'super' = chỉ Quản trị viên thấy trong sidebar].
const SECTIONS = [
  {
    title: 'Vận hành hàng ngày',
    items: [
      ['dash', 'Tổng quan', 'Xem lượt xem, liên hệ mới, tỉ lệ chuyển đổi và biểu đồ traffic theo ngày/tuần/tháng — nơi bắt đầu mỗi ca làm việc.', 'all'],
      ['acontacts', 'Yêu cầu liên hệ', 'Danh sách khách để lại SĐT/yêu cầu tư vấn. Đổi trạng thái Mới → Đang tư vấn → Đã chốt, gán người phụ trách, ghi chú nội bộ.', 'all'],
      ['ainterestleads', 'Khách quan tâm', 'Khách thả tim hoặc xem 1 biển nhiều lần nhưng chưa để lại liên hệ — bấm "Nhận tư vấn" để chủ động liên hệ trước.', 'all'],
      ['areviews', 'Đánh giá', 'Duyệt đánh giá khách gửi trước khi hiển thị công khai trên trang chi tiết biển; trả lời đánh giá.', 'all'],
    ],
  },
  {
    title: 'Quản lý biển số & nội dung',
    items: [
      ['aplates', 'Biển số', 'Thêm/sửa/xóa biển, đổi trạng thái Còn hàng/Đã bán, upload ảnh, xem lịch sử thay đổi giá.', 'all'],
      ['acats', 'Danh mục', 'Loại biển, tỉnh/thành, loại xe, khoảng giá — dùng cho bộ lọc phía khách. Kéo thả để đổi thứ tự hiển thị.', 'all'],
      ['ameanings', 'Ý nghĩa phong thủy', 'Mẫu ý nghĩa chung theo loại biển/con số, và ý nghĩa riêng gắn cho từng biển cụ thể.', 'all'],
      ['aposts', 'Bài viết', 'Viết/sửa bài blog — nội dung SEO cho landing tỉnh/loại biển và tin tức phong thủy.', 'all'],
      ['avideos', 'Video', 'Gắn video TikTok/Facebook giới thiệu biển lên trang chủ và trang chi tiết.', 'all'],
    ],
  },
  {
    title: 'Khách hàng & Cộng tác viên',
    items: [
      ['acustomers', 'Khách hàng', 'Xem danh sách tài khoản khách đã đăng ký — lịch sử mua, biển yêu thích.', 'all'],
      ['acollabs', 'Cộng tác viên', 'Danh sách CTV giới thiệu khách, theo dõi hoa hồng, duyệt thanh toán.', 'all'],
      ['acollabcontent', 'Nội dung CTV', 'Chỉnh nội dung trang giới thiệu ưu đãi hiển thị cho người muốn trở thành CTV.', 'all'],
    ],
  },
  {
    title: 'Thông báo & Email',
    items: [
      ['anotifications', 'Thông báo', 'Soạn và gửi thông báo thủ công tới khách (chuông web/email), quản lý email đăng ký nhận tin, cấu hình email tự động theo sự kiện (biển mới khớp tìm kiếm, giảm giá…).', 'all'],
      ['aemailtpl', 'Mẫu email', 'Kéo-thả dựng bố cục (layout) email dùng chung cho các loại thông báo tự động.', 'all'],
      ['achatbot', 'Trợ lý AI', 'Xem lịch sử hội thoại chatbot với khách, bật/tắt và chỉnh cấu hình trả lời tự động.', 'all'],
    ],
  },
  {
    title: 'Chỉ Quản trị viên (super-admin)',
    items: [
      ['astaff', 'Nhân viên', 'Tạo tài khoản nhân viên mới, phân quyền theo từng resource (biển, liên hệ, bài viết…), khóa/mở tài khoản, đổi mật khẩu hộ.', 'super'],
      ['aauditlog', 'Nhật ký hệ thống', 'Lịch sử mọi thay đổi dữ liệu (ai sửa gì, khi nào) — dùng để truy vết khi có sai sót.', 'super'],
      ['arisklog', 'Rủi ro CTV', 'Cảnh báo tự động khi phát hiện dấu hiệu bất thường ở cộng tác viên (nhiều tài khoản, lead giả…) — rà soát và xử lý.', 'super'],
    ],
  },
];

function GuideCard({ item, go }) {
  const [key, title, desc] = item;
  return (
    <button
      type="button" onClick={() => go(key)()}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left', cursor: 'pointer',
        background: 'var(--white)', border: 'none', borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)',
      }}
    >
      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{title}</span>
      <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</span>
      <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>Mở trang này →</span>
    </button>
  );
}

// Hướng dẫn sử dụng theo vai trò — super-admin thấy đủ 5 nhóm, staff không thấy nhóm "Chỉ Quản trị viên".
export default function AdminGuide({ isSuperAdmin, go }) {
  const sections = SECTIONS
    .map((s) => ({ ...s, items: s.items.filter((i) => isSuperAdmin || i[3] === 'all') }))
    .filter((s) => s.items.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)' }}>
        <Info size={20} style={{ color: 'var(--action-primary)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
            Bạn đang đăng nhập với vai trò: {isSuperAdmin ? 'Quản trị viên (super-admin)' : 'Nhân viên (staff)'}
          </p>
          <p style={{ margin: '4px 0 0', font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            {isSuperAdmin
              ? 'Quản trị viên có toàn quyền trên mọi mục, bao gồm quản lý nhân viên, xem nhật ký hệ thống và rà soát rủi ro cộng tác viên.'
              : 'Nhân viên chỉ thấy các mục được Quản trị viên cấp quyền ở trang "Nhân viên". Nếu thiếu mục nào bạn cần dùng, liên hệ Quản trị viên để được cấp thêm quyền.'}
          </p>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{section.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 'var(--space-3)' }}>
            {section.items.map((item) => <GuideCard key={item[0]} item={item} go={go} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
