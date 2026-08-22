import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import {
  PLATES, CATS, POSTS, CONTACTS, STAFF,
  validatePhone,
} from './lib/mockData.js';
import { loadAuth, saveAuth } from './lib/authStore.js';
import * as authApi from './services/authService.js';
import * as favApi from './services/favoriteService.js';
import { getLocalFavorites, addLocalFavorite, removeLocalFavorite, clearLocalFavorites } from './services/favoriteStore.js';
import { useComparePlates } from './services/compareService.js';
import { contentGet } from './lib/content/index.js';
import { splitPlateNumber, formatPrice } from './lib/plateFormat.js';
import Breadcrumb from './components/Breadcrumb.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Header from './layout/Header.jsx';
import Footer from './layout/Footer.jsx';
import MobileDrawer from './layout/MobileDrawer.jsx';
import PromoRails from './components/PromoRails.jsx';
import PageSkeleton from './components/skeletons/PageSkeleton.jsx';
import { parseRoute, ADMIN_SCREENS, PUBLIC_SCREENS } from './config/routes.js';
import { useSeo } from './hooks/useSeo.js';
import { usePlateDetail } from './services/plateDetail.js';
import { useBlogPost } from './services/blog.js';
import { usePlateRealtime } from './services/plateRealtime.js';
import { useNotificationRealtime } from './services/notificationRealtime.js';
import { useHashRouter } from './hooks/useHashRouter.js';
import { makeHeroAnim } from './animations/heroAnim.js';

