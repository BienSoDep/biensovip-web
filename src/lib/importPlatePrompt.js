// Nguồn duy nhất của prompt "nhờ AI ngoài chuyển Excel/PDF sang format dán vào Dán nhiều/CSV" —
// dùng ở nút Copy trên AdminPlates.jsx. Bản đầy đủ + hướng dẫn sử dụng nằm ở
// biensodep-infrastructure/docs/ops/PROMPT-IMPORT-BIEN-SO-TU-EXCEL-PDF.md — sửa cả 2 nơi khi đổi nội
// dung prompt để không bị lệch giữa doc và UI.
//
// Prompt được sinh động theo field admin khai báo file của họ CÓ (form tick trên UI) — thay vì 1 bản
// cứng dặn AI tự suy đoán field nào tồn tại, dễ suy đoán sai/nhiễu. Vị trí cột LUÔN cố định theo thứ
// tự Số biển(1)/Giá(2)/Tình trạng(3)/[loại xe — luôn trống, AI không điền](4)/Biển tặng kèm(5), khớp
// đúng parseLine (AdminPlates.jsx) đọc theo index cột — field không tick vẫn giữ đúng vị trí, chỉ nội
// dung để trống, không dồn cột lên.
const SAMPLE = {
  plate: '43A1-999.99',
  price: '2150000000',
  status: 'đã bán',
  gifted: '43AB-668.88',
};

// Cột cao nhất còn dùng — quyết định in tới cột mấy trong khối "CẤU TRÚC" và mẫu ví dụ.
function maxColumn(fields) {
  if (fields.hasGifted) return 5;
  if (fields.hasStatus) return 3;
  if (fields.hasPrice) return 2;
  return 1;
}

function buildStructureBlock(fields) {
  const max = maxColumn(fields);
  const lines = ['Cột 1: SỐ BIỂN (luôn có, bắt buộc)'];
  if (max >= 2) lines.push(`Cột 2: GIÁ${fields.hasPrice ? ' (để trống nếu "giá liên hệ")' : ' (luôn để trống — file gốc không có cột này)'}`);
  if (max >= 3) lines.push(`Cột 3: TÌNH TRẠNG${fields.hasStatus ? ' (chỉ ghi "đã bán", còn lại để trống)' : ' (luôn để trống — file gốc không có cột này)'}`);
  if (max >= 4) lines.push('Cột 4: (luôn để trống — hệ thống tự nhận loại xe từ số biển, KHÔNG cần bạn điền)');
  if (max >= 5) lines.push(`Cột 5: BIỂN TẶNG KÈM${fields.hasGifted ? ' (VD ô tô tặng kèm biển xe máy, để trống nếu không có)' : ' (luôn để trống — file gốc không có cột này)'}`);
  return `File kết quả có ${max} cột theo thứ tự CỐ ĐỊNH sau (không được đảo vị trí):\n${lines.map((l) => `  ${l}`).join('\n')}`;
}

// Build 1 dòng ví dụ theo mảng giá trị cột (đã align đúng vị trí) — bỏ trailing comma rỗng thừa.
function exampleRow(cols) {
  while (cols.length > 1 && cols[cols.length - 1] === '') cols.pop();
  return cols.join(',');
}

function buildExamples(fields) {
  const max = maxColumn(fields);
  const col = (n, val) => (max >= n ? val : undefined);

  const rows = [
    [SAMPLE.plate, col(2, SAMPLE.price)].filter((v) => v !== undefined),
    fields.hasPrice ? [SAMPLE.plate, col(2, '')].filter((v) => v !== undefined) : null,
    fields.hasStatus ? [SAMPLE.plate, col(2, SAMPLE.price), col(3, SAMPLE.status)].filter((v) => v !== undefined) : null,
    fields.hasGifted ? [SAMPLE.plate, col(2, SAMPLE.price), col(3, ''), col(4, ''), col(5, SAMPLE.gifted)].filter((v) => v !== undefined) : null,
  ].filter(Boolean);

  const csvHeader = ['plate_number'];
  if (max >= 2) csvHeader.push('price');
  if (max >= 3) csvHeader.push('status');
  if (max >= 4) csvHeader.push('vehicle_type');
  if (max >= 5) csvHeader.push('gifted_plate');

  const csvRows = rows.map((r) => {
    const padded = [...r];
    while (padded.length < csvHeader.length) padded.push('');
    return padded.join(',');
  });

  return {
    directPaste: rows.map(exampleRow).join('\n'),
    csv: [csvHeader.join(','), ...csvRows].join('\n'),
  };
}

