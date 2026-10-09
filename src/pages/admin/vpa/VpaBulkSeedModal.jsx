import { useState, useRef } from 'react';
import { Sparkles, Check, CheckCircle2, TriangleAlert, RefreshCw } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import { Badge } from '../../../components/index.jsx';
import { useFixVpaIntegrity, useApproveVpaSuggested } from '../../../services/adminVpa.js';

export function getVpaPlateIssues(p) {
  const issues = [];
  if (!p.plateTypeId && !p.plateTypeName) {
    issues.push({ code: 'missing_type', label: 'Chưa phân loại biển số', severity: 'error' });
  }
  if (!p.provinceId && !p.provinceName) {
    issues.push({ code: 'missing_province', label: 'Chưa nhận diện tỉnh/thành', severity: 'error' });
  }
  if (!p.approvedPrice || p.approvedPrice <= 0) {
    issues.push({ code: 'missing_price', label: 'Chưa duyệt giá bán (đang để giá liên hệ)', severity: 'warn' });
  }
  if (p.priceState === 1) {
    issues.push({ code: 'pending_price', label: 'Đang chờ duyệt giá gợi ý', severity: 'warn' });
  } else if (p.priceState === 4) {
    issues.push({ code: 'drift_price', label: 'Giá gợi ý đã thay đổi, cần duyệt lại', severity: 'warn' });
  }
  if (p.suggestedPrice > 0 && p.approvedPrice > 0 && Math.abs(p.approvedPrice - p.suggestedPrice) > p.suggestedPrice * 0.1) {
    const pct = Math.round(Math.abs(p.approvedPrice - p.suggestedPrice) / p.suggestedPrice * 100);
    const moneyStr = `${new Intl.NumberFormat('vi-VN').format(p.suggestedPrice)}đ`;
    issues.push({
      code: 'price_deviation',
      label: `Lệch ${pct}% so với giá gợi ý VPA (${moneyStr})`,
      severity: 'warn',
    });
  }
  if (p.tab === 2 && !p.auctionEndAt) {
    issues.push({ code: 'missing_end_time', label: 'Biển đấu giá tuần chưa có giờ kết thúc', severity: 'warn' });
  }
  return issues;
}

