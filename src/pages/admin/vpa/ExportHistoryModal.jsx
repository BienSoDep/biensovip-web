import { useState } from 'react';
import {
  Download, Trash2, FileSpreadsheet, FileText, FileCode,
  Clock, AlertCircle, RefreshCw, CheckCircle2, ShieldCheck,
  Calendar, Database, HardDrive, User, ArrowDownToLine, Loader2
} from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Button from '../../../components/Button.jsx';
import Pagination from '../../../components/Pagination.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import { useVpaExportHistory, useDeleteVpaExportHistory } from '../../../services/adminVpa.js';
import { loadAuth } from '../../../lib/authStore.js';

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ExportHistoryModal({ open, onClose }) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isFetching, refetch } = useVpaExportHistory(
    { page, limit },
    { enabled: !!open }
  );
  const deleteMutation = useDeleteVpaExportHistory();
  const [downloadingId, setDownloadingId] = useState(null);

  if (!open) return null;

  const items = data?.items || [];
  const total = data?.total || 0;

  const handleDownload = async (item) => {
    setDownloadingId(item.id);
    try {
      const auth = loadAuth();
      const token = auth?.accessToken;
      const downloadUrl = `${import.meta.env.VITE_API_URL || ''}/api/admin/vpa/plates/export/history/${item.id}/download`;

      const res = await fetch(downloadUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`Tải file thất bại (mã ${res.status})`);
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', item.fileName || 'bienso-export.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch (err) {
      alert(err.message || 'Lỗi khi tải file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Bạn có chắc muốn xóa file "${item.fileName}" khỏi máy chủ không?`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(item.id);
      refetch();
    } catch (err) {
      alert('Không thể xóa file: ' + (err.message || 'Lỗi'));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Lịch sử xuất file (Lưu trữ 30 ngày)" maxWidth="760px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Banner lưu ý 30 ngày */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '12px 14px',
            background: 'rgba(2, 132, 199, 0.06)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            borderRadius: 8,
          }}
        >
          <Clock size={18} style={{ color: '#0284c7', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, lineHeight: '20px', color: 'var(--text-normal)' }}>
            <span style={{ fontWeight: 700, color: '#0369a1' }}>Chính sách lưu trữ file xuất: </span>
            Toàn bộ file xuất dữ liệu (Excel, Word, CSV) được hệ thống tự động lưu trữ độc lập trong <strong>30 ngày</strong>.
            Quản trị viên có thể tải lại file bất kỳ lúc nào mà không cần tạo lại tiến trình xuất ngầm. File sẽ tự động được xóa an toàn sau khi hết hạn.
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            title="Làm mới danh sách"
            style={{ padding: 6, flexShrink: 0 }}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </Button>
        </div>

        {/* Nội dung danh sách */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton height={60} />
            <Skeleton height={60} />
            <Skeleton height={60} />
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface-sunken)',
              borderRadius: 8,
              border: '1px dashed var(--border-subtle)',
            }}
          >
            <Database size={36} style={{ color: 'var(--text-muted)' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>
              Chưa có file xuất nào trong lịch sử 30 ngày
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 420 }}>
              Khi bạn xuất dữ liệu biển số ra Excel, Word hoặc CSV, file sau khi hoàn tất sẽ tự động xuất hiện tại đây để bạn tải lại khi cần.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item) => {
              const ext = (item.format || 'xlsx').toLowerCase();
              let Icon = FileSpreadsheet;
              let iconColor = '#107c41';
              let formatBadge = 'Excel (.xlsx)';
              if (ext === 'docx') {
                Icon = FileText;
                iconColor = '#2b579a';
                formatBadge = 'Word (.docx)';
              } else if (ext === 'csv') {
                Icon = FileCode;
                iconColor = '#c2410c';
                formatBadge = 'CSV (.csv)';
              }

              const isDownloading = downloadingId === item.id;
              const daysLeft = item.daysRemaining != null ? item.daysRemaining : 30;
              const isUrgentExpiry = daysLeft <= 3;

              let scopeLabel = 'Kho gộp (VPA & Sẵn)';
              let scopeColor = '#0284c7';
              let scopeBg = 'rgba(2, 132, 199, 0.08)';
              if (item.scope === 'vpa') {
                scopeLabel = 'Riêng VPA';
                scopeColor = '#d97706';
                scopeBg = 'rgba(217, 119, 6, 0.08)';
              } else if (item.scope === 'available') {
                scopeLabel = 'Biển có sẵn';
                scopeColor = '#16a34a';
                scopeBg = 'rgba(22, 163, 74, 0.08)';
              }

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-raised, #ffffff)',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {/* Cột trái: Icon & Thông tin file */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: `${iconColor}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={22} style={{ color: iconColor }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--text-strong)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={item.fileName}
                        >
                          {item.fileName}
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: scopeBg,
                            color: scopeColor,
                          }}
                        >
                          {scopeLabel}
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: isUrgentExpiry ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                            color: isUrgentExpiry ? '#ef4444' : 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title={`Hết hạn lưu trữ vào ${new Date(item.expiresAt).toLocaleDateString('vi-VN')}`}
                        >
                          <Clock size={11} />
                          <span>Còn {daysLeft} ngày</span>
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>
                          <strong>{Number(item.totalPlates || 0).toLocaleString('vi-VN')}</strong> biển số
                        </span>
                        <span>•</span>
                        <span>{formatBytes(item.fileSizeBytes)}</span>
                        <span>•</span>
                        <span>
                          {new Date(item.createdAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                        {item.createdBy && (
                          <>
                            <span>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <User size={12} />
                              {item.createdBy}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Thao tác */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={isDownloading}
                      onClick={() => handleDownload(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600,
                        background: '#107c41',
                        borderColor: '#107c41',
                      }}
                    >
                      {isDownloading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <ArrowDownToLine size={13} />
                      )}
                      <span>{isDownloading ? 'Đang tải…' : 'Tải về'}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Xóa vĩnh viễn file này khỏi bộ nhớ lưu trữ"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(item)}
                      style={{
                        padding: '6px 8px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Trash2 size={14} style={{ color: '#ef4444' }} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Phân trang */}
        {total > limit && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <Pagination
              currentPage={page}
              totalItems={total}
              pageSize={limit}
              onPageChange={setPage}
            />
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-subtle)', gap: 8 }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose?.();
              window.location.href = '/admin/lich-su-tai-xuong';
            }}
          >
            Mở trang quản lý Lịch sử tải xuống →
          </Button>
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