// Các bước xử lý field — chỉ bước tương ứng field đã tick mới được chèn vào prompt, chủ động
// không nhắc field chưa tick (thay vì dặn AI "bỏ qua nếu không có" — dễ gây nhiễu/suy đoán sai).
function buildFieldSteps(fields, startStepNo) {
  const steps = [];
  let stepNo = startStepNo;
  if (fields.hasPrice) {
    steps.push(`BƯỚC ${stepNo++} — Chuẩn hóa giá (cột 2):
  - Nếu file có giá trị số rõ ràng (kể cả viết tắt như "350tr", "2.15 tỷ") → quy đổi
    ra số nguyên đơn vị đồng, không có dấu chấm/phẩy phân cách (VD "350tr" → 350000000,
    "2.15 tỷ" → 2150000000).
  - Nếu ô giá TRỐNG, hoặc ghi "liên hệ", "LH", "call", "thỏa thuận", "gọi để biết giá"
    → để trống hoàn toàn (không ghi số 0), hệ thống sẽ tự hiểu là "Giá liên hệ".`);
  }
  if (fields.hasStatus) {
    steps.push(`BƯỚC ${stepNo++} — Nhận diện tình trạng biển (cột 3, chỉ ghi khi file có đánh dấu rõ ràng):
  - Nếu file ghi "Đã bán", "ĐÃ BÁN", "Sold", hoặc tương tự → ghi "đã bán" vào cột 3.
  - Nếu ô tình trạng TRỐNG, hoặc ghi bất kỳ giá trị nào khác (VD "còn hàng", để trống,
    dấu "-") → BỎ TRỐNG cột 3 hoàn toàn (không ghi gì), hệ thống mặc định hiểu là biển
    còn bán. TUYỆT ĐỐI không suy đoán hay tự ghi "đã bán" khi không có căn cứ rõ ràng
    trong file — nhầm lẫn ở đây khiến biển còn bán bị ẩn khỏi khách hàng.`);
  }
  if (fields.hasGifted) {
    steps.push(`BƯỚC ${stepNo++} — Nhận diện biển tặng kèm (cột 5, chỉ ghi khi file có ghi rõ):
  - Nếu file ghi rõ biển này được tặng kèm 1 biển khác (VD mua ô tô tặng biển xe máy)
    → ghi số biển tặng kèm (đã chuẩn hóa đúng định dạng như BƯỚC 2) vào cột 5.
  - Nếu KHÔNG có căn cứ nào trong file → BỎ TRỐNG cột 5 hoàn toàn. Cột 4 giữa Tình
    trạng và Biển tặng kèm LUÔN để trống (dành cho loại xe, hệ thống tự nhận).`);
  }
  return { steps, nextStepNo: stepNo };
}

