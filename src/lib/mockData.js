export const PLATES = [
  { id: 'p1', prov: '43', seri: 'A1', num: '999.99', cat: 'Ngũ quý', price: '2.150.000.000đ', vehicle: 'Ô tô', city: 'Đà Nẵng', hot: true, isNew: true, status: 'Còn hàng', updated: 'Hôm nay', fengshui: 'Năm số 9 liền nhau là đỉnh của sự viên mãn và trường cửu. Hợp chủ xe mệnh Kim, mệnh Thủy, phù hợp doanh nhân muốn xe trở thành mặt tiền thương hiệu.' },
  { id: 'p2', prov: '43', seri: 'A2', num: '888.88', cat: 'Ngũ quý', price: '1.980.000.000đ', vehicle: 'Ô tô', city: 'Đà Nẵng', status: 'Còn hàng', updated: 'Hôm nay', fengshui: 'Số 8 đồng âm với "phát" — năm số 8 là phát lộc liên hồi, được giới kinh doanh săn nhiều nhất.' },
  { id: 'p3', prov: '43', seri: 'B1', num: '666.66', cat: 'Ngũ quý', price: 'Giá liên hệ', vehicle: 'Ô tô', city: 'Đà Nẵng', status: 'Còn hàng', updated: 'Hôm nay', fengshui: 'Số 6 là lộc, thuận trong giao thương. Ngũ quý 6 mang nghĩa lộc đến đều đặn, bền lâu.' },
  { id: 'p4', prov: '43', seri: 'A1', num: '888.86', cat: 'Tứ quý', price: '620.000.000đ', vehicle: 'Ô tô', city: 'Đà Nẵng', hot: true, status: 'Còn hàng', updated: 'Hôm qua', fengshui: 'Tứ quý 8 kết đuôi 6: phát rồi lộc, tổng nút cân bằng, phù hợp người mệnh Mộc.' },
  { id: 'p5', prov: '92', seri: 'A1', num: '779.79', cat: 'Thần tài', price: '410.000.000đ', vehicle: 'Ô tô', city: 'Quảng Nam', sold: true, status: 'Đã bán', updated: 'Hôm qua', fengshui: 'Số 79 là thần tài nhỏ, giữ tiền và mở đường tài lộc cho người làm nghề tự do.' },
  { id: 'p6', prov: '75', seri: 'A1', num: '686.68', cat: 'Lộc phát', price: '355.000.000đ', vehicle: 'Ô tô', city: 'Huế', status: 'Còn hàng', updated: 'Hôm qua', fengshui: 'Cặp 68 – 86 lặp lại tạo thế lộc phát đối xứng, thuận cho công việc buôn bán.' },
  { id: 'p7', prov: '43', seri: 'K1', num: '555.55', cat: 'Ngũ quý', price: '1.250.000.000đ', vehicle: 'Xe máy', city: 'Đà Nẵng', status: 'Còn hàng', updated: '3 ngày trước', fengshui: 'Số 5 thuộc Trung cung, ngũ quý 5 mang thế vững vàng, giữ được của.' },
  { id: 'p8', prov: '43', seri: 'C1', num: '339.99', cat: 'Tam hoa', price: '186.000.000đ', vehicle: 'Ô tô', city: 'Đà Nẵng', isNew: true, status: 'Ẩn', updated: '3 ngày trước', fengshui: 'Đuôi tam hoa 9 dẫn khí đi lên, hợp người mệnh Kim đang mở rộng công việc.' },
  { id: 'p9', prov: '43', seri: 'B2', num: '168.68', cat: 'Lộc phát', price: '298.000.000đ', vehicle: 'Ô tô', city: 'Đà Nẵng', status: 'Còn hàng', updated: '3 ngày trước', fengshui: 'Dãy 1-6-8 đọc là "nhất lộc phát", một trong những thế số được ưa chuộng nhất.' },
  { id: 'p10', prov: '43', seri: 'D1', num: '399.39', cat: 'Thần tài', price: '265.000.000đ', vehicle: 'Ô tô', city: 'Đà Nẵng', status: 'Còn hàng', updated: '4 ngày trước', fengshui: 'Đuôi 39 là thần tài lớn, dân buôn miền Trung ưu tiên chọn.' },
  { id: 'p11', prov: '92', seri: 'B1', num: '777.79', cat: 'Tứ quý', price: '520.000.000đ', vehicle: 'Ô tô', city: 'Quảng Nam', status: 'Còn hàng', updated: '5 ngày trước', fengshui: 'Tứ quý 7 kết 9: thế số tiến, hợp người khởi nghiệp.' },
  { id: 'p12', prov: '75', seri: 'C2', num: '686.86', cat: 'Lộc phát', price: '310.000.000đ', vehicle: 'Xe máy', city: 'Huế', status: 'Còn hàng', updated: '6 ngày trước', fengshui: 'Cặp lộc phát đối xứng hoàn toàn, thế cân bằng cho người mệnh Thổ.' },
];

