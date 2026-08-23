import { useEffect, useRef } from 'react';
import { parseRoute, routeFor } from '../config/routes.js';
import { isComposeDirty, resetComposeDirty } from '../lib/unsavedGuard.js';

export function useHashRouter(st, patch) {
  const screenRef = useRef(st.screen);
  screenRef.current = st.screen;

  useEffect(() => {
    const onHash = () => {
      const r = parseRoute(window.location.hash);
      // Route-guard: rời màn Compose (back/forward) khi dirty → xác nhận, hủy thì quay lại.
      if (screenRef.current === 'compose' && r.screen !== 'compose' && isComposeDirty()) {
        if (!window.confirm('Bạn có thay đổi chưa lưu. Rời đi sẽ mất những thay đổi này?')) {
          window.location.hash = routeFor('compose');
          return;
        }
        resetComposeDirty();
      }
      patch((x) => ({ ...x, screen: r.screen, curId: r.detailId || x.curId, postId: r.postId || x.postId }));
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scr = st.screen;
    const target = scr === 'detail' ? routeFor('detail', st.curId) : scr === 'post' ? routeFor('post', st.postId) : routeFor(scr);
    if (window.location.hash !== target) window.location.hash = target;
  }, [st.screen, st.curId, st.postId]);
}
