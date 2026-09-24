import { analyzePlateNumber } from '../../../lib/compareInsights.js';
import { NUT_MEANING } from '../../../lib/fengshui.js';
import { parsePlateNumber } from '../../../lib/plateFormat.js';

// Nhãn tiếng Việt cho issue code trả về từ /admin/plates/data-issues và /plates/info/missing —
// dùng chung cho icon cảnh báo đỏ trong bảng + modal "Sinh thông tin hàng loạt".
export const DATA_ISSUE_LABELS = {
  missing_image: 'Thiếu ảnh',
  missing_meaning: 'Thiếu ý nghĩa phong thủy',
  missing_description: 'Thiếu mô tả ngắn',
  invalid_price: 'Giá không hợp lệ (0đ, chưa bật Giá liên hệ)',
  gifted_plate_not_found: 'Biển tặng kèm không tồn tại trong hệ thống',
};

export const OTO_LETTERS = 'ABCDFHMNPTV';

export function hasRepeatedAnywhere(series, n) {
  for (let i = 0; i + n <= series.length; i++) {
    if (new Set(series.slice(i, i + n)).size === 1) return true;
  }
  return false;
}

export function longestAscendingRun(series) {
  let max = 1, cur = 1;
  for (let i = 1; i < series.length; i++) {
    cur = +series[i] === +series[i - 1] + 1 ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return max;
}

export function detectPlateTypeId(serial, plateTypes) {
  const byName = (n) => (plateTypes.find((o) => (o.label || '').toLowerCase().includes(n)) || {}).value || '';
  if (!serial) return '';
  if (hasRepeatedAnywhere(serial, 5)) return byName('ngũ quý');
  if (hasRepeatedAnywhere(serial, 4)) return byName('tứ quý');
  if (hasRepeatedAnywhere(serial, 3)) return byName('tam hoa');
  if (longestAscendingRun(serial) >= 3) return byName('sảnh tiến');
  const last2 = serial.slice(-2);
  if (last2 === '68' || last2 === '86') return byName('lộc phát');
  if (last2 === '39' || last2 === '79') return byName('thần tài');
  if (last2 === '38' || last2 === '78') return byName('ông địa');
  if (serial.length >= 4) {
    const q = serial.slice(-4);
    if (q[0] === q[3] && q[1] === q[2] && q[0] !== q[1]) return byName('số gánh');
  }
  if (last2.length === 2 && last2[0] === last2[1]) return byName('lặp đôi');
  // Số kép: có cặp số lặp bất kỳ vị trí (không rơi vào luật trên) — nới lỏng nhất, đặt cuối cùng.
  for (let i = 0; i + 1 < serial.length; i++) {
    if (serial[i] === serial[i + 1]) return byName('số kép');
  }
  return '';
}

export function detectVehicleTypeId(seri, vehicleTypes) {
  const first = (seri || '').trim().charAt(0).toUpperCase();
  const isOto = !first || OTO_LETTERS.indexOf(first) >= 0;
  const key = isOto ? 'ô tô' : 'xe máy';
  return (vehicleTypes.find((o) => (o.label || '').toLowerCase().includes(key)) || {}).value || '';
}

export function composeFengShuiMeaning(fullPlate) {
  const { patterns } = analyzePlateNumber(fullPlate);
  const serial = parsePlateNumber(fullPlate).num.replace(/\D/g, '');
  const parts = [];
  if (patterns.length) parts.push(patterns.join(', ') + '.');
  const digitMeans = serial.split('').map((d) => NUT_MEANING[d]).filter(Boolean);
  if (digitMeans.length) parts.push(`Từng số: ${digitMeans.join(' - ')}.`);
  return parts.join(' ');
}

export const CAND_FIELDS = [
  { key: 'provinceId', label: 'Tỉnh/thành' },
  { key: 'plateTypeId', label: 'Loại biển' },
  { key: 'vehicleTypeId', label: 'Loại xe' },
  { key: 'fengShuiMeaning', label: 'Ý nghĩa phong thủy' },
];

export const PER_PAGE_OPTIONS = [
  { value: 20, label: '20/trang' },
  { value: 50, label: '50/trang' },
  { value: 100, label: '100/trang' },
];

export const HOT_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'true', label: 'Nổi bật' },
  { value: 'false', label: 'Không nổi bật' },
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'available', label: 'Còn hàng' },
  { value: 'sold', label: 'Đã bán' },
];

