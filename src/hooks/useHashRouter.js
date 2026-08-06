import { useEffect } from 'react';
import { parseRoute, routeFor } from '../config/routes.js';

export function useHashRouter(st, patch) {
  useEffect(() => {
    const onHash = () => {
      const r = parseRoute(window.location.hash);
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
