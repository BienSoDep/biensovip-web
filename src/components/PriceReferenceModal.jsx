import Modal from './Modal.jsx';
import Skeleton from './Skeleton.jsx';
import Button from './Button.jsx';
import { formatDate } from '../lib/date.js';

const fmt = (n) => (n == null ? '—' : n.toLocaleString('vi-VN') + 'đ');

// UC49 — minh bạch nguồn giá gợi ý VPA. `data` = kết quả từ useVpaPlatePriceReference/usePlatePriceReference
// (VpaPriceReferenceDto): { usedOwnStartingPrice, ownStartingPrice, items[] }. `onOpenPlate(plateNumber)` tùy chọn —
// gọi khi bấm vào 1 dòng tham chiếu (vd điều hướng sang trang Biển VPA, lọc đúng biển đó).
export default function PriceReferenceModal({ open, onClose, data, isLoading, onOpenPlate }) {
  const items = data?.items || [];
  return (
    <Modal open={open} onClose={onClose} title="Nguồn tính giá gợi ý VPA" maxWidth="520px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {isLoading && <Skeleton variant="table" rows={3} />}
        {!isLoading && items.length > 0 && (
          <>
            <p style={{ margin: 0, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Trung bình giá trúng của {items.length} kết quả đấu giá trùng đuôi số (cùng tỉnh, cùng loại xe) × hệ số.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', maxHeight: 320, overflowY: 'auto' }}>
              {items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={onOpenPlate && it.vpaPlateId ? () => onOpenPlate(it.plateNumber) : undefined}
                  disabled={!onOpenPlate || !it.vpaPlateId}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--grey-100)',
                    background: 'var(--white)', textAlign: 'left',
                    cursor: onOpenPlate && it.vpaPlateId ? 'pointer' : 'default',
                  }}
                >
                  <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)' }}>{it.plateNumber}</span>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--action-primary)' }}>{fmt(it.auctionPrice)}</span>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{formatDate(it.auctionStartAt)}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {!isLoading && items.length === 0 && data?.usedOwnStartingPrice && (
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Chưa có kết quả đấu giá nào trùng đuôi số biển này — giá gợi ý lấy từ <strong>giá khởi điểm của chính biển</strong> ({fmt(data.ownStartingPrice)}) × hệ số.
          </p>
        )}
        {!isLoading && items.length === 0 && !data?.usedOwnStartingPrice && (
          <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            Chưa có dữ liệu để tính giá gợi ý (không có kết quả đấu giá trùng đuôi số, cũng chưa có giá khởi điểm).
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="md" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  );
}
