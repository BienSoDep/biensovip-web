import { useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import {
  Sparkles,
  Compass,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Award,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Info,
  Edit3,
  Zap,
  BookOpen,
} from 'lucide-react';
import Button from '../components/Button.jsx';
import { Input, Badge, DateInputVN, Checkbox } from '../components/index.jsx';
import BulletPicker from '../components/BulletPicker.jsx';
import PlateVisual from '../components/PlateVisual.jsx';
import PlateCard from '../components/PlateCard.jsx';
import { splitPlateNumber } from '../lib/plateFormat.js';
import {
  analyzeFullPlateFengShui,
  ELEMENT_COLORS,
  DIGIT_ELEMENTS,
} from '../lib/fengshuiPlateAnalyzer.js';
import { useFengShuiLookup } from '../services/fengshuiService.js';
import { useBlogPosts } from '../services/blog.js';
import { routeFor } from '../config/routes.js';
import { PURPOSES, INDUSTRIES, VEHICLES, BUDGET_STEPS, formatBudget } from '../lib/fengshui.js';
import { validBirthDate } from '../lib/date.js';

const VIETNAM_PROVINCES = [
  { code: '30', name: 'Hà Nội (29, 30, 31, 32, 33)' },
  { code: '51', name: 'TP. Hồ Chí Minh (50 - 59)' },
  { code: '43', name: 'Đà Nẵng (43)' },
  { code: '15', name: 'Hải Phòng (15, 16)' },
  { code: '65', name: 'Cần Thơ (65)' },
  { code: '14', name: 'Quảng Ninh (14)' },
  { code: '60', name: 'Đồng Nai (60)' },
  { code: '61', name: 'Bình Dương (61)' },
  { code: '36', name: 'Thanh Hóa (36)' },
  { code: '37', name: 'Nghệ An (37)' },
  { code: '38', name: 'Hà Tĩnh (38)' },
  { code: '75', name: 'Thừa Thiên Huế (75)' },
  { code: '99', name: 'Bắc Ninh (99)' },
  { code: '88', name: 'Vĩnh Phúc (88)' },
  { code: '89', name: 'Hưng Yên (89)' },
  { code: '90', name: 'Hà Nam (90)' },
  { code: '17', name: 'Thái Bình (17)' },
  { code: '18', name: 'Nam Định (18)' },
  { code: '35', name: 'Ninh Bình (35)' },
  { code: '34', name: 'Hải Dương (34)' },
  { code: '20', name: 'Thái Nguyên (20)' },
  { code: '72', name: 'Bà Rịa - Vũng Tàu (72)' },
  { code: '79', name: 'Khánh Hòa (79)' },
  { code: '77', name: 'Bình Định (77)' },
  { code: '92', name: 'Quảng Nam (92)' },
  { code: '76', name: 'Quảng Ngãi (76)' },
  { code: '73', name: 'Quảng Bình (73)' },
  { code: '74', name: 'Quảng Trị (74)' },
  { code: '47', name: 'Đắk Lắk (47)' },
  { code: '49', name: 'Lâm Đồng (49)' },
  { code: '68', name: 'Kiên Giang (68)' },
  { code: '71', name: 'Bến Tre (71)' },
  { code: '63', name: 'Tiền Giang (63)' },
  { code: '64', name: 'Vĩnh Long (64)' },
  { code: '66', name: 'Đồng Tháp (66)' },
  { code: '67', name: 'An Giang (67)' },
  { code: '69', name: 'Cà Mau (69)' },
];

function smartFormatPlate(val) {
  if (!val) return '';
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean) return '';
  const m = clean.match(/^(\d{1,2})([A-Z]{0,2})(\d{0,5})$/);
  if (m) {
    const [, prov, seri, digits] = m;
    let res = prov;
    if (seri) res += seri;
    if (digits) {
      if (seri) res += '-';
      if (digits.length <= 3) {
        res += digits;
      } else {
        res += `${digits.slice(0, 3)}.${digits.slice(3)}`;
      }
    }
    return res;
  }
  return val.toUpperCase();
}

