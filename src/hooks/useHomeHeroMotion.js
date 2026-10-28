import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * useHomeHeroMotion — GSAP Orchestration Hook for Biensovip Home Landing Page
 * Tuân thủ tiêu chuẩn /ui-ux-pro-max:
 * - Staggered entrance timeline cho hero content, CTA, live feed & stats
 * - Đếm số động (Count-up) cho thống kê tổng số biển
 * - Hiệu ứng thở / trôi nổi (Idle Floating) và 3D Tilt tương tác trên card ảnh thương hiệu
 * - Entrance cho thanh tìm kiếm nổi & các pill danh mục
 * - Tự động phát hiện và tôn trọng 'prefers-reduced-motion: reduce'
 * - Lifecycle cleanup an toàn qua gsap.context()
 */
export function useHomeHeroMotion({ totalPlates } = {}) {
  const heroRef = useRef(null);
  const visualCardRef = useRef(null);
  const searchBarRef = useRef(null);
  const statCountRef = useRef(null);
  const featuredGridRef = useRef(null);

  // 1. Master Entrance & Idle Animations
  useEffect(() => {
    if (typeof window === 'undefined' || !heroRef.current) return;

    // Trợ năng: nếu người dùng bật reduced-motion thì bỏ qua entrance timeline
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context((self) => {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        delay: 0.08,
      });

      // 1. Eyebrow badge
      tl.from('.hero-eyebrow', {
        opacity: 0,
        y: -14,
        scale: 0.94,
        duration: 0.45,
      });

      // 2. Tiêu đề chính (Stagger 2 dòng tiêu đề)
      tl.from(
        '.hero-title-line',
        {
          opacity: 0,
          y: 28,
          duration: 0.65,
          stagger: 0.12,
          ease: 'power3.out',
        },
        '-=0.25'
      );

      // 3. Đoạn mô tả
      tl.from(
        '.hero-desc',
        {
          opacity: 0,
          y: 16,
          duration: 0.5,
        },
        '-=0.35'
      );

      // 4. Các nút CTA
      tl.from(
        '.hero-cta-btn',
        {
          opacity: 0,
          y: 14,
          scale: 0.95,
          duration: 0.45,
          stagger: 0.08,
          ease: 'back.out(1.4)',
        },
        '-=0.3'
      );

      // 5. Ticker hoạt động thực tế (Live feed)
      tl.from(
        '.hero-feed-pill',
        {
          opacity: 0,
          x: -16,
          duration: 0.45,
        },
        '-=0.25'
      );

      // 6. Dãy số liệu thống kê (Stats row)
      tl.from(
        '.hero-stat-item',
        {
          opacity: 0,
          y: 18,
          duration: 0.45,
          stagger: 0.08,
        },
        '-=0.25'
      );

      // 7. Khối visual hình ảnh bên phải (Card + Ambient Glow)
      tl.from(
        '.hero-visual-card',
        {
          opacity: 0,
          scale: 0.92,
          y: 26,
          duration: 0.8,
          ease: 'power3.out',
        },
        '-=0.65'
      );

      // 8. Thanh tìm kiếm nổi (Search bar dock)
      if (searchBarRef.current) {
        tl.from(
          searchBarRef.current,
          {
            opacity: 0,
            y: 24,
            scale: 0.98,
            duration: 0.55,
            ease: 'back.out(1.2)',
          },
          '-=0.2'
        );

        tl.from(
          '.home-search-cats > *',
          {
            opacity: 0,
            scale: 0.92,
            duration: 0.3,
            stagger: 0.02,
            ease: 'power1.out',
          },
          '-=0.3'
        );
      }

      // Micro-interaction 1: Idle Floating (Thở nhẹ nhàng cho card ảnh biển số)
      const floatTween = gsap.to('.hero-visual-card', {
        y: -8,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.8,
      });

      // Micro-interaction 2: Ambient glow pulse dịu nhẹ
      gsap.to('.hero-ambient-glow', {
        scale: 1.15,
        opacity: 0.6,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Micro-interaction 3: 3D Tilt khi di chuột lên khối visual
      const visualEl = visualCardRef.current;
      if (visualEl) {
        let isHovered = false;

        const onPointerEnter = () => {
          isHovered = true;
          floatTween.pause();
        };

        const onPointerMove = (e) => {
          const rect = visualEl.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;

          gsap.to(visualEl, {
            rotateY: x * 12,
            rotateX: -y * 12,
            transformPerspective: 800,
            duration: 0.3,
            ease: 'power1.out',
            overwrite: 'auto',
          });
        };

        const onPointerLeave = () => {
          isHovered = false;
          gsap.to(visualEl, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: 'auto',
            onComplete: () => {
              if (!isHovered) floatTween.resume();
            },
          });
        };

        visualEl.addEventListener('pointerenter', onPointerEnter);
        visualEl.addEventListener('pointermove', onPointerMove);
        visualEl.addEventListener('pointerleave', onPointerLeave);

        self.add(() => {
          visualEl.removeEventListener('pointerenter', onPointerEnter);
          visualEl.removeEventListener('pointermove', onPointerMove);
          visualEl.removeEventListener('pointerleave', onPointerLeave);
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // 2. Count-Up Animation cho số lượng biển số
  useEffect(() => {
    if (typeof window === 'undefined' || !statCountRef.current) return;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const targetVal = totalPlates && totalPlates >= 395 ? totalPlates : 395;

    if (prefersReducedMotion) {
      statCountRef.current.textContent = targetVal.toLocaleString('vi-VN');
      return;
    }

    const counter = { val: 0 };
    const tween = gsap.to(counter, {
      val: targetVal,
      duration: 1.4,
      ease: 'power2.out',
      delay: 0.3,
      onUpdate: () => {
        if (statCountRef.current) {
          statCountRef.current.textContent = Math.round(counter.val).toLocaleString('vi-VN');
        }
      },
    });

    return () => tween.kill();
  }, [totalPlates]);

  return {
    heroRef,
    visualCardRef,
    searchBarRef,
    statCountRef,
    featuredGridRef,
  };
}
