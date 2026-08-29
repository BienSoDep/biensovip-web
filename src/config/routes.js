export const SCREENS = ['home', 'list', 'detail', 'register', 'login', 'forgot', 'fav', 'profile', 'about', 'blog', 'post', 'lucky', 'chat', 'compare', 'saved', 'reviews', 'notifications', 'collab', 'terms', 'privacy', 'transfer', 'faq', 'gmailCallback', 'provinceLanding', 'plateTypeLanding', 'dash', 'aplates', 'acats', 'acontacts', 'aposts', 'astaff', 'acustomers', 'avideos', 'anotifications', 'aemailtpl', 'acollabs', 'areviews', 'ameanings', 'achatbot', 'compose', 'aauditlog'];

// Market control — landing page tỉnh/thành. Slug sinh từ tên tỉnh bỏ dấu (khớp BlogService.GenerateSlug
// phía backend), map ngược 2 chiều để routeFor()/parseRoute() không cần gọi API mới biết slug<->code.
export const PROVINCE_LANDINGS = [
  { code: '43', slug: 'bien-so-da-nang', name: 'Đà Nẵng' },
  { code: '51', slug: 'bien-so-tp-ho-chi-minh', name: 'TP. Hồ Chí Minh' },
  { code: '30', slug: 'bien-so-ha-noi', name: 'Hà Nội' },
  { code: '15', slug: 'bien-so-hai-phong', name: 'Hải Phòng' },
  { code: '65', slug: 'bien-so-can-tho', name: 'Cần Thơ' },
  { code: '79', slug: 'bien-so-khanh-hoa', name: 'Khánh Hòa' },
  { code: '61', slug: 'bien-so-binh-duong', name: 'Bình Dương' },
  { code: '60', slug: 'bien-so-dong-nai', name: 'Đồng Nai' },
  { code: '37', slug: 'bien-so-nghe-an', name: 'Nghệ An' },
  { code: '75', slug: 'bien-so-thua-thien-hue', name: 'Thừa Thiên Huế' },
  { code: '23', slug: 'bien-so-ha-giang', name: 'Hà Giang' },
  { code: '11', slug: 'bien-so-cao-bang', name: 'Cao Bằng' },
  { code: '25', slug: 'bien-so-lai-chau', name: 'Lai Châu' },
  { code: '24', slug: 'bien-so-lao-cai', name: 'Lào Cai' },
  { code: '22', slug: 'bien-so-tuyen-quang', name: 'Tuyên Quang' },
  { code: '12', slug: 'bien-so-lang-son', name: 'Lạng Sơn' },
  { code: '97', slug: 'bien-so-bac-kan', name: 'Bắc Kạn' },
  { code: '20', slug: 'bien-so-thai-nguyen', name: 'Thái Nguyên' },
  { code: '21', slug: 'bien-so-yen-bai', name: 'Yên Bái' },
  { code: '26', slug: 'bien-so-son-la', name: 'Sơn La' },
  { code: '19', slug: 'bien-so-phu-tho', name: 'Phú Thọ' },
  { code: '88', slug: 'bien-so-vinh-phuc', name: 'Vĩnh Phúc' },
  { code: '14', slug: 'bien-so-quang-ninh', name: 'Quảng Ninh' },
  { code: '98', slug: 'bien-so-bac-giang', name: 'Bắc Giang' },
  { code: '99', slug: 'bien-so-bac-ninh', name: 'Bắc Ninh' },
  { code: '34', slug: 'bien-so-hai-duong', name: 'Hải Dương' },
  { code: '89', slug: 'bien-so-hung-yen', name: 'Hưng Yên' },
  { code: '28', slug: 'bien-so-hoa-binh', name: 'Hòa Bình' },
  { code: '90', slug: 'bien-so-ha-nam', name: 'Hà Nam' },
  { code: '18', slug: 'bien-so-nam-dinh', name: 'Nam Định' },
  { code: '17', slug: 'bien-so-thai-binh', name: 'Thái Bình' },
  { code: '35', slug: 'bien-so-ninh-binh', name: 'Ninh Bình' },
  { code: '36', slug: 'bien-so-thanh-hoa', name: 'Thanh Hóa' },
  { code: '38', slug: 'bien-so-ha-tinh', name: 'Hà Tĩnh' },
  { code: '73', slug: 'bien-so-quang-binh', name: 'Quảng Bình' },
  { code: '74', slug: 'bien-so-quang-tri', name: 'Quảng Trị' },
  { code: '92', slug: 'bien-so-quang-nam', name: 'Quảng Nam' },
  { code: '76', slug: 'bien-so-quang-ngai', name: 'Quảng Ngãi' },
  { code: '82', slug: 'bien-so-kon-tum', name: 'Kon Tum' },
  { code: '81', slug: 'bien-so-gia-lai', name: 'Gia Lai' },
  { code: '77', slug: 'bien-so-binh-dinh', name: 'Bình Định' },
  { code: '78', slug: 'bien-so-phu-yen', name: 'Phú Yên' },
  { code: '85', slug: 'bien-so-ninh-thuan', name: 'Ninh Thuận' },
  { code: '86', slug: 'bien-so-binh-thuan', name: 'Bình Thuận' },
  { code: '47', slug: 'bien-so-dak-lak', name: 'Đắk Lắk' },
  { code: '48', slug: 'bien-so-dak-nong', name: 'Đắk Nông' },
  { code: '49', slug: 'bien-so-lam-dong', name: 'Lâm Đồng' },
  { code: '93', slug: 'bien-so-binh-phuoc', name: 'Bình Phước' },
  { code: '70', slug: 'bien-so-tay-ninh', name: 'Tây Ninh' },
  { code: '72', slug: 'bien-so-ba-ria-vung-tau', name: 'Bà Rịa - Vũng Tàu' },
  { code: '62', slug: 'bien-so-long-an', name: 'Long An' },
  { code: '63', slug: 'bien-so-tien-giang', name: 'Tiền Giang' },
  { code: '71', slug: 'bien-so-ben-tre', name: 'Bến Tre' },
  { code: '84', slug: 'bien-so-tra-vinh', name: 'Trà Vinh' },
  { code: '64', slug: 'bien-so-vinh-long', name: 'Vĩnh Long' },
  { code: '66', slug: 'bien-so-dong-thap', name: 'Đồng Tháp' },
  { code: '67', slug: 'bien-so-an-giang', name: 'An Giang' },
  { code: '68', slug: 'bien-so-kien-giang', name: 'Kiên Giang' },
  { code: '95', slug: 'bien-so-hau-giang', name: 'Hậu Giang' },
  { code: '83', slug: 'bien-so-soc-trang', name: 'Sóc Trăng' },
  { code: '94', slug: 'bien-so-bac-lieu', name: 'Bạc Liêu' },
  { code: '69', slug: 'bien-so-ca-mau', name: 'Cà Mau' },
  { code: '27', slug: 'bien-so-dien-bien', name: 'Điện Biên' },
];
const PROVINCE_SLUG_BY_CODE = Object.fromEntries(PROVINCE_LANDINGS.map((p) => [p.code, p.slug]));
const PROVINCE_CODE_BY_SLUG = Object.fromEntries(PROVINCE_LANDINGS.map((p) => [p.slug, p.code]));

