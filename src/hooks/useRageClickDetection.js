import { useEffect, useRef } from 'react';
import { trackRageClick } from '../services/tracking/events.js';

const RAGE_CLICK_COUNT = 3;
const RAGE_CLICK_WINDOW_MS = 700;

function describeTarget(el) {
  if (!el) return 'unknown';
  if (el.id) return `#${el.id}`;
  if (el.className && typeof el.className === 'string') return `.${el.className.split(' ')[0]}`;
  return el.tagName?.toLowerCase() || 'unknown';
}

// Gắn 1 lần ở App.jsx — lắng click ở document (capture), đếm click liên tiếp lên CÙNG 1 phần tử
// trong cửa sổ thời gian ngắn → tín hiệu khách bực bội (nút không phản hồi, UI đứng).
export function useRageClickDetection() {
  const lastTargetRef = useRef(null);
  const countRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const onClick = (e) => {
      const target = e.target;
      const now = Date.now();
      if (target === lastTargetRef.current && now - lastTimeRef.current < RAGE_CLICK_WINDOW_MS) {
        countRef.current += 1;
      } else {
        countRef.current = 1;
        lastTargetRef.current = target;
      }
      lastTimeRef.current = now;

      if (countRef.current === RAGE_CLICK_COUNT) {
        trackRageClick(describeTarget(target));
      }
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);
}
