import { ArrowLeftRight, X } from 'lucide-react';
import Button from './Button.jsx';
import { useCompareIds } from '../services/compareService.js';

// Thanh nổi hiện khi có >=1 biển đang chọn so sánh — trước đây bấm icon "so sánh" trên card chỉ lưu
// localStorage, không có cách nào thấy/vào trang so sánh (bug UX phát hiện qua audit).
export default function CompareBar({ go }) {
  const { ids, clear } = useCompareIds();
  if (ids.length === 0) return null;

  return (
    <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 16, zIndex: 90, width: 'min(92vw, 520px)', background: 'var(--text-strong)', color: 'var(--white)', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-3)', padding: '10px 10px 10px 20px', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', flex: 1 }}>
        Đã chọn {ids.length}/3 biển để so sánh
      </span>
      <button type="button" onClick={clear} aria-label="Bỏ chọn tất cả" style={{ border: 'none', background: 'transparent', color: 'var(--white)', opacity: 0.75, cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={16} />
      </button>
      <Button variant="primary" size="sm" onClick={go('compare')} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
        <ArrowLeftRight size={14} /> Xem so sánh
      </Button>
    </div>
  );
}
