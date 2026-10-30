/**
 * Smart 3-in-1 Comment Lookup & FengShui Parser for TikTok Livestream Assist
 * Supports:
 * 1. Shorthand syntax: "30 68" (Province + Tail digits), "#B101" (ShortCode)
 * 2. Birth Year FengShui (1950-2015): Can Chi, Ngu Hanh Menh, Lucky Numbers, Streamer Talking Script
 * 3. Natural Viewer Comment NLP: "Tim bien Sai Gon than tai tam 400tr"
 */

const CAN_LIST = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'];
const CHI_LIST = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'];

// Bảng Lục Thập Hoa Giáp rút gọn theo Can + Chi để tính Ngũ Hành Nạp Âm chuẩn xác
const CAN_VALUES = {
  Giáp: 1, Ất: 1,
  Bính: 2, Đinh: 2,
  Mậu: 3, Kỷ: 3,
  Canh: 4, Tân: 4,
  Nhâm: 5, Quý: 5,
};

const CHI_VALUES = {
  Tý: 0, Sửu: 0, Ngọ: 0, Mùi: 0,
  Dần: 1, Mão: 1, Thân: 1, Dậu: 1,
  Thìn: 2, Tỵ: 2, Tuất: 2, Hợi: 2,
};

const MENH_BY_SUM = {
  1: {
    menh: 'Kim',
    napAm: 'Bạch Lạp / Kiếm Phong Kim',
    luckyDigits: ['6', '7', '8', '2', '5'],
    luckyLabel: '6, 7 (Bản mệnh Kim) & 2, 5, 8 (Thổ sinh Kim)',
    color: '#F59E0B',
    advice: 'Ưu tiên biển đuôi 68, 86, 6789, 7777, 8888 giúp聚 tài vượng khí, công danh sắc bén.',
  },
  2: {
    menh: 'Thủy',
    napAm: 'Giản Hạ / Đại Hải Thủy',
    luckyDigits: ['1', '6', '7'],
    luckyLabel: '1 (Bản mệnh Thủy) & 6, 7 (Kim sinh Thủy)',
    color: '#3B82F6',
    advice: 'Ưu tiên biển có nhiều số 1, 6, 7 như 6666, 7777, 168, 79 giúp dòng tiền hanh thông như nước.',
  },
  3: {
    menh: 'Hỏa',
    napAm: 'Lư Trung / Thiên Thượng Hỏa',
    luckyDigits: ['9', '3', '4'],
    luckyLabel: '9 (Bản mệnh Hỏa) & 3, 4 (Mộc sinh Hỏa)',
    color: '#EF4444',
    advice: 'Cực hợp số 9 (Cửu ngũ chí tôn), 39, 79 (Thần Tài), 9999 hoặc sảnh tiến 3456, 56789.',
  },
  4: {
    menh: 'Thổ',
    napAm: 'Lộ Bàng / Đại Trạch Thổ',
    luckyDigits: ['9', '2', '5', '8'],
    luckyLabel: '2, 5, 8 (Bản mệnh Thổ) & 9 (Hỏa sinh Thổ)',
    color: '#D97706',
    advice: 'Đại cát với số 8, 9 (Hỏa sinh Thổ, Phát đạt trường cửu): 68, 86, 79, 8888, 9999.',
  },
  5: {
    menh: 'Mộc',
    napAm: 'Đại Lâm / Tùng Bách Mộc',
    luckyDigits: ['1', '3', '4', '6', '8'],
    luckyLabel: '3, 4 (Bản mệnh Mộc) & 1, 6, 8 (Thủy dưỡng Mộc, Lộc Phát)',
    color: '#10B981',
    advice: 'Rất hợp thế số 39, 68, 86, 3333, 6868 hoặc sảnh tiến vươn cao như cây đại thụ.',
  },
};

const PROVINCE_KEYWORD_MAP = [
  { keywords: ['ha noi', 'hà nội', 'hn', 'thủ đô', 'thu do'], prov: '30', city: 'Hà Nội' },
  { keywords: ['sai gon', 'sài gòn', 'hcm', 'tp hcm', 'tp.hcm', 'tphcm', 'ho chi minh'], prov: '51', city: 'TP. HCM' },
  { keywords: ['da nang', 'đà nẵng', 'dn'], prov: '43', city: 'Đà Nẵng' },
  { keywords: ['quang ninh', 'quảng ninh', 'qn', 'ha long'], prov: '14', city: 'Quảng Ninh' },
  { keywords: ['hai phong', 'hải phòng', 'hp'], prov: '15', city: 'Hải Phòng' },
  { keywords: ['nghe an', 'nghệ an', 'vinh'], prov: '37', city: 'Nghệ An' },
  { keywords: ['thanh hoa', 'thanh hóa'], prov: '36', city: 'Thanh Hóa' },
  { keywords: ['binh duong', 'bình dương'], prov: '61', city: 'Bình Dương' },
  { keywords: ['dong nai', 'đồng nai', 'bien hoa'], prov: '60', city: 'Đồng Nai' },
  { keywords: ['can tho', 'cần thơ'], prov: '65', city: 'Cần Thơ' },
  { keywords: ['vung tau', 'vũng tàu', 'ba ria'], prov: '72', city: 'Bà Rịa - Vũng Tàu' },
  { keywords: ['bac ninh', 'bắc ninh'], prov: '99', city: 'Bắc Ninh' },
  { keywords: ['hung yen', 'hưng yên'], prov: '89', city: 'Hưng Yên' },
  { keywords: ['vinh phuc', 'vĩnh phúc'], prov: '88', city: 'Vĩnh Phúc' },
];

