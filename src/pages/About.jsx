import Button from '../components/Button.jsx';
import { Badge, Eyebrow } from '../components/index.jsx';

const STATS = [['10+', 'năm kinh nghiệm'], ['5.000+', 'biển số đã trao tay'], ['2.000+', 'khách hàng Đà Nẵng'], ['1–2 ngày', 'sang tên trung bình']];

const TIMELINE = [
  ['2016', 'Khởi đầu', 'Một cửa hàng nhỏ 20m² trên đường Nguyễn Văn Linh, chỉ có vài biển số ô tô và một chiếc bàn gỗ.'],
  ['2018', 'Mở rộng kho', 'Kết nối nguồn biển từ Quảng Nam, Huế và miền Trung — kho tăng lên hơn 200 số.'],
  ['2020', 'Chuyển dịch online', 'Xây website, Zalo OA và nhận tư vấn phong thủy từ xa cho khách ở mọi tỉnh thành.'],
  ['2022', '5.000 biển đã trao tay', 'Vượt mốc 5.000 khách hàng, đa số giới thiệu lại từ người thân, bạn bè.'],
  ['2024', 'Tư vấn chuyên sâu theo mệnh', 'Chuẩn hóa quy trình chọn số theo ngũ hành, năm sinh và mục đích sử dụng của chủ xe.'],
  ['2026', 'Duy Đinh hôm nay', 'Đội ngũ 6 người, cam kết hồ sơ gốc rõ ràng và sang tên nhanh cho mọi giao dịch.'],
];

const STEPS = [
  ['Chọn biển', 'Duyệt kho, lọc theo đuôi số, loại xe và ngân sách.'],
  ['Đặt cọc', 'Chuyển khoản cọc để giữ chỗ, có xác nhận chủ shop.'],
  ['Sang tên', 'Hồ sơ gốc rõ ràng, làm thủ tục trong 1–2 ngày.'],
  ['Nhận xe', 'Bàn giao biển + giấy tờ, hỗ trợ lắp đặt tận nơi.'],
];

const VALUES = [
  ['Hồ sơ minh bạch', 'Mọi biển đều kèm hồ sơ gốc, được kiểm tra nguồn gốc trước khi niêm yết.'],
  ['Giá công khai', 'Niêm yết rõ ràng, không tăng giá sau khi chốt, không phí ẩn.'],
  ['Tư vấn đúng mệnh', 'Chọn số theo ngũ hành, năm sinh và mục đích sử dụng của chủ xe.'],
  ['Sang tên trọn gói', 'Lo trọn thủ tục pháp lý, hỗ trợ lắp đặt tận nơi.'],
];

const TESTIMONIALS = [
  ['Chú Hải — Ngũ Quý 99999', 'Tôi lo hồ sơ lằng nhằng, nhưng Duy lo trọn trong 2 ngày, đúng như cam kết.'],
  ['Anh Tuấn — 68.68 tiến lên', 'Tư vấn theo mệnh của tôi rất kỹ, chọn được số ưng ý mà giá hợp lý.'],
  ['Chị Lan — số sảnh tiến', 'Mua từ 2020, sang tên nhanh, sau này giới thiệu thêm 3 người bạn đến.'],
];

const FAQ = [
  ['Biển số có sang tên được ngay không?', 'Có. Với hồ sơ gốc đầy đủ, thủ tục sang tên thường hoàn tất trong 1–2 ngày làm việc.'],
  ['Tôi ở tỉnh khác mua được không?', 'Được. Chúng tôi gửi hồ sơ và hỗ trợ đăng ký từ xa, giao tận nơi trong khu vực miền Trung.'],
  ['Đặt cọc giữ chỗ như thế nào?', 'Quý khách chuyển khoản cọc, có biên nhận và xác nhận từ chủ shop. Số tiền cọc sẽ trừ vào giá mua.'],
  ['Có tư vấn phong thủy không?', 'Có. Duy Đinh tư vấn miễn phí chọn số theo mệnh, năm sinh và ngũ hành của chủ xe.'],
];