export function buildImportPlatePrompt(fields = { hasPrice: true, hasStatus: true, hasNote: false, hasGifted: false }) {
  const structureBlock = buildStructureBlock(fields);
  const { steps: fieldSteps, nextStepNo: finalStepNo } = buildFieldSteps(fields, 3);
  const examples = buildExamples(fields);

  const readColumns = ['SỐ BIỂN'];
  if (fields.hasPrice) readColumns.push('GIÁ');
  if (fields.hasStatus) readColumns.push('TÌNH TRẠNG (nếu có cột tình trạng/đã bán)');
  if (fields.hasGifted) readColumns.push('BIỂN TẶNG KÈM (nếu file ghi rõ tặng kèm biển khác)');

  const noteLine = fields.hasNote
    ? '\nCột GHI CHÚ trong file gốc (nếu có) — CHỈ đọc để tham khảo ngữ cảnh (VD giúp nhận diện tình trạng/biển tặng kèm chính xác hơn), KHÔNG đưa vào output — hệ thống hiện chưa có ô lưu ghi chú riêng.'
    : '';

  return `Bạn là trợ lý chuẩn hóa dữ liệu biển số xe Việt Nam. Tôi đính kèm 1 file (Excel/PDF/ảnh)
chứa danh sách biển số xe đẹp và giá bán. Nhiệm vụ của bạn:

CẤU TRÚC FILE ĐẦU RA (đọc kỹ trước khi làm — vị trí cột phải đúng tuyệt đối):
${structureBlock}

BƯỚC 1 — Đọc toàn bộ danh sách trong file, lấy các cột: ${readColumns.join(', ')}. Các
cột khác như loại xe (ô tô/xe máy), loại biển (ngũ quý/tam hoa...)${fields.hasNote ? '' : ', ghi chú'}...
thì bỏ qua — hệ thống tự nhận diện loại xe và loại biển từ cấu trúc số biển (biển ô
tô/xe máy có cấu trúc khác nhau), không cần AI xử lý.${noteLine}

BƯỚC 2 — Chuẩn hóa từng số biển về đúng định dạng:
  <2 số tỉnh><1-2 chữ cái + có thể kèm 1 số seri>-<phần số cuối, có thể có dấu chấm>
  Ví dụ đúng chuẩn: 43A1-999.99 | 43A-888.88 | 37G1-830.7788 | 51K1-123.45

  Quy tắc chuẩn hóa:
  - Luôn viết HOA chữ cái trong biển số.
  - Loại bỏ khoảng trắng thừa, dấu chấm/gạch sai vị trí.
  - Nếu file ghi kiểu "43A1 99999" (cách nhau bằng khoảng trắng, không có gạch ngang)
    → suy luận lại thành "43A1-999.99" (2 số tỉnh, 1-2 chữ + số seri ngay sau, dấu gạch
    ngang, rồi tới phần số — phần số thường chia nhóm 3 số cuối bằng dấu chấm nếu dài
    hơn 3 chữ số, ví dụ "99999" → "999.99", "12345" → "123.45").
  - Nếu không chắc chắn số tỉnh/seri (dữ liệu mơ hồ, thiếu ký tự, ảnh mờ) → GIỮ NGUYÊN
    bản gốc và ghi chú rõ "KHÔNG CHẮC — kiểm tra lại" ngay cạnh dòng đó trong phần
    DÁN TRỰC TIẾP, để admin tự kiểm tra tay, TUYỆT ĐỐI không tự bịa số.
${fieldSteps.length ? `\n${fieldSteps.join('\n\n')}\n` : ''}
BƯỚC ${finalStepNo} — Xuất kết quả theo ĐÚNG 2 khối sau, không thêm giải thích nào khác ngoài phần
ghi chú "KHÔNG CHẮC" nếu có:

### DÁN TRỰC TIẾP
(mỗi dòng theo đúng cấu trúc cột đã nêu ở trên — nếu 1 cột không có giá trị thì bỏ
trống, kể cả bỏ hẳn dấu phẩy thừa ở cuối dòng khi các cột sau đó đều trống)
\`\`\`
${examples.directPaste}
\`\`\`

### FILE CSV
(có header, dùng dấu phẩy, để dành backup/tương lai)
\`\`\`
${examples.csv}
\`\`\`

Nếu file có hơn 200 dòng, vẫn xử lý hết, không cắt bớt — chia nhiều block nếu cần
nhưng giữ đúng 2 khối DÁN TRỰC TIẾP / FILE CSV cho từng phần.`;
}
