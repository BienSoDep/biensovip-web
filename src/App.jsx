import { useEffect, useRef, useState } from 'react';
import {
  PLATES, CATS, POST_CATS, POSTS, CONTACTS,
  priceNum, validatePhone,
} from './lib/mockData.js';
import { PER_PAGE } from './common/constants.js';
import NavBtn, { darkPill } from './components/NavBtn.jsx';
import Breadcrumb from './components/Breadcrumb.jsx';
import Header from './layout/Header.jsx';
import Footer from './layout/Footer.jsx';
import Home from './pages/Home.jsx';
import PlateList from './pages/PlateList.jsx';
import PlateDetail from './pages/PlateDetail.jsx';
import Auth from './pages/Auth.jsx';
import Fav from './pages/Fav.jsx';
import LuckyPlate from './pages/LuckyPlate.jsx';
import About from './pages/About.jsx';
import Blog from './pages/Blog.jsx';
import Post from './pages/Post.jsx';
import AdminShell from './layout/AdminShell.jsx';
import Modals from './layout/Modals.jsx';
import { parseRoute, routeFor, ADMIN_SCREENS, PUBLIC_SCREENS } from './config/routes.js';
import { useSeo } from './hooks/useSeo.js';
import { useHashRouter } from './hooks/useHashRouter.js';
import { makeHeroAnim } from './animations/heroAnim.js';

