export const SCREENS = ['home', 'list', 'detail', 'register', 'login', 'forgot', 'fav', 'profile', 'about', 'blog', 'post', 'lucky', 'chat', 'compare', 'saved', 'reviews', 'notifications', 'collab', 'terms', 'privacy', 'transfer', 'faq', 'gmailCallback', 'provinceLanding', 'dash', 'aplates', 'acats', 'acontacts', 'aposts', 'astaff', 'acustomers', 'avideos', 'anotifications', 'aemailtpl', 'acollabs', 'areviews', 'ameanings', 'achatbot', 'compose', 'aauditlog'];

// Market control — landing page tỉnh/thành. Slug sinh từ tên tỉnh bỏ dấu (khớp BlogService.GenerateSlug
// phía backend), map ngược 2 chiều để routeFor()/parseRoute() không cần gọi API mới biết slug<->code.
export const PROVINCE_LANDINGS = [
  { code: '43', slug: 'bien-so-da-nang' },
  { code: '51', slug: 'bien-so-tp-ho-chi-minh' },
  { code: '30', slug: 'bien-so-ha-noi' },
  { code: '15', slug: 'bien-so-hai-phong' },
  { code: '65', slug: 'bien-so-can-tho' },
  { code: '79', slug: 'bien-so-khanh-hoa' },
  { code: '61', slug: 'bien-so-binh-duong' },
  { code: '60', slug: 'bien-so-dong-nai' },
  { code: '37', slug: 'bien-so-nghe-an' },
  { code: '75', slug: 'bien-so-thua-thien-hue' },
];
const PROVINCE_SLUG_BY_CODE = Object.fromEntries(PROVINCE_LANDINGS.map((p) => [p.code, p.slug]));
const PROVINCE_CODE_BY_SLUG = Object.fromEntries(PROVINCE_LANDINGS.map((p) => [p.slug, p.code]));

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
  return { screen: REVERSE_MAP[p.join('/')] || 'notfound' };
}

export const ADMIN_SCREENS = ['dash', 'aplates', 'acats', 'acontacts', 'aposts', 'astaff', 'acustomers', 'avideos', 'anotifications', 'aemailtpl', 'acollabs', 'areviews', 'ameanings', 'achatbot', 'compose', 'aauditlog'];
export const PUBLIC_SCREENS = ['home', 'list', 'detail', 'fav', 'profile', 'about', 'blog', 'post', 'lucky', 'chat', 'compare', 'saved', 'reviews', 'notifications', 'collab', 'terms', 'privacy', 'transfer', 'faq', 'gmailCallback', 'provinceLanding', 'notfound'];