export const CATS = ['Ngũ quý', 'Tứ quý', 'Tam hoa', 'Lộc phát', 'Thần tài'];
export const CITIES = ['Đà Nẵng', 'Quảng Nam', 'Huế'];
export const POST_CATS = ['Tất cả', 'Ý nghĩa biển số', 'Cách chọn biển hợp mệnh', 'Cập nhật quy định'];

export const POSTS = [
  {
    id: 'a1', title: 'Ngũ quý 99999 — vì sao dãy số này luôn đắt nhất thị trường?', cat: 'Ý nghĩa biển số', date: '28/07/2026',
    slug: 'ngu-quy-99999-dat-nhat-thi-truong',
    desc: 'Giải mã độ hiếm, ý nghĩa phong thủy trường cửu và lý do biển ngũ quý 99999 thường gấp 3–5 lần giá tứ quý cùng seri.',
    img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=70', imgAlt: 'Biển số ngũ quý 99999 trên xe hơi hạng sang',
    excerpt: 'Độ hiếm, quan niệm trường cửu và lý do giá gấp 3–5 lần tứ quý cùng seri.', status: 'Đã xuất bản',
    body: [
      { t: 'p', v: 'Trong quan niệm phong thủy Á Đông, số 9 tượng trưng cho sự trường cửu — cái gì đã đạt tới 9 là đạt tới giới hạn của một vòng. Năm số 9 liền nhau vì thế được xem là đỉnh của sự viên mãn, và cũng là dãy hiếm nhất trong mỗi đầu số tỉnh.' },
      { t: 'h2', v: 'Độ hiếm quyết định giá' },
      { t: 'p', v: 'Mỗi seri chỉ có duy nhất một biển 99999. Với đầu 43 của Đà Nẵng, số biển ngũ quý đang lưu hành đếm trên đầu ngón tay — đó là lý do giá thường gấp 3–5 lần một biển tứ quý cùng seri.' },
      { t: 'plate', plate: 'p1' },
      { t: 'h2', v: 'Ai nên chọn ngũ quý 9?' },
      { t: 'p', v: 'Người mệnh Kim và mệnh Thủy thường hợp số 9. Chủ doanh nghiệp dùng xe làm mặt tiền thương hiệu chọn ngũ quý vì tính nhận diện: khách nhìn một lần là nhớ.' },
      { t: 'quote', v: 'Số 9 đứng ở vị trí cao nhất trong dãy tự nhiên — ngũ quý 99999 là lời khẳng định "về đích" của người cầm vô lăng.' },
      { t: 'h2', v: 'Ngũ quý đáng giá bao nhiêu?' },
      { t: 'p', v: 'Giá tham khảo trên thị trường Đà Nẵng dao động quanh 1,5–2,5 tỷ đồng tùy seri. Yếu tố định giá gồm: số 9 hay số 0, đầu tỉnh "sang" (43, 51) và tình trạng hồ sơ.' },
    ],
  },
  {
    id: 'a2', title: 'Lộc phát 68 và 86 — chọn số nào thì thuận hơn?', cat: 'Ý nghĩa biển số', date: '21/07/2026',
    slug: 'loc-phat-68-hay-86',
    desc: 'So sánh ý nghĩa phong thủy của biển lộc phát 68 và 86: cách đọc, thế khí và đối tượng hợp từng số.',
    img: 'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=70', imgAlt: 'Biển lộc phát 68 và 86 trên chiếc xe hơi màu đỏ',
    excerpt: 'Cùng là lộc phát nhưng thứ tự đọc tạo ra hai thế khí khác nhau.', status: 'Đã xuất bản',
    body: [
      { t: 'p', v: 'Lộc phát là nhóm biển phổ biến nhất trong giới kinh doanh vì cách đọc tạo ra hai chữ mang ý nghĩa tài lộc. Nhưng 68 và 86 tuy cùng thuộc nhóm lộc phát lại có thế khí khác nhau.' },
      { t: 'h2', v: 'Đọc theo tiếng Hán' },
      { t: 'p', v: 'Số 6 đọc là "lộc", số 8 đọc là "phát". 68 đọc xuôi là "lộc phát", 86 đọc là "phát lộc". Về mặt chữ, cả hai đều tốt — sự khác biệt nằm ở thứ tự và cảm nhận chủ quan của chủ xe.' },
      { t: 'h2', v: 'Chọn theo mệnh' },
      { t: 'p', v: 'Người mệnh Kim hợp số 6, mệnh Thổ hợp số 8. Nếu bản mệnh hợp số 6, ưu tiên đuôi 68; nếu hợp số 8, ưu tiên 86. Tham khảo thầy phong thủy để xác định mệnh chính xác theo năm sinh.' },
      { t: 'quote', v: 'Điểm chung của 68 và 86: đều là nhóm "giữ tiền" mà dân buôn bán, kho vận hay tìm.' },
      { t: 'h2', v: 'Giá thị trường' },
      { t: 'p', v: 'Biển 68 thường nhỉnh hơn 86 một chút do quen miệng "lộc phát". Giá dao động vài chục đến vài trăm triệu tùy seri, số tiến và đầu tỉnh.' },
    ],
  },
  {
    id: 'a3', title: 'Cách tính tổng nút biển số theo ngũ hành bản mệnh', cat: 'Cách chọn biển hợp mệnh', date: '14/07/2026',
    slug: 'cach-tinh-tong-nut-bien-so',
    desc: 'Hướng dẫn tính tổng nút biển số và đối chiếu với ngũ hành bản mệnh chủ xe trong 3 bước, kèm ví dụ cụ thể.',
    img: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=70', imgAlt: 'Cách tính tổng nút biển số theo ngũ hành bản mệnh',
    excerpt: 'Hướng dẫn tính tổng nút và đối chiếu với mệnh chủ xe trong 3 bước.', status: 'Đã xuất bản',
    body: [
      { t: 'p', v: 'Tổng nút là một cách tham chiếu nhanh giúp đánh giá biển số có "dễ chịu" với chủ xe hay không. Cách tính đơn giản: cộng tất cả chữ số trong dãy biển, lấy số hàng đơn vị của tổng.' },
      { t: 'h2', v: '3 bước tính tổng nút' },
      { t: 'p', v: 'Bước 1: cộng toàn bộ chữ số của biển. Ví dụ biển 43A1 999.99 → 4+3+9+9+9+9+9 = 52. Bước 2: lấy chữ số hàng đơn vị = 2. Bước 3: đối chiếu số 2 với ngũ hành bản mệnh.' },
      { t: 'h2', v: 'Bảng ý nghĩa tổng nút' },
      { t: 'p', v: 'Nút 1: đứng đầu, có chí. Nút 2: tài vận cân bằng, ổn định. Nút 3: phát triển, nhiều cơ hội. Nút 4: vững chắc nhưng chậm. Nút 5: danh lợi song toàn. Nút 6: thuận lợi tài lộc. Nút 7: quyền uy, khí chất. Nút 8: phát đạt. Nút 9: viên mãn. Nút 0: đỉnh cao đã qua.' },
      { t: 'quote', v: 'Tổng nút chỉ là tham chiếu — kết quả tốt nhất khi tổng nút hài hòa với mệnh chủ xe.' },
      { t: 'h2', v: 'Lưu ý' },
      { t: 'p', v: 'Tổng nút không thay thế việc xem toàn bộ dãy số. Dãy càng nhiều số tốt, tổng nút càng cao thì biển càng giá trị.' },
    ],
  },
  {
    id: 'a4', title: 'Thần tài 79, 39 và những dãy số giữ tiền', cat: 'Ý nghĩa biển số', date: '06/07/2026',
    slug: 'than-tai-79-39-giu-tien',
    desc: 'Vì sao dân buôn miền Trung ưu tiên đuôi thần tài 79, 39 và các dãy số được xem là "giữ tiền".',
    img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=70', imgAlt: 'Biển số thần tài 79, 39 trên xe hơi thể thao',
    excerpt: 'Vì sao dân buôn miền Trung ưu tiên đuôi 79 hơn các đuôi khác.', status: 'Đã xuất bản',
    body: [
      { t: 'p', v: 'Trong dân gian, số 7 gắn với thần, số 9 gắn với trường cửu. Ghép lại, 79 được gọi là "thần tài lớn", 39 là "thần tài nhỏ". Đây là nhóm biển được giới kinh doanh ưa chuộng nhất.' },
      { t: 'h2', v: '79 — thần tài lớn' },
      { t: 'p', v: '79 tượng trưng cho thần tài giữ của, hợp người làm ăn lớn, buôn bán vận tải. Giá biển thần tài lớn thường cao và khan hiếm.' },
      { t: 'h2', v: '39 — thần tài nhỏ' },
      { t: 'p', v: '39 mang ý nghĩa tài lộc sinh sôi, hợp người mới khởi nghiệp hoặc làm dịch vụ. So với 79, giá mềm hơn và dễ tìm hơn.' },
      { t: 'h2', v: 'Dãy số giữ tiền khác' },
      { t: 'p', v: 'Ngoài 79/39, các đuôi 68, 86, 83 (phát tài) và 2378, 1368 (một đời cát lộc) cũng nằm trong nhóm "giữ tiền" được săn đón.' },
      { t: 'quote', v: 'Đuôi thần tài không chỉ đẹp mà còn là "tấm vé" nhận diện của giới buôn bán khi giao dịch.' },
    ],
  },
  { id: 'a5', title: 'Quy định mới về sang tên biển số cá nhân 2026', cat: 'Cập nhật quy định', date: '28/06/2026', excerpt: 'Những điểm chủ xe cần lưu ý khi làm hồ sơ chuyển nhượng.', status: 'Bản nháp' },
  { id: 'a6', title: 'Biển gánh, biển đối xứng — vẻ đẹp của thế cân bằng', cat: 'Cách chọn biển hợp mệnh', date: '19/06/2026', excerpt: 'Nhóm số đối xứng và lý do người mệnh Thổ thường chọn nhóm này.', status: 'Bản nháp' },
];


