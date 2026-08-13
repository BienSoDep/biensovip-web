// Định dạng biển VN: 2 số tỉnh + 1-2 chữ seri + phần số (độ dài tùy loại: tứ quý, sảnh tiến, số đẹp khác...).
// VD "43A1-999.99" -> {prov:'43', seri:'A1', num:'999.99'}; "37G1-830.7788" -> {prov:'37', seri:'G1', num:'830.7788'}
const PLATE_RE = /^(\d{2})([A-Z]{1,2}\d?)-?(.+)$/;

export function splitPlateNumber(plateNumber) {
  const raw = String(plateNumber || '').trim().toUpperCase();
  const m = raw.match(PLATE_RE);
  if (!m) return { prov: '', seri: '', num: raw };
  const [, prov, seri, num] = m;
  return { prov, seri, num };
}

export function formatPrice(price, priceOnRequest) {
  if (priceOnRequest) return 'Giá liên hệ';
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
}
