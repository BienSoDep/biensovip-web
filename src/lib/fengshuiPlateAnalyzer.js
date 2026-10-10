// Thuật toán luận giải phong thủy biển số toàn diện cho BienSoDep
// Phân tích 5 chiều: Ngũ hành Hà Đồ, Tổng nút, Âm Dương tương phối, Thế số tài lộc & cảnh báo, Quẻ Kinh Dịch Mai Hoa.

// 1. Map Hà Đồ chuẩn Tiên Thiên Thập Số:
// "Thiên nhất sinh Thủy, Địa lục thành chi" => 1, 6 thuộc Thủy
// "Địa nhị sinh Hỏa, Thiên thất thành chi" => 2, 7 thuộc Hỏa
// "Thiên tam sinh Mộc, Địa bát thành chi" => 3, 8 thuộc Mộc
// "Địa tứ sinh Kim, Thiên cửu thành chi" => 4, 9 thuộc Kim
// "Thiên ngũ sinh Thổ, Địa thập thành chi" => 5, 0 (10) thuộc Thổ
export const DIGIT_ELEMENTS = {
  1: 'Thủy', 6: 'Thủy',
  2: 'Hỏa',  7: 'Hỏa',
  3: 'Mộc',  8: 'Mộc',
  4: 'Kim',  9: 'Kim',
  5: 'Thổ',  0: 'Thổ',
};

