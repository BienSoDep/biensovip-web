import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  Sparkles,
  Clock,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronDown,
  Play,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  Compass,
  MessageCircle,
  BadgeCheck,
  ArrowRight
} from 'lucide-react';
import Button from '../components/Button.jsx';
import LazyImage from '../components/LazyImage.jsx';
import TikTokEmbed from '../components/TikTokEmbed.jsx';
import { useFeaturedPromoVideos } from '../services/promoVideoService.js';

export default function About({ go }) {
  const { data: videosData } = useFeaturedPromoVideos(6);
  const videos = videosData?.items || [];
  const [openFaq, setOpenFaq] = useState(null);

  const stats = [
    { num: '10+', label: 'Năm kinh nghiệm', sub: 'Thực chiến định giá & pháp lý từ 2016' },
    { num: '5.000+', label: 'Biển số trao tay', sub: 'Bàn giao hợp pháp trên 63 tỉnh thành' },
    { num: '2.000+', label: 'Khách hàng Đà Nẵng', sub: 'Cộng đồng chủ xe miền Trung tin cậy' },
    { num: '1–2 Ngày', label: 'Sang tên trung bình', sub: 'Hồ sơ chuẩn chỉ Thông tư 24/2023/TT-BCA' },
  ];

  const timeline = [
    { year: '2016', title: 'Khởi đầu từ đam mê', desc: 'Cửa hàng nhỏ 20m² trên đường Nguyễn Văn Linh, chỉ có vài biển số ô tô và một chiếc bàn gỗ đón khách giao lưu số đẹp.' },
    { year: '2018', title: 'Mở rộng nguồn biển miền Trung', desc: 'Kết nối mạng lưới sưu tầm từ Quảng Nam, Thừa Thiên Huế đến Quảng Ngãi — kho số tăng trưởng lên hơn 200 biển giá trị.' },
    { year: '2020', title: 'Số hóa nền tảng & Tư vấn online', desc: 'Xây dựng website, Zalo OA và giải pháp luận giải phong thủy từ xa, hỗ trợ chủ xe tại Hà Nội và TP.HCM sở hữu biển số miền Trung.' },
    { year: '2022', title: 'Cột mốc 5.000 biển số trao tay', desc: 'Vượt mốc 5.000 khách hàng thành công, hơn 65% giao dịch mới đến từ sự giới thiệu của bạn bè, đối tác cũ.' },
    { year: '2024', title: 'Chuẩn hóa định danh Thông tư 24', desc: 'Tiên phong hướng dẫn khách hàng đăng ký biển số định danh theo quy định mới của Bộ Công an, bảo vệ quyền sở hữu trọn đời.' },
    { year: '2026', title: 'Hệ sinh thái Biensovip toàn diện', desc: 'Showroom chuẩn mực tại An Thượng 30, đội ngũ chuyên viên tinh nhuệ, cam kết 100% hồ sơ gốc minh bạch và giá công khai.' },
  ];

  const values = [
    {
      icon: <FileText size={22} />,
      title: 'Hồ sơ gốc minh bạch',
      desc: 'Mọi biển số đều có hồ sơ pháp lý rõ ràng, kiểm tra dữ liệu đăng kiểm và phạt nguội kỹ lưỡng trước khi bàn giao.',
    },
    {
      icon: <Award size={22} />,
      title: 'Giá niêm yết công khai',
      desc: 'Tuyệt đối không tăng giá sau khi chốt, không chi phí ẩn, cam kết giá thị trường chuẩn xác và hợp lý nhất.',
    },
    {
      icon: <Compass size={22} />,
      title: 'Tư vấn đúng ngũ hành',
      desc: 'Không chạy theo trào lưu chung — luận giải năng lượng tương sinh theo can chi, mệnh quái và mục đích kinh doanh của chủ nhân.',
    },
    {
      icon: <ShieldCheck size={22} />,
      title: 'Sang tên trọn gói tận tay',
      desc: 'Đội ngũ phụ trách toàn bộ thủ tục công chứng, nộp thuế trước bạ và bấm biển tại Phòng CSGT, giao biển dập chuẩn tận nơi.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Chọn số hợp mệnh',
      desc: 'Khách hàng duyệt kho trực tuyến hoặc gửi năm sinh để Duy Đinh phân tích ngũ hành, tìm dải số cát lợi tương sinh.',
    },
    {
      step: '02',
      title: 'Thẩm định & Giữ chỗ',
      desc: 'Kiểm tra tình trạng pháp lý xe, tiến hành đặt cọc giữ chỗ có biên nhận, hợp đồng cam kết rõ ràng từ chủ cửa hàng.',
    },
    {
      step: '03',
      title: 'Thực hiện thủ tục CSGT',
      desc: 'Chuyên viên nộp thuế trước bạ, rút hồ sơ gốc và thực hiện thủ tục cấp biển định danh theo Thông tư 24.',
    },
    {
      step: '04',
      title: 'Bàn giao biển dập chuẩn',
      desc: 'Bàn giao biển số dập chuẩn Cục CSGT cùng giấy hẹn cà vẹt, hỗ trợ lắp đặt khung biển mica hoặc titan cao cấp tận nơi.',
    },
  ];

  const testimonials = [
    {
      who: 'Chú Hải — Doanh nhân Đà Nẵng',
      plate: 'Mercedes S450 · Biển Ngũ Quý 999.99',
      quote: 'Tôi rất ngại thủ tục giấy tờ sang tên vì hay bị kéo dài. Nhưng Duy Đinh trực tiếp xử lý gọn gàng trong 48h, hợp đồng rõ ràng, uy tín tuyệt đối.',
    },
    {
      who: 'Anh Tuấn — Bất Động Sản Hội An',
      plate: 'BMW X7 · Biển Lộc Phát 68.68',
      quote: 'Duy luận giải ngũ hành cho tôi rất kỹ, không ép mua biển đắt mà chọn đúng số trợ mệnh kinh doanh. Làm ăn thuận buồm xuôi gió rõ rệt.',
    },
    {
      who: 'Chị Lan — Chủ chuỗi F&B miền Trung',
      plate: 'Porsche Macan · Biển Sảnh Tiến 567.89',
      quote: 'Mua từ năm 2020 đến nay, sau đó tôi giới thiệu thêm 4 người bạn thân đến cửa hàng. Duy Đinh làm nghề rất có tâm, giá luôn công khai.',
    },
  ];

  const faqs = [
    {
      q: 'Biển số mua tại Duy Đinh có sang tên định danh chính chủ được không?',
      a: 'Hoàn toàn được. Toàn bộ biển số tại Biensovip đều có hồ sơ gốc hợp pháp 100%, tuân thủ nghiêm ngặt quy định tại Thông tư 24/2023/TT-BCA và Thông tư 28/2024/TT-BCA. Khách hàng sẽ được cấp biển định danh chính chủ đứng tên trên cà vẹt.',
    },
    {
      q: 'Khách hàng ở các tỉnh thành khác (Hà Nội, TP.HCM, Tây Nguyên...) có mua được không?',
      a: 'Hoàn toàn thuận lợi. Quy định biển định danh hiện nay cho phép công dân đăng ký xe tại nơi thường trú hoặc tạm trú. Đội ngũ Duy Đinh hỗ trợ rút hồ sơ gốc, chuyển phát hỏa tốc và hướng dẫn hoàn tất thủ tục đăng ký tận nơi trên cả nước.',
    },
    {
      q: 'Quy trình đặt cọc và cam kết giao dịch như thế nào?',
      a: 'Khi chọn được biển ưng ý, khách hàng đặt cọc giữ chỗ qua tài khoản chính chủ của Duy Đinh. Cửa hàng lập tức cấp hợp đồng giao dịch điện tử có giá trị pháp lý, cam kết hoàn tiền 100% nếu có bất kỳ vướng mắc nào về mặt pháp lý.',
    },
    {
      q: 'Duy Đinh có thu phí tư vấn phong thủy chọn biển không?',
      a: 'Không. Duy Đinh tư vấn phong thủy nạp âm, phân tích dãy số hợp can chi và bản mệnh hoàn toàn MIỄN PHÍ cho mọi khách hàng ghé thăm cửa hàng hoặc nhắn tin qua Zalo.',
    },
  ];

  return (
    <div className="about-page-wrap">
      {/* 1. Hero Section: Founder & Philosophy */}
      <section className="about-hero" itemScope itemType="https://schema.org/Person">
        <div className="about-hero-grid">
          <div className="about-hero-content">
            <div className="about-hero-tag">
              <Sparkles size={14} />
              <span>Duy Đinh · Người sáng lập Biensovip · Đà Nẵng</span>
            </div>

            <h1 className="about-hero-title">
              Chọn Số Như Chọn Vận Khí Cho Chủ Xe
            </h1>

            <p className="about-hero-desc">
              Xin chào, tôi là <strong>Duy Đinh</strong> — người sáng lập thương hiệu Biensovip tại Đà Nẵng theo đúng nghĩa làm nghề.
            </p>

            <div className="about-hero-quote">
              “Tôi tin mỗi con số trên tấm biển không đơn thuần là ký hiệu nhận diện phương tiện — nó là điểm tựa tâm lý, là biểu trưng của sự may mắn, bình an và bản lĩnh của chủ nhân trên mọi hành trình. Hơn một thập kỷ qua, nguyên tắc bất biến của tôi luôn là: <strong>hồ sơ chuẩn chỉ, giá cả công khai và tư vấn bằng cái tâm</strong>.”
            </div>

            <p className="about-hero-desc" style={{ fontSize: '15px', color: '#475569' }}>
              Mọi giao dịch thực tế, quá trình bấm biển và bàn giao cho khách hàng đều được tôi trực tiếp ghi hình và chia sẻ minh bạch trên kênh TikTok <strong>@duydinhbiensodepdanang</strong> để khách hàng ở bất cứ đâu đều an tâm tuyệt đối.
            </p>

            <div className="about-hero-actions">
              <Button
                variant="primary"
                size="md"
                onClick={() => window.open('https://zalo.me/0815792699', '_blank')}
              >
                <MessageCircle size={18} style={{ marginRight: 6 }} />
                Nhắn Zalo Duy Đinh: 081 579 2699
              </Button>
              <Button variant="outline" size="md" onClick={() => go('list')()}>
                Khám phá kho biển số →
              </Button>
            </div>
          </div>

          <div className="about-portrait-card">
            <img
              src="/assets/duy-dinh-portrait.jpg"
              alt="Duy Đinh — Người sáng lập Biensovip"
              className="about-portrait-img"
              itemProp="image"
            />
            <div className="about-portrait-badge">
              <BadgeCheck size={16} />
              <span>Chuyên gia E-E-A-T đã xác thực</span>
            </div>
            <div className="about-portrait-overlay">
              <div className="about-portrait-name" itemProp="name">Duy Đinh</div>
              <div className="about-portrait-role" itemProp="jobTitle">
                Người sáng lập Biensovip · Chuyên gia Phong thủy & Định giá Biển số
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats Grid: Proof of Scale */}
      <section className="about-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="about-stat-card">
            <span className="about-stat-number">{s.num}</span>
            <span className="about-stat-label">{s.label}</span>
            <span className="about-stat-sub">{s.sub}</span>
          </div>
        ))}
      </section>

      {/* Trust & Escrow Bar */}
      <div className="about-trust-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--brand-600)' }} />
          <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
            BẢO CHỨNG GIAO DỊCH AN TOÀN TẠI BIENSOVIP:
          </span>
        </div>
        <div className="about-trust-badges">
          <div className="about-trust-badge-item">
            <CheckCircle2 size={16} />
            <span>Hợp đồng công chứng minh bạch</span>
          </div>
          <div className="about-trust-badge-item">
            <CheckCircle2 size={16} />
            <span>Check phạt nguội Cục CSGT</span>
          </div>
          <div className="about-trust-badge-item">
            <CheckCircle2 size={16} />
            <span>Cam kết hoàn tiền cọc 100%</span>
          </div>
          <div className="about-trust-badge-item">
            <CheckCircle2 size={16} />
            <span>Bảo chứng số định danh trọn đời</span>
          </div>
        </div>
      </div>

      {/* 3. Milestones Timeline: 10 Years Journey */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="about-sec-header">
          <span className="about-sec-badge">HÀNH TRÌNH 10 NĂM</span>
          <h2 className="about-sec-title">Dấu Ấn Làm Nghề (2016 – 2026)</h2>
          <p className="about-sec-sub">
            Từ một cửa hàng mộc mạc trên đường Nguyễn Văn Linh đến hệ sinh thái giao dịch biển số đẹp uy tín hàng đầu miền Trung.
          </p>
        </div>

        <div className="about-timeline-grid">
          {timeline.map((item, idx) => (
            <div key={idx} className="about-timeline-card">
              <div className="about-timeline-year">
                <Calendar size={18} />
                <span>{item.year}</span>
              </div>
              <h3 className="about-timeline-card-title">{item.title}</h3>
              <p className="about-timeline-card-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Core Values: What We Stand For */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="about-sec-header">
          <span className="about-sec-badge">NGUYÊN TẮC HOẠT ĐỘNG</span>
          <h2 className="about-sec-title">4 Giá Trị Cốt Lõi Bất Biến</h2>
          <p className="about-sec-sub">
            Uy tín là tài sản quý giá nhất của người làm nghề. Đây là những cam kết mà Duy Đinh kiên định gìn giữ suốt 10 năm qua.
          </p>
        </div>

        <div className="about-values-grid">
          {values.map((v, i) => (
            <div key={i} className="about-value-card">
              <div className="about-value-icon">{v.icon}</div>
              <h3 className="about-value-title">{v.title}</h3>
              <p className="about-value-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 3-Tier Legal Guarantee Shield */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="about-sec-header">
          <span className="about-sec-badge">BẢO CHỨNG PHÁP LÝ ĐỈNH CAO</span>
          <h2 className="about-sec-title">3 Tầng Bảo Vệ Quyền Lợi Khách Hàng</h2>
          <p className="about-sec-sub">
            Khác biệt lớn nhất tại Duy Đinh là sự an toàn tuyệt đối về mặt pháp luật trong suốt quá trình sở hữu và sử dụng biển số.
          </p>
        </div>

        <div className="about-guarantee-grid">
          <div className="about-guarantee-card">
            <div className="about-guarantee-header">
              <div className="about-guarantee-icon-box">
                <FileText size={22} />
              </div>
              <div>
                <span className="about-guarantee-tier">TẦNG 1: PHÁP LÝ NGUỒN GỐC</span>
                <h3 className="about-guarantee-title">Chuẩn 100% Thông tư 24 & 28</h3>
              </div>
            </div>
            <p className="about-guarantee-desc">
              100% biển số chuyển nhượng đều có hồ sơ gốc minh bạch, kiểm tra lịch sử đăng kiểm, rà soát phạt nguội trực tiếp trên cổng dữ liệu Bộ Công an trước khi tiến hành thủ tục thu hồi và cấp biển định danh.
            </p>
          </div>

          <div className="about-guarantee-card">
            <div className="about-guarantee-header">
              <div className="about-guarantee-icon-box">
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="about-guarantee-tier">TẦNG 2: TÀI CHÍNH AN TOÀN</span>
                <h3 className="about-guarantee-title">Cam Kết Hoàn Cọc 100%</h3>
              </div>
            </div>
            <p className="about-guarantee-desc">
              Hợp đồng giao dịch có biên nhận rõ ràng. Nếu xảy ra bất kỳ vướng mắc nào về mặt pháp lý hoặc không thể sang tên định danh chính chủ do lỗi hồ sơ, Duy Đinh cam kết hoàn trả 100% tiền cọc ngay lập tức mà không giữ lại bất kỳ chi phí nào.
            </p>
          </div>

          <div className="about-guarantee-card">
            <div className="about-guarantee-header">
              <div className="about-guarantee-icon-box">
                <Award size={22} />
              </div>
              <div>
                <span className="about-guarantee-tier">TẦNG 3: ĐỒNG HÀNH TRỌN ĐỜI</span>
                <h3 className="about-guarantee-title">Bảo Chứng Định Danh Vĩnh Viễn</h3>
              </div>
            </div>
            <p className="about-guarantee-desc">
              Sau khi nhận biển, quý khách tiếp tục được hỗ trợ trọn đời: hỗ trợ thủ tục thu hồi để giữ số định danh khi bán xe cũ, đăng ký gán lại vào xe mới trong tương lai và bảo dưỡng khung biển ép chống nước cao cấp.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Comparison: Duy Đinh vs. Free Market */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="about-sec-header">
          <span className="about-sec-badge">ĐỐI CHIẾU THỰC TẾ</span>
          <h2 className="about-sec-title">Tại Sao Khách Hàng Chọn Duy Đinh?</h2>
          <p className="about-sec-sub">
            So sánh chi tiết tiêu chuẩn dịch vụ tại Biensovip so với việc tự mua bán trôi nổi hoặc qua trung gian tự do ngoài thị trường.
          </p>
        </div>

        <div className="about-compare-wrap">
          <table className="about-compare-table">
            <thead>
              <tr>
                <th>Tiêu chí đánh giá</th>
                <th className="brand-col">Giao dịch qua Duy Đinh (Biensovip)</th>
                <th>Mua bán tự do ngoài thị trường</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="criteria-col">Thẩm định hồ sơ & Phạt nguội</td>
                <td className="duydinh-col">✓ Kiểm tra dữ liệu Cục CSGT, bảo đảm 100% sạch nợ phạt nguội và đúng số khung máy.</td>
                <td className="market-col">✗ Người mua tự chịu rủi ro xe dính phạt nguội tiền triệu hoặc giấy tờ mập mờ.</td>
              </tr>
              <tr>
                <td className="criteria-col">Thủ tục định danh Thông tư 24</td>
                <td className="duydinh-col">✓ Trọn gói từ công chứng, thu hồi đến cấp biển định danh chính chủ trong 24–48h.</td>
                <td className="market-col">✗ Tự đi làm giấy tờ phức tạp, dễ bị từ chối hồ sơ hoặc treo định danh nhiều tuần.</td>
              </tr>
              <tr>
                <td className="criteria-col">Giá cả & Chi phí phát sinh</td>
                <td className="duydinh-col">✓ Giá niêm yết công khai, ký hợp đồng trọn gói, tuyệt đối không phát sinh phụ phí.</td>
                <td className="market-col">✗ Thường bị ép giá, đòi thêm tiền "hoa hồng", phát sinh chi phí "bôi trơn".</td>
              </tr>
              <tr>
                <td className="criteria-col">Luận giải phong thủy</td>
                <td className="duydinh-col">✓ Chuyên gia 10 năm kinh nghiệm tư vấn chuẩn ngũ hành, nạp âm, can chi miễn phí.</td>
                <td className="market-col">✗ Đoán mò theo số cảm tính, tư vấn sai mệnh gây bất an tâm lý cho chủ xe.</td>
              </tr>
              <tr>
                <td className="criteria-col">Bảo hành & Trách nhiệm</td>
                <td className="duydinh-col">✓ Cam kết văn bản: Hoàn cọc 100% nếu có trục trặc pháp lý, bảo chứng số trọn đời.</td>
                <td className="market-col">✗ Bán xong là hết trách nhiệm, dễ bị chặn liên lạc khi xảy ra sự cố tranh chấp.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Real Videos: Proof of Work */}
      {videos.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="about-sec-header">
            <span className="about-sec-badge">VIDEO BÀN GIAO THỰC TẾ</span>
            <h2 className="about-sec-title">Người Làm Thực — Việc Thực</h2>
            <p className="about-sec-sub">
              Trực tiếp theo dõi những khoảnh khắc bấm biển số, quy trình sang tên và cảm nhận chân thật của khách hàng tại cửa hàng.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {videos.map((v) => (
              <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '100%', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)' }}>
                  {v.platform === 'tiktok' ? (
                    <TikTokEmbed videoUrl={v.videoUrl} title={v.title} />
                  ) : (
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ position: 'relative', display: 'block', width: '100%', minHeight: 280, background: '#0f172a' }}
                    >
                      {v.thumbnailUrl ? (
                        <LazyImage src={v.thumbnailUrl} alt={v.title || ''} style={{ minHeight: 280 }} imgStyle={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover', display: 'block' }} skeletonHeight={280} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, color: '#94a3b8', font: 'var(--type-body-sm)' }}>Xem video thực tế</div>
                      )}
                      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(15, 23, 42, 0.75)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>
                          <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />
                        </span>
                      </span>
                    </a>
                  )}
                </div>
                {v.title && (
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: '600', color: '#0f172a', lineHeight: 1.45 }}>
                    {v.title}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Step-by-step Process: Thông tư 24 */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="about-sec-header">
          <span className="about-sec-badge">QUY TRÌNH MINH BẠCH</span>
          <h2 className="about-sec-title">4 Bước Sở Hữu Biển Đẹp An Toàn</h2>
          <p className="about-sec-sub">
            Quy trình khép kín, chuẩn chỉnh pháp lý theo Thông tư 24/2023/TT-BCA, đảm bảo thời gian nhanh nhất cho quý khách.
          </p>
        </div>

        <div className="about-process-grid">
          {steps.map((s, i) => (
            <div key={i} className="about-process-card">
              <span className="about-process-num">{s.step}</span>
              <h3 className="about-process-title">{s.title}</h3>
              <p className="about-process-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Real Testimonials */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="about-sec-header">
          <span className="about-sec-badge">KHÁCH HÀNG CHIA SẺ</span>
          <h2 className="about-sec-title">Cảm Nhận Từ Chủ Xe Thực Tế</h2>
          <p className="about-sec-sub">
            Sự an tâm và hài lòng của khách hàng là thước đo giá trị lớn nhất cho chặng đường phát triển của Duy Đinh.
          </p>
        </div>

        <div className="about-testi-grid">
          {testimonials.map((t, idx) => (
            <div key={idx} className="about-testi-card">
              <p className="about-testi-quote">“{t.quote}”</p>
              <div className="about-testi-author">
                <div className="about-testi-meta">
                  <span className="about-testi-name">{t.who}</span>
                  <span className="about-testi-plate">{t.plate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. FAQ Accordion */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="about-sec-header">
          <span className="about-sec-badge">HỎI ĐÁP & CHÍNH SÁCH</span>
          <h2 className="about-sec-title">Câu Hỏi Thường Gặp</h2>
          <p className="about-sec-sub">
            Những băn khoăn phổ biến của khách hàng khi tìm kiếm và sang tên biển số xe đẹp.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((f, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    font: 'var(--type-title-3)',
                    color: '#0f172a',
                    fontWeight: '700',
                  }}
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    size={20}
                    style={{
                      flexShrink: 0,
                      color: 'var(--brand-600)',
                      transition: 'transform 0.2s ease',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 18px', font: 'var(--type-body-sm)', color: '#475569', lineHeight: 1.75 }}>
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 11. Showroom Đà Nẵng & Multi-channel Contact Hub */}
      <section className="about-showroom-hub">
        <div className="about-showroom-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fde68a', fontSize: '12px', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <MapPin size={16} />
            <span>Showroom & Cơ Sở Chính Thức</span>
          </div>

          <h2 style={{ margin: 0, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
            Ghé Thăm Cửa Hàng Duy Đinh Tại Đà Nẵng
          </h2>

          <p style={{ margin: 0, fontSize: '15px', color: '#cbd5e1', lineHeight: 1.7 }}>
            Khách hàng có thể đến trực tiếp showroom để xem biển dập thực tế, kiểm tra hồ sơ gốc hoặc hẹn gặp Duy Đinh để được tư vấn phong thủy ngũ hành chuyên sâu.
          </p>

          <div className="about-showroom-list">
            <div className="about-contact-item">
              <div className="about-contact-icon"><MapPin size={18} /></div>
              <div className="about-contact-text">
                <span className="about-contact-label">Địa chỉ cơ sở</span>
                <span className="about-contact-val">Số 06 An Thượng 30, Ngũ Hành Sơn, Đà Nẵng</span>
              </div>
            </div>

            <div className="about-contact-item">
              <div className="about-contact-icon"><Phone size={18} /></div>
              <div className="about-contact-text">
                <span className="about-contact-label">Hotline tư vấn</span>
                <a href="tel:0815792699" className="about-contact-val">081 579 2699</a>
              </div>
            </div>

            <div className="about-contact-item">
              <div className="about-contact-icon"><MessageCircle size={18} /></div>
              <div className="about-contact-text">
                <span className="about-contact-label">Zalo kết nối</span>
                <a href="https://zalo.me/0815792699" target="_blank" rel="noopener noreferrer" className="about-contact-val">zalo.me/0815792699</a>
              </div>
            </div>

            <div className="about-contact-item">
              <div className="about-contact-icon"><Clock size={18} /></div>
              <div className="about-contact-text">
                <span className="about-contact-label">Giờ đón khách</span>
                <span className="about-contact-val">8:00 – 21:00 (Tất cả các ngày)</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brand-500)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)' }}>
            <Compass size={32} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Cần Định Giá Hoặc Tìm Biển Hợp Mệnh?</h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6 }}>
              Gửi thông tin năm sinh hoặc biển số bạn đang quan tâm, Duy Đinh sẽ trực tiếp phản hồi và luận giải trong 15 phút.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            <Button
              variant="primary"
              size="md"
              style={{ width: '100%' }}
              onClick={() => window.open('https://zalo.me/0815792699', '_blank')}
            >
              Nhắn tin trực tiếp qua Zalo
            </Button>
            <Button
              variant="outline"
              size="md"
              style={{ width: '100%', borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
              onClick={() => go('lucky')()}
            >
              Tra cứu biển hợp mệnh online
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
