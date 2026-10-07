/**
 * plateDiscussionBank.js — Hệ thống sinh thảo luận, hỏi đáp & phản hồi chuyên gia Duy Đinh
 * độc bản theo từng biển số (Deterministic Contextual Generator).
 * 
 * Đảm bảo:
 * 1. Các đoạn bình luận sôi nổi, đa dạng, đúng tâm lý khách mua biển số thực tế.
 * 2. Admin là "Duy Đinh" trả lời lịch sự, nhã nhặn, chuẩn mực xưng hô và am hiểu sâu luật TT24 & phong thủy.
 * 3. Không bị trùng lặp giữa các trang biển số: mỗi biển số tạo ra tổ hợp thảo luận riêng biệt
 *    dựa trên thuật toán băm chuỗi (string hash) theo số biển, phân loại thế số, tỉnh thành và loại xe.
 */

import { splitPlateNumber } from './plateFormat.js';

// Danh sách khách hàng hỏi đáp phong phú
const BUYER_NAMES = [
  'Anh Quốc Bảo', 'Anh Minh Trí', 'Anh Hoàng Nam', 'Anh Quang Huy',
  'Bác Thanh Tùng', 'Anh Trọng Nhân', 'Anh Tuấn Anh', 'Chị Ngọc Bích',
  'Anh Đức Thắng', 'Anh Hữu Long', 'Bác Đình Trọng', 'Anh Hải Đăng',
  'Chị Thanh Mai', 'Anh Việt Cường', 'Anh Thế Hiển', 'Bác Văn Phúc',
  'Anh Công Thành', 'Chị Bích Phương', 'Anh Tấn Lộc', 'Anh Duy Khánh',
  'Anh Hồng Sơn', 'Bác Quang Hưng', 'Anh Nhật Hoàng', 'Chị Thùy Dương',
];

// Địa bàn giao dịch thực tế
const LOCATIONS = [
  'Hải Châu, Đà Nẵng', 'Thanh Khê, Đà Nẵng', 'Sơn Trà, Đà Nẵng',
  'Cầu Giấy, Hà Nội', 'Tây Hồ, Hà Nội', 'Nam Từ Liêm, Hà Nội',
  'Quận 1, TP.HCM', 'Quận 7, TP.HCM', 'TP. Thủ Đức, TP.HCM',
  'TP. Hội An, Quảng Nam', 'Tam Kỳ, Quảng Nam', 'TP. Huế, TT-Huế',
  'TP. Vinh, Nghệ An', 'Hồng Bàng, Hải Phòng', 'TP. Biên Hòa, Đồng Nai',
  'TP. Thủ Dầu Một, Bình Dương', 'TP. Nha Trang, Khánh Hòa', 'TP. Cần Thơ',
];

// Xe sang ô tô
const LUXURY_CARS = [
  'Mercedes-Benz S450 Luxury', 'Mercedes-Benz GLC 300 4MATIC', 'Mercedes-Benz E300 AMG',
  'Porsche Macan GTS', 'Porsche Cayenne Coupe', 'Porsche Panamera',
  'Lexus RX350 Premium', 'Lexus LX600 VIP', 'Lexus ES250',
  'BMW X5 xDrive40i', 'BMW 530i M-Sport', 'BMW 740i Pure Excellence',
  'Ford Everest Titanium+ 4x4', 'Hyundai Santa Fe Calligraphy', 'Kia Carnival Signature 3.5G',
  'Toyota Land Cruiser Prado', 'Toyota Camry 2.5Q', 'VinFast VF9 Plus',
];

// Xe máy cao cấp
const LUXURY_BIKES = [
  'Honda SH 160i ABS Thể Thao', 'Honda SH 350i Nhập Ý',
  'Vespa Sprint Justin Bieber Edition', 'Vespa GTS 300 Super Sport',
  'Honda Super Cub C125', 'Ducati Scrambler Icon',
];

