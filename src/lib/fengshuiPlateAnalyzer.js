// Thuật toán luận giải phong thủy biển số toàn diện cho BienSoDep
// Phân tích 5 chiều: Ngũ hành Hà Đồ, Tổng nút, Âm Dương tương phối, Thế số tài lộc & cảnh báo, Quẻ Kinh Dịch Mai Hoa.

// 1. Map Hà Đồ: Chữ số -> Ngũ hành
export const DIGIT_ELEMENTS = {
  1: 'Mộc', 2: 'Mộc',
  3: 'Hỏa', 4: 'Hỏa',
  5: 'Thổ', 6: 'Thổ',
  7: 'Kim', 8: 'Kim',
  9: 'Thủy', 0: 'Thủy',
};

export const ELEMENT_COLORS = {
  Kim: { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155', dot: '#94a3b8' },
  Mộc: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', dot: '#10b981' },
  Thủy: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6' },
  Hỏa: { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', dot: '#f43f5e' },
  Thổ: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
};

// Vòng tương sinh: A sinh B
export const SINH_CYCLE = {
  Kim: 'Thủy',
  Thủy: 'Mộc',
  Mộc: 'Hỏa',
  Hỏa: 'Thổ',
  Thổ: 'Kim',
};

// Vòng tương khắc: A khắc B
export const KHAC_CYCLE = {
  Kim: 'Mộc',
  Mộc: 'Thổ',
  Thổ: 'Thủy',
  Thủy: 'Hỏa',
  Hỏa: 'Kim',
};

// Nạp âm 60 Hoa Giáp tính theo năm sinh dương lịch (đồng bộ 100% với FengShuiCalculator backend)
const TRAD_CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const TRAD_CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const NAP_AM_ELEMENTS = [
  'Kim', 'Hỏa', 'Mộc', 'Thổ', 'Kim', 'Hỏa',   // 0-5
  'Thủy', 'Thổ', 'Kim', 'Mộc', 'Thủy', 'Thổ', // 6-11
  'Hỏa', 'Mộc', 'Thủy', 'Kim', 'Hỏa', 'Mộc',  // 12-17
  'Thổ', 'Kim', 'Hỏa', 'Thủy', 'Thổ', 'Kim',  // 18-23
  'Mộc', 'Thủy', 'Thổ', 'Hỏa', 'Mộc', 'Thủy', // 24-29
];

export function computeNapAmFromYear(birthYear) {
  if (!birthYear || birthYear < 1900 || birthYear > 2100) return null;
  let t = (birthYear - 4) % 60;
  if (t < 0) t += 60;
  const can = TRAD_CAN[t % 10];
  const chi = TRAD_CHI[t % 12];
  const element = NAP_AM_ELEMENTS[Math.floor(t / 2)];
  
  // Hành sinh mệnh chủ (hợp nhất)
  const sinhChoMe = Object.entries(SINH_CYCLE).find(([, v]) => v === element)?.[0] || 'Thổ';
  // Hành khắc mệnh chủ (cần tránh)
  const khacMe = Object.entries(KHAC_CYCLE).find(([, v]) => v === element)?.[0] || 'Hỏa';

  return {
    canChi: `${can} ${chi}`,
    element,
    sinhChoMe,
    khacMe,
  };
}

// Bóc tách biển số Việt Nam
export function parsePlateInput(raw) {
  if (!raw) return null;
  const clean = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 5) return null;

  // Lấy 2 số đầu làm mã tỉnh (nếu có)
  const matchProvince = clean.match(/^(\d{2})/);
  const provinceCode = matchProvince ? matchProvince[1] : '';

  // Trích xuất toàn bộ chữ số
  const digitsOnly = clean.replace(/\D/g, '');
  // Nếu có mã tỉnh ở đầu và dài hơn 2 số, dãy số chính là các số sau mã tỉnh
  let series = '';
  if (digitsOnly.length > 2 && matchProvince) {
    series = digitsOnly.slice(2);
  } else {
    series = digitsOnly;
  }

  // Lấy tối đa 5 số cuối nếu dãy quá dài (chuẩn biển số 5 số hiện hành)
  if (series.length > 5) {
    series = series.slice(-5);
  }

  // Format hiển thị chuẩn: ví dụ 43A-888.88
  let formatted = raw.trim();
  if (series.length === 5 && provinceCode) {
    const letters = clean.replace(/[^A-Z]/g, '') || 'A';
    formatted = `${provinceCode}${letters}-${series.slice(0, 3)}.${series.slice(3)}`;
  }

  return {
    raw: raw.trim(),
    formatted,
    provinceCode,
    series, // dãy số chính (ví dụ "88888" hoặc "12345")
    digits: series.split('').map(Number),
  };
}

// 8 Quẻ Đơn (Bát Quái) - Mai Hoa Dịch Số
export const BAT_QUAI = {
  1: { name: 'Càn', symbol: '☰', nature: 'Thiên (Trời)', element: 'Kim', meaning: 'Cương kiện, lãnh đạo, khởi đầu mạnh mẽ' },
  2: { name: 'Đoài', symbol: '☱', nature: 'Trạch (Đầm)', element: 'Kim', meaning: 'Hỷ duyệt, mềm mỏng, giao thiệp thuận lợi' },
  3: { name: 'Ly', symbol: '☲', nature: 'Hỏa (Lửa)', element: 'Hỏa', meaning: 'Sáng tỏ, danh tiếng, trí tuệ soi đường' },
  4: { name: 'Chấn', symbol: '☳', nature: 'Lôi (Sấm)', element: 'Mộc', meaning: 'Hành động, bộc phát, quyết đoán tiến bước' },
  5: { name: 'Tốn', symbol: '☴', nature: 'Phong (Gió)', element: 'Mộc', meaning: 'Thuận thảo, mềm dẻo, thẩm thấu lan tỏa' },
  6: { name: 'Khảm', symbol: '☵', nature: 'Thủy (Nước)', element: 'Thủy', meaning: 'Hiểm trở, linh hoạt, vượt qua thử thách' },
  7: { name: 'Cấn', symbol: '☶', nature: 'Sơn (Núi)', element: 'Thổ', meaning: 'Ngưng nghỉ, vững chắc, định tâm giữ của' },
  8: { name: 'Khôn', symbol: '☷', nature: 'Địa (Đất)', element: 'Thổ', meaning: 'Nhu thuận, bao dung, tích lũy trường tồn' },
  0: { name: 'Khôn', symbol: '☷', nature: 'Địa (Đất)', element: 'Thổ', meaning: 'Nhu thuận, bao dung, tích lũy trường tồn' },
};

// 64 Quẻ Kinh Dịch tiêu biểu cho Biển Số Xe
const QUE_DICHS = {
  '1-1': { name: 'Thuần Càn', tone: 'dai-cat', desc: 'Rồng bay trên trời. Vận thế cực thịnh, công danh rộng mở, xe đi ngàn dặm bình an thuận lợi.' },
  '8-8': { name: 'Thuần Khôn', tone: 'dai-cat', desc: 'Đất mẹ chở che. Nhu thuận sinh tài, đi đường an toàn, bền bỉ tích lũy gia tài vững như bàn thạch.' },
  '8-1': { name: 'Địa Thiên Thái', tone: 'dai-cat', desc: 'Trời đất giao hòa, vạn vật hanh thông. Biển số đại cát, tài lộc dồi dào, xuất hành như ý.' },
  '1-8': { name: 'Thiên Địa Bĩ', tone: 'hung', desc: 'Bế tắc chưa thông. Khuyên nên thận trọng trong kinh doanh và giữ tốc độ an toàn khi đi xa.' },
  '3-1': { name: 'Hỏa Thiên Đại Hữu', tone: 'dai-cat', desc: 'Mặt trời giữa trời cao. Tài sản dồi dào, quý nhân phù trợ, biển số mang năng lượng vượng phát bậc nhất.' },
  '1-3': { name: 'Thiên Hỏa Đồng Nhân', tone: 'dai-cat', desc: 'Cùng chí hướng, bạn hữu tương trợ. Hợp làm ăn lớn, kết nối giao thương rộng rãi.' },
  '5-4': { name: 'Phong Lôi Ích', tone: 'dai-cat', desc: 'Gió sấm trợ lực. Ngày càng tăng tiến, lợi tức dồi dào, thăng quan tiến chức nhanh chóng.' },
  '4-5': { name: 'Lôi Phong Hằng', tone: 'cat', desc: 'Bền vững dài lâu. Đạo nghĩa kiên định, xe cộ ít hỏng hóc, sự nghiệp ổn định phát triển.' },
  '1-6': { name: 'Thiên Thủy Tụng', tone: 'trung-binh', desc: 'Tranh chấp bất hòa. Cần nhường nhịn khi tham gia giao thông và rõ ràng trong hợp đồng.' },
  '6-1': { name: 'Thủy Thiên Nhu', tone: 'cat', desc: 'Chờ thời cơ chín muồi. Ăn no uống say chờ vận sáng, điềm tĩnh lái xe ắt gặt hái thành công.' },
  '2-1': { name: 'Trạch Thiên Quải', tone: 'cat', desc: 'Quyết đoán dứt khoát. Khai thông bế tắc, tiến lên phía trước thuận lợi.' },
  '1-2': { name: 'Thiên Trạch Lý', tone: 'cat', desc: 'Giẫm đuôi cọp mà cọp không cắn. Giữ đúng luật lệ thì mọi nguy hiểm đều hóa an lành.' },
  '3-8': { name: 'Hỏa Địa Tấn', tone: 'dai-cat', desc: 'Mặt trời mọc trên mặt đất. Tiến bước quang minh, danh tiếng lẫy lừng, phát tài phát lộc.' },
  '8-3': { name: 'Địa Hỏa Minh Di', tone: 'trung-binh', desc: 'Ánh sáng lặn vào đất. Cần giấu tài chờ thời, lái xe cẩn trọng ban đêm.' },
  '5-1': { name: 'Phong Thiên Tiểu Súc', tone: 'cat', desc: 'Tích lũy nhỏ thành lớn. Cần kiên nhẫn tích góp, bước đầu thuận lợi.' },
  '1-5': { name: 'Thiên Phong Cấu', tone: 'cat', desc: 'Gặp gỡ bất ngờ, duyên lành đưa tới. Rất hợp cho người hay đi công tác, mở rộng quan hệ.' },
  '7-1': { name: 'Sơn Thiên Đại Súc', tone: 'dai-cat', desc: 'Chứa đựng lớn lao, đức dày tài vượng. Hợp gom góp của cải, mua xe tích lũy cơ đồ.' },
  '1-7': { name: 'Thiên Sơn Độn', tone: 'trung-binh', desc: 'Lùi một bước trời cao biển rộng. Cần bình tĩnh khi gặp trở ngại trên đường đời.' },
};

export function computeQueDich(series) {
  if (!series || series.length < 2) {
    return {
      thuongQue: BAT_QUAI[1],
      haQue: BAT_QUAI[1],
      queName: 'Thuần Càn',
      tone: 'dai-cat',
      desc: 'Dãy số chứa năng lượng tích cực, hanh thông.',
    };
  }

  const mid = Math.floor(series.length / 2);
  const upperPart = series.slice(0, mid);
  const lowerPart = series.slice(mid);

  const sumUpper = upperPart.split('').reduce((a, b) => a + Number(b), 0);
  const sumLower = lowerPart.split('').reduce((a, b) => a + Number(b), 0);

  let uNum = sumUpper % 8;
  if (uNum === 0) uNum = 8;
  let lNum = sumLower % 8;
  if (lNum === 0) lNum = 8;

  const thuongQue = BAT_QUAI[uNum] || BAT_QUAI[1];
  const haQue = BAT_QUAI[lNum] || BAT_QUAI[1];

  const key = `${uNum}-${lNum}`;
  const que = QUE_DICHS[key] || {
    name: `${thuongQue.name} ${haQue.name}`,
    tone: 'cat',
    desc: `Quẻ kết hợp giữa ${thuongQue.nature} và ${haQue.nature}. Vạn sự khởi sắc, an tâm di chuyển, cầu tài đắc tài.`,
  };

  return {
    thuongQue,
    haQue,
    queKey: key,
    queName: que.name,
    tone: que.tone,
    desc: que.desc,
  };
}

// Luận giải chi tiết tổng nút
export function analyzeNut(series) {
  if (!series) return { nut: 0, label: '—', tone: 'neutral', desc: '' };
  const total = series.split('').reduce((a, b) => a + Number(b), 0);
  const nut = total % 10;

  const NUT_DETAILS = {
    9: { label: 'Đại Cát — Cửu Đỉnh', tone: 'success', desc: '9 nút là con số đỉnh cao của sự viên mãn, trường cửu, tài lộc vĩnh cửu. Xe mang 9 nút đem lại may mắn tột đỉnh.' },
    8: { label: 'Phát Đạt — Tài Lộc', tone: 'success', desc: '8 nút tượng trưng cho "Phát" — công danh sự nghiệp phát triển không ngừng, buôn may bán đắt.' },
    7: { label: 'Cát Vận — Quyền Uy', tone: 'success', desc: '7 nút mang năng lượng quyền lực, quý nhân nâng đỡ, vượt mọi khó khăn trên hành trình.' },
    6: { label: 'Lộc Tới — Hanh Thông', tone: 'success', desc: '6 nút tượng trưng cho "Lộc" — tài lộc dồi dào, đi đến đâu có của ăn của để đến đó.' },
    5: { label: 'Phúc Đức — Cân Bằng', tone: 'primary', desc: '5 nút là con số trung cung, mang lại phúc đức gia hòa, bình an mọi nẻo đường.' },
    3: { label: 'Tài Lộc Khá', tone: 'primary', desc: '3 nút tượng trưng cho tiền tài đang sinh sôi, vững như kiềng ba chân.' },
    2: { label: 'Cát Vận — Bình An', tone: 'neutral', desc: '2 nút mang lại sự êm đềm, thuận hòa, gia đình êm ấm.' },
    1: { label: 'Khởi Điểm Nhất Quán', tone: 'neutral', desc: '1 nút là khởi đầu mới mẻ, kiên định với mục tiêu.' },
    0: { label: 'Bình Hòa — Cần Tích Tụ', tone: 'warning', desc: '0 nút (10 hoặc 20, 30) ngụ ý tài lộc đến đỉnh dễ phân tán, cần tích lũy công đức và lái xe từ tốn.' },
    4: { label: 'Hung Kỵ — Nút "Tử"', tone: 'danger', desc: '4 nút theo âm Hán Việt là "Tử", dân gian kiêng kỵ vì dễ hao tài tốn của. Nên hóa giải hoặc tham khảo đổi biển cải vận.' },
  };

  return {
    total,
    nut,
    ...(NUT_DETAILS[nut] || { label: 'Bình Hòa', tone: 'neutral', desc: 'Tổng nút hài hòa.' }),
  };
}

// Phân tích Âm Dương
export function analyzeAmDuong(series) {
  if (!series) return { am: 0, duong: 0, ratio: '—', balance: 'neutral', desc: '' };
  let am = 0; // chẵn
  let duong = 0; // lẻ

  for (const c of series) {
    const n = Number(c);
    if (n % 2 === 0) am++;
    else duong++;
  }

  const isBalanced = (am === 2 && duong === 3) || (am === 3 && duong === 2);
  const isAllAm = am === series.length;
  const isAllDuong = duong === series.length;

  let balance = 'good';
  let desc = 'Âm Dương cân bằng hài hòa (2/3 hoặc 3/2). Năng lượng đất trời phối ngẫu, xe cộ vận hành êm ái, chủ xe tâm trí sáng suốt.';

  if (isAllAm) {
    balance = 'skewed';
    desc = 'Thuần Âm (toàn số chẵn). Khí âm quá thịnh, dễ sinh tâm lý trầm lặng, thiếu tính đột phá trong công việc.';
  } else if (isAllDuong) {
    balance = 'skewed';
    desc = 'Thuần Dương (toàn số lẻ). Khí dương quá mạnh, tính cách dễ nóng nảy khi cầm lái, cần điều hòa năng lượng.';
  } else if (!isBalanced) {
    balance = 'moderate';
    desc = 'Tỷ lệ Âm Dương hơi chênh lệch (4/1 hoặc 1/4). Vẫn giữ được sự bình ổn nhưng nên bổ sung vật phẩm phong thủy cân bằng sinh khí.';
  }

  return {
    am,
    duong,
    ratio: `${am} Âm / ${duong} Dương`,
    balance,
    desc,
  };
}

// Phát hiện các thế số đẹp và các con số cảnh báo
export function detectPatterns(series) {
  if (!series) return { beauties: [], warnings: [] };
  const beauties = [];
  const warnings = [];

  // 1. Ngũ quý
  if (/^(\d)\1{4}$/.test(series)) {
    beauties.push({ name: `Ngũ Quý ${series[0]}`, tone: 'dai-cat', desc: '5 số giống nhau tuyệt đối — Cực phẩm vạn người mê, đại phú đại quý.' });
  }
  // 2. Tứ quý
  else if (/(\d)\1{3}/.test(series)) {
    const digit = series.match(/(\d)\1{3}/)[1];
    beauties.push({ name: `Tứ Quý ${digit}`, tone: 'dai-cat', desc: `4 số ${digit} liền kề — Đẳng cấp quyền quý, uy danh vang dội.` });
  }
  // 3. Tam hoa
  else if (/(\d)\1{2}/.test(series)) {
    const digit = series.match(/(\d)\1{2}/)[1];
    beauties.push({ name: `Tam Hoa ${digit}`, tone: 'cat', desc: `3 số ${digit} hội tụ — May mắn, dễ nhớ, làm ăn phát đạt.` });
  }

  // 4. Sảnh tiến
  if (/(012|123|234|345|456|567|678|789)/.test(series)) {
    beauties.push({ name: 'Sảnh Tiến May Mắn', tone: 'dai-cat', desc: 'Dãy số tăng dần liên tục — Tiền đồ thăng tiến, sự nghiệp đi lên không ngừng.' });
  }

  // 5. Cặp số tài lộc dân gian
  if (series.includes('68') || series.includes('86')) {
    beauties.push({ name: 'Lộc Phát (68/86)', tone: 'dai-cat', desc: 'Cặp số vàng trong kinh doanh — Lộc sinh sôi, phát tài phát lộc.' });
  }
  if (series.includes('39') || series.includes('79')) {
    beauties.push({ name: 'Thần Tài (39/79)', tone: 'dai-cat', desc: 'Được Thần Tài phù trợ — Tiền bạc hanh thông, quý nhân giúp đỡ.' });
  }
  if (series.includes('38') || series.includes('78')) {
    beauties.push({ name: 'Ông Địa (38/78)', tone: 'cat', desc: 'Ông Địa giữ của — Rất tốt cho bất động sản, tích lũy đất đai bền vững.' });
  }

  // 6. Gánh đối xứng (ABBA) hoặc Đôi
  if (series.length >= 4) {
    const last4 = series.slice(-4);
    if (last4[0] === last4[3] && last4[1] === last4[2] && last4[0] !== last4[1]) {
      beauties.push({ name: `Số Gánh (${last4})`, tone: 'cat', desc: 'Đối xứng cân bằng — Gánh tài gánh lộc, hóa giải tai ương.' });
    }
  }
  if (series.length >= 2 && series[series.length - 1] === series[series.length - 2]) {
    beauties.push({ name: `Số Đôi Cuối (${series.slice(-2)})`, tone: 'cat', desc: 'Cặp số đuôi lặp lại — Dễ nhớ, tròn trịa, gắn kết bền lâu.' });
  }

  // 7. Cảnh báo các con số nhạy cảm dân gian
  if (series.includes('49') && series.includes('53')) {
    warnings.push({ name: 'Chứa Cặp 49 và 53', desc: 'Dân gian kiêng kỵ "49 chưa qua 53 đã tới" — Nhắc nhở chủ xe luôn giữ tâm an, lái xe cẩn trọng.' });
  } else {
    if (series.includes('49')) warnings.push({ name: 'Chứa số 49', desc: 'Con số nhạy cảm theo quan niệm dân gian, nên cẩn trọng khi đi đường dài.' });
    if (series.includes('53')) warnings.push({ name: 'Chứa số 53', desc: 'Dân gian coi là số hạn tuổi, cần chú ý bảo dưỡng xe định kỳ.' });
  }

  if (series.endsWith('4')) {
    warnings.push({ name: 'Số Cuối 4 (Tử)', desc: 'Đuôi số mang âm hưởng "Tử", năng lượng tài lộc chưa được thông thoáng.' });
  }
  if (series.endsWith('7')) {
    warnings.push({ name: 'Số Cuối 7 (Thất)', desc: 'Dân gian kiêng số cuối 7 vì âm Hán là "Thất" (thất thoát), nên bổ trợ thêm bằng vật phẩm tương sinh.' });
  }

  return { beauties, warnings };
}

// Thuật toán chấm điểm tổng thể (0 - 100) & Luận giải toàn diện
export function analyzeFullPlateFengShui({ plateInput, birthYear, purpose, industry }) {
  const parsed = parsePlateInput(plateInput);
  if (!parsed || !parsed.series) return null;

  const { series, formatted, provinceCode, digits } = parsed;

  // 1. Phân tích ngũ hành các số theo Hà Đồ
  const elementCounts = { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 };
  digits.forEach((d) => {
    const el = DIGIT_ELEMENTS[d];
    if (el) elementCounts[el]++;
  });

  const lastDigit = digits[digits.length - 1];
  const lastElement = DIGIT_ELEMENTS[lastDigit] || 'Thổ';

  // Tìm hành khuyết (bằng 0) và hành vượng (cao nhất)
  const missingElements = Object.entries(elementCounts).filter(([, c]) => c === 0).map(([k]) => k);
  const dominantElement = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Kim';

  // 2. Thông tin bản mệnh người dùng (nếu có)
  const napAm = birthYear ? computeNapAmFromYear(birthYear) : null;
  let elementRelation = null;
  let elementScore = 20; // cơ sở ngũ hành

  if (napAm) {
    const userEl = napAm.element;
    const plateEl = lastElement;

    if (SINH_CYCLE[plateEl] === userEl) {
      elementRelation = {
        type: 'sinh-nhap',
        label: 'Sinh Nhập (Đại Cát)',
        tone: 'success',
        desc: `Biển số mang hành ${plateEl} Tương Sinh cho mệnh ${userEl} của bạn (${plateEl} sinh ${userEl}). Biển số như quý nhân luôn nâng đỡ vận mệnh, đem lại may mắn và bình an vượt trội.`,
      };
      elementScore = 32;
    } else if (plateEl === userEl) {
      elementRelation = {
        type: 'tuong-hoa',
        label: 'Tương Hòa (Cát Lợi)',
        tone: 'success',
        desc: `Biển số và bản mệnh cùng mang hành ${userEl}. Đồng hành tương trợ, khí chất tương đồng, làm ăn vững chãi.`,
      };
      elementScore = 26;
    } else if (KHAC_CYCLE[userEl] === plateEl) {
      elementRelation = {
        type: 'khac-xuat',
        label: 'Khắc Xuất (Bình Thường)',
        tone: 'neutral',
        desc: `Bản mệnh ${userEl} khắc chế được hành ${plateEl} của biển số. Chủ xe làm chủ được phương tiện, tuy nhiên có phần hao phí tâm lực điều khiển.`,
      };
      elementScore = 18;
    } else if (SINH_CYCLE[userEl] === plateEl) {
      elementRelation = {
        type: 'sinh-xuat',
        label: 'Sinh Xuất (Hao Lực)',
        tone: 'warning',
        desc: `Bản mệnh ${userEl} sinh cho hành ${plateEl} của biển (${userEl} sinh ${plateEl}). Năng lượng bản thân phải nuôi dưỡng biển số, dễ sinh cảm giác mệt mỏi, tài lộc ra nhiều hơn vào.`,
      };
      elementScore = 14;
    } else {
      elementRelation = {
        type: 'khac-nhap',
        label: 'Khắc Nhập (Hung Kỵ)',
        tone: 'danger',
        desc: `Hành ${plateEl} của biển số Tương Khắc trực tiếp với bản mệnh ${userEl} (${plateEl} khắc ${userEl}). Rất dễ gặp trục trặc bất ngờ, xe cộ hay trầy xước, công việc trắc trở. Rất nên cân nhắc cải vận hoặc đổi biển hợp mệnh.`,
      };
      elementScore = 8;
    }
  }

  // 3. Phân tích Nút
  const nutInfo = analyzeNut(series);
  let nutScore = 15;
  if (nutInfo.nut === 9 || nutInfo.nut === 8) nutScore = 24;
  else if (nutInfo.nut === 7 || nutInfo.nut === 6) nutScore = 20;
  else if (nutInfo.nut === 5 || nutInfo.nut === 3) nutScore = 16;
  else if (nutInfo.nut === 2 || nutInfo.nut === 1) nutScore = 12;
  else if (nutInfo.nut === 0) nutScore = 10;
  else if (nutInfo.nut === 4) nutScore = 4; // Kỵ nút 4

  // 4. Phân tích Âm Dương
  const amDuongInfo = analyzeAmDuong(series);
  let amDuongScore = 10;
  if (amDuongInfo.balance === 'good') amDuongScore = 15;
  else if (amDuongInfo.balance === 'moderate') amDuongScore = 10;
  else amDuongScore = 5;

  // 5. Thế số & Cặp số
  const patterns = detectPatterns(series);
  let patternScore = 12;
  patterns.beauties.forEach((b) => {
    if (b.tone === 'dai-cat') patternScore += 8;
    else patternScore += 4;
  });
  patterns.warnings.forEach(() => {
    patternScore -= 6;
  });
  patternScore = Math.max(2, Math.min(25, patternScore));

  // 6. Quẻ Kinh Dịch
  const queDich = computeQueDich(series);
  let queScore = 10;
  if (queDich.tone === 'dai-cat') queScore = 15;
  else if (queDich.tone === 'cat') queScore = 12;
  else if (queDich.tone === 'trung-binh') queScore = 8;
  else queScore = 4;

  // Tổng điểm tổng hợp (Max 100)
  let totalScore = Math.round(elementScore + nutScore + amDuongScore + patternScore + queScore);
  totalScore = Math.max(15, Math.min(99, totalScore));

  // Đánh giá xếp hạng
  let rank = {
    title: 'Bình Hòa',
    tone: 'warning',
    color: 'var(--status-warning, #f59e0b)',
    summary: 'Biển số mang năng lượng trung bình, các yếu tố cát hung đan xen. Bạn nên lưu ý các điểm khuyết để gia tăng tài lộc.',
  };
  if (totalScore >= 85) {
    rank = {
      title: 'Đại Cát — Cực Phẩm',
      tone: 'success',
      color: 'var(--status-success-ink, #16a34a)',
      summary: 'Biển số hội tụ vượng khí dồi dào, âm dương tương phối đắc địa, tương trợ đắc lực cho đường tài vận và bình an của chủ sở hữu.',
    };
  } else if (totalScore >= 70) {
    rank = {
      title: 'Cát Lợi — Hanh Thông',
      tone: 'primary',
      color: 'var(--action-primary, #C75B00)',
      summary: 'Biển số có thế tốt, nhiều con số cát khí trợ vận. Phương tiện đồng hành tin cậy, thúc đẩy công việc tiến triển đều đặn.',
    };
  } else if (totalScore < 55) {
    rank = {
      title: 'Cần Cải Thiện',
      tone: 'danger',
      color: 'var(--status-danger, #e11d48)',
      summary: 'Biển số có một số yếu tố xung khắc hoặc điểm nút chưa thuận lợi, năng lượng bị phân tán. Khuyên bạn nên tham khảo phương án đổi biển số hợp phong thủy để cải vận.',
    };
  }

  // Điểm khuyết & Tiêu chí đề xuất cải vận
  const improvementPoints = [];
  if (napAm && elementRelation && (elementRelation.type === 'khac-nhap' || elementRelation.type === 'sinh-xuat')) {
    improvementPoints.push(`Khắc phục thế số ${elementRelation.label} bằng biển số mang hành ${napAm.sinhChoMe} (tương sinh mệnh ${napAm.element}).`);
  }
  if (nutInfo.nut === 4 || nutInfo.nut === 0) {
    improvementPoints.push(`Nâng số nút từ ${nutInfo.nut} nút lên 8 hoặc 9 nút Đại Cát để kích hoạt dòng tiền.`);
  }
  if (patterns.warnings.length > 0) {
    improvementPoints.push(`Loại bỏ các con số nhạy cảm (${patterns.warnings.map((w) => w.name).join(', ')}) để yên tâm trên mọi cung đường.`);
  }
  if (patterns.beauties.length === 0) {
    improvementPoints.push('Bổ sung các cặp số tài lộc mạnh (Lộc Phát 68/86, Thần Tài 39/79) phù hợp cho kinh doanh và thăng tiến.');
  }
  if (missingElements.length > 0) {
    improvementPoints.push(`Biển hiện tại khuyết hành ${missingElements.join(', ')}. Cần cân bằng năng lượng ngũ hành.`);
  }

  return {
    parsed,
    formatted,
    provinceCode,
    series,
    digits,
    totalScore,
    rank,
    napAm,
    lastElement,
    elementCounts,
    missingElements,
    dominantElement,
    elementRelation,
    nutInfo,
    amDuongInfo,
    patterns,
    queDich,
    improvementPoints,
  };
}