export const CONTACTS = [
  { id: 'c1', name: 'Trần Quốc Bảo', phone: '0905 221 334', pid: 'p1', time: '09:12 hôm nay', status: 'Mới' },
  { id: 'c2', name: 'Lê Thị Hạnh', phone: '0912 887 010', pid: 'p4', time: '08:40 hôm nay', status: 'Đang tư vấn' },
  { id: 'c3', name: 'Nguyễn Văn Sơn', phone: '0938 445 120', pid: 'p6', time: 'Hôm qua', status: 'Đã chốt' },
  { id: 'c4', name: 'Phạm Minh Tuấn', phone: '0977 300 918', pid: 'p2', time: 'Hôm qua', status: 'Mới' },
  { id: 'c5', name: 'Võ Thanh Hà', phone: '0903 118 776', pid: 'p9', time: '2 ngày trước', status: 'Đang tư vấn' },
];

export const STAFF = [
  { id: 's1', name: 'Duy Đinh', email: 'duy@biensovip.com', role: 'Admin', active: true, added: '12/01/2026' },
  { id: 's2', name: 'Lê Thị Hạnh', email: 'hanh@biensovip.com', role: 'Editor', active: true, added: '02/03/2026' },
  { id: 's3', name: 'Nguyễn Văn Sơn', email: 'son@biensovip.com', role: 'Editor', active: false, added: '20/04/2026' },
];

export const priceNum = (p) => { const n = String(p).replace(/[^0-9]/g, ''); return n ? parseInt(n, 10) : 0; };
export const opts = (arr) => arr.map((v) => ({ value: v, label: v }));
export const validatePhone = (v) => /^0\d{8,10}$/.test(String(v).replace(/[\s.]/g, ''));
