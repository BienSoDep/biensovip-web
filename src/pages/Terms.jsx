export default function Terms() {
  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Điều khoản sử dụng</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Cập nhật lần cuối: 01/08/2026</p>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-7) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <Section title="1. Giới thiệu">
          <p>Chào mừng bạn đến với Biensovip.com — nền tảng mua bán biển số xe do Duy Đinh vận hành. Khi truy cập và sử dụng website, bạn đồng ý tuân thủ các điều khoản dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.</p>
        </Section>

        <Section title="2. Dịch vụ">
          <p>Biensovip.com cung cấp dịch vụ trung gian kết nối người mua và người bán biển số xe. Chúng tôi không sở hữu biển số được niêm yết trừ khi có ghi chú rõ ràng. Mọi thông tin về biển số (giá, tình trạng, tỉnh đăng ký) đều được cập nhật từ người bán và có thể thay đổi.</p>
        </Section>

        <Section title="3. Tài khoản người dùng">
          <p>Bạn có trách nhiệm bảo mật thông tin tài khoản và mật khẩu. Mọi hoạt động dưới tài khoản của bạn đều do bạn chịu trách nhiệm. Bạn phải cung cấp thông tin chính xác khi đăng ký và cập nhật khi có thay đổi.</p>
        </Section>

        <Section title="4. Giao dịch">
          <p>Giá biển số hiển thị trên website là giá tham khảo. Giá thực tế có thể thương lượng sau khi liên hệ. Việc sang tên và thanh toán được thực hiện theo thỏa thuận riêng giữa bên mua và bên bán. Biensovip.com không chịu trách nhiệm về tranh chấp phát sinh giữa các bên.</p>
        </Section>

        <Section title="5. Quyền sở hữu trí tuệ">
          <p>Toàn bộ nội dung trên Biensovip.com (logo, hình ảnh, bài viết, thiết kế) thuộc quyền sở hữu của Duy Đinh. Nghiêm cấm sao chép, phân phối lại khi chưa có sự đồng ý bằng văn bản.</p>
        </Section>

        <Section title="6. Giới hạn trách nhiệm">
          <p>Biensovip.com không đảm bảo website hoạt động không gián đoạn hoặc không có lỗi. Chúng tôi không chịu trách nhiệm về bất kỳ thiệt hại nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.</p>
        </Section>

        <Section title="7. Thay đổi điều khoản">
          <p>Chúng tôi có quyền cập nhật điều khoản sử dụng bất kỳ lúc nào. Phiên bản mới có hiệu lực ngay khi được đăng tải. Bạn nên kiểm tra định kỳ để cập nhật các thay đổi.</p>
        </Section>

        <Section title="8. Liên hệ">
          <p>Mọi thắc mắc về điều khoản sử dụng, vui lòng liên hệ: <strong>lienhe@biensovip.com</strong> hoặc gọi <strong>0905 221 334</strong>.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <h2 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{title}</h2>
      <div style={{ font: 'var(--type-body)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>
        {children}
      </div>
    </div>
  );
}