const PROV_CODE_TO_CITY = {
  '29': 'Hà Nội',
  '30': 'Hà Nội',
  '31': 'Hà Nội',
  '32': 'Hà Nội',
  '33': 'Hà Nội',
  '40': 'Hà Nội',
  '41': 'TP. HCM',
  '50': 'TP. HCM',
  '51': 'TP. HCM',
  '52': 'TP. HCM',
  '53': 'TP. HCM',
  '54': 'TP. HCM',
  '55': 'TP. HCM',
  '56': 'TP. HCM',
  '57': 'TP. HCM',
  '58': 'TP. HCM',
  '59': 'TP. HCM',
  '43': 'Đà Nẵng',
  '14': 'Quảng Ninh',
  '15': 'Hải Phòng',
  '16': 'Hải Phòng',
  '36': 'Thanh Hóa',
  '37': 'Nghệ An',
  '60': 'Đồng Nai',
  '61': 'Bình Dương',
  '65': 'Cần Thơ',
  '72': 'Bà Rịa - Vũng Tàu',
  '88': 'Vĩnh Phúc',
  '89': 'Hưng Yên',
  '99': 'Bắc Ninh',
};

const CATEGORY_KEYWORD_MAP = [
  { keywords: ['ngu quy', 'ngũ quý', '5 con'], cat: 'Ngũ quý' },
  { keywords: ['tu quy', 'tứ quý', '4 con'], cat: 'Tứ quý' },
  { keywords: ['tam hoa', '3 con'], cat: 'Tam hoa' },
  { keywords: ['loc phat', 'lộc phát', 'phat loc', 'phát lộc', '68', '86'], cat: 'Lộc phát' },
  { keywords: ['than tai', 'thần tài', '39', '79'], cat: 'Thần tài' },
  { keywords: ['sanh tien', 'sảnh tiến', 'sanh rong', 'sảnh rồng', 'tien len'], cat: 'Sảnh tiến' },
  { keywords: ['ong dia', 'ông địa', '38', '78'], cat: 'Ông địa' },
];

export function calculateBirthYearFengShui(year) {
  const y = Number(year);
  if (!Number.isInteger(y) || y < 1945 || y > 2020) return null;

  const can = CAN_LIST[y % 10];
  const chi = CHI_LIST[y % 12];
  const canChi = `${can} ${chi}`;

  let sum = (CAN_VALUES[can] || 1) + (CHI_VALUES[chi] || 0);
  if (sum > 5) sum -= 5;

  const info = MENH_BY_SUM[sum] || MENH_BY_SUM[4];

  const talkingScript = `Anh/chị sinh năm ${y} tuổi ${canChi} — Mệnh ${info.menh} (${info.napAm}), cực hợp các con số ${info.luckyLabel}. ${info.advice}`;

  return {
    year: y,
    canChi,
    menh: info.menh,
    napAm: info.napAm,
    luckyDigits: info.luckyDigits,
    luckyLabel: info.luckyLabel,
    color: info.color,
    advice: info.advice,
    talkingScript,
  };
}