export default function About({ go }) {
  return (
    <section style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-9) var(--pad-page) var(--pad-section-y)', display: 'flex', flexDirection: 'column', gap: 'var(--space-9)', animation: 'pageIn 180ms var(--ease-out)' }}>

      {/* Intro + portrait */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gutter-section)', alignItems: 'center' }}>
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Eyebrow tone="blue">Từ 2016 tại Đà Nẵng</Eyebrow>
          <h1 style={{ margin: 0, font: 'var(--type-display-1)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>Chọn số như chọn vận khí cho chủ xe</h1>
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-body)', maxWidth: 'var(--width-prose)' }}>Xin chào, tôi là Duy Đinh — người sáng lập cửa hàng biển số đẹp đầu tiên tại Đà Nẵng theo đúng nghĩa làm nghề.</p>
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-body)', maxWidth: 'var(--width-prose)' }}>Tôi tin mỗi con số trên tấm biển không chỉ là địa chỉ phương tiện — nó mang ý nghĩa phong thủy, sự may mắn và câu chuyện của chủ nhân. Hơn mười năm qua, công việc của tôi là giúp khách tìm được con số hợp mệnh, hợp tài và hợp ý, với một nguyên tắc duy nhất: hồ sơ rõ ràng, giá công khai.</p>
        </div>
        <div style={{ flex: '1 1 240px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 'min(100%, 300px)', aspectRatio: '1/1.05', background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-surface)', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', boxShadow: 'var(--shadow-3)' }}>
            <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <Badge tone="dark">Sáng lập</Badge>
              <Badge tone="mint">Duy Đinh</Badge>
            </div>
            <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=70" alt="Chân dung Duy Đinh — chủ cửa hàng biển số đẹp Đà Nẵng" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 18px', background: 'linear-gradient(180deg, rgba(255,255,255,0), var(--ink-900))', color: 'var(--white)', font: 'var(--type-title-3)' }}>Duy Đinh</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'clamp(20px,3vw,32px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 'var(--space-5)' }}>
        {STATS.map(([n, l]) => (
          <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--action-primary)' }}>{n}</span>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Eyebrow tone="blue">Hành trình làm nghề</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {TIMELINE.map(([y, t, d], i) => (
            <div key={y} style={{ display: 'flex', gap: 'var(--space-5)', paddingBottom: i === TIMELINE.length - 1 ? 0 : 'var(--space-5)', position: 'relative' }}>
              <div style={{ flex: '0 0 64px', paddingTop: 2, font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--action-primary)' }}>{y}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', borderLeft: '2px solid var(--border-hairline)', paddingLeft: 'var(--space-5)' }}>
                <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{t}</span>
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: 'var(--width-prose)' }}>{d}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Eyebrow tone="blue">Giá trị tôi giữ vững</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 'var(--gutter-section)' }}>
          {VALUES.map(([t, d]) => (
            <div key={t} style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{t}</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Process */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Eyebrow tone="blue">Quy trình mua — 4 bước</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'var(--gutter-section)' }}>
          {STEPS.map(([t, d], i) => (
            <div key={t} style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ width: 30, height: 30, borderRadius: 'var(--radius-pill)', background: 'var(--action-primary)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--type-title-3)' }}>{i + 1}</span>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{t}</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Eyebrow tone="blue">Khách hàng nói về tôi</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 'var(--gutter-section)' }}>
          {TESTIMONIALS.map(([who, q]) => (
            <div key={who} style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <span aria-hidden style={{ font: 'var(--type-display-2)', color: 'var(--action-primary)', lineHeight: 1 }}>“</span>
              <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-body)', fontStyle: 'italic' }}>{q}</p>
              <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{who}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Eyebrow tone="blue">Câu hỏi thường gặp</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {FAQ.map(([q, a]) => (
            <div key={q} style={{ background: 'var(--white)', boxShadow: 'var(--shadow-inset-hairline)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>{q}</span>
              <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>{a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'var(--surface-inverse)', borderRadius: 'var(--radius-card)', padding: 'clamp(24px,4vw,40px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-5)' }}>
        <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ font: 'var(--type-title-2)', letterSpacing: 'var(--ls-title)', color: 'var(--white)' }}>Sẵn sàng tìm biển hợp mệnh?</span>
          <span style={{ font: 'var(--type-body-sm)', color: 'rgba(255,255,255,.66)' }}>Mở kho, lọc theo đuôi số và ngân sách của bạn ngay hôm nay.</span>
        </div>
        <Button variant="primary" size="lg" uppercase onClick={go('list')}>Xem kho biển số</Button>
      </div>

      {/* Contact */}
      <div style={{ background: 'var(--surface-tint-cream)', borderRadius: 'var(--radius-card)', padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Cửa hàng</span><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Duy Đinh — Biển số đẹp</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Điện thoại</span><a href="tel:0905000000" style={{ font: 'var(--type-title-3)' }}>0905 000 000</a></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Zalo OA</span><a href="#" style={{ font: 'var(--type-title-3)' }}>zalo.me/duydinh</a></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Địa chỉ</span><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>123 Nguyễn Văn Linh, Đà Nẵng</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}><span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>Giờ làm việc</span><span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>8:00 – 21:00, cả chủ nhật</span></div>
      </div>
    </section>
  );
}
