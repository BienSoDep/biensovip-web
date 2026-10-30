import { useState, useMemo, useEffect } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Trash2,
  FileSpreadsheet,
  FileText,
  FileCode,
  Clock,
  RefreshCw,
  Database,
  HardDrive,
  User,
  Search,
  Plus,
  Loader2,
  CheckCircle2,
  Ban,
  Filter,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Badge } from '../../components/index.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import ExportOptionModal from './vpa/ExportOptionModal.jsx';
import {
  useVpaExportHistory,
  useDeleteVpaExportHistory,
  useVpaStats,
} from '../../services/adminVpa.js';
import { useVpaCounts } from '../../services/vpa.js';
import { useShopPlateSummary } from '../../services/plates.js';
import { apiClient } from '../../services/apiClient.js';
import { loadAuth } from '../../lib/authStore.js';
import {
  getActiveExportJobs,
  subscribeExportJobs,
  registerExportJob,
  unregisterExportJob,
} from '../../lib/runWatcher.js';

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFormatMeta(rawFormat) {
  const ext = String(rawFormat || 'xlsx').toLowerCase();
  if (ext === 'docx') {
    return {
      ext: 'docx',
      label: 'Word (.docx)',
      shortLabel: 'DOCX',
      tone: 'blue',
      Icon: FileText,
      iconColor: '#2b579a',
    };
  }
  if (ext === 'csv') {
    return {
      ext: 'csv',
      label: 'CSV (.csv)',
      shortLabel: 'CSV',
      tone: 'amber',
      Icon: FileCode,
      iconColor: '#c2410c',
    };
  }
  return {
    ext: 'xlsx',
    label: 'Excel (.xlsx)',
    shortLabel: 'XLSX',
    tone: 'mint',
    Icon: FileSpreadsheet,
    iconColor: '#107c41',
  };
}

function getScopeMeta(rawScope) {
  const s = String(rawScope || 'all').toLowerCase();
  if (s === 'vpa') {
    return { label: 'Riêng VPA', tone: 'amber' };
  }
  if (s === 'available' || s === 'shop') {
    return { label: 'Biển có sẵn', tone: 'mint' };
  }
  return { label: 'Kho gộp (VPA & Sẵn)', tone: 'blue' };
}

