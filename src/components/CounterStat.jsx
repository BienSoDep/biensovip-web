import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';

// Số đếm tăng dần khi cuộn tới — dùng cho khối số liệu thuyết phục (CTV hoạt động, hoa hồng đã trả...).
// value: số đích. suffix: hậu tố hiển thị (VD "+", "%"). format: có chấm phân cách hàng nghìn hay không.
export default function CounterStat({ value, suffix = '', format = true, duration = 1.4 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString('vi-VN'));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [inView, value, duration, count]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {format ? <motion.span>{rounded}</motion.span> : value}{suffix}
    </span>
  );
}
