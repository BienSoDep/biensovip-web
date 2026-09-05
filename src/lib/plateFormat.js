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

// Parse lenient cho form admin (gõ tay, có thể chưa đúng chuẩn) — khác splitPlateNumber (strict, dùng
// hiển thị biển đã có trong DB). Trước đây định nghĩa trùng lặp ở AdminContacts.jsx và AdminPlates.jsx
// với edge-case xử lý khác nhau (1 bên trả null khi parse fail, bên kia trả object rỗng) — gộp về 1
// nguồn, giữ hành vi robust hơn (object rỗng, không null) để không phải sửa call site kiểm tra null.
export function parsePlateNumber(raw) {
  if (!raw) return { prov: '', seri: '', num: '' };
  const s = raw.trim();
  const idx = Math.max(s.lastIndexOf('-'), s.lastIndexOf(' '));
  if (idx < 0) return { prov: '', seri: '', num: s };
  const left = s.slice(0, idx).replace(/[\s-]/g, '');
  const num = s.slice(idx + 1).trim();
  const prov = left.match(/^\d{1,2}/)?.[0] || '';
  const seri = left.slice(prov.length);
  return { prov, seri, num };
}

export function formatPrice(price, priceOnRequest) {
  if (priceOnRequest) return 'Giá liên hệ';
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
}

// Nội dung phong thủy backend trả về là 1 chuỗi liền không xuống dòng, nối nhiều "đoạn" bằng dấu
// chấm câu — mỗi đoạn thường bắt đầu bằng 1 cụm nhãn ngắn kết thúc ":" (VD "Ngũ hành:", "Lời khuyên
// phong thủy:"). Tách tại "câu kết + khoảng trắng + Cụm nhãn Hoa đầu:" để hiển thị từng đoạn riêng.
const PARAGRAPH_BREAK_RE = /(?<=[.!?])\s+(?=[A-ZÀ-Ỵ][^.!?]{2,40}:)/g;

// Mỗi đoạn có thể bắt đầu bằng 1 cụm nhãn ngắn kết ":" (VD "Ngũ hành:") — tách riêng label để in đậm.
const LABEL_RE = /^([A-ZÀ-Ỵ][^.!?:]{2,40}:)\s*(.*)$/s;

export function splitFengShuiParagraphs(text) {
  if (!text) return [];
  return text.split(PARAGRAPH_BREAK_RE).map((s) => s.trim()).filter(Boolean).map((para) => {
    const m = para.match(LABEL_RE);
    return m ? { label: m[1], rest: m[2] } : { label: null, rest: para };
  });
}
