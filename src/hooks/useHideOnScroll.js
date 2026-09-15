import { useEffect, useRef, useState } from 'react';

/**
 * Ẩn tạm phần tử (opacity/translate) trong lúc người dùng đang cuộn — dùng cho FAB (nút nổi cố
 * định) trên mobile, vì `position:fixed` không nhường chỗ cho nội dung bên dưới nó dù cuộn tới
 * đâu. Ẩn lúc đang cuộn để nội dung "tràn" qua được, hiện lại ngay khi cuộn dừng (không phải ẩn
 * vĩnh viễn — vẫn bấm được khi đứng yên đọc).
 */
export function useHideOnScroll(idleDelay = 400) {
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      setHidden(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setHidden(false), idleDelay);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timerRef.current);
    };
  }, [idleDelay]);

  return hidden;
}
