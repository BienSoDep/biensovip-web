export const SCREENS = ['home', 'list', 'detail', 'register', 'login', 'forgot', 'fav', 'profile', 'about', 'blog', 'post', 'lucky', 'chat', 'compare', 'saved', 'reviews', 'notifications', 'collab', 'terms', 'privacy', 'transfer', 'faq', 'gmailCallback', 'dash', 'aplates', 'acats', 'acontacts', 'aposts', 'astaff', 'acustomers', 'avideos', 'anotifications', 'aemailtpl', 'acollabs', 'areviews', 'ameanings', 'compose', 'aauditlog'];

export const ROUTE_MAP = {
  'list': 'danh-sach', 'register': 'dang-ky', 'login': 'dang-nhap', 'forgot': 'quen-mat-khau',
  'fav': 'yeu-thich', 'profile': 'tai-khoan', 'about': 'gioi-thieu', 'blog': 'tin', 'lucky': 'hop-menh',
  'dash': 'admin/tong-quan', 'aplates': 'admin/bien-so', 'acats': 'admin/danh-muc',
  'acontacts': 'admin/lien-he', 'aposts': 'admin/bai-viet', 'astaff': 'admin/nhan-vien', 'acustomers': 'admin/khach-hang', 'avideos': 'admin/video', 'anotifications': 'admin/thong-bao', 'aemailtpl': 'admin/mau-email', 'acollabs': 'admin/cong-tac-vien', 'areviews': 'admin/danh-gia', 'ameanings': 'admin/y-nghia', 'compose': 'admin/them-bai', 'aauditlog': 'admin/nhat-ky-he-thong',
  'chat': 'lien-he', 'compare': 'so-sanh', 'saved': 'thong-bao', 'reviews': 'danh-gia', 'notifications': 'thong-bao-moi', 'collab': 'cong-tac-vien', 'terms': 'dieu-khoan', 'privacy': 'bao-mat', 'transfer': 'sang-ten', 'faq': 'hoi-dap', 'gmailCallback': 'gmail-callback',
  'verify-email': 'xac-thuc-email',
};

const REVERSE_MAP = Object.fromEntries(Object.entries(ROUTE_MAP).map(([k, v]) => [v, k]));

export function routeFor(s, id) {
  if (s === 'detail') return '#/bien/' + (id || '');
  if (s === 'post') return '#/bai-viet/' + (id || '');
  if (s === 'notfound') return window.location.hash;
  return '#/' + (ROUTE_MAP[s] || '');
}

export function parseRoute(h) {
  const p = h.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  if (!p.length) return { screen: 'home' };
  if (p[0] === 'bien') return { screen: 'detail', detailId: p[1] || 'p1' };
  if (p[0] === 'bai-viet') return { screen: 'post', postId: p[1] || 'a1' };
  if (p[0] === 'tu-van') return { screen: 'lucky' }; // alias cũ → hop-menh (redirect)
  return { screen: REVERSE_MAP[p.join('/')] || 'notfound' };
}

export const ADMIN_SCREENS = ['dash', 'aplates', 'acats', 'acontacts', 'aposts', 'astaff', 'acustomers', 'avideos', 'anotifications', 'aemailtpl', 'acollabs', 'areviews', 'ameanings', 'compose', 'aauditlog'];
export const PUBLIC_SCREENS = ['home', 'list', 'detail', 'fav', 'profile', 'about', 'blog', 'post', 'lucky', 'chat', 'compare', 'saved', 'reviews', 'notifications', 'collab', 'terms', 'privacy', 'transfer', 'faq', 'gmailCallback', 'notfound'];