export default function AdminExportHistory({ notify }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('ALL');
  const [scopeFilter, setScopeFilter] = useState('ALL');
  const [downloadingId, setDownloadingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [startingExport, setStartingExport] = useState(false);

  const { data, isLoading, isFetching, refetch } = useVpaExportHistory({ page, limit });
  const deleteMutation = useDeleteVpaExportHistory();

  // Counts for "Xuất file mới" modal
  const { data: vpaStats } = useVpaStats(true);
  const { data: vpaCounts } = useVpaCounts();
  const { data: shopCounts } = useShopPlateSummary();

  const totalVpa = vpaCounts?.all || vpaStats?.totalCount || 0;
  const approvedVpa = vpaStats?.approvedCount || 0;
  const totalShop = shopCounts?.total || 0;
  const availableShop = shopCounts?.available || 0;

  // Track active background export jobs right on this page
  const [activeJobIds, setActiveJobIds] = useState(() => getActiveExportJobs());
  useEffect(() => subscribeExportJobs(setActiveJobIds), []);

  const activeJobQueries = useQueries({
    queries: activeJobIds.map((jobId) => ({
      queryKey: ['admin-vpa', 'export-job', jobId],
      queryFn: () => apiClient.get(`/api/admin/vpa/plates/export/jobs/${jobId}`),
      refetchInterval: (q) => (q.state.data?.status === 'running' ? 1200 : false),
      retry: false,
    })),
  });

  // When a running job finishes, refresh the export history list automatically
  useEffect(() => {
    const hasCompleted = activeJobQueries.some((q) => q.data?.status === 'completed');
    if (hasCompleted) {
      refetch();
    }
  }, [activeJobQueries.map((q) => q.data?.status).join(','), refetch]);

  const rawItems = data?.items || [];
  const totalCount = data?.total || 0;

  // Client-side filtering by search, format, and scope on the fetched page
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rawItems.filter((item) => {
      const ext = String(item.format || 'xlsx').toLowerCase();
      const scope = String(item.scope || 'all').toLowerCase();

      if (formatFilter !== 'ALL' && ext !== formatFilter) return false;
      if (scopeFilter !== 'ALL' && scope !== scopeFilter) return false;

      if (!q) return true;
      const nameMatch = String(item.fileName || '').toLowerCase().includes(q);
      const authorMatch = String(item.createdBy || '').toLowerCase().includes(q);
      return nameMatch || authorMatch;
    });
  }, [rawItems, searchQuery, formatFilter, scopeFilter]);

  // Summary KPIs from loaded history
  const kpiStats = useMemo(() => {
    let totalBytes = 0;
    let totalPlatesExported = 0;
    let xlsxCount = 0;
    let docxCount = 0;
    let csvCount = 0;

    for (const item of rawItems) {
      totalBytes += Number(item.fileSizeBytes || 0);
      totalPlatesExported += Number(item.totalPlates || 0);
      const ext = String(item.format || 'xlsx').toLowerCase();
      if (ext === 'docx') docxCount += 1;
      else if (ext === 'csv') csvCount += 1;
      else xlsxCount += 1;
    }

    return {
      totalBytes,
      totalPlatesExported,
      xlsxCount,
      docxCount,
      csvCount,
    };
  }, [rawItems]);

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
      toast.success(`Đang tải xuống ${item.fileName}`);
    } catch (err) {
      const msg = err.message || 'Lỗi khi tải file';
      toast.error(msg);
      notify?.(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Đã xóa file "${deleteTarget.fileName}"`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error('Không thể xóa file: ' + (err.message || 'Lỗi'));
    }
  };

  const handleExportChoice = async (options) => {
    const targetFormat = options?.format || 'xlsx';
    const targetScope = options?.scope || 'all';
    const sources = options?.sources;
    const vehicle = options?.vehicle;
    const provinceId = options?.provinceId;
    const priceState = options?.priceState;

    try {
      setStartingExport(true);
      const params = {
        format: targetFormat,
        scope: targetScope,
      };
      if (sources && sources.length > 0) {
        params.sources = Array.isArray(sources) ? sources.join(',') : sources;
      }
      if (vehicle !== undefined && vehicle !== null && vehicle !== '') {
        params.vehicle = vehicle;
      }
      if (provinceId) {
        params.provinceId = provinceId;
      }
      if (options?.provinceIds && options.provinceIds.length > 0) {
        params.provinceIds = Array.isArray(options.provinceIds)
          ? options.provinceIds.join(',')
          : options.provinceIds;
      }
      if (priceState !== undefined && priceState !== null && priceState !== '') {
        params.priceState = priceState;
      }
      if (options?.isCurrentPageOnly) {
        params.page = options.page || 1;
        params.limit = options.pageSize || 50;
      }

      const res = await apiClient.post('/api/admin/vpa/plates/export/jobs', null, { params });
      const jobId = res?.jobId || res?.data?.jobId;
      if (jobId) {
        registerExportJob(jobId);
        toast.success('Đã khởi chạy tiến trình xuất file ngầm!');
      }
    } catch (err) {
      toast.error('Không thể khởi chạy xuất file: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setStartingExport(false);
    }
  };

  const handleCancelActiveJob = async (jobId) => {
    try {
      await apiClient.post(`/api/admin/vpa/plates/export/jobs/${jobId}/cancel`);
      unregisterExportJob(jobId);
      qc.invalidateQueries({ queryKey: ['admin-vpa', 'export-job', jobId] });
      toast('Đã hủy tiến trình xuất file');
    } catch {
      unregisterExportJob(jobId);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        paddingBottom: 'var(--space-10)',
        animation: 'pageIn 180ms var(--ease-out)',
      }}
    >
      <style>{`
        .bsv-export-history-grid {
          display: grid;
          grid-template-columns: minmax(260px, 1.6fr) minmax(140px, 0.7fr) minmax(150px, 0.8fr) minmax(160px, 0.85fr) minmax(120px, 0.6fr) auto;
          align-items: center;
          gap: var(--space-3);
          padding: 13px var(--gutter-card);
        }
        @media (max-width: 1180px) {
          .bsv-export-history-grid {
            grid-template-columns: 1fr auto;
          }
        }
        @media (max-width: 720px) {
          .bsv-export-history-grid {
            grid-template-columns: 1fr;
          }
        }
        .bsv-export-row:hover {
          background: var(--surface-sunken) !important;
        }
      `}</style>

      {/* 1. KPI SUMMARY STRIP (4 Architectural Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            background: 'var(--white)',
            boxShadow: 'var(--shadow-inset-hairline)',
            padding: 'var(--gutter-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontWeight: 600 }}>
              TỔNG FILE LƯU TRỮ (30 NGÀY)
            </span>
            <Database size={15} color="var(--brand-600)" />
          </div>
          <div
            style={{
              font: 'var(--type-display-3)',
              color: 'var(--text-strong)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {totalCount} <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>file</span>
          </div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-subtle)' }}>
            Tự động dọn dẹp sau 30 ngày kể từ lúc xuất
          </div>
        </div>

        <div
          style={{
            background: 'var(--white)',
            boxShadow: 'var(--shadow-inset-hairline)',
            padding: 'var(--gutter-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontWeight: 600 }}>
              DUNG LƯỢNG TRANG HIỆN TẠI
            </span>
            <HardDrive size={15} color="var(--brand-600)" />
          </div>
          <div
            style={{
              font: 'var(--type-display-3)',
              color: 'var(--text-strong)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatBytes(kpiStats.totalBytes)}
          </div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-subtle)' }}>
            Lưu trữ độc lập trên ổ cứng máy chủ
          </div>
        </div>

        <div
          style={{
            background: 'var(--white)',
            boxShadow: 'var(--shadow-inset-hairline)',
            padding: 'var(--gutter-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontWeight: 600 }}>
              TỔNG BIỂN SỐ ĐÃ KẾT XUẤT
            </span>
            <FileSpreadsheet size={15} color="var(--status-success-ink)" />
          </div>
          <div
            style={{
              font: 'var(--type-display-3)',
              color: 'var(--status-success-ink)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {kpiStats.totalPlatesExported.toLocaleString('vi-VN')}
          </div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-subtle)' }}>
            Cộng dồn trên {rawItems.length} bản ghi gần nhất
          </div>
        </div>

        <div
          style={{
            background: 'var(--white)',
            boxShadow: 'var(--shadow-inset-hairline)',
            padding: 'var(--gutter-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontWeight: 600 }}>
              ĐỊNH DẠNG FILE ĐÃ XUẤT
            </span>
            <Clock size={15} color="var(--brand-600)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
            <Badge tone="mint">Excel: {kpiStats.xlsxCount}</Badge>
            <Badge tone="blue">Word: {kpiStats.docxCount}</Badge>
            <Badge tone="amber">CSV: {kpiStats.csvCount}</Badge>
          </div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-subtle)', marginTop: 'auto' }}>
            Tải lại tức thì không cần chạy lại tiến trình
          </div>
        </div>
      </div>

      {/* 2. ACTIVE BACKGROUND EXPORT JOBS (If any job is currently running) */}
      {activeJobIds.length > 0 && (
        <div
          style={{
            background: 'var(--surface-tint-cream)',
            boxShadow: 'var(--shadow-inset-hairline)',
            borderLeft: '3px solid var(--action-primary)',
            padding: 'var(--space-3) var(--gutter-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
              <Loader2 size={16} color="var(--brand-600)" className="animate-spin" />
              <span>Tiến trình xuất file đang chạy ngầm ({activeJobIds.length})</span>
            </div>
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Tự động thêm vào bảng lịch sử ngay khi đạt 100%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeJobIds.map((jobId, idx) => {
              const jobData = activeJobQueries[idx]?.data;
              const status = jobData?.status || 'running';
              const total = jobData?.totalPlates || 0;
              const done = jobData?.processedPlates || 0;
              const pct = total > 0 ? Math.min(100, Math.round((done * 100) / total)) : 0;

              return (
                <div
                  key={jobId}
                  style={{
                    background: 'var(--white)',
                    boxShadow: 'var(--shadow-inset-hairline)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ font: 'var(--type-body-sm)', color: 'var(--text-strong)' }}>
                        {jobData?.fileName || `Đang khởi tạo file ${(jobData?.format || 'xlsx').toUpperCase()}...`}
                      </strong>
                      <Badge tone={status === 'completed' ? 'mint' : 'amber'}>
                        {status === 'completed' ? 'Hoàn tất 100%' : `${pct}%`}
                      </Badge>
                    </div>
                    <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      Đã xử lý {done.toLocaleString('vi-VN')} / {total.toLocaleString('vi-VN')} biển số
                    </div>
                    <div style={{ height: '4px', background: 'var(--grey-100)', width: '100%', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: status === 'completed' ? 'var(--status-success)' : 'var(--action-primary)',
                          transition: 'width 200ms linear',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {status === 'running' ? (
                      <Button variant="outline" size="sm" onClick={() => handleCancelActiveJob(jobId)}>
                        <Ban size={13} color="var(--status-danger)" />
                        Hủy
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => unregisterExportJob(jobId)}>
                        <CheckCircle2 size={13} color="var(--status-success-ink)" />
                        Ẩn thông báo
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MAIN TABLE CARD: FILTER BAR + TABULAR DOWNLOAD HISTORY */}
      <div
        style={{
          background: 'var(--white)',
          boxShadow: 'var(--shadow-inset-hairline)',
        }}
      >
        {/* Toolbar: Search + Filters + Actions */}
        <div
          style={{
            padding: 'var(--gutter-card)',
            boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên file hoặc email người xuất..."
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 12px 0 36px',
                  border: '1px solid var(--border-default)',
                  background: 'var(--surface-sunken)',
                  font: 'var(--type-body-sm)',
                  color: 'var(--text-strong)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Right Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                Làm mới
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={startingExport}
                onClick={() => setExportModalOpen(true)}
              >
                <Plus size={14} />
                Xuất file mới
              </Button>
            </div>
          </div>

          {/* Filter Pills Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                font: 'var(--type-caption)',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              <Filter size={12} />
              Định dạng:
            </span>
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'xlsx', label: 'Excel (.xlsx)' },
              { key: 'docx', label: 'Word (.docx)' },
              { key: 'csv', label: 'CSV (.csv)' },
            ].map((f) => {
              const active = formatFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFormatFilter(f.key)}
                  style={{
                    padding: '4px 10px',
                    font: 'var(--type-caption)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: active ? 'var(--action-dark)' : 'var(--surface-sunken)',
                    color: active ? 'var(--white)' : 'var(--text-body)',
                    boxShadow: active ? 'none' : 'var(--shadow-inset-hairline)',
                    border: 'none',
                  }}
                >
                  {f.label}
                </button>
              );
            })}

            <div
              style={{
                width: '1px',
                height: '16px',
                background: 'var(--border-default)',
                margin: '0 4px',
              }}
            />

            <span style={{ font: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-muted)' }}>
              Nguồn kho:
            </span>
            {[
              { key: 'ALL', label: 'Tất cả nguồn' },
              { key: 'all', label: 'Kho gộp (VPA & Sẵn)' },
              { key: 'vpa', label: 'Riêng VPA' },
              { key: 'available', label: 'Biển có sẵn' },
            ].map((sc) => {
              const active = scopeFilter === sc.key;
              return (
                <button
                  key={sc.key}
                  type="button"
                  onClick={() => setScopeFilter(sc.key)}
                  style={{
                    padding: '4px 10px',
                    font: 'var(--type-caption)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: active ? 'var(--action-primary)' : 'var(--surface-sunken)',
                    color: active ? 'var(--white)' : 'var(--text-body)',
                    boxShadow: active ? 'none' : 'var(--shadow-inset-hairline)',
                    border: 'none',
                  }}
                >
                  {sc.label}
                </button>
              );
            })}

            <span
              style={{
                marginLeft: 'auto',
                font: 'var(--type-caption)',
                color: 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Hiển thị <strong style={{ color: 'var(--text-strong)' }}>{filteredItems.length}</strong> / {totalCount} file
            </span>
          </div>
        </div>

        {/* Table Column Headers */}
        <div
          className="bsv-export-history-grid"
          style={{
            background: 'var(--grey-50)',
            borderBottom: '1px solid var(--grey-200)',
            paddingTop: '9px',
            paddingBottom: '9px',
            font: 'var(--type-caption)',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <div>Tên file & Định dạng</div>
          <div>Phạm vi kho</div>
          <div>Số biển & Dung lượng</div>
          <div>Người tạo & Thời gian</div>
          <div>Thời hạn lưu trữ</div>
          <div style={{ textAlign: 'right' }}>Thao tác</div>
        </div>

        {/* Table Rows */}
        {isLoading ? (
          <div style={{ padding: 'var(--gutter-card)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Skeleton height={56} />
            <Skeleton height={56} />
            <Skeleton height={56} />
            <Skeleton height={56} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-9) var(--gutter-card)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Database size={32} color="var(--text-subtle)" />
            <div style={{ font: 'var(--type-title-3)', color: 'var(--text-strong)' }}>
              Chưa có file tải xuống nào khớp bộ lọc
            </div>
            <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', maxWidth: '460px' }}>
              Khi bạn xuất dữ liệu biển số ra Excel (.xlsx), Word (.docx) hoặc CSV (.csv), file hoàn tất sẽ được lưu trữ tự động tại đây trong 30 ngày để bạn tải về bất cứ lúc nào.
            </div>
            <div style={{ marginTop: '8px' }}>
              <Button variant="primary" size="sm" onClick={() => setExportModalOpen(true)}>
                <Plus size={14} />
                Tạo lượt xuất file mới
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {filteredItems.map((item, idx) => {
              const fmt = getFormatMeta(item.format);
              const scp = getScopeMeta(item.scope);
              const isDownloading = downloadingId === item.id;
              const daysLeft = item.daysRemaining != null ? item.daysRemaining : 30;
              const isUrgent = daysLeft <= 3;
              const FileIcon = fmt.Icon;

              return (
                <div
                  key={item.id}
                  className="bsv-export-history-grid bsv-export-row"
                  style={{
                    borderTop: idx === 0 ? 'none' : '1px solid var(--grey-100)',
                    background: 'var(--white)',
                    transition: 'background 120ms var(--ease-out)',
                  }}
                >
                  {/* Col 1: File Name & Format Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        background: 'var(--surface-sunken)',
                        boxShadow: 'var(--shadow-inset-hairline)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileIcon size={20} color={fmt.iconColor} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          font: 'var(--type-body-sm)',
                          fontWeight: 700,
                          color: 'var(--text-strong)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.fileName}
                      >
                        {item.fileName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <Badge tone={fmt.tone}>{fmt.label}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Scope */}
                  <div>
                    <Badge tone={scp.tone}>{scp.label}</Badge>
                  </div>

                  {/* Col 3: Total Plates & File Size */}
                  <div style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <div style={{ font: 'var(--type-body-sm)', fontWeight: 700, color: 'var(--text-strong)' }}>
                      {Number(item.totalPlates || 0).toLocaleString('vi-VN')} biển số
                    </div>
                    <div
                      style={{
                        font: 'var(--type-caption)',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {formatBytes(item.fileSizeBytes)}
                    </div>
                  </div>

                  {/* Col 4: Creator & CreatedAt */}
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        font: 'var(--type-body-sm)',
                        color: 'var(--text-body)',
                        fontWeight: 500,
                      }}
                    >
                      <User size={12} color="var(--text-muted)" />
                      <span>{item.createdBy || 'Quản trị viên'}</span>
                    </div>
                    <div
                      style={{
                        font: 'var(--type-caption)',
                        color: 'var(--text-muted)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {new Date(item.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* Col 5: Retention / Expiry */}
                  <div>
                    <Badge tone={isUrgent ? 'rose' : 'neutral'}>
                      <Clock size={11} />
                      <span>Còn {daysLeft} ngày</span>
                    </Badge>
                    {item.expiresAt && (
                      <div
                        style={{
                          font: 'var(--type-caption)',
                          color: 'var(--text-subtle)',
                          marginTop: '3px',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        Hết hạn: {new Date(item.expiresAt).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>

                  {/* Col 6: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isDownloading}
                      onClick={() => handleDownload(item)}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Đang tải...
                        </>
                      ) : (
                        <>
                          <Download size={13} />
                          Tải về
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => setDeleteTarget(item)}
                      title="Xóa file khỏi máy chủ"
                    >
                      <Trash2 size={13} color="var(--status-danger)" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Pagination */}
        {totalCount > limit && (
          <div
            style={{
              padding: 'var(--space-3) var(--gutter-card)',
              borderTop: '1px solid var(--border-hairline)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
              Tổng cộng <strong>{totalCount}</strong> file trong lịch sử 30 ngày
            </span>
            <Pagination page={page} perPage={limit} total={totalCount} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xóa file khỏi lịch sử lưu trữ"
        maxWidth="420px"
      >
        <p style={{ margin: '0 0 var(--space-4)', font: 'var(--type-body-sm)', color: 'var(--text-body)' }}>
          Bạn có chắc chắn muốn xóa vĩnh viễn file{' '}
          <strong style={{ color: 'var(--text-strong)' }}>{deleteTarget?.fileName}</strong> khỏi máy chủ không?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={deleteMutation.isPending}
            onClick={handleConfirmDelete}
          >
            Xác nhận xóa
          </Button>
        </div>
      </Modal>

      {/* Export Option Modal (Trigger a new export directly from this page) */}
      <ExportOptionModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExportChoice}
        onOpenHistory={() => setExportModalOpen(false)}
        totalCount={totalVpa + totalShop}
        counts={{
          all: totalVpa + totalShop,
          vpa: totalVpa,
          available: approvedVpa + availableShop,
          shop: totalShop,
        }}
      />
    </div>
  );
}
