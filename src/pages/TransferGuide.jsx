import { CheckCircle, Clock, FileText, Car, PhoneCall } from 'lucide-react';
import Button from '../components/Button.jsx';

const STEPS = [
  { icon: FileText, title: '1. Kiểm tra hồ sơ', desc: 'Chúng tôi kiểm tra giấy tờ gốc: đăng ký xe, CMND/CCCD chính chủ, sổ đăng kiểm (ô tô). Đảm bảo biển số sạch, không tranh chấp, không cầm cố.' },
  { icon: CheckCircle, title: '2. Đặt cọc & ký hợp đồng', desc: 'Hai bên ký hợp đồng mua bán có công chứng. Đặt cọc 30–50% giá trị biển số. Phần còn lại thanh toán khi hoàn tất sang tên.' },
  { icon: Car, title: '3. Sang tên tại CA', desc: 'Nhân viên Duy Đinh hỗ trợ làm thủ tục sang tên tại Phòng Cảnh sát Giao thông tỉnh/thành phố nơi xe đăng ký. Thời gian: 1–2 ngày làm việc.' },
  { icon: Clock, title: '4. Nhận biển & thanh toán', desc: 'Sau khi sang tên hoàn tất, bạn thanh toán phần còn lại và nhận toàn bộ giấy tờ mới mang tên mình.' },
];

export default function TransferGuide({ go }) {
  return (
    <div style={{ maxWidth: 'var(--width-content)', margin: '0 auto', padding: 'var(--pad-section-y) var(--pad-page)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', animation: 'pageIn 180ms var(--ease-out)' }}>
      <div>
        <h1 style={{ margin: '0 0 var(--space-2)', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Hướng dẫn sang tên</h1>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>Quy trình mua bán và sang tên biển số tại Biensovip — minh bạch, nhanh gọn, đúng luật.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {STEPS.map((s) => (
          <div key={s.title} style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', padding: 'var(--gutter-card)', display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-pill)', background: 'var(--surface-tint-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={22} style={{ color: 'var(--action-primary)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>{s.title}</h3>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6) var(--gutter-card)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-6)' }}>
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <PhoneCall size={18} style={{ color: 'var(--action-primary)' }} />
            <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Cần tư vấn thêm?</span>
          </div>
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>Gọi 0905 221 334 hoặc nhắn Zalo để được hướng dẫn chi tiết cho trường hợp của bạn.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="primary" size="md" onClick={() => window.open('https://zalo.me/0905221334', '_blank')}>Nhắn Zalo</Button>
          <Button variant="outline" size="md" onClick={go('list')}>Xem kho biển số</Button>
        </div>
      </div>

      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Lưu ý quan trọng</h3>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
          <li>Biển số chỉ được sang tên khi xe đã đăng ký chính chủ, không vi phạm giao thông chưa xử lý.</li>
          <li>Người mua cần có CMND/CCCD còn hiệu lực và hộ khẩu tại tỉnh/thành muốn đăng ký (hoặc tạm trú dài hạn).</li>
          <li>Phí sang tên do Nhà nước quy định, không nằm trong giá biển số.</li>
          <li>Thời gian sang tên có thể kéo dài hơn nếu hồ sơ phức tạp hoặc ngày lễ, cuối tuần.</li>
        </ul>
      </div>
    </div>
  );
}
