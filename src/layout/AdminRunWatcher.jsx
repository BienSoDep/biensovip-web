import { useEffect, useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Loader2, X, ChevronUp, Download, Ban, FileSpreadsheet, Layers, RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { apiClient } from '../services/apiClient.js';
import { useVpaOverview } from '../services/adminVpa.js';
import { loadAuth } from '../lib/authStore.js';
import { crawlProgressView, VPA_SOURCES } from '../lib/vpaFormat.js';
import ExportHistoryModal from '../pages/admin/vpa/ExportHistoryModal.jsx';
import {
  getActiveApproveRuns,
  subscribeApproveRuns,
  unregisterApproveRun,
  getActiveExportJobs,
  subscribeExportJobs,
  unregisterExportJob,
} from '../lib/runWatcher.js';

// Quản lý trạng thái lượt duyệt giá (approve-run)
function useApproveRunsStatus() {
  const [ids, setIds] = useState(() => getActiveApproveRuns());
  useEffect(() => subscribeApproveRuns(setIds), []);

  const results = useQueries({
    queries: ids.map((runId) => ({
      queryKey: ['admin-vpa', 'approve-run', runId],
      queryFn: () => apiClient.get(`/api/admin/vpa/plates/price/approve-runs/${runId}`),
      refetchInterval: (q) => (q.state.data?.status === 'running' ? 1200 : false),
    })),
  });

  useEffect(() => {
    results.forEach((r, i) => {
      const status = r.data?.status;
      if (status && status !== 'running') {
        // Tự động gỡ sau 10 giây nếu đã kết thúc thành công hoặc hủy
        const timer = setTimeout(() => unregisterApproveRun(ids[i]), 10000);
        return () => clearTimeout(timer);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.map((r) => r.data?.status).join(',')]);

  return ids.map((runId, i) => ({ runId, kind: 'approve', data: results[i]?.data }));
}

// Quản lý trạng thái tiến trình xuất file ngầm (export-job)
function useExportJobsStatus() {
  const [ids, setIds] = useState(() => getActiveExportJobs());
  useEffect(() => subscribeExportJobs(setIds), []);

  const results = useQueries({
    queries: ids.map((jobId) => ({
      queryKey: ['admin-vpa', 'export-job', jobId],
      queryFn: () => apiClient.get(`/api/admin/vpa/plates/export/jobs/${jobId}`),
      refetchInterval: (q) => (q.state.data?.status === 'running' ? 1200 : false),
      retry: false,
    })),
  });

  // Tự động gỡ các jobId bị lỗi 404 (do server khởi động lại) hoặc đã kết thúc
  useEffect(() => {
    results.forEach((r, i) => {
      const jobId = ids[i];
      if (!jobId) return;
      if (r.isError) {
        // Job không còn tồn tại trên server (ví dụ backend restart) -> tự dọn khỏi localStorage sau 1s
        const timer = setTimeout(() => unregisterExportJob(jobId), 1000);
        return () => clearTimeout(timer);
      }
      if (r.data?.status === 'cancelled') {
        const timer = setTimeout(() => unregisterExportJob(jobId), 4000);
        return () => clearTimeout(timer);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.map((r) => `${r.isError}-${r.data?.status}`).join(',')]);

  return ids.map((jobId, i) => ({
    runId: jobId,
    kind: 'export',
    data: results[i]?.data,
    isError: results[i]?.isError,
    error: results[i]?.error,
  }));
}

export default function AdminRunWatcher({ go }) {
  const qc = useQueryClient();
  const approveRuns = useApproveRunsStatus();
  const exportJobs = useExportJobsStatus();
  const { data: overview, refetch: refetchOverview } = useVpaOverview({ poll: true, enabled: true });

  // Nguồn crawl đang chạy từ overview.sources (kèm chi tiết activeRun)
  const activeSources = (overview?.sources || []).filter((s) => s.running);
  const crawlRuns = activeSources.map((s) => ({
    runId: s.activeRun?.id || `crawl-${s.source}`,
    kind: 'crawl',
    source: s.source,
    progress: s.progress,
    data: s.activeRun || { source: s.source },
  }));

  const runningApprove = approveRuns.filter((r) => !r.isError && (!r.data || r.data.status === 'running'));
  const finishedApprove = approveRuns.filter((r) => r.isError || (r.data && r.data.status !== 'running'));

  const runningExport = exportJobs.filter((r) => !r.isError && (!r.data || r.data.status === 'running'));
  const finishedExport = exportJobs.filter((r) => r.isError || (r.data && r.data.status !== 'running'));

  const allItems = [...runningApprove, ...crawlRuns, ...runningExport, ...finishedExport, ...finishedApprove];
  const runningCount = runningApprove.length + crawlRuns.length + runningExport.length;
  const [expanded, setExpanded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (allItems.length === 0) setExpanded(false);
  }, [allItems.length]);

  if (allItems.length === 0 && !historyOpen) return null;

  return (
    <div style={{ position: 'fixed', right: 'var(--space-5, 20px)', bottom: 'var(--space-5, 20px)', zIndex: 9999 }}>
      {expanded ? (
        <div
          style={{
            width: 360,
            maxWidth: '90vw',
            background: 'var(--white, #ffffff)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: '#0f172a',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {runningCount > 0 ? (
                <Loader2 size={16} color="#38bdf8" style={{ animation: 'adminRunWatcherSpin 1s linear infinite' }} />
              ) : (
                <CheckCircle2 size={16} color="#4ade80" />
              )}
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                Tiến trình chạy ngầm ({allItems.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Thu gọn"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                padding: 4,
                borderRadius: 4,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 380, overflowY: 'auto' }}>
            {allItems.map((r) => (
              <RunRow
                key={`${r.kind}-${r.runId}`}
                run={r}
                onRefresh={() => {
                  refetchOverview();
                  qc.invalidateQueries({ queryKey: ['admin-vpa'] });
                }}
              />
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '8px 12px',
              background: '#f8fafc',
              borderTop: '1px solid var(--border-subtle, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => (go ? go('aexporthistory')() : setHistoryOpen(true))}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#0284c7',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Clock size={13} />
              <span>Xem lịch sử file đã xuất (30 ngày)</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          title="Có tiến trình ngầm — bấm để xem chi tiết & hủy/tải file"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 18px',
            borderRadius: 'var(--radius-pill, 9999px)',
            border: 'none',
            background: runningCount > 0 ? '#0f172a' : '#107c41',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'transform 0.15s ease',
          }}
        >
          {runningCount > 0 ? (
            <Loader2 size={16} color="#38bdf8" style={{ animation: 'adminRunWatcherSpin 1s linear infinite' }} />
          ) : (
            <Download size={16} color="#ffffff" />
          )}
          <span>
            {runningCount > 0 ? `${runningCount} tiến trình đang chạy…` : `${allItems.length} tiến trình hoàn tất`}
          </span>
          <ChevronUp size={14} />
        </button>
      )}
      <ExportHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <style>{'@keyframes adminRunWatcherSpin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

function RunRow({ run, onRefresh }) {
  const qc = useQueryClient();
  const { kind, data, source, runId, progress } = run;
  const [cancelling, setCancelling] = useState(false);

  // 1. Phân loại & Tiêu đề
  let label = 'Tiến trình';
  let Icon = RefreshCw;
  let iconColor = '#0284c7';
  if (kind === 'approve') {
    label = 'Duyệt giá VPA';
    Icon = Layers;
    iconColor = '#d97706';
  } else if (kind === 'crawl') {
    const srcId = source || data?.source || '';
    const srcName = VPA_SOURCES.find((s) => s.id === srcId || s.key === String(srcId).toLowerCase())?.label || srcId;
    label = `Cào: ${srcName}`;
    Icon = RefreshCw;
    iconColor = '#2563eb';
  } else if (kind === 'export') {
    label = `Xuất file ${data?.format?.toUpperCase() || 'Excel'}`;
    Icon = FileSpreadsheet;
    iconColor = '#107c41';
  }

  // 2. Tính toán % tiến độ chính xác
  let pct = null;
  let text = 'Đang xử lý…';
  const status = run.isError ? 'error' : (data?.status || 'running');
  const isRunning = !run.isError && status === 'running';

  if (kind === 'approve') {
    const hasTotal = data?.total > 0;
    if (hasTotal) {
      pct = Math.min(100, Math.round(((data.done || 0) * 100) / data.total));
      text = `Đã duyệt ${Number(data.done || 0).toLocaleString('vi-VN')} / ${Number(data.total).toLocaleString('vi-VN')} biển (${pct}%)`;
    } else {
      text = isRunning ? 'Đang duyệt danh sách biển…' : (status === 'error' ? 'Không thể kết nối tiến trình' : 'Đã kết thúc');
    }
  } else if (kind === 'crawl') {
    ({ pct, text } = crawlProgressView(data, progress));
  } else if (kind === 'export') {
    if (run.isError) {
      pct = 0;
      text = 'Tiến trình đã kết thúc hoặc không còn trên máy chủ';
    } else if (status === 'completed') {
      pct = 100;
      text = `Đã xuất ${Number(data?.processedRows || 0).toLocaleString('vi-VN')} biển thành công (100%)`;
    } else if (status === 'cancelled') {
      text = 'Đã hủy bởi quản trị viên';
    } else if (status === 'error') {
      text = `Lỗi: ${data?.error || 'Không thể tạo file'}`;
    } else {
      pct = data?.percent != null ? data.percent : (data?.totalRows > 0 ? Math.min(100, Math.round(((data.processedRows || 0) * 100) / data.totalRows)) : 1);
      text = data?.totalRows > 0
        ? `Đã xử lý ${Number(data.processedRows || 0).toLocaleString('vi-VN')} / ${Number(data.totalRows).toLocaleString('vi-VN')} (${pct}%)`
        : `Đang khởi tạo file ${data?.format?.toUpperCase() || ''}… (${pct}%)`;
    }
  }

  // 3. Xử lý Hủy tiến trình
  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn dừng / hủy tiến trình này không?')) return;
    setCancelling(true);
    try {
      if (kind === 'approve') {
        try {
          await apiClient.post(`/api/admin/vpa/plates/price/approve-runs/${runId}/cancel`);
        } catch { /* ignored */ }
        unregisterApproveRun(runId);
        qc.invalidateQueries({ queryKey: ['admin-vpa', 'approve-run', runId] });
      } else if (kind === 'crawl') {
        const src = source || data?.source;
        await apiClient.post(`/api/admin/vpa/crawl/${src}/stop`);
      } else if (kind === 'export') {
        try {
          await apiClient.post(`/api/admin/vpa/plates/export/jobs/${runId}/cancel`);
        } catch { /* ignored */ }
        unregisterExportJob(runId);
        qc.invalidateQueries({ queryKey: ['admin-vpa', 'export-job', runId] });
      }
      onRefresh?.();
    } catch (err) {
      alert('Không thể hủy tiến trình: ' + (err.message || 'Lỗi'));
      if (kind === 'export') unregisterExportJob(runId);
      if (kind === 'approve') unregisterApproveRun(runId);
    } finally {
      setCancelling(false);
    }
  };

  // 4. Xử lý Gỡ / Tải về
  const handleDismiss = () => {
    if (kind === 'approve') unregisterApproveRun(runId);
    if (kind === 'export') unregisterExportJob(runId);
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const auth = loadAuth();
      const token = auth?.accessToken;
      const downloadUrl = `${import.meta.env.VITE_API_URL || ''}/api/admin/vpa/plates/export/jobs/${runId}/download`;

      const res = await fetch(downloadUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`Máy chủ phản hồi mã ${res.status}`);
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', data?.fileName || 'du-lieu.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch (err) {
      alert('Không thể tải file: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: isRunning ? '#ffffff' : '#f8fafc',
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Icon size={15} color={iconColor} style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--text-strong, #1e293b)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </span>
          {pct != null && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isRunning ? '#0284c7' : '#16a34a',
                background: isRunning ? '#e0f2fe' : '#dcfce7',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {pct}%
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {kind === 'export' && status === 'completed' && (
            <button
              type="button"
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 4,
                border: 'none',
                background: '#107c41',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={12} />
              <span>Tải về</span>
            </button>
          )}

          {isRunning ? (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              title="Hủy tiến trình đang chạy"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 7px',
                borderRadius: 4,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#dc2626',
                fontSize: '11px',
                fontWeight: 600,
                cursor: cancelling ? 'not-allowed' : 'pointer',
              }}
            >
              {cancelling ? <Loader2 size={11} style={{ animation: 'adminRunWatcherSpin 1s linear infinite' }} /> : <Ban size={11} />}
              <span>Hủy</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDismiss}
              title="Đóng thông báo"
              style={{
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 3,
                borderRadius: 4,
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 6, borderRadius: 3, background: 'var(--grey-200, #e2e8f0)', overflow: 'hidden' }}>
        {pct == null ? (
          <div
            style={{
              width: '35%',
              height: '100%',
              background: iconColor,
              borderRadius: 3,
              animation: 'adminRunWatcherIndeterminate 1.2s ease-in-out infinite',
            }}
          />
        ) : (
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: status === 'completed' ? '#16a34a' : (status === 'error' ? '#ef4444' : iconColor),
              transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}
      </div>

      {/* Detail Text */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>{text}</span>
        {data?.fileName && (
          <span style={{ fontSize: '10px', color: '#94a3b8', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.fileName}
          </span>
        )}
      </div>

      <style>{'@keyframes adminRunWatcherIndeterminate { 0% { margin-left: 0%; } 50% { margin-left: 65%; } 100% { margin-left: 0%; } }'}</style>
    </div>
  );
}
