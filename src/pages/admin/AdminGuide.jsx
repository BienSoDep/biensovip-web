import { Info } from 'lucide-react';
import { ADMIN_NAV } from '../../common/constants.js';

// Mô tả ngắn từng mục, tra theo nav key. Nhóm + thứ tự + mục nào hiện đều suy TRỰC TIẾP từ
// ADMIN_NAV (nguồn sự thật duy nhất của sidebar) qua prop canSee — thêm/bớt mục menu không phải
// sửa file này. Thiếu mô tả thì mục vẫn hiện đủ tên, chỉ trống phần chữ giải thích.
const DESC = {
  dash: 'Lượt xem, liên hệ mới, tỉ lệ chuyển đổi và biểu đồ traffic — nơi bắt đầu mỗi ca làm việc.',
  aguide: 'Chính trang này — toàn bộ tính năng vai trò của bạn được phép dùng.',
  aplates: 'Thêm/sửa/xóa biển, đổi trạng thái Còn hàng/Đã bán, upload ảnh, xem lịch sử thay đổi giá.',
  asales: 'Yêu cầu liên hệ, quy trình bán hàng và giao dịch trong cùng một trang — chuyển giữa 3 chế độ xem Quy trình / Danh sách / Giao dịch.',
  acats: 'Loại biển, tỉnh/thành, loại xe, khoảng giá — dùng cho bộ lọc phía khách. Kéo thả để đổi thứ tự hiển thị.',
  acoupons: 'Tạo mã giảm giá, đặt % giảm và số lần dùng tối đa, bật/tắt hiệu lực.',
  acustomers: 'Danh sách tài khoản khách đã đăng ký — lịch sử mua, biển yêu thích.',
  ainterestleads: 'Khách thả tim hoặc xem 1 biển nhiều lần nhưng chưa để lại liên hệ — bấm "Nhận tư vấn" để chủ động liên hệ trước.',
  aposts: 'Viết/sửa bài blog — nội dung SEO cho landing tỉnh/loại biển và tin tức phong thủy. Kèm duyệt bình luận của khách.',
  avideos: 'Gắn video TikTok/Facebook giới thiệu biển lên trang chủ và trang chi tiết.',
  ameanings: 'Mẫu ý nghĩa chung theo loại biển/con số, và ý nghĩa riêng gắn cho từng biển cụ thể.',
  apolicypages: 'Nội dung điều khoản, bảo mật, hướng dẫn sang tên và FAQ hiển thị ở chân trang.',
  anotifications: 'Gửi thông báo thủ công tới khách (chuông web/email), quản lý email đăng ký nhận tin, và dựng mẫu email tự động theo sự kiện.',
  areviews: 'Duyệt đánh giá khách gửi trước khi hiển thị công khai; trả lời đánh giá.',
  achatbot: 'Lịch sử hội thoại chatbot với khách, bật/tắt và chỉnh cấu hình trả lời tự động.',
  acollabs: 'Danh sách CTV giới thiệu khách, theo dõi hoa hồng, duyệt thanh toán.',
  acollabcontent: 'Nội dung trang giới thiệu ưu đãi hiển thị cho người muốn trở thành CTV.',
  actvtemplates: 'Mẫu tin nhắn soạn sẵn để cộng tác viên copy gửi khách.',
  astaff: 'Tạo tài khoản nhân viên, phân quyền theo từng resource (biển, liên hệ, bài viết…), khóa/mở tài khoản, đổi mật khẩu hộ.',
  aauditlog: 'Lịch sử mọi thay đổi dữ liệu, lỗi hệ thống và rủi ro cộng tác viên — dùng để truy vết khi có sai sót.',
  ashowroom: 'Số liệu hiển thị trên trang public và thứ tự sắp xếp danh sách biển công khai.',
  afeatureflags: 'Bật/tắt feature flags, chế độ bảo trì, và DB console để tra cứu dữ liệu.',
};

function GuideCard({ item, go }) {
  const [key, title] = item;
  const desc = DESC[key];
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
      {desc && <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</span>}
      <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>Mở trang này →</span>
    </button>
  );
}

// Hướng dẫn sử dụng theo vai trò — nội dung là hình chiếu của ADMIN_NAV qua canSee, nên luôn khớp
// đúng những gì người dùng thấy ở sidebar (staff thiếu quyền thì mục tự ẩn, nhóm rỗng tự bỏ).
export default function AdminGuide({ isSuperAdmin, canSee, go }) {
  const sections = ADMIN_NAV
    .map(({ group, items }) => ({
      title: group || 'Bắt đầu',
      items: items.filter(([key]) => canSee(key)),
    }))
    .filter((sec) => sec.items.length > 0);

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
              ? 'Dưới đây là toàn bộ mục trong menu, xếp đúng theo nhóm bạn thấy ở sidebar.'
              : 'Dưới đây là các mục Quản trị viên đã cấp quyền cho bạn, xếp đúng theo nhóm ở sidebar. Thiếu mục nào cần dùng, liên hệ Quản trị viên để được cấp thêm.'}
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
