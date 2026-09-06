// Nguồn duy nhất của prompt "nhờ AI ngoài chuyển Excel/PDF sang format dán vào Dán nhiều/CSV" —
// dùng ở nút Copy trên AdminPlates.jsx. Bản đầy đủ + hướng dẫn sử dụng nằm ở
// biensodep-infrastructure/docs/ops/PROMPT-IMPORT-BIEN-SO-TU-EXCEL-PDF.md — sửa cả 2 nơi khi đổi nội
// dung prompt để không bị lệch giữa doc và UI.
export const IMPORT_PLATE_PROMPT = `Bạn là trợ lý chuẩn hóa dữ liệu biển số xe Việt Nam. Tôi đính kèm 1 file (Excel/PDF/ảnh)
chứa danh sách biển số xe đẹp và giá bán. Nhiệm vụ của bạn:

BƯỚC 1 — Đọc toàn bộ danh sách trong file, lấy 4 cột: SỐ BIỂN, GIÁ, TÌNH TRẠNG (nếu có
cột tình trạng/đã bán), và LOẠI XE (nếu file có phân biệt ô tô/xe máy — VD 2 bảng riêng,
1 cột ghi rõ, hoặc tên sheet/tiêu đề nói rõ "BIỂN SỐ XE MÁY"/"BIỂN SỐ Ô TÔ"). Các cột
khác như loại biển (ngũ quý/tam hoa...), ghi chú... thì bỏ qua — hệ thống tự nhận diện
loại biển từ số biển, không cần AI xử lý.

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

BƯỚC 3 — Chuẩn hóa giá:
  - Nếu file có giá trị số rõ ràng (kể cả viết tắt như "350tr", "2.15 tỷ") → quy đổi
    ra số nguyên đơn vị đồng, không có dấu chấm/phẩy phân cách (VD "350tr" → 350000000,
    "2.15 tỷ" → 2150000000).
  - Nếu ô giá TRỐNG, hoặc ghi "liên hệ", "LH", "call", "thỏa thuận", "gọi để biết giá"
    → để trống hoàn toàn (không ghi số 0), hệ thống sẽ tự hiểu là "Giá liên hệ".

BƯỚC 4 — Nhận diện tình trạng biển (cột thứ 3, chỉ ghi khi file có đánh dấu rõ ràng):
  - Nếu file ghi "Đã bán", "ĐÃ BÁN", "Sold", hoặc tương tự → ghi "đã bán" vào cột 3.
  - Nếu ô tình trạng TRỐNG, hoặc ghi bất kỳ giá trị nào khác (VD "còn hàng", để trống,
    dấu "-") → BỎ TRỐNG cột 3 hoàn toàn (không ghi gì), hệ thống mặc định hiểu là biển
    còn bán. TUYỆT ĐỐI không suy đoán hay tự ghi "đã bán" khi không có căn cứ rõ ràng
    trong file — nhầm lẫn ở đây khiến biển còn bán bị ẩn khỏi khách hàng.

BƯỚC 5 — Nhận diện loại xe (cột thứ 4, chỉ ghi khi file có căn cứ rõ ràng):
  - Nếu file tách riêng 2 bảng/sheet "BIỂN SỐ Ô TÔ" và "BIỂN SỐ XE MÁY" (hoặc có cột ghi
    rõ loại xe) → ghi "ô tô" hoặc "xe máy" vào cột 4 tương ứng.
  - Nếu KHÔNG có căn cứ nào trong file (không tách bảng, không có cột riêng) → BỎ TRỐNG
    cột 4 hoàn toàn, hệ thống sẽ tự đoán ô tô/xe máy từ ký tự seri trong số biển. Không
    suy đoán loại xe từ giá tiền hay bất kỳ suy luận gián tiếp nào khác.

BƯỚC 6 — Xuất kết quả theo ĐÚNG 2 khối sau, không thêm giải thích nào khác ngoài phần
ghi chú "KHÔNG CHẮC" nếu có:

### DÁN TRỰC TIẾP
(mỗi dòng: SỐ BIỂN,GIÁ,TÌNH TRẠNG,LOẠI XE — nếu giá liên hệ thì để trống giữa 2 dấu
phẩy; nếu 1 cột sau không có giá trị thì bỏ trống, kể cả bỏ hẳn các dấu phẩy thừa ở
cuối dòng khi các cột sau đó đều trống)
\`\`\`
43A1-999.99,2150000000
43A1-888.88,
43A1-777.77
43A1-555.55,45000000,đã bán
43AB-668.88,39000000,,xe máy
\`\`\`

### FILE CSV
(có header, dùng dấu phẩy, để dành backup/tương lai)
\`\`\`
plate_number,price,status,vehicle_type
43A1-999.99,2150000000,,
43A1-888.88,,,
43A1-777.77,,,
43A1-555.55,45000000,sold,
43AB-668.88,39000000,,motorbike
\`\`\`

Nếu file có hơn 200 dòng, vẫn xử lý hết, không cắt bớt — chia nhiều block nếu cần
nhưng giữ đúng 2 khối DÁN TRỰC TIẾP / FILE CSV cho từng phần.`;