export function parseNumericVnd(priceStrOrNum) {
  if (typeof priceStrOrNum === 'number') return priceStrOrNum;
  if (!priceStrOrNum) return 0;
  const digits = String(priceStrOrNum).replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

/**
 * Phân tích thông minh chuỗi tìm kiếm / bình luận của khách xem Live
 */
export function parseLiveSearchInput(rawInput) {
  const raw = (rawInput || '').trim();
  if (!raw) {
    return {
      raw: '',
      hasSmartMatch: false,
      shortCode: null,
      provCode: null,
      city: null,
      cat: null,
      tailDigits: null,
      birthYearInfo: null,
      maxBudgetVnd: null,
      minBudgetVnd: null,
      extractedTokens: [],
    };
  }

  const lower = raw.toLowerCase();
  const extractedTokens = [];

  // 1. ShortCode (#B101 or B101)
  const shortCodeMatch = raw.match(/#?b(\d{2,4})\b/i);
  const shortCode = shortCodeMatch ? `#B${shortCodeMatch[1]}` : null;
  if (shortCode) {
    extractedTokens.push({ type: 'code', label: `Mã: ${shortCode}` });
  }

  // 2. Birth Year (1950 - 2015)
  const yearMatch = raw.match(/\b(19[5-9]\d|20[0-1]\d)\b/);
  const birthYearInfo = yearMatch ? calculateBirthYearFengShui(Number(yearMatch[1])) : null;
  if (birthYearInfo) {
    extractedTokens.push({
      type: 'fengshui',
      label: `Tuổi ${birthYearInfo.year} (${birthYearInfo.canChi} • Mệnh ${birthYearInfo.menh})`,
    });
  }

  // 3. Budget Parser ("tầm 400tr", "dưới 500tr", "1.5 tỷ", "300 triệu")
  let maxBudgetVnd = null;
  let minBudgetVnd = null;
  const tyMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:tỷ|ty|tỉ|ti)\b/);
  const trieuMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|trieu|tr|củ|cu)\b/);

  if (tyMatch) {
    const val = parseFloat(tyMatch[1].replace(',', '.')) * 1_000_000_000;
    if (lower.includes('dưới') || lower.includes('duoi') || lower.includes('<')) {
      maxBudgetVnd = val;
    } else if (lower.includes('trên') || lower.includes('tren') || lower.includes('>')) {
      minBudgetVnd = val;
    } else {
      minBudgetVnd = val * 0.65;
      maxBudgetVnd = val * 1.35;
    }
    extractedTokens.push({
      type: 'budget',
      label: `Ngân sách ~${tyMatch[1]} tỷ`,
    });
  } else if (trieuMatch) {
    const val = parseFloat(trieuMatch[1].replace(',', '.')) * 1_000_000;
    if (lower.includes('dưới') || lower.includes('duoi') || lower.includes('<')) {
      maxBudgetVnd = val;
    } else if (lower.includes('trên') || lower.includes('tren') || lower.includes('>')) {
      minBudgetVnd = val;
    } else {
      minBudgetVnd = val * 0.6;
      maxBudgetVnd = val * 1.4;
    }
    extractedTokens.push({
      type: 'budget',
      label: `Ngân sách ~${trieuMatch[1]} triệu`,
    });
  }

  // 4. Province by name or shorthand ("30 68")
  let provCode = null;
  let city = null;

  for (const item of PROVINCE_KEYWORD_MAP) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      provCode = item.prov;
      city = item.city;
      break;
    }
  }

  // Shorthand "30 68" or "51 9999" or "1990 30"
  let tailDigits = null;
  const shorthandMatch = raw.match(/^\s*(\d{2})\s+(\d{2,5})\s*$/);
  if (shorthandMatch) {
    const pCode = shorthandMatch[1];
    const tDigits = shorthandMatch[2];
    if (PROV_CODE_TO_CITY[pCode]) {
      provCode = pCode;
      city = PROV_CODE_TO_CITY[pCode];
      tailDigits = tDigits;
    }
  } else {
    // Check if there is a 2-digit province code alongside birth year e.g. "1990 30"
    const tokens = raw.split(/\s+/);
    for (const tk of tokens) {
      if (/^\d{2}$/.test(tk) && PROV_CODE_TO_CITY[tk] && !provCode) {
        // If there are multiple tokens (not just a single 2-digit tail search like "68")
        if (tokens.length >= 2) {
          provCode = tk;
          city = PROV_CODE_TO_CITY[tk];
        }
      } else if (/^\d{2,5}$/.test(tk) && tk !== yearMatch?.[1] && tk !== provCode) {
        tailDigits = tk;
      }
    }
  }

  if (city) {
    extractedTokens.push({
      type: 'city',
      label: `Tỉnh: ${city} (${provCode})`,
    });
  }
  if (tailDigits) {
    extractedTokens.push({
      type: 'tail',
      label: `Đuôi/Số: ${tailDigits}`,
    });
  }

  // 5. Category by keyword
  let cat = null;
  for (const item of CATEGORY_KEYWORD_MAP) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      cat = item.cat;
      break;
    }
  }
  if (cat) {
    extractedTokens.push({
      type: 'cat',
      label: `Thế số: ${cat}`,
    });
  }

  const hasSmartMatch =
    Boolean(shortCode) ||
    Boolean(birthYearInfo) ||
    Boolean(city) ||
    Boolean(cat) ||
    Boolean(tailDigits) ||
    Boolean(maxBudgetVnd) ||
    Boolean(minBudgetVnd);

  return {
    raw,
    hasSmartMatch,
    shortCode,
    provCode,
    city,
    cat,
    tailDigits,
    birthYearInfo,
    maxBudgetVnd,
    minBudgetVnd,
    extractedTokens,
  };
}