const Home = lazy(() => import('./pages/Home.jsx'));
const PlateList = lazy(() => import('./pages/PlateList.jsx'));
const PlateDetail = lazy(() => import('./pages/PlateDetail.jsx'));
const Auth = lazy(() => import('./pages/Auth.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'));
const Fav = lazy(() => import('./pages/Fav.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
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
    modal: false, sent: false, mName: '', mPhone: '', mNote: '', mIntent: 'inquiry', mDeposit: '', mErr: {},
    aName: '', aEmail: '', aPhone: '', aIdType: 'email', aPw: '', aPw2: '', aOtp: '', aResetToken: '', aAgree: false, aErr: {}, step: 1, redirectTo: null, user: loadAuth()?.user || null,
    plates: PLATES.slice(), posts: POSTS.slice(), contacts: CONTACTS.slice(), staff: STAFF.slice(),
    cats: CATS.map((c) => ({ name: c })), newCat: '', catErr: '',
    adminQ: '', admCat: 'Tất cả', admStatus: 'Tất cả',
    addOpen: false, editId: null, form: {}, formErr: {},
    confirm: null, picker: false, sync: true,
    postCat: 'Tất cả', postId: initRoute.postId || 'a1',
    editPostId: null, cTitle: '', cBody: '', cCat: 'Ý nghĩa biển số', cErr: '',
    ms: { name: '', year: '', purpose: 'Kinh doanh', vehicle: 'Ô tô', budget: 'Mọi ngân sách' }, msResult: null, listNotice: null,
    drawerOpen: false,
    compareIds: [], savedSearches: [], reviews: [], reviewDraft: null,
    notifications: [], collabs: [], videos: [],
    isAdmin: !!(loadAuth()?.isAdmin),
    settings: null,
  });
  const patch = (p) => setSt((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));
  const fanDone = useRef(false);

  // UC09 realtime — admin thêm/sửa/xóa biển → public tự cập nhật tức thì
  usePlateRealtime();
  // UC17 realtime — user đăng nhập nhận thông báo mới (chuông/toast tức thì)
  useNotificationRealtime(st.user);

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
    if (st.screen === 'login' && st.isAdmin) {
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

  // UC05 — Messenger Customer Chat plugin (chỉ load khi có VITE_FB_PAGE_ID; Zalo là fallback).
  useEffect(() => {
    const pageId = import.meta.env.VITE_FB_PAGE_ID;
    if (!pageId || document.getElementById('facebook-jssdk')) return;
    window.fbAsyncInit = () => { window.FB?.init?.({ xfbml: true, version: 'v18.0' }); };
    const root = document.createElement('div');
    root.id = 'fb-root';
    document.body.appendChild(root);
    const chat = document.createElement('div');
    chat.id = 'fb-customer-chat';
    chat.className = 'fb-customerchat';
    chat.setAttribute('page_id', pageId);
    chat.setAttribute('attribution', 'biz_inbox');
    document.body.appendChild(chat);
    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.async = true;
    js.defer = true;
    js.src = 'https://connect.facebook.net/vi_VN/sdk/xfbml.customerchat.js';
    document.body.appendChild(js);
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

  // Scroll to top whenever the page changes (route, plate, or post).
  useEffect(() => { window.scrollTo(0, 0); }, [st.screen, st.curId, st.postId]);

  const notify = (msg) => toast(msg);
  const heroAnim = makeHeroAnim(fanDone);

  const go = (s) => () => patch({ screen: s, modal: false, sent: false, picker: false, addOpen: false, confirm: null, aErr: {}, step: s === 'forgot' ? 1 : st.step, redirectTo: (s === 'login' || s === 'register') && !['login', 'register', 'forgot'].includes(st.screen) ? st.screen : st.redirectTo, ...(s !== 'compose' ? { editPostId: null, cTitle: '', cBody: '', cCat: 'Ý nghĩa biển số', cErr: '' } : {}), drawerOpen: false });
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
  const clearAllFavs = async () => {
    if (st.user) {
      try { await favApi.clearFavorites(); } catch { /* ignore */ }
      setFavItems([]);
    } else {
      clearLocalFavorites();
    }
    patch({ favs: {} });
    notify('Đã bỏ lưu tất cả');
  };
  const openPlate = (id) => patch({ screen: 'detail', curId: id, modal: false });
  const openPost = (slug) => patch({ screen: 'post', postId: slug, modal: false });
  const openBuy = (id) => patch({ curId: id, modal: true, sent: false, mIntent: 'inquiry', mDeposit: '', mErr: {} });
  const setField = (k) => (e) => patch({ [k]: e && e.target ? e.target.value : e });
  // Liên hệ shop cho card biển số: ưu tiên settings từ backend, fallback số mặc định (info.json).
  const contact = {
    phone: (st.settings?.phone || '0815792699').replace(/[^0-9]/g, ''),
    zalo: (st.settings?.zalo || '0815792699').replace(/[^0-9]/g, ''),
  };

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

  const submitContact = async () => {
    const err = {};
    if (!st.mName.trim()) err.name = 'Vui lòng nhập họ tên.';
    if (!st.mPhone.trim()) err.phone = 'Vui lòng nhập số điện thoại.';
    else if (!validatePhone(st.mPhone)) err.phone = 'Số điện thoại chưa đúng định dạng (VD: 0905221334).';
    if (Object.keys(err).length) { patch({ mErr: err }); return; }

    // UC07 — gửi thật lên API (backend resolve plateNumber → plateId, chống spam qua honeypot).
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(st.curId || '');
    const intent = st.mIntent === 'deposit_request' ? 'deposit_request' : 'inquiry';
    const depositAmount = intent === 'deposit_request' ? (Number(String(st.mDeposit || '').replace(/[^\d]/g, '')) || null) : null;
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/contact-requests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: st.mName.trim(),
          phone: st.mPhone.trim(),
          plateId: isGuid ? st.curId : null,
          plateNumber: cur?.plateNumber || cur?.title || null,
          note: st.mNote.trim() || null,
          source: 'plate-detail',
          intent,
          depositAmount,
          honeypot: '',
        }),
      });
      const body = await resp.json().catch(() => null);
      if (!resp.ok || !body?.success) {
        patch({ mErr: { name: body?.error?.message || 'Gửi thất bại, vui lòng thử lại.' } });
        return;
      }
      patch({ sent: true, mErr: {} });
      notify('Đã gửi yêu cầu tư vấn');
    } catch {
      patch({ mErr: { name: 'Không kết nối được server.' } });
    }
  };

  // Gọi /api/admin/auth/login — chia sẻ bởi form login user (auto-detect tài khoản admin).
  const adminLoginRequest = async (email, password) => {
    const resp = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await resp.json();
    if (!resp.ok || !body?.success) return { ok: false, status: resp.status, message: body?.error?.message };
    return { ok: true, data: body.data };
  };

  // Thử đăng nhập như admin sau khi form user thất bại (401) — cùng ô email/password.
  // true = đã đăng nhập thành công + điều hướng dashboard; false = không phải tài khoản admin.
  const tryAdminLogin = async (email, password) => {
    try {
      const result = await adminLoginRequest(email, password);
      if (!result.ok) return false;
      const { accessToken, refreshToken, admin } = result.data;
      saveAuth({ accessToken, refreshToken, user: admin, isAdmin: true });
      patch({ aErr: {}, aPw: '', screen: 'dash', user: admin, isAdmin: true });
      notify('Đăng nhập quản trị thành công');
      return true;
    } catch {
      return false;
    }
  };

  const rememberEmail = (email) => {
    try { localStorage.setItem('bsd_last_email', email); } catch { /* ignore */ }
  };

  // Hồ sơ chưa đủ để dùng tính năng hợp mệnh + phân khúc khách hàng (thiếu bất kỳ trường nào).
  const isProfileIncomplete = (user) => !user?.fullName?.trim() || !user?.birthDate || !user?.gender;

  const authSubmit = async (remember = true) => {
    const s = st.screen;
    const err = {};
    if (s === 'register') {
      const isPhone = st.aIdType === 'phone';
      if (!st.aName.trim()) err.name = 'Vui lòng nhập họ tên.';
      if (isPhone) {
        if (!st.aPhone.trim()) err.phone = 'Vui lòng nhập số điện thoại.';
        else if (!validatePhone(st.aPhone)) err.phone = 'Số điện thoại chưa đúng định dạng (VD: 0905221334).';
      } else if (!st.aEmail.trim() || !st.aEmail.includes('@')) {
        err.email = 'Email chưa đúng định dạng.';
      }
      if (st.aPw.length < 8) err.pw = 'Mật khẩu tối thiểu 8 ký tự.';
      if (!st.aAgree) err.agree = true;
      if (Object.keys(err).length) { patch({ aErr: err }); return; }
      try {
        const identifier = (isPhone ? st.aPhone : st.aEmail).trim();
        await authApi.register({ identifierType: isPhone ? 'phone' : 'email', identifier, password: st.aPw, fullName: st.aName.trim() });
        if (!isPhone) rememberEmail(identifier);
        // Đăng ký xong tự đăng nhập luôn → chuyển thẳng vào Profile để mời điền ngày sinh
        // (cần cho tính năng hợp mệnh) — Profile có nút bỏ qua nếu login tự động lỡ thất bại.
        try {
          const data = await authApi.login({ identifier, password: st.aPw, remember });
          patch({ aErr: {}, user: data.user, screen: 'profile', profileOnboarding: true, aPw: '' });
          notify('Đăng ký thành công!');
          favApi.syncFavorites();
        } catch {
          patch({ aErr: {}, screen: 'login', aPw: '', step: 1 });
          notify(isPhone ? 'Đăng ký thành công! Vui lòng đăng nhập.' : 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
        }
      } catch (e) {
        if (e.status === 409) patch({ aErr: { [isPhone ? 'phone' : 'email']: isPhone ? 'Số điện thoại đã được sử dụng.' : 'Email đã được sử dụng.' } });
        else patch({ aErr: { [isPhone ? 'phone' : 'email']: e.message || 'Đăng ký thất bại.' } });
      }
      return;
    }
    if (s === 'login') {
      if (!st.aEmail.trim()) err.email = 'Vui lòng nhập email hoặc số điện thoại.';
      if (st.aPw.length < 8) err.pw = 'Mật khẩu tối thiểu 8 ký tự.';
      if (Object.keys(err).length) { patch({ aErr: err }); return; }
      try {
        const data = await authApi.login({ identifier: st.aEmail.trim(), password: st.aPw, remember });
        rememberEmail(st.aEmail.trim());
        // Hồ sơ chưa đủ (họ tên/ngày sinh/giới tính) → mời điền luôn thay vì vào thẳng trang cũ,
        // để tính năng hợp mệnh + phân khúc khách hàng có dữ liệu ngay từ lần đăng nhập đầu.
        if (isProfileIncomplete(data.user)) {
          patch({ aErr: {}, user: data.user, screen: 'profile', profileOnboarding: true, aPw: '' });
        } else {
          patch({ aErr: {}, user: data.user, screen: st.redirectTo || 'home', aPw: '', redirectTo: null });
        }
        notify('Đăng nhập thành công');
        favApi.syncFavorites(); // fire-and-forget: merge local → server
      } catch (e) {
        // Sai với endpoint user — thử lại như tài khoản quản trị trước khi báo lỗi.
        // 1 form, 1 ô nhập, tự nhận diện loại tài khoản qua endpoint nào chấp nhận.
        if (e.status === 401) {
          const adminOk = await tryAdminLogin(st.aEmail.trim(), st.aPw);
          if (adminOk) return;
          patch({ aErr: { pw: 'Thông tin đăng nhập không đúng.' } });
        }
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

  // OTP login: passwordless sign-in, separate from forgot-password (no password change).
  const otpLoginRequest = async () => {
    if (!st.aEmail.trim() || !st.aEmail.includes('@')) { patch({ aErr: { email: 'Vui lòng nhập email đã đăng ký.' } }); return; }
    try {
      await authApi.requestLoginOtp(st.aEmail.trim());
      patch({ aErr: {}, step: 2 });
      notify('Đã gửi mã OTP tới email của bạn');
    } catch { patch({ aErr: { email: 'Không gửi được email, thử lại sau.' } }); }
  };

  const otpLoginVerify = async (remember = true) => {
    if (!/^\d{6}$/.test(st.aOtp)) { patch({ aErr: { otp: 'Mã gồm 6 chữ số.' } }); return; }
    try {
      const data = await authApi.verifyLoginOtp(st.aEmail.trim(), st.aOtp, remember);
      rememberEmail(st.aEmail.trim());
      if (isProfileIncomplete(data.user)) {
        patch({ aErr: {}, user: data.user, screen: 'profile', profileOnboarding: true, step: 1, aOtp: '', redirectTo: null });
      } else {
        patch({ aErr: {}, user: data.user, screen: st.redirectTo || 'home', step: 1, aOtp: '', redirectTo: null });
      }
      notify('Đăng nhập thành công');
      favApi.syncFavorites();
    } catch (e) { patch({ aErr: { otp: e.message || 'Mã OTP không đúng.' } }); }
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

  const { data: seoPlate } = usePlateDetail(s === 'detail' ? st.curId : null);
  const { data: modalPlate } = usePlateDetail(st.modal ? st.curId : null);
  const { data: seoPost } = useBlogPost(s === 'post' ? st.postId : null);

  // UC07 — modal liên hệ ưu tiên dữ liệu biển thật (GUID từ API), fallback mock st.plates.
  const cur0 = st.plates.find((p) => p.id === st.curId);
  let cur = cur0 ? { ...cur0, title: cur0.prov + cur0.seri + ' · ' + cur0.num, sub: 'Biển ' + String(cur0.vehicle).toLowerCase() + ' · ' + cur0.city + (cur0.hot ? ' · còn 1 số duy nhất' : ''), ref: cur0.prov + cur0.seri + String(cur0.num).replace('.', '') } : null;
  if (!cur && st.modal && modalPlate) {
    const { prov, seri, num } = splitPlateNumber(modalPlate.plateNumber);
    cur = {
      id: modalPlate.id,
      plateNumber: modalPlate.plateNumber,
      prov, seri, num,
      title: modalPlate.plateNumber,
      cat: modalPlate.province || modalPlate.vehicleType || '',
      price: formatPrice(modalPlate.price, modalPlate.priceOnRequest),
      ref: modalPlate.plateNumber.replace(/[^A-Z0-9]/gi, ''),
    };
  }
  useSeo(s, s === 'detail' ? { plate: seoPlate } : s === 'post' ? { post: seoPost } : undefined);
  const isAdminShell = ADMIN_SCREENS.indexOf(s) >= 0;
  const isPublic = PUBLIC_SCREENS.indexOf(s) >= 0;

  // Admin đang đăng nhập (staff/super-admin) không được lạc sang site khách hàng — luôn đưa về Dashboard.
  useEffect(() => {
    if (st.isAdmin && isPublic) go('dash')();
  }, [st.isAdmin, isPublic, go]);

  // Guest: fetch plate data for localStorage favorite ids via the compare endpoint.
  // Logged-in: use favItems returned by the favorites API.
  const guestFavs = !st.user ? getLocalFavorites() : [];
  const { data: guestFavData } = useComparePlates(guestFavs);
  const guestFavItems = guestFavData?.items || [];
  const favCards = st.user
    ? favItems.map((p) => ({
        id: p.id, plateNumber: p.plateNumber, price: p.price, province: p.province,
        thumbnailUrl: p.thumbnailUrl, status: p.status,
        fav: true,
        onFav: () => { toggleFav(p.id); notify('Đã bỏ khỏi yêu thích'); },
        onOpen: () => openPlate(p.id),
        onBuy: () => openBuy(p.id),
      }))
    : guestFavItems.map((p) => ({
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
    ameanings: ['Ý nghĩa phong thủy', 'Mẫu ý nghĩa chung và ý nghĩa riêng cho từng biển'],
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

        <div style={{ maxWidth: '100%', margin: '0 auto', position: 'relative' }}>

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
            {s === 'home' && <Home st={st} patch={patch} go={go} notify={notify} heroAnim={heroAnim} openPlate={openPlate} openBuy={openBuy} favs={st.favs} onFav={toggleFav} contact={contact} />}

            {s === 'list' && <PlateList favs={st.favs} onFav={toggleFav} openPlate={openPlate} openBuy={openBuy} notify={notify} go={go} listNotice={st.listNotice} onClearNotice={() => patch({ listNotice: null })} contact={contact} />}

            {s === 'detail' && <PlateDetail plateId={st.curId} fallbackPlate={cur} favs={st.favs} onFav={toggleFav} go={go} openPlate={openPlate} openPost={openPost} notify={notify} />}

            {(s === 'register' || s === 'login' || s === 'forgot') && (
              <Auth st={st} s={s} patch={patch} go={go} setField={setField} authMeta={authMeta} authSubmit={authSubmit} otpLoginRequest={otpLoginRequest} otpLoginVerify={otpLoginVerify} />
            )}

            {s === 'verify-email' && <VerifyEmail go={go} />}

            {s === 'fav' && <Fav favCards={favCards} user={st.user} onClearAll={clearAllFavs} go={go} notify={notify} contact={contact} />}

            {s === 'lucky' && <LuckyPlate go={go} notify={notify} onNotice={(n) => patch({ listNotice: n })} user={st.user} />}
            {s === 'profile' && <Profile go={go} notify={notify} user={st.user} onboarding={!!st.profileOnboarding} onUserUpdate={(u) => patch({ user: u, profileOnboarding: false })} onLogout={async () => { await authApi.logout(); patch({ user: null, isAdmin: false }); notify(st.lang === 'vi' ? 'Đã đăng xuất' : 'Signed out'); go('home')(); }} />}

            {s === 'about' && <About go={go} />}

            {s === 'chat' && <ChatZaloContact notify={notify} />}

            {s === 'compare' && <Compare go={go} notify={notify} allPlates={st.plates} user={st.user} openPlate={openPlate} />}

            {s === 'saved' && <SavedSearches go={go} notify={notify} />}

            {s === 'reviews' && <Reviews notify={notify} />}

            {s === 'notifications' && <Notifications go={go} notify={notify} />}

            {s === 'collab' && <Collaborator st={st} patch={patch} go={go} notify={notify} />}

            {s === 'terms' && <Terms />}

            {s === 'privacy' && <Privacy />}

            {s === 'transfer' && <TransferGuide go={go} />}

            {s === 'faq' && <Faq go={go} />}

            {s === 'blog' && <Blog st={st} patch={patch} />}

            {s === 'post' && <Post postId={st.postId} go={go} patch={patch} notify={notify} openPlate={openPlate} />}

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

          {isPublic && <Footer settings={st.settings} />}

          {isPublic && <PromoRails />}

          <Suspense fallback={null}>
            <Modals st={st} patch={patch} setForm={setForm} savePlate={savePlate} doDelete={doDelete} cur={cur} submitContact={submitContact} setField={setField} catNames={catNames} />
          </Suspense>

          {isPublic && st.settings?.zalo && !import.meta.env.VITE_FB_PAGE_ID && (
            <a href={`https://zalo.me/${st.settings.zalo.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="Chat Zalo" title="Chat qua Zalo" style={{ position: 'fixed', bottom: 88, right: 20, zIndex: 80, width: 48, height: 48, borderRadius: '50%', background: '#0068FF', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-3)', transition: 'var(--transition-control)', cursor: 'pointer' }}>
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
