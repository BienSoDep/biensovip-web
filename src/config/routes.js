export const SCREENS = ['home', 'list', 'detail', 'register', 'login', 'forgot', 'adminForgot', 'adminReset', 'fav', 'profile', 'about', 'blog', 'post', 'lucky', 'luanBien', 'chat', 'aiChat', 'compare', 'saved', 'reviews', 'notifications', 'collab', 'collabProcess', 'collabLeaderboard', 'collabCustomers', 'terms', 'privacy', 'transfer', 'faq', 'gmailCallback', 'provinceLanding', 'plateTypeLanding', 'dash', 'aplates', 'avpa', 'avpastats', 'aexporthistory', 'acoupons', 'acats', 'asales', 'acontacts', 'akanban', 'atransactions', 'aposts', 'ablogcomments', 'astaff', 'acustomers', 'avideos', 'anotifications', 'aemailtpl', 'acollabs', 'acollabcontent', 'ainterestleads', 'areviews', 'ameanings', 'achatbot', 'compose', 'aauditlog', 'arisklog', 'aguide', 'amaintenance', 'ashowroom', 'asortsettings', 'aerrorlogs', 'afeatureflags', 'adbconsole', 'apolicypages', 'actvtemplates', 'ainsights', 'avpamarket', 'afengshuihistory', 'alivestream', 'asystemfeedback', 'overlayLive'];

import {
  PROVINCE_LANDINGS,
  PROVINCE_SLUG_BY_CODE,
  PROVINCE_CODE_BY_SLUG,
  PLATE_TYPE_LANDINGS,
  PLATE_TYPE_SLUGS,
} from '../data/provinces.js';

export {
  PROVINCE_LANDINGS,
  PROVINCE_SLUG_BY_CODE,
  PROVINCE_CODE_BY_SLUG,
  PLATE_TYPE_LANDINGS,
  PLATE_TYPE_SLUGS,
};

export const ROUTE_MAP = {
  'list': 'danh-sach', 'register': 'dang-ky', 'login': 'dang-nhap', 'forgot': 'quen-mat-khau',
  'adminForgot': 'quen-mat-khau-quan-tri', 'adminReset': 'dat-lai-mat-khau-quan-tri',
  'fav': 'yeu-thich', 'profile': 'tai-khoan', 'about': 'gioi-thieu', 'blog': 'tin', 'lucky': 'hop-menh', 'luanBien': 'luan-bien-so',
  'dash': 'admin/tong-quan', 'aplates': 'admin/bien-so', 'avpa': 'admin/bien-vpa', 'avpastats': 'admin/thong-ke-bien-vpa', 'aexporthistory': 'admin/lich-su-tai-xuong', 'acoupons': 'admin/ma-giam-gia', 'acats': 'admin/danh-muc',
  'asales': 'admin/ban-hang', 'acontacts': 'admin/lien-he', 'akanban': 'admin/quy-trinh', 'atransactions': 'admin/giao-dich', 'aposts': 'admin/bai-viet', 'ablogcomments': 'admin/binh-luan-blog', 'astaff': 'admin/nhan-vien', 'acustomers': 'admin/khach-hang', 'avideos': 'admin/video', 'anotifications': 'admin/thong-bao', 'aemailtpl': 'admin/mau-email', 'acollabs': 'admin/cong-tac-vien', 'acollabcontent': 'admin/noi-dung-ctv', 'ainterestleads': 'admin/khach-quan-tam', 'areviews': 'admin/danh-gia', 'ameanings': 'admin/y-nghia', 'achatbot': 'admin/tro-ly-ai', 'compose': 'admin/them-bai', 'aauditlog': 'admin/nhat-ky-he-thong', 'arisklog': 'admin/rui-ro-ctv', 'aguide': 'admin/huong-dan', 'amaintenance': 'admin/bao-tri', 'ashowroom': 'admin/so-lieu-hien-thi', 'asortsettings': 'admin/thu-tu-hien-thi', 'aerrorlogs': 'admin/nhat-ky-loi', 'afeatureflags': 'admin/feature-flags', 'adbconsole': 'admin/db-console', 'apolicypages': 'admin/trang-chinh-sach', 'actvtemplates': 'admin/mau-tin-nhan-ctv', 'ainsights': 'admin/insight-khach-hang', 'avpamarket': 'admin/phan-tich-thi-truong-vpa', 'afengshuihistory': 'admin/lich-su-luan-giai', 'alivestream': 'admin/tro-ly-live', 'asystemfeedback': 'admin/bao-cao-he-thong', 'overlayLive': 'overlay/live-display',
  'chat': 'lien-he', 'aiChat': 'tro-ly-ai', 'compare': 'so-sanh', 'saved': 'thong-bao', 'reviews': 'danh-gia', 'notifications': 'thong-bao-moi', 'collab': 'cong-tac-vien', 'collabProcess': 'cong-tac-vien/quy-trinh', 'collabLeaderboard': 'cong-tac-vien/bang-xep-hang', 'collabCustomers': 'cong-tac-vien/khach-hang', 'terms': 'dieu-khoan', 'privacy': 'bao-mat', 'transfer': 'sang-ten', 'faq': 'hoi-dap', 'gmailCallback': 'gmail-callback',
};

