import { useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import {
  Sparkles,
  Compass,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Flame,
  Droplets,
  Wind,
  Mountain,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  HelpCircle,
  Car,
  Clock,
  Layers,
  Award,
} from 'lucide-react';
import Button from '../components/Button.jsx';
import { Input, Eyebrow, Badge, DateInputVN, Checkbox } from '../components/index.jsx';
import BulletPicker from '../components/BulletPicker.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import PlateCard from '../components/PlateCard.jsx';
import { splitPlateNumber } from '../lib/plateFormat.js';
import {
  analyzeFullPlateFengShui,
  ELEMENT_COLORS,
  DIGIT_ELEMENTS,
  SINH_CYCLE,
} from '../lib/fengshuiPlateAnalyzer.js';
import { useFengShuiLookup } from '../services/fengshuiService.js';
import { PURPOSES, INDUSTRIES, VEHICLES, BUDGET_STEPS, formatBudget } from '../lib/fengshui.js';
import { validBirthDate } from '../lib/date.js';

export default function PlateFengShuiAnalyzerTab({ go, notify, user }) {
  const [plateInput, setPlateInput] = useState('');
  const [includeProfile, setIncludeProfile] = useState(true);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '1990-06-15');
  const [purpose, setPurpose] = useState('Kinh doanh');
  const [industry, setIndustry] = useState('Bán lẻ / thương mại');
  const [vehicle, setVehicle] = useState('Ô tô');
  const [budgetStep, setBudgetStep] = useState(BUDGET_STEPS.length - 1); // Mặc định không giới hạn
  const [err, setErr] = useState('');
  const [analyzedData, setAnalyzedData] = useState(null);

  const captureRef = useRef(null);

  // Hook tra cứu biển gợi ý cải vận từ API
  const lookupMutation = useFengShuiLookup();

  // Xử lý phân tích
  const handleAnalyze = (targetPlate) => {
    const raw = (typeof targetPlate === 'string' ? targetPlate : plateInput).trim();
    if (!raw) {
      setErr('Vui lòng nhập biển số xe của bạn.');
      return;
    }
    setErr('');

    let bYear = null;
    if (includeProfile && birthDate) {
      if (!validBirthDate(birthDate)) {
        setErr('Ngày sinh không hợp lệ.');
        return;
      }
      bYear = new Date(birthDate).getFullYear();
    }

    const res = analyzeFullPlateFengShui({
      plateInput: raw,
      birthYear: bYear,
      purpose: includeProfile ? purpose : undefined,
      industry: includeProfile && purpose === 'Kinh doanh' ? industry : undefined,
    });

    if (!res) {
      setErr('Biển số không hợp lệ. Vui lòng nhập biển đúng dạng (ví dụ: 43A-888.88 hoặc 30H-12345).');
      return;
    }

    setAnalyzedData(res);

    // Tự động gọi API lookup để lấy danh sách biển đề xuất cải vận
    // Nếu có ngày sinh thì dùng ngày sinh đó, nếu không có thì dùng năm sinh tương sinh với số đuôi biển cũ
    const lookupDate = bYear
      ? birthDate
      : `1990-01-01`;

    lookupMutation.mutate({
      birthDate: lookupDate,
      purpose: includeProfile ? PURPOSES.find((p) => p.label === purpose)?.key || 'ca_nhan' : 'ca_nhan',
      industry: includeProfile && purpose === 'Kinh doanh' ? INDUSTRIES.find((i) => i.label === industry)?.key : undefined,
      vehicle: vehicle,
      budget: BUDGET_STEPS[budgetStep] || null,
      source: '',
    });

    // Cuộn nhẹ tới kết quả
    setTimeout(() => {
      captureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Chia sẻ / Tải ảnh
  const handleDownloadImage = async () => {
    if (!captureRef.current) return;
    try {
      notify?.('Đang kết xuất ảnh phân tích phong thủy…');
      const canvas = await html2canvas(captureRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `luan-giai-phong-thuy-${analyzedData?.series || 'bien-so'}.png`;
      a.click();
    } catch {
      notify?.('Không tạo được ảnh, vui lòng chụp màn hình.');
    }
  };

  const handleShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      notify?.('Đã sao chép liên kết trang luận giải!');
    }
  };

  // Tách biển hiển thị đồ họa
  const visualSplit = useMemo(() => {
    if (!analyzedData?.formatted) return { prov: '43', seri: 'A', num: '888.88' };
    return splitPlateNumber(analyzedData.formatted);
  }, [analyzedData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Khung Form Nhập Biển Số */}
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.06))',
          border: '1px solid var(--border-hairline)',
          padding: 'clamp(20px, 3.5vw, 36px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={22} style={{ color: 'var(--action-primary)' }} />
            <h2 style={{ margin: 0, font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>
              Nhập biển số xe của bạn để luận giải phong thủy
            </h2>
          </div>
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>
            Hệ thống sẽ bóc tách các con số, tính toán Ngũ hành Hà Đồ, Tổng nút, Âm Dương, Thế số tài lộc và Quẻ Kinh Dịch Mai Hoa để giải mã vận khí biển số hiện tại.
          </p>
        </div>

        {/* Ô nhập biển số trung tâm */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
            Biển số hiện tại của bạn <span style={{ color: 'var(--status-danger)' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
            <div style={{ flex: '1 1 320px', minWidth: 260 }}>
              <input
                type="text"
                placeholder="VD: 43A-888.88 hoặc 30H-123.45"
                value={plateInput}
                onChange={(e) => {
                  setPlateInput(e.target.value.toUpperCase());
                  setErr('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAnalyze();
                }}
                style={{
                  width: '100%',
                  height: 48,
                  padding: '0 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: err ? '2px solid var(--status-danger)' : '2px solid var(--border-hairline)',
                  fontSize: '18px',
                  fontWeight: 'var(--fw-bold)',
                  letterSpacing: '1px',
                  color: 'var(--text-strong)',
                  background: 'var(--surface-sunken)',
                  outline: 'none',
                  transition: 'border-color 140ms ease',
                }}
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => handleAnalyze()}
              style={{
                height: 48,
                padding: '0 28px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 'var(--fw-bold)',
                fontSize: '15px',
              }}
            >
              <Sparkles size={18} />
              Luận giải ngay
            </Button>
          </div>

          {err && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-danger)', fontSize: '13px' }}>
              <AlertTriangle size={15} />
              <span>{err}</span>
            </div>
          )}
        </div>

        {/* Tùy chọn thông tin bản mệnh */}
        <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <Checkbox
              checked={includeProfile}
              onChange={(v) => setIncludeProfile(!!v)}
              label="Kết hợp ngày sinh & bản mệnh để đối chiếu tương hợp chuyên sâu (Khuyên dùng)"
            />
            <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-medium)' }}>
              {includeProfile ? '✓ Đang kích hoạt luận giải bản mệnh' : '○ Chỉ luận giải nội tại dãy số'}
            </span>
          </div>

          {includeProfile && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
                padding: 'var(--space-4)',
                background: 'var(--surface-sunken)',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-hairline)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 'var(--space-4)' }}>
                <Input
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <DateInputVN
                  label="Ngày sinh (dương lịch)"
                  value={birthDate}
                  hint="Hệ thống tự động quy đổi Can Chi & Nạp âm Ngũ hành."
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <BulletPicker
                label="Mục đích sử dụng xe"
                value={purpose}
                onChange={setPurpose}
                options={PURPOSES.map((p) => p.label)}
              />

              {purpose === 'Kinh doanh' && (
                <BulletPicker
                  label="Ngành kinh doanh"
                  value={industry}
                  onChange={setIndustry}
                  options={INDUSTRIES.map((i) => i.label)}
                />
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 'var(--space-4)', alignItems: 'center' }}>
                <BulletPicker
                  label="Loại xe"
                  value={vehicle}
                  onChange={setVehicle}
                  options={VEHICLES}
                />

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ font: 'var(--type-label)', color: 'var(--text-strong)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ngân sách dự kiến nếu đổi biển cải vận</span>
                    <span style={{ color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>
                      {budgetStep === 0
                        ? `Dưới ${formatBudget(BUDGET_STEPS[0])}`
                        : BUDGET_STEPS[budgetStep] == null
                        ? 'Không giới hạn'
                        : `Tối đa ${formatBudget(BUDGET_STEPS[budgetStep])}`}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={BUDGET_STEPS.length - 1}
                    step={1}
                    value={budgetStep}
                    onChange={(e) => setBudgetStep(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--action-primary)' }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KHU VỰC KẾT QUẢ LUẬN GIẢI (Khi đã phân tích) */}
      {analyzedData && (
        <div ref={captureRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Card Hero: Tổng Điểm & Biển Số Đồ Họa */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              padding: 'clamp(24px, 4vw, 40px)',
              boxShadow: 'var(--shadow-elevation-high, 0 10px 30px rgba(0,0,0,0.18))',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-5)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Lớp trang trí phong thủy chìm */}
            <div
              style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 260,
                height: 260,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(199, 91, 0, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ color: 'var(--action-primary-light, #fbbf24)', fontSize: '13px', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  KẾT QUẢ GIẢI MÃ PHONG THỦY BIỂN SỐ
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 'var(--fw-bold)', color: '#ffffff' }}>
                  Biển số: {analyzedData.formatted}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadImage}
                  style={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Download size={15} />
                  Tải ảnh kết quả
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareLink}
                  style={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Share2 size={15} />
                  Chia sẻ
                </Button>
              </div>
            </div>

            {/* Khung Biển Số Mô Phỏng + Vòng Điểm Số */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
                gap: 'var(--space-5)',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Cột trái: Biển số đồ họa */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: '100%', maxWidth: 300 }}>
                  <PlateVisual
                    size="lg"
                    shape={vehicle === 'Xe máy' ? 'short' : 'long'}
                    prov={visualSplit.prov}
                    seri={visualSplit.seri}
                    num={visualSplit.num}
                  />
                </div>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Loại xe: {vehicle} {analyzedData.provinceCode ? `· Tỉnh/Thành mã ${analyzedData.provinceCode}` : ''}
                </span>
              </div>

              {/* Cột phải: Điểm phong thủy & Huy hiệu */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontSize: '56px', fontWeight: '900', lineHeight: 1, color: analyzedData.rank.color }}>
                    {analyzedData.totalScore}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#94a3b8' }}>Thang điểm phong thủy</span>
                    <strong style={{ fontSize: '18px', color: '#f8fafc' }}>/ 100 điểm</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '4px 14px',
                      borderRadius: 'var(--radius-pill)',
                      background: analyzedData.rank.color,
                      color: '#ffffff',
                      fontWeight: 'var(--fw-bold)',
                      fontSize: '13px',
                      letterSpacing: '.5px',
                    }}
                  >
                    {analyzedData.rank.title}
                  </span>

                  {analyzedData.napAm && (
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(255,255,255,0.12)',
                        color: '#f8fafc',
                        fontSize: '13px',
                      }}
                    >
                      Mệnh chủ: <strong>{analyzedData.napAm.element} ({analyzedData.napAm.canChi})</strong>
                    </span>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: '#cbd5e1' }}>
                  {analyzedData.rank.summary}
                </p>
              </div>
            </div>
          </div>

          {/* 5 Chiều Luận Giải Chi Tiết */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>
              Phân tích 5 chiều phong thủy chuyên sâu
            </h3>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Luận giải chi tiết từng yếu tố nội tại của dãy số và mối tương quan với bản mệnh chủ sở hữu.
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {/* Chiều 1: Ngũ Hành Hà Đồ & Bản Mệnh */}
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                boxShadow: 'var(--shadow-inset-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={18} style={{ color: 'var(--action-primary)' }} />
                  <strong style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>1. Ngũ hành & Hà Đồ</strong>
                </div>
                <Badge tone="blue">Số đuôi hành {analyzedData.lastElement}</Badge>
              </div>

              {/* Từng số và màu ngũ hành */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {analyzedData.digits.map((d, idx) => {
                  const el = DIGIT_ELEMENTS[d];
                  const c = ELEMENT_COLORS[el];
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 44,
                        height: 52,
                        borderRadius: 'var(--radius-xs)',
                        background: c?.bg || '#f1f5f9',
                        border: `1px solid ${c?.border || '#cbd5e1'}`,
                      }}
                    >
                      <span style={{ fontSize: '18px', fontWeight: 'var(--fw-bold)', color: c?.text || '#1e293b' }}>{d}</span>
                      <span style={{ fontSize: '10px', fontWeight: 'var(--fw-medium)', color: c?.text || '#64748b' }}>{el}</span>
                    </div>
                  );
                })}
              </div>

              {/* Tương quan với bản mệnh */}
              {analyzedData.elementRelation ? (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-xs)',
                    background:
                      analyzedData.elementRelation.tone === 'success'
                        ? 'var(--status-success-bg, #ecfdf5)'
                        : analyzedData.elementRelation.tone === 'danger'
                        ? 'var(--rose-50, #fff1f2)'
                        : 'var(--surface-sunken)',
                    border: `1px solid ${
                      analyzedData.elementRelation.tone === 'success'
                        ? 'rgba(16, 185, 129, 0.3)'
                        : analyzedData.elementRelation.tone === 'danger'
                        ? 'rgba(244, 63, 94, 0.3)'
                        : 'var(--border-hairline)'
                    }`,
                    fontSize: '13px',
                    lineHeight: 1.45,
                    color: 'var(--text-strong)',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: 2 }}>{analyzedData.elementRelation.label}:</strong>
                  <span>{analyzedData.elementRelation.desc}</span>
                </div>
              ) : (
                <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Hành chủ đạo của biển là <strong>{analyzedData.lastElement}</strong> (theo số cuối {analyzedData.digits[analyzedData.digits.length - 1]}). Nhập thêm ngày sinh để biết mức độ tương hợp với bản mệnh của bạn.
                </p>
              )}

              {/* Phân bổ ngũ hành */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', font: 'var(--type-caption)' }}>
                {Object.entries(analyzedData.elementCounts).map(([el, cnt]) => (
                  <span
                    key={el}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-xs)',
                      background: cnt > 0 ? 'var(--surface-sunken)' : 'transparent',
                      color: cnt > 0 ? 'var(--text-strong)' : 'var(--text-faint)',
                      textDecoration: cnt === 0 ? 'line-through' : 'none',
                    }}
                  >
                    {el}: {cnt}
                  </span>
                ))}
              </div>
            </div>

            {/* Chiều 2: Tổng Nút (Nước Số) */}
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                boxShadow: 'var(--shadow-inset-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={18} style={{ color: 'var(--action-primary)' }} />
                  <strong style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>2. Tổng nút (Nước số)</strong>
                </div>
                <Badge tone={analyzedData.nutInfo.nut === 4 ? 'rose' : analyzedData.nutInfo.nut >= 8 ? 'mint' : 'amber'}>
                  {analyzedData.nutInfo.nut} Nút ({analyzedData.nutInfo.label})
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: analyzedData.nutInfo.nut === 4 ? 'var(--rose-100, #ffe4e6)' : 'var(--surface-tint-cream)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'var(--fw-bold)',
                    color: analyzedData.nutInfo.nut === 4 ? 'var(--status-danger)' : 'var(--action-primary)',
                  }}
                >
                  {analyzedData.nutInfo.nut}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Tổng các chữ số: {analyzedData.digits.join(' + ')} = {analyzedData.nutInfo.total}
                  </span>
                  <strong style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                    Lấy hàng đơn vị ➔ {analyzedData.nutInfo.nut} Nút
                  </strong>
                </div>
              </div>

              <p style={{ margin: 0, font: 'var(--type-body-sm)', lineHeight: 1.45, color: 'var(--text-body)' }}>
                {analyzedData.nutInfo.desc}
              </p>
            </div>

            {/* Chiều 3: Âm Dương Tương Phối */}
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                boxShadow: 'var(--shadow-inset-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Compass size={18} style={{ color: 'var(--action-primary)' }} />
                  <strong style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>3. Âm Dương tương phối</strong>
                </div>
                <Badge tone={analyzedData.amDuongInfo.balance === 'good' ? 'mint' : 'amber'}>
                  {analyzedData.amDuongInfo.ratio}
                </Badge>
              </div>

              {/* Thanh hiển thị Âm Dương */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  <span>Số chẵn (Âm): {analyzedData.amDuongInfo.am}</span>
                  <span>Số lẻ (Dương): {analyzedData.amDuongInfo.duong}</span>
                </div>
                <div style={{ height: 8, width: '100%', background: 'var(--grey-200)', borderRadius: 4, display: 'flex', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(analyzedData.amDuongInfo.am / analyzedData.digits.length) * 100}%`,
                      background: 'var(--blue-500, #3b82f6)',
                    }}
                    title="Phần Âm (Chẵn)"
                  />
                  <div
                    style={{
                      height: '100%',
                      width: `${(analyzedData.amDuongInfo.duong / analyzedData.digits.length) * 100}%`,
                      background: 'var(--amber-500, #f59e0b)',
                    }}
                    title="Phần Dương (Lẻ)"
                  />
                </div>
              </div>

              <p style={{ margin: 0, font: 'var(--type-body-sm)', lineHeight: 1.45, color: 'var(--text-body)' }}>
                {analyzedData.amDuongInfo.desc}
              </p>
            </div>

            {/* Chiều 4: Thế Số & Cặp Số May Mắn / Cảnh Báo */}
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                boxShadow: 'var(--shadow-inset-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} style={{ color: 'var(--action-primary)' }} />
                  <strong style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>4. Thế số & Ý nghĩa dân gian</strong>
                </div>
              </div>

              {/* Các thế số đẹp */}
              {analyzedData.patterns.beauties.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {analyzedData.patterns.beauties.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--status-success-bg, #ecfdf5)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontSize: '13px',
                      }}
                    >
                      <CheckCircle2 size={16} style={{ color: 'var(--status-success-ink, #065f46)', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <strong style={{ color: 'var(--status-success-ink, #065f46)' }}>{b.name}: </strong>
                        <span style={{ color: 'var(--text-strong)' }}>{b.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Biển số dạng thông thường, chưa có các thế số tài lộc nổi bật (Lộc Phát, Thần Tài, Tứ Quý...).
                </span>
              )}

              {/* Các con số cảnh báo */}
              {analyzedData.patterns.warnings.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {analyzedData.patterns.warnings.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--rose-50, #fff1f2)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        fontSize: '13px',
                      }}
                    >
                      <AlertTriangle size={16} style={{ color: 'var(--status-danger)', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <strong style={{ color: 'var(--status-danger)' }}>{w.name}: </strong>
                        <span style={{ color: 'var(--text-strong)' }}>{w.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chiều 5: Quẻ Kinh Dịch Mai Hoa */}
            <div
              style={{
                gridColumn: '1 / -1',
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                boxShadow: 'var(--shadow-inset-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={18} style={{ color: 'var(--action-primary)' }} />
                  <strong style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
                    5. Quẻ Kinh Dịch Mai Hoa: Quẻ {analyzedData.queDich.queName}
                  </strong>
                </div>
                <Badge tone={analyzedData.queDich.tone === 'dai-cat' ? 'mint' : analyzedData.queDich.tone === 'cat' ? 'blue' : 'amber'}>
                  {analyzedData.queDich.tone === 'dai-cat' ? 'Đại Cát' : analyzedData.queDich.tone === 'cat' ? 'Cát Hanh' : 'Bình Hòa'}
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--surface-sunken)',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{analyzedData.queDich.thuongQue.symbol}</span>
                  <span>Thượng quẻ: <strong>{analyzedData.queDich.thuongQue.name} ({analyzedData.queDich.thuongQue.nature})</strong></span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--surface-sunken)',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{analyzedData.queDich.haQue.symbol}</span>
                  <span>Hạ quẻ: <strong>{analyzedData.queDich.haQue.name} ({analyzedData.queDich.haQue.nature})</strong></span>
                </div>
              </div>

              <p style={{ margin: 0, font: 'var(--type-body-sm)', lineHeight: 1.5, color: 'var(--text-body)' }}>
                <strong>Ý nghĩa lộ trình & sự nghiệp: </strong>
                {analyzedData.queDich.desc}
              </p>
            </div>
          </div>

          {/* BẢNG ĐÁNH GIÁ ĐIỂM CÒN THIẾU & GỢI Ý CẢI VẬN */}
          <div
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border-hairline)',
              padding: 'clamp(20px, 3.5vw, 32px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              boxShadow: 'var(--shadow-inset-hairline)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={22} style={{ color: 'var(--action-primary)' }} />
              <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>
                Các điểm còn thiếu & Tiêu chí cải thiện vận thế
              </h3>
            </div>

            {analyzedData.improvementPoints.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analyzedData.improvementPoints.map((pt, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--surface-tint-cream)',
                      border: '1px solid var(--border-hairline)',
                      fontSize: '14px',
                      color: 'var(--text-strong)',
                    }}
                  >
                    <ArrowRight size={16} style={{ color: 'var(--action-primary)', marginTop: 2, flexShrink: 0 }} />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-xs)', background: 'var(--status-success-bg)', color: 'var(--status-success-ink)' }}>
                Biển số của bạn đã đạt độ hài hòa rất cao, không có điểm khuyết nghiêm trọng nào!
              </div>
            )}
          </div>

          {/* GỢI Ý BIỂN SỐ CẢI VẬN TỪ HỆ THỐNG DUY ĐỊNH & VPA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ margin: 0, font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>
                  Gợi ý biển số cải vận & bổ khuyết cho bạn
                </h3>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Các biển số có sẵn trong kho Duy Định & đấu giá VPA khắc phục triệt để các điểm yếu của biển hiện tại
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => go('list')()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Xem toàn bộ kho biển
                <ArrowRight size={14} />
              </Button>
            </div>

            {lookupMutation.isPending && (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--action-primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                <span>Đang quét kho biển số tương sinh để đề xuất cải vận…</span>
              </div>
            )}

            {!lookupMutation.isPending && lookupMutation.data?.ranked?.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                {lookupMutation.data.ranked.slice(0, 6).map((plate) => (
                  <div key={plate.plateId || plate.plateNumber} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <PlateCard plate={plate} onSelect={() => go('detail', plate.slug || plate.plateId)()} />
                    {/* Badge lý do cải vận */}
                    <div
                      style={{
                        padding: '4px 8px',
                        background: 'var(--surface-tint-cream)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '11px',
                        color: 'var(--action-primary)',
                        fontWeight: 'var(--fw-medium)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Sparkles size={12} />
                      <span>
                        {plate.score >= 80 ? 'Hợp mệnh vượt trội (≥ 80 điểm)' : 'Bổ sung số cát lợi, hóa giải khuyết hãm'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
