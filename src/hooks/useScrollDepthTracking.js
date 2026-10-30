import { useEffect, useRef } from 'react';
import { ADMIN_SCREENS } from '../config/routes.js';
import { trackScrollDepth } from '../services/tracking/events.js';
import { updateScrollDepth } from '../services/tracking/providers/biensovipDbProvider.js';

const MILESTONES = [25, 50, 75, 100];

// Gắn 1 lần ở App.jsx (layout chung) — throttled scroll listener.
// Tối ưu hóa: Debounce 300ms để khi người dùng lướt nhanh từ đỉnh xuống đáy, hệ thống chỉ gửi
// mốc cuộn cao nhất thay vì spam 8 request POST liên tiếp gây nghẽn socket mạng của trình duyệt.
export function useScrollDepthTracking(screen) {
  const reachedRef = useRef(new Set());
  const tickingRef = useRef(false);
  const debounceTimerRef = useRef(null);

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

        let highestNewMilestone = null;
        for (const milestone of MILESTONES) {
          if (pct >= milestone && !reachedRef.current.has(milestone)) {
            reachedRef.current.add(milestone);
            highestNewMilestone = milestone;
          }
        }

        if (highestNewMilestone !== null) {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            trackScrollDepth(highestNewMilestone, null);
            updateScrollDepth(highestNewMilestone);
          }, 300);
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      window.removeEventListener('scroll', onScroll);
    };
  }, [screen]);
}
