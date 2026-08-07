import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Button from '../components/Button.jsx';

const QA = [
  { q: 'Biển số đẹp có sang tên được không?', a: 'Có. Tất cả biển số trên Biensovip đều có hồ sơ đầy đủ và sang tên được theo đúng quy định pháp luật. Xem thêm tại trang Hướng dẫn sang tên.' },
  { q: 'Mua biển số trả góp được không?', a: 'Hiện tại chúng tôi hỗ trợ thanh toán 2 đợt: đặt cọc 30–50% khi ký hợp đồng, phần còn lại sau khi sang tên hoàn tất. Với biển giá trị cao, có thể thương lượng thêm.' },
  { q: 'Tôi ở tỉnh khác, mua biển số Đà Nẵng có được không?', a: 'Được. Bạn cần có hộ khẩu hoặc tạm trú dài hạn tại Đà Nẵng để đăng ký sang tên. Nếu chưa có, chúng tôi sẽ tư vấn giải pháp phù hợp.' },
  { q: 'Làm sao biết biển số là thật, không phải lừa đảo?', a: 'Biensovip hoạt động công khai tại Đà Nẵng, có địa chỉ văn phòng rõ ràng. Mọi giao dịch đều có hợp đồng công chứng. Bạn có thể đến xem giấy tờ gốc trước khi đặt cọc.' },
  { q: 'Sau khi mua, tôi có bán lại được không?', a: 'Có. Biển số sau khi sang tên là tài sản của bạn. Bạn có thể bán lại bất kỳ lúc nào. Liên hệ chúng tôi để được hỗ trợ đăng bán miễn phí.' },
  { q: 'Phí sang tên là bao nhiêu?', a: 'Phí sang tên do Nhà nước quy định, khoảng 2–4 triệu đồng tùy loại xe và tỉnh thành. Phí này không bao gồm trong giá biển số.' },
  { q: 'Thời gian sang tên mất bao lâu?', a: 'Thông thường 1–2 ngày làm việc kể từ khi nộp hồ sơ đầy đủ. Trường hợp phức tạp có thể kéo dài 3–5 ngày.' },
  { q: 'Tôi muốn ký gửi bán biển số, thủ tục thế nào?', a: 'Liên hệ Zalo 0905 221 334 hoặc đến văn phòng. Chúng tôi sẽ kiểm tra hồ sơ, chụp ảnh biển số và đăng lên website. Hoa hồng thỏa thuận khi có khách mua.' },
  { q: 'Có hỗ trợ vận chuyển xe không?', a: 'Có. Chúng tôi hợp tác với đơn vị vận chuyển uy tín, hỗ trợ chở xe từ tỉnh khác về Đà Nẵng nếu cần.' },
  { q: 'Biển số đã bán có hiển thị lại không?', a: 'Biển đã bán sẽ được đánh dấu "Đã bán" và không hiển thị trong danh sách mặc định. Bạn vẫn có thể xem lại trong trang chi tiết nếu có link.' },
];

export default function Faq({ go }) {
  const [open, setOpen] = useState(null);

  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Câu hỏi thường gặp</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Giải đáp nhanh những thắc mắc phổ biến về mua bán biển số đẹp.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {QA.map((item, i) => (
          <div key={i} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', border: 'none', background: 'transparent', padding: 'var(--space-4) var(--gutter-card)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ flex: 1, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{item.q}</span>
              <ChevronDown size={18} style={{ color: 'var(--text-muted)', transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 180ms var(--ease-out)', flexShrink: 0 }} />
            </button>
            {open === i && (
              <div style={{ padding: '0 var(--gutter-card) var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)', animation: 'fadeIn 140ms var(--ease-out)' }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>Chưa tìm thấy câu trả lời?</h3>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 480 }}>Liên hệ trực tiếp, chúng tôi phản hồi trong 15 phút.</p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="primary" size="md" onClick={go('chat')}>Gửi yêu cầu tư vấn</Button>
          <Button variant="outline" size="md" onClick={() => window.open('https://zalo.me/0905221334', '_blank')}>Nhắn Zalo</Button>
        </div>
      </div>
    </div>
  );
}
