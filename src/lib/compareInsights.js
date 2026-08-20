// Port từ Biensovip.Application.Services.MeaningAnalyzer (backend) — cùng thuật toán, chỉ phần
// nhận diện mẫu đẹp + ngũ hành theo số cuối (không cần gọi API, đủ để so sánh điểm chung/riêng).
const ELEMENT_LABEL = { moc: 'Mộc', hoa: 'Hỏa', tho: 'Thổ', kim: 'Kim', thuy: 'Thủy' };

function elementForDigit(d) {
  if (d === '1' || d === '2') return 'moc';
  if (d === '3' || d === '4') return 'hoa';
  if (d === '5' || d === '6') return 'tho';
  if (d === '7' || d === '8') return 'kim';
  return 'thuy'; // '9' hoặc '0'
}

function extractDigitSeries(plateNumber) {
  const digits = String(plateNumber || '').replace(/\D/g, '');
  return digits.length <= 2 ? '' : digits.slice(2);
}

function hasRepeated(s, n) {
  for (let i = 0; i + n <= s.length; i++) {
    const c = s[i];
    let ok = true;
    for (let j = 1; j < n; j++) if (s[i + j] !== c) { ok = false; break; }
    if (ok) return c;
  }
  return null;
}

function longestAscendingRun(s) {
  if (!s) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < s.length; i++) {
    cur = s.charCodeAt(i) === s.charCodeAt(i - 1) + 1 ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return max;
}

const PATTERN_LABEL = {
  loc_phat: 'Lộc phát (68/86)',
  than_tai: 'Thần tài (39/79)',
  ong_dia: 'Ông địa (38/78)',
  doi: 'Số đôi',
  ganh: 'Gánh (đối xứng)',
};

/// Trả { patterns: string[] (nhãn mẫu đẹp), element: 'moc'|'hoa'|'tho'|'kim'|'thuy' }
export function analyzePlateNumber(plateNumber) {
  const series = extractDigitSeries(plateNumber);
  const patterns = [];

  if (series) {
    const quad = hasRepeated(series, 4);
    if (quad && '1235689'.includes(quad)) patterns.push(`Tứ quý ${quad}`);
    else {
      const triple = hasRepeated(series, 3);
      if (triple && '5689'.includes(triple)) patterns.push(`Tam hoa ${triple}`);
    }

    const run = longestAscendingRun(series);
    if (run >= 3) patterns.push(`Sảnh tiến ${run} số`);

    const last2 = series.length >= 2 ? series.slice(-2) : null;
    if (last2) {
      if (last2 === '68' || last2 === '86') patterns.push(PATTERN_LABEL.loc_phat);
      else if (last2 === '39' || last2 === '79') patterns.push(PATTERN_LABEL.than_tai);
      else if (last2 === '38' || last2 === '78') patterns.push(PATTERN_LABEL.ong_dia);
      else if (last2[0] === last2[1]) patterns.push(PATTERN_LABEL.doi);
    }

    if (series.length >= 4) {
      const q = series.slice(-4);
      if (q[0] === q[3] && q[1] === q[2] && q[0] !== q[1]) patterns.push(PATTERN_LABEL.ganh);
    }
  }

  const element = series ? elementForDigit(series[series.length - 1]) : null;
  return { patterns, element };
}

/// So sánh nhiều biển: trả { perPlate: [{id, patterns, element, uniquePatterns}], commonPatterns, commonElement }
export function compareInsights(plates) {
  const perPlate = plates.map((p) => ({ id: p.id, ...analyzePlateNumber(p.plateNumber) }));

  const patternSets = perPlate.map((p) => new Set(p.patterns));
  const commonPatterns = patternSets.length > 0
    ? [...patternSets[0]].filter((label) => patternSets.every((set) => set.has(label)))
    : [];

  const elements = perPlate.map((p) => p.element).filter(Boolean);
  const commonElement = elements.length === perPlate.length && elements.every((e) => e === elements[0])
    ? elements[0]
    : null;

  return {
    perPlate: perPlate.map((p) => ({
      ...p,
      uniquePatterns: p.patterns.filter((label) => !commonPatterns.includes(label)),
    })),
    commonPatterns,
    commonElement,
    commonElementLabel: commonElement ? ELEMENT_LABEL[commonElement] : null,
    elementLabel: ELEMENT_LABEL,
  };
}

// Điểm "mẫu đẹp" 0-100 cho radar chart — số mẫu tìm được càng nhiều/hiếm càng cao, trần ở 100.
// Không phải điểm phong thủy chính thức (đó là hợp mệnh từ API) — chỉ đo độ "đẹp số" thuần theo pattern.
export function patternScore(patterns) {
  if (!patterns || patterns.length === 0) return 20; // sàn — vẫn có số, không phải 0 tuyệt đối
  const weight = (label) => (label.startsWith('Tứ quý') ? 40 : label.startsWith('Tam hoa') ? 30 : 20);
  const score = patterns.reduce((sum, label) => sum + weight(label), 20);
  return Math.min(100, score);
}
