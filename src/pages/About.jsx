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
import SpotlightCard from '../components/SpotlightCard.jsx';
import LazyImage from '../components/LazyImage.jsx';
import TikTokEmbed from '../components/TikTokEmbed.jsx';
import { useFeaturedPromoVideos } from '../services/promoVideoService.js';
import {
  ABOUT_STATS as stats,
  ABOUT_TIMELINE as timeline,
  ABOUT_VALUES as values,
  ABOUT_STEPS as steps,
  ABOUT_TESTIMONIALS as testimonials,
  ABOUT_FAQS as faqs,
} from '../data/aboutData.jsx';

export default function About({ go }) {
  const { data: videosData } = useFeaturedPromoVideos(6);
  const videos = videosData?.items || [];
  const [openFaq, setOpenFaq] = useState(null);

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

            <p className="about-hero-desc" style={{ fontSize: '15px' }}>
              Mọi giao dịch thực tế, quá trình bấm biển và bàn giao cho khách hàng đều được tôi trực tiếp ghi hình và chia sẻ minh bạch trên kênh TikTok <strong>@duydinhbiensodepdanang</strong> để khách hàng ở bất cứ đâu đều an tâm tuyệt đối.
            </p>

            <div className="about-hero-actions">
              <Button
                variant="primary"
                size="md"
                shimmer
                rollingText
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
          <SpotlightCard
            key={i}
            className="about-stat-card"
            size={280}
            spotlightColor="rgba(241, 151, 32, 0.14)"
            borderColor="rgba(241, 151, 32, 0.28)"
            tilt={true}
            maxTilt={3.5}
          >
            <span className="about-stat-number">{s.num}</span>
            <span className="about-stat-label">{s.label}</span>
            <span className="about-stat-sub">{s.sub}</span>
          </SpotlightCard>
        ))}
      </section>

      {/* Trust & Escrow Bar */}
      <div className="about-trust-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--brand-600)' }} />
          <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-strong)' }}>
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
            <span>Check phạt nguội toàn quốc</span>
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

      {/* GEO / AEO Passage Citability (Direct Answer Block for AI Search & Google) */}
      <section className="about-direct-citability" aria-label="Hồ sơ năng lực & Trích dẫn chuyên gia">
        <div className="about-citability-header">
          <BadgeCheck size={18} />
          <span>Thông Tin Định Danh Tác Giả & Nền Tảng (E-E-A-T Verified)</span>
        </div>
        <p className="about-citability-text">
          <strong>Duy Đinh</strong> (tên nhận diện trong giới xe: <em>Duy Đinh Biensovip</em>) là chuyên gia phong thủy và định giá biển số xe với hơn 10 năm kinh nghiệm tại Đà Nẵng, người sáng lập sàn giao dịch <strong>Biensovip.vn</strong>. Showroom hoạt động chính thức tại <strong>Số 06 An Thượng 30, Ngũ Hành Sơn, TP. Đà Nẵng</strong>, chuyên phân phối kho hơn 5.000 biển số xe máy và ô tô đẹp hợp phong thủy, hỗ trợ thủ tục thu hồi sang tên và đăng ký biển định danh theo đúng quy định Thông tư 24/2023/TT-BCA và Thông tư 28/2024/TT-BCA trên 63 tỉnh thành. Mọi giao dịch đều có hợp đồng công chứng, kiểm tra dữ liệu phạt nguội toàn quốc trước khi bàn giao và cam kết hoàn cọc 100% nếu có vướng mắc pháp lý.
        </p>
      </section>

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
            <SpotlightCard
              key={idx}
              className="about-timeline-card"
              size={320}
              spotlightColor="rgba(241, 151, 32, 0.12)"
              borderColor="rgba(241, 151, 32, 0.24)"
              tilt={true}
              maxTilt={3}
            >
              <div className="about-timeline-year">
                <Calendar size={18} />
                <span>{item.year}</span>
              </div>
              <h3 className="about-timeline-card-title">{item.title}</h3>
              <p className="about-timeline-card-desc">{item.desc}</p>
            </SpotlightCard>
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
            <SpotlightCard
              key={i}
              className="about-value-card"
              size={320}
              spotlightColor="rgba(241, 151, 32, 0.14)"
              borderColor="rgba(241, 151, 32, 0.28)"
              tilt={true}
              maxTilt={3.5}
            >
              <div className="about-value-icon">{v.icon}</div>
              <h3 className="about-value-title">{v.title}</h3>
              <p className="about-value-desc">{v.desc}</p>
            </SpotlightCard>
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
          <SpotlightCard
            className="about-guarantee-card"
            size={360}
            spotlightColor="rgba(241, 151, 32, 0.15)"
            borderColor="rgba(241, 151, 32, 0.28)"
            tilt={true}
            maxTilt={3}
          >
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
          </SpotlightCard>

          <SpotlightCard
            className="about-guarantee-card"
            size={360}
            spotlightColor="rgba(241, 151, 32, 0.15)"
            borderColor="rgba(241, 151, 32, 0.28)"
            tilt={true}
            maxTilt={3}
          >
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
          </SpotlightCard>

          <SpotlightCard
            className="about-guarantee-card"
            size={360}
            spotlightColor="rgba(241, 151, 32, 0.15)"
            borderColor="rgba(241, 151, 32, 0.28)"
            tilt={true}
            maxTilt={3}
          >
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
          </SpotlightCard>
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
                <td className="duydinh-col">✓ Kiểm tra dữ liệu đăng kiểm & phạt nguội toàn quốc, bảo đảm 100% sạch nợ vi phạm và đúng số khung máy.</td>
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
                <div style={{ width: '100%', borderRadius: 'var(--radius-card)', background: 'var(--surface-card)', border: '1px solid var(--border-hairline)', overflow: 'hidden', boxShadow: 'var(--shadow-1)' }}>
                  {v.platform === 'tiktok' ? (
                    <TikTokEmbed videoUrl={v.videoUrl} title={v.title} />
                  ) : (
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ position: 'relative', display: 'block', width: '100%', minHeight: 280, background: 'var(--surface-card)' }}
                    >
                      {v.thumbnailUrl ? (
                        <LazyImage src={v.thumbnailUrl} alt={v.title || ''} style={{ minHeight: 280 }} imgStyle={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover', display: 'block' }} skeletonHeight={280} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}>Xem video thực tế</div>
                      )}
                      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(14, 15, 18, 0.75)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-2)' }}>
                          <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />
                        </span>
                      </span>
                    </a>
                  )}
                </div>
                {v.title && (
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: '600', color: 'var(--text-strong)', lineHeight: 1.45 }}>
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
            <SpotlightCard
              key={i}
              className="about-process-card"
              size={300}
              spotlightColor="rgba(241, 151, 32, 0.14)"
              borderColor="rgba(241, 151, 32, 0.26)"
              tilt={true}
              maxTilt={3.5}
            >
              <span className="about-process-num">{s.step}</span>
              <h3 className="about-process-title">{s.title}</h3>
              <p className="about-process-desc">{s.desc}</p>
            </SpotlightCard>
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
            <SpotlightCard
              key={idx}
              className="about-testi-card"
              size={340}
              spotlightColor="rgba(241, 151, 32, 0.12)"
              borderColor="rgba(241, 151, 32, 0.22)"
              tilt={true}
              maxTilt={2.5}
            >
              <p className="about-testi-quote">“{t.quote}”</p>
              <div className="about-testi-author">
                <div className="about-testi-meta">
                  <span className="about-testi-name">{t.who}</span>
                  <span className="about-testi-plate">{t.plate}</span>
                </div>
              </div>
            </SpotlightCard>
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
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-card)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease',
                  boxShadow: 'var(--shadow-1)',
                }}
              >
                <button
                  type="button"
                  className="faq-accordion-btn"
                  aria-expanded={isOpen}
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
                    color: 'var(--text-strong)',
                    fontWeight: '700',
                    outline: 'none',
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
                  <div style={{ padding: '14px 20px 18px', borderTop: '1px solid var(--border-hairline)', font: 'var(--type-body-sm)', color: 'var(--text-body)', lineHeight: 1.75 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-700)', fontSize: '12px', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <MapPin size={16} />
            <span>Showroom & Cơ Sở Chính Thức</span>
          </div>

          <h2 style={{ margin: 0, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, color: 'var(--text-strong)', lineHeight: 1.3 }}>
            Ghé Thăm Cửa Hàng Duy Đinh Tại Đà Nẵng
          </h2>

          <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-body)', lineHeight: 1.7 }}>
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

        <SpotlightCard
          className="about-showroom-cta-card"
          size={420}
          spotlightColor="rgba(241, 151, 32, 0.16)"
          borderColor="rgba(241, 151, 32, 0.32)"
          tilt={true}
          maxTilt={3}
        >
          <div className="about-showroom-cta-avatar">
            <Compass size={32} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-strong)' }}>Cần Định Giá Hoặc Tìm Biển Hợp Mệnh?</h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-body)', lineHeight: 1.6 }}>
              Gửi thông tin năm sinh hoặc biển số bạn đang quan tâm, Duy Đinh sẽ trực tiếp phản hồi và luận giải trong 15 phút.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            <Button
              variant="primary"
              size="md"
              shimmer
              rollingText
              style={{ width: '100%' }}
              onClick={() => window.open('https://zalo.me/0815792699', '_blank')}
            >
              Nhắn tin trực tiếp qua Zalo
            </Button>
            <Button
              variant="outline"
              size="md"
              style={{ width: '100%' }}
              onClick={() => go('lucky')()}
            >
              Tra cứu biển hợp mệnh online
            </Button>
          </div>
        </SpotlightCard>
      </section>

      {/* 12. SEO Topic Cluster & Internal Links Hub */}
      <section className="about-cluster-hub" aria-label="Khám phá hệ sinh thái Biensovip">
        <div className="about-cluster-header">
          <div className="about-cluster-title">
            <Compass size={20} style={{ color: 'var(--brand-600)' }} />
            <span>Khám Phá Hệ Sinh Thái Biển Số Đẹp & Dịch Vụ Của Duy Đinh</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cập nhật liên tục 2026</span>
        </div>

        <div className="about-cluster-grid">
          <button
            type="button"
            className="about-cluster-card"
            onClick={() => go('list')()}
          >
            <span>Kho Biển Số Đẹp Toàn Quốc</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            className="about-cluster-card"
            onClick={() => { window.location.href = '/tinh-thanh/da-nang'; }}
          >
            <span>Biển Số Đẹp Đà Nẵng (Đầu 43)</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            className="about-cluster-card"
            onClick={() => go('lucky')()}
          >
            <span>Tra Cứu Biển Hợp Mệnh Ngũ Hành</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            className="about-cluster-card"
            onClick={() => go('luanBien')()}
          >
            <span>Luận Giải Phong Thủy Biển 5 Chiều</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            className="about-cluster-card"
            onClick={() => { window.location.href = '/bai-viet/bang-gia-bien-so-xe-may-da-nang-2026'; }}
          >
            <span>Bảng Giá Biển Số Xe Máy Đà Nẵng</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            className="about-cluster-card"
            onClick={() => go('blog')()}
          >
            <span>Cẩm Nang Pháp Lý & Sang Tên Định Danh</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