export const INITIAL_FORM = {
  plateNumber: '', plateTypeId: '', provinceId: '', vehicleTypeId: '',
  price: '', costPrice: '', priceOnRequest: false, isHot: false,
  description: '', fengShuiMeaning: '', images: [], giftedPlateNumber: '',
  salePrice: '', saleDiscountPercent: '',
};

export const fmt = (n) => (n == null ? '—' : n.toLocaleString('vi-VN') + 'đ');

export const TOGGLEABLE_COLUMNS = [
  { key: 'plateType', label: 'Loại biển', default: true },
  { key: 'vehicleType', label: 'Loại xe', default: true },
  { key: 'province', label: 'Tỉnh/thành', default: true },
  { key: 'price', label: 'Giá', default: true },
  { key: 'gifted', label: 'Biển tặng', default: true },
  { key: 'isNew', label: 'Mới', default: true },
  { key: 'status', label: 'Trạng thái', default: true },
  { key: 'updatedAt', label: 'Cập nhật', default: true },
  { key: 'pendingContact', label: 'Liên hệ chờ', default: false },
  { key: 'imageCount', label: 'Số ảnh', default: false },
  { key: 'createdAt', label: 'Ngày tạo', default: false },
  { key: 'salePrice', label: 'Giá KM', default: false },
];

export const COLUMN_PREFS_KEY = 'bsv.admin.plateColumns';

export function loadColumnPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMN_PREFS_KEY) || 'null');
    if (saved && typeof saved === 'object') return { ...Object.fromEntries(TOGGLEABLE_COLUMNS.map((c) => [c.key, c.default])), ...saved };
  } catch { /* ignore malformed prefs */ }
  return Object.fromEntries(TOGGLEABLE_COLUMNS.map((c) => [c.key, c.default]));
}

export const num = (v) => Number(String(v ?? '').replace(/[^\d]/g, '') || 0);

// Biển "Mới" = tạo trong 7 ngày gần nhất.
export const isNewPlate = (p) => !!p.createdAt && (Date.now() - new Date(p.createdAt).getTime()) < 7 * 24 * 3600 * 1000;

export const ERR_MSG = {
  DUPLICATE: 'Trùng biển',
  INVALID_PROVINCE: 'Sai tỉnh',
  EMPTY: 'Bỏ trống',
};

export const canViewCost = (st) => st?.user?.role === 'super-admin' || st?.user?.permissions?.includes('*') || st?.user?.permissions?.includes('plates_cost:view');

export const SOLD_MARKERS = ['đã bán', 'da ban', 'sold', '1'];
export const isSoldMarker = (s) => SOLD_MARKERS.includes(s.trim().toLowerCase());

export const OTO_MARKERS = ['oto', 'o to', 'ô tô', 'car', 'xe hoi', 'xe hơi'];
export const XEMAY_MARKERS = ['xe may', 'xe máy', 'moto', 'motorbike'];

export const detectVehicleTypeOverride = (raw, vehicleTypesRaw) => {
  const s = raw.trim().toLowerCase();
  if (OTO_MARKERS.includes(s)) return (vehicleTypesRaw.find((o) => (o.name || '').toLowerCase().includes('ô tô')) || {}).id || '';
  if (XEMAY_MARKERS.includes(s)) return (vehicleTypesRaw.find((o) => (o.name || '').toLowerCase().includes('xe máy')) || {}).id || '';
  return null;
};

export const codeMatches = (csv, code) => (csv || '').split(',').map((c) => c.trim()).includes((code || '').trim());
