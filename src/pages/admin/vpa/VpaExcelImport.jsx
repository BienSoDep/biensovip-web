import { useRef, useState } from 'react';
import Button from '../../../components/Button.jsx';
import { useImportVpaExcel, downloadVpaTemplate } from '../../../services/adminVpa.js';

const CARD = { background: 'var(--white)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-inset-hairline)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' };
const MAX_BYTES = 5 * 1024 * 1024;

// Import Excel dự phòng khi VPA chặn/đổi cấu trúc: tải mẫu → điền → tải lên. Dòng lỗi được liệt kê, không dừng cả file.
export default function VpaExcelImport({ notify }) {
  const input = useRef(null);
  const [result, setResult] = useState(null);
  const importMut = useImportVpaExcel();

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx')) return notify?.('Chỉ nhận file .xlsx');
    if (file.size > MAX_BYTES) return notify?.('File tối đa 5 MB');
    try {
      const r = await importMut.mutateAsync(file);
      setResult(r);
      notify?.(`Đã nhập ${r.inserted} biển mới, cập nhật ${r.updated}${r.errorCount ? `, ${r.errorCount} dòng lỗi` : ''}`);
    } catch (err) {
      setResult(null);
      notify?.(err.message || 'Import thất bại');
    }
  };

  return (
    <div style={CARD}>
      <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Import Excel dự phòng</span>
      <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
        Dùng khi VPA chặn hoặc đổi cấu trúc. Cột bắt buộc: Biển số, Loại xe; tùy chọn: Tỉnh (mã VPA), Giá khởi điểm, Tab (Tháng/Tuần/Hết hạn), Giờ bắt đầu, Giờ kết thúc, Hạn đăng ký
        (giờ Việt Nam). Tối đa 20.000 dòng / 5 MB. Giá đã duyệt và dữ liệu crawl không bị ghi đè.
      </span>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Button variant="outline" size="md" onClick={() => downloadVpaTemplate().catch((e) => notify?.(e.message))}>Tải file mẫu</Button>
        <Button variant="primary" size="md" loading={importMut.isPending} onClick={() => input.current?.click()}>Chọn file .xlsx để nhập</Button>
        <input ref={input} type="file" accept=".xlsx" onChange={onPick} style={{ display: 'none' }} />
      </div>
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
            {result.totalRows} dòng · mới {result.inserted} · cập nhật {result.updated} · đổi tab {result.tabChanged} · lỗi {result.errorCount}
          </span>
          {result.errorCount > 0 && (
            <div style={{ maxHeight: 220, overflowY: 'auto', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', padding: 'var(--space-2) var(--space-3)' }}>
              {result.errors.map((e) => (
                <div key={e.row} style={{ font: 'var(--type-caption)', color: 'var(--status-danger)' }}>Dòng {e.row}: {e.message}</div>
              ))}
              {result.errorCount > result.errors.length && (
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>… và {result.errorCount - result.errors.length} dòng lỗi khác</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
