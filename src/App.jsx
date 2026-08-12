import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import {
  PLATES, CATS, POSTS, CONTACTS, STAFF,
  validatePhone,
} from './lib/mockData.js';
import { loadAuth, saveAuth } from './lib/authStore.js';
import * as authApi from './services/authService.js';
import * as favApi from './services/favoriteService.js';
import { getLocalFavorites, addLocalFavorite, removeLocalFavorite } from './services/favoriteStore.js';
import { contentGet } from './lib/content/index.js';
import Breadcrumb from './components/Breadcrumb.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Header from './layout/Header.jsx';
import Footer from './layout/Footer.jsx';
import MobileDrawer from './layout/MobileDrawer.jsx';
import PageSkeleton from './components/skeletons/PageSkeleton.jsx';
import { parseRoute, ADMIN_SCREENS, PUBLIC_SCREENS } from './config/routes.js';
import { useSeo } from './hooks/useSeo.js';
import { usePlateDetail } from './services/plateDetail.js';
import { useBlogPost } from './services/blog.js';
import { useHashRouter } from './hooks/useHashRouter.js';
import { makeHeroAnim } from './animations/heroAnim.js';

const Home = lazy(() => import('./pages/Home.jsx'));
const PlateList = lazy(() => import('./pages/PlateList.jsx'));
const PlateDetail = lazy(() => import('./pages/PlateDetail.jsx'));
const Auth = lazy(() => import('./pages/Auth.jsx'));
const Fav = lazy(() => import('./pages/Fav.jsx'));
const LuckyPlate = lazy(() => import('./pages/LuckyPlate.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Blog = lazy(() => import('./pages/Blog.jsx'));
const Post = lazy(() => import('./pages/Post.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const ChatZaloContact = lazy(() => import('./pages/ChatZaloContact.jsx'));
const Compare = lazy(() => import('./pages/Compare.jsx'));
const SavedSearches = lazy(() => import('./pages/SavedSearches.jsx'));
const Reviews = lazy(() => import('./pages/Reviews.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const Collaborator = lazy(() => import('./pages/Collaborator.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const TransferGuide = lazy(() => import('./pages/TransferGuide.jsx'));
const Faq = lazy(() => import('./pages/Faq.jsx'));
const AdminShell = lazy(() => import('./layout/AdminShell.jsx'));
const Modals = lazy(() => import('./layout/Modals.jsx'));
const AiChatbot = lazy(() => import('./components/AiChatbot.jsx'));

export default function App() {
  const initRoute = (typeof window !== 'undefined') ? parseRoute(window.location.hash) : { screen: 'home' };
  const [favItems, setFavItems] = useState([]);
  const [st, setSt] = useState({
    screen: initRoute.screen || 'home', device: 'desktop',
    cat: 'Tất cả', q: '', cities: {}, catFilters: {}, vehicle: 'Tất cả', sort: 'new', page: 1,
    favs: {}, curId: initRoute.detailId || 'p1',
    modal: false, sent: false, mName: '', mPhone: '', mNote: '', mErr: {},
    aName: '', aEmail: '', aPhone: '', aPw: '', aPw2: '', aOtp: '', aResetToken: '', aAgree: false, aErr: {}, step: 1, user: loadAuth()?.user || null,
    admEmail: '', admPw: '', admErr: '',
    plates: PLATES.slice(), posts: POSTS.slice(), contacts: CONTACTS.slice(), staff: STAFF.slice(),
    cats: CATS.map((c) => ({ name: c })), newCat: '', catErr: '',
    adminQ: '', admCat: 'Tất cả', admStatus: 'Tất cả',
    addOpen: false, editId: null, form: {}, formErr: {},
    confirm: null, picker: false, sync: true,
    postCat: 'Tất cả', postId: initRoute.postId || 'a1',
    editPostId: null, cTitle: '', cBody: '', cCat: 'Ý nghĩa biển số', cErr: '',
    ms: { name: '', year: '', purpose: 'Kinh doanh', vehicle: 'Ô tô', budget: 'Mọi ngân sách' }, msResult: null,
    drawerOpen: false,
    compareIds: [], savedSearches: [], reviews: [], reviewDraft: null,
    notifications: [], collabs: [], videos: [],
    isAdmin: !!(loadAuth()?.isAdmin),
    settings: null,
  });
  const patch = (p) => setSt((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));
  const fanDone = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => { fanDone.current = true; }, 1200);
    return () => clearTimeout(t);
  }, []);

  // Restore admin session on mount
  useEffect(() => {
    const auth = loadAuth();
    if (auth?.isAdmin && auth?.accessToken) {
      authApi.restoreAdminSession().then((session) => {
        if (session?.user) {
          patch({ user: session.user, isAdmin: true, screen: 'dash' });
        }
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-redirect admin away from login page when already logged in
  useEffect(() => {
    if (st.screen === 'adminLogin' && st.isAdmin) {
      patch({ screen: 'dash' });
    }
  }, [st.screen, st.isAdmin]);

  // UC05+UC06 — fetch public settings for chat widget + Zalo
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/settings`)
      .then(r => r.json())
      .then(body => {
        if (!body?.success) return;
        const s = body.data;
        patch({ settings: s });
        // UC05 — inject chat widget script (Tawk.to / Messenger / custom)
        if (s.chatWidgetScript) {
          const div = document.createElement('div');
          div.innerHTML = s.chatWidgetScript;
          document.body.appendChild(div);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { saveAuth({ user: st.user, isAdmin: st.isAdmin }); }, [st.user, st.isAdmin]);

  // Init favs from localStorage (guest) or API (user)
  useEffect(() => {
    if (st.user) {
      favApi.listFavorites().then((items) => {
        if (items) {
          const dict = {};
          items.forEach((p) => { dict[p.id] = true; });
          setFavItems(items);
          patch({ favs: dict });
        }
      }).catch(() => {});
    } else {
      const ids = getLocalFavorites();
      const dict = {};
      ids.forEach((id) => { dict[id] = true; });
      setFavItems([]);
      patch({ favs: dict });
    }
  }, [st.user]);

  useHashRouter(st, patch);

  const notify = (msg) => toast(msg);
  const heroAnim = makeHeroAnim(fanDone);

  const go = (s) => () => patch({ screen: s, modal: false, sent: false, picker: false, addOpen: false, confirm: null, aErr: {}, step: s === 'forgot' ? 1 : st.step, ...(s !== 'compose' ? { editPostId: null, cTitle: '', cBody: '', cCat: 'Ý nghĩa biển số', cErr: '' } : {}), drawerOpen: false });
  const toggleFav = (id) => {
    setSt((s) => {
      const favs = { ...s.favs };
      if (favs[id]) delete favs[id]; else favs[id] = true;
      return { ...s, favs };
    });
    // Persist: guest → localStorage, user → API (fire-and-forget, optimistic)
    if (st.user) {
      const isFav = st.favs[id];
      if (isFav) {
        favApi.removeFavorite(id).catch(() => {});
        setFavItems((items) => items.filter((p) => p.id !== id));
      } else {
        favApi.addFavorite(id).then(() => favApi.listFavorites()).then((items) => items && setFavItems(items)).catch(() => {});
      }
    } else {
      const isFav = st.favs[id];
      if (isFav) removeLocalFavorite(id);
      else addLocalFavorite(id);
    }
  };
  const openPlate = (id) => patch({ screen: 'detail', curId: id, modal: false });
  const openBuy = (id) => patch({ curId: id, modal: true, sent: false, mErr: {} });
  const setField = (k) => (e) => patch({ [k]: e && e.target ? e.target.value : e });

  const catNames = st.cats.map((c) => c.name);

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
    const cur = st.plates.find((p) => p.id === st.curId);
    if (!cur) { notify('Biển số không tồn tại'); return; }
    const row = { id: 'c' + Date.now(), name: st.mName.trim(), phone: st.mPhone.trim(), note: st.mNote.trim(), pid: cur.id, time: 'Vừa xong', status: 'Mới' };
    setSt((s) => ({ ...s, sent: true, mErr: {}, contacts: [row, ...s.contacts] }));
    notify('Đã gửi yêu cầu tư vấn');
  };

  const ADMIN_EMAIL = 'admin@biensovip.com';
  const adminSignIn = async () => {
    const err = {};
    if (!/^\S+@\S+\.\S+$/.test(st.admEmail)) err.email = 'Email chưa đúng định dạng.';
    if (st.admPw.length < 6) err.pw = 'Mật khẩu tối thiểu 6 ký tự.';
    if (Object.keys(err).length) { patch({ admErr: err }); return; }
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: st.admEmail.trim(), password: st.admPw }),
      });
      const body = await resp.json();
      if (!resp.ok || !body?.success) {
        const msg = body?.error?.message || 'Đăng nhập thất bại';
        if (resp.status === 429) patch({ admErr: { pw: 'Tài khoản tạm khóa, thử lại sau 15 phút.' } });
        else if (resp.status === 401) patch({ admErr: { pw: 'Email hoặc mật khẩu không đúng.' } });
        else patch({ admErr: { email: msg } });
        return;
      }
      const { accessToken, refreshToken, admin } = body.data;
      saveAuth({ accessToken, refreshToken, user: admin, isAdmin: true });
      patch({ admErr: {}, screen: 'dash', user: admin, isAdmin: true });
      notify('Đăng nhập quản trị thành công');
    } catch {
      patch({ admErr: { email: 'Không kết nối được server.' } });
    }
  };
  const adminDemo = () => {
    patch({ admEmail: ADMIN_EMAIL, admPw: 'Admin@123', admErr: {} });
    notify('Đã điền tài khoản mẫu — bấm Đăng nhập để tiếp tục');
  };

  const authSubmit = async () => {
    const s = st.screen;
    const err = {};
    if (s === 'register') {
      if (!st.aName.trim()) err.name = 'Vui lòng nhập họ tên.';
      if (!st.aEmail.trim() || !st.aEmail.includes('@')) err.email = 'Email chưa đúng định dạng.';
      if (st.aPw.length < 8) err.pw = 'Mật khẩu tối thiểu 8 ký tự.';
      if (!st.aAgree) err.agree = true;
      if (Object.keys(err).length) { patch({ aErr: err }); return; }
      try {
        await authApi.register({ identifierType: 'email', identifier: st.aEmail.trim(), password: st.aPw, fullName: st.aName.trim() });
        patch({ aErr: {}, screen: 'login', aPw: '', step: 1 });
        notify('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
      } catch (e) {
        if (e.status === 409) patch({ aErr: { email: 'Email đã được sử dụng.' } });
        else patch({ aErr: { email: e.message || 'Đăng ký thất bại.' } });
      }
      return;
    }
    if (s === 'login') {
      if (!st.aEmail.trim()) err.email = 'Vui lòng nhập email hoặc số điện thoại.';
      if (st.aPw.length < 8) err.pw = 'Mật khẩu tối thiểu 8 ký tự.';
      if (Object.keys(err).length) { patch({ aErr: err }); return; }
      try {
        const data = await authApi.login({ identifier: st.aEmail.trim(), password: st.aPw });
        patch({ aErr: {}, user: data.user, screen: 'home', aPw: '' });
        notify('Đăng nhập thành công');
        favApi.syncFavorites(); // fire-and-forget: merge local → server
      } catch (e) {
        if (e.status === 401) patch({ aErr: { pw: 'Thông tin đăng nhập không đúng.' } });
        else if (e.status === 429) patch({ aErr: { pw: 'Tài khoản tạm khóa, thử lại sau 15 phút.' } });
        else patch({ aErr: { email: e.message || 'Đăng nhập thất bại.' } });
      }
      return;
    }
    if (st.step === 1) {
      if (!st.aEmail.trim() || !st.aEmail.includes('@')) { patch({ aErr: { email: 'Vui lòng nhập email đã đăng ký.' } }); return; }
      try {
        await authApi.requestPasswordResetOtp(st.aEmail.trim());
        patch({ aErr: {}, step: 2 });
        notify('Đã gửi mã OTP tới email của bạn');
      } catch { patch({ aErr: { email: 'Không gửi được email, thử lại sau.' } }); }
      return;
    }
    if (st.step === 2) {
      if (!/^\d{6}$/.test(st.aOtp)) { patch({ aErr: { otp: 'Mã gồm 6 chữ số.' } }); return; }
      try {
        const data = await authApi.verifyPasswordResetOtp(st.aEmail.trim(), st.aOtp);
        patch({ aErr: {}, step: 3, aResetToken: data?.resetToken || '' });
      } catch (e) { patch({ aErr: { otp: e.message || 'Mã OTP không đúng.' } }); }
      return;
    }
    if (st.aPw.length < 8) { patch({ aErr: { pw: 'Mật khẩu tối thiểu 8 ký tự.' } }); return; }
    if (st.aPw !== st.aPw2) { patch({ aErr: { pw2: 'Hai mật khẩu chưa khớp.' } }); return; }
    try {
      await authApi.resetPassword(st.aResetToken, st.aPw);
      patch({ aErr: {}, screen: 'login', step: 1, aPw: '', aPw2: '', aResetToken: '' });
      notify('Đã đặt lại mật khẩu');
    } catch (e) { patch({ aErr: { pw: e.message || 'Đặt lại mật khẩu thất bại.' } }); }
  };

  const openAdd = () => patch({ addOpen: true, editId: null, formErr: {}, form: { prov: '', seri: '', num: '', cat: 'Ngũ quý', vehicle: 'Ô tô', status: 'Còn hàng', price: '' } });
  const openEdit = (p) => patch({ addOpen: true, editId: p.id, formErr: {}, form: { prov: p.prov, seri: p.seri, num: p.num, cat: p.cat, vehicle: p.vehicle, status: p.status, price: p.price === 'Giá liên hệ' ? '' : p.price } });
  const setForm = (k) => (v) => setSt((s) => ({ ...s, form: { ...s.form, [k]: v && v.target ? v.target.value : v } }));

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

  const s = st.screen;
  const cur0 = st.plates.find((p) => p.id === st.curId);
  const cur = cur0 ? { ...cur0, title: cur0.prov + cur0.seri + ' · ' + cur0.num, sub: 'Biển ' + String(cur0.vehicle).toLowerCase() + ' · ' + cur0.city + (cur0.hot ? ' · còn 1 số duy nhất' : ''), ref: cur0.prov + cur0.seri + String(cur0.num).replace('.', '') } : null;

  const { data: seoPlate } = usePlateDetail(s === 'detail' ? st.curId : null);
  const { data: seoPost } = useBlogPost(s === 'post' ? st.postId : null);
  useSeo(s, s === 'detail' ? { plate: seoPlate } : s === 'post' ? { post: seoPost } : undefined);
  const isAdminShell = ADMIN_SCREENS.indexOf(s) >= 0;
  const isPublic = PUBLIC_SCREENS.indexOf(s) >= 0;

  const favCards = favItems.map((p) => ({
    id: p.id, plateNumber: p.plateNumber, price: p.price, province: p.province,
    thumbnailUrl: p.thumbnailUrl, status: p.status,
    fav: true,
    onFav: () => { toggleFav(p.id); notify('Đã bỏ khỏi yêu thích'); },
    onOpen: () => openPlate(p.id),
    onBuy: () => openBuy(p.id),
  }));

  const admQ = st.adminQ.trim().toLowerCase();
  const admPlates = st.plates.filter((p) => {
    if (st.admCat !== 'Tất cả' && p.cat !== st.admCat) return false;
    if (st.admStatus !== 'Tất cả' && p.status !== st.admStatus) return false;
    if (admQ && (p.prov + p.seri + ' ' + p.num + ' ' + p.cat).toLowerCase().indexOf(admQ) < 0) return false;
    return true;
  });
  const adminMeta = {
    dash: ['Tổng quan', 'Chào buổi sáng, đây là tình hình hôm nay.'],
    aplates: ['Biển số', 'Quản lý biển số trong hệ thống'],
    acats: ['Danh mục', 'Danh mục dùng cho bộ lọc phía khách'],
    acontacts: ['Yêu cầu liên hệ', 'Quản lý yêu cầu liên hệ từ khách'],
    astaff: ['Nhân viên', st.staff.length + ' nhân viên trong hệ thống'],
    aposts: ['Bài viết', st.posts.filter((p) => p.status === 'Đã xuất bản').length + ' bài đang hiển thị'],
    compose: ['Viết bài mới', 'Bài sẽ có slug và meta riêng để tối ưu SEO'],
    acustomers: ['Khách hàng', (st.contacts || []).length + ' khách hàng trong hệ thống'],
    avideos: ['Video', 'Quản lý video TikTok/Facebook'],
    anotifications: ['Thông báo', 'Gửi thông báo đến người dùng'],
    acollabs: ['Cộng tác viên', 'Quản lý cộng tác viên bán biển'],
    areviews: ['Đánh giá', 'Kiểm duyệt đánh giá của khách hàng'],
  }[s] || ['', ''];

  const authMeta = {
    register: ['Tạo tài khoản', 'Lưu biển yêu thích và nhận số mới trước tiên.', 'Đăng ký'],
    login: ['Đăng nhập', 'Tiếp tục với tài khoản Duy Đinh của bạn.', 'Đăng nhập'],
    forgot: [
      ['Lấy lại mật khẩu', 'Nhập email đã đăng ký để nhận mã xác thực.', 'Gửi mã OTP'],
      ['Nhập mã xác thực', 'Mã 6 số đã được gửi tới email của bạn.', 'Xác nhận mã'],
      ['Đặt mật khẩu mới', 'Chọn mật khẩu tối thiểu 8 ký tự.', 'Hoàn tất'],
    ][st.step - 1],
  }[s] || ['', '', ''];



  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
        <Toaster position="top-right" toastOptions={{ role: 'alert', style: { background: 'var(--surface-inverse)', color: 'var(--white)', borderRadius: 'var(--radius-md)', font: 'var(--type-caption)' } }} />
        <main>

        <div style={{ maxWidth: '100%', margin: '0 auto', position: 'relative', overflowX: 'hidden' }}>

          {isPublic && <Header s={s} go={go} favCount={favCards.length} user={st.user} patch={patch} notify={notify} onMenu={() => patch({ drawerOpen: true })} openPlate={openPlate} />}

          {isPublic && <MobileDrawer open={st.drawerOpen} onClose={() => patch({ drawerOpen: false })} s={s} go={go} user={st.user} patch={patch} notify={notify} />}

          {isPublic && (function () {
            let trail = [];
            if (s === 'list') trail = [{ label: 'Biển số' }];
            else if (s === 'detail') trail = [{ label: 'Biển số', onClick: go('list') }];
            else if (s === 'fav') trail = [{ label: 'Yêu thích' }];
            else if (s === 'about') trail = [{ label: 'Về chúng tôi' }];
            else if (s === 'blog') trail = [{ label: 'Tin phong thủy' }];
            else if (s === 'lucky') trail = [{ label: 'Tư vấn biển hợp mệnh' }];
            else if (s === 'post') trail = [{ label: 'Tin phong thủy', onClick: go('blog') }];
            else if (s === 'chat') trail = [{ label: 'Liên hệ tư vấn' }];
            else if (s === 'compare') trail = [{ label: 'So sánh biển số' }];
            else if (s === 'saved') trail = [{ label: 'Thông báo biển mới' }];
            else if (s === 'reviews') trail = [{ label: 'Đánh giá' }];
            else if (s === 'notifications') trail = [{ label: 'Thông báo' }];
            else if (s === 'collab') trail = [{ label: 'Cộng tác viên' }];
            else if (s === 'terms') trail = [{ label: 'Điều khoản sử dụng' }];
            else if (s === 'privacy') trail = [{ label: 'Chính sách bảo mật' }];
            else if (s === 'transfer') trail = [{ label: 'Hướng dẫn sang tên' }];
            else if (s === 'faq') trail = [{ label: 'Câu hỏi thường gặp' }];
            if (!trail.length) return null;
            return <Breadcrumb items={[{ label: contentGet('common.breadcrumb.home'), onClick: go('home') }, ...trail]} keepOnMobile={s === 'detail' || s === 'post'} />;
          })()}

          <Suspense fallback={<PageSkeleton screen={s} />}>
            {s === 'home' && <Home st={st} patch={patch} go={go} notify={notify} heroAnim={heroAnim} openPlate={openPlate} openBuy={openBuy} />}

            {s === 'list' && <PlateList favs={st.favs} onFav={toggleFav} openPlate={openPlate} openBuy={openBuy} notify={notify} go={go} />}

            {s === 'detail' && <PlateDetail plateId={st.curId} favs={st.favs} onFav={toggleFav} go={go} openPlate={openPlate} notify={notify} />}

            {(s === 'register' || s === 'login' || s === 'forgot' || s === 'adminLogin') && (
              <Auth st={st} s={s === 'adminLogin' ? 'login' : s} patch={patch} go={go} setField={setField} authMeta={authMeta} authSubmit={authSubmit} adminSignIn={adminSignIn} adminDemo={adminDemo} admin={s === 'adminLogin'} />
            )}

            {s === 'fav' && <Fav favCards={favCards} user={st.user} patch={patch} go={go} notify={notify} />}

            {s === 'lucky' && <LuckyPlate go={go} notify={notify} />}

            {s === 'about' && <About go={go} />}

            {s === 'chat' && <ChatZaloContact notify={notify} />}

            {s === 'compare' && <Compare go={go} notify={notify} />}

            {s === 'saved' && <SavedSearches go={go} notify={notify} />}

            {s === 'reviews' && <Reviews notify={notify} />}

            {s === 'notifications' && <Notifications go={go} notify={notify} />}

            {s === 'collab' && <Collaborator st={st} patch={patch} go={go} notify={notify} />}

            {s === 'terms' && <Terms />}

            {s === 'privacy' && <Privacy />}

            {s === 'transfer' && <TransferGuide go={go} />}

            {s === 'faq' && <Faq go={go} />}

            {s === 'blog' && <Blog st={st} patch={patch} />}

            {s === 'post' && <Post postId={st.postId} go={go} patch={patch} notify={notify} />}

            {s === 'notfound' && <NotFound go={go} />}

            {isAdminShell && (
              <RequireAuth st={st} go={go}>
                <AdminShell
                  s={s} st={st} setSt={setSt} patch={patch} go={go} notify={notify} setField={setField}
                  adminMeta={adminMeta} askDelete={askDelete}
                />
              </RequireAuth>
            )}
          </Suspense>

          {isPublic && <Footer />}

          <Suspense fallback={null}>
            <Modals st={st} patch={patch} setForm={setForm} savePlate={savePlate} doDelete={doDelete} cur={cur} submitContact={submitContact} setField={setField} catNames={catNames} />
          </Suspense>

          {isPublic && st.settings?.zalo && (
            <a href={`https://zalo.me/${st.settings.zalo.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="Chat Zalo" title="Chat qua Zalo" style={{ position: 'fixed', bottom: 88, right: 20, zIndex: 80, width: 48, height: 48, borderRadius: '50%', background: '#0068FF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-3)', transition: 'var(--transition-control)', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.02 2 10.98c0 2.94 1.69 5.52 4.23 6.94l-1.06 3.18a.5.5 0 0 0 .66.63l3.55-1.38c.82.23 1.68.35 2.62.35 5.52 0 10-4.02 10-8.98S17.52 2 12 2Z" fill="#fff" fillOpacity=".12" stroke="#fff" strokeWidth="1.5"/><path d="M8.5 9.5h.01M12 9.5h.01M15.5 9.5h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M8.5 13.5s1.5 2 3.5 2 3.5-2 3.5-2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </a>
          )}

          {isPublic && (
            <Suspense fallback={null}>
              <AiChatbot go={go} />
            </Suspense>
          )}

        </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