export default function App() {
  const initRoute = (typeof window !== 'undefined') ? parseRoute(window.location.hash) : { screen: 'home' };
  const [st, setSt] = useState({
    screen: initRoute.screen || 'home', device: 'desktop',
    cat: 'Tất cả', q: '', cities: {}, catFilters: {}, vehicle: 'Tất cả', sort: 'new', page: 1,
    favs: { p2: true, p7: true }, curId: initRoute.detailId || 'p1',
    modal: false, sent: false, mName: '', mPhone: '', mNote: '', mErr: {},
    aName: '', aPhone: '', aPw: '', aPw2: '', aOtp: '', aAgree: false, aErr: {}, step: 1, user: null,
    admEmail: '', admPw: '', admErr: '',
    plates: PLATES.slice(), posts: POSTS.slice(), contacts: CONTACTS.slice(),
    cats: CATS.map((c) => ({ name: c })), newCat: '', catErr: '',
    adminQ: '', admCat: 'Tất cả', admStatus: 'Tất cả',
    addOpen: false, editId: null, form: {}, formErr: {},
    confirm: null, picker: false, sync: true, toast: '',
    postCat: 'Tất cả', postId: initRoute.postId || 'a1',
    editPostId: null, cTitle: '', cBody: '', cCat: 'Ý nghĩa biển số', cErr: '',
    ms: { name: '', year: '', purpose: 'Kinh doanh', vehicle: 'Ô tô', budget: 'Mọi ngân sách' }, msResult: null,
  });
  const patch = (p) => setSt((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));
  const toastTimer = useRef(null);
  const fanDone = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => { fanDone.current = true; }, 1200);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useHashRouter(st, patch);

  const notify = (msg) => {
    patch({ toast: msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => patch({ toast: '' }), 3000);
  };
  const heroAnim = makeHeroAnim(fanDone);

  const go = (s) => () => patch({ screen: s, modal: false, sent: false, picker: false, addOpen: false, confirm: null, aErr: {}, step: s === 'forgot' ? 1 : st.step, ...(s !== 'compose' ? { editPostId: null, cTitle: '', cBody: '', cCat: 'Ý nghĩa biển số', cErr: '' } : {}) });
  const toggleFav = (id) => setSt((s) => {
    const favs = { ...s.favs };
    if (favs[id]) delete favs[id]; else favs[id] = true;
    return { ...s, favs };
  });
  const openPlate = (id) => patch({ screen: 'detail', curId: id, modal: false });
  const openBuy = (id) => patch({ curId: id, modal: true, sent: false, mErr: {} });
  const openPost = (id) => patch({ screen: 'post', postId: id });
  const setField = (k) => (e) => patch({ [k]: e && e.target ? e.target.value : e });

  const filtered = () => {
    const q = st.q.trim().toLowerCase();
    const cityOn = Object.keys(st.cities).filter((k) => st.cities[k]);
    const catOn = Object.keys(st.catFilters).filter((k) => st.catFilters[k]);
    let list = st.plates.filter((p) => {
      if (st.cat !== 'Tất cả' && p.cat !== st.cat) return false;
      if (catOn.length && catOn.indexOf(p.cat) < 0) return false;
      if (cityOn.length && cityOn.indexOf(p.city) < 0) return false;
      if (st.vehicle !== 'Tất cả' && p.vehicle !== st.vehicle) return false;
      if (p.status === 'Ẩn') return false;
      if (q) {
        const hay = (p.prov + p.seri + ' ' + p.num + ' ' + p.cat).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    if (st.sort === 'asc') list = [...list].sort((a, b) => priceNum(a.price) - priceNum(b.price));
    if (st.sort === 'desc') list = [...list].sort((a, b) => priceNum(b.price) - priceNum(a.price));
    return list;
  };

  const cards = (list) => list.map((p) => ({
    ...p,
    fav: !!st.favs[p.id],
    sold: !!p.sold || p.status === 'Đã bán',
    meta: p.vehicle + ' · ' + p.city,
    onFav: () => { toggleFav(p.id); notify(st.favs[p.id] ? 'Đã bỏ khỏi yêu thích' : 'Đã lưu vào yêu thích'); },
    onOpen: () => openPlate(p.id),
    onBuy: () => openBuy(p.id),
  }));

  const submitContact = () => {
    const err = {};
    if (!st.mName.trim()) err.name = 'Vui lòng nhập họ tên.';
    if (!st.mPhone.trim()) err.phone = 'Vui lòng nhập số điện thoại.';
    else if (!validatePhone(st.mPhone)) err.phone = 'Số điện thoại chưa đúng định dạng (VD: 0905221334).';
    if (Object.keys(err).length) { patch({ mErr: err }); return; }
    const cur = st.plates.find((p) => p.id === st.curId) || st.plates[0];
    const row = { id: 'c' + Date.now(), name: st.mName.trim(), phone: st.mPhone.trim(), pid: cur.id, time: 'Vừa xong', status: 'Mới' };
    setSt((s) => ({ ...s, sent: true, mErr: {}, contacts: [row, ...s.contacts] }));
    notify('Đã gửi yêu cầu tư vấn');
  };

  const adminSignIn = () => {
    const err = {};
    if (!/^\S+@\S+\.\S+$/.test(st.admEmail)) err.email = 'Email chưa đúng định dạng.';
    if (st.admPw.length < 6) err.pw = 'Mật khẩu tối thiểu 6 ký tự.';
    if (Object.keys(err).length) { patch({ admErr: err }); return; }
    patch({ admErr: {}, screen: 'dash' });
    notify('Đăng nhập quản trị thành công');
  };
  const adminDemo = () => {
    patch({ admEmail: 'admin@biensovip.com', admPw: 'admin123', admErr: {}, screen: 'dash' });
    notify('Đăng nhập quản trị bằng tài khoản mẫu');
  };

  const authSubmit = () => {
    const s = st.screen;
    const err = {};
    if (s === 'register') {
      if (!st.aName.trim()) err.name = 'Vui lòng nhập họ tên.';
      if (!validatePhone(st.aPhone)) err.phone = 'Số điện thoại chưa đúng định dạng.';
      if (st.aPw.length < 8) err.pw = 'Mật khẩu tối thiểu 8 ký tự.';
      if (!st.aAgree) err.agree = true;
      if (Object.keys(err).length) { patch({ aErr: err }); return; }
      patch({ aErr: {}, user: st.aName.trim(), screen: 'home' });
      notify('Tạo tài khoản thành công');
      return;
    }
    if (s === 'login') {
      if (!validatePhone(st.aPhone)) err.phone = 'Số điện thoại chưa đúng định dạng.';
      if (st.aPw.length < 8) err.pw = 'Mật khẩu tối thiểu 8 ký tự.';
      if (Object.keys(err).length) { patch({ aErr: err }); return; }
      patch({ aErr: {}, user: st.aName.trim() || 'Khách Duy Đinh', screen: 'home' });
      notify('Đăng nhập thành công');
      return;
    }
    if (st.step === 1) {
      if (!validatePhone(st.aPhone)) { patch({ aErr: { phone: 'Số điện thoại chưa đúng định dạng.' } }); return; }
      patch({ aErr: {}, step: 2 });
      notify('Đã gửi mã OTP');
      return;
    }
    if (st.step === 2) {
      if (!/^\d{6}$/.test(st.aOtp)) { patch({ aErr: { otp: 'Mã gồm 6 chữ số.' } }); return; }
      patch({ aErr: {}, step: 3 });
      return;
    }
    if (st.aPw.length < 8) { patch({ aErr: { pw: 'Mật khẩu tối thiểu 8 ký tự.' } }); return; }
    if (st.aPw !== st.aPw2) { patch({ aErr: { pw2: 'Hai mật khẩu chưa khớp.' } }); return; }
    patch({ aErr: {}, screen: 'login', step: 1, aPw: '', aPw2: '' });
    notify('Đã đặt lại mật khẩu');
  };

  const openAdd = () => patch({ addOpen: true, editId: null, formErr: {}, form: { prov: '', seri: '', num: '', cat: 'Ngũ quý', vehicle: 'Ô tô', status: 'Còn hàng', price: '' } });
  const openEdit = (p) => patch({ addOpen: true, editId: p.id, formErr: {}, form: { prov: p.prov, seri: p.seri, num: p.num, cat: p.cat, vehicle: p.vehicle, status: p.status, price: p.price === 'Giá liên hệ' ? '' : p.price } });
  const setForm = (k) => (v) => setSt((s) => ({ ...s, form: { ...s.form, [k]: v && v.target ? v.target.value : v } }));

  const openEditPost = (p) => patch({ screen: 'compose', editPostId: p.id, cTitle: p.title, cBody: p.body ? p.body.map((b) => b.v || '').join('\n') : (p.excerpt || ''), cCat: p.cat, cErr: '' });

  const savePlate = () => {
    const f = st.form;
    const err = {};
    if (!/^\d{2}$/.test(String(f.prov || '').trim())) err.prov = 'Mã tỉnh gồm 2 số.';
    if (!String(f.seri || '').trim()) err.seri = 'Nhập seri.';
    if (!String(f.num || '').trim()) err.num = 'Nhập số biển.';
    if (Object.keys(err).length) { patch({ formErr: err }); return; }
    const price = String(f.price || '').trim();
    const row = {
      prov: f.prov.trim(), seri: f.seri.trim().toUpperCase(), num: f.num.trim(), cat: f.cat,
      vehicle: f.vehicle, city: f.prov === '92' ? 'Quảng Nam' : (f.prov === '75' ? 'Huế' : 'Đà Nẵng'),
      price: price || 'Giá liên hệ', status: f.status, updated: 'Vừa xong',
    };
    setSt((s) => {
      if (s.editId) {
        return { ...s, plates: s.plates.map((p) => (p.id === s.editId ? { ...p, ...row } : p)), addOpen: false, editId: null, formErr: {} };
      }
      return { ...s, plates: [{ id: 'p' + Date.now(), isNew: true, ...row }, ...s.plates], addOpen: false, formErr: {} };
    });
    notify(st.editId ? 'Đã cập nhật biển số' : 'Đã thêm biển số mới');
  };

  const askDelete = (kind, id, text) => patch({ confirm: { kind, id, text } });
  const doDelete = () => {
    const c = st.confirm;
    if (!c) return;
    setSt((s) => {
      if (c.kind === 'plate') return { ...s, plates: s.plates.filter((p) => p.id !== c.id), confirm: null };
      if (c.kind === 'post') return { ...s, posts: s.posts.filter((p) => p.id !== c.id), confirm: null };
      if (c.kind === 'cat') return { ...s, cats: s.cats.filter((x) => x.name !== c.id), confirm: null };
      return { ...s, confirm: null };
    });
    notify('Đã xóa');
  };

  const publish = (status) => {
    const t = st.cTitle.trim();
    if (!t) { patch({ cErr: 'Nhập tiêu đề bài viết.' }); return; }
    setSt((s) => {
      if (s.editPostId) {
        const posts = s.posts.map((p) => (p.id === s.editPostId ? { ...p, title: t, cat: s.cCat, excerpt: s.cBody.slice(0, 90) || p.excerpt, status } : p));
        return { ...s, posts, editPostId: null, cTitle: '', cBody: '', cErr: '', screen: 'aposts' };
      }
      const row = { id: 'a' + Date.now(), title: t, cat: s.cCat, date: 'Hôm nay', excerpt: s.cBody.slice(0, 90) || 'Bài viết mới.', status };
      return { ...s, posts: [row, ...s.posts], cTitle: '', cBody: '', cErr: '', screen: 'aposts' };
    });
    notify(status === 'Bản nháp' ? 'Đã lưu nháp' : (st.editPostId ? 'Đã cập nhật bài viết' : 'Đã xuất bản bài viết'));
  };

  const s = st.screen;
  const cur0 = st.plates.find((p) => p.id === st.curId) || st.plates[0];
  const cur = { ...cur0, title: cur0.prov + cur0.seri + ' · ' + cur0.num, sub: 'Biển ' + String(cur0.vehicle).toLowerCase() + ' · ' + cur0.city + (cur0.hot ? ' · còn 1 số duy nhất' : ''), ref: cur0.prov + cur0.seri + String(cur0.num).replace('.', '') };
  useSeo(st, cur0);
  const isAdminShell = ADMIN_SCREENS.indexOf(s) >= 0;
  const isPublic = PUBLIC_SCREENS.indexOf(s) >= 0;

  const list = filtered();
  const per = PER_PAGE;
  const pageCount = Math.max(1, Math.ceil(list.length / per));
  const page = Math.min(st.page, pageCount);
  const pageItems = list.slice((page - 1) * per, page * per);
  const favCards = cards(st.plates.filter((p) => st.favs[p.id]));

  const admQ = st.adminQ.trim().toLowerCase();
  const admPlates = st.plates.filter((p) => {
    if (st.admCat !== 'Tất cả' && p.cat !== st.admCat) return false;
    if (st.admStatus !== 'Tất cả' && p.status !== st.admStatus) return false;
    if (admQ && (p.prov + p.seri + ' ' + p.num + ' ' + p.cat).toLowerCase().indexOf(admQ) < 0) return false;
    return true;
  });
  const admContacts = st.contacts.filter((c) => !admQ || (c.name + ' ' + c.phone).toLowerCase().indexOf(admQ) >= 0);
  const admPosts = st.posts.filter((p) => !admQ || p.title.toLowerCase().indexOf(admQ) >= 0);

  const adminMeta = {
    dash: ['Tổng quan', 'Chào buổi sáng, đây là tình hình hôm nay.'],
    aplates: ['Biển số', st.plates.length + ' biển số trong hệ thống'],
    acats: ['Danh mục', 'Danh mục dùng cho bộ lọc phía khách'],
    acontacts: ['Yêu cầu liên hệ', st.contacts.filter((c) => c.status === 'Mới').length + ' yêu cầu mới cần xử lý'],
    aposts: ['Bài viết', st.posts.filter((p) => p.status === 'Đã xuất bản').length + ' bài đang hiển thị'],
    compose: ['Viết bài mới', 'Bài sẽ có slug và meta riêng để tối ưu SEO'],
  }[s] || ['', ''];

  const authMeta = {
    register: ['Tạo tài khoản', 'Lưu biển yêu thích và nhận số mới trước tiên.', 'Đăng ký'],
    login: ['Đăng nhập', 'Tiếp tục với tài khoản Duy Đinh của bạn.', 'Đăng nhập'],
    forgot: [
      ['Lấy lại mật khẩu', 'Nhập số điện thoại đã đăng ký để nhận mã xác thực.', 'Gửi mã OTP'],
      ['Nhập mã xác thực', 'Mã 6 số đã được gửi tới số bạn vừa nhập.', 'Xác nhận mã'],
      ['Đặt mật khẩu mới', 'Chọn mật khẩu tối thiểu 8 ký tự.', 'Hoàn tất'],
    ][st.step - 1],
  }[s] || ['', '', ''];

  const post = st.posts.find((p) => p.id === st.postId) || st.posts[0];
  const frameW = st.device === 'mobile' ? '414px' : '100%';
  const insertPlates = st.plates.filter((p) => p.id !== cur.id).slice(0, 4);

  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--blue-500', '#E8790A');
    r.setProperty('--blue-600', '#CF6B08');
    r.setProperty('--blue-700', '#8A4A05');
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100, display: 'flex', gap: 4, padding: 4, borderRadius: 'var(--radius-pill)', background: 'var(--ink-900)', boxShadow: 'var(--shadow-3)' }}>
        <NavBtn onClick={() => patch({ device: 'desktop' })} {...darkPill(st.device === 'desktop')}>Desktop</NavBtn>
        <NavBtn onClick={() => patch({ device: 'mobile' })} {...darkPill(st.device === 'mobile')}>Mobile</NavBtn>
      </div>

      <div style={{ maxWidth: frameW, margin: '0 auto', position: 'relative', overflowX: 'hidden' }}>

        {isPublic && <Header s={s} go={go} favCount={favCards.length} user={st.user} patch={patch} notify={notify} />}

        {isPublic && (function () {
          let trail = [];
          if (s === 'list') trail = [{ label: 'Biển số' }];
          else if (s === 'detail') trail = [{ label: 'Biển số', onClick: go('list') }, { label: cur.title }];
          else if (s === 'fav') trail = [{ label: 'Yêu thích' }];
          else if (s === 'about') trail = [{ label: 'Về chúng tôi' }];
          else if (s === 'blog') trail = [{ label: 'Tin phong thủy' }];
          else if (s === 'lucky') trail = [{ label: 'Tư vấn biển hợp mệnh' }];
          else if (s === 'post') trail = [{ label: 'Tin phong thủy', onClick: go('blog') }, { label: post.title }];
          else if (s === 'register') trail = [{ label: 'Tài khoản' }, { label: 'Đăng ký' }];
          else if (s === 'login') trail = [{ label: 'Tài khoản' }, { label: 'Đăng nhập' }];
          else if (s === 'forgot') trail = [{ label: 'Tài khoản' }, { label: 'Lấy lại mật khẩu' }];
          if (!trail.length) return null;
          return <Breadcrumb items={[{ label: 'Trang chủ', onClick: go('home') }, ...trail]} />;
        })()}

        {s === 'home' && <Home st={st} patch={patch} go={go} notify={notify} heroAnim={heroAnim} cards={cards} />}

        {s === 'list' && <PlateList st={st} setSt={setSt} patch={patch} list={list} page={page} pageCount={pageCount} pageItems={pageItems} cards={cards} />}

        {s === 'detail' && <PlateDetail st={st} cur={cur} go={go} openPlate={openPlate} openBuy={openBuy} toggleFav={toggleFav} notify={notify} />}

        {(s === 'register' || s === 'login' || s === 'forgot' || s === 'adminLogin') && (
          <Auth st={st} s={s === 'adminLogin' ? 'login' : s} patch={patch} go={go} setField={setField} authMeta={authMeta} authSubmit={authSubmit} adminSignIn={adminSignIn} adminDemo={adminDemo} admin={s === 'adminLogin'} />
        )}

        {s === 'fav' && <Fav favCards={favCards} patch={patch} go={go} notify={notify} />}

        {s === 'lucky' && <LuckyPlate st={st} patch={patch} go={go} openPlate={openPlate} openBuy={openBuy} />}

        {s === 'about' && <About go={go} />}

        {s === 'blog' && <Blog st={st} patch={patch} />}

        {s === 'post' && <Post post={post} st={st} go={go} openPlate={openPlate} openPost={openPost} notify={notify} />}

        {isPublic && <Footer />}

        {false && s === 'adminLogin'}

        {isAdminShell && (
          <AdminShell
            s={s} st={st} setSt={setSt} patch={patch} go={go} notify={notify} setField={setField}
            adminMeta={adminMeta} admPlates={admPlates} admContacts={admContacts} admPosts={admPosts}
            openAdd={openAdd} openEdit={openEdit} openEditPost={openEditPost} askDelete={askDelete} publish={publish} insertPlates={insertPlates}
          />
        )}

        <Modals st={st} patch={patch} setForm={setForm} savePlate={savePlate} doDelete={doDelete} cur={cur} submitContact={submitContact} setField={setField} />

      </div>
    </div>
  );
}