// Simple deterministic string hash (djb2)
function stringHash(str) {
  let hash = 5381;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Phân tích đặc tính biển số
export function analyzePlateCharacteristics(plate) {
  const plateNumber = String(plate?.plateNumber || '').trim();
  const digits = plateNumber.replace(/\D/g, '');
  const { num } = splitPlateNumber(plateNumber);
  const cleanNum = num.replace(/\D/g, '');
  const isCar = (plate?.vehicleType || '').toLowerCase().includes('máy') ? false : true;

  const isNguQuy = cleanNum.length >= 5 && /^(\d)\1{4}$/.test(cleanNum.slice(-5));
  const isTuQuy = !isNguQuy && cleanNum.length >= 4 && (/^(\d)\1{3}/.test(cleanNum.slice(-4)) || /(\d)\1{3}/.test(cleanNum));
  const isSanhTien = /(12345|23456|34567|45678|56789|1234|2345|3456|4567|5678|6789)/.test(cleanNum);
  const isLocPhat = cleanNum.includes('68') || cleanNum.includes('86');
  const isThanTai = cleanNum.includes('39') || cleanNum.includes('79');
  const isTamHoa = !isNguQuy && !isTuQuy && cleanNum.length >= 3 && /(\d)\1{2}/.test(cleanNum);
  const isGanhDao = cleanNum.length >= 4 && (cleanNum[0] === cleanNum[cleanNum.length - 1]);

  let plateStyle = 'phong-thuy';
  if (isNguQuy) plateStyle = 'ngu-quy';
  else if (isTuQuy) plateStyle = 'tu-quy';
  else if (isSanhTien) plateStyle = 'sanh-tien';
  else if (isLocPhat) plateStyle = 'loc-phat';
  else if (isThanTai) plateStyle = 'than-tai';
  else if (isTamHoa) plateStyle = 'tam-hoa';
  else if (isGanhDao) plateStyle = 'ganh-dao';

  return {
    plateNumber,
    digits,
    cleanNum,
    isCar,
    plateStyle,
    province: plate?.province || 'Đà Nẵng',
    price: plate?.price || 0,
  };
}

/**
 * Sinh danh sách 3–5 câu hỏi thảo luận & câu trả lời lịch sự từ Duy Đinh
 * Đảm bảo tính độc bản cho từng biển số.
 */
export function generatePlateDiscussions(plate) {
  if (!plate) return [];
  const chars = analyzePlateCharacteristics(plate);
  const seed = stringHash(chars.plateNumber || plate.id || 'bienso');

  const buyer1 = BUYER_NAMES[seed % BUYER_NAMES.length];
  const buyer2 = BUYER_NAMES[(seed + 7) % BUYER_NAMES.length];
  const buyer3 = BUYER_NAMES[(seed + 13) % BUYER_NAMES.length];
  const buyer4 = BUYER_NAMES[(seed + 19) % BUYER_NAMES.length];

  const loc1 = LOCATIONS[seed % LOCATIONS.length];
  const loc2 = LOCATIONS[(seed + 5) % LOCATIONS.length];
  const loc3 = LOCATIONS[(seed + 11) % LOCATIONS.length];

  const vehicleCar1 = LUXURY_CARS[seed % LUXURY_CARS.length];
  const vehicleCar2 = LUXURY_CARS[(seed + 6) % LUXURY_CARS.length];
  const vehicleBike1 = LUXURY_BIKES[seed % LUXURY_BIKES.length];
  const chosenVehicle = chars.isCar ? vehicleCar1 : vehicleBike1;
  const secondaryVehicle = chars.isCar ? vehicleCar2 : LUXURY_BIKES[(seed + 2) % LUXURY_BIKES.length];

  const discussions = [];

  // Danh sách ý kiến cộng đồng bổ trợ (user-to-user interaction)
  const peerCommentsPool1 = [
    {
      author: 'Anh Trần Hùng',
      badge: 'Đã mua biển tại sàn',
      location: 'Bình Thạnh, TP.HCM',
      date: 'Hôm qua',
      content: `Chuẩn đó bác @${buyer1}! Tháng trước em cũng mua một biển đầu số Đà Nẵng bên anh Duy mang về đăng ký tại Đội CSGT Rạch Chiếc (Thủ Đức). Hồ sơ anh Duy chuẩn bị sẵn hết từ A-Z, nộp DVC online xong ra nộp biển cũ lấy giấy hẹn 2 ngày là có biển mới tên mình, cực kỳ tiện lợi!`,
      reactions: { like: 12 + (seed % 7), love: 6 + (seed % 5), haha: 2, wow: 3, sad: 0, angry: 0 },
    },
    {
      author: 'Bác Nguyễn Quân',
      badge: 'Khách hàng thân thiết',
      location: 'Cầu Giấy, Hà Nội',
      date: 'Hôm qua',
      content: `Bác @${buyer1} an tâm nhé, Thông tư 24 giờ mở rộng cho người dân đăng ký biển định danh trúng đấu giá toàn quốc rồi. Quan trọng nhất là mua đúng chỗ uy tín, nguồn gốc biển sạch và hợp đồng công chứng đầy đủ như bên anh Duy là kê cao gối ngủ.`,
      reactions: { like: 15 + (seed % 6), love: 8, haha: 1, wow: 5, sad: 0, angry: 0 },
    },
  ];

  const peerCommentsPool2 = [
    {
      author: 'Anh Lê Văn Dũng',
      badge: 'Thành viên VIP',
      location: 'Quận 7, TP.HCM',
      date: '1 ngày trước',
      content: `Dãy số biển ${chars.plateNumber} này nhìn trực diện ở ngoài còn nét và thoáng hơn trên ảnh nhiều bác @${buyer2} ơi! Bác mà lắp lên ${chosenVehicle} màu đen hoặc trắng là chuẩn bài phong thủy luôn, đi đường ai cũng phải liếc nhìn.`,
      reactions: { like: 14 + (seed % 9), love: 11 + (seed % 6), haha: 4, wow: 6, sad: 0, angry: 0 },
    },
    {
      author: 'Anh Đỗ Khắc Cường',
      badge: 'Chơi xe & biển số',
      location: 'Hải Châu, Đà Nẵng',
      date: '2 ngày trước',
      content: `Em theo dõi sàn đấu giá đợt này thấy các thế số như ${chars.plateNumber} bị cạnh tranh gắt gao lắm, giá này bên Duy Đinh bao trọn gói công chứng định danh là rất hợp lý và có lộc cho người mua rồi đó bác.`,
      reactions: { like: 9 + (seed % 8), love: 7, haha: 2, wow: 4, sad: 0, angry: 0 },
    },
  ];

  const peerCommentsPool3 = [
    {
      author: 'Bác Phạm Thế Anh',
      badge: 'Chủ doanh nghiệp',
      location: 'Hồng Bàng, Hải Phòng',
      date: '2 ngày trước',
      content: `Bác @${buyer3} cứ qua trực tiếp hoặc nhờ người nhà ghé showroom 106 Hoàng Diệu là rõ ngay. Anh Duy Đinh tư vấn rất đàng hoàng, cho xem tận mắt văn bản xác nhận trúng đấu giá của Cục CSGT rồi mới ký cọc, làm ăn minh bạch đàng hoàng 10 điểm!`,
      reactions: { like: 16 + (seed % 7), love: 8, haha: 3, wow: 4, sad: 0, angry: 0 },
    },
  ];

  // Câu 1: Về thủ tục trọn gói & thời gian sang tên Thông tư 24
  const q1Templates = [
    {
      q: `Chào anh Duy, biển ${chars.plateNumber} này đã bao gồm trọn gói chi phí thu hồi và thủ tục định danh vào xe mới của mình chưa? Mình ở ${loc1} thì bên mình hỗ trợ nộp hồ sơ ở đâu?`,
      r: `Dạ Duy Đinh xin kính chào ${buyer1}! Giá báo niêm yết trên hệ thống là giá trọn gói 100%, Biensovip cam kết bao toàn bộ chi phí công chứng ủy quyền mua bán, nộp lệ phí nhà nước và thực hiện thủ tục định danh tại Phòng CSGT Công an TP ${chars.province}. Anh chỉ cần chuẩn bị CCCD gắn chip và giấy tờ xe, chuyên viên bên Duy sẽ hỗ trợ nộp và lấy giấy hẹn tận nơi. Đúng 24h - 48h làm việc là hoàn tất thủ tục cấp đăng ký xe chính chủ tên anh ạ!`,
    },
    {
      q: `Em đang chuẩn bị nhận xe ${chosenVehicle} tại đại lý, muốn lấy biển ${chars.plateNumber} này gắn vào xe thì quy trình giữ biển và đặt cọc như thế nào vậy anh Duy?`,
      r: `Dạ Duy Đinh chào ${buyer1}, chúc mừng anh chuẩn bị nhận chiếc ${chosenVehicle} rất đẳng cấp! Quy trình bên Duy cực kỳ tinh gọn: Anh đặt cọc giữ biển qua hợp đồng điện tử/trực tiếp tại showroom 106 Hoàng Diệu, Đà Nẵng. Duy sẽ lập tức niêm phong hồ sơ, chuyển trạng thái "Đã cọc" trên hệ thống và cùng anh ký hợp đồng công chứng. Khi xe anh xuất hóa đơn đại lý, bên Duy sẽ trực tiếp nộp hồ sơ cấp biển định danh ngay trong ngày để anh kịp ngày đẹp bấm biển ra xe ạ!`,
    },
    {
      q: `Tôi ở tận ${loc1}, biển này đầu số ${chars.province} thì tôi có làm thủ tục định danh đứng tên chính chủ tại CSGT nơi tôi cư trú được không chuyên gia?`,
      r: `Dạ Duy Đinh xin kính chào ${buyer1}! Theo đúng quy định tại Thông tư 24/2023/TT-BCA của Bộ Công an, biển số định danh trúng đấu giá có giá trị lưu hành và đăng ký toàn quốc. Dù biển mang đầu số ${chars.province}, anh hoàn toàn có quyền đăng ký vào xe của mình tại Phòng CSGT nơi anh thường trú hoặc tạm trú (${loc1}). Biensovip có đội ngũ chuyên viên hỗ trợ giao dịch và sang tên tận nơi trên 63 tỉnh/thành, đảm bảo an toàn pháp lý tuyệt đối cho anh ạ!`,
    },
  ];
  const q1 = q1Templates[seed % q1Templates.length];
  discussions.push({
    id: `qa-${seed}-1`,
    author: buyer1,
    location: loc1,
    date: 'Hôm qua',
    content: q1.q,
    reactions: {
      like: 18 + (seed % 17),
      love: 10 + (seed % 9),
      haha: 3 + (seed % 4),
      wow: 4 + (seed % 5),
      sad: 0,
      angry: 0,
    },
    reply: {
      id: `reply-${seed}-1`,
      author: 'Duy Đinh',
      role: 'Chủ sáng lập Biensovip · Chuyên gia Biển Số',
      verified: true,
      date: 'Hôm qua',
      content: q1.r,
      reactions: {
        like: 28 + (seed % 15),
        love: 16 + (seed % 8),
        haha: 2,
        wow: 9 + (seed % 4),
        sad: 0,
        angry: 0,
      },
    },
    communityReplies: [
      {
        id: `comm-${seed}-1-1`,
        author: peerCommentsPool1[seed % peerCommentsPool1.length].author,
        badge: peerCommentsPool1[seed % peerCommentsPool1.length].badge,
        location: peerCommentsPool1[seed % peerCommentsPool1.length].location,
        date: peerCommentsPool1[seed % peerCommentsPool1.length].date,
        content: peerCommentsPool1[seed % peerCommentsPool1.length].content,
        reactions: peerCommentsPool1[seed % peerCommentsPool1.length].reactions,
      },
    ],
  });

  // Câu 2: Thảo luận chuyên sâu theo thế số phong thủy của biển
  let q2;
  if (chars.plateStyle === 'ngu-quy') {
    q2 = {
      q: `Biển ngũ quý ${chars.cleanNum.slice(-1)} (${chars.plateNumber}) này quá đỉnh! Dãy số này hợp với chủ doanh nghiệp thuộc mệnh nào nhất vậy anh Duy? Đi gặp đối tác ký kết hợp đồng thì có vượng khí không?`,
      r: `Dạ Duy Đinh xin chào ${buyer2}! Dãy ngũ quý ${chars.cleanNum.slice(-1)} là đỉnh cao của sự viên mãn và quyền lực ("Cửu ngũ chí tôn"). Trong phong thủy số học, số lặp đồng nhất 5 lần tạo ra trường năng lượng cực kỳ vững chãi, bổ trợ đặc biệt mạnh mẽ cho các bác làm kinh doanh quy mô lớn, đầu tư và điều hành doanh nghiệp. Biển này lắp lên xe như ${chosenVehicle} sẽ khẳng định uy tín vượt trội, mang lại sự thuận lợi và quyết đoán trong mọi thương vụ làm ăn ạ!`,
    };
  } else if (chars.plateStyle === 'tu-quy') {
    q2 = {
      q: `Dãy tứ quý ${chars.cleanNum.slice(-1)} của biển ${chars.plateNumber} gắn lên chiếc ${chosenVehicle} nhìn chắc chắn rất sang trọng. Anh Duy cho hỏi dãy số này mang ý nghĩa gì về phong thủy tài lộc?`,
      r: `Dạ Duy Đinh chào ${buyer2}! Tứ quý biểu trưng cho sự vững chãi của bốn mùa "Xuân - Hạ - Thu - Đông", mang ý nghĩa bốn mùa no ấm, công danh hưng thịnh suốt cả năm. Điểm đặc biệt của biển ${chars.plateNumber} là thế số tròn trịa, không dính số xấu, lại có âm dương cân bằng. Gắn lên chiếc ${chosenVehicle} không chỉ tạo điểm nhấn thị giác đẳng cấp mà còn giúp chủ nhân an tâm trên mọi cung đường công tác ạ!`,
    };
  } else if (chars.plateStyle === 'sanh-tien') {
    q2 = {
      q: `Thế số sảnh tiến của biển ${chars.plateNumber} nhìn rất cuốn hút. Người làm công chức hoặc thầu xây dựng thì đi biển sảnh tiến này có hỗ trợ thăng quan tiến chức không anh?`,
      r: `Dạ Duy Đinh xin chào ${buyer2}! Sảnh tiến được dân chơi biển và các doanh nhân gọi là thế số "Tiến lên không lùi", tượng trưng cho sự nghiệp liên tục thăng tiến, tháng sau cao hơn tháng trước, năm sau rực rỡ hơn năm trước. Với công việc điều hành, phát triển dự án hay công chức, biển sảnh tiến này đem lại năng lượng tích cực của sự hanh thông và bứt phá rất mạnh mẽ anh nhé!`,
    };
  } else if (chars.plateStyle === 'loc-phat') {
    q2 = {
      q: `Biển lộc phát ${chars.plateNumber} này có số 68/86 nhìn phát tài phát lộc quá. Tôi sinh năm 1982 hoặc 1986 thì gắn biển này có hợp bản mệnh không anh Duy?`,
      r: `Dạ Duy Đinh xin chào ${buyer2}! Cặp số 68 - 86 là cặp số vàng trong làng biển số: Lục ứng với Lộc, Bát ứng với Phát. Người sinh năm 1982 (Đại Hải Thủy) hoặc 1986 (Lư Trung Hỏa) đều có các mối tương sinh tương hỗ rất đẹp với dãy số này (Kim sinh Thủy, Hỏa vượng lộc). Đi biển lộc phát này sẽ giúp gia tăng vận khí hanh thông trong buôn bán và buôn may bán đắt ạ!`,
    };
  } else if (chars.plateStyle === 'than-tai') {
    q2 = {
      q: `Biển ${chars.plateNumber} có cặp số Thần Tài (39/79). Em kinh doanh cửa hàng và chuỗi dịch vụ thì chọn biển này có đúng điềm may mắn đón tài đón lộc không chuyên gia?`,
      r: `Dạ Duy Đinh chào ${buyer2}! Số 39 là Thần Tài Nhỏ, 79 là Thần Tài Lớn. Trong văn hóa kinh doanh Á Đông, biển Thần Tài luôn được các chủ tiệm, chủ doanh nghiệp bán lẻ và dịch vụ săn đón hàng đầu vì ngụ ý quý nhân phù trợ, khách khứa tấp nập, tài lộc dồi dào. Biển ${chars.plateNumber} có cấu trúc số rất thoáng đãng, anh chọn biển này để phục vụ công việc kinh doanh là một quyết định rất sáng suốt ạ!`,
    };
  } else {
    q2 = {
      q: `Biển số ${chars.plateNumber} này có tổng điểm bao nhiêu nút vậy anh Duy? Xe em màu trắng thì gắn biển này có hài hòa phong thủy không?`,
      r: `Dạ Duy Đinh chào ${buyer2}! Biển ${chars.plateNumber} có tổng các chữ số đạt điểm nút phong thủy rất đẹp, mang quẻ dịch cát lợi. Xe màu trắng tượng trưng cho hành Kim, kết hợp với các con số sinh vượng của biển sẽ tạo nên vòng ngũ hành khép kín tương sinh. Khi bàn giao, bên Duy sẽ hỗ trợ ép khung biển mica titan chống nước cao cấp để tôn trọn vẻ đẹp của biển trên nền xe trắng của anh ạ!`,
    };
  }
  discussions.push({
    id: `qa-${seed}-2`,
    author: buyer2,
    location: loc2,
    date: '2 ngày trước',
    content: q2.q,
    reactions: {
      like: 22 + (seed % 14),
      love: 14 + (seed % 11),
      haha: 2 + (seed % 3),
      wow: 8 + (seed % 5),
      sad: 0,
      angry: 0,
    },
    reply: {
      id: `reply-${seed}-2`,
      author: 'Duy Đinh',
      role: 'Chủ sáng lập Biensovip · Chuyên gia Biển Số',
      verified: true,
      date: '2 ngày trước',
      content: q2.r,
      reactions: {
        like: 34 + (seed % 12),
        love: 19 + (seed % 7),
        haha: 1,
        wow: 12 + (seed % 5),
        sad: 0,
        angry: 0,
      },
    },
    communityReplies: [
      {
        id: `comm-${seed}-2-1`,
        author: peerCommentsPool2[seed % peerCommentsPool2.length].author,
        badge: peerCommentsPool2[seed % peerCommentsPool2.length].badge,
        location: peerCommentsPool2[seed % peerCommentsPool2.length].location,
        date: peerCommentsPool2[seed % peerCommentsPool2.length].date,
        content: peerCommentsPool2[seed % peerCommentsPool2.length].content,
        reactions: peerCommentsPool2[seed % peerCommentsPool2.length].reactions,
      },
    ],
  });

  // Câu 3: Về pháp lý, check phạt nguội & tính minh bạch nguồn gốc
  const q3Templates = [
    {
      q: `Trước khi xuống tiền cọc biển ${chars.plateNumber}, bên mình có hỗ trợ kiểm tra trực tiếp tình trạng phạt nguội và xem hồ sơ trúng đấu giá gốc của Cục Cảnh sát giao thông không anh?`,
      r: `Dạ Duy Đinh xin kính chào ${buyer3}! Đây là băn khoăn rất chính đáng của quý khách khi giao dịch tài sản giá trị. Duy cam kết 100% biển số trên sàn Biensovip đều là biển sạch nguồn gốc: có đầy đủ văn bản xác nhận trúng đấu giá của Cục CSGT (Bộ Công an), hồ sơ xuất xứ minh bạch. Trước khi ký cọc, Duy sẽ cùng anh check tra cứu phạt nguội trực tiếp trên cổng thông tin Cục CSGT và xuất bản đối soát. Nếu phát hiện bất kỳ sai lệch nào, Biensovip xin đền bù gấp đôi tiền cọc cho anh ạ!`,
    },
    {
      q: `Tôi muốn chốt nhanh biển này trong ngày hôm nay, bên anh Duy có bớt thêm chút lộc may mắn cho khách thiện chí không ạ?`,
      r: `Dạ Duy Đinh rất cảm ơn sự thiện chí của ${buyer3}! Với khách hàng chốt giao dịch nhanh gọn trong ngày, Duy luôn sẵn lòng gia lộc may mắn đầu xuôi đuôi lọt cho anh. Ngoài ra, bên Duy xin dành tặng anh trọn bộ ép mica khung viền titan nguyên khối chống ố vàng trị giá 1.500.000đ và miễn phí 100% công chứng giao nhận hồ sơ tận tay. Anh vui lòng để lại SĐT hoặc nhắn trực tiếp Zalo 0815 792 699, Duy sẽ chốt mức giá lộc đẹp nhất cho anh nhé!`,
    },
    {
      q: `Biển này tôi muốn lắp cho xe ${secondaryVehicle} của công ty để đưa đón đối tác, bên anh có xuất được hợp đồng mua bán pháp lý và hóa đơn rõ ràng không?`,
      r: `Dạ Duy Đinh xin chào ${buyer3}! Hoàn toàn được anh nhé. Biensovip thực hiện đầy đủ hợp đồng chuyển nhượng ủy quyền công chứng hợp pháp giữa chủ sở hữu và công ty của anh. Toàn bộ chứng từ thanh toán, biên bản bàn giao biển số và giấy hẹn định danh của Phòng CSGT đều được lập chuẩn chỉ theo quy định của pháp luật, công ty anh hoàn toàn thuận tiện đưa vào chi phí hợp lý của doanh nghiệp ạ!`,
    },
  ];
  const q3 = q3Templates[(seed + 2) % q3Templates.length];
  discussions.push({
    id: `qa-${seed}-3`,
    author: buyer3,
    location: loc3,
    date: '3 ngày trước',
    content: q3.q,
    reactions: {
      like: 19 + (seed % 11),
      love: 10 + (seed % 7),
      haha: 1,
      wow: 7 + (seed % 6),
      sad: 0,
      angry: 0,
    },
    reply: {
      id: `reply-${seed}-3`,
      author: 'Duy Đinh',
      role: 'Chủ sáng lập Biensovip · Chuyên gia Biển Số',
      verified: true,
      date: '3 ngày trước',
      content: q3.r,
      reactions: {
        like: 29 + (seed % 10),
        love: 16 + (seed % 6),
        haha: 2,
        wow: 11 + (seed % 4),
        sad: 0,
        angry: 0,
      },
    },
    communityReplies: [
      {
        id: `comm-${seed}-3-1`,
        author: peerCommentsPool3[0].author,
        badge: peerCommentsPool3[0].badge,
        location: peerCommentsPool3[0].location,
        date: peerCommentsPool3[0].date,
        content: peerCommentsPool3[0].content,
        reactions: peerCommentsPool3[0].reactions,
      },
    ],
  });

  // Câu 4: (Tùy chọn tạo sự sôi nổi cho các biển số VIP)
  if (chars.price >= 50000000 || chars.plateStyle === 'ngu-quy' || chars.plateStyle === 'tu-quy' || chars.plateStyle === 'sanh-tien') {
    discussions.push({
      id: `qa-${seed}-4`,
      author: buyer4,
      location: 'Showroom 106 Hoàng Diệu, Đà Nẵng',
      date: '4 ngày trước',
      content: `Hôm qua tôi có qua trực tiếp văn phòng 106 Hoàng Diệu gặp anh Duy xem giấy tờ gốc của biển ${chars.plateNumber}. Tác phong làm việc rất chuyên nghiệp, tư vấn đàng hoàng và minh bạch từng điều khoản hợp đồng. Rất ủng hộ cách làm việc uy tín của anh Duy!`,
      reactions: {
        like: 31 + (seed % 15),
        love: 20 + (seed % 9),
        haha: 3,
        wow: 14 + (seed % 5),
        sad: 0,
        angry: 0,
      },
      reply: {
        id: `reply-${seed}-4`,
        author: 'Duy Đinh',
        role: 'Chủ sáng lập Biensovip · Chuyên gia Biển Số',
        verified: true,
        date: '4 ngày trước',
        content: `Duy Đinh xin chân thành cảm ơn ${buyer4} đã dành thời gian quý báu ghé thăm showroom và đặt trọn niềm tin vào Biensovip. Sự an tâm và hài lòng của quý khách hàng luôn là tôn chỉ hoạt động suốt hơn 10 năm qua của Duy. Kính chúc anh vạn dặm bình an, thượng lộ may mắn và sự nghiệp luôn thăng tiến rực rỡ!`,
        reactions: {
          like: 42 + (seed % 14),
          love: 25 + (seed % 8),
          haha: 4,
          wow: 18 + (seed % 6),
          sad: 0,
          angry: 0,
        },
      },
      communityReplies: [
        {
          id: `comm-${seed}-4-1`,
          author: 'Anh Lê Hoàng Minh',
          badge: 'Khách hàng VIP',
          location: 'Tây Hồ, Hà Nội',
          date: '3 ngày trước',
          content: `Anh Duy Đinh làm việc thì quá yên tâm rồi các bác. Đợt em mua xe nhận biển tận nhà ở Hà Nội mà được bên anh Duy ép khung mica titan sẵn, chỉ việc gắn vào xe chạy thôi.`,
          reactions: { like: 11, love: 8, haha: 2, wow: 5, sad: 0, angry: 0 },
        },
      ],
    });
  }

  return discussions;
}

/**
 * Sinh phản hồi bàn giao xe thực tế cho khối SoldPlateFeedback
 * Đảm bảo mỗi biển đã bán hiển thị đúng xe, đúng người và không bị trùng nhau.
 */
export function generateSoldPlateFeedbacks(plate) {
  if (!plate) return [];
  const chars = analyzePlateCharacteristics(plate);
  const seed = stringHash(chars.plateNumber || plate.id || 'sold-plate');

  const names = [
    'Anh Tuấn', 'Anh Long', 'Anh Nghĩa', 'Anh Hùng',
    'Chị Phương', 'Bác Trọng', 'Anh Khôi', 'Anh Đăng',
    'Anh Bảo', 'Anh Nam', 'Chị Ngọc', 'Bác Tùng',
  ];

  const results = [];
  for (let i = 0; i < 4; i++) {
    const s = seed + i * 7;
    const name = names[s % names.length];
    const loc = LOCATIONS[s % LOCATIONS.length];
    const car = chars.isCar ? LUXURY_CARS[s % LUXURY_CARS.length] : LUXURY_BIKES[s % LUXURY_BIKES.length];
    const daysAgo = (i + 1) * 3 + (s % 4);

    let comment = '';
    let reply = '';
    let tags = [];

    if (i === 0) {
      comment = `Lấy biển ${chars.plateNumber} lắp cho chiếc ${car} tại showroom Đà Nẵng. Anh Duy Đinh tư vấn rất có tâm, làm việc thẳng thắn, hợp đồng công chứng chuyển nhượng rõ ràng. Đúng 48 giờ là hoàn tất thủ tục thu hồi và cấp đăng ký xe định danh tại CSGT. Rất an tâm!`;
      reply = `Biensovip và Duy Đinh xin chân thành cảm ơn ${name}! Chúc anh vạn dặm bình an, lái xe may mắn và công việc luôn đại cát đại lợi. Hồ sơ định danh được bên em bảo hành pháp lý trọn đời ạ.`;
      tags = ['Định danh chính chủ', 'Giao dịch tại showroom', 'Bảo hành pháp lý'];
    } else if (i === 1) {
      comment = `Giao dịch biển số giá trị lớn qua mạng ban đầu cũng hơi đắn đo. Nhưng khi qua trực tiếp showroom 106 Hoàng Diệu gặp anh Duy thì thấy sự minh bạch tuyệt đối: kiểm tra nguồn gốc biển đấu giá, hợp đồng ủy quyền và biên nhận cọc đầy đủ. Đúng 3 ngày nhận cavet xe định danh tên mình. 10 điểm uy tín!`;
      reply = `Duy Đinh cảm ơn ${name} đã đặt trọn niềm tin vào Biensovip. Sự an tâm và hài lòng của khách hàng luôn là tôn chỉ hoạt động suốt 10 năm qua của Duy!`;
      tags = ['Nguồn gốc Cục CSGT', 'Hợp đồng công chứng', 'Sang tên 3 ngày'];
    } else if (i === 2) {
      comment = `Mình ở tận ${loc} mua biển qua anh Duy Đinh ở Đà Nẵng, ban đầu lo ngại khoảng cách địa lý. Nhưng anh Duy cử nhân sự bay vào tận nơi hỗ trợ làm hợp đồng công chứng và sang tên định danh tại CSGT địa phương. Rất chu đáo, chuyên nghiệp và đúng hẹn.`;
      reply = `Cảm ơn ${name}! Biensovip cam kết hỗ trợ giao dịch và sang tên tận nơi trên toàn quốc, đảm bảo an toàn pháp lý tuyệt đối cho mọi khách hàng ở xa.`;
      tags = ['Hỗ trợ tận nơi', 'Định danh toàn quốc', 'Đúng cam kết'];
    } else {
      comment = `Lắp biển ${chars.plateNumber} lên chiếc ${car} nhìn sang hẳn xe. Từ ngày bấm biển xong công việc buôn bán thuận lợi hơn hẳn. Chi phí trọn gói đúng như báo giá ban đầu, không phát sinh một đồng nào. Cảm ơn anh Duy Đinh tư vấn phong thủy rất nhiệt tình!`;
      reply = `Duy Đinh xin chúc mừng ${name} buôn may bán đắt, tài lộc tấn tới. Rất vui vì được đồng hành cùng anh!`;
      tags = ['Bao trọn gói', 'Không phát sinh chi phí', 'Tư vấn phong thủy'];
    }

    results.push({
      id: `sold-fb-${s}`,
      customerName: name,
      location: loc,
      vehicle: car,
      plateNumber: chars.plateNumber,
      rating: 5,
      date: `${daysAgo} ngày trước`,
      comment,
      adminReply: reply,
      tags,
    });
  }

  return results;
}

/**
 * Sinh đánh giá khách hàng thực tế (Reviews) cho tab Đánh giá của biển số
 * Giúp trang biển số luôn sôi nổi, có đánh giá thực tế và Duy Đinh phản hồi lịch sự.
 */
export function generatePlateReviews(plate) {
  if (!plate) return [];
  const chars = analyzePlateCharacteristics(plate);
  const seed = stringHash(chars.plateNumber || plate.id || 'plate-reviews');

  const names = [
    'Nguyễn Văn Tuấn', 'Trần Hoàng Long', 'Lê Quốc Nghĩa', 'Phạm Minh Hùng',
    'Vũ Thị Bích Phương', 'Đỗ Đình Trọng', 'Hoàng Đăng Khôi', 'Bùi Hải Đăng',
    'Trịnh Quốc Bảo', 'Phan Hoàng Nam', 'Đặng Thùy Ngọc', 'Lương Thanh Tùng',
  ];

  const results = [];
  const count = 3 + (seed % 2); // 3 hoặc 4 reviews
  for (let i = 0; i < count; i++) {
    const s = seed + i * 11;
    const name = names[s % names.length];
    const car = chars.isCar ? LUXURY_CARS[s % LUXURY_CARS.length] : LUXURY_BIKES[s % LUXURY_BIKES.length];
    const daysAgo = (i + 1) * 4 + (s % 5);

    let comment = '';
    let reply = '';

    if (i === 0) {
      comment = `Dịch vụ tư vấn và giao dịch biển số ${chars.plateNumber} của anh Duy Đinh cực kỳ chuyên nghiệp. Mình ở xa nhưng được hỗ trợ công chứng và nộp hồ sơ thu hồi sang tên tận tay, đúng hẹn 48 tiếng là có giấy hẹn. Rất an tâm!`;
      reply = `Duy Đinh xin chân thành cảm ơn anh đã đặt trọn niềm tin vào Biensovip! Kính chúc anh vạn dặm bình an, thượng lộ may mắn cùng chiếc xe của mình ạ.`;
    } else if (i === 1) {
      comment = `Biển ${chars.plateNumber} thế số quá đẹp, gắn lên chiếc ${car} nhìn rất uy lực và sang trọng. Anh Duy tư vấn phong thủy theo bản mệnh rất chuẩn chỉ và có tâm, không vẽ vời phát sinh chi phí. Sẽ tiếp tục ủng hộ bên anh!`;
      reply = `Biensovip và Duy xin cảm ơn anh rất nhiều! Chúc anh công việc kinh doanh luôn đại cát đại lợi, buôn may bán đắt và phát tài phát lộc!`;
    } else if (i === 2) {
      comment = `Trước khi chốt biển này có nhờ anh Duy check phạt nguội và kiểm tra văn bản trúng đấu giá gốc của Cục CSGT. Mọi thứ minh bạch 100%, có biên bản bàn giao và hợp đồng rõ ràng. Đánh giá 5 sao cho uy tín của showroom 106 Hoàng Diệu!`;
      reply = `Duy Đinh rất trân trọng tình cảm và đánh giá 5 sao của anh! Sự minh bạch pháp lý và an tâm của khách hàng luôn là tôn chỉ số 1 của Biensovip suốt 10 năm qua.`;
    } else {
      comment = `Giao dịch nhanh gọn, được tặng kèm bộ ép mica viền titan chống nước lắp lên xe rất vừa vặn và đẹp mắt. Đội ngũ hỗ trợ nhiệt tình từ khâu chọn biển đến lúc ra cavet chính chủ.`;
      reply = `Duy Đinh xin chúc mừng anh đã sở hữu biển số ưng ý! Cần hỗ trợ thêm bất kỳ thủ tục gì về xe cộ anh cứ nhắn Duy qua Zalo 0815 792 699 nhé!`;
    }

    results.push({
      id: `plate-rev-${s}`,
      reviewerName: name,
      rating: 5,
      createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      comment,
      adminReply: reply,
    });
  }

  return results;
}

