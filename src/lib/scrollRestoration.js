/**
 * Universal Scroll Restoration & Top Scrolling Manager
 */

export function getScrollPosition() {
  if (typeof window === 'undefined') return 0;
  return window.scrollY || document.documentElement?.scrollTop || document.body?.scrollTop || 0;
}

export function scrollToTop(behavior = 'instant') {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, left: 0, behavior });
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
}

export function forceScrollToTop() {
  scrollToTop('instant');
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => scrollToTop('instant'));
  }
  setTimeout(() => scrollToTop('instant'), 50);
  setTimeout(() => scrollToTop('instant'), 150);
  setTimeout(() => scrollToTop('instant'), 300);
}

export function getRouteKey(st) {
  if (!st) return 'home';
  const scr = st.screen || 'home';
  if (scr === 'detail') return `detail:${st.curId || ''}`;
  if (scr === 'post') return `post:${st.postId || ''}`;
  if (scr === 'provinceLanding') return `province:${st.provinceCode || ''}`;
  if (scr === 'plateTypeLanding') return `plateType:${st.typeSlug || ''}`;
  return scr;
}

const SCROLL_PREFIX = 'bsd_scroll_pos_';

export function saveScrollForRoute(routeKey) {
  if (!routeKey || typeof window === 'undefined') return;
  const y = getScrollPosition();
  try {
    sessionStorage.setItem(`${SCROLL_PREFIX}${routeKey}`, String(y));
  } catch {
    /* storage blocked */
  }
}

export function getSavedScrollForRoute(routeKey) {
  if (!routeKey || typeof window === 'undefined') return 0;
  try {
    const val = sessionStorage.getItem(`${SCROLL_PREFIX}${routeKey}`);
    return val ? Number(val) : 0;
  } catch {
    return 0;
  }
}

export function clearSavedScrollForRoute(routeKey) {
  if (!routeKey || typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`${SCROLL_PREFIX}${routeKey}`);
  } catch {
    /* storage blocked */
  }
}

export function restoreScrollPosition(y) {
  if (typeof window === 'undefined' || typeof y !== 'number' || y <= 0) return;
  const apply = () => {
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = y;
    if (document.body) document.body.scrollTop = y;
    if (document.scrollingElement) document.scrollingElement.scrollTop = y;
  };

  apply();
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(apply);
  }
  setTimeout(apply, 50);
  setTimeout(apply, 150);
}