// Plate-type landing — slug khớp BlogService.GenerateSlug(ten loai bien) phía backend.
export const PLATE_TYPE_LANDINGS = [
  { name: 'Ngũ quý', slug: 'bien-ngu-quy' },
  { name: 'Tứ quý', slug: 'bien-tu-quy' },
  { name: 'Tam hoa', slug: 'bien-tam-hoa' },
  { name: 'Lộc phát', slug: 'bien-loc-phat' },
  { name: 'Thần tài', slug: 'bien-than-tai' },
  { name: 'Sảnh tiến', slug: 'bien-sanh-tien' },
  { name: 'Số kép', slug: 'bien-so-kep' },
  { name: 'Số đẹp khác', slug: 'bien-so-dep-khac' },
];
const PLATE_TYPE_SLUGS = new Set(PLATE_TYPE_LANDINGS.map((p) => p.slug));

export const ROUTE_MAP = {
  'list': 'danh-sach', 'register': 'dang-ky', 'login': 'dang-nhap', 'forgot': 'quen-mat-khau',
  'fav': 'yeu-thich', 'profile': 'tai-khoan', 'about': 'gioi-thieu', 'blog': 'tin', 'lucky': 'hop-menh',
  'dash': 'admin/tong-quan', 'aplates': 'admin/bien-so', 'acats': 'admin/danh-muc',
  'acontacts': 'admin/lien-he', 'aposts': 'admin/bai-viet', 'astaff': 'admin/nhan-vien', 'acustomers': 'admin/khach-hang', 'avideos': 'admin/video', 'anotifications': 'admin/thong-bao', 'aemailtpl': 'admin/mau-email', 'acollabs': 'admin/cong-tac-vien', 'areviews': 'admin/danh-gia', 'ameanings': 'admin/y-nghia', 'achatbot': 'admin/tro-ly-ai', 'compose': 'admin/them-bai', 'aauditlog': 'admin/nhat-ky-he-thong',
  'chat': 'lien-he', 'compare': 'so-sanh', 'saved': 'thong-bao', 'reviews': 'danh-gia', 'notifications': 'thong-bao-moi', 'collab': 'cong-tac-vien', 'terms': 'dieu-khoan', 'privacy': 'bao-mat', 'transfer': 'sang-ten', 'faq': 'hoi-dap', 'gmailCallback': 'gmail-callback',
  'verify-email': 'xac-thuc-email',
};