function parsePlateParts(str) {
  const clean = String(str || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = clean.match(/^(\d{2})([A-Z]{1,2})(\d{1,5})$/);
  if (m) {
    const [, prov, seri, d] = m;
    const formattedDigits = d.length > 3 ? `${d.slice(0, 3)}.${d.slice(3)}` : d;
    return { prov, seri, num: formattedDigits };
  }
  return { prov: '', seri: '', num: '' };
}

function getRelevantBlogArticles(analyzedData, blogPosts = []) {
  if (!analyzedData) return [];

  const element = analyzedData.napAm?.element || analyzedData.lastElement || 'Thủy';
  const elementMap = {
    'Kim': { slug: 'bien-so-hop-menh-kim', title: 'Cách chọn biển số xe hợp mệnh Kim: Đón tài lộc & bình an', tag: 'Mệnh Kim' },
    'Mộc': { slug: 'bien-so-hop-menh-moc', title: 'Biển số xe hợp mệnh Mộc: Hanh thông sự nghiệp, kích tài vận', tag: 'Mệnh Mộc' },
    'Thủy': { slug: 'bien-so-hop-menh-thuy', title: 'Cách chọn biển số xe hợp mệnh Thủy: Vượng khí dồi dào, thăng tiến', tag: 'Mệnh Thủy' },
    'Hỏa': { slug: 'bien-so-hop-menh-hoa', title: 'Biển số xe hợp mệnh Hỏa: Thu hút năng lượng may mắn, vạn dặm bình an', tag: 'Mệnh Hỏa' },
    'Thổ': { slug: 'bien-so-hop-menh-tho', title: 'Biển số xe hợp mệnh Thổ: Đất lành sinh vàng, gia đạo hưng thịnh', tag: 'Mệnh Thổ' },
  };

  const matchedArticles = [];

  // 1. Bài viết theo bản mệnh
  const elemArticle = elementMap[element] || elementMap['Thủy'];
  matchedArticles.push({
    slug: elemArticle.slug,
    title: elemArticle.title,
    tag: `Hợp ${elemArticle.tag}`,
    excerpt: `Nguyên tắc ngũ hành tương sinh - tương trợ giúp chủ xe mệnh ${elemArticle.tag.replace('Mệnh ', '')} chọn dãy số cát tường, gia tăng may mắn.`,
  });

  // 2. Bài viết theo thế số của biển
  const patterns = analyzedData.specialPatterns || [];
  const patNames = patterns.map((p) => p.name.toLowerCase()).join(' ');
  const numStr = analyzedData.series || '';

  if (patNames.includes('lộc phát') || numStr.includes('68') || numStr.includes('86')) {
    matchedArticles.push({
      slug: 'bien-so-loc-phat-68-86',
      title: 'Ý nghĩa biển số xe Lộc Phát (68 - 86) trong kinh doanh',
      tag: 'Thế số Lộc Phát',
      excerpt: 'Giải mã vì sao cặp số 68 - 86 luôn được giới kinh doanh và mua bán xe săn đón bậc nhất.',
    });
  } else if (patNames.includes('thần tài') || numStr.includes('39') || numStr.includes('79')) {
    matchedArticles.push({
      slug: 'bien-so-than-tai-39-79',
      title: 'Ý nghĩa biển số xe Thần Tài (39 - 79): Chiêu tài nạp phúc',
      tag: 'Thế số Thần Tài',
      excerpt: 'Ý nghĩa Thần Tài nhỏ 39 và Thần Tài lớn 79 trong phong thủy biển số xe mang lại tài lộc dồi dào.',
    });
  } else if (patNames.includes('tứ quý')) {
    matchedArticles.push({
      slug: 'bien-tu-quy',
      title: 'Ý nghĩa biển số xe Tứ Quý: Đẳng cấp trường cửu và vượng khí',
      tag: 'Biển Tứ Quý',
      excerpt: 'Khám phá giá trị phong thủy và biểu tượng vị thế của các bộ số tứ quý trường tồn.',
    });
  } else if (patNames.includes('tam hoa')) {
    matchedArticles.push({
      slug: 'bien-tam-hoa',
      title: 'Ý nghĩa biển số xe Tam Hoa: Vững chắc như kiềng ba chân',
      tag: 'Biển Tam Hoa',
      excerpt: 'Bộ 3 con số liền kề biểu trưng cho sự ổn định, thịnh vượng và bảo trợ trên mọi nẻo đường.',
    });
  } else if (patNames.includes('sảnh tiến') || patNames.includes('tiến')) {
    matchedArticles.push({
      slug: 'bien-so-sanh-tien-y-nghia',
      title: 'Ý nghĩa biển số xe Sảnh Tiến: Nấc thang sự nghiệp thăng hoa',
      tag: 'Biển Sảnh Tiến',
      excerpt: 'Dãy số tăng dần liên tục mang biểu tượng bước tiến không ngừng và công danh rộng mở.',
    });
  } else if (patNames.includes('gánh') || patNames.includes('kép') || patNames.includes('đối')) {
    matchedArticles.push({
      slug: 'bien-so-ganh-y-nghia',
      title: 'Ý nghĩa biển số Gánh & Kép: Cân bằng âm dương, giữ lộc',
      tag: 'Biển Gánh & Kép',
      excerpt: 'Thế số đối xứng tạo thế cân bằng vững chãi, hạn chế tiêu tán tài vận cho chủ xe.',
    });
  }

  // 3. Bài viết về ý nghĩa con số đuôi
  const lastDigit = analyzedData.digits?.[analyzedData.digits.length - 1] ?? '8';
  matchedArticles.push({
    slug: `y-nghia-so-${lastDigit}-trong-bien-so`,
    title: `Ý nghĩa con số đuôi ${lastDigit} trong phong thủy biển số xe`,
    tag: `Số đuôi ${lastDigit}`,
    excerpt: `Số ${lastDigit} đại diện cho hành ${DIGIT_ELEMENTS[lastDigit] || 'Thổ'}, đóng vai trò then chốt định hình vận khí sau cùng của dãy số.`,
  });

  // Ghép với bài viết thực từ backend nếu có
  return matchedArticles.slice(0, 3).map((art) => {
    const livePost = (blogPosts || []).find((p) => p.slug === art.slug || (p.title && p.title.toLowerCase().includes(art.tag.toLowerCase())));
    if (livePost) {
      return {
        ...art,
        title: livePost.title || art.title,
        excerpt: livePost.excerpt || art.excerpt,
        thumbnailUrl: livePost.thumbnailUrl,
        slug: livePost.slug || art.slug,
      };
    }
    return art;
  });
}

export default function PlateFengShuiAnalyzerTab({ go, patch, notify, user }) {
  const [plateInput, setPlateInput] = useState('');
  const [inputMode, setInputMode] = useState('free'); // 'free' | 'structured'
  const [structuredParts, setStructuredParts] = useState({ prov: '43', seri: 'A', num: '164.36' });
  const [includeProfile, setIncludeProfile] = useState(true);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '2005-05-26');
  const [purpose, setPurpose] = useState('Kinh doanh');
  const [industry, setIndustry] = useState('Bán lẻ / thương mại');
  const [vehicle, setVehicle] = useState('Ô tô');
  const [budgetStep, setBudgetStep] = useState(BUDGET_STEPS.length - 1); // Mặc định không giới hạn
  const [err, setErr] = useState('');
  const [analyzedData, setAnalyzedData] = useState(null);
  const [analysisMode, setAnalysisMode] = useState('detailed'); // 'detailed' | 'brief'
  const [plateShape, setPlateShape] = useState('long'); // 'long' | 'short'

  const captureRef = useRef(null);

  // Hook tra cứu biển gợi ý cải vận từ API
  const lookupMutation = useFengShuiLookup();

  // Hook bài viết phong thủy liên quan
  const { data: blogData } = useBlogPosts(1, 50);
  const relevantArticles = useMemo(() => {
    return getRelevantBlogArticles(analyzedData, blogData?.items || []);
  }, [analyzedData, blogData]);

  // Đồng bộ khi người dùng gõ tự do
  const handleFreePlateChange = (val) => {
    const formatted = smartFormatPlate(val);
    setPlateInput(formatted);
    const parsed = parsePlateParts(formatted);
    if (parsed.prov) {
      setStructuredParts(parsed);
    }
  };

  // Đồng bộ khi người dùng chọn từng phần
  const handleStructuredChange = (field, value) => {
    const next = { ...structuredParts, [field]: value };
    setStructuredParts(next);
    let numStr = next.num ? next.num.replace(/[^0-9]/g, '') : '';
    let formattedNum = numStr;
    if (numStr.length > 3) {
      formattedNum = `${numStr.slice(0, 3)}.${numStr.slice(3)}`;
    }
    const combined = `${next.prov || ''}${next.seri || ''}${next.prov && next.seri && formattedNum ? '-' : ''}${formattedNum}`;
    setPlateInput(combined);
  };

  // Chọn mẫu thử nhanh
  const handleApplyPreset = (presetPlate) => {
    setPlateInput(presetPlate);
    const parsed = parsePlateParts(presetPlate);
    if (parsed.prov) setStructuredParts(parsed);
    handleAnalyze(presetPlate);
  };

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
      setErr('Biển số không hợp lệ. Vui lòng nhập biển đúng dạng (ví dụ: 43A-164.36 hoặc 30H-888.88).');
      return;
    }

    setAnalyzedData(res);

    // Tự động gọi API lookup để lấy danh sách biển đề xuất cải vận
    const lookupDate = bYear ? birthDate : '1990-01-01';

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
    }, 120);
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
      notify?.('Không tạo được ảnh, vui lòng thử lại.');
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
    if (!analyzedData?.formatted) return { prov: '43', seri: 'A', num: '164.36' };
    return splitPlateNumber(analyzedData.formatted);
  }, [analyzedData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Khung Form Nhập Biển Số */}
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.06))',
          border: '1px solid var(--border-hairline)',
          padding: 'clamp(20px, 3.5vw, 36px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-tint-cream)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--action-primary)',
              }}
            >
              <Compass size={20} />
            </span>
            <h2 style={{ margin: 0, font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>
              Nhập biển số xe của bạn để luận giải phong thủy
            </h2>
          </div>
          <p style={{ margin: 0, font: 'var(--type-body)', color: 'var(--text-muted)' }}>
            Hệ thống bóc tách 5 chiều: Ngũ hành Tiên Thiên Hà Đồ, Tổng nút, Âm Dương tương phối, Thế số tài lộc và Quẻ Kinh Dịch Mai Hoa chuẩn xác.
          </p>
        </div>

        {/* Chuyển đổi chế độ nhập & Ô nhập biển số trung tâm */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Header & Tab chuyển đổi chế độ nhập */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <label style={{ font: 'var(--type-label)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
              Biển số hiện tại của bạn <span style={{ color: 'var(--status-danger)' }}>*</span>
            </label>

            {/* Switcher 2 chế độ: Nhập tự do vs Chọn nhập nhanh */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--surface-sunken)',
                padding: 3,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setInputMode('free')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: inputMode === 'free' ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  background: inputMode === 'free' ? 'var(--white)' : 'transparent',
                  color: inputMode === 'free' ? 'var(--action-primary)' : 'var(--text-muted)',
                  boxShadow: inputMode === 'free' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 120ms ease',
                }}
              >
                <Edit3 size={14} />
                Nhập chuỗi tự do
              </button>

              <button
                type="button"
                onClick={() => setInputMode('structured')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: inputMode === 'structured' ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  background: inputMode === 'structured' ? 'var(--white)' : 'transparent',
                  color: inputMode === 'structured' ? 'var(--action-primary)' : 'var(--text-muted)',
                  boxShadow: inputMode === 'structured' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 120ms ease',
                }}
              >
                <Zap size={14} />
                Chọn nhập nhanh theo phần
              </button>
            </div>
          </div>

          {/* CHẾ ĐỘ 1: NHẬP TỰ DO (Có Smart Auto-Format) */}
          {inputMode === 'free' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
              <div style={{ flex: '1 1 320px', minWidth: 260, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Gõ hoặc dán (VD: 43A-164.36 hoặc 43A16436)"
                  value={plateInput}
                  onChange={(e) => {
                    handleFreePlateChange(e.target.value);
                    setErr('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAnalyze();
                  }}
                  style={{
                    width: '100%',
                    height: 48,
                    padding: '0 40px 0 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: err ? '2px solid var(--status-danger)' : '1px solid var(--border-hairline)',
                    fontSize: '18px',
                    fontWeight: 'var(--fw-bold)',
                    letterSpacing: '1px',
                    color: 'var(--text-strong)',
                    background: 'var(--surface-sunken)',
                    outline: 'none',
                    transition: 'border-color 140ms ease, box-shadow 140ms ease',
                  }}
                />
                {plateInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlateInput('');
                      setStructuredParts({ prov: '', seri: '', num: '' });
                    }}
                    title="Xóa trắng"
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'var(--grey-200)',
                      color: 'var(--text-muted)',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ✕
                  </button>
                )}
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
          ) : (
            /* CHẾ ĐỘ 2: BỘ CHỌN TỪNG PHẦN TRỰC QUAN (Tỉnh · Seri · Dãy 5 số) */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: 'var(--space-4)',
                background: 'var(--surface-sunken)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12, alignItems: 'flex-end' }}>
                {/* 1. Chọn / Nhập Mã Tỉnh */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: '13px', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                    1. Mã tỉnh / thành phố
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="43"
                      value={structuredParts.prov}
                      onChange={(e) => handleStructuredChange('prov', e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: 60,
                        height: 44,
                        textAlign: 'center',
                        fontSize: '18px',
                        fontWeight: 'var(--fw-bold)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-hairline)',
                        background: 'var(--white)',
                        outline: 'none',
                      }}
                    />
                    <select
                      value={structuredParts.prov}
                      onChange={(e) => handleStructuredChange('prov', e.target.value)}
                      style={{
                        flex: 1,
                        height: 44,
                        padding: '0 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-hairline)',
                        background: 'var(--white)',
                        fontSize: '14px',
                        color: 'var(--text-strong)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">-- Chọn nhanh tỉnh thành --</option>
                      {VIETNAM_PROVINCES.map((p) => (
                        <option key={p.code + p.name} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Ký hiệu Seri */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: '13px', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                    2. Ký hiệu Seri
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="text"
                      maxLength={3}
                      placeholder="A"
                      value={structuredParts.seri}
                      onChange={(e) => handleStructuredChange('seri', e.target.value.toUpperCase())}
                      style={{
                        width: 70,
                        height: 44,
                        textAlign: 'center',
                        fontSize: '18px',
                        fontWeight: 'var(--fw-bold)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-hairline)',
                        background: 'var(--white)',
                        outline: 'none',
                      }}
                    />
                    {/* Chip chọn nhanh ký tự seri */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {['A', 'B', 'C', 'H', 'K', 'F'].map((letter) => (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => handleStructuredChange('seri', letter)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-xs)',
                            border: structuredParts.seri === letter ? '1px solid var(--action-primary)' : '1px solid var(--border-hairline)',
                            background: structuredParts.seri === letter ? 'var(--action-primary-subtle, #fff7ed)' : 'var(--white)',
                            color: structuredParts.seri === letter ? 'var(--action-primary)' : 'var(--text-body)',
                            fontWeight: 'var(--fw-semibold)',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Dãy 5 số xe */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: '13px', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
                    3. Dãy số (5 chữ số)
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="164.36 hoặc 16436"
                    value={structuredParts.num}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      handleStructuredChange('num', val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAnalyze();
                    }}
                    style={{
                      height: 44,
                      padding: '0 12px',
                      fontSize: '18px',
                      fontWeight: 'var(--fw-bold)',
                      letterSpacing: '1px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-hairline)',
                      background: 'var(--white)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Hàng xem trước Mini & Nút Luận giải */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Xem trước:</span>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 14px',
                      background: '#ffffff',
                      border: '2px solid #334155',
                      borderRadius: 'var(--radius-xs)',
                      fontFamily: 'monospace',
                      fontWeight: '900',
                      fontSize: '16px',
                      letterSpacing: '1px',
                      color: '#0f172a',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    }}
                  >
                    <span>{structuredParts.prov || '43'}{structuredParts.seri || 'A'}</span>
                    <span>-</span>
                    <span>{structuredParts.num || '164.36'}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleAnalyze()}
                  style={{
                    height: 44,
                    padding: '0 24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 'var(--fw-bold)',
                  }}
                >
                  <Sparkles size={16} />
                  Luận giải ngay
                </Button>
              </div>
            </div>
          )}

          {/* HÀNG GỢI Ý MẪU THỬ NHANH (Quick Presets) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 2 }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={13} style={{ color: 'var(--action-primary)' }} />
              Thử nhanh mẫu biển:
            </span>
            {[
              { label: '43A-164.36 (Số của bạn)', val: '43A-164.36' },
              { label: '30K-888.88 (Ngũ quý 8)', val: '30K-888.88' },
              { label: '51K-686.86 (Lộc phát)', val: '51K-686.86' },
              { label: '29A-999.99 (Cửu đỉnh)', val: '29A-999.99' },
              { label: '14A-567.89 (Sảnh tiến)', val: '14A-567.89' },
              { label: '99A-397.79 (Thần tài)', val: '99A-397.79' },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => handleApplyPreset(preset.val)}
                style={{
                  border: '1px solid var(--border-hairline)',
                  background: plateInput === preset.val ? 'var(--action-primary-subtle, #fff7ed)' : 'var(--white)',
                  color: plateInput === preset.val ? 'var(--action-primary)' : 'var(--text-body)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: plateInput === preset.val ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  transition: 'all 120ms ease',
                }}
              >
                {preset.label}
              </button>
            ))}
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
            <span style={{ font: 'var(--type-caption)', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>
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
                border: '1px solid var(--border-hairline)',
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

      {/* KHU VỰC KẾT QUẢ LUẬN GIẢI */}
      {analyzedData && (
        <div ref={captureRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Card Hero: Tổng Điểm & Biển Số Đồ Họa chuẩn LUXURY UI CỦA DỰ ÁN */}
          <div
            style={{
              background: 'linear-gradient(135deg, #fffcf7 0%, #fff7eb 50%, #ffffff 100%)',
              border: '1px solid rgba(199, 91, 0, 0.22)',
              borderRadius: 'var(--radius-md)',
              padding: 'clamp(20px, 3.5vw, 32px)',
              boxShadow: '0 10px 30px -5px rgba(199, 91, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-5)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Họa tiết ánh vàng phong thủy chìm */}
            <div
              style={{
                position: 'absolute',
                top: -60,
                right: -60,
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(199, 91, 0, 0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Header thanh lịch */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <span
                  style={{
                    color: 'var(--action-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--fw-bold)',
                    textTransform: 'uppercase',
                    letterSpacing: '1.2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Sparkles size={14} />
                  KẾT QUẢ GIẢI MÃ PHONG THỦY BIỂN SỐ
                </span>
                <h3 style={{ margin: '6px 0 0', font: 'var(--type-display-2)', letterSpacing: 'var(--ls-display)', color: 'var(--text-strong)' }}>
                  Biển số: {analyzedData.formatted}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadImage}
                  style={{
                    background: 'var(--white)',
                    borderRadius: 'var(--radius-xs)',
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
                    background: 'var(--white)',
                    borderRadius: 'var(--radius-xs)',
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

            {/* Nội dung chính: Biển mô phỏng + Điểm phong thủy */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
                gap: 'var(--space-5)',
                alignItems: 'center',
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-5)',
                boxShadow: 'var(--shadow-inset-hairline)',
              }}
            >
              {/* Cột trái: Biển số đồ họa chuẩn sân khấu */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px',
                  background: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hairline)',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ width: '100%', maxWidth: vehicle === 'Xe máy' ? 220 : plateShape === 'long' ? 320 : 220 }}>
                  <PlateVisual
                    size="lg"
                    shape={vehicle === 'Xe máy' ? 'short' : plateShape}
                    prov={visualSplit.prov}
                    seri={visualSplit.seri}
                    num={visualSplit.num}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Badge tone="default">
                    Loại xe: {vehicle}
                  </Badge>
                  {analyzedData.provinceCode && (
                    <Badge tone="blue">
                      Mã tỉnh/thành: {analyzedData.provinceCode}
                    </Badge>
                  )}
                  {vehicle === 'Ô tô' && (
                    <div
                      style={{
                        display: 'inline-flex',
                        padding: 2,
                        background: 'var(--white)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-hairline)',
                        gap: 2,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setPlateShape('long')}
                        style={{
                          padding: '2px 8px',
                          border: 'none',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '11px',
                          fontWeight: plateShape === 'long' ? 'var(--fw-bold)' : 'var(--fw-medium)',
                          background: plateShape === 'long' ? 'var(--action-primary)' : 'transparent',
                          color: plateShape === 'long' ? 'var(--white)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        Biển dài
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlateShape('short')}
                        style={{
                          padding: '2px 8px',
                          border: 'none',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '11px',
                          fontWeight: plateShape === 'short' ? 'var(--fw-bold)' : 'var(--fw-medium)',
                          background: plateShape === 'short' ? 'var(--action-primary)' : 'transparent',
                          color: plateShape === 'short' ? 'var(--white)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        Biển vuông
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Cột phải: Điểm phong thủy & Huy hiệu */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span
                    style={{
                      fontSize: '56px',
                      fontWeight: '900',
                      lineHeight: 1,
                      color: analyzedData.rank.color,
                      fontFamily: 'var(--font-display, inherit)',
                    }}
                  >
                    {analyzedData.totalScore}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Thang điểm phong thủy</span>
                    <strong style={{ fontSize: '18px', color: 'var(--text-strong)' }}>/ 100 điểm</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-xs)',
                      background: analyzedData.rank.bgColor,
                      border: `1px solid ${analyzedData.rank.borderColor}`,
                      color: analyzedData.rank.color,
                      fontWeight: 'var(--fw-bold)',
                      fontSize: '13px',
                      letterSpacing: '.3px',
                    }}
                  >
                    {analyzedData.rank.title}
                  </span>

                  {analyzedData.napAm && (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--surface-sunken)',
                        border: '1px solid var(--border-hairline)',
                        color: 'var(--text-strong)',
                        fontSize: '13px',
                      }}
                    >
                      Mệnh chủ: <strong>{analyzedData.napAm.element} ({analyzedData.napAm.canChi})</strong>
                    </span>
                  )}
                </div>

                <p style={{ margin: 0, font: 'var(--type-body)', lineHeight: 1.55, color: 'var(--text-muted)' }}>
                  {analyzedData.rank.summary}
                </p>
              </div>
            </div>
          </div>

          {/* THANH CHUYỂN ĐỔI CHẾ ĐỘ LUẬN: NGẮN GỌN vs CHI TIẾT */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              paddingBottom: 6,
              borderBottom: '1px solid var(--border-hairline)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h3 style={{ margin: 0, font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>
                {analysisMode === 'brief' ? 'Luận giải phong thủy nhanh & Đúc kết vận thế' : 'Phân tích 5 chiều phong thủy chuyên sâu'}
              </h3>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                {analysisMode === 'brief'
                  ? 'Tổng kết súc tích điểm cát hung, bản mệnh và lời khuyên hành động cốt lõi.'
                  : 'Bóc tách chi tiết từng yếu tố Tiên Thiên Hà Đồ, Kinh Dịch, Tổng nút, Âm Dương và Thế số.'}
              </span>
            </div>

            {/* Switcher 2 Tab: Luận ngắn gọn vs Luận chi tiết */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--surface-sunken)',
                padding: 3,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setAnalysisMode('brief')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: analysisMode === 'brief' ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  background: analysisMode === 'brief' ? 'var(--white)' : 'transparent',
                  color: analysisMode === 'brief' ? 'var(--action-primary)' : 'var(--text-muted)',
                  boxShadow: analysisMode === 'brief' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 120ms ease',
                }}
              >
                <Zap size={14} />
                Luận ngắn gọn
              </button>

              <button
                type="button"
                onClick={() => setAnalysisMode('detailed')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: analysisMode === 'detailed' ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  background: analysisMode === 'detailed' ? 'var(--white)' : 'transparent',
                  color: analysisMode === 'detailed' ? 'var(--action-primary)' : 'var(--text-muted)',
                  boxShadow: analysisMode === 'detailed' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 120ms ease',
                }}
              >
                <BookOpen size={14} />
                Luận chi tiết (5 chiều)
              </button>
            </div>
          </div>

          {/* CHẾ ĐỘ 1: LUẬN NGẮN GỌN (ĐƠN GIẢN, TẬP TRUNG) */}
          {analysisMode === 'brief' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* 4 Thẻ Chỉ Số Cốt Lõi Tóm Tắt */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
                  gap: 'var(--space-3)',
                }}
              >
                {/* 1. Tổng Nút */}
                <div style={{ background: 'var(--white)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: 'var(--shadow-card)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'var(--fw-medium)' }}>1. Tổng nút (Nước số)</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <strong style={{ fontSize: '22px', color: 'var(--text-strong)' }}>{analyzedData.nutInfo?.nut ?? 0} Nút</strong>
                    <span style={{ fontSize: '12px', color: 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>{analyzedData.nutInfo?.label || ''}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{analyzedData.nutInfo?.desc || ''}</span>
                </div>

                {/* 2. Quẻ Dịch */}
                <div style={{ background: 'var(--white)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: 'var(--shadow-card)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'var(--fw-medium)' }}>2. Quẻ Kinh Dịch Mai Hoa</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <strong style={{ fontSize: '18px', color: 'var(--text-strong)' }}>Quẻ {analyzedData.queDich.queName}</strong>
                    <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: 'var(--radius-xs)', background: analyzedData.queDich.tone === 'dai-cat' ? '#dcfce7' : analyzedData.queDich.tone === 'cat' ? '#e0f2fe' : '#fef3c7', color: analyzedData.queDich.tone === 'dai-cat' ? '#15803d' : analyzedData.queDich.tone === 'cat' ? '#0369a1' : '#b45309', fontWeight: 'var(--fw-bold)' }}>
                      {analyzedData.queDich.tone === 'dai-cat' ? 'Đại Cát' : analyzedData.queDich.tone === 'cat' ? 'Cát Hanh' : 'Bình Hòa'}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {analyzedData.queDich.desc}
                  </span>
                </div>

                {/* 3. Ngũ Hành */}
                <div style={{ background: 'var(--white)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: 'var(--shadow-card)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'var(--fw-medium)' }}>3. Ngũ hành Tiên Thiên Hà Đồ</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <strong style={{ fontSize: '18px', color: 'var(--text-strong)' }}>Đuôi hành {analyzedData.lastElement}</strong>
                    {analyzedData.elementRelation && (
                      <span style={{ fontSize: '12px', color: analyzedData.elementRelation.tone === 'success' ? '#15803d' : analyzedData.elementRelation.tone === 'danger' ? '#be123c' : 'var(--action-primary)', fontWeight: 'var(--fw-semibold)' }}>
                        ({analyzedData.elementRelation.label})
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {analyzedData.elementRelation ? analyzedData.elementRelation.desc : `Chủ đạo mang hành ${analyzedData.lastElement}`}
                  </span>
                </div>

                {/* 4. Âm Dương & Thế Số */}
                <div style={{ background: 'var(--white)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: 'var(--shadow-card)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'var(--fw-medium)' }}>4. Âm Dương & Thế Số</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <strong style={{ fontSize: '18px', color: 'var(--text-strong)' }}>{analyzedData.amDuongInfo?.ratio || '—'}</strong>
                    <span style={{ fontSize: '12px', color: analyzedData.amDuongInfo?.balance === 'good' ? '#15803d' : 'var(--text-muted)', fontWeight: 'var(--fw-semibold)' }}>
                      ({analyzedData.amDuongInfo?.balance === 'good' ? 'Cân bằng' : 'Chưa cân bằng'})
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {analyzedData.patterns?.beauties?.length > 0 ? analyzedData.patterns.beauties.map((p) => p.name).join(', ') : 'Dãy số cân đối, dễ đọc, thuận hành trình'}
                  </span>
                </div>
              </div>

              {/* Thẻ Kết Luận Nhanh & Lời Khuyên Hành Động */}
              <div
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-4) var(--space-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} style={{ color: 'var(--action-primary)' }} />
                  <strong style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
                    Đúc kết luận giải & Lời khuyên hành động
                  </strong>
                </div>

                <div
                  style={{
                    padding: '12px 16px',
                    background: 'var(--surface-tint-cream)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid rgba(199, 91, 0, 0.12)',
                    font: 'var(--type-body)',
                    color: 'var(--text-strong)',
                    lineHeight: 1.6,
                  }}
                >
                  {analyzedData.totalScore >= 80 ? (
                    <span>
                      🌟 <strong>Biển số đại cát:</strong> Dãy số sở hữu cấu trúc vượng khí cao ({analyzedData.totalScore}/100 điểm), rất thuận lợi cho công danh, kinh doanh buôn bán và lộ trình di chuyển bình an. <strong>Khuyến nghị:</strong> Rất đáng giữ gìn và gắn bó lâu dài cùng phương tiện.
                    </span>
                  ) : analyzedData.totalScore >= 65 ? (
                    <span>
                      ⚖️ <strong>Biển số bình hòa - khá:</strong> Năng lượng dãy số ở mức ổn định ({analyzedData.totalScore}/100 điểm), không phạm đại kỵ. <strong>Khuyến nghị:</strong> Có thể tiếp tục sử dụng an tâm. Nếu muốn bứt phá tài lộc hoặc cầu đại cát, có thể tham khảo thêm các biển số cải vận bổ khuyết bên dưới.
                    </span>
                  ) : (
                    <span>
                      ⚠️ <strong>Biển số cần lưu ý cải vận:</strong> Dãy số có điểm nghẽn về tương khắc ngũ hành hoặc tổng số chưa tương trợ ({analyzedData.totalScore}/100 điểm). <strong>Khuyến nghị:</strong> Nên cân nhắc bổ khuyết bằng vật phẩm phong thủy hoặc đổi sang biển số hợp mệnh để gia tăng cát khí.
                    </span>
                  )}
                </div>

                {/* 2 Gạch đầu dòng tóm tắt */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '13px', color: 'var(--text-strong)' }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                    <span><strong>Ưu điểm lớn nhất:</strong> {analyzedData.patterns?.beauties?.[0]?.name ? `${analyzedData.patterns.beauties[0].name} (${analyzedData.patterns.beauties[0].desc})` : (analyzedData.nutInfo?.nut >= 7 ? `Tổng ${analyzedData.nutInfo.nut} nút — ${analyzedData.nutInfo.label}` : 'Dãy số cân đối, cấu trúc ổn định')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '13px', color: 'var(--text-strong)' }}>
                    <Info size={16} style={{ color: 'var(--action-primary)', flexShrink: 0, marginTop: 2 }} />
                    <span><strong>Điểm cần lưu ý:</strong> {analyzedData.improvementPoints?.[0] || 'Năng lượng biển số hài hòa, không có xung khắc lớn'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* CHẾ ĐỘ 2: PHÂN TÍCH 5 CHIỀU CHUYÊN SÂU */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* HÀNG 1: 2 Trọng Tâm Cốt Lõi (Ngũ Hành Hà Đồ & Quẻ Kinh Dịch Mai Hoa) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {/* Chiều 1: Ngũ Hành Hà Đồ & Bản Mệnh */}
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={18} style={{ color: 'var(--action-primary)' }} />
                  <strong style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
                    1. Ngũ hành Tiên Thiên Hà Đồ
                  </strong>
                </div>
                <Badge tone="blue">
                  Số đuôi hành {analyzedData.lastElement}
                </Badge>
              </div>

              {/* Từng số và màu ngũ hành Hà Đồ */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '4px 0' }}>
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
                        width: 48,
                        height: 54,
                        borderRadius: 'var(--radius-sm)',
                        background: c?.bg || '#f8fafc',
                        border: `1px solid ${c?.border || '#cbd5e1'}`,
                      }}
                    >
                      <span style={{ fontSize: '19px', fontWeight: 'var(--fw-bold)', color: c?.text || '#1e293b' }}>{d}</span>
                      <span style={{ fontSize: '11px', fontWeight: 'var(--fw-medium)', color: c?.badge || '#64748b' }}>{el}</span>
                    </div>
                  );
                })}
              </div>

              {/* Tương quan với bản mệnh */}
              {analyzedData.elementRelation ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
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
                    lineHeight: 1.5,
                    color: 'var(--text-strong)',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: 2, color: analyzedData.elementRelation.tone === 'success' ? '#065f46' : analyzedData.elementRelation.tone === 'danger' ? '#9f1239' : 'inherit' }}>
                    {analyzedData.elementRelation.label}:
                  </strong>
                  <span>{analyzedData.elementRelation.desc}</span>
                </div>
              ) : (
                <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Hành chủ đạo của biển là <strong>{analyzedData.lastElement}</strong> (theo số cuối {analyzedData.digits[analyzedData.digits.length - 1]}). Nhập thêm ngày sinh để biết mức độ tương hợp với bản mệnh của bạn.
                </p>
              )}

              {/* Phân bổ ngũ hành */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', font: 'var(--type-caption)', paddingTop: 2 }}>
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

            {/* Chiều 5: Quẻ Kinh Dịch Mai Hoa */}
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={18} style={{ color: 'var(--action-primary)' }} />
                  <strong style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
                    2. Quẻ Kinh Dịch Mai Hoa: Quẻ {analyzedData.queDich.queName}
                  </strong>
                </div>
                <Badge tone={analyzedData.queDich.tone === 'dai-cat' ? 'mint' : analyzedData.queDich.tone === 'cat' ? 'blue' : 'amber'}>
                  {analyzedData.queDich.tone === 'dai-cat' ? 'Đại Cát' : analyzedData.queDich.tone === 'cat' ? 'Cát Hanh' : 'Bình Hòa'}
                </Badge>
              </div>

              {/* Bát Quái Thượng / Hạ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '4px 0' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border-hairline)',
                    fontSize: '13px',
                    flex: '1 1 180px',
                  }}
                >
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>{analyzedData.queDich.thuongQue.symbol}</span>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Thượng quẻ</span>
                    <strong>{analyzedData.queDich.thuongQue.name} ({analyzedData.queDich.thuongQue.nature})</strong>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border-hairline)',
                    fontSize: '13px',
                    flex: '1 1 180px',
                  }}
                >
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>{analyzedData.queDich.haQue.symbol}</span>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Hạ quẻ</span>
                    <strong>{analyzedData.queDich.haQue.name} ({analyzedData.queDich.haQue.nature})</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-tint-cream)',
                  border: '1px solid rgba(199, 91, 0, 0.15)',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: 'var(--text-strong)',
                }}
              >
                <strong style={{ display: 'block', marginBottom: 2, color: 'var(--action-primary)' }}>
                  Ý nghĩa hành trình & sự nghiệp:
                </strong>
                <span>{analyzedData.queDich.desc}</span>
              </div>
            </div>
          </div>

          {/* HÀNG 2: 3 Thẻ Đều Nhau (Tổng Nút, Âm Dương, Thế Số) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(270px, 100%), 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {/* Chiều 3: Tổng Nút (Nước Số) */}
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={18} style={{ color: 'var(--action-primary)' }} />
                  <strong style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
                    3. Tổng nút (Nước số)
                  </strong>
                </div>
                <Badge tone={analyzedData.nutInfo.nut === 4 ? 'rose' : analyzedData.nutInfo.nut >= 8 ? 'mint' : 'amber'}>
                  {analyzedData.nutInfo.nut} Nút
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                    flexShrink: 0,
                  }}
                >
                  {analyzedData.nutInfo.nut}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    Tổng: {analyzedData.digits.join(' + ')} = {analyzedData.nutInfo.total}
                  </span>
                  <strong style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                    {analyzedData.nutInfo.label}
                  </strong>
                </div>
              </div>

              <p style={{ margin: 0, font: 'var(--type-body-sm)', lineHeight: 1.45, color: 'var(--text-muted)' }}>
                {analyzedData.nutInfo.desc}
              </p>
            </div>

            {/* Chiều 4: Âm Dương Tương Phối */}
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Compass size={18} style={{ color: 'var(--action-primary)' }} />
                  <strong style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
                    4. Âm Dương tương phối
                  </strong>
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
                <div style={{ height: 8, width: '100%', background: 'var(--grey-200, #e2e8f0)', borderRadius: 4, display: 'flex', overflow: 'hidden' }}>
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

              <p style={{ margin: 0, font: 'var(--type-body-sm)', lineHeight: 1.45, color: 'var(--text-muted)' }}>
                {analyzedData.amDuongInfo.desc}
              </p>
            </div>

            {/* Chiều 5: Thế Số & Cặp Số Tài Lộc / Cảnh Báo */}
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} style={{ color: 'var(--action-primary)' }} />
                  <strong style={{ font: 'var(--type-label)', color: 'var(--text-strong)' }}>
                    5. Thế số & Ý nghĩa dân gian
                  </strong>
                </div>
                {analyzedData.patterns.beauties.length > 0 && (
                  <Badge tone="mint">{analyzedData.patterns.beauties.length} thế số đẹp</Badge>
                )}
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
                        fontSize: '12px',
                      }}
                    >
                      <CheckCircle2 size={15} style={{ color: 'var(--status-success-ink, #065f46)', flexShrink: 0, marginTop: 2 }} />
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
                        fontSize: '12px',
                      }}
                    >
                      <AlertTriangle size={15} style={{ color: 'var(--status-danger)', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <strong style={{ color: 'var(--status-danger)' }}>{w.name}: </strong>
                        <span style={{ color: 'var(--text-strong)' }}>{w.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BẢNG ĐÁNH GIÁ ĐIỂM CÒN THIẾU & GỢI Ý CẢI VẬN */}
          <div
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              padding: 'clamp(20px, 3.5vw, 32px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-tint-cream)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--action-primary)',
                }}
              >
                <TrendingUp size={18} />
              </span>
              <h3 style={{ margin: 0, font: 'var(--type-title-2)', color: 'var(--text-strong)' }}>
                Các điểm còn thiếu & Tiêu chí cải thiện vận thế
              </h3>
            </div>

            {analyzedData.improvementPoints.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {analyzedData.improvementPoints.map((pt, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-tint-cream)',
                      border: '1px solid rgba(199, 91, 0, 0.15)',
                      fontSize: '14px',
                      color: 'var(--text-strong)',
                    }}
                  >
                    <ArrowRight size={16} style={{ color: 'var(--action-primary)', marginTop: 3, flexShrink: 0 }} />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--status-success-bg, #ecfdf5)', color: 'var(--status-success-ink, #065f46)' }}>
                Biển số của bạn đã đạt độ hài hòa rất cao, không có điểm khuyết nghiêm trọng nào!
              </div>
            )}
          </div>
        </div>
      )}

      {/* BÀI VIẾT PHONG THỦY & THẾ SỐ LIÊN QUAN */}
      {relevantArticles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ margin: 0, font: 'var(--type-title-1)', color: 'var(--text-strong)' }}>
                Bài viết phong thủy liên quan đến biển số & bản mệnh của bạn
              </h3>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                Kiến thức chuyên sâu giải mã thế số, ý nghĩa từng con số và cẩm nang chọn biển kích tài lộc
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => go('blog')()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 'var(--radius-xs)' }}
            >
              Xem tất cả bài viết
              <ArrowRight size={14} />
            </Button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {relevantArticles.map((article) => (
              <a
                key={article.slug}
                href={routeFor('post', article.slug)}
                onClick={(e) => {
                  e.preventDefault();
                  if (patch) {
                    patch({ screen: 'post', postId: article.slug, modal: false });
                  } else {
                    window.location.href = routeFor('post', article.slug);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--white)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--action-primary)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-hairline)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                {/* Header Thumbnail */}
                <div
                  style={{
                    height: 120,
                    background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    borderBottom: '1px solid var(--border-hairline)',
                  }}
                >
                  {article.thumbnailUrl ? (
                    <img
                      src={article.thumbnailUrl}
                      alt={article.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--action-primary)' }}>
                      <BookOpen size={28} />
                      <span style={{ fontSize: '11px', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Phong Thủy Số</span>
                    </div>
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(255,255,255,0.95)',
                      fontSize: '11px',
                      fontWeight: 'var(--fw-bold)',
                      color: 'var(--action-primary)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    {article.tag}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 'var(--fw-bold)',
                      color: 'var(--text-strong)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {article.title}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                    }}
                  >
                    {article.excerpt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)', marginTop: 4 }}>
                    <span>Đọc luận giải</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

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
                        padding: '6px 10px',
                        background: 'var(--surface-tint-cream)',
                        border: '1px solid rgba(199, 91, 0, 0.15)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '12px',
                        color: 'var(--action-primary)',
                        fontWeight: 'var(--fw-medium)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Sparkles size={13} />
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
