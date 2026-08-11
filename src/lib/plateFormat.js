// Định dạng biển VN: 2 số tỉnh + 1-2 chữ seri + 5-6 số. VD "43A199999" -> {prov:'43', seri:'A1', num:'999.99'}
const PLATE_RE = /^(\d{2})([A-Z]{1,2}\d?)(\d{4,6})$/;

export function splitPlateNumber(plateNumber) {
  const clean = String(plateNumber || '').replace(/[.\s-]/g, '').toUpperCase();
  const m = clean.match(PLATE_RE);
  if (!m) return { prov: '', seri: '', num: clean };
  const [, prov, seri, num] = m;
  const formattedNum = num.length > 3 ? `${num.slice(0, -2)}.${num.slice(-2)}` : num;
  return { prov, seri, num: formattedNum };
}

export function formatPrice(price, priceOnRequest) {
  if (priceOnRequest) return 'Giá liên hệ';
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
}
