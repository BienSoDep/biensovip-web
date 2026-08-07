import { content } from './content/index.js';

// Display fields for each plate/post now live in content (partner-editable).
// Filter/identity keys (cat, vehicle, city, status) stay inline so filters aren't unstable.
const decoratePlates = (raw) => {
  return raw.map((p) => {
    const c = content.plates[p.id] || {};
    return c.fengshui ? { ...p, fengshui: c.fengshui } : p;
  });
};

const decoratePosts = (raw) => {
  return raw.map((post) => {
    const c = content.posts[post.id] || {};
    const out = { ...post };
    if (c.title) out.title = c.title;
    if (c.desc) out.desc = c.desc;
    if (c.imgAlt) out.imgAlt = c.imgAlt;
    if (c.excerpt) out.excerpt = c.excerpt;
    if (c.body) out.body = c.body;
    return out;
  });
};

const RAW_PLATES = [
  { id: 'p1', prov: '43', seri: 'A1', num: '999.99', cat: 'Ngũ quý', price: '2.150.000.000đ', vehicle: 'Ô tô', city: 'Đà Nẵng', hot: true, isNew: true, status: 'Còn hàng', updated: 'Hôm nay' },
  { id: 'p2', prov: '43', seri: 'A2', num: '888.88', cat: 'Ngũ quý', price: '1.980.000.000đ', vehicle: 'Ô tô', city: 'Đà Nẵng', status: 'Còn hàng', updated: 'Hôm nay' },
  { id: 'p3', prov: '43', seri: 'B1', num: '666.66', cat: 'Ngũ quý', price: 'Giá liên hệ', vehicle: 'Ô tô', city: 'Đà Nẵng', status: 'Còn hàng', updated: 'Hôm nay' },
  { id: 'p4', prov: '43', seri: 'A1', num: '888.86', cat: 'Tứ quý', price: '620.000.000đ', vehicle: 'Ô tô', city: 'Đà Nẵng', hot: true, status: 'Còn hàng', updated: 'Hôm qua' },
  { id: 'p5', prov: '92', seri: 'A1', num: '779.79', cat: 'Thần tài', price: '410.000.000đ', vehicle: 'Ô tô', city: 'Quảng Nam', sold: true, status: 'Đã bán', updated: 'Hôm qua' },
  { id: 'p6', prov: '75', seri: 'A1', num: '686.68', cat: 'Lộc phát', price: '355.000.000đ', vehicle: 'Ô tô', city: 'Huế', status: 'Còn hàng', updated: 'Hôm qua' },
  { id: 'p7', prov: '43', seri: 'K1', num: '555.55', cat: 'Ngũ quý', price: '1.250.000.000đ', vehicle: 'Xe máy', city: 'Đà Nẵng', status: 'Còn hàng', updated: '3 ngày trước' },
  { id: 'p8', prov: '43', seri: 'C1', num: '339.99', cat: 'Tam hoa', price: '186.000.000đ', vehicle: 'Ô tô', city: 'Đà Nẵng', isNew: true, status: 'Ẩn', updated: '3 ngày trước' },
  { id: 'p9', prov: '43', seri: 'B2', num: '168.68', cat: 'Lộc phát', price: '298.000.000đ', vehicle: 'Ô tô', city: 'Đà Nẵng', status: 'Còn hàng', updated: '3 ngày trước' },
  { id: 'p10', prov: '43', seri: 'D1', num: '399.39', cat: 'Thần tài', price: '265.000.000đ', vehicle: 'Ô tô', city: 'Đà Nẵng', status: 'Còn hàng', updated: '4 ngày trước' },
  { id: 'p11', prov: '92', seri: 'B1', num: '777.79', cat: 'Tứ quý', price: '520.000.000đ', vehicle: 'Ô tô', city: 'Quảng Nam', status: 'Còn hàng', updated: '5 ngày trước' },
  { id: 'p12', prov: '75', seri: 'C2', num: '686.86', cat: 'Lộc phát', price: '310.000.000đ', vehicle: 'Xe máy', city: 'Huế', status: 'Còn hàng', updated: '6 ngày trước' },
];

export const CATS = ['Ngũ quý', 'Tứ quý', 'Tam hoa', 'Lộc phát', 'Thần tài'];
export const CITIES = ['Đà Nẵng', 'Quảng Nam', 'Huế'];
export const POST_CATS = ['Tất cả', 'Ý nghĩa biển số', 'Cách chọn biển hợp mệnh', 'Cập nhật quy định'];

const RAW_POSTS = [
  { id: 'a1', cat: 'Ý nghĩa biển số', date: '28/07/2026', slug: 'ngu-quy-99999-dat-nhat-thi-truong', img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=70', status: 'Đã xuất bản' },
  { id: 'a2', cat: 'Ý nghĩa biển số', date: '21/07/2026', slug: 'loc-phat-68-hay-86', img: 'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=70', status: 'Đã xuất bản' },
  { id: 'a3', cat: 'Cách chọn biển hợp mệnh', date: '14/07/2026', slug: 'cach-tinh-tong-nut-bien-so', img: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=70', status: 'Đã xuất bản' },
  { id: 'a4', cat: 'Ý nghĩa biển số', date: '06/07/2026', slug: 'than-tai-79-39-giu-tien', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=70', status: 'Đã xuất bản' },
  { id: 'a5', cat: 'Cập nhật quy định', date: '28/06/2026', status: 'Bản nháp' },
  { id: 'a6', cat: 'Cách chọn biển hợp mệnh', date: '19/06/2026', status: 'Bản nháp' },
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

export const PLATES = decoratePlates(RAW_PLATES);
export const POSTS = decoratePosts(RAW_POSTS);

export const priceNum = (p) => { const n = String(p).replace(/[^0-9]/g, ''); return n ? parseInt(n, 10) : 0; };
export const opts = (arr) => arr.map((v) => ({ value: v, label: v }));
export const validatePhone = (v) => /^0\d{8,10}$/.test(String(v).replace(/[\s.]/g, ''));
