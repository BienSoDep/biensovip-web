import { useEffect, useRef, useState } from 'react';

/**
 * Ẩn tạm phần tử (opacity/translate) trong lúc người dùng đang cuộn — dùng cho FAB (nút nổi cố
 * định) trên mobile, vì `position:fixed` không nhường chỗ cho nội dung bên dưới nó dù cuộn tới
 * đâu. Ẩn lúc đang cuộn để nội dung "tràn" qua được, hiện lại ngay khi cuộn dừng (không phải ẩn
 * vĩnh viễn — vẫn bấm được khi đứng yên đọc).
 *
 * Lắng ở `document` với capture:true (không phải `window`) để bắt được cả scroll NGANG bên trong
 * container con (VD bảng so sánh `overflow-x:auto`) — scroll event không bubble lên window nhưng
 * vẫn capture được qua ancestor. Thiếu chỗ này thì FAB đứng yên che nội dung khi người dùng vuốt
 * ngang trong bảng dù trang không cuộn dọc.
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
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      clearTimeout(timerRef.current);
    };
  }, [idleDelay]);

  return hidden;
}
