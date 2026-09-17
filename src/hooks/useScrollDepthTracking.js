import { useEffect, useRef } from 'react';
import { ADMIN_SCREENS } from '../config/routes.js';
import { trackScrollDepth } from '../services/tracking/events.js';
import { updateScrollDepth } from '../services/tracking/providers/biensovipDbProvider.js';

const MILESTONES = [25, 50, 75, 100];

// Gắn 1 lần ở App.jsx (layout chung) — throttled scroll listener, bắn mốc 25/50/75/100% mỗi khi đổi
// screen. Bỏ qua /admin/* theo đúng rule "không tracking trong khu vực admin".
export function useScrollDepthTracking(screen) {
  const reachedRef = useRef(new Set());
  const tickingRef = useRef(false);

  useEffect(() => {
    reachedRef.current = new Set();
    if (ADMIN_SCREENS.includes(screen)) return undefined;

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        tickingRef.current = false;
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - doc.clientHeight;
        const pct = scrollable <= 0 ? 100 : Math.min(100, Math.round((doc.scrollTop / scrollable) * 100));

        for (const milestone of MILESTONES) {
          if (pct >= milestone && !reachedRef.current.has(milestone)) {
            reachedRef.current.add(milestone);
            trackScrollDepth(milestone, null);
          }
        }
        updateScrollDepth(pct);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [screen]);
}