export const ELEMENT_COLORS = {
  Kim: { bg: '#f8fafc', border: '#cbd5e1', text: '#334155', dot: '#94a3b8', badge: '#475569' },
  Mộc: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', dot: '#10b981', badge: '#059669' },
  Thủy: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6', badge: '#2563eb' },
  Hỏa: { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', dot: '#f43f5e', badge: '#e11d48' },
  Thổ: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b', badge: '#d97706' },
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
    series, // dãy số chính (ví dụ "88888" hoặc "16436")
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
};

// Trọn vẹn 64 Quẻ Kinh Dịch Chuẩn Xác (Thượng quái uNum - Hạ quái lNum)
export const QUE_DICHS = {
  // Thượng Càn (1)
  '1-1': { name: 'Thuần Càn', tone: 'dai-cat', desc: 'Rồng bay trên trời. Vận thế cực thịnh, công danh rộng mở, xe đi ngàn dặm bình an thuận lợi.' },
  '1-2': { name: 'Thiên Trạch Lý', tone: 'cat', desc: 'Giẫm đuôi cọp mà không cắn. Đi đường giữ đúng luật lệ thì mọi hiểm nguy đều hóa an lành hanh thông.' },
  '1-3': { name: 'Thiên Hỏa Đồng Nhân', tone: 'dai-cat', desc: 'Đồng tâm hiệp lực, kết nối bạn hữu. Rất hợp cho kinh doanh giao thương, xe lăn bánh đón quý nhân.' },
  '1-4': { name: 'Thiên Lôi Vô Vọng', tone: 'trung-binh', desc: 'Chân thành thuận theo lẽ tự nhiên, không vọng tưởng xốc nổi. Lái xe điềm tĩnh ắt giữ trọn phúc khí.' },
  '1-5': { name: 'Thiên Phong Cấu', tone: 'cat', desc: 'Gặp gỡ cơ duyên tốt lành. Xe cộ đưa đón mối quan hệ mới, mở rộng ngoại giao làm ăn phát đạt.' },
  '1-6': { name: 'Thiên Thủy Tụng', tone: 'trung-binh', desc: 'Bất hòa tranh chấp cần nhường nhịn. Khi tham gia giao thông nên giữ bình tĩnh dĩ hòa vi quý.' },
  '1-7': { name: 'Thiên Sơn Độn', tone: 'trung-binh', desc: 'Lùi một bước trời cao biển rộng. Cần cẩn trọng khi xuất hành xa, dưỡng sức chờ cơ hội tốt.' },
  '1-8': { name: 'Thiên Địa Bĩ', tone: 'hung', desc: 'Khí trời đất bế tắc tạm thời. Nên bảo dưỡng xe cộ cẩn thận, đi lại từ tốn và kiên nhẫn đợi vận hanh thông.' },

  // Thượng Đoài (2)
  '2-1': { name: 'Trạch Thiên Quải', tone: 'cat', desc: 'Quyết đoán dứt khoát vượt khó khăn. Thúc đẩy công việc hanh thông, xe cộ mở lối thành công.' },
  '2-2': { name: 'Thuần Đoài', tone: 'cat', desc: 'Vui vẻ hòa nhã, lời nói sinh tài. Đi lại mang lại niềm vui, đối tác tin cậy, vạn sự thuận hòa.' },
  '2-3': { name: 'Trạch Hỏa Cách', tone: 'cat', desc: 'Cải cách đổi mới, lột xác vươn lên. Rất hợp cho người khởi nghiệp hoặc chuyển hướng kinh doanh mới.' },
  '2-4': { name: 'Trạch Lôi Tùy', tone: 'cat', desc: 'Thuận thời tùy biến. Lái xe uyển chuyển, công việc gặp cơ hội là nắm bắt thành công.' },
  '2-5': { name: 'Trạch Phong Đại Quá', tone: 'trung-binh', desc: 'Cột trụ chịu tải lớn. Cần chú ý bảo trì phương tiện định kỳ, không chở quá tải hay hấp tấp.' },
  '2-6': { name: 'Trạch Thủy Khốn', tone: 'trung-binh', desc: 'Nước cạn đầm lầy. Nhắc nhở người cầm lái rèn luyện ý chí, vượt qua khúc quanh gian truân.' },
  '2-7': { name: 'Trạch Sơn Hàm', tone: 'dai-cat', desc: 'Cảm ứng tương thông, duyên lành hội tụ. Xe cộ chở niềm vui, gia đạo hạnh phúc, công việc ăn ý.' },
  '2-8': { name: 'Trạch Địa Tụy', tone: 'dai-cat', desc: 'Tụ họp đông đúc, tài lộc hội tụ. Làm ăn buôn bán đắt hàng, thu hút tiền tài đông đúc.' },

  // Thượng Ly (3)
  '3-1': { name: 'Hỏa Thiên Đại Hữu', tone: 'dai-cat', desc: 'Mặt trời chiếu sáng giữa trời cao. Tài sản dồi dào, vượng phát tột bậc, vạn nẻo đường quang minh.' },
  '3-2': { name: 'Hỏa Trạch Khuê', tone: 'trung-binh', desc: 'Trái ý bất đồng nhỏ. Cần hòa nhã với người xung quanh và tập trung quan sát khi điều khiển xe.' },
  '3-3': { name: 'Thuần Ly', tone: 'cat', desc: 'Ánh sáng rực rỡ, danh tiếng vang xa. Hợp người làm nghệ thuật, truyền thông, kinh doanh tạo dựng uy tín.' },
  '3-4': { name: 'Hỏa Lôi Phệ Hạp', tone: 'cat', desc: 'Cắn đứt trở ngại, luật lệ nghiêm minh. Mọi rào cản trên hành trình đều được hóa giải sáng tỏ.' },
  '3-5': { name: 'Hỏa Phong Đỉnh', tone: 'dai-cat', desc: 'Đỉnh vàng vững chãi. Đạt đến đỉnh cao sự nghiệp, xe cộ sang trọng vững vàng tài lộc.' },
  '3-6': { name: 'Hỏa Thủy Vị Tế', tone: 'trung-binh', desc: 'Chưa hoàn thành trọn vẹn, còn nhiều tiềm năng phát triển phía trước. Kiên trì ắt đến đích.' },
  '3-7': { name: 'Hỏa Sơn Lữ', tone: 'cat', desc: 'Khách bộ hành trên đường xa. Rất hợp cho người hay đi công tác, du lịch, xe bon bon ngàn dặm.' },
  '3-8': { name: 'Hỏa Địa Tấn', tone: 'dai-cat', desc: 'Mặt trời mọc trên mặt đất. Thăng quan tiến chức, danh vọng lẫy lừng, phát tài phát lộc.' },

  // Thượng Chấn (4)
  '4-1': { name: 'Lôi Thiên Đại Tráng', tone: 'dai-cat', desc: 'Sức mạnh sấm sét kinh thiên động địa. Năng lượng dũng mãnh, mở đường công danh sự nghiệp lớn.' },
  '4-2': { name: 'Lôi Trạch Quy Muội', tone: 'trung-binh', desc: 'Khởi đầu cần cẩn trọng tuân theo quy củ. Đi đường giữ tốc độ vừa phải, tránh vội vàng hấp tấp.' },
  '4-3': { name: 'Lôi Hỏa Phong', tone: 'dai-cat', desc: 'Sấm chớp rạng rỡ, thịnh vượng đủ đầy. Xe chở tài lộc bội thu, cơ hội làm ăn lớn liên tục gõ cửa.' },
  '4-4': { name: 'Thuần Chấn', tone: 'cat', desc: 'Sấm vang ngàn dặm, đánh thức tiềm năng. Xe mang năng lượng khởi sắc mạnh mẽ, chủ xe quyết đoán.' },
  '4-5': { name: 'Lôi Phong Hằng', tone: 'cat', desc: 'Bền vững dài lâu son sắt. Xe cộ ít hỏng hóc, sự nghiệp và gia đạo trường tồn ổn định.' },
  '4-6': { name: 'Lôi Thủy Giải', tone: 'cat', desc: 'Sấm mưa giải thoát hiểm nghèo. Hóa hung thành cát, vượt qua mọi khó khăn trên cung đường đời.' },
  '4-7': { name: 'Lôi Sơn Tiểu Quá', tone: 'trung-binh', desc: 'Hơi vượt quá mức cần thiết một chút. Nên khiêm tốn từ tốn, chú ý biển báo tốc độ an toàn.' },
  '4-8': { name: 'Lôi Địa Dự', tone: 'dai-cat', desc: 'Vui mừng hớn hở, chuẩn bị chu đáo. Xuất hành đón may mắn, vạn sự thuận buồm xuôi gió.' },

  // Thượng Tốn (5)
  '5-1': { name: 'Phong Thiên Tiểu Súc', tone: 'cat', desc: 'Tích lũy nhỏ thành thành quả lớn. Kiên trì từng bước, chiếc xe tích góp sinh tài cho chủ.' },
  '5-2': { name: 'Phong Trạch Trung Phu', tone: 'dai-cat', desc: 'Lòng thành tín cảm hóa vạn vật. Rất hợp cho kinh doanh giữ chữ tín, xe đi ngàn dặm bình an.' },
  '5-3': { name: 'Phong Hỏa Gia Nhân', tone: 'cat', desc: 'Gia đạo êm ấm trong ngoài thuận hòa. Xe cộ che chở cho gia đình, mang lại tổ ấm an khang thịnh vượng.' },
  '5-4': { name: 'Phong Lôi Ích', tone: 'dai-cat', desc: 'Gió sấm trợ lực tăng tiến không ngừng. Lợi tức dồi dào, thăng tiến sự nghiệp, biển số đại cát.' },
  '5-5': { name: 'Thuần Tốn', tone: 'cat', desc: 'Gió mềm dẻo thấu triệt muôn nơi. Đi lại linh hoạt, giao thiệp dễ mến, công việc mở rộng hanh thông.' },
  '5-6': { name: 'Phong Thủy Hoán', tone: 'cat', desc: 'Gió thổi tan mây mờ. Giải tỏa âu lo bế tắc, xuất hành khai thông sinh khí mới mẻ.' },
  '5-7': { name: 'Phong Sơn Tiệm', tone: 'cat', desc: 'Từng bước tiến lên vững chắc như cây trên núi. Vận thế thăng tiến đều đặn, không lo tụt dốc.' },
  '5-8': { name: 'Phong Địa Quán', tone: 'cat', desc: 'Chiêm ngưỡng trông rộng nhìn xa. Trí tuệ sáng suốt khi cầm lái, nhìn rõ thời vận kinh doanh.' },

  // Thượng Khảm (6)
  '6-1': { name: 'Thủy Thiên Nhu', tone: 'cat', desc: 'Chờ thời cơ chín muồi, tích dưỡng nội lực. Điềm tĩnh lái xe ắt gặt hái thành quả vững bền.' },
  '6-2': { name: 'Thủy Trạch Tiết', tone: 'cat', desc: 'Tiết độ chừng mực, kiểm soát chi tiêu tốt. Xe chạy ổn định, an toàn kỷ luật là mẹ thành công.' },
  '6-3': { name: 'Thủy Hỏa Ký Tế', tone: 'dai-cat', desc: 'Nước lửa giao hòa thành việc lớn. Vạn sự chu toàn viên mãn, xe bon bon vạn dặm đắc tài đắc lộc.' },
  '6-4': { name: 'Thủy Lôi Truân', tone: 'trung-binh', desc: 'Khởi đầu nhiều gian nan nhưng càng về sau càng vượng. Cần kiên nhẫn khi mới khởi sự.' },
  '6-5': { name: 'Thủy Phong Tỉnh', tone: 'cat', desc: 'Giếng nước ngọt nuôi sống muôn người. Nguồn thu nhập ổn định vô tận, không lo cạn kiệt tài chính.' },
  '6-6': { name: 'Thuần Khảm', tone: 'trung-binh', desc: 'Nước sâu hiểm trở cần linh hoạt. Nhắc nhở người lái luôn tập trung chú ý khi đi đường xa trời mưa.' },
  '6-7': { name: 'Thủy Sơn Kiển', tone: 'trung-binh', desc: 'Trở ngại trước mắt cần tìm quý nhân giúp sức. Không nên đi cố khi mệt mỏi, giữ sức bền bỉ.' },
  '6-8': { name: 'Thủy Địa Tỷ', tone: 'dai-cat', desc: 'Thân thiện gắn bó, bạn hữu tương trợ. Đi đến đâu có người giúp đến đó, lữ hành an toàn.' },

  // Thượng Cấn (7)
  '7-1': { name: 'Sơn Thiên Đại Súc', tone: 'dai-cat', desc: 'Chứa đựng cơ đồ lớn lao, đức dày tài vượng. Hợp gom góp của cải, mua xe tích lũy gia tài.' },
  '7-2': { name: 'Sơn Trạch Tổn', tone: 'cat', desc: 'Bớt chỗ thừa đắp chỗ thiếu, hy sinh ngắn hạn hưởng lợi dài lâu. Đầu tư sinh lời khôn ngoan.' },
  '7-3': { name: 'Sơn Hỏa Bí', tone: 'cat', desc: 'Vẻ đẹp văn hóa rạng rỡ. Xe cộ sang trọng bắt mắt, đem lại thể diện và sự tôn trọng từ đối tác.' },
  '7-4': { name: 'Sơn Lôi Di', tone: 'cat', desc: 'Nuôi dưỡng thể chất và tinh thần. Phương tiện giúp ích cho sức khỏe và đời sống no đủ.' },
  '7-5': { name: 'Sơn Phong Cổ', tone: 'cat', desc: 'Chấn hưng cải tạo, loại bỏ cái cũ đón vận hội mới. Rất hợp để chấn chỉnh công việc, cải vận bứt phá thành công.' },
  '7-6': { name: 'Sơn Thủy Mông', tone: 'trung-binh', desc: 'Khai tâm sáng trí, học hỏi kinh nghiệm. Lái xe cẩn trọng, tích lũy dặm trường kinh nghiệm quý.' },
  '7-7': { name: 'Thuần Cấn', tone: 'cat', desc: 'Vững chắc như dãy Trường Sơn. Định tâm kiên định, xe đi đầm chắc an toàn không gì lay chuyển.' },
  '7-8': { name: 'Sơn Địa Bác', tone: 'trung-binh', desc: 'Cũ mòn cần tu bổ bảo dưỡng. Nhắc nhở chủ xe kiểm tra xe định kỳ, cẩn trọng giữ gìn tài sản.' },

  // Thượng Khôn (8)
  '8-1': { name: 'Địa Thiên Thái', tone: 'dai-cat', desc: 'Trời đất giao hòa, vạn vật hanh thông sinh sôi. Biển số đại cát, tài lộc dồi dào, xuất hành như ý.' },
  '8-2': { name: 'Địa Trạch Lâm', tone: 'dai-cat', desc: 'Thời vận may mắn giáng lâm, cấp trên nâng đỡ. Xe mở lối thăng tiến vượt bậc, kinh doanh thuận buồm.' },
  '8-3': { name: 'Địa Hỏa Minh Di', tone: 'trung-binh', desc: 'Ánh sáng lặn vào lòng đất. Cần khiêm nhường chờ thời cơ, giữ vững tay lái khi trời tối.' },
  '8-4': { name: 'Địa Lôi Phục', tone: 'dai-cat', desc: 'Sinh khí hồi sinh mạnh mẽ sau đông dài. Cơ hội kinh doanh quay trở lại, phục hồi tài chính thần tốc.' },
  '8-5': { name: 'Địa Phong Thăng', tone: 'dai-cat', desc: 'Cây mọc vươn cao khỏi mặt đất. Thăng quan tiến chức, sự nghiệp đi lên từng ngày không gì ngăn cản.' },
  '8-6': { name: 'Địa Thủy Sư', tone: 'cat', desc: 'Kỷ luật quân đội vững vàng, tướng tài cầm quân. Lái xe an toàn chuẩn mực, công việc có trật tự quy củ.' },
  '8-7': { name: 'Địa Sơn Khiêm', tone: 'dai-cat', desc: 'Núi cao nằm dưới đất — đức khiêm nhường hưởng phúc dày. Vạn sự êm đẹp, quý nhân luôn song hành.' },
  '8-8': { name: 'Thuần Khôn', tone: 'dai-cat', desc: 'Đất mẹ bao la chở che. Nhu thuận sinh tài, đi đường an toàn, bền bỉ tích lũy gia tài vững như bàn thạch.' },
};

export function computeQueDich(series) {
  if (!series || series.length < 2) {
    return {
      thuongQue: BAT_QUAI[1],
      haQue: BAT_QUAI[1],
      queKey: '1-1',
      queName: 'Thuần Càn',
      tone: 'dai-cat',
      desc: 'Dãy số chứa năng lượng tích cực, hanh thông.',
    };
  }

  // Tách thượng quái và hạ quái theo Mai Hoa Dịch Số
  // Biển 5 số: 2 số đầu làm Thượng quái, 3 số sau làm Hạ quái (Thiên thanh Địa trọc, Thượng khinh Hạ trọng)
  const mid = series.length > 4 ? 2 : Math.floor(series.length / 2);
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

// Luận giải chi tiết tổng nút (Nước số)
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
    0: { label: 'Vẹn Mười — Tích Lũy Bền Vững', tone: 'primary', desc: 'Tổng tròn chục (10, 20, 30 điểm gọi là 10 Nút hoặc Vẹn Mười). Tượng trưng cho sự tích lũy tròn đầy, bảo toàn tiền của, đi đường từ tốn bền bỉ.' },
    4: { label: 'Hung Kỵ — Nút "Tử"', tone: 'danger', desc: '4 nút theo âm Hán Việt là "Tử", dân gian kiêng kỵ vì dễ hao tài tốn của. Nên hóa giải bằng vật phẩm phong thủy hoặc cân nhắc cải vận.' },
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
  const lastElement = DIGIT_ELEMENTS[lastDigit] || 'Thủy';

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
        desc: `Biển số và bản mệnh cùng mang hành ${userEl}. Đồng hành tương trợ, khí chất tương đồng, làm ăn vững chãi và an tâm di chuyển.`,
      };
      elementScore = 28;
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
  else if (nutInfo.nut === 0) nutScore = 16; // 10 Nút trọn vẹn
  else if (nutInfo.nut === 2 || nutInfo.nut === 1) nutScore = 12;
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
  if (queDich.tone === 'dai-cat') queScore = 16;
  else if (queDich.tone === 'cat') queScore = 13;
  else if (queDich.tone === 'trung-binh') queScore = 8;
  else queScore = 4;

  // Tổng điểm tổng hợp (Max 100)
  let totalScore = Math.round(elementScore + nutScore + amDuongScore + patternScore + queScore);
  totalScore = Math.max(15, Math.min(99, totalScore));

  // Đánh giá xếp hạng
  let rank = {
    title: 'Bình Hòa',
    tone: 'warning',
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    summary: 'Biển số mang năng lượng trung bình, các yếu tố cát hung đan xen. Bạn nên lưu ý các điểm khuyết để gia tăng tài lộc.',
  };
  if (totalScore >= 80) {
    rank = {
      title: 'Đại Cát — Cực Phẩm',
      tone: 'success',
      color: '#059669',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
      summary: 'Biển số hội tụ vượng khí dồi dào, âm dương tương phối đắc địa, tương trợ đắc lực cho đường tài vận và bình an của chủ sở hữu.',
    };
  } else if (totalScore >= 65) {
    rank = {
      title: 'Cát Lợi — Hanh Thông',
      tone: 'primary',
      color: 'var(--action-primary, #C75B00)',
      bgColor: '#fff7ed',
      borderColor: '#fed7aa',
      summary: 'Biển số có thế tốt, nhiều con số cát khí trợ vận. Phương tiện đồng hành tin cậy, thúc đẩy công việc tiến triển đều đặn.',
    };
  } else if (totalScore < 50) {
    rank = {
      title: 'Cần Cải Thiện',
      tone: 'danger',
      color: '#e11d48',
      bgColor: '#fff1f2',
      borderColor: '#fecdd3',
      summary: 'Biển số có một số yếu tố xung khắc hoặc điểm nút chưa thuận lợi, năng lượng bị phân tán. Khuyên bạn nên tham khảo phương án đổi biển số hợp phong thủy để cải vận.',
    };
  }

  // Điểm khuyết & Tiêu chí đề xuất cải vận
  const improvementPoints = [];
  if (napAm && elementRelation && (elementRelation.type === 'khac-nhap' || elementRelation.type === 'sinh-xuat')) {
    improvementPoints.push(`Khắc phục thế số ${elementRelation.label} bằng biển số mang hành ${napAm.sinhChoMe} (tương sinh mệnh ${napAm.element}).`);
  }
  if (nutInfo.nut === 4) {
    improvementPoints.push(`Nâng số nút từ 4 nút (nút Tử) lên 8 hoặc 9 nút Đại Cát để kích hoạt dòng tiền mạnh mẽ.`);
  }
  if (patterns.warnings.length > 0) {
    improvementPoints.push(`Loại bỏ các con số nhạy cảm (${patterns.warnings.map((w) => w.name).join(', ')}) để yên tâm trên mọi cung đường.`);
  }
  if (patterns.beauties.length === 0) {
    improvementPoints.push('Bổ sung các cặp số tài lộc mạnh (Lộc Phát 68/86, Thần Tài 39/79, Số Gánh) phù hợp cho kinh doanh và thăng tiến.');
  }
  if (missingElements.length > 0) {
    improvementPoints.push(`Biển hiện tại khuyết hành ${missingElements.join(', ')}. Cần cân bằng năng lượng ngũ hành bằng biển tương sinh.`);
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
