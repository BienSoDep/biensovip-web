import { useEffect, useRef } from 'react';
import { parseRoute, routeFor, ADMIN_SCREENS } from '../config/routes.js';
import { isComposeDirty, resetComposeDirty } from '../lib/unsavedGuard.js';
import { trackPageView, closeSessionBeacon } from '../services/tracking/providers/biensovipDbProvider.js';

let currentHistoryIdx = (typeof window !== 'undefined' && window.history.state?.bsdIdx) ?? 0;
if (typeof window !== 'undefined' && typeof window.history.state?.bsdIdx !== 'number') {
  try {
    window.history.replaceState({ ...window.history.state, bsdIdx: 0 }, '');
  } catch {
    /* ignore */
  }
}

export function usePathRouter(st, patch) {
  const screenRef = useRef(st.screen);
  screenRef.current = st.screen;

  // Đóng phiên khi tab đóng/ẩn đột ngột — sendBeacon không bị hủy giữa chừng khi trang unload.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && !ADMIN_SCREENS.includes(screenRef.current)) {
        closeSessionBeacon(screenRef.current);
      }
    };
    window.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPop = (e) => {
      // state=null (không có bsdIdx) nghĩa là 1 nơi khác tự pushState thủ công (link nội bộ dispatch
      // popstate giả, không qua go()/patch()) — coi là điều hướng TIẾN, không phải back, để không bị
      // hiểu nhầm thành back-nav rồi khôi phục scroll cũ thay vì cuộn lên đầu trang mới.
      const rawIdx = e?.state?.bsdIdx ?? window.history.state?.bsdIdx;
      const newIdx = rawIdx ?? currentHistoryIdx + 1;
      window.__bsdIsBackNav = rawIdx != null && newIdx < currentHistoryIdx;
      currentHistoryIdx = newIdx;

      const r = parseRoute(window.location.pathname);
      // Route-guard: rời màn Compose (back/forward) khi dirty → xác nhận, hủy thì quay lại.
      if (screenRef.current === 'compose' && r.screen !== 'compose' && isComposeDirty()) {
        if (!window.confirm('Bạn có thay đổi chưa lưu. Rời đi sẽ mất những thay đổi này?')) {
          history.pushState({ bsdIdx: currentHistoryIdx }, '', routeFor('compose'));
          return;
        }
        resetComposeDirty();
      }
      patch((x) => ({ ...x, screen: r.screen, curId: r.detailId || x.curId, postId: r.postId || x.postId, provinceCode: r.provinceCode || x.provinceCode, typeSlug: r.typeSlug || x.typeSlug }));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scr = st.screen;
    const target = scr === 'detail' ? routeFor('detail', st.curId) : scr === 'post' ? routeFor('post', st.postId) : scr === 'provinceLanding' ? routeFor('provinceLanding', st.provinceCode) : scr === 'plateTypeLanding' ? routeFor('plateTypeLanding', st.typeSlug) : routeFor(scr);
    if (window.location.pathname !== target) {
      currentHistoryIdx += 1;
      try {
        window.history.pushState({ ...window.history.state, bsdIdx: currentHistoryIdx }, '', target + window.location.search);
      } catch {
        window.history.pushState(null, '', target + window.location.search);
      }
      window.__bsdIsBackNav = false;
    }

    window.__bsdCurrentScreen = scr;
    if (!ADMIN_SCREENS.includes(scr)) trackPageView(scr, target + window.location.search);
  }, [st.screen, st.curId, st.postId, st.provinceCode, st.typeSlug]);
}