const REVERSE_MAP = Object.fromEntries(Object.entries(ROUTE_MAP).map(([k, v]) => [v, k]));

export function routeFor(s, id) {
  if (s === 'detail') return '/bien/' + (id || '');
  if (s === 'post') return '/bai-viet/' + (id || '');
  if (s === 'provinceLanding') return '/' + (PROVINCE_SLUG_BY_CODE[id] || id || 'bien-so-da-nang');
  if (s === 'plateTypeLanding') return '/bien-' + (id || 'tu-quy');
  if (s === 'notfound') return window.location.pathname;
  return '/' + (ROUTE_MAP[s] || '');
}

export function parseRoute(pathname) {
  const p = String(pathname || '').split('?')[0].split('/').filter(Boolean);
  if (!p.length) return { screen: 'home' };
  if (p[0] === 'bien') return { screen: 'detail', detailId: p[1] || 'p1' };
  if (p[0] === 'bai-viet') return { screen: 'post', postId: p[1] || 'a1' };
  if (p[0] === 'tu-van') return { screen: 'lucky' }; // alias cũ → hop-menh (redirect)
  if (PROVINCE_CODE_BY_SLUG[p[0]]) return { screen: 'provinceLanding', landingSlug: p[0], provinceCode: PROVINCE_CODE_BY_SLUG[p[0]] };
  if (PLATE_TYPE_SLUGS.has(p[0])) return { screen: 'plateTypeLanding', typeSlug: p[0].slice(5) };
  return { screen: REVERSE_MAP[p.join('/')] || 'notfound' };
}

export const ADMIN_SCREENS = ['dash', 'aplates', 'acats', 'acontacts', 'aposts', 'astaff', 'acustomers', 'avideos', 'anotifications', 'aemailtpl', 'acollabs', 'areviews', 'ameanings', 'achatbot', 'compose', 'aauditlog'];
export const PUBLIC_SCREENS = ['home', 'list', 'detail', 'fav', 'profile', 'about', 'blog', 'post', 'lucky', 'chat', 'compare', 'saved', 'reviews', 'notifications', 'collab', 'terms', 'privacy', 'transfer', 'faq', 'gmailCallback', 'provinceLanding', 'plateTypeLanding', 'notfound'];
