import React from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { FileSpreadsheet, FileText, FileDown, CheckCircle2, AlertCircle, X } from 'lucide-react';

/**
 * Modal hiển thị tiến trình tải file Excel (.xlsx), Word (.docx) hoặc CSV
 * với thanh tiến trình % động, dung lượng đã tải và nút Hủy an toàn.
 */
export default function ExportProgressModal({
  open,
  onClose,
  onCancel,
  progress, // { percent, loadedBytes, totalBytes, phase: 'generating' | 'downloading' | 'completed' | 'error', fileName, format, errorMessage }
}) {
  if (!open) return null;

  const {
    percent = 0,
    loadedBytes = 0,
    totalBytes = 0,
    phase = 'generating',
    fileName = 'du-lieu',
    format = 'xlsx',
    errorMessage = null,
  } = progress || {};

  const formatSize = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const getFormatIcon = () => {
    switch (format?.toLowerCase()) {
      case 'xlsx':
      case 'excel':
        return <FileSpreadsheet size={32} style={{ color: '#107c41' }} />;
      case 'docx':
      case 'word':
        return <FileText size={32} style={{ color: '#2b579a' }} />;
      default:
        return <FileDown size={32} style={{ color: 'var(--action-primary)' }} />;
    }
  };

  const getPhaseText = () => {
    if (phase === 'error') return errorMessage || 'Xuất file thất bại';
    if (phase === 'completed') return 'Đã tải xong 100%! Tệp đang được lưu vào máy tính...';
    if (phase === 'downloading') {
      if (totalBytes > 0) {
        return `Đang nhận dữ liệu: ${formatSize(loadedBytes)} / ${formatSize(totalBytes)} (${Math.round(percent)}%)`;
      }
      return `Đang nhận dữ liệu: ${formatSize(loadedBytes)}...`;
    }
    return 'Máy chủ đang truy vấn cơ sở dữ liệu, phân trang và tạo các sheet...';
  };

  const isDone = phase === 'completed';
  const isError = phase === 'error';

  return (
    <Modal
      open={open}
      onClose={isDone || isError ? onClose : () => {}}
      title="Tiến độ xuất dữ liệu"
      maxWidth="480px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2) 0' }}>
        {/* Header với icon và tên file */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-sunken)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isDone ? (
              <CheckCircle2 size={32} style={{ color: '#3FBF8F' }} />
            ) : isError ? (
              <AlertCircle size={32} style={{ color: 'var(--status-danger, #e11d48)' }} />
            ) : (
              getFormatIcon()
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                font: 'var(--type-label)',
                fontWeight: 'var(--fw-bold, 700)',
                color: 'var(--text-strong)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={fileName}
            >
              {fileName}
            </div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 2 }}>
              {format.toUpperCase()} Document • Phân trang & chia sheet tự động
            </div>
          </div>
        </div>

        {/* Thanh tiến trình % */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', font: 'var(--type-caption)' }}>
            <span style={{ color: isError ? 'var(--status-danger)' : isDone ? '#3FBF8F' : 'var(--text-body)', fontWeight: 500 }}>
              {getPhaseText()}
            </span>
            <span style={{ fontWeight: 'var(--fw-bold, 700)', color: 'var(--text-strong)', fontSize: '13px' }}>
              {isError ? 'Lỗi' : `${Math.round(percent)}%`}
            </span>
          </div>

          {/* Progress Bar Container */}
          <div
            style={{
              width: '100%',
              height: 10,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--grey-100, #f1f5f9)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(3, Math.min(100, percent))}%`,
                borderRadius: 'var(--radius-pill)',
                background: isError
                  ? 'var(--status-danger, #e11d48)'
                  : isDone
                  ? 'linear-gradient(90deg, #3FBF8F, #10b981)'
                  : 'linear-gradient(90deg, #F19720, #C75B00)',
                transition: 'width 200ms ease-out, background 300ms ease',
              }}
            />
          </div>
        </div>

        {/* Thông tin mẹo */}
        {!isDone && !isError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              font: 'var(--type-caption)',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            File xuất được hệ thống tự động gom nhóm và chia thành các Sheet theo phiên (Tuần này, Tháng này, Quá khứ) kèm sheet Tổng quan và giá mẫu tham chiếu.
          </div>
        )}

        {/* Footer buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          {!isDone && !isError && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Hủy tải xuống
            </Button>
          )}
          {(isDone || isError) && (
            <Button variant="primary" size="sm" onClick={onClose}>
              Đóng
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
