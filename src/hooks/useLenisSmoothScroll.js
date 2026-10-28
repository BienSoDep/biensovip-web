import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * useLenisSmoothScroll
 * Tích hợp công nghệ cuộn mượt (Inertial Smooth Scrolling) tương tự trang giaimamanhai.vercel.app:
 * - Khởi tạo Lenis với easing mũ tự nhiên
 * - Đồng bộ nhịp với GSAP Ticker & ScrollTrigger
 * - Tự động nhận diện 'prefers-reduced-motion: reduce'
 * - Cung cấp khả năng điều khiển cuộn thông qua window.lenis
 */
export function useLenisSmoothScroll({ enabled = true } = {}) {
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    // Trợ năng: nếu người dùng bật giảm chuyển động thì dùng cuộn native
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.25,
      wheelMultiplier: 0.95,
      autoResize: true,
    });

    window.lenis = lenis;

    // 1. Đồng bộ sự kiện cuộn Lenis với GSAP ScrollTrigger
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // 2. Tận dụng GSAP Ticker để điều phối nhịp rAF chính xác
    const tickerUpdate = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(500, 33);

    return () => {
      gsap.ticker.remove(tickerUpdate);
      lenis.destroy();
      window.lenis = null;
    };
  }, [enabled]);
}

