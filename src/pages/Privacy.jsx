export default function Privacy() {
  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Chính sách bảo mật</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Cập nhật lần cuối: 01/08/2026</p>
      </div>

      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--space-7) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <Section title="1. Thông tin chúng tôi thu thập">
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <li><strong>Thông tin bạn cung cấp:</strong> họ tên, số điện thoại, email khi đăng ký tài khoản, gửi yêu cầu tư vấn, hoặc đăng ký CTV.</li>
            <li><strong>Thông tin tự động:</strong> loại trình duyệt, thiết bị, địa chỉ IP, các trang đã xem — phục vụ phân tích lưu lượng truy cập.</li>
            <li><strong>Cookie:</strong> chúng tôi dùng cookie để duy trì phiên đăng nhập và ghi nhớ tùy chọn của bạn.</li>
          </ul>
        </Section>

        <Section title="2. Mục đích sử dụng thông tin">
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <li>Xử lý yêu cầu tư vấn và liên hệ từ bạn.</li>
            <li>Gửi thông báo về biển số mới phù hợp tiêu chí bạn đã lưu.</li>
            <li>Cải thiện trải nghiệm người dùng và chất lượng dịch vụ.</li>
            <li>Ngăn chặn gian lận và đảm bảo an ninh hệ thống.</li>
          </ul>
        </Section>

        <Section title="3. Chia sẻ thông tin">
          <p>Chúng tôi <strong>không bán, cho thuê, hoặc chia sẻ</strong> thông tin cá nhân của bạn với bên thứ ba, ngoại trừ:</p>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <li>Khi có yêu cầu từ cơ quan nhà nước có thẩm quyền theo quy định pháp luật.</li>
            <li>Đối tác vận chuyển, thanh toán (nếu có) — chỉ ở mức cần thiết để hoàn thành giao dịch.</li>
          </ul>
        </Section>

        <Section title="4. Bảo mật dữ liệu">
          <p>Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ thông tin cá nhân của bạn. Tuy nhiên, không có phương thức truyền tải qua Internet hoặc lưu trữ điện tử nào an toàn tuyệt đối 100%.</p>
        </Section>

        <Section title="5. Quyền của bạn">
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <li>Yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân.</li>
            <li>Từ chối nhận thông báo tiếp thị bất kỳ lúc nào.</li>
            <li>Yêu cầu xóa tài khoản.</li>
          </ul>
        </Section>

        <Section title="6. Thời gian lưu trữ">
          <p>Chúng tôi lưu trữ thông tin cá nhân trong thời gian cần thiết để cung cấp dịch vụ, hoặc theo yêu cầu của pháp luật. Khi không còn cần thiết, dữ liệu sẽ được xóa hoặc ẩn danh.</p>
        </Section>

        <Section title="7. Liên hệ">
          <p>Mọi câu hỏi về chính sách bảo mật, vui lòng liên hệ: <strong>lienhe@biensovip.com</strong> hoặc gọi <strong>0905 221 334</strong>.</p>
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
