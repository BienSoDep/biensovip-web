import { useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  RefreshCw, CheckCircle2, AlertCircle, XCircle, Eye, X,
  Zap, ChevronLeft, ChevronRight
} from 'lucide-react';
import Button from '../../../components/Button.jsx';
import { Input, Select } from '../../../components/index.jsx';
import { useAdminEmailLogs, useRunAllNotificationTriggers } from '../../../services/adminNotificationService.js';
import { formatDateTime } from '../../../lib/date.js';
import { TYPE_LABEL } from './notificationConstants.js';

export default function EmailLogsSection({ notify }) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [debouncedEmail] = useDebouncedValue(emailInput, 400);
  const [selectedLog, setSelectedLog] = useState(null);

  const { data, isLoading, isError, refetch, isFetching } = useAdminEmailLogs({
    page,
    pageSize,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    email: debouncedEmail.trim() || undefined,
  });

  const runAllTriggers = useRunAllNotificationTriggers();

  const handleRunAll = () => {
    if (!window.confirm('Bạn có chắc muốn kích hoạt chạy quét TOÀN BỘ các trigger thông báo tự động (phong thủy, giỏ hàng, welcome...) ngay bây giờ không?')) return;
    runAllTriggers.mutate(undefined, {
      onSuccess: (res) => {
        notify(res?.data?.message || res?.message || 'Đã kích hoạt chạy toàn bộ triggers thành công!');
        refetch();
      },
      onError: (err) => {
        notify(err?.response?.data?.message || err?.message || 'Kích hoạt thất bại');
      },
    });
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Tùy chọn lọc loại email
  const typeOptions = [
    { value: '', label: 'Tất cả loại email' },
    ...Object.entries(TYPE_LABEL).map(([key, label]) => ({
      value: key,
      label: `${label} (${key})`,
    })),
  ];

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'success', label: 'Thành công' },
    { value: 'failed', label: 'Thất bại' },
  ];

  return (
    <div style={{ flex: '1 1 100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--gutter-section)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-inset-hairline)', overflow: 'hidden' }}>
        {/* Header & Actions */}
        <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Nhật ký gửi Email Hệ thống</span>
              <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 'var(--fw-semibold)' }}>
                {total.toLocaleString('vi-VN')} bản ghi
              </span>
            </div>
            <p style={{ margin: '4px 0 0', font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Theo dõi chi tiết mọi email tự động hóa, marketing và thông báo đã được gửi đi từ hệ thống.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Làm mới danh sách logs"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Làm mới
            </Button>
            <Button
              variant="dark"
              size="sm"
              onClick={handleRunAll}
              disabled={runAllTriggers.isPending}
              title="Quét kiểm tra và gửi email cho toàn bộ loại trigger tự động"
            >
              <Zap size={14} className={runAllTriggers.isPending ? 'animate-spin' : ''} />
              {runAllTriggers.isPending ? 'Đang kích hoạt…' : 'Quét tất cả triggers ngay'}
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ padding: 'var(--space-3) var(--gutter-card)', background: 'var(--surface-subtle)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ flex: '1 1 200px', minWidth: 160 }}>
            <Input
              label=""
              placeholder="Tìm theo email người nhận..."
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div style={{ flex: '1 1 220px', minWidth: 180 }}>
            <Select
              label=""
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setPage(1);
              }}
              options={typeOptions}
            />
          </div>
          <div style={{ flex: '0 1 180px', minWidth: 140 }}>
            <Select
              label=""
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={statusOptions}
            />
          </div>
          {(emailInput || typeFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setEmailInput('');
                setTypeFilter('');
                setStatusFilter('');
                setPage(1);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--action-primary)',
                font: 'var(--type-caption)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Logs Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', font: 'var(--type-body-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--surface-sunken)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', color: 'var(--text-muted)', fontSize: 12 }}>
                <th style={{ padding: '10px var(--gutter-card)', fontWeight: 'var(--fw-semibold)' }}>Thời gian</th>
                <th style={{ padding: '10px 12px', fontWeight: 'var(--fw-semibold)' }}>Người nhận</th>
                <th style={{ padding: '10px 12px', fontWeight: 'var(--fw-semibold)' }}>Loại thông báo</th>
                <th style={{ padding: '10px 12px', fontWeight: 'var(--fw-semibold)' }}>Tiêu đề</th>
                <th style={{ padding: '10px 12px', fontWeight: 'var(--fw-semibold)', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ padding: '10px var(--gutter-card)', fontWeight: 'var(--fw-semibold)', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px var(--gutter-card)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Đang tải nhật ký gửi email…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px var(--gutter-card)', textAlign: 'center', color: 'var(--status-danger)' }}>
                    Lỗi tải dữ liệu. <button type="button" onClick={() => refetch()} style={{ color: 'var(--link)', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Thử lại</button>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px var(--gutter-card)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Không tìm thấy nhật ký gửi email nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                items.map((log) => {
                  const isSuccess = log.status === 'success';
                  return (
                    <tr key={log.id} style={{ boxShadow: 'inset 0 -1px 0 var(--grey-100)', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '12px var(--gutter-card)', whiteSpace: 'nowrap', color: 'var(--text-faint)', font: 'var(--type-caption)' }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)' }}>
                        <div>{log.toEmail}</div>
                        {log.userId && <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>ID: {log.userId}</span>}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--surface-sunken)',
                          color: 'var(--text-strong)',
                          fontSize: 11,
                          fontWeight: 'var(--fw-medium)',
                        }}>
                          {TYPE_LABEL[log.type] || log.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }} title={log.subject}>
                        {log.subject || '—'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: 12,
                          fontWeight: 'var(--fw-semibold)',
                          background: isSuccess ? '#F0FAF6' : '#fef2f2',
                          color: isSuccess ? '#2E9970' : '#991b1b',
                        }}>
                          {isSuccess ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {isSuccess ? 'Thành công' : 'Thất bại'}
                        </span>
                      </td>
                      <td style={{ padding: '12px var(--gutter-card)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-hairline)',
                            background: 'var(--white)',
                            color: 'var(--action-primary)',
                            fontSize: 12,
                            fontWeight: 'var(--fw-medium)',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={12} />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div style={{ padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 1px 0 var(--border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Trang {page} / {totalPages} (tổng {total.toLocaleString('vi-VN')} bản ghi)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-hairline)',
                  background: page <= 1 ? 'var(--surface-sunken)' : 'var(--white)',
                  color: page <= 1 ? 'var(--text-faint)' : 'var(--text-strong)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                }}
              >
                <ChevronLeft size={14} /> Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-hairline)',
                  background: page >= totalPages ? 'var(--surface-sunken)' : 'var(--white)',
                  color: page >= totalPages ? 'var(--text-faint)' : 'var(--text-strong)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                }}
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)',
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              maxWidth: 640,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: 'var(--space-4) var(--gutter-card)', boxShadow: 'inset 0 -1px 0 var(--border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>Chi tiết nhật ký gửi email</h3>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>ID: {selectedLog.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 'var(--space-4) var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block' }}>Tiêu đề email</span>
                <span style={{ font: 'var(--type-body-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{selectedLog.subject || '—'}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block' }}>Người nhận</span>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{selectedLog.toEmail}</span>
                </div>
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block' }}>Thời gian gửi</span>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>{formatDateTime(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block' }}>Phân loại</span>
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                    {TYPE_LABEL[selectedLog.type] || selectedLog.type} ({selectedLog.type})
                  </span>
                </div>
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block' }}>Trạng thái</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 12,
                    fontWeight: 'var(--fw-semibold)',
                    background: selectedLog.status === 'success' ? '#F0FAF6' : '#fef2f2',
                    color: selectedLog.status === 'success' ? '#2E9970' : '#991b1b',
                  }}>
                    {selectedLog.status === 'success' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {selectedLog.status === 'success' ? 'Thành công' : 'Thất bại'}
                  </span>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                  <span style={{ font: 'var(--type-caption)', fontWeight: 'var(--fw-bold)', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={14} /> Thông báo lỗi từ Mail Service / SMTP:
                  </span>
                  <pre style={{ margin: '6px 0 0', font: 'var(--type-caption)', color: '#7f1d1d', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                    {selectedLog.errorMessage}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Dữ liệu đính kèm (Metadata):</span>
                  <pre style={{ margin: 0, padding: 'var(--space-3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', fontSize: 12, fontFamily: 'monospace', overflowX: 'auto', color: 'var(--text-strong)' }}>
                    {typeof selectedLog.metadata === 'string' ? selectedLog.metadata : JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: 'var(--space-3) var(--gutter-card)', boxShadow: 'inset 0 1px 0 var(--border-hairline)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