export default function VpaBulkSeedModal({
  open,
  onClose,
  plates = [],
  notify,
  onSuccess,
}) {
  const fix = useFixVpaIntegrity();
  const approve = useApproveVpaSuggested();

  // Danh sách các biển trong danh sách hiện tại đang có vấn đề/thiếu thông tin
  const problemPlates = plates.filter((p) => {
    const issues = getVpaPlateIssues(p);
    return issues.length > 0;
  });

  const [selectedIds, setSelectedIds] = useState(() => new Set(problemPlates.map((p) => p.id)));
  const [options, setOptions] = useState({
    classifyType: true,
    detectProvince: true,
    formatNumber: true,
    approveSuggestedPrice: true,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total, stepLabel }
  const cancelRef = useRef(false);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(problemPlates.map((p) => p.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleStart = async () => {
    const targetIds = [...selectedIds];
    if (targetIds.length === 0) {
      notify?.('Vui lòng chọn ít nhất 1 biển số để sinh thông tin.');
      return;
    }

    cancelRef.current = false;
    setIsRunning(true);
    setProgress({ done: 0, total: 100, stepLabel: 'Đang khởi tạo…' });

    let fixedCount = 0;
    try {
      // 1. Nhận diện loại biển & Chữ ký phong thủy
      if (options.classifyType && !cancelRef.current) {
        setProgress({ done: 10, total: 100, stepLabel: 'Đang nhận diện Loại biển & Chữ ký phong thủy…' });
        try {
          const r = await fix.mutateAsync({ code: 'no_type', ids: targetIds });
          fixedCount += (r.fixed || 0);
        } catch (e) {
          console.warn('Fix no_type error:', e);
        }
      }

      // 2. Nhận diện Tỉnh/thành từ đầu số
      if (options.detectProvince && !cancelRef.current) {
        setProgress({ done: 35, total: 100, stepLabel: 'Đang nhận diện Tỉnh/thành từ đầu số biển…' });
        try {
          const r = await fix.mutateAsync({ code: 'no_province', ids: targetIds });
          fixedCount += (r.fixed || 0);
        } catch (e) {
          console.warn('Fix no_province error:', e);
        }
      }

      // 3. Chuẩn hóa định dạng số biển
      if (options.formatNumber && !cancelRef.current) {
        setProgress({ done: 60, total: 100, stepLabel: 'Đang chuẩn hóa định dạng số hiển thị…' });
        try {
          const r = await fix.mutateAsync({ code: 'bad_number', ids: targetIds });
          fixedCount += (r.fixed || 0);
        } catch (e) {
          console.warn('Fix bad_number error:', e);
        }
      }

      // 4. Áp giá duyệt tự động theo giá gợi ý
      if (options.approveSuggestedPrice && !cancelRef.current) {
        setProgress({ done: 85, total: 100, stepLabel: 'Đang duyệt giá gợi ý cho các biển đủ điều kiện…' });
        const eligiblePriceIds = plates
          .filter((p) => selectedIds.has(p.id) && (p.priceState === 1 || p.priceState === 4 || !p.approvedPrice) && p.suggestedPrice > 0)
          .map((p) => p.id);
        if (eligiblePriceIds.length > 0) {
          try {
            const r = await approve.mutateAsync(eligiblePriceIds);
            fixedCount += (r.affected || 0);
          } catch (e) {
            console.warn('Approve suggested price error:', e);
          }
        }
      }

      setProgress({ done: 100, total: 100, stepLabel: 'Hoàn tất!' });
      notify?.(`Đã hoàn tất sinh thông tin hàng loạt cho ${targetIds.length} biển VPA!`);
      onSuccess?.();
      setTimeout(() => {
        setIsRunning(false);
        setProgress(null);
        onClose();
      }, 700);
    } catch (err) {
      notify?.(err.message || 'Có lỗi xảy ra trong quá trình sinh thông tin.');
      setIsRunning(false);
      setProgress(null);
    }
  };

  const handleClose = () => {
    if (isRunning) {
      cancelRef.current = true;
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Sinh thông tin hàng loạt — Biển số VPA" maxWidth="600px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ margin: 0, font: 'var(--type-body-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Hệ thống sẽ tự động đối chiếu cơ sở dữ liệu để chuẩn hóa và bổ sung toàn bộ các trường thông tin còn thiếu cho danh sách biển số VPA: nhận diện <b>Loại biển</b>, gán <b>Tỉnh/thành</b>, phân tích <b>Chữ ký phong thủy</b> và <b>Duyệt giá gợi ý</b>.
        </p>

        {/* Tùy chọn tác vụ */}
        <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
            Các tác vụ tự động thực hiện:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-2)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', cursor: 'pointer', color: 'var(--text-body)' }}>
              <input
                type="checkbox"
                checked={options.classifyType}
                onChange={(e) => setOptions((x) => ({ ...x, classifyType: e.target.checked }))}
                disabled={isRunning}
                style={{ accentColor: 'var(--action-primary)', width: 16, height: 16 }}
              />
              <span>🏷️ Nhận diện Loại biển & Phong thủy</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', cursor: 'pointer', color: 'var(--text-body)' }}>
              <input
                type="checkbox"
                checked={options.detectProvince}
                onChange={(e) => setOptions((x) => ({ ...x, detectProvince: e.target.checked }))}
                disabled={isRunning}
                style={{ accentColor: 'var(--action-primary)', width: 16, height: 16 }}
              />
              <span>📍 Nhận diện Tỉnh/thành từ đầu số</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', cursor: 'pointer', color: 'var(--text-body)' }}>
              <input
                type="checkbox"
                checked={options.formatNumber}
                onChange={(e) => setOptions((x) => ({ ...x, formatNumber: e.target.checked }))}
                disabled={isRunning}
                style={{ accentColor: 'var(--action-primary)', width: 16, height: 16 }}
              />
              <span>🔢 Chuẩn hóa định dạng số biển</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', cursor: 'pointer', color: 'var(--text-body)' }}>
              <input
                type="checkbox"
                checked={options.approveSuggestedPrice}
                onChange={(e) => setOptions((x) => ({ ...x, approveSuggestedPrice: e.target.checked }))}
                disabled={isRunning}
                style={{ accentColor: 'var(--action-primary)', width: 16, height: 16 }}
              />
              <span>💰 Áp giá duyệt theo Giá gợi ý</span>
            </label>
          </div>
        </div>

        {/* Thanh tiến trình khi đang chạy */}
        {progress && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--surface-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--action-primary)' }}>
                {progress.stepLabel}
              </span>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                {progress.done}%
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--grey-200)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress.done}%`,
                  background: 'var(--action-primary)',
                  transition: 'width 200ms ease-out',
                }}
              />
            </div>
          </div>
        )}

        {/* Danh sách các biển phát hiện có vấn đề */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>
              Danh sách biển cần xử lý ({problemPlates.length} biển)
            </span>
            {!isRunning && problemPlates.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  Đã chọn {selectedIds.size}/{problemPlates.length}
                </span>
                <button
                  type="button"
                  onClick={selectAll}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)', padding: 0 }}
                >
                  Chọn tất cả
                </button>
                <span style={{ color: 'var(--grey-300)' }}>|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--type-caption)', color: 'var(--link)', padding: 0 }}
                >
                  Bỏ chọn
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              maxHeight: 250,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--grey-200)',
              background: 'var(--surface-sunken)',
            }}
          >
            {problemPlates.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--status-success-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle2 size={18} color="var(--status-success)" />
                <span style={{ font: 'var(--type-body-sm)' }}>Tất cả các biển trong trang hiện tại đã đầy đủ thông tin chuẩn!</span>
              </div>
            ) : (
              problemPlates.map((p) => {
                const issues = getVpaPlateIssues(p);
                const isSelected = selectedIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => !isRunning && toggleSelect(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      background: 'var(--white)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: isRunning ? 'default' : 'pointer',
                      border: isSelected ? '1px solid var(--action-primary)' : '1px solid var(--grey-100)',
                      opacity: isSelected ? 1 : 0.5,
                      transition: 'all 120ms ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      disabled={isRunning}
                      style={{ accentColor: 'var(--action-primary)', width: 15, height: 15, cursor: 'pointer' }}
                    />
                    <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)', minWidth: 90 }}>
                      {p.plateNumber}
                    </span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                      {issues.map((iss) => (
                        <span
                          key={iss.code}
                          style={{
                            fontSize: '11px',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-pill)',
                            background: iss.severity === 'error' ? 'var(--status-danger-bg)' : 'var(--status-warning-bg)',
                            color: iss.severity === 'error' ? 'var(--status-danger)' : 'var(--status-warning-ink)',
                          }}
                        >
                          {iss.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <Button variant="ghost" size="md" onClick={handleClose} disabled={isRunning}>
            {isRunning ? 'Hủy' : 'Đóng'}
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={isRunning || selectedIds.size === 0}
            onClick={handleStart}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={15} />
            <span>Sinh thông tin cho {selectedIds.size} biển</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