const REVERSE_MAP = {
  ...Object.fromEntries(Object.entries(ROUTE_MAP).map(([k, v]) => [v, k])),
  'admin/livestream': 'alivestream',
  'admin/lich-su-xuat-file': 'aexporthistory',
  'admin/soan-bai': 'compose',
};

const LEGACY_POST_ALIASES = {
  'thu-tuc-sang-ten-bien-so-dinh-danh-2026': 'thu-tuc-sang-ten-bien-so-2026',
  'bang-gia-bien-so-xe-may-da-nang-2026': 'bien-so-xe-may-da-nang',
};

export function routeFor(s, id) {
  if (s === 'detail') return '/bien/' + (id || '');
  if (s === 'post') return '/bai-viet/' + (id || '');
  if (s === 'search') return '/tim-kiem/' + (id || '');
  if (s === 'provinceLanding') return '/' + (PROVINCE_SLUG_BY_CODE[id] || id || 'bien-so-da-nang');
  if (s === 'plateTypeLanding') {
    const clean = String(id || 'tu-quy').replace(/^bien-/, '');
    return '/bien-' + clean;
  }
  if (s === 'luanBien') return '/luan-bien-so';
  if (s === 'notfound') return typeof window !== 'undefined' ? window.location.pathname : '/404';
  return '/' + (ROUTE_MAP[s] || '');
}

export function parseRoute(pathname) {
  const p = String(pathname || '').split('?')[0].split('/').filter(Boolean);
  if (!p.length) return { screen: 'home' };
  if (p[0] === 'admin' && p.length === 1) return { screen: 'dash' };
  if (p[0] === 'bien') return p[1] ? { screen: 'detail', detailId: decodeURIComponent(p[1]) } : { screen: 'list' };
  if (p[0] === 'bai-viet') {
    const rawSlug = p[1] || 'bien-so-xe-dep-la-gi-7-loai';
    return { screen: 'post', postId: LEGACY_POST_ALIASES[rawSlug] || rawSlug };
  }
  if (p[0] === 'tinh-thanh' && p[1]) {
    const provSlug = `bien-so-${p[1].replace(/^bien-so-/, '')}`;
    if (PROVINCE_CODE_BY_SLUG[provSlug]) {
      return { screen: 'provinceLanding', landingSlug: provSlug, provinceCode: PROVINCE_CODE_BY_SLUG[provSlug] };
    }
  }
  if (p[0] === 'tu-van') return { screen: 'lucky' }; // alias cũ → hop-menh (redirect)
  if (p[0] === 'luan-bien-so') return { screen: 'luanBien' };
  if (p[0] === 'tim-kiem') return { screen: 'list', searchTerm: p[1] || '' };
  if (p[0] === 'bien-dau-gia') return { screen: 'list' }; // đã gộp vào trang Biển số (tab VPA)
  if (PROVINCE_CODE_BY_SLUG[p[0]]) return { screen: 'provinceLanding', landingSlug: p[0], provinceCode: PROVINCE_CODE_BY_SLUG[p[0]] };
  if (PLATE_TYPE_SLUGS.has(p[0])) return { screen: 'plateTypeLanding', typeSlug: p[0].slice(5) };
  return { screen: REVERSE_MAP[p.join('/')] || 'notfound' };
}

export const ADMIN_SCREENS = ['dash', 'aplates', 'avpa', 'avpastats', 'aexporthistory', 'acoupons', 'acats', 'asales', 'acontacts', 'akanban', 'atransactions', 'aposts', 'ablogcomments', 'astaff', 'acustomers', 'avideos', 'anotifications', 'aemailtpl', 'acollabs', 'acollabcontent', 'ainterestleads', 'areviews', 'ameanings', 'achatbot', 'compose', 'aauditlog', 'arisklog', 'aguide', 'amaintenance', 'ashowroom', 'asortsettings', 'aerrorlogs', 'afeatureflags', 'adbconsole', 'apolicypages', 'actvtemplates', 'ainsights', 'avpamarket', 'afengshuihistory', 'alivestream', 'asystemfeedback'];
export const PUBLIC_SCREENS = ['home', 'list', 'detail', 'fav', 'profile', 'about', 'blog', 'post', 'lucky', 'luanBien', 'chat', 'aiChat', 'compare', 'saved', 'reviews', 'notifications', 'collab', 'collabProcess', 'collabLeaderboard', 'collabCustomers', 'terms', 'privacy', 'transfer', 'faq', 'gmailCallback', 'provinceLanding', 'plateTypeLanding', 'notfound', 'adminForgot', 'adminReset'];
