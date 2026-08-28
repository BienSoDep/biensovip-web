import { useEffect, useRef } from 'react';
import { parseRoute, routeFor } from '../config/routes.js';
import { isComposeDirty, resetComposeDirty } from '../lib/unsavedGuard.js';

export function usePathRouter(st, patch) {
  const screenRef = useRef(st.screen);
  screenRef.current = st.screen;

  useEffect(() => {
    const onPop = () => {
      const r = parseRoute(window.location.pathname);
      // Route-guard: rời màn Compose (back/forward) khi dirty → xác nhận, hủy thì quay lại.
      if (screenRef.current === 'compose' && r.screen !== 'compose' && isComposeDirty()) {
        if (!window.confirm('Bạn có thay đổi chưa lưu. Rời đi sẽ mất những thay đổi này?')) {
          history.pushState(null, '', routeFor('compose'));
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
    if (window.location.pathname !== target) history.pushState(null, '', target + window.location.search);
  }, [st.screen, st.curId, st.postId]);
}
