// Định dạng biển VN: 2 số tỉnh + 1-2 chữ seri (kèm số nếu là xe máy) + phần số (4-5 số hoặc có dấu chấm).
// Hỗ trợ mọi biến thể đầu vào: có gạch ngang ("43B6-55667", "51A-999.99"), có dấu chấm ("43B6.55667"),
// có dấu chấm giữa ("43B6 · 55667"), có khoảng trắng ("43-B6 55667") hoặc viết liền ("43B655667", "51A99999").
export function splitPlateNumber(plateNumber) {
  const raw = String(plateNumber || '').trim().toUpperCase();
  // TH1: Có dấu phân cách rõ ràng giữa tỉnh/seri và phần số
  const m1 = raw.match(/^(\d{2})[-\s]?([A-Z]{1,2}\d?)[-\s.·]+(.+)$/);
  if (m1) {
    return { prov: m1[1], seri: m1[2], num: m1[3].trim() };
  }
  // TH2: Ô tô viết liền 5 số hoặc có chấm (VD: '51A99999', '51LD12345', '51A999.99')
  const mCar5 = raw.match(/^(\d{2})([A-Z]{1,2})(\d{5}|\d{3}\.\d{2})$/);
  if (mCar5) {
    return { prov: mCar5[1], seri: mCar5[2], num: mCar5[3] };
  }
  // TH3: Xe máy 2 số tỉnh + 1 chữ + 1 số seri + 4-5 số viết liền (VD: '43B655667')
  const mMoto = raw.match(/^(\d{2})([A-Z]\d)(\d{4,5})$/);
  if (mMoto) {
    return { prov: mMoto[1], seri: mMoto[2], num: mMoto[3] };
  }
  // TH4: Dự phòng regex chuẩn cũ
  const mOld = raw.match(/^(\d{2})([A-Z]{1,2}\d?)-?(.+)$/);
  if (mOld) {
    return { prov: mOld[1], seri: mOld[2], num: mOld[3].replace(/^[\s.·-]+/, '').trim() };
  }
  return { prov: '', seri: '', num: raw };
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
  if (priceOnRequest || !price || Number(price) <= 0) return 'Giá liên hệ';
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
