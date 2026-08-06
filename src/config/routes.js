export const SCREENS = ['home', 'list', 'detail', 'register', 'login', 'forgot', 'fav', 'about', 'blog', 'post', 'lucky', 'adminLogin', 'dash', 'aplates', 'acats', 'acontacts', 'aposts', 'compose'];

export const ROUTE_MAP = {
  'list': 'danh-sach', 'register': 'dang-ky', 'login': 'dang-nhap', 'forgot': 'quen-mat-khau',
  'fav': 'yeu-thich', 'about': 'gioi-thieu', 'blog': 'tin', 'lucky': 'tu-van', 'adminLogin': 'admin',
  'dash': 'admin/tong-quan', 'aplates': 'admin/bien-so', 'acats': 'admin/danh-muc',
  'acontacts': 'admin/lien-he', 'aposts': 'admin/bai-viet', 'compose': 'admin/them-bai',
};

const REVERSE_MAP = Object.fromEntries(Object.entries(ROUTE_MAP).map(([k, v]) => [v, k]));

export function routeFor(s, id) {
  if (s === 'detail') return '#/bien/' + (id || '');
  if (s === 'post') return '#/bai-viet/' + (id || '');
  return '#/' + (ROUTE_MAP[s] || '');
}

export function parseRoute(h) {
  const p = h.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!p.length) return { screen: 'home' };
  if (p[0] === 'bien') return { screen: 'detail', detailId: p[1] || 'p1' };
  if (p[0] === 'bai-viet') return { screen: 'post', postId: p[1] || 'a1' };
  return { screen: REVERSE_MAP[p.join('/')] || 'home' };
}

export const ADMIN_SCREENS = ['dash', 'aplates', 'acats', 'acontacts', 'aposts', 'compose'];
export const PUBLIC_SCREENS = ['home', 'list', 'detail', 'fav', 'about', 'blog', 'post', 'lucky'];
