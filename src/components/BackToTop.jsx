import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

// Nút cuộn về đầu trang — hiện khi cuộn quá 400px. Tôn prefers-reduced-motion (cuộn tức thì).
// Đặt góc dưới-trái, tránh chồng FAB Zalo/AiChatbot (dưới-phải).
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <button
      type="button"
      className="back-to-top"
      aria-label="Cuộn về đầu trang"
      onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}
      style={{
        position: 'fixed', left: 20, bottom: 88, zIndex: 70,
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--surface-inverse)', color: 'var(--white)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-3)',
        transition: 'var(--transition-control)',
      }}
    >
      <ArrowUp size={20} />
    </button>
  );
}
