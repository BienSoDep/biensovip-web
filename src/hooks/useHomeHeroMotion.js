import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * useHomeHeroMotion — GSAP & ScrollTrigger Orchestration Hook
 * Kết hợp kinh nghiệm từ giaimamanhai.vercel.app & chuẩn /ui-ux-pro-max:
 * 1. Hero Entrance Timeline & Number Count-Up
 * 2. Idle Floating & 3D Tilt Micro-interactions
 * 3. Hero Parallax Scroll Scrubbing (yPercent: 12 khi lăn chuột)
 * 4. Top Scroll Progress Indicator (Thanh tiến trình cuộn trang ở đỉnh)
 * 5. ScrollTrigger Stagger Reveal cho tất cả các Section khi lăn chuột tới viewport
 * 6. Tự động tôn trọng prefers-reduced-motion và dọn dẹp sạch bằng gsap.context()
 */
export function useHomeHeroMotion({ totalPlates, dataDeps = [] } = {}) {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const visualCardRef = useRef(null);
  const searchBarRef = useRef(null);
  const statCountRef = useRef(null);

  // 1. Master Entrance & ScrollTrigger Animations
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Trợ năng: nếu người dùng bật reduced-motion thì bỏ qua animation
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context((self) => {
      const scope = containerRef.current;
      const visualEl = visualCardRef.current;

      // ========================================================
      // A. HERO ENTRANCE TIMELINE
      // ========================================================
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

      // 7. Khối visual hình ảnh bên phải
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

      // Micro-interaction: Idle Floating cho card ảnh biển số
      const floatTween = gsap.to('.hero-visual-card', {
        y: -8,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.8,
      });

      // Micro-interaction: Ambient glow pulse dịu nhẹ
      gsap.to('.hero-ambient-glow', {
        scale: 1.15,
        opacity: 0.6,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Micro-interaction: 3D Tilt khi di chuột lên khối visual
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

      // ========================================================
      // B. SCROLLTRIGGER & SCROLL MOTION (Theo phong cách giaimamanhai)
      // ========================================================

      // 1. Thanh tiến trình cuộn trang ở đỉnh (Top Scroll Progress Bar)
      const progressBar = scope.querySelector('.home-scroll-progress');
      if (progressBar) {
        gsap.to(progressBar, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: scope,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.2,
          },
        });
      }

      // 2. Parallax Scrub cho ảnh Hero khi cuộn
      if (visualEl && heroRef.current) {
        gsap.to(visualEl, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      // 3. Email Subscription Banner reveal
      const emailBanner = scope.querySelector('.home-email-banner');
      if (emailBanner) {
        gsap.from(emailBanner, {
          y: 28,
          autoAlpha: 0,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: emailBanner,
            start: 'top 88%',
          },
        });
      }

      // 4. Featured Plates Section Reveal
      const featHead = scope.querySelector('.home-featured-head');
      if (featHead) {
        gsap.from(featHead, {
          y: 28,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: featHead,
            start: 'top 85%',
          },
        });
      }

      const featCards = scope.querySelectorAll('.home-featured-card');
      if (featCards.length) {
        gsap.from(featCards, {
          y: 36,
          autoAlpha: 0,
          stagger: 0.07,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: featCards[0].parentElement || featHead,
            start: 'top 85%',
          },
        });
      }

      // 5. Thematic Plate Types Collections Reveal
      const thematicHead = scope.querySelector('.home-thematic-head');
      if (thematicHead) {
        gsap.from(thematicHead, {
          y: 28,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: thematicHead,
            start: 'top 85%',
          },
        });
      }

      const thematicCards = scope.querySelectorAll('.home-thematic-card');
      if (thematicCards.length) {
        gsap.from(thematicCards, {
          y: 32,
          autoAlpha: 0,
          stagger: 0.05,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: thematicCards[0].parentElement || thematicHead,
            start: 'top 85%',
          },
        });
      }

      // 6. Sold Marquee Section Reveal
      const soldSec = scope.querySelector('.sold-marquee-section');
      if (soldSec) {
        const soldHead = soldSec.querySelector('.sold-marquee-head');
        if (soldHead) {
          gsap.from(soldHead, {
            y: 28,
            autoAlpha: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: soldSec,
              start: 'top 85%',
            },
          });
        }
        const soldTrack = soldSec.querySelector('.sold-marquee');
        if (soldTrack) {
          gsap.from(soldTrack, {
            scale: 0.95,
            autoAlpha: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: soldTrack,
              start: 'top 90%',
            },
          });
        }
      }

      // 7. Video Section Reveal
      const videoSec = scope.querySelector('.home-video-section');
      if (videoSec) {
        const videoHead = videoSec.querySelector('.home-video-head');
        if (videoHead) {
          gsap.from(videoHead, {
            y: 28,
            autoAlpha: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: videoSec,
              start: 'top 85%',
            },
          });
        }
        const videoItems = videoSec.querySelectorAll('.home-video-item');
        if (videoItems.length) {
          gsap.from(videoItems, {
            y: 32,
            autoAlpha: 0,
            stagger: 0.09,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: videoSec,
              start: 'top 80%',
            },
          });
        }
      }

      // 8. Contact Section Reveal
      const contactSec = scope.querySelector('.home-contact-section');
      if (contactSec) {
        const contactHead = contactSec.querySelector('.home-contact-head');
        if (contactHead) {
          gsap.from(contactHead, {
            y: 28,
            autoAlpha: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: contactSec,
              start: 'top 85%',
            },
          });
        }
        const contactGrid = contactSec.querySelector('.home-contact-grid');
        if (contactGrid) {
          gsap.from(contactGrid.children, {
            y: 32,
            autoAlpha: 0,
            stagger: 0.1,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: contactGrid,
              start: 'top 80%',
            },
          });
        }
      }

      // 9. Guide Section Reveal
      const guideSec = scope.querySelector('.home-guide-section');
      if (guideSec) {
        const guideCard = guideSec.querySelector('.home-guide-card');
        if (guideCard) {
          gsap.from(guideCard, {
            scale: 0.95,
            y: 28,
            autoAlpha: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: guideSec,
              start: 'top 85%',
            },
          });
        }
      }
    }, containerRef);

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

  // 3. Tự động tính toán lại vị trí ScrollTrigger khi dữ liệu async tải xong
  const depsKey = dataDeps.join('-');
  useEffect(() => {
    const t = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);
    return () => clearTimeout(t);
  }, [depsKey]);

  return {
    containerRef,
    heroRef,
    visualCardRef,
    searchBarRef,
    statCountRef,
  };
}
